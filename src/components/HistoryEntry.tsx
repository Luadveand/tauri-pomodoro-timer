import React, { useState } from 'react';
import { HistoryEntry as HistoryEntryType } from '../types';
import { ask } from '@tauri-apps/plugin-dialog';
import HistoryDetailModal from './HistoryDetailModal';
import { formatTime, getPhaseText, getStatusIcon, getStatusColor } from '../utils/historyHelpers';

interface HistoryEntryProps {
  entry: HistoryEntryType;
  onDelete: (id: string) => void;
}

const HistoryEntry: React.FC<HistoryEntryProps> = ({ entry, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const parseTaskCountFromString = (notes: string): { completed: number; total: number } => {
    if (!notes) return { completed: 0, total: 0 };

    const lines = notes.split('\n');
    let completed = 0;
    let total = 0;

    for (const line of lines) {
      const trimmedLine = line.trim();
      // Skip empty lines, notes (starting with #), and indented lines (children)
      if (!trimmedLine || trimmedLine.startsWith('#') || line.startsWith('\t') || line.startsWith('  ')) {
        continue;
      }

      total++;
      if (trimmedLine.startsWith('✓')) {
        completed++;
      }
    }

    return { completed, total };
  };

  const getTaskCount = (): { completed: number; total: number } => {
    if (entry.pagesSnapshot && entry.pagesSnapshot.pages.length > 0) {
      // Aggregate task counts across ALL pages
      let completed = 0;
      let total = 0;
      for (const page of entry.pagesSnapshot.pages) {
        const counts = parseTaskCountFromString(page.notes);
        completed += counts.completed;
        total += counts.total;
      }
      return { completed, total };
    }
    return parseTaskCountFromString(entry.notesSnapshot || '');
  };

  const { completed, total } = getTaskCount();


  return (
    <>
      <div 
        className="pl-4 pr-2 py-3 border-b border-gray-text/20 hover:bg-deep-navy/50 transition-colors duration-200 relative group cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-gray-text min-w-0 flex-1">
            <span className="flex-shrink-0">{formatTime(entry.timestamp)}</span>
            <span className={`${getStatusColor(entry.status)} flex-shrink-0`}>
              {getStatusIcon(entry.status)}
            </span>
            <span className="text-off-white truncate">
              {getPhaseText(entry.phase, entry.durationMinutes)}
            </span>
            {total > 0 && (
              <span className="text-gray-text/80 flex-shrink-0">
                • {completed}/{total}
              </span>
            )}
          </div>
          <button
            onClick={async (e) => {
              e.stopPropagation();
              
              try {
                const confirmed = await ask('Are you sure you want to delete this entry?', {
                  title: 'Confirm Delete',
                  kind: 'warning'
                });
                
                if (confirmed) {
                  onDelete(entry.id);
                }
              } catch (error) {
                // Fallback to browser confirm if Tauri dialog fails
                const confirmed = window.confirm('Are you sure you want to delete this entry?');
                if (confirmed) {
                  onDelete(entry.id);
                }
              }
            }}
            className="text-gray-text text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:text-tomato flex-shrink-0 ml-2"
            title="Delete entry"
          >
            🗑️
          </button>
        </div>
      </div>
      <HistoryDetailModal
        entry={entry}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default HistoryEntry;