import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA service worker with auto-update
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('SceneSwap update available.');
  },
  onOfflineReady() {
    console.log('SceneSwap is ready for offline use.');
  },
});

createRoot(document.getElementById('root')!).render(<App />);
