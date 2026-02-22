import React from 'react';
import { useTimerStore } from '../stores/timerStore';
import { useSettingsStore } from '../stores/settingsStore';

const Controls: React.FC = () => {
  const { status, currentPhase, startTimer, pauseTimer, skipPhase, cleanupNotes } = useTimerStore();
  const { settings } = useSettingsStore();

  const handleStartClick = () => {
    const wasIdle = status === 'idle';
    
    // Run cleanup BEFORE starting if this is a new Focus session
    if (currentPhase === 'focus' && wasIdle) {
      cleanupNotes(settings);
    }
    
    startTimer();
  };

  const handleSkipClick = () => {
    skipPhase(settings);
  };

  return (
    <div className="flex items-center justify-center gap-4 mt-4">
      {status === 'idle' || status === 'paused' ? (
        <button
          onClick={handleStartClick}
          className="w-14 h-14 bg-tomato hover:bg-tomato/80 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
          aria-label="Start timer"
        >
          <span className="text-white text-2xl ml-1">▶</span>
        </button>
      ) : (
        <button
          onClick={pauseTimer}
          className="w-14 h-14 bg-tomato hover:bg-tomato/80 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
          aria-label="Pause timer"
        >
          <span className="text-white text-xl">⏸</span>
        </button>
      )}

      <button
        onClick={handleSkipClick}
        className="w-12 h-12 bg-accent-surface hover:bg-accent-surface/80 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
        aria-label="Skip phase"
      >
        <span className="text-off-white text-lg">⏭</span>
      </button>
    </div>
  );
};

export default Controls;