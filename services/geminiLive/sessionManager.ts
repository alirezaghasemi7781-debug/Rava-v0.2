import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { APP_CONFIG } from '../../config';
import { SYSTEM_INSTRUCTION, buildSessionContext, logContextVolume } from '../../prompts';
import { useUserStore } from '../../store/useUserStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import { conversationState } from './conversationState';
import { audioInputStream } from './audioInputStream';
import { audioOutputQueue } from './audioOutputQueue';
import { dispatchToolCalls, LIVE_TOOL_DECLARATIONS } from './toolCallDispatcher';
import { connectionRecovery } from './connectionRecovery';

export type SessionStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting';

const LIVE_MODEL = 'gemini-2.5-flash-native-audio-preview-12-2025';

/**
 * Single-session Gemini Live manager.
 * Connection created once; guards against duplicate sessions and post-disconnect audio.
 */
class SessionManager {
  private status: SessionStatus = 'idle';
  private session: { close: () => void; sendRealtimeInput: (p: unknown) => void; sendToolResponse: (p: unknown) => void } | null = null;
  private sessionPromise: Promise<typeof this.session> | null = null;
  private abortController: AbortController | null = null;
  private intentionalClose = false;
  private disconnecting = false;
  private lastFuelReportTime = 0;
  private connectGeneration = 0;

  getStatus(): SessionStatus {
    return this.status;
  }

  isConnected(): boolean {
    return this.status === 'connected';
  }

  async connect(options?: { fromRecovery?: boolean }): Promise<void> {
    const { wallet } = useUserStore.getState();
    if (wallet.balance <= 0) {
      useUIStore.getState().setActiveTab('profile');
      alert('سوخت راوا تموم شده. از پروفایل می‌تونی شارژ کنی.');
      return;
    }

    // Single-session guard
    if (this.status === 'connecting' || this.status === 'connected') {
      console.debug('[SessionManager] Connect ignored — session already active');
      return;
    }
    if (this.status === 'reconnecting' && !options?.fromRecovery) {
      console.debug('[SessionManager] Connect ignored — recovery in progress');
      return;
    }

    const apiKey = (typeof process !== 'undefined' && (process as any).env?.API_KEY)
      || APP_CONFIG.GOOGLE.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[SessionManager] Missing Gemini API key');
      return;
    }

    this.intentionalClose = false;
    this.disconnecting = false;
    this.status = options?.fromRecovery ? 'reconnecting' : 'connecting';
    conversationState.setConnecting(true);

    const generation = ++this.connectGeneration;
    const abortController = new AbortController();
    this.abortController = abortController;

    audioOutputQueue.stopStaticNarrative();

    const ai = new GoogleGenAI({ apiKey });

    try {
      await audioOutputQueue.init();

      const { cityMode } = useUserStore.getState();
      const { semanticProfile } = useAuthStore.getState();
      const voice = semanticProfile.voice_config;

      const sessionContext = buildSessionContext({
        city: cityMode,
        language: 'fa-IR',
        tripType: semanticProfile.travel_style,
        crewType: semanticProfile.crew_type,
        isTravelingNow: semanticProfile.is_traveling_now,
        voiceName: voice?.voiceName ?? 'Kore',
        speechRate: voice?.speechRate ?? 1,
        semanticHints: semanticProfile,
      });

      const systemInstruction = `${SYSTEM_INSTRUCTION}\n\n${sessionContext}`;
      logContextVolume('SYSTEM_INSTRUCTION', SYSTEM_INSTRUCTION);
      logContextVolume('session_context', sessionContext);
      logContextVolume('handshake_total', systemInstruction);

      conversationState.onBargeIn(() => this.handleBargeIn());

      const sessionPromise = ai.live.connect({
        model: LIVE_MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          tools: [{ functionDeclarations: LIVE_TOOL_DECLARATIONS }],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voice?.voiceName || 'Kore',
              },
            },
          },
          systemInstruction,
        },
        callbacks: {
          onopen: () => {
            if (generation !== this.connectGeneration || this.intentionalClose) return;
            this.status = 'connected';
            this.lastFuelReportTime = Date.now();
            connectionRecovery.markSuccess();
            conversationState.setListening();

            audioInputStream.start(
              (base64Pcm) => {
                if (!this.isConnected() || this.intentionalClose) return;
                this.sessionPromise?.then((session) => {
                  if (!session || this.intentionalClose || !this.isConnected()) return;
                  session.sendRealtimeInput({
                    media: { data: base64Pcm, mimeType: 'audio/pcm;rate=16000' },
                  });
                }).catch(() => {});
              },
              () => this.isConnected() && !this.intentionalClose,
            );
          },
          onmessage: async (message: LiveServerMessage) => {
            if (!this.isConnected() || this.intentionalClose) return;
            await this.handleMessage(message, sessionPromise);
          },
          onclose: () => {
            console.warn('[SessionManager] Session closed');
            this.handleUnexpectedClose(generation);
          },
          onerror: (err: unknown) => {
            console.error('[SessionManager] Session error:', err);
            this.handleUnexpectedClose(generation);
          },
        },
      });

      this.sessionPromise = sessionPromise as Promise<typeof this.session>;
      this.session = (await sessionPromise) as typeof this.session;

      if (generation !== this.connectGeneration || this.intentionalClose) {
        try { this.session?.close(); } catch { /* ignore */ }
        return;
      }
    } catch (err) {
      console.error('[SessionManager] Connection failed:', err);
      conversationState.setConnecting(false);
      this.teardownMediaOnly();
      this.status = 'idle';
      this.session = null;
      this.sessionPromise = null;

      if (!this.intentionalClose && connectionRecovery.canRetry()) {
        this.status = 'reconnecting';
        connectionRecovery.schedule(() => this.connect({ fromRecovery: true }));
      } else {
        conversationState.setIdle();
      }
    }
  }

  private async handleMessage(
    message: LiveServerMessage,
    sessionPromise: Promise<unknown>,
  ) {
    if (message.serverContent?.inputTranscription?.text) {
      conversationState.appendUserCaption(message.serverContent.inputTranscription.text);
    }
    if (message.serverContent?.outputTranscription?.text) {
      conversationState.setThinking(true);
      conversationState.appendAiCaption(message.serverContent.outputTranscription.text);
    }

    if (message.toolCall?.functionCalls?.length) {
      await dispatchToolCalls(message.toolCall.functionCalls, (responses) => {
        if (!this.isConnected() || this.intentionalClose) return;
        sessionPromise.then((s: any) => {
          if (!s || this.intentionalClose || !this.isConnected()) return;
          s.sendToolResponse({ functionResponses: responses });
        }).catch(() => {});
      });
    }

    if (message.serverContent?.interrupted) {
      audioOutputQueue.flush();
    }

    const parts = message.serverContent?.modelTurn?.parts;
    if (parts) {
      for (const part of parts) {
        if (!this.isConnected() || this.intentionalClose) return;
        if (part.inlineData?.data) {
          await audioOutputQueue.playChunk(part.inlineData.data);
        }
      }
    }

    if (message.serverContent?.turnComplete) {
      await conversationState.completeTurn();
    }
  }

  private handleBargeIn() {
    if (!this.isConnected()) return;
    audioOutputQueue.flush();
    this.sessionPromise?.then((session) => {
      if (!session || !this.isConnected()) return;
      try {
        session.sendRealtimeInput({ control: { action: 'interrupt' } } as any);
      } catch (e) {
        console.warn('[SessionManager] Interrupt send failed:', e);
      }
    }).catch(() => {});
  }

  private handleUnexpectedClose(generation: number) {
    if (generation !== this.connectGeneration) return;
    if (this.intentionalClose || this.disconnecting) return;

    console.error('[SessionManager] Unexpected disconnect — attempting recovery without reload');
    this.teardownMediaOnly();
    this.session = null;
    this.sessionPromise = null;
    this.status = 'reconnecting';
    conversationState.setConnecting(true);

    const scheduled = connectionRecovery.schedule(() => this.connect({ fromRecovery: true }));
    if (!scheduled) {
      this.status = 'idle';
      conversationState.setIdle();
      this.settleFuel();
    }
  }

  private teardownMediaOnly() {
    audioInputStream.stop();
    audioOutputQueue.flush();
  }

  private settleFuel() {
    if (this.lastFuelReportTime > 0) {
      const elapsed = (Date.now() - this.lastFuelReportTime) / 1000;
      if (elapsed > 1) {
        useUserStore.getState().deductFuel(elapsed);
      }
      this.lastFuelReportTime = 0;
    }
  }

  disconnect() {
    if (this.status === 'idle' && !this.session && !this.disconnecting) return;
    if (this.disconnecting) return;

    this.disconnecting = true;
    this.intentionalClose = true;
    this.connectGeneration += 1;
    connectionRecovery.reset();

    this.settleFuel();

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    this.teardownMediaOnly();
    audioOutputQueue.stopAll();
    conversationState.onBargeIn(null);

    if (this.session) {
      try { this.session.close(); } catch { /* ignore */ }
      this.session = null;
    }
    this.sessionPromise = null;
    this.status = 'idle';
    conversationState.setIdle();
    this.disconnecting = false;
  }

  sendVisionFrame(base64: string) {
    if (!this.isConnected() || this.intentionalClose) return;
    this.sessionPromise?.then((session) => {
      if (!session || !this.isConnected() || this.intentionalClose) return;
      session.sendRealtimeInput({
        media: { data: base64, mimeType: 'image/jpeg' },
      });
    }).catch(() => {});
  }

  interrupt() {
    this.handleBargeIn();
  }
}

export const sessionManager = new SessionManager();
