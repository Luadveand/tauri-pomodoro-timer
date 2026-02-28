import React, { useState, useMemo, useCallback } from 'react';
import { useTimerStore } from '../stores/timerStore';
import HistoryEntry from './HistoryEntry';
import HistoryFilters from './HistoryFilters';
import { filterHistoryEntries, getActiveFilterCount, DEFAULT_DATE_RANGE } from '../utils/historyHelpers';
import type { Phase, HistoryEntry as HistoryEntryType } from '../types';
import type { DateRangeValue } from '../utils/historyHelpers';

const HistoryPanel: React.FC = () => {
  const { history, deleteHistoryEntry } = useTimerStore();

  const [phaseFilters, setPhaseFilters] = useState<Set<Phase>>(new Set());
  const [statusFilters, setStatusFilters] = useState<Set<HistoryEntryType['status']>>(new Set());
  const [dateRange, setDateRange] = useState<DateRangeValue>(DEFAULT_DATE_RANGE);

  const handleDeleteEntry = (id: string) => {
    try {
      deleteHistoryEntry(id);
    } catch (error) {
      console.error('Error deleting history entry:', error);
    }
  };

  const handleTogglePhase = useCallback((phase: Phase) => {
    setPhaseFilters((prev) => {
      const next = new Set(prev);
      if (next.has(phase)) next.delete(phase);
      else next.add(phase);
      return next;
    });
  }, []);

  const handleToggleStatus = useCallback((status: HistoryEntryType['status']) => {
    setStatusFilters((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setPhaseFilters(new Set());
    setStatusFilters(new Set());
    setDateRange(DEFAULT_DATE_RANGE);
  }, []);

  const [showFilters, setShowFilters] = useState(false);

  const filterCount = getActiveFilterCount(phaseFilters, statusFilters, dateRange);

  const filteredHistory = useMemo(
    () => filterHistoryEntries(history, phaseFilters, statusFilters, dateRange),
    [history, phaseFilters, statusFilters, dateRange],
  );

  const groupedHistory = useMemo(() => {
    const groups: { [key: string]: typeof history } = {};

    filteredHistory.forEach((entry) => {
      const date = new Date(entry.timestamp);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      let dateKey: string;

      if (date.toDateString() === today.toDateString()) {
        dateKey = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateKey = 'Yesterday';
      } else {
        dateKey = date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
        });
      }

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(entry);
    });

    return groups;
  }, [filteredHistory]);

  return (
    <div className="h-full bg-lighter-navy flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-text/20 flex items-center justify-between">
        <h3 className="text-lg font-medium text-off-white">History</h3>
        <div className="flex items-center gap-2">
          {filterCount > 0 && (
            <span className="text-xs bg-tomato/20 text-tomato px-2 py-0.5 rounded-full">
              {filterCount} {filterCount === 1 ? 'filter' : 'filters'}
            </span>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-1 rounded transition-colors hover:bg-gray-text/10"
            title="Toggle filters"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className={`w-4 h-4 ${showFilters || filterCount > 0 ? 'text-tomato' : 'text-gray-text'}`}
            >
              <path d="M1 3a1 1 0 0 1 1-1h12a1 1 0 0 1 .8 1.6L10 9.267V13a1 1 0 0 1-.553.894l-2 1A1 1 0 0 1 6 14v-4.733L1.2 3.6A1 1 0 0 1 1 3Z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <HistoryFilters
          phaseFilters={phaseFilters}
          statusFilters={statusFilters}
          dateRange={dateRange}
          onTogglePhase={handleTogglePhase}
          onToggleStatus={handleToggleStatus}
          onDateRangeChange={setDateRange}
        />
      )}

      {/* History List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {history.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-text text-sm">No history yet</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <p className="text-gray-text text-sm">No matching entries</p>
            <button
              onClick={clearAllFilters}
              className="text-xs text-tomato hover:text-tomato/80 transition-colors"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="min-h-full">
            {Object.entries(groupedHistory).map(([dateKey, entries]) => (
              <div key={dateKey}>
                {/* Date Header */}
                <div className="sticky top-0 bg-accent-surface px-4 py-2 border-b border-gray-text/20 z-10">
                  <h4 className="text-sm font-medium text-off-white">{dateKey}</h4>
                </div>
                {/* Entries */}
                {entries.map((entry) => (
                  <HistoryEntry
                    key={entry.id}
                    entry={entry}
                    onDelete={handleDeleteEntry}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPanel;
