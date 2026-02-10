import React, { useState, useEffect } from 'react';

interface DebugLog {
  id: number;
  timestamp: string;
  message: string;
  type: 'info' | 'error' | 'warning';
}

class DebugLogger {
  private static instance: DebugLogger;
  private logs: DebugLog[] = [];
  private listeners: Array<(logs: DebugLog[]) => void> = [];
  private logId = 0;

  static getInstance(): DebugLogger {
    if (!DebugLogger.instance) {
      DebugLogger.instance = new DebugLogger();
    }
    return DebugLogger.instance;
  }

  log(message: string, type: 'info' | 'error' | 'warning' = 'info') {
    const newLog: DebugLog = {
      id: ++this.logId,
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    };
    this.logs.unshift(newLog);
    if (this.logs.length > 50) this.logs = this.logs.slice(0, 50);
    this.listeners.forEach(listener => listener([...this.logs]));
  }

  subscribe(listener: (logs: DebugLog[]) => void) {
    this.listeners.push(listener);
    listener([...this.logs]);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  clear() {
    this.logs = [];
    this.listeners.forEach(listener => listener([]));
  }
}

export const debugLogger = DebugLogger.getInstance();

const DebugPanel: React.FC = () => {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const unsubscribe = debugLogger.subscribe(setLogs);
    return unsubscribe;
  }, []);

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
        >
          Show Debug
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-80 bg-black/90 text-white rounded-lg shadow-lg z-50 flex flex-col">
      <div className="flex items-center justify-between p-2 border-b border-gray-600">
        <h3 className="text-sm font-semibold">Debug Panel</h3>
        <div className="flex gap-2">
          <button
            onClick={() => debugLogger.clear()}
            className="text-xs bg-red-600 px-2 py-1 rounded"
          >
            Clear
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-xs bg-gray-600 px-2 py-1 rounded"
          >
            Hide
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 text-xs">
        {logs.length === 0 ? (
          <div className="text-gray-400">No logs yet...</div>
        ) : (
          logs.map(log => (
            <div 
              key={log.id} 
              className={`mb-1 ${
                log.type === 'error' ? 'text-red-400' :
                log.type === 'warning' ? 'text-yellow-400' :
                'text-green-400'
              }`}
            >
              <span className="text-gray-400">[{log.timestamp}]</span> {log.message}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DebugPanel;