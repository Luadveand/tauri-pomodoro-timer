import React, { useState } from 'react';
import { useTimerStore } from '../stores/timerStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useTimer } from '../utils/useTimer';
import Controls from './Controls';
import RoundTracker from './RoundTracker';
import SettingsModal from './SettingsModal';

const TimerPanel: React.FC = () => {
  const { currentPhase, timeLeft, resetCycle } = useTimerStore();
  const { settings } = useSettingsStore();
  const [showSettings, setShowSettings] = useState(false);
  
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

  return (
    <div className="h-full bg-lighter-navy flex flex-col relative">
      {/* Restart Button */}
      <div className="absolute top-4 left-4">
        <button
          onClick={handleRestartCycle}
          className="w-10 h-10 bg-accent-surface hover:bg-accent-surface/80 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
          aria-label="Restart Cycle"
        >
          <span className="text-off-white text-lg">🔄</span>
        </button>
      </div>

      {/* Settings Button */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setShowSettings(true)}
          className="w-10 h-10 bg-accent-surface hover:bg-accent-surface/80 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
          aria-label="Settings"
        >
          <span className="text-off-white text-lg">⚙️</span>
        </button>
      </div>

      {/* Main Timer Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-4">
        {/* Phase Indicator */}
        <div className="mb-2">
          <h2 className="text-base font-medium text-gray-text text-center">
            {getPhaseLabel()}
          </h2>
        </div>

        {/* Countdown Display */}
        <div className="mb-3">
          <div className="timer-font text-4xl font-bold text-white">
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Round Tracker */}
        <div className="mb-3">
          <RoundTracker />
        </div>

        {/* Controls */}
        <Controls />
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
};

export default TimerPanel;