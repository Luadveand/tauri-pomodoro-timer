import { useEffect } from 'react';
import TimerPanel from './components/TimerPanel';
import HistoryPanel from './components/HistoryPanel';
import NotesPanel from './components/NotesPanel';
import DebugPanel, { debugLogger } from './components/DebugPanel';
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
        debugLogger.log('App initializing...');
        // Test store functionality first
        await testStore();
        debugLogger.log('Store test completed');
        
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
        
        debugLogger.log(`Loaded ${appData.history.length} history entries and ${appData.activeNotes.length} chars of notes`);
        
        // Initialize notifications
        await initNotifications();
        debugLogger.log('App initialization complete');
      } catch (error) {
        console.error('Error initializing app:', error);
        debugLogger.log('Error initializing app: ' + error, 'error');
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

  return (
    <div className="flex h-screen bg-deep-navy">
      {/* Left Side: Timer + History */}
      <div className="flex-[0.5] flex flex-col border-r border-gray-text/20">
        <div className="flex-[0.55] border-b border-gray-text/20">
          <TimerPanel />
        </div>
        <div className="flex-[0.45] min-h-0">
          <HistoryPanel />
        </div>
      </div>
      
      {/* Right Side: Notes & Tasks */}
      <div className="flex-[0.5] min-h-0">
        <NotesPanel />
      </div>
      
      {settings.debugPanelEnabled && <DebugPanel />}
    </div>
  );
}

function App() {
  return <MainApp />;
}

export default App;