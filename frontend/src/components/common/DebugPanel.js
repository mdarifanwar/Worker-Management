import React, { useState, useEffect } from 'react';
import { showStoredLogs, clearStoredLogs } from '../../services/api';

const DebugPanel = () => {
  const [logs, setLogs] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  
  // Show debug panel in development or when explicitly enabled (including production)
  const isDebugMode = process.env.NODE_ENV === 'development' || 
                     localStorage.getItem('enableDebugPanel') === 'true';

  useEffect(() => {
    // Auto-refresh logs every 2 seconds when panel is visible
    let interval;
    if (isVisible) {
      const refreshLogs = () => {
        const storedLogs = JSON.parse(sessionStorage.getItem('debug_logs') || '[]');
        setLogs(storedLogs);
      };
      
      refreshLogs(); // Initial load
      interval = setInterval(refreshLogs, 2000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isVisible]);

  const handleClearLogs = () => {
    clearStoredLogs();
    setLogs([]);
  };

  const handleShowInConsole = () => {
    showStoredLogs();
  };

  const formatLogLevel = (level) => {
    const colors = {
      log: '#007bff',
      warn: '#ffc107', 
      error: '#dc3545'
    };
    return {
      color: colors[level] || '#000',
      fontWeight: level === 'error' ? 'bold' : 'normal'
    };
  };

  // Don't render anything if debug mode is disabled
  if (!isDebugMode) {
    return null;
  }

  return (
    <>
      {/* Toggle Button - Fixed position */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          zIndex: 9999,
          backgroundColor: process.env.NODE_ENV === 'production' ? '#dc3545' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          fontSize: '20px',
          cursor: 'pointer',
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
        }}
        title={process.env.NODE_ENV === 'production' ? 
               "Debug Panel (Production Mode)" : 
               "Debug Panel (Development Mode)"}
      >
        🔍
      </button>

      {/* Debug Panel */}
      {isVisible && (
        <div style={{
          position: 'fixed',
          top: '70px',
          right: '10px',
          width: '600px',
          height: '400px',
          backgroundColor: 'white',
          border: '1px solid #ccc',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          zIndex: 9998,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header */}
          <div style={{
            padding: '10px',
            borderBottom: '1px solid #eee',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px 8px 0 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>
              🔍 Debug Logs ({logs.length})
            </h3>
            <div>
              <button
                onClick={handleShowInConsole}
                style={{
                  marginRight: '10px',
                  padding: '5px 10px',
                  border: '1px solid #007bff',
                  backgroundColor: 'white',
                  color: '#007bff',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Show in Console
              </button>
              <button
                onClick={handleClearLogs}
                style={{
                  marginRight: '10px',
                  padding: '5px 10px',
                  border: '1px solid #dc3545',
                  backgroundColor: 'white',
                  color: '#dc3545',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Clear
              </button>
              <button
                onClick={() => setIsVisible(false)}
                style={{
                  padding: '5px 10px',
                  border: '1px solid #6c757d',
                  backgroundColor: 'white',
                  color: '#6c757d',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Logs Container */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: '10px',
            fontFamily: 'monospace',
            fontSize: '12px',
            lineHeight: '1.4'
          }}>
            {logs.length === 0 ? (
              <div style={{ color: '#6c757d', fontStyle: 'italic' }}>
                No logs yet. Perform some actions to see debug information.
                {process.env.NODE_ENV === 'production' && (
                  <div style={{ marginTop: '10px', fontSize: '11px' }}>
                    💡 In production, use console commands:<br/>
                    <code>enableDebugPanel()</code> - Show this panel<br/>
                    <code>showStoredLogs()</code> - View all logs
                  </div>
                )}
              </div>
            ) : (
              logs.map((log, index) => (
                <div key={index} style={{
                  marginBottom: '5px',
                  padding: '5px',
                  backgroundColor: log.level === 'error' ? '#fff5f5' : 
                                  log.level === 'warn' ? '#fffbf0' : '#f8f9fa',
                  borderRadius: '3px',
                  borderLeft: `3px solid ${
                    log.level === 'error' ? '#dc3545' :
                    log.level === 'warn' ? '#ffc107' : '#007bff'
                  }`
                }}>
                  <div style={{
                    fontSize: '10px',
                    color: '#6c757d',
                    marginBottom: '2px'
                  }}>
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </div>
                  <div style={formatLogLevel(log.level)}>
                    {log.message}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default DebugPanel;