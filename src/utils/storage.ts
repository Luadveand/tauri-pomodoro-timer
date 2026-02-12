import { Settings } from '../stores/settingsStore';
import { HistoryEntry } from '../types';

let store: any = null;
let isInBrowser = false;

// Check if we're in browser mode (not Tauri)
const isTauriApp = () => {
  return typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined;
};

// Browser localStorage fallback
class BrowserStore {
  private prefix = 'pomodoro_';

  async get<T>(key: string): Promise<T | null> {
    try {
      const item = localStorage.getItem(this.prefix + key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: any): Promise<void> {
    localStorage.setItem(this.prefix + key, JSON.stringify(value));
  }

  async save(): Promise<void> {
    // No-op for localStorage
  }

  async clear(): Promise<void> {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(this.prefix));
    keys.forEach(k => localStorage.removeItem(k));
  }

  async keys(): Promise<string[]> {
    return Object.keys(localStorage)
      .filter(k => k.startsWith(this.prefix))
      .map(k => k.replace(this.prefix, ''));
  }
}

const getStore = async (): Promise<any> => {
  if (!store) {
    if (isTauriApp()) {
      try {
        const { Store } = await import('@tauri-apps/plugin-store');
        const storePath = 'settings.dat';
        store = await Store.load(storePath);
        isInBrowser = false;
      } catch (error) {
        console.log('Tauri store failed, falling back to localStorage:', error);
        store = new BrowserStore();
        isInBrowser = true;
      }
    } else {
      console.log('Running in browser mode, using localStorage');
      store = new BrowserStore();
      isInBrowser = true;
    }
  }
  return store;
};

export interface AppData {
  settings: Settings;
  history: HistoryEntry[];
  activeNotes: string;
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
    debugPanelEnabled: false,
    keepCompletedAcrossPhases: false,
  },
  history: [],
  activeNotes: '',
};

export const loadAppData = async (): Promise<AppData> => {
  try {
    const storeInstance = await getStore();
    const settings = await storeInstance.get<Settings>('settings');
    const history = await storeInstance.get<HistoryEntry[]>('history');
    const activeNotes = await storeInstance.get<string>('activeNotes');

    return {
      settings: settings || defaultData.settings,
      history: history || defaultData.history,
      activeNotes: activeNotes || defaultData.activeNotes,
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
    throw error; // Re-throw to allow callers to handle the error
  }
};

export const saveHistory = async (history: HistoryEntry[]): Promise<void> => {
  try {
    const storeInstance = await getStore();
    await storeInstance.set('history', history);
    await storeInstance.save();
  } catch (error) {
    console.error('[Storage] Error saving history:', error);
    throw error; // Re-throw to allow callers to handle the error
  }
};

export const saveActiveNotes = async (activeNotes: string): Promise<void> => {
  try {
    const storeInstance = await getStore();
    await storeInstance.set('activeNotes', activeNotes);
    await storeInstance.save();
  } catch (error) {
    console.error('[Storage] Error saving active notes:', error);
    throw error;
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

export const clearAllData = async (): Promise<void> => {
  try {
    const storeInstance = await getStore();
    await storeInstance.clear();
    await storeInstance.save();
  } catch (error) {
    console.error('Error clearing all data:', error);
    throw error;
  }
};


// Debug function to test store functionality
export const testStore = async (): Promise<void> => {
  try {
    const storeInstance = await getStore();

    // Test setting a value
    await storeInstance.set('test', 'hello world');

    // Test saving
    await storeInstance.save();

    // Test getting the value
    const value = await storeInstance.get('test');

    // Test getting all keys
    const keys = await storeInstance.keys();

    console.log(`✅ Store test passed (${isInBrowser ? 'localStorage' : 'Tauri'})`, { value, keys });
  } catch (error) {
    console.error('=== STORE TEST FAILED ===', error);
  }
};

// Make it available globally for testing
if (typeof window !== 'undefined') {
  (window as any).testStore = testStore;
}