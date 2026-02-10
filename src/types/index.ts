export type Phase = 'focus' | 'shortBreak' | 'longBreak';
export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface HistoryEntry {
    id: string;
    timestamp: string;
    phase: Phase;
    durationMinutes: number;
    status: 'completed' | 'skipped' | 'stopped';
}
