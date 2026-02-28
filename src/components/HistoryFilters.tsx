import React from 'react';
import type { Phase, HistoryEntry } from '../types';
import type { DateRangeValue } from '../utils/historyHelpers';
import DateRangePicker from './DateRangePicker';

interface HistoryFiltersProps {
  phaseFilters: Set<Phase>;
  statusFilters: Set<HistoryEntry['status']>;
  dateRange: DateRangeValue;
  onTogglePhase: (phase: Phase) => void;
  onToggleStatus: (status: HistoryEntry['status']) => void;
  onDateRangeChange: (range: DateRangeValue) => void;
}

const phaseOptions: { value: Phase; label: string }[] = [
  { value: 'focus', label: 'Focus' },
  { value: 'shortBreak', label: 'Short Break' },
  { value: 'longBreak', label: 'Long Break' },
];

const statusOptions: { value: HistoryEntry['status']; label: string; icon: string }[] = [
  { value: 'completed', label: 'Completed', icon: '✅' },
  { value: 'skipped', label: 'Skipped', icon: '⏭' },
  { value: 'stopped', label: 'Stopped', icon: '⏹' },
];

const HistoryFilters: React.FC<HistoryFiltersProps> = ({
  phaseFilters,
  statusFilters,
  dateRange,
  onTogglePhase,
  onToggleStatus,
  onDateRangeChange,
}) => {
  return (
    <div className="px-4 py-2 border-b border-gray-text/20 space-y-2">
      {/* Phase chips */}
      <div className="flex flex-wrap gap-1.5">
        {phaseOptions.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onTogglePhase(value)}
            className={`text-xs rounded-full border px-2.5 py-0.5 transition-colors ${
              phaseFilters.has(value)
                ? 'border-tomato bg-tomato/15 text-tomato'
                : 'border-gray-text/30 text-gray-text hover:border-gray-text/50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Status chips */}
      <div className="flex flex-wrap gap-1.5">
        {statusOptions.map(({ value, label, icon }) => (
          <button
            key={value}
            onClick={() => onToggleStatus(value)}
            className={`text-xs rounded-full border px-2.5 py-0.5 transition-colors ${
              statusFilters.has(value)
                ? 'border-tomato bg-tomato/15 text-tomato'
                : 'border-gray-text/30 text-gray-text hover:border-gray-text/50'
            }`}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Date range picker */}
      <div>
        <DateRangePicker value={dateRange} onChange={onDateRangeChange} />
      </div>
    </div>
  );
};

export default HistoryFilters;
