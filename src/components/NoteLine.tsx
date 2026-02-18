import React, { useState, useRef, useEffect } from 'react';
import { LineObject } from '../types';

interface NoteLineProps {
  line: LineObject;
  parentLine?: LineObject;
  onUpdate: (id: string, updates: Partial<LineObject>) => void;
  onDelete: (id: string) => void;
  onNewLine: (afterId: string) => void;
  onNewChildLine: (parentId: string) => void;
  onConvertToParent: (id: string) => void;
  isLast: boolean;
  startEditing?: boolean;
}

const NoteLine: React.FC<NoteLineProps> = ({ 
  line, 
  parentLine,
  onUpdate, 
  onDelete, 
  onNewLine, 
  onNewChildLine,
  onConvertToParent,
  isLast,
  startEditing = false
}) => {
  const [isEditing, setIsEditing] = useState(startEditing || line.content === '');
  const [editContent, setEditContent] = useState(line.content);
  const inputRef = useRef<HTMLInputElement>(null);
  



  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) {
      setEditContent(line.content);
    }
  }, [line.content, isEditing]);

  const handleToggleComplete = () => {
    if (line.type === 'task') {
      // Both parent and child tasks can be toggled
      onUpdate(line.id, { completed: !line.completed });
    }
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditContent(line.content);
  };

  const handleSaveEdit = () => {
    const trimmed = editContent.trim();
    if (trimmed) {
      onUpdate(line.id, { content: trimmed });
    } else {
      onDelete(line.id);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = editContent.trim();
      if (trimmed) {
        onUpdate(line.id, { content: trimmed });
      } else {
        onDelete(line.id);
        return;
      }
      
      setIsEditing(false);
      onNewLine(line.id);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      
      if (e.shiftKey) {
        // Shift+Tab to reduce indentation (existing behavior)
        if (editContent.startsWith('  ')) {
          const newContent = editContent.substring(2);
          setEditContent(newContent);
          const trimmed = newContent.trim();
          if (trimmed) {
            onUpdate(line.id, { content: newContent });
          }
        }
      } else {
        // Enhanced Tab behavior: indent current line + create child line
        const trimmed = editContent.trim();
        if (trimmed) {
          // Save current line as child (indented)
          const indentedContent = '  ' + editContent;
          onUpdate(line.id, { content: indentedContent });
          setIsEditing(false);
          
          // Create new child line after this one
          onNewChildLine(line.id);
        }
      }
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditContent(line.content);
    } else if (e.key === 'Backspace') {
      // Smart backspace behavior
      if (editContent === '' && line.isIndented) {
        // Convert child to parent when backspacing on empty indented line
        e.preventDefault();
        onConvertToParent(line.id);
      } else if (editContent === '' && !line.isIndented) {
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
    return line.isIndented ? 'ml-6' : '';
  };

  const getCompletionState = () => {
    // Each task shows its own completion state - no inheritance
    // The cascading logic is handled in the store, not the UI
    return line.completed;
  };

  if (isEditing) {
    return (
      <div className={`flex items-center gap-2 py-1 px-4 ${getIndentStyle()}`}>
        {line.isIndented && <span className="text-gray-text/40 text-sm ml-4">└─</span>}
        {line.type === 'task' && (
          <div className="w-4 h-4 flex-shrink-0" />
        )}
        <input
          ref={inputRef}
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          onBlur={handleSaveEdit}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-deep-navy text-off-white text-sm font-mono border-b border-soft-green focus:outline-none"
        />
      </div>
    );
  }

  const isCompleted = getCompletionState();

  return (
    <div className={`flex items-center gap-2 py-1 px-4 hover:bg-deep-navy/30 transition-colors group ${getIndentStyle()}`}>
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
        onClick={handleStartEdit}
        className={`flex-1 text-sm font-mono cursor-text ${
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