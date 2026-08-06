import { AudioGraph } from '../audioGraph';
import { conversationState } from './conversationState';

/**
 * Mic capture + PCM buffering. Wraps AudioGraph input.
 */
class AudioInputStream {
  private buffers: Float32Array[] = [];
  private bufferSize = 0;
  private readonly maxSamples = 2048;
  private active = false;
  private onPcmReady: ((base64Pcm: string) => void) | null = null;
  private shouldSend: (() => boolean) | null = null;

  async start(
    onPcmReady: (base64Pcm: string) => void,
    shouldSend: () => boolean = () => true,
  ): Promise<void> {
    this.stop();
    this.onPcmReady = onPcmReady;
    this.shouldSend = shouldSend;
    this.active = true;

    const graph = AudioGraph.getInstance();
    graph.onTalkingStateChange = (isTalking) => {
      conversationState.setUserTalking(isTalking);
    };

    await graph.startInput((chunk, isUserTalking) => {
      if (!this.active || !this.shouldSend?.()) return;

      if (!isUserTalking) {
        this.clearBuffer();
        return;
      }

      conversationState.setPlayingNarrative(false);

      this.buffers.push(chunk);
      this.bufferSize += chunk.length;

      if (this.bufferSize >= this.maxSamples) {
        this.flushBufferToPcm();
      }
    });
  }

  private flushBufferToPcm() {
    if (this.bufferSize === 0 || !this.onPcmReady) return;

    const combined = new Float32Array(this.bufferSize);
    let offset = 0;
    for (const buf of this.buffers) {
      combined.set(buf, offset);
      offset += buf.length;
    }
    this.clearBuffer();

    const int16 = new Int16Array(combined.length);
    for (let i = 0; i < combined.length; i++) {
      const s = Math.max(-1, Math.min(1, combined[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    const bytes = new Uint8Array(int16.buffer);
    this.onPcmReady(encodePcmBase64(bytes));
  }

  clearBuffer() {
    this.buffers = [];
    this.bufferSize = 0;
  }

  stop() {
    this.active = false;
    this.clearBuffer();
    this.onPcmReady = null;
    this.shouldSend = null;
    const graph = AudioGraph.getInstance();
    graph.onTalkingStateChange = null;
    graph.stopInput();
  }
}

function encodePcmBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export const audioInputStream = new AudioInputStream();
