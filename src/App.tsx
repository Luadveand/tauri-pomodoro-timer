import { useEffect, useState } from 'react';
import TimerPanel from './components/TimerPanel';
import HistoryPanel from './components/HistoryPanel';
import NotesPanel from './components/NotesPanel';
import SettingsPanel from './components/SettingsPanel';
import { useSettingsStore } from './stores/settingsStore';
import { useTimerStore } from './stores/timerStore';
import { loadAppData, testStore, saveSettings } from './utils/storage';
import { initNotifications } from './utils/notifications';
import { useSettingsStore as getSettingsStore } from './stores/settingsStore';

const isTauriApp = () => typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined;

function MainApp() {
  const { loadSettings, settings } = useSettingsStore();
  const { loadHistory, loadActiveNotes, parseNotesToLines, loadLines, loadNotebookPages, mergeAllPagesIntoOne } = useTimerStore();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

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

        // Handle notebook pages initialization / grace period
        const loadedSettings = appData.settings;
        if (loadedSettings.notebookPagesEnabled && appData.notebookPages.length > 0) {
          // Feature is ON and pages exist: hydrate lines for each page
          const hydratedPages = appData.notebookPages.map(p => ({
            ...p,
            lines: parseNotesToLines(p.notes),
          }));
          loadNotebookPages(hydratedPages, appData.activePageId);
        } else if (!loadedSettings.notebookPagesEnabled && appData.notebookPages.length > 0) {
          // Feature is OFF but pages exist: grace period handling
          if (!loadedSettings.notebookPagesGracePeriodStart) {
            // Just deactivated — start grace period
            const updatedGraceSettings = { ...loadedSettings, notebookPagesGracePeriodStart: new Date().toISOString() };
            getSettingsStore.getState().loadSettings(updatedGraceSettings);
            saveSettings(updatedGraceSettings).catch(console.error);
            // Load pages in read-only mode
            const hydratedPages = appData.notebookPages.map(p => ({
              ...p,
              lines: parseNotesToLines(p.notes),
            }));
            loadNotebookPages(hydratedPages, appData.activePageId);
          } else {
            const gracePeriodStart = new Date(loadedSettings.notebookPagesGracePeriodStart).getTime();
            const now = Date.now();
            const fourteenDays = 14 * 24 * 60 * 60 * 1000;
            if (now - gracePeriodStart > fourteenDays) {
              // Grace period expired — auto-merge
              const hydratedPages = appData.notebookPages.map(p => ({
                ...p,
                lines: parseNotesToLines(p.notes),
              }));
              loadNotebookPages(hydratedPages, appData.activePageId);
              // mergeAllPagesIntoOne will clear pages and grace period
              await mergeAllPagesIntoOne();
              const clearedSettings = { ...loadedSettings, notebookPagesGracePeriodStart: null };
              getSettingsStore.getState().loadSettings(clearedSettings);
              await saveSettings(clearedSettings);
            } else {
              // Still in grace period — load pages in read-only mode
              const hydratedPages = appData.notebookPages.map(p => ({
                ...p,
                lines: parseNotesToLines(p.notes),
              }));
              loadNotebookPages(hydratedPages, appData.activePageId);
            }
          }
        } else {
          // Normal case: no pages, parse existing notes
          if (appData.activeNotes) {
            const parsedLines = parseNotesToLines(appData.activeNotes);
            loadLines(parsedLines);
          }
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
  }, [loadSettings, loadHistory, loadActiveNotes, parseNotesToLines, loadLines, loadNotebookPages, mergeAllPagesIntoOne]);

  // Apply Always On Top setting via Tauri window API
  useEffect(() => {
    if (!isTauriApp()) return;
    import('@tauri-apps/api/window').then(({ getCurrentWindow }) => {
      getCurrentWindow().setAlwaysOnTop(settings.alwaysOnTop).catch(console.error);
    }).catch(() => { /* not in Tauri context */ });
  }, [settings.alwaysOnTop]);

  // Apply theme to DOM
  useEffect(() => {
    const applyTheme = (theme: 'light' | 'dark') => {
      document.documentElement.setAttribute('data-theme', theme);
    };
    if (settings.theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent | MediaQueryList) => applyTheme(e.matches ? 'dark' : 'light');
      handler(mq);
      mq.addEventListener('change', handler as (e: MediaQueryListEvent) => void);
      return () => mq.removeEventListener('change', handler as (e: MediaQueryListEvent) => void);
    } else {
      applyTheme(settings.theme);
    }
  }, [settings.theme]);

  // Track window width for responsive layout
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate panel layout based on settings mode
  const isInSettingsMode = settings.settingsMode;
  
  let leftWidth: number;
  let rightWidth: number;
  
  if (isInSettingsMode) {
    // In settings mode: Settings takes left panel, Timer takes right panel
    // Use discrete sizes to avoid animation issues
    let settingsPixelWidth;
    if (windowWidth <= 800) {
      settingsPixelWidth = 400; // Smaller for very small screens
    } else if (windowWidth <= 1200) {
      settingsPixelWidth = 500; // Medium size
    } else {
      settingsPixelWidth = 600; // Larger for big screens
    }
    
    leftWidth = settingsPixelWidth / windowWidth;
    rightWidth = 1 - leftWidth;
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
              <div className="flex-[0.4] border-b border-gray-text/20">
                <TimerPanel />
              </div>
              <div className="flex-[0.6] min-h-0">
                <HistoryPanel />
              </div>
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