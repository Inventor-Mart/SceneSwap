import { useState, useEffect, useRef, type FormEvent } from 'react';
import {
  Clapperboard,
  Copy,
  Check,
  RotateCcw,
  Users,
  Film,
  Camera,
  X,
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  Share2,
  Zap,
  Dice5,
  Music,
  CheckCircle2,
  AlertCircle,
  Cloud,
  Crown,
  CreditCard,
  Mail,
  Send,
  Loader2,
  ExternalLink,
  Smartphone,
  Download,
} from 'lucide-react';

import {
  getRealisticCharacterPhoto,
  getStoredCustomAvatars,
  setStoredCustomAvatar,
  compressImageFile,
} from './utils/characterAvatars';
import {
  clearStoredVisualBible,
  lockOrGetCharacterVisualBible,
} from './utils/characterConsistency';
import { soundEngine } from './utils/soundEngine';
import { CinematicSceneStage } from './components/CinematicSceneStage';
import { StudioScriptPortraitView } from './components/StudioScriptPortraitView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { generateClientFallbackChapter } from './utils/chapterGenerator';
import { AuthModal } from './components/AuthModal';
import { ServicesLaunchHubModal } from './components/ServicesLaunchHubModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { LandingPage } from './components/LandingPage';
import { SubscriptionModal, type SubscriptionTier } from './components/SubscriptionModal';
import { AndroidApkModal } from './components/AndroidApkModal';
import {
  auth,
  onAuthStateChanged,
  saveUserSceneSwapData,
  loadUserSceneSwapData,
  testConnection,
  type User as FirebaseUser,
  type SavedSceneSwapData,
} from './lib/firebase';

export interface SceneSwapCastMember {
  player: string;
  role: string;
  archetype: string;
  motivation: string;
  secret?: string;
  wardrobe?: string;
  props?: string;
}

export interface SceneSwapScriptLine {
  speaker: string;
  direction?: string;
  line: string;
}

export interface SceneSwapPlotChoice {
  id: 'A' | 'B' | 'C';
  label: string;
  description: string;
  consequence_hint: string;
}

export interface SceneSwapChapterResult {
  chapter_number: number;
  chapter_title: string;
  genre: string;
  tone: string;
  scene_heading?: string;
  setting_description: string;
  audio_cue: string;
  cast: SceneSwapCastMember[];
  script_lines: SceneSwapScriptLine[];
  plot_choices: SceneSwapPlotChoice[];
  is_finale: boolean;
  finale_summary?: string;
}

interface GenreOption {
  id: string;
  name: string;
  badge: string;
  tagline: string;
  color: string;
  defaultTone: string;
  sampleHooks: string[];
}

const GENRE_OPTIONS: GenreOption[] = [
  {
    id: 'Nollywood Drama',
    name: 'Nollywood Drama',
    badge: 'Ikoyi Royal Drama',
    tagline: 'High-stakes family dynasties, disputed wills, shocking paternity reveals, and fierce matriarchs.',
    color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-300',
    defaultTone: 'Explosive & Theatrical',
    sampleHooks: [
      'Chief Balogun secretly changed his will on his deathbed leaving the entire estate to an unknown relative.',
      'During the high-society wedding reception, a blue envelope containing DNA results is discovered under the cake.',
      'The family bank accounts are suddenly frozen by anti-fraud detectives as sirens wail outside the compound gate.',
      "An uninvited guest arrives claiming to be Chief's legitimate first-born child with matching birthmarks.",
    ],
  },
  {
    id: 'Sci-Fi Survival',
    name: 'Sci-Fi Survival',
    badge: 'Deep Space Orbital',
    tagline: 'Orbital station breach, failing life support, rogue AI protocols, and desperate zero-G gambits.',
    color: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-300',
    defaultTone: 'High Tension & Claustrophobic',
    sampleHooks: [
      'Oxygen reserves are down to six minutes and the manual airlock override only has one charge left.',
      'The station biometric sensors report 4 biological heartbeats, but only 3 crew members boarded.',
      'A classified AI override message reveals one of the crew was secretly ordered to scuttle the vessel.',
      'The escape pod was locked from the outside and a stealth ship is decoupling from the docking ring.',
    ],
  },
  {
    id: 'Afrofuturistic Heist',
    name: 'Afrofuturistic Heist',
    badge: 'Neo-Lagos 2099',
    tagline: 'Cyber-masquerades, vibranium neural vaults, high-speed flyover getaways, and tech syndicate betrayal.',
    color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-300',
    defaultTone: 'Slick & Adrenaline Pumping',
    sampleHooks: [
      'The cyber-vault password requires reciting an ancient Yoruba proverb into a neural retina scanner.',
      'The quantum hard drive is overheating and will wipe all decentralized bank ledgers in 120 seconds.',
      'One of the crew members was secretly replaced with an undercover android sent by the megacorp.',
      'The getaway hover-skiff has lost thruster stabilization above the Third Mainland Skybridge.',
    ],
  },
  {
    id: 'Horror Mystery',
    name: 'Horror Mystery',
    badge: 'Occult Gothic',
    tagline: 'Foggy highland estates, eerie radio frequencies, cursed heirlooms, and supernatural shadows.',
    color: 'from-purple-500/20 to-rose-500/20 border-purple-500/30 text-purple-300',
    defaultTone: 'Spooky & Suspenseful',
    sampleHooks: [
      'The grandfather clock chimed 13 times at midnight and the locked basement door unbolted itself.',
      'Every portrait along the hallway gallery has had its eyes scratched out since sunset.',
      'A voice on the dead rotary telephone claims to be speaking from the empty room right next door.',
      'A hidden diary found behind the fireplace names all the party guests as sacrifices.',
    ],
  },
  {
    id: 'Romantic Comedy',
    name: 'Romantic Comedy',
    badge: 'Gala Chaos',
    tagline: 'Awkward society galas, fake dating contracts, wine spills, and hilarious romantic disasters.',
    color: 'from-pink-500/20 to-rose-500/20 border-pink-500/30 text-pink-300',
    defaultTone: 'Pure Comedy & Slapstick',
    sampleHooks: [
      'Two sworn rivals agreed to pose as an engaged couple to secure a ten million dollar venture check.',
      'The engagement ring was accidentally baked into the catering soufflé served to the governor.',
      'A loud toast goes disastrously wrong when the microphone amplifies a private whispered confession.',
      'Both of their demanding ex-partners show up as the guest of honor and lead violinist.',
    ],
  },
  {
    id: 'Cyberpunk Detective',
    name: 'Cyberpunk Detective',
    badge: 'Neon Noir',
    tagline: 'Acid rain, flickering hologram billboards, corrupt mega-corporation informants, and memory chips.',
    color: 'from-indigo-500/20 to-violet-500/20 border-indigo-500/30 text-indigo-300',
    defaultTone: 'Grim & Cynical Wit',
    sampleHooks: [
      'The murder victim was a synthetic clone with a classified serial number linked to one of the players.',
      'A cyber-informant leaves a glowing memory shard inside an umbrella before disappearing into the rain.',
      "The detective's synthetic eye feed has been hijacked and is broadcasting live to bounty hunters.",
      'The blackout knocks out neon grid power across District 9 as sirens echo down the alley.',
    ],
  },
];

const TONE_OPTIONS = [
  'Explosive & Theatrical',
  'Pure Comedy & Slapstick',
  'High Tension & Claustrophobic',
  'Slick & Adrenaline Pumping',
  'Spooky & Suspenseful',
  'Grim & Cynical Wit',
];

const PLAYER_COLOR_STYLES = [
  { border: 'border-pink-500/40', bg: 'bg-pink-950/40', text: 'text-pink-300', ring: 'ring-pink-500/40', badge: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
  { border: 'border-cyan-500/40', bg: 'bg-cyan-950/40', text: 'text-cyan-300', ring: 'ring-cyan-500/40', badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  { border: 'border-amber-500/40', bg: 'bg-amber-950/40', text: 'text-amber-300', ring: 'ring-amber-500/40', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { border: 'border-emerald-500/40', bg: 'bg-emerald-950/40', text: 'text-emerald-300', ring: 'ring-emerald-500/40', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { border: 'border-purple-500/40', bg: 'bg-purple-950/40', text: 'text-purple-300', ring: 'ring-purple-500/40', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
];

const PLAYER_PRESETS = [
  { name: 'Lagos Squad', players: ['Tunde', 'Amaka', 'Chioma', 'Dapo'] },
  { name: 'London Crew', players: ['Sarah', 'Marcus', 'Chloe', 'Liam'] },
  { name: 'Office Drama', players: ['Karen', 'Jim', 'Dwight', 'Pam'] },
  { name: 'College Flat', players: ['Zack', 'Maya', 'Tariq', 'Elena'] },
];

export default function App() {
  // SceneSwap State
  const [partyPlayers, setPartyPlayers] = useState<string[]>(['Amaka', 'Tunde', 'Chioma']);
  const [newPlayerInput, setNewPlayerInput] = useState<string>('');
  const [playerInputError, setPlayerInputError] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string>('Nollywood Drama');
  const [selectedTone, setSelectedTone] = useState<string>('Explosive & Theatrical');
  const [wildcardHook, setWildcardHook] = useState<string>('');
  const [activeChapter, setActiveChapter] = useState<SceneSwapChapterResult | null>(null);
  const [chapterHistory, setChapterHistory] = useState<Array<{ chapter: SceneSwapChapterResult; chosenChoice?: SceneSwapPlotChoice }>>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(0);
  const [selectedVoteId, setSelectedVoteId] = useState<'A' | 'B' | 'C' | null>(null);
  const [voteCounts, setVoteCounts] = useState<{ A: number; B: number; C: number }>({ A: 0, B: 0, C: 0 });
  const [isBranchingChapter, setIsBranchingChapter] = useState<boolean>(false);
  const [activeScriptMode, setActiveScriptMode] = useState<'comic' | 'studio'>('comic');
  const [playerCustomPhotos, setPlayerCustomPhotos] = useState<Record<string, string>>(() => getStoredCustomAvatars());
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(() => soundEngine.getMuted());
  const [currentView, setCurrentView] = useState<'landing' | 'lobby'>('landing');

  // App UI & Async States
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [isDevMode, setIsDevMode] = useState<boolean>(false);
  const [isDirectorPro, setIsDirectorPro] = useState<boolean>(false);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('free');
  const [campaignActCount, setCampaignActCount] = useState<3 | 5>(3);

  // Modals & Popups
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isServicesModalOpen, setIsServicesModalOpen] = useState<boolean>(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState<boolean>(false);
  const [isDirectorPassModalOpen, setIsDirectorPassModalOpen] = useState<boolean>(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState<boolean>(false);
  const [supportMessage, setSupportMessage] = useState<string>('');
  const [supportCategory, setSupportCategory] = useState<string>('Feedback');
  const [supportSending, setSupportSending] = useState<boolean>(false);
  const [supportStatusMsg, setSupportStatusMsg] = useState<string | null>(null);

  // Firebase Auth & Cloud Sync
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [cloudNotice, setCloudNotice] = useState<string | null>(null);

  // Hidden File Input for Custom Player Avatars
  const playerPhotoInputRef = useRef<HTMLInputElement>(null);
  const pendingPhotoPlayerRef = useRef<string | null>(null);

  // On Mount: Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const cloudData = await loadUserSceneSwapData(user.uid);
          if (cloudData) {
            if (cloudData.partyPlayers && cloudData.partyPlayers.length >= 2) {
              setPartyPlayers(cloudData.partyPlayers);
            }
            if (cloudData.playerCustomPhotos) {
              setPlayerCustomPhotos((prev) => ({ ...prev, ...cloudData.playerCustomPhotos }));
            }
            if (cloudData.selectedGenre) setSelectedGenre(cloudData.selectedGenre);
            if (cloudData.premiseSeed) setWildcardHook(cloudData.premiseSeed);
            if (cloudData.isDirectorPro !== undefined) setIsDirectorPro(cloudData.isDirectorPro);
            if (cloudData.activeScriptMode) {
              setActiveScriptMode(
                cloudData.activeScriptMode === 'studio' || cloudData.activeScriptMode === 'portrait'
                  ? 'studio'
                  : 'comic'
              );
            }
            if (cloudData.activeChapter) setActiveChapter(cloudData.activeChapter);
            setLastSyncedAt(cloudData.updatedAt || new Date().toISOString());
            setCloudNotice('Cloud session restored from your Firebase account');
            setTimeout(() => setCloudNotice(null), 4000);
          }
        } catch (err) {
          console.warn('Could not load user cloud session:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Save to Cloud & LocalStorage
  const syncToCloud = async () => {
    if (!currentUser) return;
    setIsCloudSyncing(true);
    try {
      const payload: Partial<SavedSceneSwapData> = {
        activeChapter,
        partyPlayers,
        playerCustomPhotos,
        selectedGenre,
        premiseSeed: wildcardHook,
        activeScriptMode,
        isSoundMuted,
        isDirectorPro,
        updatedAt: new Date().toISOString(),
      };
      await saveUserSceneSwapData(currentUser.uid, payload);
      setLastSyncedAt(new Date().toISOString());
      setCloudNotice('Cloud session saved to Firestore');
      setTimeout(() => setCloudNotice(null), 3000);
    } catch (err) {
      console.error('Failed to sync to cloud:', err);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Add Party Player
  function handleAddPartyPlayer() {
    const trimmed = newPlayerInput.trim();
    if (!trimmed) return;
    if (trimmed.length > 16) {
      setPlayerInputError('Player name must be 16 characters or less.');
      return;
    }
    if (partyPlayers.some((p) => p.toLowerCase() === trimmed.toLowerCase())) {
      setPlayerInputError(`"${trimmed}" is already in the cast.`);
      return;
    }
    if (partyPlayers.length >= 5) {
      setPlayerInputError('Maximum 5 players supported per scene shoot.');
      return;
    }

    setPartyPlayers([...partyPlayers, trimmed]);
    setNewPlayerInput('');
    setPlayerInputError(null);
    soundEngine.playDialogueBlip(1.2);
  }

  // Remove Party Player
  function handleRemovePartyPlayer(index: number) {
    if (partyPlayers.length <= 2) {
      setPlayerInputError('At least 2 players are required for a dialogue scene.');
      return;
    }
    const updated = partyPlayers.filter((_, i) => i !== index);
    setPartyPlayers(updated);
    setPlayerInputError(null);
    soundEngine.playDialogueBlip(0.9);
  }

  // Quick Preset Loader
  function handleApplyPlayerPreset(preset: string[]) {
    setPartyPlayers([...preset]);
    setPlayerInputError(null);
    soundEngine.playDialogueBlip(1.1);
  }

  // Photo Upload Trigger & Handling
  function handleTriggerUploadPhoto(player: string) {
    pendingPhotoPlayerRef.current = player;
    if (playerPhotoInputRef.current) {
      playerPhotoInputRef.current.value = '';
      playerPhotoInputRef.current.click();
    }
  }

  async function handlePlayerPhotoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const player = pendingPhotoPlayerRef.current;
    if (!file || !player) return;

    try {
      const compressedDataUrl = await compressImageFile(file);
      setStoredCustomAvatar(player, compressedDataUrl);
      setPlayerCustomPhotos((prev) => ({
        ...prev,
        [player.toLowerCase()]: compressedDataUrl,
      }));
      soundEngine.playDialogueBlip(1.3);
    } catch (err) {
      console.error('Photo processing error:', err);
      setErrorMessage('Could not load that photo format. Try a smaller JPG or PNG image.');
    }
  }

  function handleUpdateCustomPhotoFromStage(player: string, photoDataUrl: string) {
    setStoredCustomAvatar(player, photoDataUrl);
    setPlayerCustomPhotos((prev) => ({
      ...prev,
      [player.toLowerCase()]: photoDataUrl,
    }));
  }

  // Roll Wildcard Premise Hook
  function handleRollWildcardHook() {
    const genreObj = GENRE_OPTIONS.find((g) => g.id === selectedGenre) || GENRE_OPTIONS[0];
    const hooks = genreObj.sampleHooks;
    const randomHook = hooks[Math.floor(Math.random() * hooks.length)];
    setWildcardHook(randomHook);
    soundEngine.playComedicBoing();
  }

  // Start Party Shoot (Act 1 Generation)
  async function handleStartPartyShoot(e?: FormEvent) {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    if (isProcessing || partyPlayers.length < 2) return;

    setErrorMessage(null);
    setIsProcessing(true);
    soundEngine.playSuspenseSting();

    const cleanPlayerNames = (partyPlayers || [])
      .map((p: any) => (typeof p === 'string' ? p : p?.name || String(p || '')).trim())
      .filter(Boolean);
    const safePlayerList = cleanPlayerNames.length >= 2 ? cleanPlayerNames : ['Amaka', 'Tunde', 'Chioma'];

    let chapterData: SceneSwapChapterResult;
    try {
      const res = await fetch('/api/sceneswap/chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          players: safePlayerList,
          genre: selectedGenre,
          tone: selectedTone,
          wildcardHook: String(wildcardHook || '').trim(),
          chapterNumber: 1,
        }),
      });

      if (!res.ok) {
        throw new Error(`SceneSwap shoot failed with status ${res.status}`);
      }
      chapterData = await res.json();
    } catch (fetchErr) {
      console.warn('API generation encountered an issue, seamlessly engaging director fallback engine:', fetchErr);
      chapterData = generateClientFallbackChapter({
        players: safePlayerList,
        genre: selectedGenre,
        tone: selectedTone,
        wildcardHook: String(wildcardHook || '').trim(),
        chapterNumber: 1,
      });
    }

    try {
      clearStoredVisualBible();
      lockOrGetCharacterVisualBible(chapterData.cast, selectedGenre, playerCustomPhotos);

      setActiveChapter(chapterData);
      setChapterHistory([]);
      setCurrentLineIndex(0);
      setVoteCounts({ A: 0, B: 0, C: 0 });
      setSelectedVoteId(null);
      soundEngine.playAudioCueForText(chapterData.audio_cue);

      if (currentUser) {
        saveUserSceneSwapData(currentUser.uid, {
          activeChapter: chapterData,
          partyPlayers: safePlayerList,
          selectedGenre,
          premiseSeed: wildcardHook,
          updatedAt: new Date().toISOString(),
        }).catch(() => {});
      }
    } catch (err: any) {
      console.error('Error initializing scene stage:', err);
      setErrorMessage('The director stage encountered a brief glitch. Tap Start Party Shoot to retry.');
    } finally {
      setIsProcessing(false);
    }
  }

  // Lock In Vote and Branch to Next Act
  async function handleLockInVoteAndBranch() {
    if (!activeChapter || isBranchingChapter) return;

    let chosenId: 'A' | 'B' | 'C' = selectedVoteId || 'A';
    const highestVote = Math.max(voteCounts.A, voteCounts.B, voteCounts.C);
    if (highestVote > 0) {
      if (voteCounts.A === highestVote) chosenId = 'A';
      else if (voteCounts.B === highestVote) chosenId = 'B';
      else if (voteCounts.C === highestVote) chosenId = 'C';
    }

    const chosenOption = activeChapter.plot_choices.find((c) => c.id === chosenId) || activeChapter.plot_choices[0];
    const nextChapterNumber = activeChapter.chapter_number + 1;

    setIsBranchingChapter(true);
    setErrorMessage(null);
    soundEngine.playVineBoom();

    const cleanPlayerNames = (partyPlayers || [])
      .map((p: any) => (typeof p === 'string' ? p : p?.name || String(p || '')).trim())
      .filter(Boolean);
    const safePlayerList = cleanPlayerNames.length >= 2 ? cleanPlayerNames : ['Amaka', 'Tunde', 'Chioma'];

    const newHistoryItem = {
      chapter: activeChapter,
      chosenChoice: chosenOption,
    };
    const updatedHistory = [...chapterHistory, newHistoryItem];

    let nextChapterData: SceneSwapChapterResult;
    try {
      const res = await fetch('/api/sceneswap/chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          players: safePlayerList,
          genre: selectedGenre,
          tone: selectedTone,
          chapterNumber: nextChapterNumber,
          chosenChoice: chosenOption,
          priorChaptersSummary: updatedHistory.map((h) => ({
            chapterNumber: h.chapter.chapter_number,
            title: h.chapter.chapter_title,
            chosenChoiceLabel: h.chosenChoice?.label,
          })),
        }),
      });

      if (!res.ok) throw new Error('Branch generation failed');
      nextChapterData = await res.json();
    } catch (branchErr) {
      console.warn('Branch generation API failed, engaging fallback branch:', branchErr);
      nextChapterData = generateClientFallbackChapter({
        players: safePlayerList,
        genre: selectedGenre,
        tone: selectedTone,
        chapterNumber: nextChapterNumber,
        chosenChoice: chosenOption,
      });
    }

    try {
      setChapterHistory(updatedHistory);
      setActiveChapter(nextChapterData);
      setCurrentLineIndex(0);
      setVoteCounts({ A: 0, B: 0, C: 0 });
      setSelectedVoteId(null);

      if (nextChapterData.is_finale) {
        soundEngine.playApplause();
      } else {
        soundEngine.playAudioCueForText(nextChapterData.audio_cue);
      }

      if (currentUser) {
        saveUserSceneSwapData(currentUser.uid, {
          activeChapter: nextChapterData,
          updatedAt: new Date().toISOString(),
        }).catch(() => {});
      }
    } catch (err: any) {
      console.error('Error applying next branch:', err);
      setErrorMessage('Failed to roll next scene branch. Please try again.');
    } finally {
      setIsBranchingChapter(false);
    }
  }

  // Reset to Lobby
  function handleResetPartyShoot() {
    setActiveChapter(null);
    setChapterHistory([]);
    setCurrentLineIndex(0);
    setVoteCounts({ A: 0, B: 0, C: 0 });
    setSelectedVoteId(null);
  }

  // Copy Full Screenplay
  function handleCopyDirectorsCut() {
    if (!activeChapter) return;
    const allActs = [...chapterHistory.map((h) => h.chapter), activeChapter];

    let scriptDoc = `========================================================\n`;
    scriptDoc += `🎬 SCENESWAP DIRECTOR'S CUT SCREENPLAY\n`;
    scriptDoc += `GENRE: ${selectedGenre.toUpperCase()} (${selectedTone})\n`;
    scriptDoc += `CAST OF CHARACTERS:\n`;
    activeChapter.cast.forEach((c) => {
      scriptDoc += `  • ${c.player.toUpperCase()} as ${c.role} (${c.archetype})\n    Motivation: ${c.motivation}${c.secret ? ` | Secret: ${c.secret}` : ''}\n`;
    });
    scriptDoc += `========================================================\n\n`;

    allActs.forEach((act) => {
      scriptDoc += `--------------------------------------------------------\n`;
      scriptDoc += `ACT ${act.chapter_number}: ${act.chapter_title.toUpperCase()}\n`;
      scriptDoc += `SETTING: ${act.setting_description}\n`;
      scriptDoc += `AUDIO CUE: ${act.audio_cue}\n`;
      scriptDoc += `--------------------------------------------------------\n\n`;

      act.script_lines.forEach((line) => {
        scriptDoc += `${line.speaker.toUpperCase()}`;
        if (line.direction) scriptDoc += ` (${line.direction})`;
        scriptDoc += `:\n"${line.line}"\n\n`;
      });

      if (act.is_finale && act.finale_summary) {
        scriptDoc += `[GRAND FINALE OUTCOME]\n${act.finale_summary}\n\n`;
      }
    });

    navigator.clipboard.writeText(scriptDoc);
    setCopiedScript(true);
    soundEngine.playDialogueBlip(1.5);
    setTimeout(() => setCopiedScript(false), 2500);
  }

  // Support Submission
  async function handleSendSupport(e: FormEvent) {
    e.preventDefault();
    if (!supportMessage.trim()) return;

    setSupportSending(true);
    setSupportStatusMsg(null);
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromEmail: currentUser?.email || 'guest@sceneswap.app',
          name: currentUser?.displayName || 'Party Host',
          category: supportCategory,
          message: supportMessage,
          genre: selectedGenre,
          act: activeChapter?.chapter_number || 1,
          playersCount: partyPlayers.length,
          isPro: isDirectorPro,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSupportStatusMsg('Inquiry sent directly to the development team!');
        setSupportMessage('');
        setTimeout(() => setIsSupportModalOpen(false), 2000);
      } else {
        setSupportStatusMsg('Failed to dispatch. Please try again.');
      }
    } catch {
      setSupportStatusMsg('Network error sending message.');
    } finally {
      setSupportSending(false);
    }
  }

  // VIP Subscriptions & Pass Activation
  function handleActivateTier(tier: SubscriptionTier) {
    const isPro = tier !== 'free';
    setIsDirectorPro(isPro);
    setSubscriptionTier(tier);
    setIsDirectorPassModalOpen(false);

    if (isPro) {
      soundEngine.playApplause();
      setCloudNotice(
        tier === 'creator_studio'
          ? '🎉 Creator Studio Pro Activated! Screenplay & Video Tools Unlocked!'
          : '🎉 VIP Director Pass Activated! 5-Act Epic Mode & Unlimited Visuals Unlocked!'
      );
      setTimeout(() => setCloudNotice(null), 4500);
      if (currentUser) {
        saveUserSceneSwapData(currentUser.uid, {
          isDirectorPro: true,
          subscriptionTier: tier,
        }).catch(() => {});
      }
    } else {
      setCloudNotice('Switched to Free Host Plan.');
      setTimeout(() => setCloudNotice(null), 3000);
      if (currentUser) {
        saveUserSceneSwapData(currentUser.uid, {
          isDirectorPro: false,
          subscriptionTier: 'free',
        }).catch(() => {});
      }
    }
  }

  const labelClass = 'flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider';
  const inputClass = 'w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 backdrop-blur-md outline-none transition focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gradient-to-br from-slate-950 via-[#0d071a] to-black text-slate-100 font-sans selection:bg-purple-500/30">
      <OfflineIndicator />

      {/* Main Container */}
      <div className="flex flex-col flex-1 h-full w-full max-w-5xl mx-auto overflow-hidden">
        {/* App Header */}
        <header className="relative z-20 flex items-center justify-between border-b border-purple-900/30 bg-black/40 backdrop-blur-xl px-4 py-2.5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]">
              <Clapperboard className="h-5 w-5 text-white" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-pink-500" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-tight text-white flex items-center gap-1">
                  SceneSwap
                </h1>
                <span className="rounded-md border border-purple-500/30 bg-purple-500/10 px-1.5 py-0.2 text-[9px] font-bold text-purple-300 font-mono">
                  v2.0
                </span>
                {isDirectorPro && (
                  <button
                    type="button"
                    onClick={() => setIsDirectorPassModalOpen(true)}
                    className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/20 px-2 py-0.5 text-[9px] font-extrabold text-amber-300 uppercase hover:bg-amber-500/30 transition cursor-pointer"
                    title="Manage Subscription"
                  >
                    <Crown className="h-2.5 w-2.5 text-amber-400" />
                    {subscriptionTier === 'creator_studio' ? 'Studio Pro' : 'VIP Director'}
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                Interactive Multi-Branch Party Script Engine
              </p>
            </div>
          </div>

          {/* Right Header Navigation & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* View Switcher: Overview vs Party Studio */}
            <div className="flex rounded-lg bg-black/60 p-0.5 border border-white/15 backdrop-blur-md">
              <button
                type="button"
                onClick={() => {
                  setCurrentView('landing');
                  soundEngine.playDialogueBlip(1.0);
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold transition ${
                  currentView === 'landing' && !activeChapter
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Overview</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentView('lobby');
                  soundEngine.playDialogueBlip(1.0);
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold transition ${
                  currentView === 'lobby' || activeChapter
                    ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Clapperboard className="h-3 w-3" />
                <span>Party Studio</span>
              </button>
            </div>

            {/* Audio Toggle */}
            <button
              type="button"
              onClick={() => {
                const muted = soundEngine.toggleMute();
                setIsSoundMuted(muted);
              }}
              className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-bold transition active:scale-95 ${
                isSoundMuted
                  ? 'border-red-500/30 bg-red-950/40 text-red-300'
                  : 'border-emerald-500/30 bg-emerald-950/40 text-emerald-300'
              }`}
              title={isSoundMuted ? 'Audio Muted' : 'Audio Active'}
            >
              {isSoundMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
              <span className="hidden sm:inline">{isSoundMuted ? 'Muted' : 'Audio'}</span>
            </button>

            {/* Cloud Sync / Auth Button */}
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-950/40 px-2.5 py-1 text-[10px] font-bold text-indigo-300 hover:bg-indigo-900/40 transition active:scale-95"
            >
              <Cloud className="h-3 w-3 text-indigo-400" />
              <span>{currentUser ? currentUser.displayName || 'Cloud Sync' : 'Login & Sync'}</span>
            </button>

            {/* VIP Pass & Subscriptions Button */}
            {!isDirectorPro ? (
              <button
                type="button"
                onClick={() => setIsDirectorPassModalOpen(true)}
                className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 px-2.5 py-1 text-[10px] font-extrabold text-slate-950 hover:brightness-110 transition shadow-sm active:scale-95 cursor-pointer"
              >
                <Crown className="h-3 w-3 text-slate-950" />
                <span>VIP Pass</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsDirectorPassModalOpen(true)}
                className="flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/15 px-2.5 py-1 text-[10px] font-bold text-amber-300 hover:bg-amber-500/25 transition shadow-sm active:scale-95 cursor-pointer"
                title="Manage Subscription"
              >
                <Crown className="h-3 w-3 text-amber-400" />
                <span>My Plan</span>
              </button>
            )}

            {/* Support Desk */}
            <button
              type="button"
              onClick={() => setIsSupportModalOpen(true)}
              title="Support Desk"
              className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-400 hover:text-white transition"
            >
              <Mail className="h-3.5 w-3.5" />
            </button>

            {/* Direct Android APK Modal Trigger */}
            <button
              type="button"
              onClick={() => setIsApkModalOpen(true)}
              title="Download SceneSwap APK for Android (Android 7.0+)"
              className="flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-all shadow-sm cursor-pointer"
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Android APK</span>
              <Download className="h-3 w-3 opacity-75" />
            </button>
          </div>
        </header>

        {/* Global Toast Notifications */}
        {cloudNotice && (
          <div className="mx-4 mt-2 flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-950/70 py-1 px-3 text-[11px] font-medium text-emerald-300 shadow-md">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>{cloudNotice}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mx-4 mt-2 flex items-start gap-2 rounded-xl border border-rose-500/40 bg-rose-950/70 p-2.5 text-xs text-rose-200 shadow-lg">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <p className="flex-1">{errorMessage}</p>
            <button type="button" onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto px-4 py-3 text-slate-200 scrollbar-thin scrollbar-thumb-purple-500/20">
          {isProcessing ? (
            /* Loading State during Generation */
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center text-center space-y-4">
              <div className="relative flex items-center justify-center">
                <div className="h-16 w-16 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
                <Clapperboard className="absolute h-6 w-6 text-pink-400" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">
                  Casting Your Party Into A Screenplay...
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  The AI Director is designing scene headings, locking character wardrobe, and composing plot twists.
                </p>
              </div>
            </div>
          ) : activeChapter ? (
            /* ACTIVE CHAPTER STAGE */
            <div className="flex flex-col h-full space-y-3 animate-in fade-in zoom-in-95 duration-200">
              {/* Top Control Bar with Act Tracker, Mode Switch, Copy, and Reset */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-900/30 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 rounded-md bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-300">
                    <Clapperboard className="h-3 w-3 text-purple-400" />
                    Act {activeChapter.chapter_number} of 3
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {activeChapter.is_finale ? 'Grand Finale' : activeChapter.chapter_number === 2 ? 'Rising Crisis' : 'Inciting Incident'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Mode Toggle: Graphic Novel Stage vs Studio Script */}
                  <button
                    type="button"
                    onClick={() => setActiveScriptMode(activeScriptMode === 'comic' ? 'studio' : 'comic')}
                    className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-950/30 px-2.5 py-1 text-[10px] font-bold text-amber-300 hover:bg-amber-900/40 transition active:scale-95"
                  >
                    <Film className="h-3 w-3 text-amber-400" />
                    <span>{activeScriptMode === 'comic' ? '📱 Studio Script (Reels)' : '🎬 Graphic Novel Stage'}</span>
                  </button>

                  {/* Copy Script */}
                  <button
                    type="button"
                    onClick={handleCopyDirectorsCut}
                    className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold text-slate-300 hover:bg-white/10 hover:text-white transition active:scale-95"
                    title="Copy full script"
                  >
                    {copiedScript ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedScript ? 'Copied' : 'Script'}</span>
                  </button>

                  {/* Back to Lobby */}
                  <button
                    type="button"
                    onClick={handleResetPartyShoot}
                    className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-slate-400 hover:text-white transition active:scale-95"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Lobby</span>
                  </button>
                </div>
              </div>

              {/* 3-Act Narrative Progress Bar */}
              <div className="rounded-xl border border-white/10 bg-black/40 p-2.5">
                <div className="flex items-center justify-between text-[10px] text-slate-300 mb-1.5">
                  <span className="font-semibold text-purple-300">Branching Story Progression:</span>
                  <span className="font-mono text-amber-300 font-bold">
                    {activeChapter.chapter_number === 1 ? 'Act 1: Inciting Incident' : activeChapter.chapter_number === 2 ? 'Act 2: The Rising Crisis' : 'Act 3: The Grand Finale'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <div className={`h-1.5 rounded-full transition-all duration-300 ${activeChapter.chapter_number >= 1 ? 'bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]' : 'bg-slate-800'}`} />
                  <div className={`h-1.5 rounded-full transition-all duration-300 ${activeChapter.chapter_number >= 2 ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]' : 'bg-slate-800'}`} />
                  <div className={`h-1.5 rounded-full transition-all duration-300 ${activeChapter.chapter_number >= 3 ? 'bg-gradient-to-r from-amber-400 to-yellow-300 shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'bg-slate-800'}`} />
                </div>
              </div>

              {/* PRIMARY VIEWS: GRAPHIC NOVEL STAGE OR STUDIO SCRIPT VIEW */}
              <div className="flex-1 min-h-0">
                <ErrorBoundary
                  fallback={
                    <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 rounded-2xl border border-rose-500/40 bg-rose-950/40">
                      <Clapperboard className="h-8 w-8 text-rose-400 animate-pulse" />
                      <h3 className="text-sm font-bold text-white">Stage Visual Recovered</h3>
                      <p className="text-xs text-slate-300 max-w-sm">The director stage caught a display hiccup. Tap below to refresh the scene view cleanly.</p>
                      <button
                        type="button"
                        onClick={handleResetPartyShoot}
                        className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-500 transition"
                      >
                        Return to Lobby
                      </button>
                    </div>
                  }
                >
                  {activeScriptMode === 'comic' ? (
                    <CinematicSceneStage
                      genre={activeChapter.genre}
                      tone={activeChapter.tone}
                      chapterNumber={activeChapter.chapter_number}
                      chapterTitle={activeChapter.chapter_title}
                      settingDescription={activeChapter.setting_description}
                      audioCue={activeChapter.audio_cue}
                      cast={activeChapter.cast}
                      scriptLines={activeChapter.script_lines}
                      plotChoices={activeChapter.plot_choices}
                      isFinale={activeChapter.is_finale}
                      finaleSummary={activeChapter.finale_summary}
                      currentLineIndex={currentLineIndex}
                      onLineChange={(idx) => setCurrentLineIndex(idx)}
                      selectedVoteId={selectedVoteId}
                      onSelectVote={(id) => {
                        setSelectedVoteId(id);
                        setVoteCounts((prev) => ({ ...prev, [id]: prev[id] + 1 }));
                        soundEngine.playDialogueBlip(0.9);
                      }}
                      voteCounts={voteCounts}
                      onLockInVoteAndBranch={handleLockInVoteAndBranch}
                      isBranchingChapter={isBranchingChapter}
                      onResetToLobby={handleResetPartyShoot}
                      playerColorStyles={PLAYER_COLOR_STYLES}
                      customPlayerPhotos={playerCustomPhotos}
                      onUpdateCustomPhoto={handleUpdateCustomPhotoFromStage}
                    />
                  ) : (
                    <StudioScriptPortraitView
                      genre={activeChapter.genre}
                      tone={activeChapter.tone}
                      chapterNumber={activeChapter.chapter_number}
                      chapterTitle={activeChapter.chapter_title}
                      settingDescription={activeChapter.setting_description}
                      audioCue={activeChapter.audio_cue}
                      cast={activeChapter.cast}
                      scriptLines={activeChapter.script_lines}
                      plotChoices={activeChapter.plot_choices}
                      isFinale={activeChapter.is_finale}
                      finaleSummary={activeChapter.finale_summary}
                      currentLineIndex={currentLineIndex}
                      onLineChange={(idx) => setCurrentLineIndex(idx)}
                      selectedVoteId={selectedVoteId}
                      onSelectVote={(id) => {
                        setSelectedVoteId(id);
                        setVoteCounts((prev) => ({ ...prev, [id]: prev[id] + 1 }));
                        soundEngine.playDialogueBlip(0.9);
                      }}
                      voteCounts={voteCounts}
                      onLockInVoteAndBranch={handleLockInVoteAndBranch}
                      isBranchingChapter={isBranchingChapter}
                      onResetToLobby={handleResetPartyShoot}
                      playerColorStyles={PLAYER_COLOR_STYLES}
                      customPlayerPhotos={playerCustomPhotos}
                      onUpdateCustomPhoto={handleUpdateCustomPhotoFromStage}
                      isDirectorPro={isDirectorPro}
                      onOpenSubscriptionModal={() => setIsDirectorPassModalOpen(true)}
                    />
                  )}
                </ErrorBoundary>
              </div>
            </div>
          ) : currentView === 'landing' ? (
            /* LANDING PAGE */
            <LandingPage
              onStartParty={() => {
                setCurrentView('lobby');
                soundEngine.playDialogueBlip(1.1);
              }}
              onQuickDemo={() => handleStartPartyShoot()}
              onOpenPass={() => setIsDirectorPassModalOpen(true)}
            />
          ) : (
            /* PARTY LOBBY ENGINE */
            <div className="flex flex-col gap-4 max-w-3xl mx-auto pb-8 animate-in fade-in duration-200">
              {/* Back to Landing Page Bar */}
              <div className="flex items-center justify-between pb-1">
                <button
                  type="button"
                  onClick={() => setCurrentView('landing')}
                  className="flex items-center gap-1.5 text-xs text-purple-300 hover:text-white transition font-medium"
                >
                  <span>← Back to Welcome</span>
                </button>
                <span className="text-[11px] text-slate-500 font-mono">
                  {partyPlayers.length} Players Casted
                </span>
              </div>

              {/* Hidden File Picker for Custom Player Avatars */}
              <input
                type="file"
                ref={playerPhotoInputRef}
                accept="image/*"
                className="hidden"
                onChange={handlePlayerPhotoFileChange}
              />

              {/* Lobby Hero Banner */}
              <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-950/50 via-indigo-950/40 to-black/60 p-5 space-y-1.5 shadow-xl">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300 uppercase tracking-widest">
                  <Clapperboard className="h-4 w-4 text-pink-400" />
                  Interactive Party Script Lobby
                </div>
                <h2 className="text-lg font-black text-white">
                  Cast Your Friends Into A 3-Act Branching Movie
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                  Tag 2 to 5 friends, upload real photos or use genre portraits, and take turns performing hilarious lines with teleprompter auto-pacing and live choice voting.
                </p>
              </div>

              {/* Player Cast Roster with Custom Avatars */}
              <div className="space-y-2.5 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <label className={labelClass}>
                    <Users className="h-3.5 w-3.5 text-purple-400" />
                    Party Cast Roster ({partyPlayers.length}/5)
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    2 to 5 players required
                  </span>
                </div>

                {/* Player Chips Display with Avatar Thumbnails */}
                <div className="flex flex-wrap gap-2 min-h-[46px] p-2.5 rounded-xl border border-white/10 bg-black/40">
                  {partyPlayers.map((player, index) => {
                    const color = PLAYER_COLOR_STYLES[index % PLAYER_COLOR_STYLES.length];
                    const hasCustom = !!playerCustomPhotos[player.toLowerCase()];
                    const avatarUrl = getRealisticCharacterPhoto(player, '', selectedGenre, playerCustomPhotos);

                    return (
                      <div
                        key={index}
                        className={`inline-flex items-center gap-2 rounded-xl border ${color.border} ${color.bg} px-2.5 py-1.5 text-xs font-bold ${color.text} shadow-sm animate-in fade-in duration-150`}
                      >
                        {/* Avatar Thumbnail with Camera Upload Action */}
                        <div
                          onClick={() => handleTriggerUploadPhoto(player)}
                          className="relative group cursor-pointer h-7 w-7 rounded-full overflow-hidden border border-white/30 shrink-0 bg-slate-900 shadow"
                          title={`Tap to upload custom photo for ${player}`}
                        >
                          <img
                            src={avatarUrl}
                            alt={player}
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                            <Camera className="h-3 w-3 text-white" />
                          </div>
                          {hasCustom && (
                            <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 ring-1 ring-black" title="Custom Photo Active" />
                          )}
                        </div>

                        <div className="flex flex-col">
                          <div className="flex items-center gap-1">
                            <span className="text-white text-xs">{player}</span>
                            {hasCustom && (
                              <span className="text-[8px] bg-emerald-500/30 text-emerald-300 px-1 py-0.2 rounded font-mono">
                                Photo
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 ml-1">
                          <button
                            type="button"
                            onClick={() => handleTriggerUploadPhoto(player)}
                            className="rounded p-1 text-slate-400 hover:text-amber-300 hover:bg-white/10 transition"
                            title={`Upload custom photo for ${player}`}
                          >
                            <Camera className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemovePartyPlayer(index)}
                            className="rounded hover:bg-white/10 p-1 text-slate-400 hover:text-white transition"
                            title="Remove player"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add Player Input Row */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={16}
                    value={newPlayerInput}
                    onChange={(e) => {
                      setNewPlayerInput(e.target.value);
                      setPlayerInputError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        handleAddPartyPlayer();
                      }
                    }}
                    placeholder="Enter player name (e.g. Tunde)"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={handleAddPartyPlayer}
                    disabled={!newPlayerInput.trim() || partyPlayers.length >= 5}
                    className="shrink-0 flex items-center justify-center gap-1 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-500 disabled:opacity-40 transition"
                  >
                    + Add
                  </button>
                </div>

                {playerInputError && (
                  <p className="text-[11px] text-rose-400 font-medium">
                    ⚠️ {playerInputError}
                  </p>
                )}

                {/* Quick Cast Presets */}
                <div className="pt-1">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Or Quick-Load Cast Preset:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {PLAYER_PRESETS.map((preset, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleApplyPlayerPreset(preset.players)}
                        className="rounded-lg border border-white/5 bg-white/5 px-2.5 py-1 text-[10px] text-slate-300 hover:bg-white/10 hover:text-white transition"
                      >
                        {preset.name} ({preset.players.length})
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Genre Selector Cards */}
              <div className="space-y-2">
                <label className={labelClass}>
                  <Clapperboard className="h-3.5 w-3.5 text-purple-400" />
                  Cinematic Genre Presets
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {GENRE_OPTIONS.map((g) => {
                    const isSelected = selectedGenre === g.id;
                    return (
                      <div
                        key={g.id}
                        onClick={() => {
                          setSelectedGenre(g.id);
                          setSelectedTone(g.defaultTone);
                          soundEngine.playDialogueBlip(1.1);
                        }}
                        className={`cursor-pointer rounded-2xl border p-3.5 transition select-none flex flex-col justify-between ${
                          isSelected
                            ? 'border-purple-400 bg-gradient-to-br from-purple-950/70 to-indigo-950/40 shadow-[0_0_20px_rgba(168,85,247,0.35)]'
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">
                              {g.name}
                            </span>
                            <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${g.color}`}>
                              {g.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1.5 leading-snug">
                            {g.tagline}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Campaign Scale & Act Count Selector */}
              <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <label className={labelClass}>
                    <Film className="h-3.5 w-3.5 text-amber-400" />
                    Campaign Scale & Act Count
                  </label>
                  {isDirectorPro ? (
                    <span className="flex items-center gap-1 text-[10px] font-extrabold text-amber-300">
                      <Crown className="h-3 w-3 text-amber-400" /> VIP Unlocked
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsDirectorPassModalOpen(true)}
                      className="text-[10px] font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer"
                    >
                      View VIP Plans
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setCampaignActCount(3);
                      soundEngine.playDialogueBlip(1.0);
                    }}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition cursor-pointer ${
                      campaignActCount === 3
                        ? 'border-purple-400 bg-purple-950/40 text-white ring-1 ring-purple-400/50'
                        : 'border-white/10 bg-black/40 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-black text-white">Standard 3-Act Movie</span>
                      <span className="text-[9px] font-bold uppercase rounded bg-white/10 px-1.5 py-0.2">Free</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1">
                      Act 1 (Setup) → Act 2 (Crisis) → Act 3 (Finale)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!isDirectorPro) {
                        setIsDirectorPassModalOpen(true);
                      } else {
                        setCampaignActCount(5);
                        soundEngine.playDialogueBlip(1.2);
                      }
                    }}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition cursor-pointer relative overflow-hidden ${
                      campaignActCount === 5
                        ? 'border-amber-400 bg-amber-950/40 text-white ring-1 ring-amber-400/50'
                        : 'border-amber-500/30 bg-amber-950/10 text-amber-200 hover:border-amber-400/60'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5">
                        <Crown className="h-3.5 w-3.5 text-amber-400" />
                        <span className="text-xs font-black text-white">5-Act Epic Campaign</span>
                      </div>
                      <span className="text-[9px] font-black uppercase rounded bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 px-1.5 py-0.2 shadow">
                        VIP Pass
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-300 mt-1">
                      {isDirectorPro ? 'Midpoint Twist, Climax & Grand Epilogue' : 'Tap to unlock with VIP Director Pass'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Tone & Vibe Selector */}
              <div>
                <label htmlFor="toneSelect" className={labelClass}>
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  Tone & Vibe
                </label>
                <select
                  id="toneSelect"
                  value={selectedTone}
                  onChange={(e) => setSelectedTone(e.target.value)}
                  className={`${inputClass} appearance-none cursor-pointer mt-1`}
                >
                  {TONE_OPTIONS.map((t) => (
                    <option key={t} value={t} className="bg-slate-900 text-white">
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Wildcard Premise Seed */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="wildcardInput" className={labelClass}>
                    <Zap className="h-3.5 w-3.5 text-pink-400" />
                    Plot Seed / Wildcard Hook (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={handleRollWildcardHook}
                    className="flex items-center gap-1 text-[10px] font-bold text-pink-400 hover:text-pink-300 underline underline-offset-2 transition"
                  >
                    <Dice5 className="h-3 w-3" />
                    Roll Wildcard Hook
                  </button>
                </div>
                <input
                  id="wildcardInput"
                  type="text"
                  value={wildcardHook}
                  onChange={(e) => setWildcardHook(e.target.value)}
                  placeholder="e.g. Someone discovers an envelope with secret company shares"
                  className={inputClass}
                />
                <span className="text-[10px] text-slate-500 block">
                  Add an inside joke, office gossip, or tap dice to generate a wild situation.
                </span>
              </div>

              {/* Gen Z Soundboard Deck & Audio FX Test */}
              <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-pink-300">
                    <Music className="h-3.5 w-3.5 text-pink-400" />
                    Gen Z Party Soundboard & FX Deck
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Interactive Acting SFX
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => soundEngine.playVineBoom()}
                    className="flex items-center justify-center gap-1 rounded-xl border border-red-500/30 bg-red-950/40 py-2 text-[10px] font-bold text-red-300 hover:bg-red-900/50 active:scale-95 transition"
                  >
                    ⚡ Vine Boom
                  </button>
                  <button
                    type="button"
                    onClick={() => soundEngine.playSuspenseSting()}
                    className="flex items-center justify-center gap-1 rounded-xl border border-purple-500/30 bg-purple-950/40 py-2 text-[10px] font-bold text-purple-300 hover:bg-purple-900/50 active:scale-95 transition"
                  >
                    🎻 Sting
                  </button>
                  <button
                    type="button"
                    onClick={() => soundEngine.playRecordScratch()}
                    className="flex items-center justify-center gap-1 rounded-xl border border-amber-500/30 bg-amber-950/40 py-2 text-[10px] font-bold text-amber-300 hover:bg-amber-900/50 active:scale-95 transition"
                  >
                    💿 Scratch
                  </button>
                  <button
                    type="button"
                    onClick={() => soundEngine.playComedicBoing()}
                    className="flex items-center justify-center gap-1 rounded-xl border border-pink-500/30 bg-pink-950/40 py-2 text-[10px] font-bold text-pink-300 hover:bg-pink-900/50 active:scale-95 transition"
                  >
                    🤪 Boing
                  </button>
                  <button
                    type="button"
                    onClick={() => soundEngine.playThunder()}
                    className="flex items-center justify-center gap-1 rounded-xl border border-blue-500/30 bg-blue-950/40 py-2 text-[10px] font-bold text-blue-300 hover:bg-blue-900/50 active:scale-95 transition"
                  >
                    ⛈️ Thunder
                  </button>
                  <button
                    type="button"
                    onClick={() => soundEngine.playApplause()}
                    className="flex items-center justify-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-950/40 py-2 text-[10px] font-bold text-emerald-300 hover:bg-emerald-900/50 active:scale-95 transition"
                  >
                    👏 Cheer
                  </button>
                </div>
              </div>

              {/* Start Party Shoot CTA Button */}
              <button
                type="button"
                onClick={() => handleStartPartyShoot()}
                disabled={partyPlayers.length < 2 || isProcessing}
                className="mt-2 w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 px-5 py-4 text-sm font-black tracking-wide text-white shadow-[0_0_30px_rgba(168,85,247,0.45)] transition hover:brightness-110 active:scale-[0.98] disabled:opacity-40 cursor-pointer"
              >
                <Clapperboard className="h-4 w-4" />
                Start Party Shoot & Roll Act 1 ({partyPlayers.length} Players)
              </button>
            </div>
          )}
        </main>
      </div>

      {/* MODAL: Auth & Cloud Sync Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        lastSyncedAt={lastSyncedAt}
        onSyncNow={syncToCloud}
        isSyncing={isCloudSyncing}
      />

      {/* MODAL: Services & Infrastructure Hub */}
      <ServicesLaunchHubModal
        isOpen={isServicesModalOpen}
        onClose={() => setIsServicesModalOpen(false)}
        onOpenAuth={() => {
          setIsServicesModalOpen(false);
          setIsAuthModalOpen(true);
        }}
        onOpenCheckout={() => {
          setIsServicesModalOpen(false);
          setIsDirectorPassModalOpen(true);
        }}
      />

      {/* MODAL: Subscriptions & VIP Director Pass */}
      <SubscriptionModal
        isOpen={isDirectorPassModalOpen}
        onClose={() => setIsDirectorPassModalOpen(false)}
        isDirectorPro={isDirectorPro}
        currentTier={subscriptionTier}
        onActivateTier={handleActivateTier}
        userEmail={currentUser?.email || undefined}
      />

      {/* MODAL: Android APK Download & Compatibility */}
      <AndroidApkModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
      />

      {/* MODAL: Support Desk */}
      {isSupportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-purple-500/40 bg-slate-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-purple-400" />
                <h3 className="text-base font-extrabold text-white">
                  SceneSwap Support Desk
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSupportModalOpen(false)}
                className="rounded-full bg-white/10 p-1 text-slate-400 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Have a feature request, genre idea, or encountering a technical glitch? Send a message directly to the engineering team.
            </p>

            <form onSubmit={handleSendSupport} className="space-y-3">
              <div>
                <label className={labelClass}>Category</label>
                <select
                  value={supportCategory}
                  onChange={(e) => setSupportCategory(e.target.value)}
                  className={`${inputClass} mt-1`}
                >
                  <option value="Feedback">Feature Request & Feedback</option>
                  <option value="Bug">Technical Issue / Bug</option>
                  <option value="Genre Idea">New Genre Recommendation</option>
                  <option value="Account">Account & Cloud Sync</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Your Message</label>
                <textarea
                  rows={4}
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Describe your suggestion or issue..."
                  className={`${inputClass} mt-1 resize-none`}
                  required
                />
              </div>

              {supportStatusMsg && (
                <p className="text-xs font-medium text-emerald-400">
                  {supportStatusMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={supportSending || !supportMessage.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-xs font-bold text-white hover:bg-purple-500 disabled:opacity-40 transition"
              >
                {supportSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span>Send to Engineering Support</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
