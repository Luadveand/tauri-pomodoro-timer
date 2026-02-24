import React, { useState } from 'react';
import { useSettingsStore, Settings, defaultSettings } from '../stores/settingsStore';
import { useTimerStore } from '../stores/timerStore';
import { usePremiumStore } from '../stores/premiumStore';
import { ask } from '@tauri-apps/plugin-dialog';

const SettingsPanel: React.FC = () => {
  const { settings, updateSettings, resetSettings, exitSettingsMode } = useSettingsStore();
  const { resetAllData, clearHistory, initializeNotebookPages, teardownNotebookPages } = useTimerStore();
  const [localSettings, setLocalSettings] = useState<Settings>(settings);
  const [isDangerZoneOpen, setIsDangerZoneOpen] = useState(false);
  const [licenseKeyInput, setLicenseKeyInput] = useState('');

  const isPremium = usePremiumStore(s => s.isActive);
  const isValidating = usePremiumStore(s => s.isValidating);
  const validationError = usePremiumStore(s => s.validationError);
  const customerEmail = usePremiumStore(s => s.customerEmail);
  const activatePremium = usePremiumStore(s => s.activate);
  const deactivatePremium = usePremiumStore(s => s.deactivate);

  const handleChange = (key: keyof Settings, value: number | boolean) => {
    // Validate numeric inputs to ensure min/max per PRD ranges
    if (typeof value === 'number') {
      if (isNaN(value)) value = 1;
      if (key === 'focusDuration') {
        value = Math.max(1, Math.min(120, value));
      } else if (key === 'shortBreakDuration') {
        value = Math.max(0.5, Math.min(60, value));
      } else if (key === 'longBreakDuration') {
        value = Math.max(0.5, Math.min(60, value));
      } else if (key === 'roundsBeforeLongBreak') {
        value = Math.max(1, Math.min(20, Math.floor(value)));
      } else if (key === 'leftPanelWidth') {
        value = Math.max(0.3, Math.min(0.7, value));
      }
    }

    setLocalSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    const prevEnabled = settings.notebookPagesEnabled;
    const newEnabled = localSettings.notebookPagesEnabled;

    // Handle notebook pages toggle change
    if (!prevEnabled && newEnabled) {
      // OFF -> ON: initialize pages, clear grace period
      const updatedLocal = { ...localSettings, notebookPagesGracePeriodStart: null };
      await updateSettings(updatedLocal);
      await initializeNotebookPages();
    } else if (prevEnabled && !newEnabled) {
      // ON -> OFF: confirm and teardown
      let confirmed = false;
      try {
        confirmed = await ask(
          'Only the currently active page will be kept. All other pages will be permanently deleted.',
          { title: 'Disable Notebook Pages', kind: 'warning' }
        );
      } catch {
        confirmed = window.confirm(
          'Only the currently active page will be kept. All other pages will be permanently deleted.'
        );
      }
      if (!confirmed) {
        // User cancelled — revert the toggle and don't save
        setLocalSettings(prev => ({ ...prev, notebookPagesEnabled: true }));
        return;
      }
      const updatedLocal = { ...localSettings, notebookPagesGracePeriodStart: null };
      await updateSettings(updatedLocal);
      await teardownNotebookPages();
    } else {
      await updateSettings(localSettings);
    }

    // Exit settings mode after saving
    await exitSettingsMode();
  };

  const handleCancel = () => {
    setLocalSettings(settings);
    // Exit settings mode without saving
    exitSettingsMode();
  };

  const handleRestoreDefaults = async () => {
    try {
      const confirmed = await ask('Are you sure you want to restore all timer settings to their default values? This will not affect your history.', {
        title: 'Restore Default Times',
        kind: 'warning'
      });
      
      if (confirmed) {
        await resetSettings();
        setLocalSettings({ ...defaultSettings, historyPanelVisible: localSettings.historyPanelVisible });
      }
    } catch (error) {
      const confirmed = window.confirm('Are you sure you want to restore all timer settings to their default values? This will not affect your history.');
      if (confirmed) {
        await resetSettings();
        setLocalSettings({ ...defaultSettings, historyPanelVisible: localSettings.historyPanelVisible });
      }
    }
  };

  const handleClearHistory = async () => {
    try {
      const confirmed = await ask('Are you sure you want to permanently delete all your session history? This action cannot be undone.', {
        title: 'Clear All History',
        kind: 'warning'
      });
      
      if (confirmed) {
        clearHistory();
      }
    } catch (error) {
      const confirmed = window.confirm('Are you sure you want to permanently delete all your session history? This action cannot be undone.');
      if (confirmed) {
        clearHistory();
      }
    }
  };

  const handleResetAppData = async () => {
    try {
      const confirmed = await ask('Are you sure you want to factory reset the app? This will permanently delete all your history and reset every setting back to default. This action cannot be undone.', {
        title: 'Factory Reset',
        kind: 'warning'
      });
      
      if (confirmed) {
        await resetAllData();
        await resetSettings();
        await exitSettingsMode();
      }
    } catch (error) {
      const confirmed = window.confirm('Are you sure you want to factory reset the app? This will permanently delete all your history and reset every setting back to default. This action cannot be undone.');
      if (confirmed) {
        await resetAllData();
        await resetSettings();
        await exitSettingsMode();
      }
    }
  };

  return (
    <div className="h-full bg-lighter-navy flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-text/20 bg-accent-surface/30">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-off-white flex items-center gap-2">
            <svg className="w-5 h-5 text-tomato" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-text hover:text-off-white transition-colors text-2xl"
            title="Close Settings"
          >
            ×
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-8 overflow-y-auto min-h-0 flex-1">
        {/* Timer Settings */}
        <div className="bg-gray-text/5 border border-gray-text/10 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-off-white mb-5 flex items-center gap-2">
            <svg className="w-5 h-5 text-tomato" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Timer Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Focus Duration */}
            <div>
              <label className="block text-sm font-semibold text-off-white mb-2">
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
                className="w-full px-4 py-3 bg-lighter-navy/80 border-2 border-gray-text/20 rounded-lg text-off-white focus:outline-none focus:border-tomato focus:ring-2 focus:ring-tomato/20 transition-all duration-200 shadow-sm"
              />
            </div>

            {/* Short Break Duration */}
            <div>
              <label className="block text-sm font-semibold text-off-white mb-2">
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
                  if (value === '') return;
                  handleChange('shortBreakDuration', parseFloat(value) || 0.5);
                }}
                onBlur={(e) => {
                  const value = e.target.value;
                  if (value === '' || parseFloat(value) < 0.5) {
                    handleChange('shortBreakDuration', 0.5);
                  }
                }}
                className="w-full px-4 py-3 bg-lighter-navy/80 border-2 border-gray-text/20 rounded-lg text-off-white focus:outline-none focus:border-tomato focus:ring-2 focus:ring-tomato/20 transition-all duration-200 shadow-sm"
              />
            </div>

            {/* Long Break Duration */}
            <div>
              <label className="block text-sm font-semibold text-off-white mb-2">
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
                  if (value === '') return;
                  handleChange('longBreakDuration', parseFloat(value) || 0.5);
                }}
                onBlur={(e) => {
                  const value = e.target.value;
                  if (value === '' || parseFloat(value) < 0.5) {
                    handleChange('longBreakDuration', 0.5);
                  }
                }}
                className="w-full px-4 py-3 bg-lighter-navy/80 border-2 border-gray-text/20 rounded-lg text-off-white focus:outline-none focus:border-tomato focus:ring-2 focus:ring-tomato/20 transition-all duration-200 shadow-sm"
              />
            </div>

            {/* Rounds Before Long Break */}
            <div>
              <label className="block text-sm font-semibold text-off-white mb-2">
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
                className="w-full px-4 py-3 bg-lighter-navy/80 border-2 border-gray-text/20 rounded-lg text-off-white focus:outline-none focus:border-tomato focus:ring-2 focus:ring-tomato/20 transition-all duration-200 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Notifications & Audio */}
        <div className="bg-gray-text/5 border border-gray-text/10 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-off-white mb-5 flex items-center gap-2">
            <svg className="w-5 h-5 text-tomato" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.828 4.828A4 4 0 015.536 4H19a2 2 0 012 2v10a2 2 0 01-2 2h-9.243L6 22V6.243a1 1 0 01.828-1.415z" />
            </svg>
            Notifications & Audio
          </h3>
          <div className="space-y-4">
            {/* Sound Enabled */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.03 6.03L4 7l1.03 1.03L7 6.03M12 1v22m0-22l3 3m-3-3L9 4" />
                </svg>
                <div>
                  <label className="text-sm font-semibold text-off-white block">
                    Sound Enabled
                  </label>
                  <p className="text-xs text-gray-text mt-0.5">Play notification sounds when timer completes</p>
                </div>
              </div>
              <button
                onClick={() => handleChange('soundEnabled', !localSettings.soundEnabled)}
                className={`w-14 h-7 rounded-full transition-all duration-300 relative shadow-inner ${localSettings.soundEnabled ? 'bg-gradient-to-r from-tomato to-tomato/80' : 'bg-gray-text/30'
                  }`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full absolute top-0.5 transition-all duration-300 shadow-md ${localSettings.soundEnabled ? 'translate-x-7' : 'translate-x-0.5'
                    }`}
                />
              </button>
            </div>

            {/* Notifications Enabled */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.828 4.828A4 4 0 015.536 4H19a2 2 0 012 2v10a2 2 0 01-2 2h-9.243L6 22V6.243a1 1 0 01.828-1.415z" />
                </svg>
                <div>
                  <label className="text-sm font-semibold text-off-white block">
                    Notifications Enabled
                  </label>
                  <p className="text-xs text-gray-text mt-0.5">Show desktop notifications</p>
                </div>
              </div>
              <button
                onClick={() => handleChange('notificationsEnabled', !localSettings.notificationsEnabled)}
                className={`w-14 h-7 rounded-full transition-all duration-300 relative shadow-inner ${localSettings.notificationsEnabled ? 'bg-gradient-to-r from-tomato to-tomato/80' : 'bg-gray-text/30'
                  }`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full absolute top-0.5 transition-all duration-300 shadow-md ${localSettings.notificationsEnabled ? 'translate-x-7' : 'translate-x-0.5'
                    }`}
                />
              </button>
            </div>

            {/* Always On Top */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                </svg>
                <div>
                  <label className="text-sm font-semibold text-off-white block">
                    Always On Top
                  </label>
                  <p className="text-xs text-gray-text mt-0.5">Keep window above all other applications</p>
                </div>
              </div>
              <button
                onClick={() => handleChange('alwaysOnTop', !localSettings.alwaysOnTop)}
                className={`w-14 h-7 rounded-full transition-all duration-300 relative shadow-inner ${localSettings.alwaysOnTop ? 'bg-gradient-to-r from-tomato to-tomato/80' : 'bg-gray-text/30'
                  }`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full absolute top-0.5 transition-all duration-300 shadow-md ${localSettings.alwaysOnTop ? 'translate-x-7' : 'translate-x-0.5'
                    }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="bg-gray-text/5 border border-gray-text/10 rounded-xl p-5">
          <button
            onClick={() => setIsDangerZoneOpen(!isDangerZoneOpen)}
            className="flex items-center justify-between w-full text-left mb-2"
          >
            <h3 className="text-sm font-medium text-off-white flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Advanced Settings
            </h3>
            <svg
              className={`w-4 h-4 text-off-white transform transition-transform duration-200 ${
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
            <div className="space-y-6 mt-4">
              {/* License Key Section (always enabled) */}
              {!isPremium ? (
                <div className="space-y-3 mb-6 pb-6 border-b border-gray-text/10">
                  <label className="text-sm font-medium text-off-white block">License Key</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={licenseKeyInput}
                      onChange={(e) => setLicenseKeyInput(e.target.value)}
                      placeholder="POMO-xxxx-xxxx-xxxx-xxxx"
                      className="flex-1 bg-gray-text/10 border border-gray-text/20 rounded-lg px-3 py-2 text-sm text-off-white placeholder-gray-text/50 focus:outline-none focus:border-tomato/50"
                      disabled={isValidating}
                    />
                    <button
                      onClick={() => activatePremium(licenseKeyInput)}
                      disabled={isValidating || !licenseKeyInput.trim()}
                      className="px-4 py-2 bg-tomato text-white rounded-lg text-sm font-medium hover:bg-tomato/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {isValidating ? 'Validating...' : 'Activate'}
                    </button>
                  </div>
                  {validationError && (
                    <p className="text-xs text-red-400">{validationError}</p>
                  )}
                  <a
                    href="https://polar.sh"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-tomato/70 hover:text-tomato underline"
                  >
                    Get a license key
                  </a>
                </div>
              ) : (
                <div className="space-y-2 mb-6 pb-6 border-b border-gray-text/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-sm text-off-white">Premium active</span>
                      {customerEmail && (
                        <span className="text-xs text-gray-text">({customerEmail})</span>
                      )}
                    </div>
                    <button
                      onClick={async () => {
                        let confirmed = false;
                        try {
                          confirmed = await ask(
                            'Are you sure? This will deactivate premium on this device.',
                            { title: 'Deactivate Premium', kind: 'warning' }
                          );
                        } catch {
                          confirmed = window.confirm(
                            'Are you sure? This will deactivate premium on this device.'
                          );
                        }
                        if (confirmed) await deactivatePremium();
                      }}
                      className="text-xs text-gray-text hover:text-red-400 transition-colors"
                    >
                      Deactivate
                    </button>
                  </div>
                </div>
              )}

              {/* Premium-gated options */}
              <div className={!isPremium ? 'opacity-40 pointer-events-none select-none' : ''}>
              {/* Layout Balance */}
              <div>
                <label className="text-sm font-medium text-off-white block mb-3">
                  Layout Balance
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0.3"
                    max="0.7"
                    step="0.05"
                    value={localSettings.leftPanelWidth}
                    onChange={(e) => handleChange('leftPanelWidth', parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-text/30 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-sm text-gray-text">
                    <span>Timer {Math.round(localSettings.leftPanelWidth * 100)}%</span>
                    <span>Notes {Math.round((1 - localSettings.leftPanelWidth) * 100)}%</span>
                  </div>
                </div>
              </div>

              {/* Keep Completed Tasks Toggle */}
              <div className="flex items-center justify-between py-1">
                <label className="text-sm font-medium text-off-white">
                  Keep Completed Tasks Across Phases
                </label>
                <button
                  onClick={() => handleChange('keepCompletedAcrossPhases', !localSettings.keepCompletedAcrossPhases)}
                  className={`w-12 h-6 rounded-full transition-colors duration-200 relative ${localSettings.keepCompletedAcrossPhases ? 'bg-tomato' : 'bg-gray-text/30'
                    }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform duration-200 ${localSettings.keepCompletedAcrossPhases ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                  />
                </button>
              </div>

              {/* Notebook Pages Toggle */}
              <div className="flex items-center justify-between py-1">
                <div>
                  <label className="text-sm font-medium text-off-white block">
                    Notebook Pages
                  </label>
                  <p className="text-xs text-gray-text mt-0.5">Organize notes into multiple tabbed pages</p>
                </div>
                <button
                  onClick={() => handleChange('notebookPagesEnabled', !localSettings.notebookPagesEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors duration-200 relative ${localSettings.notebookPagesEnabled ? 'bg-tomato' : 'bg-gray-text/30'
                    }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform duration-200 ${localSettings.notebookPagesEnabled ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                  />
                </button>
              </div>

              {/* Destructive Actions */}
              <div className="bg-tomato/5 border border-tomato/20 rounded-lg p-4 mt-6">
                <h4 className="text-sm font-medium text-tomato mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Destructive Actions
                </h4>
                <div className="space-y-3">
                  <button
                    onClick={handleRestoreDefaults}
                    className="w-full px-4 py-2.5 border border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white rounded-md transition-colors duration-200 text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Restore Default Times
                  </button>
                  
                  <button
                    onClick={handleClearHistory}
                    className="w-full px-4 py-2.5 border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white rounded-md transition-colors duration-200 text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Clear All History
                  </button>
                  
                  <button
                    onClick={handleResetAppData}
                    className="w-full px-4 py-2.5 border-2 border-tomato text-tomato hover:bg-tomato hover:text-white rounded-md transition-colors duration-200 text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Factory Reset
                  </button>
                </div>
              </div>
              </div>{/* end premium-gated options */}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-text/20 bg-accent-surface/30 flex justify-end gap-3">
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
  );
};

export default SettingsPanel;