import React from 'react';
import {
  Smartphone,
  Download,
  CheckCircle2,
  X,
  ShieldCheck,
  Zap,
  Globe,
  ExternalLink,
  Cpu,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

interface AndroidApkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AndroidApkModal({ isOpen, onClose }: AndroidApkModalProps) {
  if (!isOpen) return null;

  const apkDownloadUrl =
    'https://github.com/Inventor-Mart/SceneSwap/releases/download/v1.1.0-apk/SceneSwap-Android7plus-v1.1.0.apk';
  const projectArchiveUrl = '/sceneswap-android-project.tar.gz';

  const handleDownloadClick = () => {
    soundEngine.playDialogueBlip(1.2);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-5 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-emerald-500/40 bg-gradient-to-b from-slate-950 via-[#061811] to-black p-5 sm:p-7 shadow-[0_0_60px_rgba(16,185,129,0.25)] space-y-5 my-auto">
        {/* Ambient Backlight */}
        <div className="absolute top-0 right-1/4 -z-10 h-64 w-64 bg-emerald-500/10 blur-[80px] pointer-events-none rounded-full" />
        <div className="absolute bottom-0 left-1/4 -z-10 h-64 w-64 bg-teal-600/15 blur-[80px] pointer-events-none rounded-full" />

        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-md font-bold">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">
                  SceneSwap for Android
                </h2>
                <span className="rounded-md border border-emerald-400/40 bg-emerald-500/20 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-300">
                  v1.1.0 • Android 7.0+
                </span>
              </div>
              <p className="text-xs text-emerald-300 font-medium">
                Native APK Build · Minimum API Level 24 (Nougat through Android 15+)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/10 p-1.5 text-slate-400 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Device Compatibility Specs Card */}
        <div className="rounded-2xl border border-white/10 bg-black/40 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-emerald-400" />
              Build Version
            </span>
            <span className="font-extrabold text-emerald-300">v1.1.0 (Latest 18-Scene Visuals & Live Paystack)</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-emerald-400" />
              Minimum OS Version
            </span>
            <span className="font-extrabold text-white">Android 7.0 Nougat (API 24)</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-emerald-400" />
              Target Architecture
            </span>
            <span className="font-mono text-emerald-300 font-bold">Universal (ARM64 / ARMv7 / x86)</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Package Identifier
            </span>
            <span className="font-mono text-slate-300 text-[11px]">com.sceneswap.party</span>
          </div>
        </div>

        {/* Primary Download Options */}
        <div className="space-y-3">
          {/* Option 1: Direct APK Download */}
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-4 space-y-3">
            <div>
              <div className="flex items-center gap-1.5 font-black text-sm text-white">
                <Download className="h-4 w-4 text-emerald-400" />
                <span>Download Standalone APK (v1.1.0)</span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Direct installer package compiled with <code className="text-emerald-300">minSdkVersion = 24</code>. Includes the 18 smart scene backdrops, multi-angle camera cycler, and live Paystack gateway.
              </p>
            </div>

            <a
              href={apkDownloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleDownloadClick}
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-xs font-black text-slate-950 hover:brightness-110 transition shadow-lg active:scale-95 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Download SceneSwap-Android7plus-v1.1.0.apk</span>
            </a>

            <div className="pt-1">
              <a
                href={projectArchiveUrl}
                download="sceneswap-android-project.tar.gz"
                className="flex items-center justify-center gap-2 w-full rounded-xl border border-emerald-500/30 bg-emerald-950/40 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-900/40 transition active:scale-95 cursor-pointer"
              >
                <Layers className="h-3.5 w-3.5 text-emerald-400" />
                <span>Download Android Studio Project Archive (.tar.gz)</span>
              </a>
            </div>
          </div>

          {/* Option 2: Instant PWA Native Install */}
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300">
                <Globe className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Alternative: Instant Web App</p>
                <p className="text-[11px] text-slate-400">
                  Open in Chrome on Android → Tap (⋮) → <strong className="text-white">Add to Home Screen</strong> for full offline capability without installing files.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3-Step Installation Guide for Android 7+ Users */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4 space-y-2">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            Quick Install Guide for Android 7+ Devices
          </h4>
          <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed">
            <li>Tap the green <strong className="text-white">Download APK</strong> button above and confirm <strong className="text-emerald-300">"Download anyway"</strong>.</li>
            <li>When download finishes, tap the notification or open your <strong className="text-white">Downloads</strong> folder and tap <strong className="text-white">SceneSwap-Android7plus-v1.0.apk</strong>.</li>
            <li>If prompted by Android, tap <strong className="text-white">Settings</strong>, switch on <strong className="text-emerald-300">"Allow from this source"</strong>, and tap <strong className="text-white">Install</strong>.</li>
          </ol>
        </div>

        {/* Source Project Bundle Download (for developers) */}
        <div className="flex items-center justify-between pt-1 border-t border-white/10 text-xs">
          <span className="text-[11px] text-slate-400">Building with Android Studio?</span>
          <a
            href="/sceneswap-android-project.tar.gz"
            download="sceneswap-android-project.tar.gz"
            className="flex items-center gap-1 font-bold text-emerald-400 hover:text-emerald-300 underline"
          >
            <span>Download Project Source (.tar.gz)</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
