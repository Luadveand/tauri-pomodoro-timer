import React, { useState, useRef, useEffect } from 'react';
import { LineObject } from '../types';

interface NoteLineProps {
  line: LineObject;
  onUpdate: (id: string, updates: Partial<LineObject>) => void;
  onDelete: (id: string) => void;
  onNewLine: (afterId: string, isIndented?: boolean) => void;
  onStartEdit: (id: string) => void;
  onEndEdit: () => void;
  isEditing: boolean;
}

const NoteLine: React.FC<NoteLineProps> = ({ 
  line, 
  onUpdate, 
  onDelete, 
  onNewLine, 
  onStartEdit,
  onEndEdit,
  isEditing
}) => {
  const [editContent, setEditContent] = useState(line.content);
  const [editingIsIndented, setEditingIsIndented] = useState(line.isIndented || false);
  const inputRef = useRef<HTMLInputElement>(null);
  



  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

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
      // Both parent and child tasks can be toggled
      onUpdate(line.id, { completed: !line.completed });
    }
  };

  const handleLineStartEdit = () => {
    onStartEdit(line.id);
    setEditContent(line.content);
    setEditingIsIndented(line.isIndented || false);
  };


  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = editContent.trim();
      
      // Enhanced Enter behavior for empty child tasks
      if (trimmed === '' && editingIsIndented) {
        // Convert empty child to parent and stay in editing mode
        setEditingIsIndented(false);
        return; // Don't exit editing, don't create new line
      }
      
      // Normal Enter behavior
      if (trimmed) {
        // Preserve the current editing indentation state
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
      
      // Simple Tab cycling: Parent <-> Child — only toggle indent state, CSS handles the visual
      setEditingIsIndented(!editingIsIndented);
    } else if (e.key === 'Escape') {
      onEndEdit();
      setEditContent(line.content);
      setEditingIsIndented(line.isIndented || false);
    } else if (e.key === 'Backspace') {
      // Smart backspace behavior
      if (editContent === '' && editingIsIndented) {
        // Convert child to parent when backspacing on empty indented line
        e.preventDefault();
        setEditContent('');
        setEditingIsIndented(false);
      } else if (editContent === '' && !editingIsIndented) {
        // Delete empty parent line (existing behavior)
        e.preventDefault();
        onDelete(line.id);
      }
      // If line has content, allow normal backspace behavior
    } else if (e.key === ' ' && e.ctrlKey) {
      e.preventDefault();
      handleToggleComplete();
    }
  };

  const getDisplayContent = () => {
    if (line.type === 'note') {
      return line.content.startsWith('#') ? line.content : `# ${line.content}`;
    }
    return line.content;
  };

  const getIndentStyle = () => {
    const isIndented = isEditing ? editingIsIndented : line.isIndented;
    return isIndented ? 'ml-6' : '';
  };

  const getCompletionState = () => {
    // Each task shows its own completion state - no inheritance
    // The cascading logic is handled in the store, not the UI
    return line.completed;
  };

  if (isEditing) {
    return (
      <div className={`flex items-center gap-2 py-1 px-4 ${getIndentStyle()}`}>
        {editingIsIndented && <span className="text-gray-text/40 text-sm ml-4">└─</span>}
        {line.type === 'task' && (
          <div className="w-4 h-4 flex-shrink-0" />
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
    // Don't start editing if clicking on checkbox or delete button
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    // Only start editing if we're not already editing this line
    if (!isEditing) {
      handleLineStartEdit();
    }
  };

  return (
    <div 
      onClick={handleRowClick}
      className={`flex items-center gap-2 py-1 px-4 hover:bg-deep-navy/30 transition-colors group cursor-text ${getIndentStyle()}`}
    >
      {line.isIndented && <span className="text-gray-text/40 text-sm ml-4">└─</span>}
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
        className={`flex-1 text-sm font-mono ${
          line.type === 'note' 
            ? 'text-gray-text/80 italic' 
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