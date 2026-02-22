import { useEffect, useRef } from 'react';
import { useTimerStore } from '../stores/timerStore';
import { useSettingsStore } from '../stores/settingsStore';

export const useTimer = () => {
  const {
    status,
    timeLeft,
    setTimeLeft,
    completePhase,
    initializeTimer
  } = useTimerStore();
  const { settings } = useSettingsStore();
  const intervalRef = useRef<number | null>(null);

  // Initialize timer with current settings — only when idle and only for timer-relevant settings
  const { focusDuration, shortBreakDuration, longBreakDuration, roundsBeforeLongBreak } = settings;
  useEffect(() => {
    if (status === 'idle') {
      initializeTimer(settings);
    }
  }, [focusDuration, shortBreakDuration, longBreakDuration, roundsBeforeLongBreak, initializeTimer]);

  // Timer countdown logic
  useEffect(() => {
    if (status === 'running') {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft(timeLeft - 1);
        
        if (timeLeft <= 1) {
          // Timer reached 0, complete the phase
          completePhase(settings);
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [status, timeLeft, setTimeLeft, completePhase, settings]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
};