import type { Phase, HistoryEntry } from '../types';

export type DateRangePreset = 'all' | 'today' | 'yesterday' | 'last7' | 'last30' | 'thisMonth';

export interface CustomDateRange {
  start: Date; // Midnight of start day
  end: Date; // Midnight of day AFTER end day (exclusive upper bound)
}

export type DateRangeValue =
  | { kind: 'preset'; preset: DateRangePreset }
  | { kind: 'custom'; range: CustomDateRange };

export const DEFAULT_DATE_RANGE: DateRangeValue = { kind: 'preset', preset: 'all' };

const presetLabels: Record<DateRangePreset, string> = {
  all: 'All Time',
  today: 'Today',
  yesterday: 'Yesterday',
  last7: 'Last 7 Days',
  last30: 'Last 30 Days',
  thisMonth: 'This Month',
};

const formatShortDate = (date: Date): string =>
  date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export const getDateRangeLabel = (value: DateRangeValue): string => {
  if (value.kind === 'preset') return presetLabels[value.preset];
  const { start, end } = value.range;
  // end is exclusive, so the last included day is end - 1 day
  const lastDay = new Date(end);
  lastDay.setDate(lastDay.getDate() - 1);
  if (start.getTime() === lastDay.getTime()) return formatShortDate(start);
  return `${formatShortDate(start)} – ${formatShortDate(lastDay)}`;
};

const resolvePresetDates = (
  preset: DateRangePreset,
): { dateStart: Date | null; dateEnd: Date | null } => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'today':
      return { dateStart: startOfToday, dateEnd: null };
    case 'yesterday': {
      const start = new Date(startOfToday);
      start.setDate(start.getDate() - 1);
      return { dateStart: start, dateEnd: startOfToday };
    }
    case 'last7': {
      const start = new Date(startOfToday);
      start.setDate(start.getDate() - 7);
      return { dateStart: start, dateEnd: null };
    }
    case 'last30': {
      const start = new Date(startOfToday);
      start.setDate(start.getDate() - 30);
      return { dateStart: start, dateEnd: null };
    }
    case 'thisMonth':
      return { dateStart: new Date(now.getFullYear(), now.getMonth(), 1), dateEnd: null };
    default:
      return { dateStart: null, dateEnd: null };
  }
};

export const filterHistoryEntries = (
  entries: HistoryEntry[],
  phaseFilters: Set<Phase>,
  statusFilters: Set<HistoryEntry['status']>,
  dateRange: DateRangeValue,
): HistoryEntry[] => {
  let dateStart: Date | null = null;
  let dateEnd: Date | null = null;

  if (dateRange.kind === 'preset') {
    ({ dateStart, dateEnd } = resolvePresetDates(dateRange.preset));
  } else {
    dateStart = dateRange.range.start;
    dateEnd = dateRange.range.end;
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
  dateRange: DateRangeValue,
): number => {
  let count = 0;
  if (phaseFilters.size > 0) count++;
  if (statusFilters.size > 0) count++;
  if (dateRange.kind === 'custom' || (dateRange.kind === 'preset' && dateRange.preset !== 'all'))
    count++;
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
