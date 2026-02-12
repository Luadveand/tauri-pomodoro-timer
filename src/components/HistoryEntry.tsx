import React from 'react';
import { HistoryEntry as HistoryEntryType } from '../types';
import { ask } from '@tauri-apps/plugin-dialog';
import { useTimerStore } from '../stores/timerStore';

interface HistoryEntryProps {
  entry: HistoryEntryType;
  onDelete: (id: string) => void;
}

const HistoryEntry: React.FC<HistoryEntryProps> = ({ entry, onDelete }) => {
  const { restoreFromHistory } = useTimerStore();
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

  const renderNotesSnapshot = () => {
    if (!entry.notesSnapshot) return null;
    
    const lines = entry.notesSnapshot.split('\n').filter(line => line.trim()).slice(0, 2); // Show first 2 non-empty lines
    if (lines.length === 0) return null;
    
    return (
      <div className="mt-1 space-y-0.5">
        {lines.map((line, index) => (
          <div
            key={index}
            className="text-xs text-gray-text/70 font-mono cursor-pointer hover:text-off-white transition-colors truncate"
            onClick={(e) => {
              e.stopPropagation();
              restoreFromHistory(line);
            }}
            title={`Click to restore: ${line}`}
          >
            {line}
          </div>
        ))}
        {entry.notesSnapshot.split('\n').filter(line => line.trim()).length > 2 && (
          <div className="text-xs text-gray-text/50 italic">+ more...</div>
        )}
      </div>
    );
  };

  const { completed, total } = parseTaskCount(entry.notesSnapshot || '');


  return (
    <div className="px-4 py-3 border-b border-gray-text/20 hover:bg-deep-navy/50 transition-colors duration-200 relative group">
      <div className="flex items-center justify-between">
        <div className="flex-1">
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
          {renderNotesSnapshot()}
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
          className="text-gray-text text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:text-tomato ml-2 flex-shrink-0"
          title="Delete entry"
        >
          🗑️
        </button>
      </div>
    </div>
  );
};

export default HistoryEntry;