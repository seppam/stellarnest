import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Global error catcher — shows alert for any uncaught error
window.onerror = function (message, source, lineno, colno, error) {
  console.error('🔥 Global Error:', { message, source, lineno, colno, error });
  // Show visible error on page if root exists
  const root = document.getElementById('root');
  if (root && !root.hasChildNodes()) {
    root.innerHTML = `
      <div style="padding:40px;font-family:monospace;background:#1a1a2e;color:#e94560;min-height:100vh">
        <h1 style="color:#fff">🔥 StellarNest Failed to Start</h1>
        <pre style="color:#eee;margin-top:16px;white-space:pre-wrap">${message}\n\nat ${source}:${lineno}:${colno}</pre>
        <pre style="color:#888;margin-top:12px;font-size:12px">${error?.stack || ''}</pre>
        <button onclick="location.reload()" style="margin-top:20px;padding:10px 20px;background:#e94560;color:#fff;border:none;border-radius:8px;cursor:pointer">🔄 Reload</button>
      </div>`;
  }
  return false;
};
