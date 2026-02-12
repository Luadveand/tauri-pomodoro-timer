export type Phase = 'focus' | 'shortBreak' | 'longBreak';
export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface HistoryEntry {
    id: string;
    timestamp: string;
    phase: Phase;
    durationMinutes: number;
    status: 'completed' | 'skipped' | 'stopped';
    notesSnapshot?: string;
}

export interface LineObject {
    id: string;
    content: string;
    type: 'note' | 'task';
    completed: boolean;
    isIndented?: boolean;
    parentId?: string;
}
