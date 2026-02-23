import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Settings } from './settingsStore';
import { playNotificationSound } from '../utils/sound';
import { sendPhaseNotification } from '../utils/notifications';
import { saveHistory, clearAllData, saveActiveNotes } from '../utils/storage';
import { Phase, TimerStatus, HistoryEntry, LineObject } from '../types';

interface TimerStore {
  currentPhase: Phase;
  timeLeft: number;
  status: TimerStatus;
  currentRound: number;
  totalRounds: number;
  history: HistoryEntry[];
  activeNotes: string;
  lines: LineObject[];

  startTimer: () => void;
  pauseTimer: () => void;
  skipPhase: (settings: Settings) => void;
  setTimeLeft: (time: number) => void;
  completePhase: (settings: Settings) => void;
  nextPhase: (settings: Settings) => void;
  addHistoryEntry: (entry: HistoryEntry) => Promise<void>;
  clearHistory: () => Promise<void>;
  resetCycle: (settings: Settings) => void;
  initializeTimer: (settings: Settings) => void;
  loadHistory: (history: HistoryEntry[]) => void;
  deleteHistoryEntry: (id: string) => Promise<void>;
  resetAllData: () => Promise<void>;
  setActiveNotes: (notes: string) => Promise<void>;
  loadActiveNotes: (notes: string) => void;
  setLines: (lines: LineObject[]) => Promise<void>;
  loadLines: (lines: LineObject[]) => void;
  updateLine: (id: string, updates: Partial<LineObject>) => void;
  checkParentAutoCompletion: (lines: LineObject[], parentId: string) => LineObject[];
  cascadeParentIncompletion: (lines: LineObject[], parentId: string) => LineObject[];
  addLine: (line: Omit<LineObject, 'id'>) => void;
  deleteLine: (id: string) => void;
  parseNotesToLines: (notes: string) => LineObject[];
  linesToNotes: (lines: LineObject[]) => string;
  restoreFromHistory: (line: string, notesSnapshot?: string) => Promise<void>;
  parseLineContext: (targetLine: string, notesSnapshot: string) => { isChild: boolean; parentIndex: number; targetIndex: number };
  extractTaskHierarchy: (targetLine: string, notesSnapshot: string) => string[];
  mergeWithCurrentNotes: (tasksToRestore: string[], currentNotes: string) => string;
  reorderLines: (activeId: string, overId: string) => void;
  cleanupNotes: (settings: Settings) => void;
  savePhaseSnapshot: (settings: Settings, statusOverride?: 'completed' | 'skipped' | 'stopped') => Promise<void>;
}

export const useTimerStore = create<TimerStore>((set, get) => ({
  currentPhase: 'focus',
  timeLeft: 25 * 60, // 25 minutes in seconds
  status: 'idle',
  currentRound: 1,
  totalRounds: 4,
  history: [],
  activeNotes: '',
  lines: [],

  startTimer: () => {
    set({ status: 'running' });
  },

  pauseTimer: () => set({ status: 'paused' }),

  skipPhase: (settings: Settings) => {
    // Save snapshot at END of phase before skipping — always mark as 'skipped'
    get().savePhaseSnapshot(settings, 'skipped');
    get().nextPhase(settings);
  },

  setTimeLeft: (time) => set({ timeLeft: time }),

  completePhase: (settings: Settings) => {
    const state = get();
    // Play sound and send notification
    playNotificationSound(settings.soundEnabled);
    sendPhaseNotification(state.currentPhase, settings.notificationsEnabled);

    // Save snapshot at END of phase before completing
    get().savePhaseSnapshot(settings);
    get().nextPhase(settings);
  },

  nextPhase: (settings: Settings) => {
    const state = get();
    let nextPhase: Phase;
    let nextRound = state.currentRound;

    if (state.currentPhase === 'focus') {
      if (state.currentRound >= settings.roundsBeforeLongBreak) {
        nextPhase = 'longBreak';
      } else {
        nextPhase = 'shortBreak';
      }
    } else if (state.currentPhase === 'shortBreak') {
      nextPhase = 'focus';
      nextRound = state.currentRound + 1;
    } else {
      // longBreak
      nextPhase = 'focus';
      nextRound = 1;
    }

    set({
      currentPhase: nextPhase,
      timeLeft: getDurationForPhase(nextPhase, settings) * 60,
      status: 'idle',
      currentRound: nextRound,
      totalRounds: settings.roundsBeforeLongBreak,
    });
  },

  addHistoryEntry: async (entry) => {
    const newHistory = [entry, ...get().history];
    set({ history: newHistory });
    try {
      await saveHistory(newHistory);
    } catch (error) {
      console.error('Failed to save history:', error);
    }
  },

  clearHistory: async () => {
    set({ history: [] });
    try {
      await saveHistory([]);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  },


  resetCycle: (settings: Settings) =>
    set({
      currentPhase: 'focus',
      timeLeft: settings.focusDuration * 60,
      status: 'idle',
      currentRound: 1,
      totalRounds: settings.roundsBeforeLongBreak,
    }),

  initializeTimer: (settings: Settings) =>
    set({
      timeLeft: settings.focusDuration * 60,
      totalRounds: settings.roundsBeforeLongBreak,
    }),

  loadHistory: (history) => set({ history }),

  loadActiveNotes: (notes) => set({ activeNotes: notes }),

  deleteHistoryEntry: async (id) => {
    const currentHistory = get().history;
    const entryExists = currentHistory.some(e => e.id === id);
    
    if (!entryExists) {
      const errorMsg = `Entry not found in current history: ${id}`;
      console.error(errorMsg);
      console.error(errorMsg);
      return;
    }
    
    const entryToDelete = currentHistory.find(e => e.id === id);
    console.log(`Deleting history entry: ${entryToDelete?.phase} (${entryToDelete?.status}) from ${new Date(entryToDelete?.timestamp || '').toLocaleTimeString()}`);
    
    const newHistory = currentHistory.filter((entry) => entry.id !== id);
    set({ history: newHistory });
    
    try {
      await saveHistory(newHistory);
      console.log('History entry deleted successfully');
    } catch (error) {
      const errorMsg = `Failed to save history after deletion: ${error}`;
      console.error(errorMsg);
      console.error(errorMsg);
    }
  },

  resetAllData: async () => {
    set({
      history: [],
      status: 'idle',
      currentPhase: 'focus',
      currentRound: 1,
      totalRounds: 4,
      timeLeft: 25 * 60,
      activeNotes: '',
      lines: [],
    });
    try {
      await clearAllData();
    } catch (error) {
      console.error('Failed to reset all data:', error);
    }
  },

  setActiveNotes: async (notes) => {
    set({ activeNotes: notes });
    try {
      await saveActiveNotes(notes);
    } catch (error) {
      console.error('Failed to save active notes:', error);
    }
  },

  // Helper function to parse line context from history snapshot
  parseLineContext: (targetLine: string, notesSnapshot: string) => {
    const lines = notesSnapshot.split('\n');
    let targetIndex = -1;
    
    // Find the exact line in the snapshot
    for (let i = 0; i < lines.length; i++) {
      if (lines[i] === targetLine) {
        targetIndex = i;
        break;
      }
    }
    
    if (targetIndex === -1) {
      return { isChild: false, parentIndex: -1, targetIndex: -1 };
    }
    
    const line = lines[targetIndex];
    const isChild = line.startsWith('  ') || line.startsWith('\t');
    
    // If it's a child, find its parent
    let parentIndex = -1;
    if (isChild) {
      // Look backwards for the parent (first non-indented line)
      for (let i = targetIndex - 1; i >= 0; i--) {
        const prevLine = lines[i];
        if (prevLine.trim() && !prevLine.startsWith('  ') && !prevLine.startsWith('\t')) {
          parentIndex = i;
          break;
        }
      }
    }
    
    return { isChild, parentIndex, targetIndex };
  },

  // Helper function to extract task hierarchy based on recovery rules
  extractTaskHierarchy: (targetLine: string, notesSnapshot: string) => {
    const lines = notesSnapshot.split('\n');
    const { isChild, parentIndex, targetIndex } = get().parseLineContext(targetLine, notesSnapshot);
    
    if (targetIndex === -1) {
      return [targetLine]; // Fallback to just the line itself
    }
    
    const tasksToRestore: string[] = [];
    
    if (isChild) {
      // Rule: Child recovery restores parent + child (not siblings)
      if (parentIndex >= 0) {
        tasksToRestore.push(lines[parentIndex]); // Add parent
      }
      tasksToRestore.push(lines[targetIndex]); // Add the child itself
    } else {
      // Rule: Parent recovery restores parent + all children
      tasksToRestore.push(lines[targetIndex]); // Add the parent
      
      // Find all children (consecutive indented lines after parent)
      for (let i = targetIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('  ') || line.startsWith('\t')) {
          tasksToRestore.push(line); // Add child
        } else if (line.trim()) {
          // Hit another parent or non-indented line, stop
          break;
        }
      }
    }
    
    return tasksToRestore;
  },

  // Helper function to merge tasks with current notes, avoiding duplicates
  mergeWithCurrentNotes: (tasksToRestore: string[], currentNotes: string) => {
    const currentLines = currentNotes.split('\n');
    
    // Create a more precise duplicate detection that considers both content and indentation
    const existingTasks = new Set();
    for (const line of currentLines) {
      const trimmed = line.trim();
      if (trimmed) {
        // Store the exact task content with indentation info for precise matching
        const isIndented = line.startsWith('  ') || line.startsWith('\t');
        const taskContent = trimmed.replace(/^✓\s*/, ''); // Remove completion marker
        const key = `${isIndented ? 'child' : 'parent'}:${taskContent}`;
        existingTasks.add(key);
      }
    }
    
    // Filter out tasks that already exist exactly (same content AND same level)
    const newTasks = tasksToRestore.filter(task => {
      const trimmed = task.trim();
      if (!trimmed) return false;
      
      const isIndented = task.startsWith('  ') || task.startsWith('\t');
      const taskContent = trimmed.replace(/^✓\s*/, ''); // Remove completion marker
      const key = `${isIndented ? 'child' : 'parent'}:${taskContent}`;
      
      return !existingTasks.has(key);
    });
    
    // Add new tasks at the END, maintaining proper structure
    if (newTasks.length > 0) {
      if (currentNotes.trim()) {
        return currentNotes + '\n' + newTasks.join('\n');
      } else {
        return newTasks.join('\n');
      }
    }
    
    return currentNotes;
  },

  restoreFromHistory: async (line, notesSnapshot) => {
    const state = get();
    
    // If no snapshot provided, fallback to simple restore
    if (!notesSnapshot) {
      const newNotes = line + (state.activeNotes ? '\n' + state.activeNotes : '');
      await get().setActiveNotes(newNotes);
      return;
    }
    
    // Extract the proper task hierarchy based on recovery rules
    const tasksToRestore = get().extractTaskHierarchy(line, notesSnapshot);
    
    // Merge with current notes intelligently
    const mergedNotes = get().mergeWithCurrentNotes(tasksToRestore, state.activeNotes);
    
    // Update both string representation and lines array
    await get().setActiveNotes(mergedNotes);
    
    // Also parse and update the lines array to maintain consistency
    const newLines = get().parseNotesToLines(mergedNotes);
    set({ lines: newLines });
  },

  cleanupNotes: (settings) => {
    const state = get();
    if (!state.activeNotes || settings.keepCompletedAcrossPhases) {
      return;
    }

    const lines = state.activeNotes.split('\n');
    const cleanedLines: string[] = [];
    let i = 0;
    
    while (i < lines.length) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // Keep notes (lines starting with #)
      if (trimmedLine.startsWith('#')) {
        cleanedLines.push(line);
        i++;
        continue;
      }
      
      // Check if this is a top-level task line
      const isIndented = line.startsWith('\t') || line.startsWith('  ');
      if (!isIndented && trimmedLine) {
        // This is a top-level task - check if it's completed
        const isCompleted = trimmedLine.startsWith('✓');
        
        if (!isCompleted) {
          // Keep incomplete task and its children
          cleanedLines.push(line);
          i++;
          
          // Add any following children
          while (i < lines.length) {
            const childLine = lines[i];
            const isChildIndented = childLine.startsWith('\t') || childLine.startsWith('  ');
            if (isChildIndented) {
              cleanedLines.push(childLine);
              i++;
            } else {
              break;
            }
          }
        } else {
          // Skip completed task and its children
          i++;
          while (i < lines.length) {
            const childLine = lines[i];
            const isChildIndented = childLine.startsWith('\t') || childLine.startsWith('  ');
            if (isChildIndented) {
              i++;
            } else {
              break;
            }
          }
        }
      } else {
        // This is an orphaned child or empty line, keep it
        cleanedLines.push(line);
        i++;
      }
    }
    
    const cleanedNotes = cleanedLines.join('\n').trim();

    set({ activeNotes: cleanedNotes });
    
    // Also update the lines array to sync with the cleaned notes
    const newLines = get().parseNotesToLines(cleanedNotes);
    set({ lines: newLines });
    saveActiveNotes(cleanedNotes).catch(error => {
      console.error('Failed to save cleaned notes:', error);
    });
  },

  savePhaseSnapshot: async (settings: Settings, statusOverride?: 'completed' | 'skipped' | 'stopped') => {
    const state = get();

    const snapshotStatus = statusOverride
      ?? (state.status === 'running' ? 'completed' : (state.status === 'paused' ? 'stopped' : 'skipped'));

    const entry: HistoryEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      phase: state.currentPhase,
      durationMinutes: getDurationForPhase(state.currentPhase, settings),
      status: snapshotStatus,
      notesSnapshot: state.activeNotes,
    };

    await get().addHistoryEntry(entry);
  },

  setLines: async (lines) => {
    // Only convert to notes for storage if all lines have content
    const hasEmptyLines = lines.some(line => line.content.trim() === '');

    if (hasEmptyLines) {
      // Direct update without string conversion to preserve empty editing lines
      set({ lines });
    } else {
      // Convert to notes string for persistence but keep the existing lines array
      // with stable IDs — never round-trip through parseNotesToLines here
      const notes = get().linesToNotes(lines);

      set({ activeNotes: notes, lines });
      try {
        await saveActiveNotes(notes);
      } catch (error) {
        console.error('Failed to save lines as notes:', error);
      }
    }
  },

  loadLines: (lines) => set({ lines }),

  checkParentAutoCompletion: (lines, parentId) => {
    const parent = lines.find(line => line.id === parentId);
    if (!parent || parent.type !== 'task') {
      return lines;
    }

    const children = lines.filter(line => line.parentId === parentId && line.type === 'task');
    if (children.length === 0) {
      return lines;
    }

    const allChildrenCompleted = children.every(child => child.completed);
    
    if (allChildrenCompleted && !parent.completed) {
      const updatedLines = lines.map(line => 
        line.id === parentId ? { ...line, completed: true } : line
      );
      
      // Recursively check grandparent if this parent has a parent
      if (parent.parentId) {
        return get().checkParentAutoCompletion(updatedLines, parent.parentId);
      }
      
      return updatedLines;
    }

    return lines;
  },

  cascadeParentIncompletion: (lines, parentId) => {
    let updatedLines = lines.map(line => 
      line.id === parentId ? { ...line, completed: false } : line
    );
    
    const parent = updatedLines.find(line => line.id === parentId);
    if (parent && parent.parentId) {
      updatedLines = get().cascadeParentIncompletion(updatedLines, parent.parentId);
    }
    
    return updatedLines;
  },

  updateLine: (id, updates) => {
    const state = get();
    
    // Step 1: Apply the direct update
    let newLines = state.lines.map(line => 
      line.id === id ? { ...line, ...updates } : line
    );

    // Step 2: Handle completion state cascading
    if (updates.completed !== undefined) {
      const updatedTask = newLines.find(line => line.id === id);
      
      if (updatedTask && updatedTask.type === 'task') {
        // First: If this task has children, cascade the change to them
        const hasChildren = newLines.some(line => line.parentId === id);
        if (hasChildren) {
          newLines = newLines.map(line =>
            line.parentId === id ? { ...line, completed: updates.completed! } : line
          );
        }

        // Second: If this task has a parent, handle parent auto-completion/incompletion
        if (updatedTask.parentId) {
          if (updates.completed) {
            // Child completed - check if parent should auto-complete
            newLines = get().checkParentAutoCompletion(newLines, updatedTask.parentId);
          } else {
            // Child unchecked - cascade incompletion up the tree
            newLines = get().cascadeParentIncompletion(newLines, updatedTask.parentId);
          }
        }
      }
    }

    get().setLines(newLines);
  },

  addLine: (line) => {
    const state = get();
    const newLine: LineObject = { ...line, id: uuidv4() };
    const newLines = [...state.lines, newLine];
    get().setLines(newLines);
  },

  deleteLine: (id) => {
    const state = get();
    const newLines = state.lines.filter(line => line.id !== id);
    get().setLines(newLines);
  },

  reorderLines: (activeId, overId) => {
    if (activeId === overId) return;

    const state = get();
    const lines = [...state.lines];

    const activeIndex = lines.findIndex(l => l.id === activeId);
    const overIndex = lines.findIndex(l => l.id === overId);
    if (activeIndex === -1 || overIndex === -1) return;

    const activeLine = lines[activeIndex];

    // Collect the block to move: if it's a parent, grab its children too
    let blockToMove: LineObject[];
    let blockStartIndex = activeIndex;
    let blockLength: number;

    if (!activeLine.isIndented) {
      // Parent: collect it + all consecutive children
      blockToMove = [lines[activeIndex]];
      let i = activeIndex + 1;
      while (i < lines.length && lines[i].parentId === activeLine.id) {
        blockToMove.push(lines[i]);
        i++;
      }
      blockLength = blockToMove.length;
    } else {
      // Child: move just the single item
      blockToMove = [lines[activeIndex]];
      blockLength = 1;
    }

    // Remove the block from the array
    const remaining = [
      ...lines.slice(0, blockStartIndex),
      ...lines.slice(blockStartIndex + blockLength),
    ];

    // Find the new insert position based on overId in the remaining array
    let insertIndex = remaining.findIndex(l => l.id === overId);
    if (insertIndex === -1) {
      insertIndex = remaining.length;
    }

    // Insert after the over item if we were originally below it, before if above
    if (activeIndex > overIndex) {
      // Moving up: insert before the over item
    } else {
      // Moving down: insert after the over item (+ its children block)
      const overLine = remaining[insertIndex];
      if (overLine && !overLine.isIndented) {
        // Skip past its children
        let j = insertIndex + 1;
        while (j < remaining.length && remaining[j].parentId === overLine.id) {
          j++;
        }
        insertIndex = j;
      } else {
        insertIndex = insertIndex + 1;
      }
    }

    // Re-parent moved children if they land under a new parent
    const updatedBlock = blockToMove.map(item => {
      if (item.isIndented) {
        // Find new parent: look backwards from insert position for a non-indented line
        const linesBefore = remaining.slice(0, insertIndex);
        let newParentId: string | undefined;
        for (let k = linesBefore.length - 1; k >= 0; k--) {
          if (!linesBefore[k].isIndented && linesBefore[k].type === 'task') {
            newParentId = linesBefore[k].id;
            break;
          }
        }
        // No parent found above — promote to top-level task
        if (!newParentId) {
          return { ...item, isIndented: false, parentId: undefined };
        }
        return { ...item, parentId: newParentId };
      }
      return item;
    });

    const newLines = [
      ...remaining.slice(0, insertIndex),
      ...updatedBlock,
      ...remaining.slice(insertIndex),
    ];

    get().setLines(newLines);
  },

  parseNotesToLines: (notes) => {
    if (!notes) return [];
    
    const lines = notes.split('\n');
    const result: LineObject[] = [];
    let lastParentId: string | undefined = undefined;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines
      if (!trimmed) continue;
      
      const isIndented = line.startsWith('\t') || line.startsWith('  ');
      
      if (trimmed.startsWith('#')) {
        const lineObj: LineObject = {
          id: uuidv4(),
          content: trimmed,
          type: 'note' as const,
          completed: false,
          isIndented,
          parentId: isIndented ? lastParentId : undefined
        };
        result.push(lineObj);
        // Notes should NOT act as parents for child tasks
      } else if (!isIndented) {
        const isCompleted = trimmed.startsWith('✓');
        const content = isCompleted ? trimmed.substring(2).trim() : trimmed;
        const lineObj: LineObject = {
          id: uuidv4(),
          content,
          type: 'task' as const,
          completed: isCompleted,
          isIndented: false
        };
        result.push(lineObj);
        lastParentId = lineObj.id;
      } else {
        // Child line - can have its own completion state
        const hasCheckmark = trimmed.startsWith('✓');
        const content = hasCheckmark ? trimmed.substring(2).trim() : trimmed;
        const lineObj: LineObject = {
          id: uuidv4(),
          content,
          type: 'task' as const,
          completed: hasCheckmark, // Child tasks can have their own completion state
          isIndented: true,
          parentId: lastParentId
        };
        result.push(lineObj);
      }
    }
    
    return result;
  },

  linesToNotes: (lines) => {
    return lines
      .map(line => {
        const indent = line.isIndented ? '  ' : '';
        if (line.type === 'note') {
          const content = line.content.startsWith('#') ? line.content : `# ${line.content}`;
          return `${indent}${content}`;
        } else {
          // Each task (parent or child) uses its own completion state
          const prefix = line.completed ? '✓ ' : '';
          return `${indent}${prefix}${line.content}`;
        }
      })
      .filter(line => line.trim() !== '') // Filter after mapping to preserve structure
      .join('\n');
  },
}));

function getDurationForPhase(phase: Phase, settings: Settings): number {
  switch (phase) {
    case 'focus':
      return settings.focusDuration;
    case 'shortBreak':
      return settings.shortBreakDuration;
    case 'longBreak':
      return settings.longBreakDuration;
    default:
      return settings.focusDuration;
  }
}