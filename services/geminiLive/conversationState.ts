import { useUIStore } from '../../store/useUIStore';
import { chatLogger } from '../ai/chatLogger';
import { useMapStore } from '../../store/useMapStore';

export type ConversationPhase = 'idle' | 'listening' | 'thinking' | 'speaking';

/**
 * Listening / Thinking / Speaking + captions + turn logging.
 * Reads/writes UI store so MagicButton and VisionOverlay stay in sync.
 */
class ConversationState {
  private phase: ConversationPhase = 'idle';
  private turn = { user: '', ai: '' };
  private bargeInHandler: (() => void) | null = null;

  onBargeIn(handler: (() => void) | null) {
    this.bargeInHandler = handler;
  }

  getPhase(): ConversationPhase {
    return this.phase;
  }

  isSpeaking(): boolean {
    return this.phase === 'speaking' || useUIStore.getState().isSpeaking;
  }

  setIdle() {
    this.phase = 'idle';
    const ui = useUIStore.getState();
    ui.setRecording(false);
    ui.setConnecting(false);
    ui.setSpeaking(false);
    ui.setThinking(false);
    ui.setUserTalking(false);
    ui.setCaptions({ user: '', ai: '' });
    this.turn = { user: '', ai: '' };
  }

  setConnecting(val: boolean) {
    useUIStore.getState().setConnecting(val);
  }

  setListening() {
    this.phase = 'listening';
    const ui = useUIStore.getState();
    ui.setConnecting(false);
    ui.setRecording(true);
    ui.setThinking(false);
    // keep speaking as-is until audio ends
  }

  setThinking(val = true) {
    if (val) this.phase = 'thinking';
    useUIStore.getState().setThinking(val);
  }

  setSpeaking(val: boolean) {
    this.phase = val ? 'speaking' : (useUIStore.getState().isRecording ? 'listening' : 'idle');
    const ui = useUIStore.getState();
    ui.setSpeaking(val);
    if (val) ui.setThinking(false);
  }

  setUserTalking(val: boolean) {
    const ui = useUIStore.getState();
    ui.setUserTalking(val);
    if (val) {
      ui.setPlayingNarrative(false);
      if (this.isSpeaking() && this.bargeInHandler) {
        this.bargeInHandler();
      }
    }
  }

  setPlayingNarrative(val: boolean) {
    useUIStore.getState().setPlayingNarrative(val);
  }

  appendUserCaption(text: string) {
    this.turn.user = text;
    useUIStore.getState().setCaptions({ user: this.turn.user, ai: this.turn.ai });
  }

  appendAiCaption(text: string) {
    this.turn.ai += text;
    useUIStore.getState().setCaptions({ user: this.turn.user, ai: this.turn.ai });
  }

  async completeTurn() {
    this.setThinking(false);
    const { user, ai } = this.turn;
    if (user || ai) {
      const location = useMapStore.getState().userLocation;
      chatLogger.logTurn('user', user, { location });
      chatLogger.logTurn('model', ai, { location });
    }
    this.turn = { user: '', ai: '' };
    if (useUIStore.getState().isRecording && !useUIStore.getState().isSpeaking) {
      this.phase = 'listening';
    }
  }
}

export const conversationState = new ConversationState();
