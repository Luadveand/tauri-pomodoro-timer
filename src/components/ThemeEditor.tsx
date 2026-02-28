import React, { useState } from 'react';
import { useThemeStore } from '../stores/themeStore';
import {
  ThemeDefinition,
  ThemeColors,
  generateCustomThemeId,
  rgbStringToHex,
  hexToRgbString,
} from '../themes';

interface ThemeEditorProps {
  theme?: ThemeDefinition;
  onClose: () => void;
  onSave: (theme: ThemeDefinition) => void;
}

const colorFields: { key: keyof ThemeColors; label: string }[] = [
  { key: 'deepNavy', label: 'Background' },
  { key: 'lighterNavy', label: 'Surface' },
  { key: 'accentSurface', label: 'Accent Surface' },
  { key: 'tomato', label: 'Primary Accent' },
  { key: 'offWhite', label: 'Text' },
  { key: 'grayText', label: 'Muted Text' },
  { key: 'softGreen', label: 'Success' },
];

const defaultColors: ThemeColors = {
  deepNavy: '26 26 46',
  lighterNavy: '22 33 62',
  accentSurface: '15 52 96',
  tomato: '233 69 96',
  offWhite: '245 245 245',
  grayText: '136 146 164',
  softGreen: '78 204 163',
};

const ThemeEditor: React.FC<ThemeEditorProps> = ({ theme, onClose, onSave }) => {
  const { addCustomTheme, updateCustomTheme } = useThemeStore();
  const isEditing = !!theme;

  const [name, setName] = useState(theme?.name ?? '');
  const [isDark, setIsDark] = useState(theme?.isDark ?? true);
  const [colors, setColors] = useState<ThemeColors>(theme?.colors ?? defaultColors);

  const handleColorChange = (key: keyof ThemeColors, hex: string) => {
    setColors(prev => ({ ...prev, [key]: hexToRgbString(hex) }));
  };

  const handleHexInput = (key: keyof ThemeColors, value: string) => {
    const cleaned = value.replace(/[^0-9a-fA-F#]/g, '');
    if (/^#?[0-9a-fA-F]{6}$/.test(cleaned)) {
      const hex = cleaned.startsWith('#') ? cleaned : '#' + cleaned;
      setColors(prev => ({ ...prev, [key]: hexToRgbString(hex) }));
    }
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    if (isEditing && theme) {
      await updateCustomTheme(theme.id, { name: trimmedName, isDark, colors });
      onSave({ ...theme, name: trimmedName, isDark, colors });
    } else {
      const newTheme: ThemeDefinition = {
        id: generateCustomThemeId(),
        name: trimmedName,
        colors,
        isDark,
        builtIn: false,
      };
      await addCustomTheme(newTheme);
      onSave(newTheme);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-lighter-navy border border-gray-text/20 rounded-xl w-full max-w-md mx-4 max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-text/20 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-off-white">
            {isEditing ? 'Edit Theme' : 'Create Theme'}
          </h3>
          <button onClick={onClose} className="text-gray-text hover:text-off-white transition-colors text-xl">
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-off-white mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 30))}
              placeholder="My Custom Theme"
              className="w-full px-3 py-2 bg-deep-navy border border-gray-text/20 rounded-lg text-off-white text-sm focus:outline-none focus:border-tomato"
            />
          </div>

          {/* isDark toggle */}
          <div className="flex items-center justify-between py-1">
            <label className="text-sm font-medium text-off-white">Dark Theme</label>
            <button
              onClick={() => setIsDark(!isDark)}
              className={`w-12 h-6 rounded-full transition-colors duration-200 relative ${
                isDark ? 'bg-tomato' : 'bg-gray-text/30'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform duration-200 ${
                  isDark ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Color pickers */}
          <div className="space-y-3">
            {colorFields.map(({ key, label }) => {
              const hex = rgbStringToHex(colors[key]);
              return (
                <div key={key} className="flex items-center gap-3">
                  <input
                    type="color"
                    value={hex}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-text">{label}</label>
                    <input
                      type="text"
                      value={hex}
                      onChange={(e) => handleHexInput(key, e.target.value)}
                      className="w-full px-2 py-1 bg-deep-navy border border-gray-text/20 rounded text-off-white text-xs font-mono focus:outline-none focus:border-tomato"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Preview bar */}
          <div>
            <label className="block text-xs font-medium text-gray-text mb-1">Preview</label>
            <div className="flex h-8 rounded-lg overflow-hidden border border-gray-text/20">
              {colorFields.map(({ key }) => (
                <div
                  key={key}
                  style={{ flex: 1, backgroundColor: `rgb(${colors[key]})` }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-text/20 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-text hover:text-off-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-5 py-2 text-sm bg-tomato hover:bg-tomato/80 text-white rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isEditing ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemeEditor;
