import { create } from 'zustand';
import { ThemeDefinition } from '../themes/types';
import { saveCustomThemes } from '../utils/storage';

interface ThemeStore {
  customThemes: ThemeDefinition[];
  loadCustomThemes: (themes: ThemeDefinition[]) => void;
  addCustomTheme: (theme: ThemeDefinition) => Promise<void>;
  updateCustomTheme: (id: string, updates: Partial<Omit<ThemeDefinition, 'id' | 'builtIn'>>) => Promise<void>;
  deleteCustomTheme: (id: string) => Promise<void>;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  customThemes: [],
  loadCustomThemes: (themes) => set({ customThemes: themes }),
  addCustomTheme: async (theme) => {
    const updated = [...get().customThemes, theme];
    set({ customThemes: updated });
    await saveCustomThemes(updated);
  },
  updateCustomTheme: async (id, updates) => {
    const updated = get().customThemes.map(t =>
      t.id === id ? { ...t, ...updates } : t
    );
    set({ customThemes: updated });
    await saveCustomThemes(updated);
  },
  deleteCustomTheme: async (id) => {
    const updated = get().customThemes.filter(t => t.id !== id);
    set({ customThemes: updated });
    await saveCustomThemes(updated);
  },
}));
