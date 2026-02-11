import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Settings } from './settingsStore';
import { playNotificationSound } from '../utils/sound';
import { sendPhaseNotification } from '../utils/notifications';
import { saveHistory, clearAllData } from '../utils/storage';
import { Phase, TimerStatus, HistoryEntry } from '../types';

interface TimerStore {
  currentPhase: Phase;
  timeLeft: number;
  status: TimerStatus;
  currentRound: number;
  totalRounds: number;
  history: HistoryEntry[];

  startTimer: () => void;
  pauseTimer: () => void;
  stopTimer: (settings: Settings) => void;
  skipPhase: (settings: Settings) => void;
  setTimeLeft: (time: number) => void;
  completePhase: (settings: Settings) => void;
  nextPhase: (settings: Settings) => void;
  addHistoryEntry: (entry: HistoryEntry) => Promise<void>;
  clearHistory: () => Promise<void>;
  resetCycle: (settings: Settings) => void;
  initializeTimer: (settings: Settings) => void;
  loadHistory: (history: HistoryEntry[]) => void;
  deleteHistoryEntry: (id: string) => Promise<void>;
  resetAllData: () => Promise<void>;
}

export const useTimerStore = create<TimerStore>((set, get) => ({
  currentPhase: 'focus',
  timeLeft: 25 * 60, // 25 minutes in seconds
  status: 'idle',
  currentRound: 1,
  totalRounds: 4,
  history: [],

  startTimer: () => set({ status: 'running' }),

  pauseTimer: () => set({ status: 'paused' }),

  stopTimer: (settings: Settings) => {
    const state = get();
    if (state.status === 'running' || state.status === 'paused') {
      const entry: HistoryEntry = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        phase: state.currentPhase,
        durationMinutes: getDurationForPhase(state.currentPhase, settings),
        status: 'stopped',
      };
      set({
        status: 'idle',
        timeLeft: getDurationForPhase(state.currentPhase, settings) * 60,
      });
      get().addHistoryEntry(entry);
    }
  },

  skipPhase: (settings: Settings) => {
    const state = get();
    const entry: HistoryEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      phase: state.currentPhase,
      durationMinutes: getDurationForPhase(state.currentPhase, settings),
      status: 'skipped',
    };
    get().addHistoryEntry(entry);
    get().nextPhase(settings);
  },

  setTimeLeft: (time) => set({ timeLeft: time }),

  completePhase: (settings: Settings) => {
    const state = get();
    const entry: HistoryEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      phase: state.currentPhase,
      durationMinutes: getDurationForPhase(state.currentPhase, settings),
      status: 'completed',
    };

    // Play sound and send notification
    playNotificationSound(settings.soundEnabled);
    sendPhaseNotification(state.currentPhase, settings.notificationsEnabled);

    get().addHistoryEntry(entry);
    get().nextPhase(settings);
  },

  nextPhase: (settings: Settings) => {
    const state = get();
    let nextPhase: Phase;
    let nextRound = state.currentRound;

    if (state.currentPhase === 'focus') {
      if (state.currentRound >= settings.roundsBeforeLongBreak) {
        nextPhase = 'longBreak';
      } else {
        nextPhase = 'shortBreak';
      }
    } else if (state.currentPhase === 'shortBreak') {
      nextPhase = 'focus';
      nextRound = state.currentRound + 1;
    } else {
      // longBreak
      nextPhase = 'focus';
      nextRound = 1;
    }

    set({
      currentPhase: nextPhase,
      timeLeft: getDurationForPhase(nextPhase, settings) * 60,
      status: 'idle',
      currentRound: nextRound,
      totalRounds: settings.roundsBeforeLongBreak,
    });
  },

  addHistoryEntry: async (entry) => {
    const newHistory = [entry, ...get().history];
    set({ history: newHistory });
    try {
      await saveHistory(newHistory);
    } catch (error) {
      console.error('Failed to save history:', error);
    }
  },

  clearHistory: async () => {
    set({ history: [] });
    try {
      await saveHistory([]);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  },


  resetCycle: (settings: Settings) =>
    set({
      currentPhase: 'focus',
      timeLeft: settings.focusDuration * 60,
      status: 'idle',
      currentRound: 1,
      totalRounds: settings.roundsBeforeLongBreak,
    }),

  initializeTimer: (settings: Settings) =>
    set({
      timeLeft: settings.focusDuration * 60,
      totalRounds: settings.roundsBeforeLongBreak,
    }),

  loadHistory: (history) => set({ history }),

  deleteHistoryEntry: async (id) => {
    const currentHistory = get().history;
    const entryExists = currentHistory.some(e => e.id === id);
    
    if (!entryExists) {
      console.error('Entry not found in current history:', id);
      return;
    }
    
    const newHistory = currentHistory.filter((entry) => entry.id !== id);
    set({ history: newHistory });
    
    try {
      await saveHistory(newHistory);
    } catch (error) {
      console.error('Failed to save history after deletion:', error);
    }
  },

  resetAllData: async () => {
    set({ history: [], status: 'idle', currentPhase: 'focus', currentRound: 1 });
    try {
      await clearAllData();
    } catch (error) {
      console.error('Failed to reset all data:', error);
    }
  },
}));

function getDurationForPhase(phase: Phase, settings: Settings): number {
  switch (phase) {
    case 'focus':
      return settings.focusDuration;
    case 'shortBreak':
      return settings.shortBreakDuration;
    case 'longBreak':
      return settings.longBreakDuration;
    default:
      return settings.focusDuration;
  }
}