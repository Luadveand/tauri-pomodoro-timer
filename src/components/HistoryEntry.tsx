import React, { useState } from 'react';
import { HistoryEntry as HistoryEntryType } from '../types';
import { ask } from '@tauri-apps/plugin-dialog';
import { useTimerStore } from '../stores/timerStore';
import HistoryDetailModal from './HistoryDetailModal';

interface HistoryEntryProps {
  entry: HistoryEntryType;
  onDelete: (id: string) => void;
}

const HistoryEntry: React.FC<HistoryEntryProps> = ({ entry, onDelete }) => {
  const { restoreFromHistory } = useTimerStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const parseTaskCount = (notes: string): { completed: number; total: number } => {
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


  const { completed, total } = parseTaskCount(entry.notesSnapshot || '');


  return (
    <>
      <div 
        className="px-4 py-3 border-b border-gray-text/20 hover:bg-deep-navy/50 transition-colors duration-200 relative group cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-text">
            <span>{formatTime(entry.timestamp)}</span>
            <span className={`${getStatusColor(entry.status)}`}>
              {getStatusIcon(entry.status)}
            </span>
            <span className="text-off-white">
              {getPhaseText(entry.phase, entry.durationMinutes)}
            </span>
            {total > 0 && (
              <span className="text-gray-text/80">
                • {completed}/{total} tasks
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
            className="text-gray-text text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:text-tomato flex-shrink-0"
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