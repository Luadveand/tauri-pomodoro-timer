import { useEffect } from 'react';
import TimerPanel from './components/TimerPanel';
import HistoryPanel from './components/HistoryPanel';
import NotesPanel from './components/NotesPanel';
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

  const leftWidth = settings.notesPanelVisible ? settings.leftPanelWidth : 1;
  const rightWidth = settings.notesPanelVisible ? (1 - leftWidth) : 0;
  
  return (
    <div className="flex h-screen bg-deep-navy">
      {/* Left Side: Timer + History */}
      <div 
        className={`flex flex-col transition-all duration-500 ease-in-out ${
          settings.notesPanelVisible ? 'border-r border-gray-text/20' : ''
        }`} 
        style={{ flex: leftWidth }}
      >
        <div className={settings.historyPanelVisible ? "flex-[0.4] border-b border-gray-text/20" : "flex-1"}>
          <TimerPanel />
        </div>
        {settings.historyPanelVisible && (
          <div className="flex-[0.6] min-h-0">
            <HistoryPanel />
          </div>
        )}
      </div>
      
      {/* Right Side: Notes & Tasks */}
      {settings.notesPanelVisible && (
        <div 
          className="min-h-0 transition-all duration-500 ease-in-out" 
          style={{ flex: rightWidth }}
        >
          <NotesPanel />
        </div>
      )}
      
    </div>
  );
}

function App() {
  return <MainApp />;
}

export default App;