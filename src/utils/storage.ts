import { Store } from '@tauri-apps/plugin-store';
import { Settings } from '../stores/settingsStore';
import { HistoryEntry } from '../stores/timerStore';

let store: Store | null = null;

const getStore = async (): Promise<Store> => {
  if (!store) {
    console.log('Loading Store instance...');
    const storePath = 'settings.dat';
    console.log('Using store path:', storePath);
    try {
      // Use static load method as per API
      store = await Store.load(storePath);
      console.log('Store loaded successfully');
    } catch (error) {
      console.log('Store load failed (this is normal for first run):', error);
      // If load fails, we might need to create it differently
      throw error;
    }
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
    console.log('Loading app data from store...');
    const storeInstance = await getStore();
    const settings = await storeInstance.get<Settings>('settings');
    const history = await storeInstance.get<HistoryEntry[]>('history');
    
    console.log('Loaded settings:', settings);
    console.log('Loaded history length:', history?.length || 0);
    
    return {
      settings: settings || defaultData.settings,
      history: history || defaultData.history,
    };
  } catch (error) {
    console.error('Error loading app data:', error);
    console.log('Using default data due to error');
    return defaultData;
  }
};

export const saveSettings = async (settings: Settings): Promise<void> => {
  try {
    console.log('Saving settings:', settings);
    const storeInstance = await getStore();
    await storeInstance.set('settings', settings);
    await storeInstance.save();
    console.log('Settings saved successfully');
  } catch (error) {
    console.error('Error saving settings:', error);
    throw error; // Re-throw to allow callers to handle the error
  }
};

export const saveHistory = async (history: HistoryEntry[]): Promise<void> => {
  try {
    console.log('Saving history, length:', history.length);
    const storeInstance = await getStore();
    await storeInstance.set('history', history);
    await storeInstance.save();
    console.log('History saved successfully');
  } catch (error) {
    console.error('Error saving history:', error);
    throw error; // Re-throw to allow callers to handle the error
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

// Debug function to test store functionality
export const testStore = async (): Promise<void> => {
  console.log('=== TESTING STORE FUNCTIONALITY ===');
  try {
    // Test direct Store.load() first
    console.log('Attempting to load store directly...');
    const storeInstance = await Store.load('test-store.dat');
    console.log('Store instance created successfully');
    
    // Test setting a value
    await storeInstance.set('test', 'hello world');
    console.log('Test value set');
    
    // Test saving
    await storeInstance.save();
    console.log('Store saved successfully');
    
    // Test getting the value
    const value = await storeInstance.get('test');
    console.log('Retrieved test value:', value);
    
    // Test getting all keys
    const keys = await storeInstance.keys();
    console.log('All store keys:', keys);
    
    console.log('=== STORE TEST COMPLETED SUCCESSFULLY ===');
  } catch (error) {
    console.error('=== STORE TEST FAILED ===', error);
    console.log('This indicates the Store plugin may not be properly configured');
  }
};

// Make it available globally for testing
if (typeof window !== 'undefined') {
  (window as any).testStore = testStore;
}