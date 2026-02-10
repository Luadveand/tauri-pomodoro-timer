import React from 'react';
import { HistoryEntry as HistoryEntryType } from '../stores/timerStore';

interface HistoryEntryProps {
  entry: HistoryEntryType;
}

const HistoryEntry: React.FC<HistoryEntryProps> = ({ entry }) => {
  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getPhaseText = (phase: string, duration: number): string => {
    const phaseNames = {
      focus: 'Focus',
      shortBreak: 'Short Break',
      longBreak: 'Long Break',
    };
    return `${phaseNames[phase as keyof typeof phaseNames]} (${duration} min)`;
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'skipped':
        return '⏭';
      case 'stopped':
        return '⏹';
      default:
        return '○';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'text-soft-green';
      case 'skipped':
      case 'stopped':
        return 'text-gray-text';
      default:
        return 'text-off-white';
    }
  };

  return (
    <div className="px-4 py-3 border-b border-gray-text/20 hover:bg-deep-navy/50 transition-colors duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-sm text-gray-text">
            {formatTime(entry.timestamp)}
          </div>
          <div className="text-sm text-off-white mt-1">
            {getPhaseText(entry.phase, entry.durationMinutes)}
          </div>
        </div>
        <div className={`text-sm ${getStatusColor(entry.status)} flex items-center gap-1`}>
          <span>{getStatusIcon(entry.status)}</span>
        </div>
      </div>
    </div>
  );
};

export default HistoryEntry;