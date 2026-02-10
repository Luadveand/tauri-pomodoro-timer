import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import { Phase } from '../types';

export const initNotifications = async (): Promise<boolean> => {
  try {
    let permission = await isPermissionGranted();
    
    if (!permission) {
      const result = await requestPermission();
      permission = result === 'granted';
    }
    
    return permission;
  } catch (error) {
    console.error('Error initializing notifications:', error);
    return false;
  }
};

export const sendPhaseNotification = async (phase: Phase, enabled: boolean) => {
  if (!enabled) return;

  try {
    const messages = {
      focus: '✅ Focus session complete! Time for a break.',
      shortBreak: '☕ Short break over! Ready to focus?',
      longBreak: '🎉 Long break time! You completed your focus rounds!',
    };

    await sendNotification({
      title: 'Pomodoro Timer',
      body: messages[phase] || 'Phase completed!',
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};