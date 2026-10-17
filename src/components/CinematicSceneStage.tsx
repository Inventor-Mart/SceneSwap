import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Volume2,
  VolumeX,
  Sparkles,
  Zap,
  Play,
  Pause,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  RefreshCw,
  Clapperboard,
  Mic,
  Radio,
  Flame,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Share2,
  Film,
  Camera,
  Download,
  Image,
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
import { getSmartSceneBackdrop } from '../utils/sceneVisualEngine';

export function getDefaultRealisticSceneImage(
  genre: string,
  chapter: number,
  settingDescription: string = '',
  variationIndex: number = 0
): string {
  return getSmartSceneBackdrop({
    genre,
    chapterNumber: chapter,
    settingDescription,
    variationIndex,
  }).url;
}

export interface CastMember {
  player: string;
  role: string;
  archetype: string;
  motivation: string;
  secret?: string;
  portraitUrl?: string;
}

export interface ScriptLine {
  speaker: string;
  direction?: string;
  line: string;
}

export interface PlotChoice {
  id: 'A' | 'B' | 'C';
  label: string;
  description: string;
  consequence_hint: string;
}

interface CinematicSceneStageProps {
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
  voteCounts: { A: number; B: number; C: number };
  onLockInVoteAndBranch: () => void;
  isBranchingChapter: boolean;
  onResetToLobby: () => void;
  playerColorStyles: { border: string; bg: string; text: string; ring?: string; badge?: string }[];
  customPlayerPhotos?: Record<string, string>;
  onUpdateCustomPhoto?: (playerName: string, dataUrl: string) => void;
}

export function CinematicSceneStage({
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
}: CinematicSceneStageProps) {
  // Defensive guarantees against malformed AI outputs
  const safeCast = Array.isArray(cast) && cast.length > 0 ? cast : [
    { player: 'Player 1', role: 'Protagonist', archetype: 'The Lead', motivation: 'Complete the scene' },
    { player: 'Player 2', role: 'Deuteragonist', archetype: 'The Wildcard', motivation: 'Challenge the status quo' },
  ];
  const safeScriptLines = Array.isArray(scriptLines) && scriptLines.length > 0 ? scriptLines : [
    { speaker: safeCast[0].player, line: 'Action! Let the scene begin!', direction: '[Steps into the frame]' },
    { speaker: safeCast[1]?.player || safeCast[0].player, line: 'Wait, did you hear that sound?', direction: '[Looking around nervously]' },
  ];
  const safePlotChoices = Array.isArray(plotChoices) ? plotChoices : [];
  const safeColorStyles = Array.isArray(playerColorStyles) && playerColorStyles.length > 0 ? playerColorStyles : [
    { border: 'border-purple-500/40', bg: 'bg-purple-950/40', text: 'text-purple-300', ring: 'ring-purple-500/40', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  ];

  // Current Line Details
  const currentItem = safeScriptLines[currentLineIndex] || safeScriptLines[0] || {
    speaker: safeCast[0]?.player || 'Director',
    line: 'Action! Roll camera!',
    direction: '[Cue action]'
  };

  // Visual Display Mode: 'photorealistic' (cinema backdrop) or 'graphic-novel' (direct visualization)
  const [visualDisplayMode, setVisualDisplayMode] = useState<'graphic-novel' | 'photorealistic'>('photorealistic');

  // Local state for custom photos to ensure immediate re-rendering
  const [localCustomPhotos, setLocalCustomPhotos] = useState<Record<string, string>>(() => ({
    ...getStoredCustomAvatars(),
    ...customPlayerPhotos,
  }));
  const [uploadTargetPlayer, setUploadTargetPlayer] = useState<string | null>(null);
  const stageFileInputRef = useRef<HTMLInputElement | null>(null);

  // Character Portraits Cache - Pre-populated with realistic photographic portraits from 0ms
  const [characterPortraits, setCharacterPortraits] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const member of safeCast) {
      if (member && member.player) {
        map[member.player.toLowerCase()] = getRealisticCharacterPhoto(
          member.player,
          member.role || 'Protagonist',
          genre || 'Nollywood Drama',
          { ...getStoredCustomAvatars(), ...customPlayerPhotos }
        );
      }
    }
    return map;
  });

  // Direct Graphic Novel visualization URL (updates dynamically on each line / action / speaker)
  const graphicNovelVisualUrl = useMemo(() => {
    try {
      const visualBible = lockOrGetCharacterVisualBible(safeCast, genre, localCustomPhotos);
      const actionBeats = extractCharacterActionBeats(safeScriptLines, safeCast, visualBible);
      return generateDynamicSceneSvg(
        settingDescription,
        genre,
        actionBeats,
        '16:9',
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

  // Scene Image State - reliable photographic backdrop matching genre and act
  const [sceneImageUrl, setSceneImageUrl] = useState<string>(() => {
    return getDefaultRealisticSceneImage(genre, chapterNumber);
  });
  const [isGeneratingSceneImage, setIsGeneratingSceneImage] = useState<boolean>(false);
  const [isAiGeneratedScene, setIsAiGeneratedScene] = useState<boolean>(false);

  // Playback & Audio Controls
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [isSpeakingCurrentLine, setIsSpeakingCurrentLine] = useState<boolean>(false);
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(false);
  const [soundEffectStamp, setSoundEffectStamp] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showChoiceModal, setShowChoiceModal] = useState<boolean>(false);
  const [copiedCut, setCopiedCut] = useState<boolean>(false);

  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const stageContainerRef = useRef<HTMLDivElement | null>(null);

  // Handle triggering file upload for a specific player
  const triggerUploadFor = (playerName: string) => {
    setUploadTargetPlayer(playerName);
    stageFileInputRef.current?.click();
  };

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

  // Active displayed image in viewport
  const activeDisplayedImage = visualDisplayMode === 'graphic-novel' ? graphicNovelVisualUrl : sceneImageUrl;

  // Download graphic novel panel snapshot
  const handleDownloadComicPanel = () => {
    const targetUrl = activeDisplayedImage || graphicNovelVisualUrl;
    if (!targetUrl) return;
    const a = document.createElement('a');
    a.href = targetUrl;
    a.download = `sceneswap-act${chapterNumber}-${(genre || 'scene').replace(/\s+/g, '_')}-panel.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    soundEngine.playDialogueBlip(1.4);
    setSoundEffectStamp('📥 COMIC PANEL SAVED!');
    setTimeout(() => setSoundEffectStamp(null), 1400);
  };

  // Fetch or generate realistic scene image with characters inside the scene!
  const fetchRealisticSceneImage = useCallback(async (forceRegenerate: boolean = false) => {
    setIsGeneratingSceneImage(true);
    try {
      const visualBible = lockOrGetCharacterVisualBible(safeCast, genre, localCustomPhotos);
      const actionDesc = extractPhysicalSceneAction(settingDescription || 'INT. STAGE', safeScriptLines, chapterTitle || 'Act 1');
      const continuityBlock = buildContinuityPromptBlock(visualBible, safeCast, actionDesc);
      const actionBeats = extractCharacterActionBeats(safeScriptLines, safeCast, visualBible);

      // Generate direct graphic novel scene SVG
      const directSvg = generateDynamicSceneSvg(
        settingDescription,
        genre,
        actionBeats,
        '16:9',
        currentItem?.speaker,
        currentItem?.line,
        currentItem?.direction,
        localCustomPhotos,
        chapterNumber
      );
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
          aspectRatio: '16:9',
          forceRegenerate: true,
          cast: safeCast.map((c) => {
            const playerKey = String(c?.player || '').toLowerCase().trim();
            const locked = playerKey ? visualBible[playerKey] : undefined;
            return {
              player: c?.player || 'Actor',
              role: c?.role || 'Protagonist',
              archetype: c?.archetype || 'The Lead',
              motivation: c?.motivation || 'Play the scene',
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
          activeDirection: currentItem?.direction,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.imageUrl && !data.imageUrl.startsWith('data:image/svg')) {
          setSceneImageUrl(data.imageUrl);
          setIsAiGeneratedScene(!!data.isAiGenerated);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch realistic scene image:', err);
    } finally {
      setIsGeneratingSceneImage(false);
    }
  }, [genre, tone, settingDescription, chapterNumber, chapterTitle, safeCast, localCustomPhotos, safeScriptLines]);

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

  // AUTOMATICALLY load scene visual matching the scene heading and character actions on chapter change!
  useEffect(() => {
    fetchRealisticSceneImage();
    fetchCharacterPortraits();
  }, [chapterNumber, chapterTitle, settingDescription, genre]);

  // Current Line Details
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

  // Speak current line with voice
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
      // Reached the end of the scene dialogue
      soundEngine.playSuspenseSting();
      setShowChoiceModal(true);
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

    // Speak line then advance after duration
    if (currentItem) {
      soundEngine.speakLine(currentItem.line, speakerIndexSafe, () => {
        // Line speaking finished, schedule next
        autoPlayTimerRef.current = setTimeout(() => {
          if (currentLineIndex < totalLines - 1) {
            onLineChange(currentLineIndex + 1);
          } else {
            setIsAutoPlaying(false);
            setShowChoiceModal(true);
          }
        }, 1200);
      });
    }

    return () => {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
    };
  }, [isAutoPlaying, currentLineIndex, currentItem, speakerIndexSafe, totalLines, onLineChange]);

  // Keyboard navigation
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

  // Calculate vote totals
  const totalVotes = (voteCounts.A || 0) + (voteCounts.B || 0) + (voteCounts.C || 0);

  // Copy Screenplay Director's Cut
  const handleCopyDirectorsCut = () => {
    const text = `🎬 [SCENESWAP DIRECTORS CUT - ACT ${chapterNumber}: ${chapterTitle}]\nGenre: ${genre} | Tone: ${tone}\nSetting: ${settingDescription}\n\nCAST ROLES:\n${safeCast.map((c) => `- ${c.player} as ${c.role} (${c.archetype})`).join('\n')}\n\nSCENE SCRIPT:\n${safeScriptLines.map((l) => `${(l.speaker || 'ACTOR').toUpperCase()} ${l.direction ? `(${l.direction}) ` : ''}: "${l.line}"`).join('\n\n')}\n\n${isFinale ? `GRAND FINALE: ${finaleSummary || ''}` : `CHOICES:\n${safePlotChoices.map((p) => `[${p.id}] ${p.label}: ${p.description}`).join('\n')}`}`;

    navigator.clipboard.writeText(text);
    setCopiedCut(true);
    soundEngine.playDialogueBlip(1.4);
    setTimeout(() => setCopiedCut(false), 2000);
  };

  return (
    <div
      ref={stageContainerRef}
      className={`relative w-full overflow-hidden rounded-2xl border border-white/15 bg-black shadow-2xl transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen w-screen' : ''
      }`}
    >
      {/* Hidden file input for custom photo uploads */}
      <input
        type="file"
        ref={stageFileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handlePhotoFileChange}
      />
      {/* 1. CINEMATIC SCENE IMAGE VIEWPORT (LARGE PHOTOREALISTIC DOMINANT VIEW) */}
      <div className="relative w-full aspect-[16/9] min-h-[380px] md:min-h-[500px] lg:min-h-[560px] overflow-hidden bg-slate-950 flex flex-col justify-between">
        {/* Active Scene Background: Direct Graphic Novel Panel or Cinema Photo */}
        {activeDisplayedImage ? (
          <img
            src={activeDisplayedImage}
            alt=""
            aria-label={settingDescription}
            referrerPolicy="no-referrer"
            className="absolute inset-0 h-full w-full object-cover object-center filter contrast-[1.05] brightness-100 transition-opacity duration-300 select-none pointer-events-none"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-950/40 to-black flex items-center justify-center">
            <div className="text-center space-y-2 p-6">
              <Sparkles className="h-8 w-8 text-amber-400 mx-auto animate-spin" />
              <p className="text-xs text-slate-300 font-medium">Generating graphic novel scene visualization...</p>
            </div>
          </div>
        )}

        {/* Cinematic Film Lighting Vignette & Gradient Overlays (subtle in graphic novel mode) */}
        {visualDisplayMode === 'photorealistic' && (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90 pointer-events-none" />
            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none" />
          </>
        )}

        {/* Top Control Bar: Act, Genre, Mode Switcher, Save Image, Sound */}
        <div className="relative z-20 flex items-center justify-between p-3 md:p-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1 border border-white/20 backdrop-blur-md">
              <Film className="h-3.5 w-3.5 text-amber-400" />
              <span className="font-black uppercase tracking-wider text-white text-[11px]">
                Act {chapterNumber}
              </span>
              <span className="text-slate-400 text-[10px]">|</span>
              <span className="text-amber-300 font-semibold text-[11px] truncate max-w-[160px] sm:max-w-[260px]">
                {chapterTitle}
              </span>
            </div>

            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] text-slate-300 backdrop-blur-sm border border-white/10">
              {genre}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {/* Visual Display Mode: Graphic Novel vs Cinema Still */}
            <button
              type="button"
              onClick={() => {
                const nextMode = visualDisplayMode === 'graphic-novel' ? 'photorealistic' : 'graphic-novel';
                setVisualDisplayMode(nextMode);
                soundEngine.playDialogueBlip(1.2);
              }}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider backdrop-blur-md transition active:scale-95 border ${
                visualDisplayMode === 'graphic-novel'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                  : 'bg-black/70 text-slate-300 border-white/15 hover:text-white'
              }`}
              title="Toggle between Direct Graphic Novel visualization and Cinema Still"
            >
              <span>{visualDisplayMode === 'graphic-novel' ? '🎨 Comic Art' : '📸 Film Still'}</span>
            </button>

            {/* Save Graphic Novel Panel Image */}
            <button
              type="button"
              onClick={handleDownloadComicPanel}
              className="flex items-center gap-1 rounded-lg bg-black/70 px-2 py-1 text-[10px] text-slate-300 hover:text-white border border-white/15 backdrop-blur-md transition active:scale-95"
              title="Download Graphic Novel Scene Image"
            >
              <Download className="h-3 w-3 text-amber-400" />
              <span className="hidden md:inline">Save Image</span>
            </button>

            {/* Re-render Scene Photo */}
            <button
              type="button"
              onClick={() => fetchRealisticSceneImage(true)}
              disabled={isGeneratingSceneImage}
              title="Regenerate scene visuals"
              className="flex items-center gap-1 rounded-lg bg-black/70 px-2 py-1 text-[10px] text-amber-300 hover:text-white border border-amber-500/30 hover:border-amber-400 backdrop-blur-md transition active:scale-95"
            >
              <RefreshCw className={`h-3 w-3 ${isGeneratingSceneImage ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline font-medium">
                {isGeneratingSceneImage ? 'Rendering...' : 'Re-render'}
              </span>
            </button>

            {/* Audio Toggle */}
            <button
              type="button"
              onClick={() => {
                const newMute = !isSoundMuted;
                setIsSoundMuted(newMute);
                soundEngine.setMuted(newMute);
              }}
              className="flex items-center gap-1 rounded-lg bg-black/70 p-1.5 text-[10px] text-slate-300 hover:text-white border border-white/15 backdrop-blur-md transition active:scale-95"
            >
              {isSoundMuted ? <VolumeX className="h-3.5 w-3.5 text-rose-400" /> : <Volume2 className="h-3.5 w-3.5 text-emerald-400" />}
            </button>

            {/* Fullscreen Expand */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="flex items-center gap-1 rounded-lg bg-black/70 p-1.5 text-[10px] text-slate-300 hover:text-white border border-white/15 backdrop-blur-md transition active:scale-95"
            >
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Sound Effect Visual Stamp Popup */}
        {soundEffectStamp && (
          <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none animate-in zoom-in-50 fade-in duration-150">
            <div className="rounded-2xl border-4 border-yellow-400 bg-black/90 px-6 py-3 shadow-[0_0_50px_rgba(250,204,21,0.8)] backdrop-blur-xl">
              <p className="text-2xl md:text-4xl font-black italic tracking-widest text-yellow-300 uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,1)]">
                {soundEffectStamp}
              </p>
            </div>
          </div>
        )}

        {/* 1. SCENE HEADING & SETTING DESCRIPTION BANNER - ALWAYS VISIBLE, NEVER COVERED */}
        <div className="relative z-20 px-3 md:px-5 mt-1 animate-in fade-in duration-200">
          <div className="rounded-xl border border-amber-500/40 bg-black/90 px-3.5 py-2 backdrop-blur-md shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black font-mono">
                🎬
              </span>
              <div className="min-w-0">
                <span className="text-[10px] font-mono uppercase font-black tracking-widest text-amber-400 block">
                  SCENE HEADING • {genre.toUpperCase()}
                </span>
                <p className="text-xs sm:text-sm font-black text-white tracking-wide truncate drop-shadow">
                  {settingDescription || 'INT. FILM SET - DRAMATIC CINEMATIC ATMOSPHERE'}
                </p>
              </div>
            </div>
            {audioCue && (
              <div className="hidden md:flex items-center gap-1.5 shrink-0 text-[10px] text-purple-200 bg-purple-950/70 px-2.5 py-1 rounded-md border border-purple-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
                <span className="truncate max-w-[260px]">Atmosphere: {audioCue}</span>
              </div>
            )}
          </div>
        </div>

        {/* 2. ACTOR'S ACTION / STAGE DIRECTION HIGHLIGHT */}
        {currentItem?.direction ? (
          <div className="relative z-20 px-3 md:px-6 my-auto py-1 flex flex-col items-center justify-center pointer-events-none">
            <div className="max-w-xl rounded-xl border border-amber-400/40 bg-black/85 px-3 py-1.5 shadow-[0_0_25px_rgba(0,0,0,0.8)] backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-400 text-slate-950 text-[9px] font-black">
                  ⚡
                </span>
                <span className="text-[10px] font-mono uppercase font-black text-amber-300">
                  {currentItem.speaker}:
                </span>
                <p className="text-xs font-semibold italic text-amber-100 font-serif truncate">
                  &ldquo;{currentItem.direction}&rdquo;
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="my-auto" />
        )}

        {/* 3. LIVE DIALOGUE OVERLAY (COMIC SPEECH BALLOON IN COMIC MODE, CINEMA OVERLAY IN PHOTOREALISTIC MODE) */}
        {visualDisplayMode === 'graphic-novel' ? (
          <div className="w-full max-w-2xl mx-auto px-4 my-2 z-20 animate-in slide-in-from-bottom-2 fade-in duration-150">
            <div className="relative rounded-2xl border-[3.5px] border-black bg-white p-3.5 md:p-4 text-slate-950 shadow-[6px_6px_0px_#000000]">
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md ${currentStyle.bg} ${currentStyle.text} border-2 border-black shadow-[2px_2px_0px_#000]`}>
                  💬 {currentItem?.speaker}
                </span>
                <span className="text-[10px] font-mono font-black text-amber-500 uppercase tracking-widest bg-black px-2 py-0.5 rounded">
                  PANEL ACT 0{chapterNumber}
                </span>
              </div>
              <p className="text-sm md:text-base font-black leading-snug text-slate-950 tracking-tight">
                &ldquo;{currentItem?.line}&rdquo;
              </p>
              {/* Comic Speech Tail pointing down */}
              <div className="absolute -bottom-3 left-12 h-0 w-0 border-x-8 border-x-transparent border-t-[12px] border-t-black" />
              <div className="absolute -bottom-2 left-[49px] h-0 w-0 border-x-[7px] border-x-transparent border-t-[10px] border-t-white" />
            </div>
          </div>
        ) : (
          <div className="w-full max-w-2xl mx-auto px-4 my-2 z-20 animate-in slide-in-from-bottom-2 fade-in duration-150">
            <div className="relative rounded-2xl border-2 border-white/40 bg-white/95 backdrop-blur-md p-3 md:p-3.5 text-slate-950 shadow-[0_12px_40px_rgba(0,0,0,0.95)]">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${currentStyle.bg} ${currentStyle.text} border ${currentStyle.border}`}>
                  💬 {currentItem?.speaker}
                </span>
                <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                  Live Dialogue
                </span>
              </div>
              <p className="text-sm md:text-base font-bold leading-snug text-slate-950 tracking-tight">
                &ldquo;{currentItem?.line}&rdquo;
              </p>
              {/* Speech Tail pointing down to speaker */}
              <div className="absolute -bottom-2.5 left-10 h-0 w-0 border-x-8 border-x-transparent border-t-8 border-t-white" />
            </div>
          </div>
        )}

        {/* 4. CHARACTERS IN THE SCENE (REALISTIC PORTRAITS & SPOTLIGHT ACTOR) */}
        <div className="relative z-20 px-4 md:px-8 pb-2 flex items-end justify-between gap-3">
          {/* Active Speaking Character Spotlight Card (Hero Stance) */}
          {currentCastMember && (
            <div className="flex items-end gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="relative group">
                {/* Character Portrait with Glowing Aura */}
                <div
                  onClick={() => triggerUploadFor(currentCastMember.player)}
                  title={`Upload your own photo for ${currentCastMember.player}`}
                  className={`relative h-20 w-20 md:h-28 md:w-28 rounded-2xl overflow-hidden border-2 ${currentStyle.border} ${currentStyle.ring || 'ring-4 ring-amber-400/30'} shadow-[0_0_24px_rgba(0,0,0,0.8)] bg-slate-900 transition-all duration-300 cursor-pointer`}
                >
                  <img
                    src={characterPortraits[currentCastMember.player.toLowerCase()] || getRealisticCharacterPhoto(currentCastMember.player, currentCastMember.role, genre, localCustomPhotos)}
                    alt={currentCastMember.player}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover object-top filter brightness-105"
                  />

                  {/* Speaking Indicator Pulse Halo */}
                  <div className="absolute top-1.5 right-1.5 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                  </div>

                  {/* Photo Upload Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 text-[9px] font-bold text-white transition">
                    <Camera className="h-3.5 w-3.5 text-amber-300" />
                    <span>My Photo</span>
                  </div>
                </div>

                {/* Character Role Tag */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/90 px-2 py-0.5 border border-white/20 text-[9px] md:text-[10px] font-bold text-white shadow">
                  <span className={currentStyle.text}>{currentCastMember.role}</span>
                </div>
              </div>

              {/* Character Details Pill */}
              <div className="hidden sm:block text-left mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black uppercase tracking-wider text-white drop-shadow">
                    {currentCastMember.player}
                  </span>
                  <span className="text-[9px] font-bold text-amber-300 bg-black/75 px-1.5 py-0.2 rounded border border-white/10">
                    {currentCastMember.archetype}
                  </span>
                </div>
                <p className="text-[10px] text-amber-200/90 font-medium italic drop-shadow">
                  &ldquo;{currentCastMember.motivation}&rdquo;
                </p>
              </div>
            </div>
          )}

          {/* Other Cast Members in Scene (Flanking Lineup) */}
          <div className="flex items-center gap-1.5 bg-black/60 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
            <span className="hidden md:inline text-[9px] font-bold uppercase tracking-wider text-slate-400 pl-1 pr-1">
              Scene Cast:
            </span>
            {safeCast.map((member, i) => {
              const isSpeaking = (member.player || '').toLowerCase() === (currentItem?.speaker || '').toLowerCase();
              const style = safeColorStyles[i % safeColorStyles.length] || safeColorStyles[0];

              return (
                <div
                  key={i}
                  className="relative group flex flex-col items-center"
                >
                  <button
                    type="button"
                    onClick={() => {
                      const nextLineIdx = safeScriptLines.findIndex(
                        (l) => (l.speaker || '').toLowerCase() === (member.player || '').toLowerCase()
                      );
                      if (nextLineIdx >= 0) {
                        soundEngine.playDialogueBlip(1.1);
                        onLineChange(nextLineIdx);
                      }
                    }}
                    title={`${member.player} as ${member.role} (${member.archetype})`}
                    className={`relative h-10 w-10 md:h-12 md:w-12 rounded-xl overflow-hidden border transition-all duration-200 active:scale-95 ${
                      isSpeaking
                        ? `border-amber-400 scale-105 ring-2 ring-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.6)]`
                        : `border-white/20 opacity-60 hover:opacity-100 hover:border-white/50`
                    }`}
                  >
                    <img
                      src={characterPortraits[member.player.toLowerCase()] || getRealisticCharacterPhoto(member.player, member.role, genre, localCustomPhotos)}
                      alt={member.player}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover object-top"
                    />
                    {isSpeaking && (
                      <div className="absolute inset-x-0 bottom-0 bg-black/80 text-[7px] font-bold text-amber-300 text-center py-0.2">
                        LIVE
                      </div>
                    )}
                  </button>

                  {/* Camera icon button to upload photo */}
                  <button
                    type="button"
                    onClick={() => triggerUploadFor(member.player)}
                    title={`Upload photo for ${member.player}`}
                    className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-black/80 border border-white/30 flex items-center justify-center text-slate-300 hover:text-white hover:bg-amber-600 transition"
                  >
                    <Camera className="h-2.5 w-2.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. DIALOGUE BAR: ONE LINE AT A TIME SUBTITLE STAGE */}
        <div className="relative z-30 w-full p-3 md:p-5 bg-gradient-to-t from-black via-black/95 to-black/85 border-t border-white/15 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto space-y-2.5">
            {/* Speaker Tag & Stage Direction */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider border ${currentStyle.border} ${currentStyle.bg} ${currentStyle.text}`}>
                  {currentItem?.speaker}
                </span>

                {currentCastMember && (
                  <span className="text-[11px] font-semibold text-slate-300">
                    as <strong className="text-white">{currentCastMember.role}</strong>
                  </span>
                )}

                {currentItem?.direction && (
                  <span className="text-[11px] text-amber-300/90 italic font-serif">
                    {currentItem.direction}
                  </span>
                )}
              </div>

              {/* Progress & Quick Sound Triggers */}
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] text-slate-400 font-bold bg-white/5 px-2 py-0.5 rounded border border-white/10">
                  Line {currentLineIndex + 1} / {totalLines}
                </span>

                {/* Instant Fun Soundboard Quick FX */}
                <div className="hidden sm:flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleTriggerStamp('vine', '💥 BOOM!')}
                    title="Vine Boom"
                    className="p-1 rounded bg-white/5 hover:bg-white/15 text-[10px] text-yellow-400 border border-white/10 active:scale-95"
                  >
                    ⚡ Boom
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTriggerStamp('sting', '🎻 DRAMA!')}
                    title="Drama Sting"
                    className="p-1 rounded bg-white/5 hover:bg-white/15 text-[10px] text-purple-400 border border-white/10 active:scale-95"
                  >
                    🎻 Sting
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTriggerStamp('scratch', '💿 OOPS!')}
                    title="Record Scratch"
                    className="p-1 rounded bg-white/5 hover:bg-white/15 text-[10px] text-pink-400 border border-white/10 active:scale-95"
                  >
                    💿 Scratch
                  </button>
                </div>
              </div>
            </div>

            {/* The One Single Spoken Line (Cinematic High-Contrast Typography) */}
            <div
              onClick={handleNextLine}
              className="cursor-pointer group relative rounded-xl bg-white/5 hover:bg-white/10 p-3.5 md:p-4 border border-white/10 transition duration-200 select-none"
            >
              <p className="text-sm md:text-lg lg:text-xl font-medium leading-relaxed text-white drop-shadow tracking-tight">
                &ldquo;{currentItem?.line}&rdquo;
              </p>
              <span className="absolute bottom-1 right-2 text-[9px] text-slate-500 group-hover:text-amber-400 transition">
                Tap anywhere or press [Space] to advance ➔
              </span>
            </div>

            {/* Dialogue Controls: Prev, Next, Auto-Play, Voice */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5">
                {/* Voice Line Aloud */}
                <button
                  type="button"
                  onClick={handleSpeakCurrentLine}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition active:scale-95 ${
                    isSpeakingCurrentLine
                      ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                      : 'bg-white/10 text-slate-200 border-white/15 hover:bg-white/20'
                  }`}
                >
                  <Mic className="h-3.5 w-3.5" />
                  <span>{isSpeakingCurrentLine ? 'Speaking...' : 'Voice Line'}</span>
                </button>

                {/* Auto-Play Toggle */}
                <button
                  type="button"
                  onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition active:scale-95 ${
                    isAutoPlaying
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-amber-400 shadow'
                      : 'bg-white/10 text-slate-200 border-white/15 hover:bg-white/20'
                  }`}
                >
                  {isAutoPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  <span>{isAutoPlaying ? 'Pause Auto' : 'Auto-Play'}</span>
                </button>
              </div>

              {/* Prev and Next Line Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevLine}
                  disabled={currentLineIndex === 0}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 text-slate-200 border border-white/15 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none transition active:scale-95"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Prev</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextLine}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition shadow-lg active:scale-95 ${
                    isLastLine
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border border-pink-400 hover:brightness-110 shadow-pink-500/30'
                      : 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black hover:brightness-110 shadow-amber-500/20'
                  }`}
                >
                  <span>{isLastLine ? 'Scene Finale ➔' : 'Next Line ➔'}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Line Progress Bar Dots */}
            <div className="w-full flex items-center gap-1 pt-1">
              {safeScriptLines.map((_, idx) => (
                <div
                  key={idx}
                  onClick={() => onLineChange(idx)}
                  className={`h-1 flex-1 rounded-full cursor-pointer transition-all duration-300 ${
                    idx === currentLineIndex
                      ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] scale-y-125'
                      : idx < currentLineIndex
                      ? 'bg-purple-500/70'
                      : 'bg-white/10 hover:bg-white/30'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. MODAL / DECISION HUB: BRANCHING CHOICES OR GRAND FINALE */}
      {(showChoiceModal || isLastLine) && (
        <div className="p-4 md:p-6 bg-slate-950 border-t border-white/20 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                  {isFinale ? '🏆 THE GRAND FINALE' : `ACT ${chapterNumber} BRANCHING MATRIX`}
                </span>
                <h3 className="text-base md:text-xl font-black text-white">
                  {isFinale ? 'The Story Concludes!' : 'The Crew Must Cast Their Votes!'}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyDirectorsCut}
                  className="flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-xs text-slate-300 hover:text-white border border-white/15 transition"
                >
                  <Share2 className="h-3 w-3" />
                  <span>{copiedCut ? 'Copied Cut!' : "Director's Cut"}</span>
                </button>

                <button
                  type="button"
                  onClick={onResetToLobby}
                  className="flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-xs text-slate-300 hover:text-white border border-white/15 transition"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Lobby</span>
                </button>
              </div>
            </div>

            {/* Is Finale Summary Screen */}
            {isFinale ? (
              <div className="rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-950/40 via-purple-950/30 to-black p-5 text-center space-y-4 shadow-xl">
                <span className="text-4xl">👑</span>
                <h4 className="text-lg md:text-2xl font-black text-amber-300">
                  {finaleSummary || 'Against all odds, the narrative reached its legendary culmination!'}
                </h4>
                <p className="text-xs md:text-sm text-slate-200 max-w-2xl mx-auto leading-relaxed">
                  Every player played their part with comedic perfection. The curtain closes on this 3-Act masterpiece.
                </p>

                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={onResetToLobby}
                    className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-yellow-500 text-black hover:brightness-110 shadow-lg active:scale-95 transition"
                  >
                    Start New Party Shoot 🎬
                  </button>
                </div>
              </div>
            ) : (
              /* Act Branching Plot Choices */
              <div className="space-y-3">
                <p className="text-xs text-slate-300">
                  Select your vote. When your party agrees, lock in the vote to launch Act {chapterNumber + 1}:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {safePlotChoices.map((choice) => {
                    const isSelected = selectedVoteId === choice.id;
                    const votes = voteCounts[choice.id] || 0;
                    const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;

                    return (
                      <div
                        key={choice.id}
                        onClick={() => {
                          onSelectVote(choice.id);
                          soundEngine.playDialogueBlip(1.2);
                        }}
                        className={`relative cursor-pointer rounded-xl p-3.5 border transition-all duration-200 active:scale-98 flex flex-col justify-between ${
                          isSelected
                            ? 'border-amber-400 bg-amber-500/15 shadow-[0_0_20px_rgba(251,191,36,0.3)] ring-2 ring-amber-400/50'
                            : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-black text-amber-300">
                              Option {choice.id}
                            </span>
                            {isSelected && (
                              <CheckCircle2 className="h-4 w-4 text-amber-400" />
                            )}
                          </div>

                          <h5 className="text-xs font-bold text-white leading-tight">
                            {choice.label}
                          </h5>

                          <p className="text-[11px] text-slate-300 leading-normal line-clamp-2">
                            {choice.description}
                          </p>

                          <p className="text-[10px] text-amber-200/80 italic font-mono">
                            ⚡ {choice.consequence_hint}
                          </p>
                        </div>

                        {/* Vote Share Bar */}
                        <div className="pt-3 space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="text-slate-400">{votes} crew votes</span>
                            <span className="font-bold text-amber-300">{percentage}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-black/60 rounded-full overflow-hidden border border-white/10">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Launch Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playVineBoom();
                      onLockInVoteAndBranch();
                    }}
                    disabled={!selectedVoteId || isBranchingChapter}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl text-xs md:text-sm font-black uppercase tracking-wider bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white shadow-xl hover:brightness-110 disabled:opacity-40 disabled:pointer-events-none transition active:scale-95 shadow-purple-500/30"
                  >
                    {isBranchingChapter ? (
                      <>
                        <Sparkles className="h-4 w-4 animate-spin" />
                        <span>Directing Act {chapterNumber + 1}...</span>
                      </>
                    ) : (
                      <>
                        <span>Lock In Option {selectedVoteId || 'A'} & Launch Act {chapterNumber + 1}</span>
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
