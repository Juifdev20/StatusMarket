import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import './lib/i18n';
import './styles/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// iOS Safari ignores the viewport's user-scalable=no for accessibility, so
// block pinch-zoom (gesturestart/gesturechange) and double-tap-zoom here too.
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('gesturechange', (e) => e.preventDefault());
let lastTouchEnd = 0;
document.addEventListener(
  'touchend',
  (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) e.preventDefault();
    lastTouchEnd = now;
  },
  { passive: false }
);

// Désactivé temporairement pour test - conflit potentiel avec vite-plugin-pwa
// if ('serviceWorker' in navigator && import.meta.env.PROD) {
//   navigator.serviceWorker.register('/sw.js').catch(() => {});
// }
