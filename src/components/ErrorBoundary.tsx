import React, { Component, type ReactNode } from 'react';
import { RotateCcw, AlertTriangle, Clapperboard } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('SceneSwap ErrorBoundary caught an unhandled render error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    // Reset any corrupted active chapter in local storage or state
    try {
      localStorage.removeItem('sceneswap_character_visual_bible_v2');
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-black p-6 text-white selection:bg-purple-500">
          <div className="w-full max-w-md rounded-3xl border border-rose-500/40 bg-gradient-to-b from-rose-950/40 via-slate-950 to-black p-6 text-center shadow-2xl space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/40 bg-rose-500/10 text-rose-400 shadow-inner">
              <AlertTriangle className="h-7 w-7" />
            </div>

            <div className="space-y-1.5">
              <span className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-widest text-rose-400">
                <Clapperboard className="h-3.5 w-3.5" />
                Director Cut Interrupted
              </span>
              <h2 className="text-lg font-black text-white">
                Scene Encountered A Glitch
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                The script engine recovered from a scene rendering hitch. Tap below to reload the stage or return to the lobby cleanly.
              </p>
            </div>

            {this.state.error && (
              <div className="rounded-xl border border-white/10 bg-black/60 p-2.5 text-left text-[11px] font-mono text-rose-300 line-clamp-3">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-3 text-xs font-black uppercase tracking-wider text-white hover:brightness-110 active:scale-95 transition shadow-lg shadow-purple-600/30"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Return to Lobby</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
