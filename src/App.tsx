import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import TimerPanel from './components/TimerPanel';
import HistoryPanel from './components/HistoryPanel';
import SettingsPage from './pages/SettingsPage';
import { useSettingsStore } from './stores/settingsStore';
import { useTimerStore } from './stores/timerStore';
import { loadAppData } from './utils/storage';
import { initNotifications } from './utils/notifications';

function MainApp() {
  const { loadSettings } = useSettingsStore();
  const { loadHistory } = useTimerStore();
  const [showHistory, setShowHistory] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load persisted data
        const appData = await loadAppData();
        loadSettings(appData.settings);
        loadHistory(appData.history);
        
        // Initialize notifications
        await initNotifications();
      } catch (error) {
        console.error('Error initializing app:', error);
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
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Router>
  );
}

export default App;