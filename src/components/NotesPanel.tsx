import React, { useEffect, useRef } from 'react';
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
  const [currentlyEditingId, setCurrentlyEditingId] = React.useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = React.useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only parse activeNotes to lines on initial load, never again
    if (activeNotes && lines.length === 0 && !hasInitialized) {
      const parsedLines = parseNotesToLines(activeNotes);
      setLines(parsedLines);
      setHasInitialized(true);
    }
  }, [activeNotes, lines.length, hasInitialized, parseNotesToLines, setLines]);

  // Handle outside clicks to exit editing mode
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        // Click was outside the Notes & Tasks panel
        // Trigger save and exit - this will be handled by NoteLine component
        if (currentlyEditingId) {
          // Create a custom event to trigger save in the currently editing line
          const saveEvent = new CustomEvent('outsideClickSave', { 
            detail: { lineId: currentlyEditingId }
          });
          document.dispatchEvent(saveEvent);
        }
        setCurrentlyEditingId(null);
      }
    };

    if (currentlyEditingId) {
      document.addEventListener('mousedown', handleOutsideClick);
      return () => {
        document.removeEventListener('mousedown', handleOutsideClick);
      };
    }
  }, [currentlyEditingId]);

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
    // Clean up tracking
    setNewLineIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
    // If this was the line being edited, exit editing mode
    if (currentlyEditingId === id) {
      setCurrentlyEditingId(null);
    }
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
    setCurrentlyEditingId(newLineId);
    
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
    setCurrentlyEditingId(newLineId);
    
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

  // Handle clicks in empty areas to create new lines
  const handlePanelClick = (e: React.MouseEvent) => {
    // Only handle clicks on the panel itself, not on child elements
    // AND only if we're not currently editing any line
    if (e.target === e.currentTarget && !currentlyEditingId) {
      handleNewLine();
    }
  };

  // Handle starting edit on a line
  const handleStartEdit = (lineId: string) => {
    // Only allow starting edit if nothing is currently being edited
    if (!currentlyEditingId) {
      setCurrentlyEditingId(lineId);
    }
  };

  // Handle ending edit (save and exit editing mode)
  const handleEndEdit = (shouldSaveContent: boolean = false, content?: string) => {
    // Save content if provided
    if (shouldSaveContent && currentlyEditingId && content !== undefined) {
      const trimmed = content.trim();
      if (trimmed) {
        updateLine(currentlyEditingId, { content: trimmed });
      } else {
        // Only delete if it's a brand new line that never had content
        if (newLineIds.has(currentlyEditingId)) {
          deleteLine(currentlyEditingId);
          setNewLineIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(currentlyEditingId);
            return newSet;
          });
        }
      }
    }
    setCurrentlyEditingId(null);
  };

  return (
    <div className="flex flex-col h-full bg-deep-navy" ref={panelRef}>
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
          Ctrl+Space to toggle task completion • Click anywhere to create tasks
        </p>
      </div>
      
      <div 
        className="flex-1 overflow-y-auto min-h-0" 
        onClick={handlePanelClick}
      >
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
                  onStartEdit={handleStartEdit}
                  onEndEdit={handleEndEdit}
                  isLast={index === lines.length - 1}
                  startEditing={newLineIds.has(line.id)}
                  isEditing={currentlyEditingId === line.id}
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