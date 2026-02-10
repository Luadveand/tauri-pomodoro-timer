import React, { useState } from 'react';
import { useTimerStore } from '../stores/timerStore';
import { useTimer } from '../utils/useTimer';
import Controls from './Controls';
import RoundTracker from './RoundTracker';
import SettingsModal from './SettingsModal';

interface TimerPanelProps {
  showHistory: boolean;
  onToggleHistory: () => void;
}

const TimerPanel: React.FC<TimerPanelProps> = ({ showHistory, onToggleHistory }) => {
  const { currentPhase, timeLeft } = useTimerStore();
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

  return (
    <div className="h-full bg-lighter-navy flex flex-col relative">
      {/* Control Buttons */}
      <div className="absolute top-4 right-4 flex gap-2">
        {/* Settings Button */}
        <button
          onClick={() => setShowSettings(true)}
          className="w-10 h-10 bg-accent-surface hover:bg-accent-surface/80 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
          aria-label="Settings"
        >
          <span className="text-off-white text-lg">⚙️</span>
        </button>
        
        {/* History Toggle Button */}
        <button
          onClick={onToggleHistory}
          className="w-10 h-10 bg-accent-surface hover:bg-accent-surface/80 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
          aria-label={showHistory ? "Hide History" : "Show History"}
        >
          <span className="text-off-white text-lg">{showHistory ? "📊" : "📈"}</span>
        </button>
      </div>

      {/* Main Timer Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {/* Phase Indicator */}
        <div className="mb-3">
          <h2 className="text-lg font-medium text-gray-text text-center">
            {getPhaseLabel()}
          </h2>
        </div>

        {/* Countdown Display */}
        <div className="mb-4">
          <div className="timer-font text-6xl font-bold text-white">
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Round Tracker */}
        <div className="mb-4">
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