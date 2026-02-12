import React, { useEffect } from 'react';
import { useTimerStore } from '../stores/timerStore';
import NoteLine from './NoteLine';
import { v4 as uuidv4 } from 'uuid';

const NotesPanel: React.FC = () => {
  const { 
    lines, 
    setLines, 
    updateLine, 
    deleteLine, 
    addLine, 
    parseNotesToLines, 
    activeNotes 
  } = useTimerStore();
  
  const [newLineIds, setNewLineIds] = React.useState<Set<string>>(new Set());

  const [hasInitialized, setHasInitialized] = React.useState(false);

  useEffect(() => {
    // Only parse activeNotes to lines on initial load, never again
    if (activeNotes && lines.length === 0 && !hasInitialized) {
      const parsedLines = parseNotesToLines(activeNotes);
      setLines(parsedLines);
      setHasInitialized(true);
    }
  }, [activeNotes, lines.length, hasInitialized, parseNotesToLines, setLines]);

  const handleLineUpdate = (id: string, updates: Partial<any>) => {
    updateLine(id, updates);
    // Remove from new line tracking once it's been updated
    if (newLineIds.has(id)) {
      setNewLineIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleLineDelete = (id: string) => {
    deleteLine(id);
  };

  const handleNewLine = (afterId?: string) => {
    const newLineId = uuidv4();
    const newLine = {
      content: '', // Start with empty content for immediate editing
      type: 'task' as const,
      completed: false
    };
    
    console.log('📝 Creating new line for editing:', { newLineId, afterId });
    
    // Track this as a new line that should start editing
    setNewLineIds(prev => new Set(prev).add(newLineId));
    
    // Use a callback to get the most current state
    const currentStore = useTimerStore.getState();
    const currentLines = currentStore.lines;
    
    console.log('📝 Current lines before insertion:', currentLines.map(l => ({ 
      id: l.id.substring(0, 8), 
      content: `"${l.content}"` 
    })));
    
    if (afterId) {
      const currentIndex = currentLines.findIndex(line => line.id === afterId);
      console.log('📝 Found afterId at index:', currentIndex, 'of', currentLines.length);
      
      if (currentIndex === -1) {
        console.warn('⚠️ afterId not found, appending to end');
        const newLines = [...currentLines, { ...newLine, id: newLineId }];
        setLines(newLines);
      } else {
        const newLines = [...currentLines];
        newLines.splice(currentIndex + 1, 0, { ...newLine, id: newLineId });
        console.log('📝 Adding line after index:', currentIndex, 'New array:', newLines.map(l => ({ 
          id: l.id.substring(0, 8), 
          content: `"${l.content}"` 
        })));
        setLines(newLines);
      }
    } else {
      const newLines = [...currentLines, { ...newLine, id: newLineId }];
      console.log('📝 Adding line to end. Current lines:', currentLines.length, 'New lines:', newLines.length);
      setLines(newLines);
    }
  };

  const handleAddFirstLine = () => {
    console.log('🆕 Add first task clicked, lines.length:', lines.length);
    handleNewLine();
  };

  const parseTaskCount = (currentLines: typeof lines): { completed: number; total: number } => {
    const tasks = currentLines.filter(line => line.type === 'task');
    const completed = tasks.filter(task => task.completed).length;
    return { completed, total: tasks.length };
  };

  const { completed, total } = parseTaskCount(lines);

  return (
    <div className="flex flex-col h-full bg-deep-navy">
      <div className="px-4 py-3 border-b border-gray-text/20">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-off-white">Notes & Tasks</h3>
          {total > 0 && (
            <span className="text-sm text-gray-text">
              {completed}/{total} completed
            </span>
          )}
        </div>
        <p className="text-xs text-gray-text/70 mt-1">
          Ctrl+Space to toggle task completion • Click to edit
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto min-h-0">
        {lines.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <p className="text-gray-text text-sm mb-4">No notes or tasks yet</p>
            <button
              onClick={handleAddFirstLine}
              className="text-soft-green text-sm hover:text-off-white transition-colors"
            >
              + Add your first task
            </button>
          </div>
        ) : (
          <div className="py-2">
            {lines.map((line, index) => {
              const parentLine = line.parentId ? lines.find(l => l.id === line.parentId) : undefined;
              return (
                <NoteLine
                  key={line.id}
                  line={line}
                  parentLine={parentLine}
                  onUpdate={handleLineUpdate}
                  onDelete={handleLineDelete}
                  onNewLine={handleNewLine}
                  isLast={index === lines.length - 1}
                  startEditing={newLineIds.has(line.id)}
                />
              );
            })}
            <div className="px-4 py-2">
              <button
                onClick={() => handleNewLine()}
                className="text-gray-text/50 text-sm hover:text-soft-green transition-colors"
              >
                + Add new line
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesPanel;