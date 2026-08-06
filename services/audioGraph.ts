
import { decodeBase64, decodeAudioData } from '../utils/helpers';

/**
 * AudioWorklet Code (Inline)
 * ارتقا یافته برای فاز ۲: قابلیت دریافت پیام برای تغییر آستانه (Threshold) به صورت زنده.
 */
const AUDIO_WORKLET_CODE = `
class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.threshold = 0.012; // آستانه پیش‌فرض (حالت شنیدن)
    this.silenceTimeout = 60; 
    this.silenceCounter = 0;
    this.isTalking = false;
    this.preRollBuffer = []; 
    this.maxPreRoll = 6; 

    // دریافت پیام از ترد اصلی برای تغییر تنظیمات
    this.port.onmessage = (event) => {
      if (event.data.type === 'SET_THRESHOLD') {
        this.threshold = event.data.value;
      }
    };
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;
    
    const channelData = input[0];
    let sum = 0;
    for (let i = 0; i < channelData.length; i++) {
      sum += channelData[i] * channelData[i];
    }
    const rms = Math.sqrt(sum / channelData.length);

    if (rms > this.threshold) {
      if (!this.isTalking) {
        this.isTalking = true;
        while (this.preRollBuffer.length > 0) {
          this.port.postMessage({ audio: this.preRollBuffer.shift(), isTalking: true });
        }
      }
      this.silenceCounter = 0;
      this.port.postMessage({ audio: channelData, isTalking: true, energy: rms });
    } else {
      if (this.isTalking) {
        this.silenceCounter++;
        if (this.silenceCounter > this.silenceTimeout) {
          this.isTalking = false;
          this.port.postMessage({ isTalking: false });
        } else {
          this.port.postMessage({ audio: channelData, isTalking: true, energy: rms });
        }
      } else {
        this.preRollBuffer.push(new Float32Array(channelData));
        if (this.preRollBuffer.length > this.maxPreRoll) this.preRollBuffer.shift();
        this.port.postMessage({ isTalking: false, energy: rms });
      }
    }
    return true;
  }
}
registerProcessor('audio-processor', AudioProcessor);
`;

// تنظیمات آستانه صدا
const VAD_THRESHOLDS = {
  DEFAULT: 0.012, // حساسیت بالا (محیط ساکت/عادی)
  PROTECTED: 0.05 // حساسیت پایین (هنگام پخش روایت برای جلوگیری از اکو)
};

export class AudioGraph {
  private static instance: AudioGraph;
  
  // لایه Live (Gemini)
  private outputCtx: AudioContext | null = null;
  private inputCtx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private nextStartTime: number = 0;
  private scheduledSources: Set<AudioBufferSourceNode> = new Set();
  
  // لایه Input (Microphone)
  private workletNode: AudioWorkletNode | null = null;
  private micStream: MediaStream | null = null;
  private workletUrl: string | null = null;
  private isInputMuted: boolean = false; // گارد نرم‌افزاری برای نادیده گرفتن ورودی

  // لایه Static (Narratives) - جدید در فاز ۲
  private staticSource: AudioBufferSourceNode | null = null;
  private staticGainNode: GainNode | null = null;
  
  public onPlayStateChange: ((isPlaying: boolean) => void) | null = null;
  public onTalkingStateChange: ((isTalking: boolean) => void) | null = null;
  public onNarrativeStop: (() => void) | null = null; // کالبک اتمام فایل
  
  private constructor() {}

  static getInstance(): AudioGraph {
    if (!AudioGraph.instance) {
      AudioGraph.instance = new AudioGraph();
    }
    return AudioGraph.instance;
  }

  static haptic(pattern: number | number[]) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(pattern); } catch (e) {}
    }
  }

  // ==========================================
  // بخش ۱: مدیریت خروجی (Output Management)
  // ==========================================

  async initOutput(): Promise<void> {
    if (!this.outputCtx) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      this.outputCtx = new Ctx({ latencyHint: 'interactive', sampleRate: 24000 });
      this.gainNode = this.outputCtx.createGain();
      this.gainNode.connect(this.outputCtx.destination);

      // نود اختصاصی برای فایل‌های استاتیک با ولوم کنترل جداگانه
      this.staticGainNode = this.outputCtx.createGain();
      this.staticGainNode.connect(this.outputCtx.destination);
    }
    
    if (this.outputCtx.state !== 'running') {
      try { await this.outputCtx.resume(); } catch (e) {}
    }
  }

  // پخش استریم زنده (چانک‌های جمینی)
  // نکته: برای Live از hard-mute استفاده نمی‌کنیم تا barge-in ممکن باشد؛
  // فقط آستانه VAD بالا می‌رود تا اکو کمتر شود.
  async playChunk(base64Audio: string): Promise<void> {
    await this.initOutput();
    if (!this.outputCtx || !this.gainNode) return;

    // اگر فایلی در حال پخش است، آن را قطع کن (اولویت با صدای زنده است)
    this.stopStaticFile();

    this.setVadThreshold(VAD_THRESHOLDS.PROTECTED);

    try {
      const bytes = decodeBase64(base64Audio);
      const buffer = await decodeAudioData(bytes, this.outputCtx, 24000, 1);
      
      const source = this.outputCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.gainNode);

      this.nextStartTime = Math.max(this.nextStartTime, this.outputCtx.currentTime);
      source.start(this.nextStartTime);
      this.nextStartTime += buffer.duration;
      
      this.scheduledSources.add(source);
      if (this.onPlayStateChange) this.onPlayStateChange(true);

      source.onended = () => {
        this.scheduledSources.delete(source);
        if (this.scheduledSources.size === 0) {
          this.setVadThreshold(VAD_THRESHOLDS.DEFAULT);
          if (this.onPlayStateChange) this.onPlayStateChange(false);
        }
      };
    } catch (e) {
      console.error("AudioGraph Live Playback Error:", e);
      if (this.scheduledSources.size === 0) {
        this.setVadThreshold(VAD_THRESHOLDS.DEFAULT);
      }
    }
  }

  // پخش فایل استاتیک (روایت‌ها) - جدید فاز ۲
  async playStaticFile(url: string): Promise<void> {
    await this.initOutput();
    if (!this.outputCtx || !this.staticGainNode) return;

    // توقف فایل قبلی اگر وجود دارد
    this.stopStaticFile();
    
    // فعال کردن گارد ورودی: وقتی قصه پخش می‌شود، گوش‌ها کر می‌شوند
    this.isInputMuted = true;

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.outputCtx.decodeAudioData(arrayBuffer);

      const source = this.outputCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.staticGainNode);

      this.staticSource = source;

      // ⚠️ محافظت VAD: افزایش آستانه نویز (هرچند با isInputMuted عملاً نادیده گرفته می‌شود)
      this.setVadThreshold(VAD_THRESHOLDS.PROTECTED);

      source.start();

      source.onended = () => {
        // بازگشت به حالت حساس و باز کردن گوش‌ها
        this.isInputMuted = false;
        this.setVadThreshold(VAD_THRESHOLDS.DEFAULT);
        this.staticSource = null;
        if (this.onNarrativeStop) this.onNarrativeStop();
      };

    } catch (e) {
      console.error("AudioGraph Static Playback Error:", e);
      this.isInputMuted = false;
      this.setVadThreshold(VAD_THRESHOLDS.DEFAULT); // اطمینان از بازگشت تنظیمات در صورت خطا
    }
  }

  // توقف فایل استاتیک
  stopStaticFile() {
    if (this.staticSource) {
      try {
        // Fade Out سریع برای توقف نرم‌تر
        if (this.staticGainNode && this.outputCtx) {
             const currTime = this.outputCtx.currentTime;
             this.staticGainNode.gain.setValueAtTime(this.staticGainNode.gain.value, currTime);
             this.staticGainNode.gain.exponentialRampToValueAtTime(0.001, currTime + 0.1);
        }
        this.staticSource.stop(this.outputCtx!.currentTime + 0.1);
        this.staticSource.disconnect();
      } catch (e) { 
        // منبع ممکن است قبلا متوقف شده باشد 
      }
      this.staticSource = null;
      
      // بازیابی ولوم برای پخش بعدی
      if (this.staticGainNode && this.outputCtx) {
          setTimeout(() => {
              this.staticGainNode!.gain.value = 1.0;
          }, 200);
      }

      // بازگشت به تنظیمات عادی
      this.isInputMuted = false;
      this.setVadThreshold(VAD_THRESHOLDS.DEFAULT);
      
      if (this.onNarrativeStop) this.onNarrativeStop();
    }
  }

  // ==========================================
  // بخش ۲: افکت‌های صوتی (SFX)
  // ==========================================

  async playCoinSound() {
    await this.initOutput();
    if (!this.outputCtx) return;
    const start = this.outputCtx.currentTime + 0.02;
    const osc = this.outputCtx.createOscillator();
    const g = this.outputCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, start);
    osc.frequency.exponentialRampToValueAtTime(1500, start + 0.1);
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(0.3, start + 0.05);
    g.gain.exponentialRampToValueAtTime(0.01, start + 0.4);
    osc.connect(g);
    g.connect(this.outputCtx.destination);
    osc.start(start);
    osc.stop(start + 0.4);
  }

  async playTickSound() {
    await this.initOutput();
    if (!this.outputCtx) return;
    const start = this.outputCtx.currentTime + 0.02;
    const osc = this.outputCtx.createOscillator();
    const g = this.outputCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, start);
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(0.1, start + 0.01);
    g.gain.linearRampToValueAtTime(0, start + 0.05);
    osc.connect(g);
    g.connect(this.outputCtx.destination);
    osc.start(start);
    osc.stop(start + 0.05);
  }

  // ==========================================
  // بخش ۳: ورودی و پردازش (Input Processing)
  // ==========================================

  // ارسال فرمان به Worklet برای تغییر آستانه
  private setVadThreshold(value: number) {
    if (this.workletNode) {
      this.workletNode.port.postMessage({ type: 'SET_THRESHOLD', value });
      console.log(`[AudioGraph] VAD Threshold set to: ${value}`);
    }
  }

  async startInput(onAudioData: (data: Float32Array, isTalking: boolean) => void): Promise<void> {
    this.stopInput(); 
    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });

      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      this.inputCtx = new Ctx({ sampleRate: 16000 });
      
      if (this.workletUrl) URL.revokeObjectURL(this.workletUrl);
      const blob = new Blob([AUDIO_WORKLET_CODE], { type: 'application/javascript' });
      this.workletUrl = URL.createObjectURL(blob);

      await this.inputCtx.audioWorklet.addModule(this.workletUrl);
      
      const source = this.inputCtx.createMediaStreamSource(this.micStream);
      this.workletNode = new AudioWorkletNode(this.inputCtx, 'audio-processor');
      
      // تنظیم آستانه اولیه
      this.setVadThreshold(VAD_THRESHOLDS.DEFAULT);

      this.workletNode.port.onmessage = (e) => {
        // hard-mute فقط برای روایت استاتیک (محافظت اکو) — Live نباید ورودی را بلاک کند
        if (this.isInputMuted) {
          return;
        }

        const isTalking = !!e.data.isTalking;
        const liveWasPlaying = this.scheduledSources.size > 0;

        // Barge-in روی روایت استاتیک
        if (isTalking && this.staticSource) {
          this.stopStaticFile();
        }

        // اول UI/interrupt را باخبر کن (در حالی که هنوز speaking=true است)، بعد صف را خالی کن
        if (this.onTalkingStateChange) {
          this.onTalkingStateChange(isTalking);
        }

        if (isTalking && liveWasPlaying) {
          this.flushLive();
        }

        if (e.data?.audio) {
          onAudioData(e.data.audio, isTalking);
        }
      };

      source.connect(this.workletNode);
      this.workletNode.connect(this.inputCtx.destination);
      if (this.inputCtx.state === 'suspended') await this.inputCtx.resume();
    } catch (e) {
      this.stopInput();
      throw e;
    }
  }

  stopInput() {
    if (this.workletNode) { this.workletNode.disconnect(); this.workletNode = null; }
    if (this.micStream) {
      this.micStream.getTracks().forEach(t => {
        t.stop();
        t.enabled = false;
      });
      this.micStream = null;
    }
    if (this.inputCtx) {
      this.inputCtx.close().catch(() => {});
      this.inputCtx = null;
    }
    if (this.workletUrl) { URL.revokeObjectURL(this.workletUrl); this.workletUrl = null; }
  }

  /** فقط صف پخش Live را خالی می‌کند (برای barge-in) */
  flushLive() {
    this.scheduledSources.forEach(s => {
      try { s.stop(); } catch (e) {}
    });
    this.scheduledSources.clear();

    this.setVadThreshold(VAD_THRESHOLDS.DEFAULT);

    if (this.outputCtx) {
      this.nextStartTime = this.outputCtx.currentTime;
    }
    if (this.onPlayStateChange) this.onPlayStateChange(false);
  }

  flush() {
    this.flushLive();
    this.stopStaticFile();
    this.isInputMuted = false;
  }

  isLivePlaying(): boolean {
    return this.scheduledSources.size > 0;
  }

  stopAll() {
    this.flush();
    this.stopInput();
  }
}
