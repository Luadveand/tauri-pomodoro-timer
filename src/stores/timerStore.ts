import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Settings } from './settingsStore';
import { playNotificationSound } from '../utils/sound';
import { sendPhaseNotification } from '../utils/notifications';
import { saveHistory, clearAllData, saveActiveNotes } from '../utils/storage';
import { Phase, TimerStatus, HistoryEntry, LineObject } from '../types';
import { debugLogger } from '../components/DebugPanel';

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
  stopTimer: (settings: Settings) => void;
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
  addLine: (line: Omit<LineObject, 'id'>) => void;
  deleteLine: (id: string) => void;
  parseNotesToLines: (notes: string) => LineObject[];
  linesToNotes: (lines: LineObject[]) => string;
  restoreFromHistory: (line: string) => Promise<void>;
  cleanupNotes: (settings: Settings) => void;
  savePhaseSnapshot: (settings: Settings) => Promise<void>;
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
    const state = get();
    const wasIdle = state.status === 'idle';
    // Timer started
    set({ status: 'running' });
  },

  pauseTimer: () => set({ status: 'paused' }),

  stopTimer: (settings: Settings) => {
    const state = get();
    if (state.status === 'running' || state.status === 'paused') {
      // Save snapshot at END of phase before stopping
      get().savePhaseSnapshot(settings);
      
      set({
        status: 'idle',
        timeLeft: getDurationForPhase(state.currentPhase, settings) * 60,
      });
    }
  },

  skipPhase: (settings: Settings) => {
    const state = get();
    // Save snapshot at END of phase before skipping
    get().savePhaseSnapshot(settings);
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
      debugLogger.log(errorMsg, 'error');
      return;
    }
    
    const entryToDelete = currentHistory.find(e => e.id === id);
    debugLogger.log(`Deleting history entry: ${entryToDelete?.phase} (${entryToDelete?.status}) from ${new Date(entryToDelete?.timestamp || '').toLocaleTimeString()}`);
    
    const newHistory = currentHistory.filter((entry) => entry.id !== id);
    set({ history: newHistory });
    
    try {
      await saveHistory(newHistory);
      debugLogger.log('History entry deleted successfully');
    } catch (error) {
      const errorMsg = `Failed to save history after deletion: ${error}`;
      console.error(errorMsg);
      debugLogger.log(errorMsg, 'error');
    }
  },

  resetAllData: async () => {
    set({ history: [], status: 'idle', currentPhase: 'focus', currentRound: 1, activeNotes: '' });
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

  restoreFromHistory: async (line) => {
    const state = get();
    const newNotes = line + (state.activeNotes ? '\n' + state.activeNotes : '');
    await get().setActiveNotes(newNotes);
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
    const originalLineCount = state.activeNotes.split('\n').filter(l => l.trim()).length;
    const cleanedLineCount = cleanedLines.length;
    
    
    set({ activeNotes: cleanedNotes });
    
    // Also update the lines array to sync with the cleaned notes
    const newLines = get().parseNotesToLines(cleanedNotes);
    set({ lines: newLines });
    saveActiveNotes(cleanedNotes).catch(error => {
      console.error('Failed to save cleaned notes:', error);
    });
  },

  savePhaseSnapshot: async (settings: Settings) => {
    const state = get();
    const lines = state.activeNotes.split('\n').filter(l => l.trim());
    const tasks = lines.filter(line => {
      const trimmed = line.trim();
      return !trimmed.startsWith('#') && !line.startsWith('\t') && !line.startsWith('  ');
    });
    const completedTasks = tasks.filter(line => line.trim().startsWith('✓'));
    
    const entry: HistoryEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      phase: state.currentPhase,
      durationMinutes: getDurationForPhase(state.currentPhase, settings),
      status: state.status === 'running' ? 'completed' : (state.status === 'paused' ? 'stopped' : 'skipped'),
      notesSnapshot: state.activeNotes,
    };
    
    // Snapshot saved
    
    await get().addHistoryEntry(entry);
  },

  setLines: async (lines) => {

    // Only convert to notes for storage if all lines have content
    const hasEmptyLines = lines.some(line => line.content.trim() === '');
    
    if (hasEmptyLines) {
      // Direct update without string conversion to preserve empty editing lines
      set({ lines });
    } else {
      // Normal flow with string conversion and relationship parsing
      const notes = get().linesToNotes(lines);
      const reparsedLines = get().parseNotesToLines(notes);
      
      set({ activeNotes: notes, lines: reparsedLines });
      try {
        await saveActiveNotes(notes);
      } catch (error) {
        console.error('Failed to save lines as notes:', error);
      }
    }
  },

  loadLines: (lines) => set({ lines }),

  updateLine: (id, updates) => {
    const state = get();
    
    const newLines = state.lines.map(line => {
      if (line.id === id) {
        const updatedLine = { ...line, ...updates };
        return updatedLine;
      }
      
      // If this is a child and its parent was updated, sync completion state
      if (line.parentId === id && updates.completed !== undefined) {
        return { ...line, completed: updates.completed };
      }
      
      return line;
    });
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

  parseNotesToLines: (notes) => {
    if (!notes) return [];
    
    const lines = notes.split('\n');
    const result: LineObject[] = [];
    let lastParentId: string | undefined = undefined;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip completely empty lines when parsing from storage
      if (!trimmed && notes.includes('\n')) continue;
      
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
        if (!isIndented) lastParentId = lineObj.id;
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
        // Child line - treat as task that inherits parent completion
        // Strip ✓ prefix from child content if present (children inherit completion from parent, not from their own content)
        const hasCheckmark = trimmed.startsWith('✓');
        const content = hasCheckmark ? trimmed.substring(2).trim() : trimmed;
        const lineObj: LineObject = {
          id: uuidv4(),
          content,
          type: 'task' as const,
          completed: false, // Children inherit parent state but store their own
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
          // For child tasks, use parent's completion state; for parent tasks, use their own
          let isCompleted = line.completed;
          if (line.isIndented && line.parentId) {
            const parent = lines.find(l => l.id === line.parentId);
            isCompleted = parent ? parent.completed : false;
          }
          const prefix = isCompleted ? '✓ ' : '';
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