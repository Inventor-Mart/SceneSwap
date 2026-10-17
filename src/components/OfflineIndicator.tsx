import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <aside
      aria-label="Network status"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-2xl border border-amber-500/50 bg-slate-950/95 px-3.5 py-2 text-xs font-semibold text-amber-200 shadow-[0_4px_20px_rgba(245,158,11,0.3)] backdrop-blur-md animate-fade-in"
    >
      <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
      <WifiOff className="h-4 w-4 text-amber-400 shrink-0" />
      <span>Offline Mode — Local SceneSwap cache active</span>
    </aside>
  );
};
