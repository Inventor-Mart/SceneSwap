import React from 'react';
import {
  Clapperboard,
  Users,
  Sparkles,
  Play,
  Crown,
  Flame,
  Film,
  Zap,
  ArrowRight,
  Tv,
  CheckCircle2,
} from 'lucide-react';

interface LandingPageProps {
  onStartParty: () => void;
  onQuickDemo: () => void;
  onOpenPass: () => void;
}

export function LandingPage({
  onStartParty,
  onQuickDemo,
  onOpenPass,
}: LandingPageProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-10 py-6 px-3 sm:px-6 max-w-4xl mx-auto text-center">
      {/* Hero Badge */}
      <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-950/40 px-3.5 py-1 text-xs font-bold text-purple-300 shadow-md">
        <Sparkles className="h-3.5 w-3.5 text-purple-400 animate-spin" />
        <span>The Live Party Screenplay Game</span>
      </div>

      {/* Hero Title & Subtitle */}
      <div className="space-y-4 max-w-2xl">
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
          Turn Any Hangout Into an{' '}
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
            Interactive Film Set
          </span>
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          Cast your friends into hilarious, high-stakes 3-act scripts. Perform lines on a teleprompter, cue Hollywood sound effects, and vote on dramatic plot twists live!
        </p>
      </div>

      {/* Primary Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
        <button
          type="button"
          onClick={onStartParty}
          className="flex items-center justify-center gap-2 w-full sm:w-auto rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 px-7 py-3.5 text-sm font-black text-white hover:brightness-110 transition shadow-[0_0_30px_rgba(168,85,247,0.35)] active:scale-95 cursor-pointer"
        >
          <Clapperboard className="h-4 w-4" />
          <span>Start Party Shoot (2–5 Players)</span>
          <ArrowRight className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onQuickDemo}
          className="flex items-center justify-center gap-2 w-full sm:w-auto rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 px-5 py-3.5 text-sm font-bold text-slate-200 transition active:scale-95 cursor-pointer"
        >
          <Play className="h-4 w-4 text-purple-400" />
          <span>Quick 1-Click Shoot</span>
        </button>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-left pt-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4.5 space-y-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300">
            <Users className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Cast Your Friends</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Upload custom avatar photos or use smart AI likenesses to match roles, archetypes, and hidden motivations.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4.5 space-y-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-500/20 text-pink-300">
            <Tv className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-white">TikTok & Stage Views</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Perform in full 9:16 vertical video mode with teleprompter auto-scroll, camera angle cycler, and 18 film backdrops.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4.5 space-y-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300">
            <Zap className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Gen Z Party Soundboard</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Vine Boom, dramatic violin sting, record scratch, boing, thunder, and crowd cheer at the tap of a button.
          </p>
        </div>
      </div>

      {/* VIP Director Banner */}
      <div className="w-full rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/30 via-slate-950 to-purple-950/30 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 shadow-md">
            <Crown className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-extrabold text-white">
              VIP Director Pass & Creator Studio
            </h4>
            <p className="text-[11px] text-amber-300/80">
              Unlock 5-act campaigns, photorealistic scene generation, and full vertical script export.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenPass}
          className="shrink-0 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-xs font-black text-slate-950 hover:brightness-110 transition shadow cursor-pointer"
        >
          View Plans & Pricing
        </button>
      </div>
    </div>
  );
}
