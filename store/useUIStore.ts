
import { create } from 'zustand';
import { UIState, AppTab, PendingToolConfirm } from '../types';

interface ExtendedUIState extends UIState {
  isInterrupting: boolean;
  isUserTalking: boolean;
  isPlayingNarrative: boolean;
  
  setInterrupting: (val: boolean) => void;
  setUserTalking: (val: boolean) => void;
  setPlayingNarrative: (val: boolean) => void;
}

export const useUIStore = create<ExtendedUIState>((set) => ({
  activeTab: 'home',
  isRecording: false,
  isThinking: false,
  isSpeaking: false,
  isConnecting: false,
  isInterrupting: false,
  isUserTalking: false,
  isPlayingNarrative: false,
  showTranscript: false,
  showVision: false,
  captions: { user: '', ai: '' },
  rewardNotify: null,
  pendingToolConfirm: null,

  setActiveTab: (tab: AppTab) => set({ activeTab: tab }),
  setRecording: (val: boolean) => set({ isRecording: val }),
  setThinking: (val: boolean) => set({ isThinking: val }),
  setSpeaking: (val: boolean) => set({ isSpeaking: val }),
  setConnecting: (val: boolean) => set({ isConnecting: val }),
  setInterrupting: (val: boolean) => set({ isInterrupting: val }),
  setUserTalking: (val: boolean) => set({ isUserTalking: val }),
  setPlayingNarrative: (val: boolean) => set({ isPlayingNarrative: val }),
  setShowTranscript: (val: boolean) => set({ showTranscript: val }),
  setShowVision: (val: boolean) => set({ showVision: val }),
  setCaptions: (captions) => set({ captions }),
  setRewardNotify: (val) => set({ rewardNotify: val }),
  setPendingToolConfirm: (val: PendingToolConfirm | null) => set({ pendingToolConfirm: val }),
}));
