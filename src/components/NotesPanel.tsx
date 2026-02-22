import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTimerStore } from '../stores/timerStore';
import { LineObject } from '../types';
import NoteLine from './NoteLine';
import { v4 as uuidv4 } from 'uuid';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { Modifier } from '@dnd-kit/core';

const restrictToVerticalAxis: Modifier = ({ transform }) => ({
  ...transform,
  x: 0,
});

const NotesPanel: React.FC = () => {
  const {
    lines,
    setLines,
    updateLine,
    deleteLine,
    reorderLines,
  } = useTimerStore();

  const [newLineIds, setNewLineIds] = React.useState<Set<string>>(new Set());
  const [currentlyEditingId, setCurrentlyEditingId] = React.useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Configure pointer sensor with activation distance to distinguish clicks from drags
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderLines(active.id as string, over.id as string);
    }
  }, [reorderLines]);

  const activeDragLine = activeDragId ? lines.find(l => l.id === activeDragId) : null;

  // Build sortable IDs — for parent lines, use the parent ID as the sortable item
  // (children are rendered inside their parent's sortable wrapper)
  const sortableIds = lines.map(line => line.id);

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

  const handleLineUpdate = (id: string, updates: Partial<LineObject>) => {
    // Auto-detect indentation level only if not explicitly provided
    if (updates.content !== undefined && updates.isIndented === undefined) {
      const isContentIndented = updates.content.startsWith('  ');
      updates.isIndented = isContentIndented;
    }

    // If becoming a child, assign proper parentId
    if (updates.isIndented === true && !updates.parentId) {
      const currentStore = useTimerStore.getState();
      const currentLines = currentStore.lines;
      const lineIndex = currentLines.findIndex(line => line.id === id);

      if (lineIndex > 0) {
        // Find the previous parent task
        for (let i = lineIndex - 1; i >= 0; i--) {
          const previousLine = currentLines[i];
          if (!previousLine.isIndented && previousLine.type === 'task') {
            updates.parentId = previousLine.id;
            break;
          }
        }
      }
    }

    // If becoming a parent, remove parentId
    if (updates.isIndented === false) {
      updates.parentId = undefined;
    }

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

  const handleNewLine = (afterId?: string, isIndented?: boolean) => {
    const newLineId = uuidv4();

    // Use the provided indentation state or look up from store as fallback
    let newLineIndented = false;
    let newLineParentId: string | undefined = undefined;

    if (isIndented !== undefined) {
      // Use the directly passed indentation state (most reliable)
      newLineIndented = isIndented;

      // If it's indented, find the parent ID from current store
      if (isIndented && afterId) {
        const currentStore = useTimerStore.getState();
        const currentLines = currentStore.lines;
        const referenceLine = currentLines.find(line => line.id === afterId);

        // If reference line is a child, inherit its parent; if parent, make it the parent
        if (referenceLine?.isIndented) {
          newLineParentId = referenceLine.parentId;
        } else {
          newLineParentId = afterId; // Make the current line the parent
        }
      }
    } else if (afterId) {
      // Fallback: look up from store
      const fallbackStore = useTimerStore.getState();
      const fallbackLines = fallbackStore.lines;
      const referenceLine = fallbackLines.find(line => line.id === afterId);
      newLineIndented = referenceLine?.isIndented || false;
      newLineParentId = referenceLine?.parentId;
    }

    // Create new line with determined indentation level
    const newLine = {
      content: '', // Start with empty content for immediate editing
      type: 'task' as const,
      completed: false,
      isIndented: newLineIndented,
      parentId: newLineParentId
    };

    // Track this as a new line that should start editing
    setNewLineIds(prev => new Set(prev).add(newLineId));
    setCurrentlyEditingId(newLineId);

    // Get current lines for insertion logic
    const insertionStore = useTimerStore.getState();
    const currentLines = insertionStore.lines;

    if (afterId) {
      const currentIndex = currentLines.findIndex(line => line.id === afterId);

      if (currentIndex === -1) {
        console.warn('afterId not found, appending to end');
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



  const parseTaskCount = (currentLines: typeof lines): { completed: number; total: number } => {
    // Only count parent tasks (top-level tasks), not children - consistent with history entries
    const parentTasks = currentLines.filter(line => line.type === 'task' && !line.parentId);
    const completed = parentTasks.filter(task => task.completed).length;
    return { completed, total: parentTasks.length };
  };

  const { completed, total } = parseTaskCount(lines);

  // Handle clicks in empty areas to create new lines or exit editing
  const handlePanelClick = (e: React.MouseEvent) => {
    // Only handle clicks on the panel itself, not on child elements
    if (e.target === e.currentTarget) {
      if (currentlyEditingId) {
        // Exit editing mode (save via custom event)
        const saveEvent = new CustomEvent('outsideClickSave', {
          detail: { lineId: currentlyEditingId }
        });
        document.dispatchEvent(saveEvent);
        setCurrentlyEditingId(null);
      } else {
        handleNewLine();
      }
    }
  };

  // Handle starting edit on a line
  const handleStartEdit = (lineId: string) => {
    // If already editing a different line, save it first
    if (currentlyEditingId && currentlyEditingId !== lineId) {
      // Save the currently editing line automatically
      const currentEditingLine = lines.find(line => line.id === currentlyEditingId);
      if (currentEditingLine) {
        // The line will save its content via the outside click save mechanism
        const saveEvent = new CustomEvent('outsideClickSave', {
          detail: { lineId: currentlyEditingId }
        });
        document.dispatchEvent(saveEvent);
      }
    }

    // Set new line as currently editing
    setCurrentlyEditingId(lineId);
  };

  // Handle ending edit (exit editing mode)
  const handleEndEdit = () => {
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
              <div className="py-2">
                {lines.map((line) => {
                  return (
                    <NoteLine
                      key={line.id}
                      line={line}
                      onUpdate={handleLineUpdate}
                      onDelete={handleLineDelete}
                      onNewLine={handleNewLine}
                      onStartEdit={handleStartEdit}
                      onEndEdit={handleEndEdit}
                      isEditing={currentlyEditingId === line.id}
                      isDragging={activeDragId === line.id}
                    />
                  );
                })}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeDragLine ? (
                <div className="bg-lighter-navy/90 border border-soft-green/30 rounded px-4 py-1 shadow-lg">
                  <div className="flex items-center gap-2">
                    {activeDragLine.isIndented && <span className="text-gray-text/40 text-sm">└─</span>}
                    {activeDragLine.type === 'task' && (
                      <div className={`w-4 h-4 border-2 rounded-sm flex items-center justify-center flex-shrink-0 ${
                        activeDragLine.completed
                          ? 'border-soft-green bg-soft-green text-deep-navy'
                          : 'border-gray-text/40 bg-deep-navy'
                      }`}>
                        {activeDragLine.completed && <span className="text-xs leading-none font-bold">✓</span>}
                      </div>
                    )}
                    <span className={`text-sm font-mono ${
                      activeDragLine.completed ? 'text-soft-green/90 opacity-80' : 'text-off-white'
                    }`}>
                      {activeDragLine.content}
                    </span>
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
      <div className="px-4 py-2 border-t border-gray-text/10 text-xs text-gray-text/40 font-mono">
        {currentlyEditingId ? (
          <span>Enter new task · Tab indent · Esc cancel · ⌘Enter complete</span>
        ) : lines.length === 0 ? (
          <span>Click anywhere to start adding tasks</span>
        ) : (
          <span>Drag to reorder · Click to edit · Click empty space to add</span>
        )}
      </div>
    </div>
  );
};

export default NotesPanel;
