import { Window } from '@tauri-apps/api/window';

export const openSettingsWindow = async () => {
  try {
    const settingsWindow = new Window('settings', {
      url: '/settings',
      title: 'Settings',
      width: 400,
      height: 500,
      resizable: false,
      center: true,
      alwaysOnTop: true,
      decorations: true,
    });

    // Focus the settings window
    await settingsWindow.setFocus();
    
    return settingsWindow;
  } catch (error) {
    console.error('Error opening settings window:', error);
    return null;
  }
};