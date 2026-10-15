import { Clapperboard, ArrowRight, Sparkles } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

interface LandingPageProps {
  onStartParty: () => void;
  onQuickDemo?: () => void;
  onOpenPass?: () => void;
}

export function LandingPage({ onStartParty }: LandingPageProps) {
  const handleContinue = () => {
    soundEngine.playDialogueBlip(1.1);
    onStartParty();
  };

  return (
    <div className="relative min-h-[75vh] flex flex-col items-center justify-center text-center px-4 py-12 max-w-2xl mx-auto animate-in fade-in duration-300">
      {/* Subtle Ambient Backlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-purple-600/15 blur-[90px] rounded-full pointer-events-none" />

      {/* Brand Icon Badge */}
      <div className="relative mb-6">
        <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 shadow-[0_0_30px_rgba(168,85,247,0.45)] border border-white/20">
          <Clapperboard className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
        </div>
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-pink-500" />
        </span>
      </div>

      {/* Header Tag */}
      <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold uppercase tracking-widest mb-3">
        <Sparkles className="h-3.5 w-3.5" />
        <span>SceneSwap Engine</span>
      </div>

      {/* Main Title */}
      <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-4">
        Turn Any Hangout Into An{' '}
        <span className="bg-gradient-to-r from-amber-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
          Interactive Film Set
        </span>
      </h1>

      {/* Concise Description */}
      <p className="text-sm sm:text-base text-slate-300 max-w-lg mb-8 leading-relaxed">
        Cast your friends into personalized movie scenes with live teleprompter lines,
        viral sound effects, and audience choice voting.
      </p>

      {/* Quiet Unboxed Metadata */}
      <div className="flex items-center gap-2.5 text-xs text-slate-400 mb-9 font-medium">
        <span>2–8 Players</span>
        <span aria-hidden="true" className="text-slate-600">·</span>
        <span>5 Film Genres</span>
        <span aria-hidden="true" className="text-slate-600">·</span>
        <span>Live Teleprompter</span>
      </div>

      {/* Single Clean Continue Button */}
      <button
        type="button"
        onClick={handleContinue}
        className="group relative flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 px-8 py-4 text-base font-black text-white shadow-[0_0_35px_rgba(168,85,247,0.4)] transition hover:brightness-110 hover:shadow-[0_0_45px_rgba(168,85,247,0.6)] active:scale-95 cursor-pointer"
      >
        <span>Continue</span>
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
      </button>
    </div>
  );
}
