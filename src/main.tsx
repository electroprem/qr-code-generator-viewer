import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ThemeProvider } from '@components/providers/ThemeProvider';
import { ToastProvider } from '@components/providers/ToastProvider';
import { KeyboardProvider } from '@components/providers/KeyboardProvider';
import { registerSW } from '@lib/pwa';
import '@styles/globals.css';

console.log('🚀 QR Studio 2.0 starting...');
registerSW();

const root = ReactDOM.createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <KeyboardProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </KeyboardProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);

console.log('✅ React root rendered');

// Global error handler
window.addEventListener('error', (e) => {
  console.error('💥 Global error:', e.error);
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('💥 Unhandled rejection:', e.reason);
});

// Force check if root has content
setTimeout(() => {
  const rootEl = document.getElementById('root');
  console.log('🔍 Root element:', rootEl);
  console.log('🔍 Root innerHTML length:', rootEl?.innerHTML?.length || 0);
  console.log('🔍 Root children:', rootEl?.children.length || 0);
}, 1000);