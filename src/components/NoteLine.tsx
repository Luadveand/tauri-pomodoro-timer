import React, { useState, useRef, useEffect } from 'react';
import { LineObject } from '../types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface NoteLineProps {
  line: LineObject;
  onUpdate: (id: string, updates: Partial<LineObject>) => void;
  onDelete: (id: string) => void;
  onNewLine: (afterId: string, isIndented?: boolean) => void;
  onStartEdit: (id: string) => void;
  onEndEdit: () => void;
  isEditing: boolean;
  isDragging?: boolean;
}

const NoteLine: React.FC<NoteLineProps> = ({
  line,
  onUpdate,
  onDelete,
  onNewLine,
  onStartEdit,
  onEndEdit,
  isEditing,
  isDragging = false,
}) => {
  const [editContent, setEditContent] = useState(line.content);
  const [editingIsIndented, setEditingIsIndented] = useState(line.isIndented || false);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: line.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  // Refocus input after a drag completes while still in editing mode
  useEffect(() => {
    if (!isDragging && isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isDragging, isEditing]);

  // Preserve focus when line data changes (e.g., during Tab operations)
  useEffect(() => {
    if (isEditing && inputRef.current && document.activeElement !== inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing, line.isIndented, line.content]);

  // Listen for outside click save events
  useEffect(() => {
    const handleOutsideClickSave = (event: CustomEvent) => {
      if (isEditing && event.detail.lineId === line.id) {
        // Save current content when outside click occurs
        const trimmed = editContent.trim();
        if (trimmed) {
          onUpdate(line.id, { content: trimmed, isIndented: editingIsIndented });
        } else {
          onDelete(line.id);
        }
      }
    };

    if (isEditing) {
      document.addEventListener('outsideClickSave', handleOutsideClickSave as EventListener);
      return () => {
        document.removeEventListener('outsideClickSave', handleOutsideClickSave as EventListener);
      };
    }
  }, [isEditing, editContent, editingIsIndented, line.id, onUpdate, onDelete]);

  useEffect(() => {
    if (!isEditing) {
      setEditContent(line.content);
      setEditingIsIndented(line.isIndented || false);
    }
  }, [line.content, line.isIndented, isEditing]);

  const handleToggleComplete = () => {
    if (line.type === 'task') {
      onUpdate(line.id, { completed: !line.completed });
    }
  };

  const handleLineStartEdit = () => {
    onStartEdit(line.id);
    setEditContent(line.content);
    setEditingIsIndented(line.isIndented || false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleToggleComplete();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = editContent.trim();

      if (trimmed === '' && editingIsIndented) {
        setEditingIsIndented(false);
        return;
      }

      if (trimmed) {
        onUpdate(line.id, {
          content: trimmed,
          isIndented: editingIsIndented
        });
      } else {
        onDelete(line.id);
        return;
      }

      onEndEdit();
      onNewLine(line.id, editingIsIndented);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      setEditingIsIndented(!editingIsIndented);
    } else if (e.key === 'Escape') {
      onEndEdit();
      setEditContent(line.content);
      setEditingIsIndented(line.isIndented || false);
    } else if (e.key === 'Backspace') {
      if (editContent === '' && editingIsIndented) {
        e.preventDefault();
        setEditContent('');
        setEditingIsIndented(false);
      } else if (editContent === '' && !editingIsIndented) {
        e.preventDefault();
        onDelete(line.id);
      }
    }
  };

  const getDisplayContent = () => {
    if (line.type === 'note') {
      // Strip the # prefix for display
      if (line.content.startsWith('#')) {
        return line.content.substring(1);
      }
      return line.content;
    }
    return line.content;
  };

  const getIndentStyle = () => {
    const isIndented = isEditing ? editingIsIndented : line.isIndented;
    return isIndented ? 'ml-6' : '';
  };

  const getCompletionState = () => {
    return line.completed;
  };

  // Drag handle — 6-dot grip icon, always visible
  const DragHandle = () => (
    <button
      className="flex items-center justify-center w-5 h-5 flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-text/40 hover:text-gray-text/70 transition-colors touch-none"
      {...attributes}
      {...listeners}
      tabIndex={-1}
      aria-label="Drag to reorder"
    >
      <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
        <circle cx="3" cy="2" r="1.2" />
        <circle cx="7" cy="2" r="1.2" />
        <circle cx="3" cy="7" r="1.2" />
        <circle cx="7" cy="7" r="1.2" />
        <circle cx="3" cy="12" r="1.2" />
        <circle cx="7" cy="12" r="1.2" />
      </svg>
    </button>
  );

  if (isEditing) {
    return (
      <div ref={setNodeRef} style={style} className={`flex items-center gap-2 py-1 px-2 group ${getIndentStyle()}`}>
        <DragHandle />
        {editingIsIndented && <span className="text-gray-text/40 text-sm">└─</span>}
        {line.type === 'task' && (
          <button
            onClick={handleToggleComplete}
            className={`w-4 h-4 border-2 rounded-sm flex items-center justify-center flex-shrink-0 transition-all ${
              line.completed
                ? 'border-soft-green bg-soft-green text-deep-navy'
                : 'border-gray-text/40 bg-deep-navy hover:border-soft-green hover:bg-soft-green/10'
            }`}
            title={line.completed ? 'Mark as incomplete' : 'Mark as completed'}
          >
            {line.completed && <span className="text-xs leading-none font-bold">✓</span>}
          </button>
        )}
        <input
          ref={inputRef}
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-deep-navy text-off-white text-sm font-mono border-b border-soft-green focus:outline-none"
        />
      </div>
    );
  }

  const isCompleted = getCompletionState();

  const handleRowClick = (e: React.MouseEvent) => {
    // Don't start editing if clicking on drag handle, checkbox, or delete button
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    if (!isEditing) {
      handleLineStartEdit();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleRowClick}
      className={`flex items-center gap-2 py-1 px-2 hover:bg-deep-navy/30 transition-colors group ${getIndentStyle()}`}
    >
      <DragHandle />
      {line.isIndented && <span className="text-gray-text/40 text-sm">└─</span>}
      {line.type === 'task' && (
        <button
          onClick={handleToggleComplete}
          className={`w-4 h-4 border-2 rounded-sm flex items-center justify-center flex-shrink-0 transition-all ${
            isCompleted
              ? 'border-soft-green bg-soft-green text-deep-navy'
              : 'border-gray-text/40 bg-deep-navy hover:border-soft-green hover:bg-soft-green/10'
          }`}
          title={isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
        >
          {isCompleted && <span className="text-xs leading-none font-bold">✓</span>}
        </button>
      )}

      <div
        className={`flex-1 text-sm font-mono cursor-text ${
          line.type === 'note'
            ? 'text-off-white'
            : isCompleted
              ? 'text-soft-green/90 opacity-80'
              : 'text-off-white'
        }`}
      >
        {getDisplayContent()}
      </div>

      <button
        onClick={() => onDelete(line.id)}
        className="text-gray-text text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:text-tomato"
        title="Delete line"
      >
        ×
      </button>
    </div>
  );
};

export default NoteLine;
