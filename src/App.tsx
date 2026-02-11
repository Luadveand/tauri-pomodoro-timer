import { useEffect, useState } from 'react';
import TimerPanel from './components/TimerPanel';
import HistoryPanel from './components/HistoryPanel';
import DebugPanel, { debugLogger } from './components/DebugPanel';
import { useSettingsStore } from './stores/settingsStore';
import { useTimerStore } from './stores/timerStore';
import { loadAppData, testStore } from './utils/storage';
import { initNotifications } from './utils/notifications';

function MainApp() {
  const { loadSettings } = useSettingsStore();
  const { loadHistory } = useTimerStore();
  const [showHistory, setShowHistory] = useState(true);

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
        debugLogger.log(`Loaded ${appData.history.length} history entries`);
        
        // Initialize notifications
        await initNotifications();
        debugLogger.log('App initialization complete');
      } catch (error) {
        console.error('Error initializing app:', error);
        debugLogger.log('Error initializing app: ' + error, 'error');
      }
    };

    initializeApp();
  }, [loadSettings, loadHistory]);

  return (
    <div className="flex h-screen bg-deep-navy">
      <div className={`${showHistory ? 'flex-[0.65] border-r border-gray-text/20' : 'flex-1'} transition-all duration-300`}>
        <TimerPanel 
          showHistory={showHistory}
          onToggleHistory={() => setShowHistory(!showHistory)}
        />
      </div>
      {showHistory && (
        <div className="flex-[0.35]">
          <HistoryPanel />
        </div>
      )}
      <DebugPanel />
    </div>
  );
}

function App() {
  return <MainApp />;
}

export default App;