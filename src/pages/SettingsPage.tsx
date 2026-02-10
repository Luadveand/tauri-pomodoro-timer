import { useState, useEffect } from 'react';
import { useSettingsStore, Settings } from '../stores/settingsStore';
import { Window } from '@tauri-apps/api/window';

const SettingsPage = () => {
  const { settings, updateSettings } = useSettingsStore();
  const [localSettings, setLocalSettings] = useState<Settings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleChange = (key: keyof Settings, value: number | boolean) => {
    // Validate numeric inputs to ensure minimum value of 1
    if (typeof value === 'number') {
      if (key === 'focusDuration' && (isNaN(value) || value < 1)) {
        value = 1;
      } else if (key === 'shortBreakDuration' && (isNaN(value) || value < 1)) {
        value = 1;
      } else if (key === 'longBreakDuration' && (isNaN(value) || value < 1)) {
        value = 1;
      } else if (key === 'roundsBeforeLongBreak' && (isNaN(value) || value < 1)) {
        value = 1;
      }
    }
    
    setLocalSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    updateSettings(localSettings);
    // Close the settings window
    const currentWindow = Window.getCurrent();
    await currentWindow.close();
  };

  const handleCancel = async () => {
    setLocalSettings(settings);
    // Close the settings window
    const currentWindow = Window.getCurrent();
    await currentWindow.close();
  };

  return (
    <div className="min-h-screen bg-deep-navy p-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-off-white">Settings</h1>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Focus Duration */}
          <div>
            <label className="block text-sm font-medium text-off-white mb-2">
              Focus Duration (minutes)
            </label>
            <input
              type="number"
              min="1"
              max="120"
              step="0.5"
              value={localSettings.focusDuration}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') return;
                handleChange('focusDuration', parseFloat(value) || 1);
              }}
              onBlur={(e) => {
                const value = e.target.value;
                if (value === '' || parseFloat(value) < 1) {
                  handleChange('focusDuration', 1);
                }
              }}
              className="w-full px-3 py-2 bg-lighter-navy border border-gray-text/30 rounded-md text-off-white focus:outline-none focus:border-tomato"
            />
          </div>

          {/* Short Break Duration */}
          <div>
            <label className="block text-sm font-medium text-off-white mb-2">
              Short Break Duration (minutes)
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={localSettings.shortBreakDuration}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') return;
                handleChange('shortBreakDuration', parseInt(value) || 1);
              }}
              onBlur={(e) => {
                const value = e.target.value;
                if (value === '' || parseInt(value) < 1) {
                  handleChange('shortBreakDuration', 1);
                }
              }}
              className="w-full px-3 py-2 bg-lighter-navy border border-gray-text/30 rounded-md text-off-white focus:outline-none focus:border-tomato"
            />
          </div>

          {/* Long Break Duration */}
          <div>
            <label className="block text-sm font-medium text-off-white mb-2">
              Long Break Duration (minutes)
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={localSettings.longBreakDuration}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') return;
                handleChange('longBreakDuration', parseInt(value) || 1);
              }}
              onBlur={(e) => {
                const value = e.target.value;
                if (value === '' || parseInt(value) < 1) {
                  handleChange('longBreakDuration', 1);
                }
              }}
              className="w-full px-3 py-2 bg-lighter-navy border border-gray-text/30 rounded-md text-off-white focus:outline-none focus:border-tomato"
            />
          </div>

          {/* Rounds Before Long Break */}
          <div>
            <label className="block text-sm font-medium text-off-white mb-2">
              Rounds Before Long Break
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={localSettings.roundsBeforeLongBreak}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') return;
                handleChange('roundsBeforeLongBreak', parseInt(value) || 1);
              }}
              onBlur={(e) => {
                const value = e.target.value;
                if (value === '' || parseInt(value) < 1) {
                  handleChange('roundsBeforeLongBreak', 1);
                }
              }}
              className="w-full px-3 py-2 bg-lighter-navy border border-gray-text/30 rounded-md text-off-white focus:outline-none focus:border-tomato"
            />
          </div>

          {/* Sound Enabled */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-off-white">
              Sound Enabled
            </label>
            <button
              onClick={() => handleChange('soundEnabled', !localSettings.soundEnabled)}
              className={`w-12 h-6 rounded-full transition-colors duration-200 relative ${
                localSettings.soundEnabled ? 'bg-tomato' : 'bg-gray-text/30'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform duration-200 ${
                  localSettings.soundEnabled ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Notifications Enabled */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-off-white">
              Notifications Enabled
            </label>
            <button
              onClick={() => handleChange('notificationsEnabled', !localSettings.notificationsEnabled)}
              className={`w-12 h-6 rounded-full transition-colors duration-200 relative ${
                localSettings.notificationsEnabled ? 'bg-tomato' : 'bg-gray-text/30'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform duration-200 ${
                  localSettings.notificationsEnabled ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Always On Top */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-off-white">
              Always On Top
            </label>
            <button
              onClick={() => handleChange('alwaysOnTop', !localSettings.alwaysOnTop)}
              className={`w-12 h-6 rounded-full transition-colors duration-200 relative ${
                localSettings.alwaysOnTop ? 'bg-tomato' : 'bg-gray-text/30'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform duration-200 ${
                  localSettings.alwaysOnTop ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-text hover:text-off-white transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-tomato hover:bg-tomato/80 text-white rounded-md transition-colors duration-200"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;