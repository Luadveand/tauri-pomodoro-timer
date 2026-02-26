export interface ThemeColors {
  deepNavy: string;       // "26 26 46" (space-separated RGB)
  lighterNavy: string;
  accentSurface: string;
  tomato: string;
  offWhite: string;
  grayText: string;
  softGreen: string;
}

export interface ThemeDefinition {
  id: string;
  name: string;
  colors: ThemeColors;
  isDark: boolean;
  builtIn: boolean;
}

export interface ThemeExportData {
  version: 1;
  theme: { name: string; colors: ThemeColors; isDark: boolean };
}
