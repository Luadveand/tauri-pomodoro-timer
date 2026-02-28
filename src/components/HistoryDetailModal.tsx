import React, { useState, useEffect } from 'react';
import { HistoryEntry } from '../types';
import { useTimerStore } from '../stores/timerStore';
import { formatTimeFull, getPhaseText, getStatusIcon, getStatusColor } from '../utils/historyHelpers';

interface HistoryDetailModalProps {
  entry: HistoryEntry;
  isOpen: boolean;
  onClose: () => void;
}

const HistoryDetailModal: React.FC<HistoryDetailModalProps> = ({ entry, isOpen, onClose }) => {
  const { restoreFromHistory } = useTimerStore();
  const [activeSnapshotPageId, setActiveSnapshotPageId] = useState<string | null>(null);

  // Initialize active snapshot page when modal opens with pagesSnapshot
  useEffect(() => {
    if (isOpen && entry.pagesSnapshot) {
      setActiveSnapshotPageId(entry.pagesSnapshot.activePageId);
    } else if (isOpen) {
      setActiveSnapshotPageId(null);
    }
  }, [isOpen, entry]);

  if (!isOpen) return null;

  const hasPagesSnapshot = !!entry.pagesSnapshot && entry.pagesSnapshot.pages.length > 0;

  // Get the notes string for the currently viewed page (or legacy notesSnapshot)
  const getCurrentNotesString = (): string | undefined => {
    if (hasPagesSnapshot && activeSnapshotPageId) {
      const page = entry.pagesSnapshot!.pages.find(p => p.id === activeSnapshotPageId);
      return page?.notes;
    }
    return entry.notesSnapshot;
  };

  const renderNotesFromString = (notes?: string) => {
    if (!notes) return <p className="text-gray-text/70 text-sm italic">No notes for this session</p>;

    const lines = notes.split('\n');
    if (lines.length === 0) return <p className="text-gray-text/70 text-sm italic">No notes for this session</p>;

    return (
      <div className="space-y-1 max-h-60 overflow-y-auto">
        {lines.map((line, index) => {
          const trimmedLine = line.trim();
          if (!trimmedLine) return <div key={index} className="h-2" />;

          const isCompleted = trimmedLine.startsWith('✓');
          const isChild = line.startsWith('  ') || line.startsWith('\t');
          const isNote = trimmedLine.startsWith('#');

          return (
            <div
              key={index}
              className={`text-sm font-mono cursor-pointer transition-colors flex items-center gap-2 p-1 rounded hover:bg-deep-navy/30 ${
                isCompleted
                  ? 'text-soft-green/90'
                  : isNote
                    ? 'text-gray-text/80 italic'
                    : 'text-off-white'
              }`}
              onClick={() => {
                restoreFromHistory(line, getCurrentNotesString());
                onClose();
              }}
              title={`Click to restore: ${line}`}
            >
              {isChild && <span className="text-gray-text/40 text-sm ml-4">└─</span>}
              {!isChild && !isNote && (
                <span className={`w-3 h-3 border rounded-sm flex items-center justify-center text-xs flex-shrink-0 ${
                  isCompleted
                    ? 'border-soft-green bg-soft-green text-deep-navy'
                    : 'border-gray-text/40'
                }`}>
                  {isCompleted && '✓'}
                </span>
              )}
              <span className={isCompleted ? 'opacity-80' : ''}>
                {isCompleted ? trimmedLine.replace(/^✓\s*/, '') : trimmedLine}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderPageTabs = () => {
    if (!hasPagesSnapshot) return null;

    return (
      <div className="flex overflow-x-auto tab-scrollbar border-b border-gray-text/20 mb-3">
        {entry.pagesSnapshot!.pages.map((page) => {
          const isActive = page.id === activeSnapshotPageId;
          const wasOriginallyActive = page.id === entry.pagesSnapshot!.activePageId;
          return (
            <button
              key={page.id}
              onClick={() => setActiveSnapshotPageId(page.id)}
              className={`whitespace-nowrap flex-shrink-0 px-3 py-1.5 text-xs font-mono transition-colors ${
                isActive
                  ? 'border-b-2 border-soft-green text-off-white bg-deep-navy/50'
                  : 'text-gray-text hover:text-off-white hover:bg-deep-navy/30 border-b-2 border-transparent'
              }`}
            >
              {page.name}
              {wasOriginallyActive && (
                <span className="ml-1 text-soft-green/60" title="Active page during session">*</span>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-lighter-navy border border-gray-text/20 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-text/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-medium text-off-white">Session Details</h2>
              <div className="flex items-center gap-2 text-sm text-gray-text mt-1">
                <span>{formatTimeFull(entry.timestamp)}</span>
                <span className={`${getStatusColor(entry.status)}`}>
                  {getStatusIcon(entry.status)}
                </span>
                <span className="text-off-white">
                  {getPhaseText(entry.phase, entry.durationMinutes)}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-text hover:text-off-white transition-colors text-2xl"
              title="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <h3 className="text-lg font-medium text-off-white mb-3">Notes & Tasks</h3>
          {renderPageTabs()}
          {renderNotesFromString(getCurrentNotesString())}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-text/20 bg-accent-surface/30">
          <p className="text-xs text-gray-text/70">
            Click on any item to restore it to your current notes panel
          </p>
        </div>
      </div>
    </div>
  );
};

export default HistoryDetailModal;
