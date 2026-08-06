import { useCallback, useEffect } from 'react';
import { AudioGraph } from '../services/audioGraph';
import { sessionManager } from '../services/geminiLive/sessionManager';
import { conversationState } from '../services/geminiLive/conversationState';

/**
 * Thin React orchestration layer over services/geminiLive/*.
 * Public API (stable for MagicButton + VisionOverlay):
 *   { connect, disconnect, sendVisionFrame, interrupt }
 */
export const useGeminiLive = () => {
  useEffect(() => {
    const graph = AudioGraph.getInstance();
    graph.onNarrativeStop = () => {
      conversationState.setPlayingNarrative(false);
    };
    return () => {
      graph.onNarrativeStop = null;
    };
  }, []);

  const connect = useCallback(() => {
    void sessionManager.connect();
  }, []);

  const disconnect = useCallback(() => {
    sessionManager.disconnect();
  }, []);

  const sendVisionFrame = useCallback((base64: string) => {
    sessionManager.sendVisionFrame(base64);
  }, []);

  const interrupt = useCallback(() => {
    sessionManager.interrupt();
  }, []);

  return { connect, disconnect, sendVisionFrame, interrupt };
};
