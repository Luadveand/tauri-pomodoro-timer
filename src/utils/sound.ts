// Simple tone generator for notification sound
export const playNotificationSound = (enabled: boolean) => {
  if (!enabled) return;

  try {
    // Use Web Audio API to generate a simple chime
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create a simple bell-like tone
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Set frequencies for a pleasant chime (major third)
    oscillator1.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator2.frequency.setValueAtTime(1000, audioContext.currentTime);
    
    // Connect oscillators to gain
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Set volume envelope
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    // Start and stop the sound
    oscillator1.start(audioContext.currentTime);
    oscillator2.start(audioContext.currentTime);
    oscillator1.stop(audioContext.currentTime + 0.5);
    oscillator2.stop(audioContext.currentTime + 0.5);
    
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