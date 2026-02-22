import { create } from 'zustand';
import { saveSettings } from '../utils/storage';

export interface Settings {
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  roundsBeforeLongBreak: number;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  alwaysOnTop: boolean;
  debugPanelEnabled: boolean;
  keepCompletedAcrossPhases: boolean;
  historyPanelVisible: boolean;
  leftPanelWidth: number;
}

interface SettingsStore {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  loadSettings: (settings: Settings) => void;
}

export const defaultSettings: Settings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  roundsBeforeLongBreak: 4,
  soundEnabled: true,
  notificationsEnabled: true,
  alwaysOnTop: false,
  debugPanelEnabled: false,
  keepCompletedAcrossPhases: false,
  historyPanelVisible: true,
  leftPanelWidth: 0.5,
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: defaultSettings,
  updateSettings: async (newSettings) => {
    const updatedSettings = { ...get().settings, ...newSettings };
    set({ settings: updatedSettings });
    try {
      await saveSettings(updatedSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
      // Optionally, you could show a user notification here
    }
  },
  loadSettings: (settings) => set({ settings: { ...defaultSettings, ...settings } }),
  resetSettings: async () => {
    set({ settings: defaultSettings });
    try {
      await saveSettings(defaultSettings);
    } catch (error) {
      console.error('Failed to reset settings:', error);
    }
  },
}));