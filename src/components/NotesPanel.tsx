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
    
    
    // Track this as a new line that should start editing
    setNewLineIds(prev => new Set(prev).add(newLineId));
    
    // Use a callback to get the most current state
    const currentStore = useTimerStore.getState();
    const currentLines = currentStore.lines;
    
    
    if (afterId) {
      const currentIndex = currentLines.findIndex(line => line.id === afterId);
      
      if (currentIndex === -1) {
        console.warn('⚠️ afterId not found, appending to end');
        const newLines = [...currentLines, { ...newLine, id: newLineId }];
        setLines(newLines);
      } else {
        const newLines = [...currentLines];
        newLines.splice(currentIndex + 1, 0, { ...newLine, id: newLineId });
        setLines(newLines);
      }
    } else {
      const newLines = [...currentLines, { ...newLine, id: newLineId }];
      setLines(newLines);
    }
  };

  const handleAddFirstLine = () => {
    handleNewLine();
  };

  const handleNewChildLine = (parentId: string) => {
    const newLineId = uuidv4();
    const newLine = {
      content: '', // Start with empty content for immediate editing
      type: 'task' as const,
      completed: false,
      isIndented: true // Child lines are indented
    };
    
    // Track this as a new line that should start editing
    setNewLineIds(prev => new Set(prev).add(newLineId));
    
    // Get current state and find parent line
    const currentStore = useTimerStore.getState();
    const currentLines = currentStore.lines;
    const parentIndex = currentLines.findIndex(line => line.id === parentId);
    
    if (parentIndex === -1) {
      console.warn('⚠️ parentId not found, appending to end');
      const newLines = [...currentLines, { ...newLine, id: newLineId }];
      setLines(newLines);
    } else {
      // Insert new child line after the parent
      const newLines = [...currentLines];
      newLines.splice(parentIndex + 1, 0, { ...newLine, id: newLineId });
      setLines(newLines);
    }
  };

  const handleConvertToParent = (lineId: string) => {
    const currentStore = useTimerStore.getState();
    const currentLines = currentStore.lines;
    const lineIndex = currentLines.findIndex(line => line.id === lineId);
    
    if (lineIndex === -1) {
      console.warn('⚠️ lineId not found for conversion');
      return;
    }
    
    const line = currentLines[lineIndex];
    
    // Convert child to parent by removing indentation and parentId
    const updatedLine = {
      ...line,
      isIndented: false,
      parentId: undefined,
      content: line.content.startsWith('  ') ? line.content.substring(2) : line.content
    };
    
    const newLines = [...currentLines];
    newLines[lineIndex] = updatedLine;
    setLines(newLines);
  };

  const parseTaskCount = (currentLines: typeof lines): { completed: number; total: number } => {
    // Only count parent tasks (top-level tasks), not children - consistent with history entries
    const parentTasks = currentLines.filter(line => line.type === 'task' && !line.parentId);
    const completed = parentTasks.filter(task => task.completed).length;
    return { completed, total: parentTasks.length };
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
                  onNewChildLine={handleNewChildLine}
                  onConvertToParent={handleConvertToParent}
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