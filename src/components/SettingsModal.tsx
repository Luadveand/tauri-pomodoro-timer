import React, { useState } from 'react';
import { useSettingsStore, Settings } from '../stores/settingsStore';
import { useTimerStore } from '../stores/timerStore';
import { ask } from '@tauri-apps/plugin-dialog';

interface SettingsModalProps {
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { settings, updateSettings, resetSettings } = useSettingsStore();
  const { resetAllData, clearHistory } = useTimerStore();
  const [localSettings, setLocalSettings] = useState<Settings>(settings);
  const [isDangerZoneOpen, setIsDangerZoneOpen] = useState(false);

  const handleChange = (key: keyof Settings, value: number | boolean) => {
    // Validate numeric inputs to ensure minimum value of 1
    if (typeof value === 'number') {
      if (key === 'focusDuration' && (isNaN(value) || value < 1)) {
        value = 1;
      } else if (key === 'shortBreakDuration' && (isNaN(value) || value < 0.5)) {
        value = 0.5;
      } else if (key === 'longBreakDuration' && (isNaN(value) || value < 0.5)) {
        value = 0.5;
      } else if (key === 'roundsBeforeLongBreak' && (isNaN(value) || value < 1)) {
        value = 1;
      }
    }

    setLocalSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = () => {
    updateSettings(localSettings);
    onClose();
  };

  const handleCancel = () => {
    setLocalSettings(settings);
    onClose();
  };

  const handleRestoreDefaults = async () => {
    try {
      const confirmed = await ask('Are you sure you want to restore all timer settings to their default values? This will not affect your history.', {
        title: 'Restore Default Times',
        kind: 'warning'
      });
      
      if (confirmed) {
        await resetSettings();
        const defaultSettings = {
          focusDuration: 25,
          shortBreakDuration: 5,
          longBreakDuration: 15,
          roundsBeforeLongBreak: 4,
          soundEnabled: true,
          notificationsEnabled: true,
          alwaysOnTop: false,
        };
        setLocalSettings(defaultSettings);
      }
    } catch (error) {
      const confirmed = window.confirm('Are you sure you want to restore all timer settings to their default values? This will not affect your history.');
      if (confirmed) {
        await resetSettings();
        const defaultSettings = {
          focusDuration: 25,
          shortBreakDuration: 5,
          longBreakDuration: 15,
          roundsBeforeLongBreak: 4,
          soundEnabled: true,
          notificationsEnabled: true,
          alwaysOnTop: false,
        };
        setLocalSettings(defaultSettings);
      }
    }
  };

  const handleClearHistory = async () => {
    try {
      const confirmed = await ask('Are you sure you want to clear all history? This action cannot be undone.', {
        title: 'Clear All History',
        kind: 'warning'
      });
      
      if (confirmed) {
        clearHistory();
      }
    } catch (error) {
      const confirmed = window.confirm('Are you sure you want to clear all history? This action cannot be undone.');
      if (confirmed) {
        clearHistory();
      }
    }
  };

  const handleResetAppData = async () => {
    try {
      const confirmed = await ask('Are you sure you want to reset all app data? This will clear your history and reset all settings to default values. This action cannot be undone.', {
        title: 'Reset App Data',
        kind: 'warning'
      });
      
      if (confirmed) {
        await resetAllData();
        resetSettings();
        onClose();
      }
    } catch (error) {
      const confirmed = window.confirm('Are you sure you want to reset all app data? This will clear your history and reset all settings to default values. This action cannot be undone.');
      if (confirmed) {
        await resetAllData();
        resetSettings();
        onClose();
      }
    }
  };


  return (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-accent-surface rounded-lg shadow-xl w-80 max-w-[95vw] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-text/20">
          <h2 className="text-lg font-semibold text-off-white">Settings</h2>
        </div>

        {/* Content */}
        <div className="px-4 py-3 space-y-4">
          {/* Focus Duration */}
          <div>
            <label className="block text-sm font-medium text-off-white mb-1">
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
                if (value === '') return; // Don't update if empty
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
            <label className="block text-sm font-medium text-off-white mb-1">
              Short Break Duration (minutes)
            </label>
            <input
              type="number"
              min="0.5"
              max="60"
              step="0.5"
              value={localSettings.shortBreakDuration}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') return; // Don't update if empty
                handleChange('shortBreakDuration', parseFloat(value) || 0.5);
              }}
              onBlur={(e) => {
                const value = e.target.value;
                if (value === '' || parseFloat(value) < 0.5) {
                  handleChange('shortBreakDuration', 0.5);
                }
              }}
              className="w-full px-3 py-2 bg-lighter-navy border border-gray-text/30 rounded-md text-off-white focus:outline-none focus:border-tomato"
            />
          </div>

          {/* Long Break Duration */}
          <div>
            <label className="block text-sm font-medium text-off-white mb-1">
              Long Break Duration (minutes)
            </label>
            <input
              type="number"
              min="0.5"
              max="60"
              step="0.5"
              value={localSettings.longBreakDuration}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') return; // Don't update if empty
                handleChange('longBreakDuration', parseFloat(value) || 0.5);
              }}
              onBlur={(e) => {
                const value = e.target.value;
                if (value === '' || parseFloat(value) < 0.5) {
                  handleChange('longBreakDuration', 0.5);
                }
              }}
              className="w-full px-3 py-2 bg-lighter-navy border border-gray-text/30 rounded-md text-off-white focus:outline-none focus:border-tomato"
            />
          </div>

          {/* Rounds Before Long Break */}
          <div>
            <label className="block text-sm font-medium text-off-white mb-1">
              Rounds Before Long Break
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={localSettings.roundsBeforeLongBreak}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') return; // Don't update if empty
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
              className={`w-12 h-6 rounded-full transition-colors duration-200 relative ${localSettings.soundEnabled ? 'bg-tomato' : 'bg-gray-text/30'
                }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform duration-200 ${localSettings.soundEnabled ? 'translate-x-6' : 'translate-x-0.5'
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
              className={`w-12 h-6 rounded-full transition-colors duration-200 relative ${localSettings.notificationsEnabled ? 'bg-tomato' : 'bg-gray-text/30'
                }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform duration-200 ${localSettings.notificationsEnabled ? 'translate-x-6' : 'translate-x-0.5'
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
              className={`w-12 h-6 rounded-full transition-colors duration-200 relative ${localSettings.alwaysOnTop ? 'bg-tomato' : 'bg-gray-text/30'
                }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform duration-200 ${localSettings.alwaysOnTop ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
              />
            </button>
          </div>

          {/* Danger Zone */}
          <div className="pt-4 mt-4 border-t border-gray-text/20">
            <button
              onClick={() => setIsDangerZoneOpen(!isDangerZoneOpen)}
              className="flex items-center justify-between w-full text-left mb-2"
            >
              <h3 className="text-sm font-medium text-tomato">Danger Zone</h3>
              <svg
                className={`w-4 h-4 text-tomato transform transition-transform duration-200 ${
                  isDangerZoneOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isDangerZoneOpen && (
              <div className="space-y-2">
                <button
                  onClick={handleRestoreDefaults}
                  className="w-full px-3 py-2 border border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white rounded-md transition-colors duration-200 text-xs"
                >
                  Restore Default Times
                </button>
                
                <button
                  onClick={handleClearHistory}
                  className="w-full px-3 py-2 border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white rounded-md transition-colors duration-200 text-xs"
                >
                  Clear History
                </button>
                
                <button
                  onClick={handleResetAppData}
                  className="w-full px-3 py-2 border border-tomato text-tomato hover:bg-tomato hover:text-white rounded-md transition-colors duration-200 text-xs"
                >
                  Reset App Data
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-text/20 flex justify-end gap-3">
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

export default SettingsModal;