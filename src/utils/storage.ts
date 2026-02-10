import { Store } from '@tauri-apps/plugin-store';
import { Settings } from '../stores/settingsStore';
import { HistoryEntry } from '../stores/timerStore';

let store: Store | null = null;

const getStore = async (): Promise<Store> => {
  if (!store) {
    store = await Store.load('.settings.dat');
  }
  return store;
};

export interface AppData {
  settings: Settings;
  history: HistoryEntry[];
}

const defaultData: AppData = {
  settings: {
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    roundsBeforeLongBreak: 4,
    soundEnabled: true,
    notificationsEnabled: true,
    alwaysOnTop: false,
  },
  history: [],
};

export const loadAppData = async (): Promise<AppData> => {
  try {
    const storeInstance = await getStore();
    const settings = await storeInstance.get<Settings>('settings');
    const history = await storeInstance.get<HistoryEntry[]>('history');
    
    return {
      settings: settings || defaultData.settings,
      history: history || defaultData.history,
    };
  } catch (error) {
    console.error('Error loading app data:', error);
    return defaultData;
  }
};

export const saveSettings = async (settings: Settings): Promise<void> => {
  try {
    const storeInstance = await getStore();
    await storeInstance.set('settings', settings);
    await storeInstance.save();
  } catch (error) {
    console.error('Error saving settings:', error);
  }
};

export const saveHistory = async (history: HistoryEntry[]): Promise<void> => {
  try {
    const storeInstance = await getStore();
    await storeInstance.set('history', history);
    await storeInstance.save();
  } catch (error) {
    console.error('Error saving history:', error);
  }
};

export const clearHistory = async (): Promise<void> => {
  try {
    const storeInstance = await getStore();
    await storeInstance.set('history', []);
    await storeInstance.save();
  } catch (error) {
    console.error('Error clearing history:', error);
  }
};