import { ThemeColors, ThemeDefinition, ThemeExportData } from './types';
import { presetThemes } from './presets';

export function rgbStringToHex(rgbString: string): string {
  const parts = rgbString.split(' ').map(Number);
  return '#' + parts.map(v => v.toString(16).padStart(2, '0')).join('');
}

export function hexToRgbString(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r} ${g} ${b}`;
}

function deriveCssVars(colors: ThemeColors, isDark: boolean) {
  const sliderThumbBg = rgbStringToHex(colors.tomato);
  const sliderThumbBorder = isDark ? '#ffffff' : rgbStringToHex(colors.lighterNavy);
  const scrollbarThumb = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)';
  const scrollbarThumbHover = isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)';
  return { sliderThumbBg, sliderThumbBorder, scrollbarThumb, scrollbarThumbHover };
}

export function applyTheme(theme: ThemeDefinition): void {
  const root = document.documentElement;
  const { colors, isDark } = theme;
  const derived = deriveCssVars(colors, isDark);

  root.style.setProperty('--color-deep-navy', colors.deepNavy);
  root.style.setProperty('--color-lighter-navy', colors.lighterNavy);
  root.style.setProperty('--color-accent-surface', colors.accentSurface);
  root.style.setProperty('--color-tomato', colors.tomato);
  root.style.setProperty('--color-off-white', colors.offWhite);
  root.style.setProperty('--color-gray-text', colors.grayText);
  root.style.setProperty('--color-soft-green', colors.softGreen);
  root.style.setProperty('--slider-thumb-bg', derived.sliderThumbBg);
  root.style.setProperty('--slider-thumb-border', derived.sliderThumbBorder);
  root.style.setProperty('--scrollbar-thumb', derived.scrollbarThumb);
  root.style.setProperty('--scrollbar-thumb-hover', derived.scrollbarThumbHover);

  // Remove old data-theme attribute since we're applying via JS now
  root.removeAttribute('data-theme');
}

export function resolveTheme(
  id: string,
  customThemes: ThemeDefinition[]
): ThemeDefinition | undefined {
  return presetThemes.find(t => t.id === id) ?? customThemes.find(t => t.id === id);
}

export function generateCustomThemeId(): string {
  return 'custom-' + crypto.randomUUID().slice(0, 8);
}

export function exportTheme(theme: ThemeDefinition): ThemeExportData {
  return {
    version: 1,
    theme: {
      name: theme.name,
      colors: { ...theme.colors },
      isDark: theme.isDark,
    },
  };
}

export function validateImportData(data: unknown): data is ThemeExportData {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;
  if (d.version !== 1) return false;
  if (typeof d.theme !== 'object' || d.theme === null) return false;
  const t = d.theme as Record<string, unknown>;
  if (typeof t.name !== 'string') return false;
  if (typeof t.isDark !== 'boolean') return false;
  if (typeof t.colors !== 'object' || t.colors === null) return false;
  const c = t.colors as Record<string, unknown>;
  const requiredKeys: (keyof ThemeColors)[] = [
    'deepNavy', 'lighterNavy', 'accentSurface', 'tomato',
    'offWhite', 'grayText', 'softGreen',
  ];
  for (const key of requiredKeys) {
    if (typeof c[key] !== 'string') return false;
    // Validate space-separated RGB format
    const parts = (c[key] as string).split(' ');
    if (parts.length !== 3) return false;
    if (parts.some(p => isNaN(Number(p)) || Number(p) < 0 || Number(p) > 255)) return false;
  }
  return true;
}

export function importTheme(data: ThemeExportData): ThemeDefinition {
  return {
    id: generateCustomThemeId(),
    name: data.theme.name,
    colors: { ...data.theme.colors },
    isDark: data.theme.isDark,
    builtIn: false,
  };
}
