import type { Phase, HistoryEntry } from '../types';

export type DateRangePreset = 'all' | 'today' | 'yesterday' | 'last7' | 'last30' | 'thisMonth';

export const filterHistoryEntries = (
  entries: HistoryEntry[],
  phaseFilters: Set<Phase>,
  statusFilters: Set<HistoryEntry['status']>,
  dateRange: DateRangePreset,
): HistoryEntry[] => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let dateStart: Date | null = null;
  let dateEnd: Date | null = null;

  switch (dateRange) {
    case 'today':
      dateStart = startOfToday;
      break;
    case 'yesterday': {
      dateStart = new Date(startOfToday);
      dateStart.setDate(dateStart.getDate() - 1);
      dateEnd = startOfToday;
      break;
    }
    case 'last7':
      dateStart = new Date(startOfToday);
      dateStart.setDate(dateStart.getDate() - 7);
      break;
    case 'last30':
      dateStart = new Date(startOfToday);
      dateStart.setDate(dateStart.getDate() - 30);
      break;
    case 'thisMonth':
      dateStart = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
  }

  return entries.filter((entry) => {
    if (phaseFilters.size > 0 && !phaseFilters.has(entry.phase)) return false;
    if (statusFilters.size > 0 && !statusFilters.has(entry.status)) return false;
    if (dateStart) {
      const entryDate = new Date(entry.timestamp);
      if (entryDate < dateStart) return false;
      if (dateEnd && entryDate >= dateEnd) return false;
    }
    return true;
  });
};

export const getActiveFilterCount = (
  phaseFilters: Set<Phase>,
  statusFilters: Set<HistoryEntry['status']>,
  dateRange: DateRangePreset,
): number => {
  let count = 0;
  if (phaseFilters.size > 0) count++;
  if (statusFilters.size > 0) count++;
  if (dateRange !== 'all') count++;
  return count;
};

export const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export const formatTimeFull = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const getPhaseText = (phase: string, duration: number): string => {
  const phaseNames: Record<string, string> = {
    focus: 'Focus',
    shortBreak: 'Short Break',
    longBreak: 'Long Break',
  };
  return `${phaseNames[phase] || phase} (${duration} min)`;
};

export const getStatusIcon = (status: string): string => {
  switch (status) {
    case 'completed':
      return '✅';
    case 'skipped':
      return '⏭';
    case 'stopped':
      return '⏹';
    default:
      return '○';
  }
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'completed':
      return 'text-soft-green';
    case 'skipped':
    case 'stopped':
      return 'text-gray-text';
    default:
      return 'text-off-white';
  }
};
