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
