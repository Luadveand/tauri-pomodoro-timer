import { useEffect } from 'react';
import TimerPanel from './components/TimerPanel';
import HistoryPanel from './components/HistoryPanel';
import NotesPanel from './components/NotesPanel';
import SettingsPanel from './components/SettingsPanel';
import { useSettingsStore } from './stores/settingsStore';
import { useTimerStore } from './stores/timerStore';
import { loadAppData, testStore } from './utils/storage';
import { initNotifications } from './utils/notifications';

const isTauriApp = () => typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined;

function MainApp() {
  const { loadSettings, settings } = useSettingsStore();
  const { loadHistory, loadActiveNotes, parseNotesToLines, loadLines } = useTimerStore();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('App initializing...');
        // Test store functionality first
        await testStore();
        console.log('Store test completed');
        
        // Load persisted data
        const appData = await loadAppData();
        loadSettings(appData.settings);
        loadHistory(appData.history);
        loadActiveNotes(appData.activeNotes);
        
        // Parse existing notes to lines for new line-based UI
        if (appData.activeNotes) {
          const parsedLines = parseNotesToLines(appData.activeNotes);
          loadLines(parsedLines);
        }
        
        console.log(`Loaded ${appData.history.length} history entries and ${appData.activeNotes.length} chars of notes`);
        
        // Initialize notifications
        await initNotifications();
        console.log('App initialization complete');
      } catch (error) {
        console.error('Error initializing app:', error);
        console.error('Error initializing app:', error);
      }
    };

    initializeApp();
  }, [loadSettings, loadHistory, loadActiveNotes, parseNotesToLines, loadLines]);

  // Apply Always On Top setting via Tauri window API
  useEffect(() => {
    if (!isTauriApp()) return;
    import('@tauri-apps/api/window').then(({ getCurrentWindow }) => {
      getCurrentWindow().setAlwaysOnTop(settings.alwaysOnTop).catch(console.error);
    }).catch(() => { /* not in Tauri context */ });
  }, [settings.alwaysOnTop]);

  // Calculate panel layout based on settings mode
  const isInSettingsMode = settings.settingsMode;
  
  let leftWidth: number;
  let rightWidth: number;
  
  if (isInSettingsMode) {
    // In settings mode: Settings takes left panel, Timer takes right panel
    leftWidth = settings.leftPanelWidth;
    rightWidth = 1 - settings.leftPanelWidth;
  } else {
    // Normal mode: Timer+History takes left panel, Notes takes right panel (if visible)
    leftWidth = settings.notesPanelVisible ? settings.leftPanelWidth : 1;
    rightWidth = settings.notesPanelVisible ? (1 - leftWidth) : 0;
  }
  
  return (
    <div className="flex h-screen bg-deep-navy">
      {/* Left Panel: Settings (in settings mode) OR Timer + History (normal mode) */}
      <div 
        className={`flex flex-col transition-all duration-500 ease-in-out ${
          rightWidth > 0 ? 'border-r border-gray-text/20' : ''
        }`} 
        style={{ flex: leftWidth }}
      >
        {isInSettingsMode ? (
          <SettingsPanel />
        ) : (
          <>
            <div className={settings.historyPanelVisible ? "flex-[0.4] border-b border-gray-text/20" : "flex-1"}>
              <TimerPanel />
            </div>
            {settings.historyPanelVisible && (
              <div className="flex-[0.6] min-h-0">
                <HistoryPanel />
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Right Panel: Timer (in settings mode) OR Notes (normal mode) */}
      {rightWidth > 0 && (
        <div 
          className="min-h-0 transition-all duration-500 ease-in-out" 
          style={{ flex: rightWidth }}
        >
          {isInSettingsMode ? (
            <div className="flex flex-col h-full">
              <div className={settings.historyPanelVisible ? "flex-[0.4] border-b border-gray-text/20" : "flex-1"}>
                <TimerPanel />
              </div>
              {settings.historyPanelVisible && (
                <div className="flex-[0.6] min-h-0">
                  <HistoryPanel />
                </div>
              )}
            </div>
          ) : (
            <NotesPanel />
          )}
        </div>
      )}
      
    </div>
  );
}

function App() {
  return <MainApp />;
}

export default App;