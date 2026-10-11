import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  X,
  Sparkles,
  Check,
  Share,
  Monitor,
  ShieldAlert,
  Copy,
  Info,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const inIframe = typeof window !== 'undefined' && window.self !== window.top;

  // If already running inside an installed standalone PWA, hide the button
  if (isInstalled && !justInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setJustInstalled(true);
        setTimeout(() => setJustInstalled(false), 4000);
        return;
      }
    }
    // If not directly installable via native prompt (e.g. inside iframe or iOS), open guide
    setShowGuide(true);
  };

  const getPwaUrl = () => {
    if (typeof window === 'undefined') return '';
    return window.location.origin;
  };

  const handleCopyLink = async () => {
    const url = getPwaUrl();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <>
      {justInstalled ? (
        <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-950/60 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
          <Check className="h-3 w-3" />
          <span>Installed!</span>
        </div>
      ) : isInstallable ? (
        <button
          type="button"
          onClick={handleInstallClick}
          title="Install SceneSwap as Progressive Web App"
          className="flex items-center gap-1.5 rounded-full border border-amber-400/50 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-purple-500/20 px-3 py-1 text-xs font-bold text-amber-200 hover:border-amber-400 hover:text-white hover:bg-amber-500/30 transition shadow-sm cursor-pointer"
        >
          <Download className="h-3.5 w-3.5 text-amber-300 animate-bounce" />
          <span>Install App</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setShowGuide(true)}
          title="Install SceneSwap on your device or get PWA instructions"
          className="flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-200 hover:border-amber-400 hover:bg-amber-400/20 transition cursor-pointer"
        >
          {isIOS ? (
            <Smartphone className="h-3.5 w-3.5 text-amber-300" />
          ) : (
            <Download className="h-3.5 w-3.5 text-amber-300" />
          )}
          <span>Install App</span>
        </button>
      )}

      {/* Installation Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-amber-400/50 bg-gradient-to-b from-slate-950 via-[#130726] to-black p-5 shadow-[0_0_40px_rgba(245,158,11,0.3)] text-white">
            <div className="flex items-center justify-between border-amber-400/20 pb-3 border-b">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">SceneSwap Installation</h3>
                  <p className="text-[10px] text-amber-300/80 font-mono">
                    Party Script Engine • Home Screen, Dock or Desktop
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="rounded-full p-1 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Why not installing directly inside iframe */}
            {inIframe && (
              <div className="mt-3.5 rounded-2xl border border-amber-500/30 bg-amber-950/40 p-3 text-xs text-amber-200/90">
                <div className="flex items-center gap-1.5 font-bold text-amber-300">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400" />
                  <span>Preview Environment Notice</span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                  All web browsers (Chrome, Safari, Edge) <strong>strictly block</strong> PWA installation prompts inside embedded preview frames.
                </p>
                <div className="mt-2 rounded-xl bg-black/40 border border-amber-400/20 p-2 text-[11px] text-amber-200">
                  💡 <strong>To test or install right now:</strong> Look at the top bar of this AI Studio preview pane and click the <strong>&ldquo;Pop out&rdquo; / &ldquo;Open in new window&rdquo;</strong> icon (external link icon). In that standalone tab, your browser will immediately enable the <strong>&ldquo;Install SceneSwap&rdquo;</strong> prompt!
                </div>
              </div>
            )}

            {/* Step-by-Step for Phones & Desktops */}
            <div className="my-3.5 space-y-2 text-xs text-slate-200">
              <div className="flex items-start gap-2.5 rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 font-bold text-xs">
                  <Smartphone className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-white text-xs">iPhone / iPad (Safari)</p>
                  <p className="mt-0.5 text-[11px] text-slate-300 leading-snug">
                    Open the published link in Safari &rarr; tap the <strong>Share</strong> button <Share className="h-3 w-3 inline text-amber-300" /> &rarr; scroll down and tap <strong>&ldquo;Add to Home Screen&rdquo;</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/30 font-bold text-xs">
                  <Monitor className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-white text-xs">Chrome / Edge / Android</p>
                  <p className="mt-0.5 text-[11px] text-slate-300 leading-snug">
                    In a direct tab, click the <strong>Install (+ / computer)</strong> icon on the right side of the browser address bar, or tap (⋮) &rarr; <strong>&ldquo;Install App&rdquo;</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold text-xs">
                  <Info className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-white text-xs">How to Publish / Share Publicly</p>
                  <p className="mt-0.5 text-[11px] text-slate-300 leading-snug">
                    Click the <strong>&ldquo;Share&rdquo;</strong> or <strong>&ldquo;Publish&rdquo;</strong> button in the top right corner of Google AI Studio. This deploys your public URL so you and others can open and install it on any mobile device.
                  </p>
                </div>
              </div>
            </div>

            {/* Current Origin Bar */}
            <div className="mb-3.5 flex items-center justify-between rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-[11px] text-slate-400">
              <span className="truncate font-mono text-[10px] text-slate-300 mr-2">
                {getPwaUrl()}
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="shrink-0 flex items-center gap-1 font-bold text-amber-300 hover:text-amber-200 transition cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" />
                    <span className="text-emerald-300">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-2.5 text-xs font-bold text-white shadow-md hover:brightness-110 transition cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
