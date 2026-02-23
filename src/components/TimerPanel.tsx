import React, { useState, useRef, useEffect } from 'react';
import { useTimerStore } from '../stores/timerStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useTimer } from '../utils/useTimer';
import Controls from './Controls';
import RoundTracker from './RoundTracker';
import SettingsModal from './SettingsModal';

const TimerPanel: React.FC = () => {
  const { currentPhase, timeLeft, resetCycle } = useTimerStore();
  const { settings, updateSettings } = useSettingsStore();
  const [showSettings, setShowSettings] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Initialize timer logic
  useTimer();

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseLabel = (): string => {
    switch (currentPhase) {
      case 'focus':
        return 'Focus';
      case 'shortBreak':
        return 'Short Break';
      case 'longBreak':
        return 'Long Break';
      default:
        return 'Focus';
    }
  };

  const handleRestartCycle = () => {
    resetCycle(settings);
  };

  const toggleHistoryPanel = () => {
    updateSettings({ historyPanelVisible: !settings.historyPanelVisible });
    setShowMenu(false);
  };

  const toggleNotesPanel = () => {
    updateSettings({ notesPanelVisible: !settings.notesPanelVisible });
    setShowMenu(false);
  };

  // Click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="h-full bg-lighter-navy flex flex-col relative">
      {/* Menu Button */}
      <div className="absolute left-4 top-4" ref={menuRef}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="w-10 h-10 bg-accent-surface hover:bg-accent-surface/80 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
          aria-label="Menu"
        >
          <svg
            className="w-5 h-5 text-off-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        {/* Dropdown Menu */}
        {showMenu && (
          <div className="absolute top-12 left-0 bg-lighter-navy border border-gray-text/20 rounded-lg shadow-xl min-w-[160px] py-2 z-50">
            {/* Settings */}
            <button
              onClick={() => {
                setShowSettings(true);
                setShowMenu(false);
              }}
              className="w-full px-4 py-3 text-left text-off-white hover:bg-accent-surface/50 flex items-center gap-3 transition-colors duration-200"
            >
              <span className="text-lg">⚙️</span>
              <span className="text-sm">Settings</span>
            </button>
            
            {/* Restart */}
            <button
              onClick={() => {
                handleRestartCycle();
                setShowMenu(false);
              }}
              className="w-full px-4 py-3 text-left text-off-white hover:bg-accent-surface/50 flex items-center gap-3 transition-colors duration-200"
            >
              <span className="text-lg">🔄</span>
              <span className="text-sm">Restart Cycle</span>
            </button>
            
            {/* History Toggle */}
            <button
              onClick={toggleHistoryPanel}
              className="w-full px-4 py-3 text-left text-off-white hover:bg-accent-surface/50 flex items-center gap-3 transition-colors duration-200"
            >
              <span className="text-lg">📋</span>
              <span className="text-sm">{settings.historyPanelVisible ? "Hide History" : "Show History"}</span>
            </button>
            
            {/* Notes Toggle */}
            <button
              onClick={toggleNotesPanel}
              className="w-full px-4 py-3 text-left text-off-white hover:bg-accent-surface/50 flex items-center gap-3 transition-colors duration-200"
            >
              <span className="text-lg">📝</span>
              <span className="text-sm">{settings.notesPanelVisible ? "Hide Notes" : "Show Notes"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Timer Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-2">
        {/* Phase Indicator */}
        <div className="mb-4">
          <h2 className={`font-medium text-gray-text text-center transition-all duration-300 ${
            !settings.notesPanelVisible ? 'text-xl' : 'text-base'
          }`}>
            {getPhaseLabel()}
          </h2>
        </div>

        {settings.historyPanelVisible ? (
          // Compact layout with timer and controls side by side
          <div className="flex items-center justify-center gap-8">
            <div className="flex flex-col items-center">
              {/* Countdown Display */}
              <div className="mb-3">
                <div className={`timer-font font-bold text-white transition-all duration-300 ${
                  !settings.notesPanelVisible ? 'text-7xl' : 'text-5xl'
                }`}>
                  {formatTime(timeLeft)}
                </div>
              </div>
              {/* Round Tracker */}
              <div>
                <RoundTracker />
              </div>
            </div>
            
            {/* Controls */}
            <div>
              <Controls compact />
            </div>
          </div>
        ) : (
          // Full layout with timer and controls stacked vertically
          <>
            {/* Countdown Display */}
            <div className="mb-6">
              <div className={`timer-font font-bold text-white transition-all duration-300 ${
                !settings.notesPanelVisible ? 'text-8xl' : 'text-6xl'
              }`}>
                {formatTime(timeLeft)}
              </div>
            </div>

            {/* Round Tracker */}
            <div className="mb-6">
              <RoundTracker />
            </div>

            {/* Controls */}
            <Controls />
          </>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
};

export default TimerPanel;