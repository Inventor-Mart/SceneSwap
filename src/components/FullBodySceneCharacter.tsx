import React from 'react';
import { Camera, Sparkles, Zap } from 'lucide-react';
import { CastMember } from './CinematicSceneStage';

export interface FullBodySceneCharacterProps {
  member: CastMember;
  isSpeaking: boolean;
  activeDirection?: string;
  activeLine?: string;
  actionBeat?: string;
  genre: string;
  photoUrl: string;
  onClick?: () => void;
  onPhotoUpload?: () => void;
  isCombatAction?: boolean;
  isSlamAction?: boolean;
  size?: 'normal' | 'large' | 'compact';
}

/**
 * FullBodySceneCharacter:
 * Renders the character's entire standing body placed realistically inside the scene,
 * complete with their action description and dialogue bubble according to the scene.
 * No circular avatars, no name badges underneath, and no wardrobe text blocks!
 */
export const FullBodySceneCharacter: React.FC<FullBodySceneCharacterProps> = ({
  member,
  isSpeaking,
  activeDirection,
  activeLine,
  actionBeat,
  genre = '',
  photoUrl,
  onClick,
  onPhotoUpload,
  isCombatAction = false,
  isSlamAction = false,
  size = 'normal',
}) => {
  const cleanGenre = genre.toLowerCase();
  const roleLower = (member.role || '').toLowerCase();
  const isFemale = /mrs|miss|madam|queen|matriarch|sister|daughter|mother|lady|folake|amara|chioma|ngozi|ada/.test(
    `${member.player} ${member.role}`.toLowerCase()
  );

  // Height / scale classes based on size prop
  const figureHeight =
    size === 'large'
      ? 'h-72 sm:h-88 md:h-[420px] w-40 sm:w-48 md:w-56'
      : size === 'compact'
      ? 'h-56 sm:h-64 md:h-72 w-28 sm:w-36 md:w-40'
      : 'h-64 sm:h-80 md:h-96 w-36 sm:w-44 md:w-52';

  // Extract current action description to display above the character
  const displayAction = isSpeaking
    ? activeDirection || actionBeat || 'Delivering line with theatrical force'
    : actionBeat || 'Standing in the room, reacting to the scene';

  // Format action text clean
  const cleanActionText = displayAction.replace(/[[\]()]/g, '').trim();

  // Color schemes for attire according to genre
  const getAttireColors = () => {
    if (cleanGenre.includes('nollywood')) {
      if (isFemale) {
        return {
          torso: 'from-amber-600 via-rose-700 to-amber-900',
          trim: '#FDE047',
          legs: 'from-rose-900 to-amber-950',
          shoes: '#1E1B4B',
          sash: '#F59E0B',
          style: 'traditional-regal',
        };
      }
      if (roleLower.includes('chief') || roleLower.includes('patriarch') || roleLower.includes('elder')) {
        return {
          torso: 'from-indigo-950 via-blue-900 to-slate-900',
          trim: '#F59E0B',
          legs: 'from-indigo-950 to-slate-950',
          shoes: '#0F172A',
          sash: '#FDE047',
          style: 'agbada',
        };
      }
      return {
        torso: 'from-slate-900 via-indigo-950 to-slate-900',
        trim: '#38BDF8',
        legs: 'from-slate-900 to-black',
        shoes: '#020617',
        sash: '#94A3B8',
        style: 'suit',
      };
    }

    if (cleanGenre.includes('sci-fi') || cleanGenre.includes('scifi')) {
      return {
        torso: 'from-cyan-950 via-slate-900 to-blue-950',
        trim: '#22D3EE',
        legs: 'from-slate-900 to-cyan-950',
        shoes: '#083344',
        sash: '#38BDF8',
        style: 'flight-suit',
      };
    }

    if (cleanGenre.includes('heist')) {
      return {
        torso: 'from-emerald-950 via-slate-950 to-neutral-900',
        trim: '#34D399',
        legs: 'from-neutral-950 to-black',
        shoes: '#064E3B',
        sash: '#10B981',
        style: 'stealth',
      };
    }

    if (cleanGenre.includes('horror')) {
      return {
        torso: 'from-purple-950 via-neutral-900 to-rose-950',
        trim: '#C084FC',
        legs: 'from-neutral-950 to-black',
        shoes: '#1C1917',
        sash: '#A855F7',
        style: 'gothic-coat',
      };
    }

    if (cleanGenre.includes('romcom') || cleanGenre.includes('romance') || cleanGenre.includes('comedy')) {
      return {
        torso: isFemale
          ? 'from-pink-700 via-rose-800 to-pink-950'
          : 'from-slate-950 via-zinc-900 to-black',
        trim: '#F472B6',
        legs: isFemale ? 'from-rose-900 to-pink-950' : 'from-slate-950 to-black',
        shoes: '#09090B',
        sash: '#FDA4AF',
        style: 'gala',
      };
    }

    // Default / Detective
    return {
      torso: 'from-amber-950 via-stone-900 to-zinc-950',
      trim: '#FBBF24',
      legs: 'from-stone-950 to-black',
      shoes: '#1C1917',
      sash: '#E2E8F0',
      style: 'trench',
    };
  };

  const attire = getAttireColors();

  return (
    <div
      className={`relative flex flex-col items-center justify-end select-none transition-all duration-300 ${
        isSpeaking ? 'z-30 scale-105 filter drop-shadow-[0_0_25px_rgba(251,191,36,0.45)]' : 'z-20 scale-95 opacity-85 hover:opacity-100 hover:scale-100'
      }`}
    >
      {/* =====================================================================
          1. ACTION DESCRIPTION BANNER: ANCHORED DIRECTLY ABOVE THE CHARACTER
          ===================================================================== */}
      {isSpeaking ? (
        <div className="absolute -top-36 sm:-top-44 md:-top-52 left-1/2 -translate-x-1/2 w-64 sm:w-80 md:w-96 z-50 pointer-events-none">
          {/* Action strip with comic badge */}
          <div className="flex flex-col items-center gap-1.5 animate-in fade-in zoom-in-95 duration-200">
            {/* The Physical Action in the scene */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/90 border border-amber-400/80 shadow-[0_0_15px_rgba(251,191,36,0.5)] backdrop-blur-md">
              <Zap className="h-3 w-3 text-amber-300 animate-pulse" />
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-300">
                Action:
              </span>
              <span className="text-[10px] sm:text-xs italic text-white font-medium line-clamp-1 max-w-[200px] sm:max-w-[260px]">
                {cleanActionText}
              </span>
            </div>

            {/* Graphic Novel Speech Balloon with Dialogue Line */}
            {activeLine && (
              <div
                className={`relative rounded-2xl p-3 sm:p-4 shadow-2xl backdrop-blur-xl border-2 w-full text-center ${
                  isCombatAction
                    ? 'bg-rose-950/95 border-rose-400 text-rose-100 shadow-[0_0_20px_rgba(244,63,94,0.4)]'
                    : 'bg-black/95 border-amber-400 text-white shadow-[0_0_25px_rgba(251,191,36,0.35)]'
                }`}
              >
                <p className="text-xs sm:text-sm font-extrabold tracking-tight text-white leading-snug">
                  &ldquo;{activeLine}&rdquo;
                </p>

                {/* Speech Balloon Pointer Triangle directly aiming down to character */}
                <div
                  className={`absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 ${
                    isCombatAction ? 'border-t-rose-400' : 'border-t-amber-400'
                  }`}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Subtle passive action indicator for characters watching or reacting */
        actionBeat && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 z-40 pointer-events-none opacity-0 group-hover:opacity-100 transition duration-200">
            <div className="px-2 py-0.5 rounded-full bg-black/80 border border-white/20 text-center backdrop-blur-sm">
              <span className="text-[9px] text-slate-300 italic line-clamp-1">
                [{cleanActionText}]
              </span>
            </div>
          </div>
        )
      )}

      {/* Dramatic Action Impact Sound Burst (for fight, clash, slam) */}
      {isSpeaking && (isCombatAction || isSlamAction) && (
        <div className="absolute -top-20 -right-8 z-50 animate-bounce pointer-events-none">
          <span className="px-3 py-1 rounded-xl bg-amber-400 text-black font-black italic tracking-widest text-xs sm:text-sm uppercase shadow-[0_0_20px_rgba(251,191,36,1)] border-2 border-black rotate-12">
            {isCombatAction ? '💥 CLASH!' : '⚡ SLAM!'}
          </span>
        </div>
      )}

      {/* =====================================================================
          2. CHARACTER WHOLE BODY FIGURE STANDING DIRECTLY INSIDE THE SCENE
          ===================================================================== */}
      <div
        onClick={onClick}
        className={`relative ${figureHeight} flex flex-col items-center cursor-pointer group transition-transform duration-300`}
        title={`Focus character: ${member.player}`}
      >
        {/* Realistic Actor Face & Head with cinematic lighting */}
        <div
          className={`relative z-20 h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 rounded-2xl overflow-hidden border-2 shadow-[0_8px_25px_rgba(0,0,0,0.8)] transition-all duration-300 ${
            isSpeaking
              ? 'border-amber-400 ring-4 ring-amber-400/40 brightness-110 shadow-[0_0_25px_rgba(251,191,36,0.5)]'
              : 'border-white/25 group-hover:border-white/60 brightness-95'
          }`}
        >
          <img
            src={photoUrl}
            alt={member.player}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover object-top filter contrast-[1.05]"
          />

          {/* Active Speaking Halo indicator */}
          {isSpeaking && (
            <div className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400" />
            </div>
          )}

          {/* Photo Swap Button on hover */}
          {onPhotoUpload && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPhotoUpload();
              }}
              title={`Upload custom photo for ${member.player}`}
              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 text-[9px] font-bold text-white transition backdrop-blur-xs"
            >
              <Camera className="h-3.5 w-3.5 text-amber-300" />
              <span>Swap</span>
            </button>
          )}
        </div>

        {/* Neck & Collar transition */}
        <div className="relative z-15 -mt-2 h-4 w-8 sm:w-10 bg-amber-950/80 rounded-b-md" />

        {/* Realistic Torso with Authentic Wardrobe matching the Genre */}
        <div
          className={`relative z-10 -mt-1 w-24 sm:w-32 md:w-36 h-28 sm:h-36 md:h-44 rounded-t-3xl bg-gradient-to-b ${attire.torso} border border-white/10 shadow-2xl flex flex-col items-center justify-start overflow-hidden`}
        >
          {/* Attire Lapels / Embroidery / Armor Plates */}
          <div className="w-full flex justify-between px-3 pt-2">
            <div
              className="h-16 w-3 sm:w-4 rounded-full opacity-70 transform -rotate-12"
              style={{ backgroundColor: attire.trim }}
            />
            {/* Center Tie / Brooch / Medallion */}
            <div className="flex flex-col items-center pt-1">
              <div
                className="h-3 w-3 rounded-full border border-white/30 shadow"
                style={{ backgroundColor: attire.trim }}
              />
              <div
                className="w-1.5 h-12 mt-1 rounded-sm opacity-80"
                style={{ backgroundColor: attire.sash }}
              />
            </div>
            <div
              className="h-16 w-3 sm:w-4 rounded-full opacity-70 transform rotate-12"
              style={{ backgroundColor: attire.trim }}
            />
          </div>

          {/* Waistband / Belt / Sash */}
          <div className="mt-auto w-full h-3 sm:h-4 bg-black/60 border-y border-white/10 flex items-center justify-center">
            <div
              className="h-2 w-4 rounded-xs border border-white/20"
              style={{ backgroundColor: attire.trim }}
            />
          </div>
        </div>

        {/* Dynamic Standing Arms with expressive gesture depending on speaking status */}
        <div className="absolute top-18 sm:top-22 md:top-26 w-full flex justify-between px-1 pointer-events-none">
          {/* Left Arm: Raised if speaking or combat */}
          <div
            className={`w-4 sm:w-5 h-20 sm:h-28 md:h-32 rounded-full bg-gradient-to-b ${attire.torso} border border-white/10 shadow-lg transform origin-top transition-transform duration-300 ${
              isSpeaking
                ? isCombatAction
                  ? '-rotate-45 translate-y-1'
                  : '-rotate-24 translate-y-1'
                : 'rotate-6'
            }`}
          />
          {/* Right Arm: Raised or gesturing */}
          <div
            className={`w-4 sm:w-5 h-20 sm:h-28 md:h-32 rounded-full bg-gradient-to-b ${attire.torso} border border-white/10 shadow-lg transform origin-top transition-transform duration-300 ${
              isSpeaking
                ? isCombatAction
                  ? 'rotate-45 translate-y-1'
                  : 'rotate-20 translate-y-1'
                : '-rotate-6'
            }`}
          />
        </div>

        {/* Lower Body: Realistic Tailored Legs / Trousers / Skirt */}
        <div className="relative z-5 w-20 sm:w-26 md:w-30 flex-1 flex justify-center gap-2 sm:gap-3">
          {/* Left Leg */}
          <div
            className={`w-8 sm:w-10 md:w-12 h-full rounded-b-xl bg-gradient-to-b ${attire.legs} border-x border-black/40 shadow-inner flex flex-col justify-end items-center`}
          >
            {/* Polished Shoe / Boot */}
            <div
              className="w-full h-5 sm:h-6 rounded-b-lg shadow-lg border-t border-white/10"
              style={{ backgroundColor: attire.shoes }}
            />
          </div>
          {/* Right Leg */}
          <div
            className={`w-8 sm:w-10 md:w-12 h-full rounded-b-xl bg-gradient-to-b ${attire.legs} border-x border-black/40 shadow-inner flex flex-col justify-end items-center`}
          >
            {/* Polished Shoe / Boot */}
            <div
              className="w-full h-5 sm:h-6 rounded-b-lg shadow-lg border-t border-white/10"
              style={{ backgroundColor: attire.shoes }}
            />
          </div>
        </div>
      </div>

      {/* =====================================================================
          3. REALISTIC PERSPECTIVE FLOOR SHADOW GROUNDING THE BODY IN THE ROOM
          ===================================================================== */}
      <div className="w-28 sm:w-36 md:w-44 h-3 sm:h-4 bg-black/80 rounded-[100%] blur-[3px] -mt-1 pointer-events-none" />
    </div>
  );
};
