// Reusable AudioContext — avoids leak from creating one per sound play
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  // Resume if suspended (browser autoplay policy)
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

// Simple tone generator for notification sound
export const playNotificationSound = (enabled: boolean) => {
  if (!enabled) return;

  try {
    const ctx = getAudioContext();

    // Create a simple bell-like tone
    const oscillator1 = ctx.createOscillator();
    const oscillator2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // Set frequencies for a pleasant chime (major third)
    oscillator1.frequency.setValueAtTime(800, ctx.currentTime);
    oscillator2.frequency.setValueAtTime(1000, ctx.currentTime);

    // Connect oscillators to gain
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Set volume envelope
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    // Start and stop the sound
    oscillator1.start(ctx.currentTime);
    oscillator2.start(ctx.currentTime);
    oscillator1.stop(ctx.currentTime + 0.5);
    oscillator2.stop(ctx.currentTime + 0.5);

  } catch (error) {
    console.error('Error playing notification sound:', error);
    // Fallback to system beep if available
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEAOwAA');
      audio.play();
    } catch (fallbackError) {
      console.error('Fallback sound also failed:', fallbackError);
    }
  }
};