import { AudioGraph } from '../audioGraph';
import { conversationState } from './conversationState';

/**
 * Play Live audio chunks; flush on interrupt / barge-in.
 */
class AudioOutputQueue {
  private wired = false;

  private ensureWired() {
    if (this.wired) return;
    const graph = AudioGraph.getInstance();
    graph.onPlayStateChange = (isPlaying) => {
      conversationState.setSpeaking(isPlaying);
    };
    this.wired = true;
  }

  async init(): Promise<void> {
    this.ensureWired();
    await AudioGraph.getInstance().initOutput();
  }

  async playChunk(base64Audio: string): Promise<void> {
    this.ensureWired();
    conversationState.setThinking(false);
    conversationState.setSpeaking(true);
    await AudioGraph.getInstance().playChunk(base64Audio);
  }

  /** Immediate clear of Live queue (barge-in / interrupt). */
  flush() {
    AudioGraph.getInstance().flushLive();
    conversationState.setSpeaking(false);
  }

  stopAll() {
    AudioGraph.getInstance().stopAll();
    conversationState.setSpeaking(false);
    conversationState.setPlayingNarrative(false);
  }

  stopStaticNarrative() {
    AudioGraph.getInstance().stopStaticFile();
    conversationState.setPlayingNarrative(false);
  }
}

export const audioOutputQueue = new AudioOutputQueue();
