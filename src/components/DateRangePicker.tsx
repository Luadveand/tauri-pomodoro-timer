import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { DateRangeValue, DateRangePreset } from '../utils/historyHelpers';
import { getDateRangeLabel } from '../utils/historyHelpers';

interface DateRangePickerProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
}

const PRESET_CHIPS: { preset: DateRangePreset; label: string }[] = [
  { preset: 'all', label: 'All Time' },
  { preset: 'today', label: 'Today' },
  { preset: 'yesterday', label: 'Yesterday' },
  { preset: 'last7', label: 'Last 7' },
  { preset: 'last30', label: 'Last 30' },
  { preset: 'thisMonth', label: 'This Month' },
];

const DAY_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const getCalendarDays = (year: number, month: number): Date[] => {
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay(); // 0=Sun
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(year, month, 1 - startOffset + i);
    days.push(d);
  }
  return days;
};

const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const isFutureDate = (date: Date): boolean => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return date > today;
};

const isInRange = (date: Date, start: Date, end: Date): boolean => {
  const d = date.getTime();
  return d >= start.getTime() && d <= end.getTime();
};

const POPOVER_ESTIMATED_HEIGHT = 280;

const DateRangePicker: React.FC<DateRangePickerProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openAbove, setOpenAbove] = useState(false);
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [pendingStart, setPendingStart] = useState<Date | null>(null);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setOpenAbove(false);
        setPendingStart(null);
        setHoveredDate(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // Auto-flip popover above trigger when it would overflow viewport
  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    setOpenAbove(spaceBelow < POPOVER_ESTIMATED_HEIGHT);
  }, [isOpen]);

  // When opening, navigate calendar to relevant month
  const handleOpen = useCallback(() => {
    if (isOpen) {
      setIsOpen(false);
      setPendingStart(null);
      setHoveredDate(null);
      return;
    }
    if (value.kind === 'custom') {
      setViewYear(value.range.start.getFullYear());
      setViewMonth(value.range.start.getMonth());
    } else {
      const n = new Date();
      setViewYear(n.getFullYear());
      setViewMonth(n.getMonth());
    }
    setPendingStart(null);
    setHoveredDate(null);
    setOpenAbove(false);
    setIsOpen(true);
  }, [isOpen, value]);

  const handlePresetClick = useCallback(
    (preset: DateRangePreset) => {
      onChange({ kind: 'preset', preset });
      setPendingStart(null);
      setHoveredDate(null);
      setOpenAbove(false);
      setIsOpen(false);
    },
    [onChange],
  );

  const handleDayClick = useCallback(
    (date: Date) => {
      if (isFutureDate(date)) return;

      if (!pendingStart) {
        setPendingStart(date);
        return;
      }

      // Second click — finalize range
      let start = pendingStart;
      let end = date;
      if (start.getTime() > end.getTime()) {
        [start, end] = [end, start];
      }
      // end is exclusive upper bound: midnight of day after end
      const exclusiveEnd = new Date(end);
      exclusiveEnd.setDate(exclusiveEnd.getDate() + 1);

      onChange({ kind: 'custom', range: { start, end: exclusiveEnd } });
      setPendingStart(null);
      setHoveredDate(null);
      setOpenAbove(false);
      setIsOpen(false);
    },
    [pendingStart, onChange],
  );

  const goToPrevMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    const n = new Date();
    const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
    const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
    // Don't allow navigating past current month
    if (nextYear > n.getFullYear() || (nextYear === n.getFullYear() && nextMonth > n.getMonth()))
      return;
    setViewMonth(nextMonth);
    setViewYear(nextYear);
  }, [viewMonth, viewYear]);

  const isNextDisabled = (() => {
    const n = new Date();
    const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
    const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
    return (
      nextYear > n.getFullYear() || (nextYear === n.getFullYear() && nextMonth > n.getMonth())
    );
  })();

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const calendarDays = getCalendarDays(viewYear, viewMonth);
  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // Determine selected range for highlighting
  let rangeStart: Date | null = null;
  let rangeEnd: Date | null = null;
  if (pendingStart && hoveredDate) {
    rangeStart =
      pendingStart.getTime() <= hoveredDate.getTime() ? pendingStart : hoveredDate;
    rangeEnd =
      pendingStart.getTime() <= hoveredDate.getTime() ? hoveredDate : pendingStart;
  } else if (!pendingStart && value.kind === 'custom') {
    rangeStart = value.range.start;
    const lastDay = new Date(value.range.end);
    lastDay.setDate(lastDay.getDate() - 1);
    rangeEnd = lastDay;
  }

  const isActivePreset = (preset: DateRangePreset): boolean =>
    value.kind === 'preset' && value.preset === preset;

  const getDayClassName = (date: Date): string => {
    const future = isFutureDate(date);
    const otherMonth = date.getMonth() !== viewMonth;
    const isToday = isSameDay(date, today);
    const isEndpoint =
      (pendingStart && isSameDay(date, pendingStart)) ||
      (rangeStart && isSameDay(date, rangeStart)) ||
      (rangeEnd && isSameDay(date, rangeEnd));
    const inRange =
      rangeStart && rangeEnd && !isEndpoint && isInRange(date, rangeStart, rangeEnd);

    if (future) return 'text-gray-text/30 cursor-not-allowed';
    if (isEndpoint && !otherMonth) return 'bg-tomato text-off-white font-medium';
    if (inRange && !otherMonth) return 'bg-tomato/20 text-off-white';
    if (isToday && !otherMonth) return 'border border-tomato/50 text-off-white hover:bg-accent-surface/50';
    if (otherMonth) return 'text-gray-text/40 hover:bg-accent-surface/30';
    return 'text-off-white hover:bg-accent-surface/50';
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger button */}
      <button
        ref={triggerRef}
        onClick={handleOpen}
        className="w-full text-xs rounded border bg-lighter-navy/80 border-gray-text/20 text-off-white px-2 py-1.5 flex items-center justify-between hover:border-gray-text/40 transition-colors text-left"
      >
        <span>{getDateRangeLabel(value)}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="currentColor"
          className={`w-3 h-3 text-gray-text transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <path
            fillRule="evenodd"
            d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Popover */}
      {isOpen && (
        <div className={`absolute left-0 right-0 z-50 bg-lighter-navy border border-gray-text/20 rounded-lg shadow-lg p-2.5 space-y-2 ${openAbove ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
          {/* Preset chips */}
          <div className="flex flex-wrap gap-1.5">
            {PRESET_CHIPS.map(({ preset, label }) => (
              <button
                key={preset}
                onClick={() => handlePresetClick(preset)}
                className={`text-[10px] rounded-full border px-2 py-0.5 transition-colors ${
                  isActivePreset(preset)
                    ? 'border-tomato bg-tomato/15 text-tomato'
                    : 'border-gray-text/30 text-gray-text hover:border-gray-text/50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Calendar */}
          <div>
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={goToPrevMonth}
                className="p-0.5 rounded hover:bg-accent-surface/50 text-gray-text hover:text-off-white transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.78 4.22a.75.75 0 0 1 0 1.06L7.06 8l2.72 2.72a.75.75 0 1 1-1.06 1.06L5.47 8.53a.75.75 0 0 1 0-1.06l3.25-3.25a.75.75 0 0 1 1.06 0Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <span className="text-xs font-medium text-off-white">{monthLabel}</span>
              <button
                onClick={goToNextMonth}
                disabled={isNextDisabled}
                className={`p-0.5 rounded transition-colors ${
                  isNextDisabled
                    ? 'text-gray-text/30 cursor-not-allowed'
                    : 'hover:bg-accent-surface/50 text-gray-text hover:text-off-white'
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-0.5">
              {DAY_HEADERS.map((d) => (
                <div key={d} className="text-[10px] text-gray-text text-center py-0.5">
                  {d}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7">
              {calendarDays.map((date, i) => (
                <button
                  key={i}
                  onClick={() => handleDayClick(date)}
                  onMouseEnter={() => pendingStart && setHoveredDate(date)}
                  onMouseLeave={() => pendingStart && setHoveredDate(null)}
                  disabled={isFutureDate(date)}
                  className={`w-7 h-6 text-[11px] rounded transition-colors ${getDayClassName(date)}`}
                >
                  {date.getDate()}
                </button>
              ))}
            </div>
          </div>

          {/* Hint text */}
          {pendingStart && (
            <p className="text-[10px] text-gray-text text-center">
              Click another date to complete range
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
