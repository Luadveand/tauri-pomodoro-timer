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
  keepCompletedAcrossPhases: boolean;
  historyPanelVisible: boolean;
  notesPanelVisible: boolean;
  leftPanelWidth: number;
  settingsMode: boolean;
}

interface PreSettingsLayoutState {
  historyPanelVisible: boolean;
  notesPanelVisible: boolean;
  leftPanelWidth: number;
}

interface SettingsStore {
  settings: Settings;
  preSettingsLayoutState: PreSettingsLayoutState | null;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  loadSettings: (settings: Settings) => void;
  enterSettingsMode: () => Promise<void>;
  exitSettingsMode: () => Promise<void>;
}

export const defaultSettings: Settings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  roundsBeforeLongBreak: 4,
  soundEnabled: true,
  notificationsEnabled: true,
  alwaysOnTop: false,
  keepCompletedAcrossPhases: false,
  historyPanelVisible: true,
  notesPanelVisible: true,
  leftPanelWidth: 0.8,
  settingsMode: false,
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: defaultSettings,
  preSettingsLayoutState: null,
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
  enterSettingsMode: async () => {
    const currentSettings = get().settings;
    
    // Capture current layout state before entering settings mode
    const layoutState: PreSettingsLayoutState = {
      historyPanelVisible: currentSettings.historyPanelVisible,
      notesPanelVisible: currentSettings.notesPanelVisible,
      leftPanelWidth: currentSettings.leftPanelWidth
    };
    
    set({ preSettingsLayoutState: layoutState });
    
    // Enter settings mode
    const updatedSettings = { ...currentSettings, settingsMode: true };
    set({ settings: updatedSettings });
    try {
      await saveSettings(updatedSettings);
    } catch (error) {
      console.error('Failed to save settings while entering settings mode:', error);
    }
  },
  exitSettingsMode: async () => {
    const { settings, preSettingsLayoutState } = get();
    
    // Restore previous layout state if available
    let restoredSettings = { ...settings, settingsMode: false };
    if (preSettingsLayoutState) {
      restoredSettings = {
        ...restoredSettings,
        historyPanelVisible: preSettingsLayoutState.historyPanelVisible,
        notesPanelVisible: preSettingsLayoutState.notesPanelVisible,
        leftPanelWidth: preSettingsLayoutState.leftPanelWidth
      };
    }
    
    set({ 
      settings: restoredSettings,
      preSettingsLayoutState: null // Clear the stored state
    });
    
    try {
      await saveSettings(restoredSettings);
    } catch (error) {
      console.error('Failed to save settings while exiting settings mode:', error);
    }
  },
}));