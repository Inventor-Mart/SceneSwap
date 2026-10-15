import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Film,
  Sparkles,
  Volume2,
  VolumeX,
  Mic,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Check,
  Copy,
  Share2,
  RotateCcw,
  Clapperboard,
  Users,
  ScrollText,
  Flame,
  CheckCircle2,
  Crown,
  RefreshCw,
  Maximize2,
  Minimize2,
  Camera,
  Upload,
} from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';
import {
  getRealisticCharacterPhoto,
  compressImageFile,
  setStoredCustomAvatar,
  getStoredCustomAvatars,
} from '../utils/characterAvatars';
import {
  lockOrGetCharacterVisualBible,
  extractPhysicalSceneAction,
  buildContinuityPromptBlock,
  extractCharacterActionBeats,
  generateDynamicSceneSvg,
} from '../utils/characterConsistency';
import {
  getDefaultRealisticSceneImage,
  CastMember,
  ScriptLine,
  PlotChoice,
} from './CinematicSceneStage';

interface StudioScriptPortraitViewProps {
  genre: string;
  tone: string;
  chapterNumber: number;
  chapterTitle: string;
  settingDescription: string;
  audioCue: string;
  cast: CastMember[];
  scriptLines: ScriptLine[];
  plotChoices: PlotChoice[];
  isFinale: boolean;
  finaleSummary?: string;
  currentLineIndex: number;
  onLineChange: (index: number) => void;
  selectedVoteId: 'A' | 'B' | 'C' | null;
  onSelectVote: (id: 'A' | 'B' | 'C') => void;
  voteCounts: { A?: number; B?: number; C?: number };
  onLockInVoteAndBranch: () => void;
  isBranchingChapter: boolean;
  onResetToLobby: () => void;
  playerColorStyles: { bg: string; text: string; border: string; badge: string }[];
  customPlayerPhotos?: Record<string, string>;
  onUpdateCustomPhoto?: (playerName: string, dataUrl: string) => void;
  isDirectorPro?: boolean;
  onOpenSubscriptionModal?: () => void;
}

export function StudioScriptPortraitView({
  genre,
  tone,
  chapterNumber,
  chapterTitle,
  settingDescription,
  audioCue,
  cast,
  scriptLines,
  plotChoices,
  isFinale,
  finaleSummary,
  currentLineIndex,
  onLineChange,
  selectedVoteId,
  onSelectVote,
  voteCounts,
  onLockInVoteAndBranch,
  isBranchingChapter,
  onResetToLobby,
  playerColorStyles,
  customPlayerPhotos = {},
  onUpdateCustomPhoto,
  isDirectorPro = false,
  onOpenSubscriptionModal,
}: StudioScriptPortraitViewProps) {
  // Mode toggle inside studio script: TikTok Live Teleprompter vs Full Screenplay Sheet
  const [viewSubMode, setViewSubMode] = useState<'tiktok' | 'screenplay'>('tiktok');

  // Defensive guarantees against malformed inputs
  const safeCast = Array.isArray(cast) && cast.length > 0 ? cast : [
    { player: 'Player 1', role: 'Protagonist', archetype: 'The Lead', motivation: 'Complete the scene' },
    { player: 'Player 2', role: 'Deuteragonist', archetype: 'The Wildcard', motivation: 'Challenge the status quo' },
  ];
  const safeScriptLines = Array.isArray(scriptLines) && scriptLines.length > 0 ? scriptLines : [
    { speaker: safeCast[0].player, line: 'Action! Let the scene begin!', direction: '[Steps into the frame]' },
  ];
  const safePlotChoices = Array.isArray(plotChoices) ? plotChoices : [];
  const safeColorStyles = Array.isArray(playerColorStyles) && playerColorStyles.length > 0 ? playerColorStyles : [
    { border: 'border-purple-500/40', bg: 'bg-purple-950/40', text: 'text-purple-300', ring: 'ring-purple-500/40', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  ];

  // Local state for custom photos declared FIRST to avoid TDZ reference errors
  const [localCustomPhotos, setLocalCustomPhotos] = useState<Record<string, string>>(() => ({
    ...getStoredCustomAvatars(),
    ...customPlayerPhotos,
  }));

  // Visual Display Mode: 'photorealistic' (cinema backdrop) or 'graphic-novel' (direct visualization)
  const [visualDisplayMode, setVisualDisplayMode] = useState<'graphic-novel' | 'photorealistic'>('photorealistic');

  // Scene & Character Image State - reliable photographic backdrop matching genre and act
  const [sceneImageUrl, setSceneImageUrl] = useState<string>(() => {
    return getDefaultRealisticSceneImage(genre, chapterNumber);
  });
  const [isGeneratingSceneImage, setIsGeneratingSceneImage] = useState<boolean>(false);
  const [characterPortraits, setCharacterPortraits] = useState<Record<string, string>>({});

  // Avatar Upload State
  const [uploadTargetPlayer, setUploadTargetPlayer] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Audio & Playback Controls
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [isSpeakingCurrentLine, setIsSpeakingCurrentLine] = useState<boolean>(false);
  const [isPlayingAudioCue, setIsPlayingAudioCue] = useState<boolean>(false);
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(false);
  const [soundEffectStamp, setSoundEffectStamp] = useState<string | null>(null);
  const [copiedCut, setCopiedCut] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showCastDrawer, setShowCastDrawer] = useState<boolean>(false);

  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Generate realistic character portraits matching nationality and custom uploads
  const fetchCharacterPortraits = useCallback(() => {
    if (safeCast.length === 0) return;
    const newPortraits: Record<string, string> = {};
    for (const member of safeCast) {
      if (member && member.player) {
        newPortraits[member.player.toLowerCase()] = getRealisticCharacterPhoto(
          member.player,
          member.role || 'Protagonist',
          genre || 'Nollywood Drama',
          localCustomPhotos
        );
      }
    }
    setCharacterPortraits(newPortraits);
  }, [safeCast, genre, localCustomPhotos]);

  // Current line details
  const currentItem = safeScriptLines[currentLineIndex] || safeScriptLines[0] || {
    speaker: safeCast[0]?.player || 'Director',
    line: 'Action! Roll camera!',
    direction: '[Cue action]',
  };
  const totalLines = safeScriptLines.length;
  const isLastLine = currentLineIndex >= totalLines - 1;

  const currentSpeakerIdx = currentItem && currentItem.speaker
    ? safeCast.findIndex((c) => (c.player || '').toLowerCase() === (currentItem.speaker || '').toLowerCase())
    : 0;
  const speakerIndexSafe = currentSpeakerIdx >= 0 ? currentSpeakerIdx : 0;
  const currentStyle = safeColorStyles[speakerIndexSafe % safeColorStyles.length] || safeColorStyles[0];
  const currentCastMember = safeCast.find(
    (c) => (c.player || '').toLowerCase() === (currentItem?.speaker || '').toLowerCase()
  ) || safeCast[0];

  // Direct Graphic Novel visualization URL in 9:16 portrait format (updates dynamically on each line)
  const graphicNovelVisualUrl = useMemo(() => {
    try {
      const visualBible = lockOrGetCharacterVisualBible(safeCast, genre, localCustomPhotos);
      const actionBeats = extractCharacterActionBeats(safeScriptLines, safeCast, visualBible);
      return generateDynamicSceneSvg(
        settingDescription,
        genre,
        actionBeats,
        '9:16',
        currentItem?.speaker,
        currentItem?.line,
        currentItem?.direction,
        localCustomPhotos,
        chapterNumber
      );
    } catch (e) {
      console.warn('Error creating graphic novel visualization:', e);
      return getDefaultRealisticSceneImage(genre, chapterNumber);
    }
  }, [settingDescription, genre, safeCast, localCustomPhotos, safeScriptLines, currentItem, chapterNumber]);

  // Active displayed image in portrait viewport - always an authentic photorealistic film still
  const activeDisplayedImage = (sceneImageUrl && !sceneImageUrl.startsWith('data:image/svg'))
    ? sceneImageUrl
    : getDefaultRealisticSceneImage(genre, chapterNumber);

  // Handle triggering file upload for a specific player
  const triggerUploadFor = (playerName: string) => {
    setUploadTargetPlayer(playerName);
    fileInputRef.current?.click();
  };

  // Handle file change from custom photo picker
  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTargetPlayer) return;
    try {
      const dataUrl = await compressImageFile(file, 400, 0.85);
      setStoredCustomAvatar(uploadTargetPlayer, dataUrl);
      setLocalCustomPhotos((prev) => ({
        ...prev,
        [uploadTargetPlayer.toLowerCase()]: dataUrl,
      }));
      onUpdateCustomPhoto?.(uploadTargetPlayer, dataUrl);
      soundEngine.playDialogueBlip(1.3);
      setSoundEffectStamp(`📷 ${uploadTargetPlayer.toUpperCase()} PHOTO UPDATED!`);
      setTimeout(() => setSoundEffectStamp(null), 1500);
    } catch (err) {
      console.warn('Failed to upload player photo:', err);
    } finally {
      if (e.target) e.target.value = '';
      setUploadTargetPlayer(null);
    }
  };

  // Always generate a new realistic image tailored to the current scene via backend Gemini
  const handleRegenerateScene = useCallback(async () => {
    setIsGeneratingSceneImage(true);
    try {
      const visualBible = lockOrGetCharacterVisualBible(cast, genre, localCustomPhotos);
      const actionDesc = extractPhysicalSceneAction(settingDescription, scriptLines, chapterTitle);
      const continuityBlock = buildContinuityPromptBlock(visualBible, cast, actionDesc);
      const actionBeats = extractCharacterActionBeats(scriptLines, cast, visualBible);

      // Reliable high-resolution scene photo matching genre and act as instant base
      const defaultBackdrop = getDefaultRealisticSceneImage(genre, chapterNumber);
      setSceneImageUrl((prev) => (prev && !prev.startsWith('data:image/svg') ? prev : defaultBackdrop));

      const res = await fetch('/api/sceneswap/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          genre,
          tone,
          setting_description: settingDescription,
          scene_heading: settingDescription,
          chapter_number: chapterNumber,
          chapter_title: chapterTitle,
          type: 'scene',
          aspectRatio: '9:16',
          forceRegenerate: true,
          cast: safeCast.map((c) => {
            const locked = visualBible[(c.player || '').toLowerCase().trim()];
            return {
              player: c.player,
              role: c.role,
              archetype: c.archetype,
              motivation: c.motivation,
              wardrobe: locked?.wardrobe,
              props: locked?.signatureProps,
              facialFeatures: locked?.facialFeatures,
              heritagePrompt: locked?.heritagePrompt,
            };
          }),
          character_beats: actionBeats,
          characterConsistencyPrompt: continuityBlock,
          physicalActionPrompt: actionDesc,
          activeSpeaker: currentItem?.speaker,
          activeLine: currentItem?.line,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.imageUrl && !data.imageUrl.startsWith('data:image/svg')) {
          setSceneImageUrl(data.imageUrl);
        }
      }
    } catch (err) {
      console.warn('Failed to generate new realistic scene image:', err);
    } finally {
      setIsGeneratingSceneImage(false);
    }
  }, [genre, tone, settingDescription, chapterNumber, chapterTitle, cast, localCustomPhotos, scriptLines, currentItem, safeCast]);

  // AUTOMATICALLY generate a new realistic image tailored to the scene for each new scene
  useEffect(() => {
    setSceneImageUrl(getDefaultRealisticSceneImage(genre, chapterNumber));
    handleRegenerateScene();
    fetchCharacterPortraits();
  }, [chapterNumber, chapterTitle, settingDescription, genre]);

  // Sound stamp trigger
  const handleTriggerStamp = (type: 'vine' | 'sting' | 'scratch' | 'boing' | 'thunder', label: string) => {
    setSoundEffectStamp(label);
    if (type === 'vine') soundEngine.playVineBoom();
    else if (type === 'sting') soundEngine.playSuspenseSting();
    else if (type === 'scratch') soundEngine.playRecordScratch();
    else if (type === 'boing') soundEngine.playComedicBoing();
    else if (type === 'thunder') soundEngine.playThunder();

    setTimeout(() => setSoundEffectStamp(null), 1300);
  };

  // Play atmospheric audio cue
  const handlePlaySceneCue = () => {
    setIsPlayingAudioCue(true);
    soundEngine.playAudioCueForText(audioCue);
    setSoundEffectStamp('🎧 ATMOS CUE');
    setTimeout(() => {
      setIsPlayingAudioCue(false);
      setSoundEffectStamp(null);
    }, 1800);
  };

  // Read current line aloud
  const handleSpeakCurrentLine = () => {
    if (!currentItem) return;
    if (isSpeakingCurrentLine) {
      soundEngine.stopSpeaking();
      setIsSpeakingCurrentLine(false);
      return;
    }

    setIsSpeakingCurrentLine(true);
    soundEngine.speakLine(currentItem.line, speakerIndexSafe, () => {
      setIsSpeakingCurrentLine(false);
    });
  };

  // Next Line Action
  const handleNextLine = () => {
    if (currentLineIndex < totalLines - 1) {
      soundEngine.playDialogueBlip(1.0 + (currentLineIndex % 3) * 0.15);
      onLineChange(currentLineIndex + 1);
    } else {
      soundEngine.playSuspenseSting();
      setViewSubMode('screenplay');
    }
  };

  // Prev Line Action
  const handlePrevLine = () => {
    if (currentLineIndex > 0) {
      soundEngine.playDialogueBlip(0.9);
      onLineChange(currentLineIndex - 1);
    }
  };

  // Auto-Play Cycle
  useEffect(() => {
    if (!isAutoPlaying) {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
      return;
    }

    if (currentItem) {
      soundEngine.speakLine(currentItem.line, speakerIndexSafe, () => {
        autoPlayTimerRef.current = setTimeout(() => {
          if (currentLineIndex < totalLines - 1) {
            onLineChange(currentLineIndex + 1);
          } else {
            setIsAutoPlaying(false);
            setViewSubMode('screenplay');
          }
        }, 1200);
      });
    }

    return () => {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
    };
  }, [isAutoPlaying, currentLineIndex, currentItem, speakerIndexSafe, totalLines, onLineChange]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === ' ' || e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextLine();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevLine();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentLineIndex, totalLines]);

  // Copy Director's Cut
  const handleCopyDirectorsCut = () => {
    const text = `🎬 [SCENESWAP DIRECTORS CUT - ACT ${chapterNumber}: ${chapterTitle}]\nGenre: ${genre} | Tone: ${tone}\nSetting: ${settingDescription}\n\nCAST ROLES:\n${safeCast.map((c) => `- ${c.player} as ${c.role} (${c.archetype})`).join('\n')}\n\nSCENE SCRIPT:\n${safeScriptLines.map((l) => `${(l.speaker || 'ACTOR').toUpperCase()} ${l.direction ? `(${l.direction}) ` : ''}: "${l.line}"`).join('\n\n')}\n\n${isFinale ? `GRAND FINALE: ${finaleSummary || ''}` : `CHOICES:\n${safePlotChoices.map((p) => `[${p.id}] ${p.label}: ${p.description}`).join('\n')}`}`;

    navigator.clipboard.writeText(text);
    setCopiedCut(true);
    soundEngine.playDialogueBlip(1.4);
    setTimeout(() => setCopiedCut(false), 2000);
  };

  const totalVotes = (voteCounts.A || 0) + (voteCounts.B || 0) + (voteCounts.C || 0);

  return (
    <div
      ref={containerRef}
      className={`relative w-full flex-1 flex flex-col rounded-2xl overflow-hidden border border-white/20 bg-black shadow-2xl transition-all duration-300 min-h-[580px] sm:min-h-[660px] h-full ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen w-screen min-h-screen' : ''
      }`}
    >
      {/* Hidden file input for uploading custom player avatars */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handlePhotoFileChange}
      />

      {/* =========================================================================
          TIKTOK PORTRAIT BACKGROUND (9:16 VERTICAL REEL PHOTO COVERING THE STAGE)
          ========================================================================= */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
        <img
          src={activeDisplayedImage || getDefaultRealisticSceneImage(genre, chapterNumber)}
          alt=""
          aria-label={settingDescription}
          referrerPolicy="no-referrer"
          onError={(e) => {
            const fallback = getDefaultRealisticSceneImage(genre, chapterNumber);
            if ((e.target as HTMLImageElement).src !== fallback) {
              (e.target as HTMLImageElement).src = fallback;
            }
          }}
          className={`h-full w-full object-cover object-center filter contrast-[1.08] transition-all duration-700 ${
            viewSubMode === 'screenplay'
              ? 'brightness-[0.25] blur-sm scale-105'
              : 'brightness-90 scale-100'
          }`}
        />

        {/* Subtle Edge Vignette */}
        <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none" />
      </div>

      {/* =========================================================================
          TOP TIKTOK STATUS HEADER BAR
          ========================================================================= */}
      <div className="relative z-30 flex items-center justify-between p-3 sm:p-4 text-xs">
        {/* Left: TikTok Live Script Indicator & Sub-mode Switcher */}
        <div className="flex items-center gap-2">
          {/* Live Indicator - Clean, No Pill Shape */}
          <div className="flex items-center gap-1.5 px-1 py-0.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <span className="font-black uppercase tracking-wider text-red-400 text-[10px] drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
              LIVE
            </span>
            <span className="text-white/40 text-[9px]">|</span>
            <span className="font-bold uppercase tracking-wider text-amber-300 text-[10px] drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
              ACT 0{chapterNumber}
            </span>
            {isDirectorPro ? (
              <span className="hidden sm:inline-flex items-center gap-1 font-extrabold uppercase tracking-wider text-amber-300 text-[9px] bg-amber-500/25 border border-amber-400/40 px-1.5 py-0.5 rounded shadow">
                <Crown className="h-2.5 w-2.5 text-amber-400" />
                VIP Director
              </span>
            ) : onOpenSubscriptionModal ? (
              <button
                type="button"
                onClick={onOpenSubscriptionModal}
                className="hidden sm:inline-flex items-center gap-1 font-bold text-amber-400 hover:text-white bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/30 px-1.5 py-0.5 rounded transition cursor-pointer text-[9px]"
              >
                <Crown className="h-2.5 w-2.5 text-amber-400" />
                <span>VIP Pass</span>
              </button>
            ) : null}
          </div>

          {/* Sub-mode Tab Selector: TikTok Reel vs Full Screenplay */}
          <div className="flex rounded-lg bg-black/75 p-0.5 border border-white/15 backdrop-blur-md shadow-inner">
            <button
              type="button"
              onClick={() => setViewSubMode('tiktok')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold transition ${
                viewSubMode === 'tiktok'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>📱 TikTok View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewSubMode('screenplay')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold transition ${
                viewSubMode === 'screenplay'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ScrollText className="h-3 w-3" />
              <span>Full Script</span>
            </button>
          </div>

          {/* Status indicator when generating new realistic scene */}
          {isGeneratingSceneImage && (
            <div className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-bold border border-amber-400/40 bg-black/80 text-amber-300 shadow animate-pulse backdrop-blur-md">
              <Sparkles className="h-3 w-3 text-amber-400 animate-spin" />
              <span>Generating scene...</span>
            </div>
          )}
        </div>

        {/* Right: Audio Cue, Mute, Re-render Photo, Fullscreen */}
        <div className="flex items-center gap-1.5">
          {/* Atmos Cue Button */}
          <button
            type="button"
            onClick={handlePlaySceneCue}
            title="Play atmospheric soundscape cue"
            className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold border backdrop-blur-md transition active:scale-95 ${
              isPlayingAudioCue
                ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-300/50'
                : 'bg-black/70 text-amber-300 hover:text-white border-amber-500/30'
            }`}
          >
            <Volume2 className={`h-3 w-3 ${isPlayingAudioCue ? 'animate-bounce' : ''}`} />
            <span className="hidden sm:inline font-mono">Cue</span>
          </button>

          {/* Audio Mute Toggle */}
          <button
            type="button"
            onClick={() => {
              const newMute = !isSoundMuted;
              setIsSoundMuted(newMute);
              soundEngine.setMuted(newMute);
            }}
            title={isSoundMuted ? 'Unmute' : 'Mute'}
            className="flex items-center rounded-lg bg-black/70 p-1.5 text-slate-300 hover:text-white border border-white/15 backdrop-blur-md transition active:scale-95"
          >
            {isSoundMuted ? <VolumeX className="h-3.5 w-3.5 text-rose-400" /> : <Volume2 className="h-3.5 w-3.5 text-emerald-400" />}
          </button>

          {/* Generate / Re-roll Realistic Scene Photo */}
          <button
            type="button"
            onClick={handleRegenerateScene}
            disabled={isGeneratingSceneImage}
            title="Generate new realistic scene photo tailored for this scene"
            className="flex items-center gap-1 rounded-lg bg-black/70 px-2 py-1 text-xs text-amber-300 hover:text-white border border-amber-500/30 hover:border-amber-400 backdrop-blur-md transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isGeneratingSceneImage ? 'animate-spin text-amber-400' : ''}`} />
            <span className="hidden sm:inline text-[10px] font-bold">New Photo</span>
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title="Toggle fullscreen"
            className="flex items-center rounded-lg bg-black/70 p-1.5 text-slate-300 hover:text-white border border-white/15 backdrop-blur-md transition active:scale-95"
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Visual Reaction Sound Stamp (TikTok Pop Sticker) */}
      {soundEffectStamp && (
        <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none animate-in zoom-in-75 fade-in duration-150">
          <div className="rotate-[-4deg] rounded-2xl border-4 border-yellow-300 bg-red-600/95 px-6 py-3 shadow-[0_0_50px_rgba(234,179,8,0.9)] backdrop-blur-xl">
            <p className="text-xl sm:text-3xl font-black italic tracking-widest text-white uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,1)]">
              💥 {soundEffectStamp} 💥
            </p>
          </div>
        </div>
      )}

      {/* =========================================================================
          TIKTOK RIGHT-SIDE FLOATING ACTION RAIL (SOUNDBOARD & REACTIONS)
          ========================================================================= */}
      {viewSubMode === 'tiktok' && (
        <div className="absolute right-2.5 sm:right-3.5 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-2.5">
          {/* Active Speaking Character Avatar Bubble with Upload Option */}
          {currentCastMember && (
            <div className="flex flex-col items-center group">
              <div
                onClick={() => triggerUploadFor(currentCastMember.player)}
                title={`Click to upload your own photo for ${currentCastMember.player}`}
                className={`relative h-12 w-12 sm:h-14 sm:w-14 rounded-full overflow-hidden border-2 ${currentStyle.border} shadow-[0_0_16px_rgba(0,0,0,0.8)] ring-2 ring-amber-400/50 bg-black cursor-pointer`}
              >
                <img
                  src={
                    characterPortraits[currentCastMember.player.toLowerCase()] ||
                    getRealisticCharacterPhoto(currentCastMember.player, currentCastMember.role, genre, localCustomPhotos)
                  }
                  alt={currentCastMember.player}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover object-top"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                  <Camera className="h-4 w-4 text-white" />
                </div>
                <span className="absolute bottom-0 inset-x-0 bg-red-600 text-[7px] font-black uppercase text-white text-center py-0.2">
                  LIVE
                </span>
              </div>
              <span className="text-[9px] font-bold text-white text-center mt-1 drop-shadow max-w-[50px] truncate">
                {currentCastMember.player}
              </span>
            </div>
          )}

          {/* Quick Sound FX Reaction Buttons */}
          <button
            type="button"
            onClick={() => handleTriggerStamp('vine', 'VINE BOOM!')}
            title="Vine Boom FX"
            className="flex flex-col items-center gap-0.5 group active:scale-90 transition"
          >
            <div className="h-9 w-9 rounded-full bg-black/75 hover:bg-red-600/80 border border-white/20 hover:border-red-400 flex items-center justify-center text-sm shadow-lg backdrop-blur-md transition">
              ⚡
            </div>
            <span className="text-[8px] font-bold text-slate-300 group-hover:text-amber-300 drop-shadow">
              Boom
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTriggerStamp('sting', 'DUN DUN DUN!')}
            title="Suspense Sting"
            className="flex flex-col items-center gap-0.5 group active:scale-90 transition"
          >
            <div className="h-9 w-9 rounded-full bg-black/75 hover:bg-purple-600/80 border border-white/20 hover:border-purple-400 flex items-center justify-center text-sm shadow-lg backdrop-blur-md transition">
              🎻
            </div>
            <span className="text-[8px] font-bold text-slate-300 group-hover:text-purple-300 drop-shadow">
              Sting
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTriggerStamp('scratch', '*SCRATCH*')}
            title="Record Scratch"
            className="flex flex-col items-center gap-0.5 group active:scale-90 transition"
          >
            <div className="h-9 w-9 rounded-full bg-black/75 hover:bg-pink-600/80 border border-white/20 hover:border-pink-400 flex items-center justify-center text-sm shadow-lg backdrop-blur-md transition">
              💿
            </div>
            <span className="text-[8px] font-bold text-slate-300 group-hover:text-pink-300 drop-shadow">
              Scratch
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTriggerStamp('boing', 'BOING!')}
            title="Comedic Boing"
            className="flex flex-col items-center gap-0.5 group active:scale-90 transition"
          >
            <div className="h-9 w-9 rounded-full bg-black/75 hover:bg-amber-600/80 border border-white/20 hover:border-amber-400 flex items-center justify-center text-sm shadow-lg backdrop-blur-md transition">
              🤪
            </div>
            <span className="text-[8px] font-bold text-slate-300 group-hover:text-amber-300 drop-shadow">
              Boing
            </span>
          </button>

          {/* Voice Line / TTS Button */}
          <button
            type="button"
            onClick={handleSpeakCurrentLine}
            title={isSpeakingCurrentLine ? 'Stop Voice' : 'Speak Dialogue Aloud'}
            className="flex flex-col items-center gap-0.5 group active:scale-90 transition"
          >
            <div
              className={`h-9 w-9 rounded-full flex items-center justify-center shadow-lg backdrop-blur-md transition border ${
                isSpeakingCurrentLine
                  ? 'bg-rose-500 border-rose-300 text-white animate-pulse'
                  : 'bg-black/75 hover:bg-emerald-600/80 border-white/20 text-emerald-300'
              }`}
            >
              <Mic className="h-4 w-4" />
            </div>
            <span className="text-[8px] font-bold text-slate-300 group-hover:text-emerald-300 drop-shadow">
              {isSpeakingCurrentLine ? 'Voicing' : 'Voice'}
            </span>
          </button>

          {/* Cast Dossier Toggle */}
          <button
            type="button"
            onClick={() => setShowCastDrawer(!showCastDrawer)}
            title="Cast roles, nationalities & secrets"
            className="flex flex-col items-center gap-0.5 group active:scale-90 transition"
          >
            <div className="h-9 w-9 rounded-full bg-black/75 hover:bg-indigo-600/80 border border-white/20 hover:border-indigo-400 flex items-center justify-center text-indigo-300 shadow-lg backdrop-blur-md transition">
              <Users className="h-4 w-4" />
            </div>
            <span className="text-[8px] font-bold text-slate-300 group-hover:text-indigo-300 drop-shadow">
              Cast
            </span>
          </button>
        </div>
      )}

      {/* =========================================================================
          VIEW A: TIKTOK LIVE TELEPROMPTER VIEW (FILLS SCREEN DOWN TO BOTTOM)
          ========================================================================= */}
      {viewSubMode === 'tiktok' ? (
        <div className="relative z-20 flex-1 flex flex-col justify-between p-3 sm:p-5 overflow-hidden">
          {/* Top Setting & Chapter Title - Clean Text, No Shape */}
          <div className="pt-1 pb-1 max-w-[85%] z-20 pointer-events-none">
            <span className="text-[10px] font-mono uppercase font-black tracking-widest text-amber-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] block">
              ACT {chapterNumber} • {genre.toUpperCase()}
            </span>
            <h2 className="text-xs sm:text-sm font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] tracking-tight truncate">
              {settingDescription || chapterTitle}
            </h2>
          </div>

          {/* Middle Viewport - Clean and unobstructed view */}
          <div className="flex-1" />

          {/* Floating Cast Members Drawer if toggled */}
          {showCastDrawer && (
            <div className="mb-3 rounded-2xl border border-white/20 bg-black/90 p-3 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-200 max-w-[85%] z-30">
              <div className="flex items-center justify-between mb-2 pb-1 border-b border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Cast Dossier & Characters
                </span>
                <button
                  type="button"
                  onClick={() => setShowCastDrawer(false)}
                  className="text-[10px] text-slate-400 hover:text-white"
                >
                  ✕ Close
                </button>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {safeCast.map((member, i) => {
                  const style = safeColorStyles[i % safeColorStyles.length] || safeColorStyles[0];
                  return (
                    <div key={i} className={`p-1.5 rounded-lg border ${style.border} ${style.bg} text-[10px]`}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{member.player}</span>
                        <span className={style.text}>{member.role} ({member.archetype})</span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-slate-300 italic text-[9px] truncate max-w-[180px]">&ldquo;{member.motivation}&rdquo;</p>
                        <button
                          type="button"
                          onClick={() => triggerUploadFor(member.player)}
                          className="text-amber-300 hover:text-amber-200 underline text-[9px] shrink-0 ml-2"
                        >
                          📷 Change Photo
                        </button>
                      </div>
                      {member.secret && (
                        <p className="text-amber-300 text-[8px] mt-0.5">🔒 {member.secret}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TikTok Bottom Subtitle Stage - Clean, No Box Shapes */}
          <div className="w-full space-y-2 max-w-[88%] sm:max-w-full">
            {/* Speaker Tag, Role, Direction - Clean Text */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-black uppercase tracking-wider drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)] ${currentStyle.text}`}>
                {currentItem?.speaker}
              </span>

              {currentCastMember && (
                <span className="text-[11px] font-bold text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]">
                  as <span className="text-amber-300">{currentCastMember.role}</span>
                </span>
              )}

              {currentItem?.direction && (
                <span className="text-[10px] text-amber-200/90 italic font-serif drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]">
                  ({currentItem.direction})
                </span>
              )}
            </div>

            {/* The TikTok Subtitle Text: Clean Floating Typography */}
            <div
              onClick={handleNextLine}
              className="cursor-pointer group relative py-1 px-0.5 transition duration-200 select-none"
            >
              <p className="text-base sm:text-xl font-black leading-relaxed text-white drop-shadow-[0_2px_8px_rgba(0,0,0,1)] tracking-tight">
                &ldquo;{currentItem?.line}&rdquo;
              </p>
              <div className="flex items-center justify-between pt-1 text-[10px] text-slate-300">
                <span className="font-mono text-amber-300 font-bold drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]">
                  Line {currentLineIndex + 1} of {totalLines}
                </span>
                <span className="group-hover:text-amber-300 transition text-[9px] drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]">
                  Tap to advance ➔
                </span>
              </div>
            </div>

            {/* Navigation & Controls Row */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <div className="flex items-center gap-1.5">
                {/* Prev Button */}
                <button
                  type="button"
                  onClick={handlePrevLine}
                  disabled={currentLineIndex === 0}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-black/60 text-slate-200 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition active:scale-95 shadow backdrop-blur-sm"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Prev</span>
                </button>

                {/* Auto Play */}
                <button
                  type="button"
                  onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition active:scale-95 shadow backdrop-blur-sm ${
                    isAutoPlaying
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-amber-400 shadow-amber-500/30'
                      : 'bg-black/60 text-slate-200 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {isAutoPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  <span>{isAutoPlaying ? 'Pause' : 'Auto'}</span>
                </button>
              </div>

              {/* Next Line / Finale Button */}
              <button
                type="button"
                onClick={handleNextLine}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition shadow-lg active:scale-95 ${
                  isLastLine
                    ? 'bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white border border-pink-400 hover:brightness-110 shadow-pink-500/30'
                    : 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 hover:brightness-110 shadow-amber-500/20'
                }`}
              >
                <span>{isLastLine ? 'Act Vote ➔' : 'Next ➔'}</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* =========================================================================
            VIEW B: COMPLETE SCREENPLAY SCRIPT & DOSSIER (OPTIMIZED TO FILL SCREEN DOWN)
            ========================================================================= */
        <div className="relative z-20 flex-1 flex flex-col p-3 sm:p-5 overflow-y-auto space-y-4">
          {/* Header Banner */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                ACT {chapterNumber} • {genre}
              </span>
              <h3 className="text-base sm:text-lg font-black text-white">
                {chapterTitle}
              </h3>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopyDirectorsCut}
                className="flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-xs text-slate-300 hover:text-white border border-white/15 transition active:scale-95"
              >
                <Share2 className="h-3 w-3" />
                <span>{copiedCut ? 'Copied Cut!' : "Director's Cut"}</span>
              </button>

              <button
                type="button"
                onClick={onResetToLobby}
                className="flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-xs text-slate-300 hover:text-white border border-white/15 transition active:scale-95"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Lobby</span>
              </button>
            </div>
          </div>

          {/* Cast Roles Badges Strip with Photo Upload */}
          <div className="rounded-xl border border-white/10 bg-black/60 p-3 backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                <Users className="h-3 w-3 text-indigo-400" />
                Cast Roles & Character Roster ({cast.length} Actors)
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {safeCast.map((member, i) => {
                const color = safeColorStyles[i % safeColorStyles.length] || safeColorStyles[0];
                const photo = characterPortraits[(member.player || '').toLowerCase()] || getRealisticCharacterPhoto(member.player, member.role, genre, localCustomPhotos);

                return (
                  <div key={i} className={`rounded-lg border ${color.border} ${color.bg} p-2 text-xs backdrop-blur-sm flex items-start gap-2`}>
                    <div
                      onClick={() => triggerUploadFor(member.player)}
                      title={`Upload custom photo for ${member.player}`}
                      className="relative group h-9 w-9 rounded-full overflow-hidden border border-white/30 shrink-0 bg-slate-900 cursor-pointer"
                    >
                      <img src={photo} alt={member.player} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                        <Camera className="h-3 w-3 text-white" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white flex items-center gap-1">
                          <span className={`h-1.5 w-1.5 rounded-full ${color.text}`} />
                          {member.player}
                        </span>
                        <span className={`text-[10px] font-medium ${color.text}`}>{member.role} ({member.archetype})</span>
                      </div>
                      <div className="flex items-center gap-1 text-[9px] text-emerald-300">
                        {localCustomPhotos[(member.player || '').toLowerCase()] && (
                          <span className="text-[8px] bg-emerald-500/20 text-emerald-300 px-1 rounded">Custom Photo</span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-300 mt-0.5 italic truncate">
                        &ldquo;{member.motivation}&rdquo;
                      </p>
                      {member.secret && (
                        <p className="text-[9px] text-slate-400 mt-0.5 line-clamp-1">
                          🔒 Secret: {member.secret}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Screenplay Dialogue Prompter View */}
          <div className="rounded-xl border border-white/10 bg-black/85 p-4 font-mono text-xs space-y-3 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <p className="flex items-center gap-1.5 text-[11px] font-sans font-semibold uppercase tracking-wider text-purple-300">
                <ScrollText className="h-3.5 w-3.5 text-purple-400" />
                Complete Screenplay Script
              </p>
              <span className="text-[10px] text-slate-400 font-sans">
                Tap any line to jump
              </span>
            </div>

            <div className="space-y-3">
              {safeScriptLines.map((item, idx) => {
                const playerIndex = safeCast.findIndex((c) => (c.player || '').toLowerCase() === (item.speaker || '').toLowerCase());
                const playerColor = safeColorStyles[(playerIndex >= 0 ? playerIndex : 0) % safeColorStyles.length] || safeColorStyles[0];
                const isCurrent = idx === currentLineIndex;

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      onLineChange(idx);
                      soundEngine.playDialogueBlip(1.1);
                    }}
                    className={`cursor-pointer rounded-lg p-2.5 transition-all border ${
                      isCurrent
                        ? 'border-amber-400 bg-amber-500/15 ring-1 ring-amber-400/40 shadow'
                        : 'border-transparent hover:border-white/15 hover:bg-white/5'
                    }`}
                  >
                    <div className="space-y-0.5 border-l-2 border-indigo-500/50 pl-2.5">
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-bold uppercase tracking-wider block ${playerColor.text}`}>
                          {item.speaker} {isCurrent && <span className="text-amber-400 text-[10px] ml-1">● Current Line</span>}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            soundEngine.speakLine(item.line, playerIndex >= 0 ? playerIndex : 0);
                          }}
                          className="text-[9px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-white/5"
                        >
                          🔊 Read
                        </button>
                      </div>
                      {item.direction && (
                        <span className="text-[10px] text-amber-200/80 italic block font-sans">
                          {item.direction}
                        </span>
                      )}
                      <p className="text-slate-100 text-xs leading-relaxed font-sans pt-0.5">
                        &ldquo;{item.line}&rdquo;
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Choice Matrix Voting Hub or Grand Finale Card */}
          {isFinale ? (
            <div className="rounded-2xl border border-amber-400/40 bg-gradient-to-br from-amber-950/60 via-purple-950/40 to-black p-4 text-center space-y-3 shadow-[0_0_30px_rgba(251,191,36,0.25)]">
              <div className="flex items-center justify-center gap-1.5 text-amber-300 text-xs font-bold uppercase tracking-widest">
                <Crown className="h-4 w-4 text-amber-400" />
                Grand Finale Climax Resolution
              </div>
              <p className="text-xs text-amber-100/90 leading-relaxed font-sans italic px-2">
                &ldquo;{finaleSummary}&rdquo;
              </p>
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyDirectorsCut}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-3 py-2.5 text-xs font-bold text-slate-950 shadow-lg hover:brightness-110 active:scale-95 transition"
                >
                  <Copy className="h-3.5 w-3.5 text-slate-950" />
                  <span>{copiedCut ? "Copied Director's Cut!" : 'Copy Complete Screenplay'}</span>
                </button>
                <button
                  type="button"
                  onClick={onResetToLobby}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-white/10 active:scale-95 transition"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  New Shoot
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-b from-purple-950/60 via-indigo-950/30 to-black p-4 space-y-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-pink-400" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-200">
                    Choice Matrix Voting Hub
                  </span>
                </div>
                <span className="text-[10px] text-indigo-300 font-medium">
                  Vote for Act {chapterNumber + 1}
                </span>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                How will your crew react to this twist? Cast your vote:
              </p>

              <div className="space-y-2">
                {safePlotChoices.map((choice) => {
                  const isSelected = selectedVoteId === choice.id;
                  const votes = voteCounts[choice.id] || 0;
                  const votePercent = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                  const choiceEmojis: Record<string, string> = {
                    A: '🔥 Chaos Move',
                    B: '🕵️ Coverup Gambit',
                    C: '🤯 Plot Twist',
                  };

                  return (
                    <div
                      key={choice.id}
                      onClick={() => {
                        onSelectVote(choice.id);
                        soundEngine.playDialogueBlip(1.2);
                      }}
                      className={`relative overflow-hidden rounded-xl border p-3 transition select-none cursor-pointer ${
                        isSelected
                          ? 'border-purple-400 bg-purple-950/70 shadow-[0_0_20px_rgba(168,85,247,0.35)] ring-1 ring-purple-400/50'
                          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                      }`}
                    >
                      {totalVotes > 0 && (
                        <div
                          className="absolute bottom-0 left-0 top-0 bg-purple-500/15 transition-all duration-300 pointer-events-none"
                          style={{ width: `${votePercent}%` }}
                        />
                      )}

                      <div className="relative flex items-start justify-between gap-2 z-10">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                isSelected ? 'bg-purple-500 text-white shadow' : 'bg-white/10 text-slate-300'
                              }`}
                            >
                              Option {choice.id}
                            </span>
                            <span className="text-[10px] font-bold text-pink-300">
                              {choiceEmojis[choice.id] || ''}
                            </span>
                            <h4 className="text-xs font-bold text-white">{choice.label}</h4>
                          </div>
                          <p className="text-[11px] text-slate-200 leading-snug">
                            {choice.description}
                          </p>
                          <div className="flex items-center gap-2 pt-0.5">
                            <p className="text-[10px] text-amber-300/90 italic font-sans">
                              ⚡ Consequence: {choice.consequence_hint}
                            </p>
                            {totalVotes > 0 && (
                              <span className="text-[10px] font-mono font-bold text-purple-300 ml-auto">
                                {votePercent}% of cast
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Lock-In & Branch CTA */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playVineBoom();
                    onLockInVoteAndBranch();
                  }}
                  disabled={!selectedVoteId || isBranchingChapter}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white shadow-xl hover:brightness-110 disabled:opacity-40 disabled:pointer-events-none transition active:scale-95 shadow-purple-500/30"
                >
                  {isBranchingChapter ? (
                    <>
                      <Sparkles className="h-4 w-4 animate-spin" />
                      <span>Directing Act {chapterNumber + 1}...</span>
                    </>
                  ) : (
                    <>
                      <span>Lock In Option {selectedVoteId || 'A'} & Branch</span>
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
