import React from 'react';
import { useTimerStore } from '../stores/timerStore';
import HistoryEntry from './HistoryEntry';

const HistoryPanel: React.FC = () => {
  const { history, deleteHistoryEntry } = useTimerStore();

  const handleDeleteEntry = (id: string) => {
    try {
      deleteHistoryEntry(id);
    } catch (error) {
      console.error('Error deleting history entry:', error);
    }
  };


  const groupedHistory = React.useMemo(() => {
    const groups: { [key: string]: typeof history } = {};

    history.forEach((entry) => {
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
  }, [history]);

  return (
    <div className="h-full bg-lighter-navy flex flex-col">
      {/* Header */}
      <div className="px-4 py-2 border-b border-gray-text/20">
        <h3 className="text-lg font-medium text-off-white">History</h3>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto">
        {history.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-text text-sm">No history yet</p>
          </div>
        ) : (
          <div>
            {Object.entries(groupedHistory).map(([dateKey, entries]) => (
              <div key={dateKey}>
                {/* Date Header */}
                <div className="sticky top-0 bg-accent-surface px-4 py-2 border-b border-gray-text/20">
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