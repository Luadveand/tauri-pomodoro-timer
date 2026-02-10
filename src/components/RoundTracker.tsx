import React from 'react';
import { useTimerStore } from '../stores/timerStore';

const RoundTracker: React.FC = () => {
  const { currentRound, totalRounds } = useTimerStore();

  const dots = Array.from({ length: totalRounds }, (_, index) => {
    const isCompleted = index < currentRound;
    const isCurrent = index + 1 === currentRound;
    
    return (
      <div
        key={index}
        className={`w-3 h-3 rounded-full transition-all duration-300 ${
          isCompleted
            ? 'bg-soft-green'
            : isCurrent
            ? 'bg-tomato'
            : 'bg-gray-text/30 border border-gray-text/50'
        }`}
      />
    );
  });

  return (
    <div className="flex items-center justify-center gap-3">
      {dots}
    </div>
  );
};

export default RoundTracker;