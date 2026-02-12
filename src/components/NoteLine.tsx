import React, { useState, useRef, useEffect } from 'react';
import { LineObject } from '../types';

interface NoteLineProps {
  line: LineObject;
  parentLine?: LineObject;
  onUpdate: (id: string, updates: Partial<LineObject>) => void;
  onDelete: (id: string) => void;
  onNewLine: (afterId: string) => void;
  isLast: boolean;
  startEditing?: boolean;
}

const NoteLine: React.FC<NoteLineProps> = ({ 
  line, 
  parentLine,
  onUpdate, 
  onDelete, 
  onNewLine, 
  isLast,
  startEditing = false
}) => {
  const [isEditing, setIsEditing] = useState(startEditing || line.content === '');
  const [editContent, setEditContent] = useState(line.content);
  const inputRef = useRef<HTMLInputElement>(null);
  
  console.log('🎯 NoteLine render:', { 
    lineId: line.id.substring(0, 8), 
    content: line.content, 
    startEditing, 
    isEditing: isEditing,
    shouldEdit: startEditing || line.content === ''
  });



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
    if (line.type === 'task' && !line.isIndented) {
      // Only top-level tasks can be toggled
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
      console.log('🔑 Tab pressed:', {
        currentContent: editContent,
        shiftKey: e.shiftKey,
        currentLineType: line.type,
        currentLineIndented: line.isIndented
      });
      
      // Add/remove indentation to create child/parent lines
      let newContent = editContent;
      if (e.shiftKey) {
        // Shift+Tab to reduce indentation
        if (editContent.startsWith('  ')) {
          newContent = editContent.substring(2);
          console.log('📤 Reducing indentation:', { from: editContent, to: newContent });
        }
      } else {
        // Tab to add indentation
        newContent = '  ' + editContent;
        console.log('📥 Adding indentation:', { from: editContent, to: newContent });
      }
      setEditContent(newContent);
      
      // Save the change immediately to update the line structure
      const trimmed = newContent.trim();
      if (trimmed) {
        console.log('💾 Saving indented content:', { content: newContent, trimmed });
        onUpdate(line.id, { content: newContent }); // Save with indentation
      }
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditContent(line.content);
    } else if (e.key === 'Backspace' && editContent === '') {
      e.preventDefault();
      onDelete(line.id);
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
    if (line.isIndented && parentLine) {
      return parentLine.completed; // Child inherits parent state
    }
    return line.completed;
  };

  if (isEditing) {
    return (
      <div className={`flex items-center gap-2 py-1 px-4 ${getIndentStyle()}`}>
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
  const canToggle = line.type === 'task' && !line.isIndented;

  return (
    <div className={`flex items-center gap-2 py-1 px-4 hover:bg-deep-navy/30 transition-colors group ${getIndentStyle()}`}>
      {line.type === 'task' && (
        <button
          onClick={handleToggleComplete}
          disabled={line.isIndented}
          className={`w-4 h-4 border-2 rounded-sm flex items-center justify-center flex-shrink-0 transition-all ${
            isCompleted
              ? 'border-soft-green bg-soft-green text-deep-navy'
              : line.isIndented
                ? 'border-gray-text/20 bg-deep-navy/50 cursor-not-allowed'
                : 'border-gray-text/40 bg-deep-navy hover:border-soft-green hover:bg-soft-green/10'
          }`}
          title={line.isIndented ? 'Child tasks inherit parent completion' : (isCompleted ? 'Mark as incomplete' : 'Mark as completed')}
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
              ? 'text-gray-text opacity-70' 
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