/**
 * SceneSwap Smart Story-Aware Scene Visual Engine
 *
 * Provides intelligent, setting-aware photorealistic scene selection, dynamic angle
 * variations, cinematic mood color grading, and atmospheric particle/lighting effects.
 */

export interface SceneBackdropDefinition {
  id: string;
  url: string;
  genre: string;
  actRecommended: number;
  tags: string[];
  title: string;
  mood: 'cold-cyan' | 'electric-blue' | 'ambient-purple' | 'emerald-security' | 'stealth-dark' | 'noir-amber' | 'neon-noir' | 'sepia-shadow' | 'storm-teal' | 'haunted-decay' | 'blood-shadow' | 'spectral-violet' | 'regal-gold' | 'corporate-amber' | 'festive-warm' | 'sunlit-warmth' | 'sunset-rose' | 'modern-chic';
}

export const ALL_SCENE_BACKDROPS: SceneBackdropDefinition[] = [
  // --- SCI-FI ---
  {
    id: 'scifi_act1',
    url: '/images/scenes/scifi_act1.jpg',
    genre: 'Sci-Fi Thriller',
    actRecommended: 1,
    title: 'Cryo-Stasis Bay / Orbital Airlock',
    tags: ['cryo', 'hibernation', 'pod', 'bay', 'airlock', 'chamber', 'medical', 'space', 'ship', 'orbital', 'station', 'shuttle', 'derelict', 'cargo', 'hangar'],
    mood: 'cold-cyan',
  },
  {
    id: 'scifi_act2',
    url: '/images/scenes/scifi_act2.jpg',
    genre: 'Sci-Fi Thriller',
    actRecommended: 2,
    title: 'Command Bridge / Holographic Helm',
    tags: ['bridge', 'command', 'cockpit', 'console', 'hologram', 'helm', 'controls', 'navigation', 'screens', 'starship', 'deck', 'terminal', 'radar', 'captain'],
    mood: 'electric-blue',
  },
  {
    id: 'scifi_act3',
    url: '/images/scenes/scifi_act3.jpg',
    genre: 'Sci-Fi Thriller',
    actRecommended: 3,
    title: 'Warp Reactor / Deep Space Observation',
    tags: ['reactor', 'warp', 'core', 'observation', 'window', 'deep space', 'engine', 'generator', 'portal', 'galaxy', 'stars', 'quantum', 'singularity'],
    mood: 'ambient-purple',
  },

  // --- HEIST ---
  {
    id: 'heist_act1',
    url: '/images/scenes/heist_act1.jpg',
    genre: 'Afro-Heist',
    actRecommended: 1,
    title: 'High-Security Bank Vault & Lasers',
    tags: ['vault', 'bank', 'safe', 'laser', 'lock', 'security', 'steel', 'corridor', 'gold', 'drill', 'breach', 'deposit', 'alarm', 'keypad', 'cctv'],
    mood: 'emerald-security',
  },
  {
    id: 'heist_act2',
    url: '/images/scenes/heist_act2.jpg',
    genre: 'Afro-Heist',
    actRecommended: 2,
    title: 'Subterranean Escape Tunnel / Logistics Hub',
    tags: ['tunnel', 'underground', 'sewer', 'escape', 'loading', 'warehouse', 'getaway', 'subway', 'dock', 'van', 'pipes', 'concrete', 'industrial', 'hideout'],
    mood: 'stealth-dark',
  },
  {
    id: 'heist_act3',
    url: '/images/scenes/heist_act3.jpg',
    genre: 'Afro-Heist',
    actRecommended: 3,
    title: 'Helipad Rooftop Overlook',
    tags: ['penthouse', 'rooftop', 'skyline', 'heist', 'overlook', 'helicopter', 'helipad', 'highrise', 'balcony', 'city lights', 'escape route'],
    mood: 'noir-amber',
  },

  // --- DETECTIVE NOIR ---
  {
    id: 'detective_act1',
    url: '/images/scenes/detective_act1.jpg',
    genre: 'Cyber-Detective',
    actRecommended: 1,
    title: 'Rain-Slicked Neon Alleyway',
    tags: ['alley', 'rain', 'street', 'neon', 'noir', 'puddle', 'night', 'steam', 'shadow', 'city', 'crime scene', 'gutter', 'asphalt', 'cyberpunk', 'sidewalk'],
    mood: 'neon-noir',
  },
  {
    id: 'detective_act2',
    url: '/images/scenes/detective_act2.jpg',
    genre: 'Cyber-Detective',
    actRecommended: 2,
    title: 'Dim Interrogation Office / Precinct Desk',
    tags: ['office', 'desk', 'lamp', 'interrogation', 'precinct', 'files', 'typewriter', 'shadows', 'blinds', 'detective', 'case', 'badge', 'dossier', 'evidence'],
    mood: 'sepia-shadow',
  },
  {
    id: 'detective_act3',
    url: '/images/scenes/detective_act3.jpg',
    genre: 'Cyber-Detective',
    actRecommended: 3,
    title: 'Stormy Water Tower Climax Over Metropolis',
    tags: ['rooftop', 'confrontation', 'rain', 'cityscape', 'water tower', 'climax', 'storm', 'lightning', 'ledge', 'skyscrapers', 'standoff'],
    mood: 'storm-teal',
  },

  // --- HORROR ---
  {
    id: 'horror_act1',
    url: '/images/scenes/horror_act1.jpg',
    genre: 'Horror',
    actRecommended: 1,
    title: 'Victorian Manor Hallway of Whispers',
    tags: ['hallway', 'manor', 'corridor', 'abandoned', 'wallpaper', 'door', 'shadows', 'creak', 'ruin', 'haunted', 'darkness', 'decay', 'eerie', 'portrait'],
    mood: 'haunted-decay',
  },
  {
    id: 'horror_act2',
    url: '/images/scenes/horror_act2.jpg',
    genre: 'Horror',
    actRecommended: 2,
    title: 'Candle-lit Subterranean Crypt & Catacombs',
    tags: ['crypt', 'basement', 'cellar', 'candles', 'stone', 'tomb', 'coffin', 'underground', 'dungeon', 'skulls', 'bones', 'ritual', 'torch', 'shadows'],
    mood: 'blood-shadow',
  },
  {
    id: 'horror_act3',
    url: '/images/scenes/horror_act3.jpg',
    genre: 'Horror',
    actRecommended: 3,
    title: 'Moonlit Supernatural Attic & Altar',
    tags: ['attic', 'ritual', 'moonlight', 'window', 'pentagram', 'curse', 'demonic', 'ghost', 'climax', 'shadow', 'spell', 'demon', 'exorcism'],
    mood: 'spectral-violet',
  },

  // --- NOLLYWOD DRAMA ---
  {
    id: 'nollywood_act1',
    url: '/images/scenes/nollywood_act1.jpg',
    genre: 'Nollywood Drama',
    actRecommended: 1,
    title: 'Ikoyi Palace Grand Parlour & Velvet Sofas',
    tags: ['palace', 'parlour', 'mansion', 'living room', 'gold', 'velvet', 'estate', 'sofa', 'luxury', 'ikoyi', 'lagos', 'chief', 'family', 'residence'],
    mood: 'regal-gold',
  },
  {
    id: 'nollywood_act2',
    url: '/images/scenes/nollywood_act2.jpg',
    genre: 'Nollywood Drama',
    actRecommended: 2,
    title: 'Executive Mahogany Study & Will Reading',
    tags: ['boardroom', 'study', 'office', 'executive', 'mahogany', 'contract', 'will', 'lawyer', 'conference', 'inheritance', 'desk', 'attorney', 'documents'],
    mood: 'corporate-amber',
  },
  {
    id: 'nollywood_act3',
    url: '/images/scenes/nollywood_act3.jpg',
    genre: 'Nollywood Drama',
    actRecommended: 3,
    title: 'Royal Grand Banquet & Chandelier Ballroom',
    tags: ['ballroom', 'banquet', 'party', 'chandelier', 'wedding', 'celebration', 'courtyard', 'feast', 'gala', 'crowd', 'ovation', 'royalty'],
    mood: 'festive-warm',
  },

  // --- ROM-COM ---
  {
    id: 'romcom_act1',
    url: '/images/scenes/romcom_act1.jpg',
    genre: 'Rom-Com',
    actRecommended: 1,
    title: 'Sun-Drenched Parisian Style Bistro Patio',
    tags: ['cafe', 'bistro', 'coffee', 'sunlight', 'table', 'patio', 'morning', 'brunch', 'date', 'terrace', 'pastry', 'flowers', 'croissant', 'espresso'],
    mood: 'sunlit-warmth',
  },
  {
    id: 'romcom_act2',
    url: '/images/scenes/romcom_act2.jpg',
    genre: 'Rom-Com',
    actRecommended: 2,
    title: 'Sunset Champagne Terrace at Twilight',
    tags: ['terrace', 'champagne', 'sunset', 'twilight', 'rooftop', 'lights', 'evening', 'cocktails', 'glass', 'toast', 'balcony', 'romantic', 'view'],
    mood: 'sunset-rose',
  },
  {
    id: 'romcom_act3',
    url: '/images/scenes/romcom_act3.jpg',
    genre: 'Rom-Com',
    actRecommended: 3,
    title: 'Chic Metropolitan Penthouse Lounge',
    tags: ['lounge', 'penthouse', 'loft', 'party', 'city view', 'modern', 'interior', 'finale', 'music', 'couch', 'design', 'glamour'],
    mood: 'modern-chic',
  },
];

/**
 * Intelligent story-aware scene selection
 * Analyzes setting keywords, act progression, tone, and angle variation index.
 */
export function getSmartSceneBackdrop(params: {
  genre?: string;
  chapterNumber?: number;
  settingDescription?: string;
  tone?: string;
  variationIndex?: number;
}): SceneBackdropDefinition {
  const {
    genre = 'Nollywood Drama',
    chapterNumber = 1,
    settingDescription = '',
    tone = '',
    variationIndex = 0,
  } = params;

  const textToScan = `${settingDescription} ${tone} ${genre}`.toLowerCase();
  const targetAct = Math.min(Math.max(chapterNumber || 1, 1), 3);

  // Score all 18 backdrops
  const scored = ALL_SCENE_BACKDROPS.map((backdrop) => {
    let score = 0;

    // 1. Tag keyword matching
    for (const tag of backdrop.tags) {
      if (textToScan.includes(tag.toLowerCase())) {
        score += 3;
      }
    }

    // 2. Genre affinity
    const gLower = genre.toLowerCase();
    const bgLower = backdrop.genre.toLowerCase();
    if (gLower.includes('sci-fi') && bgLower.includes('sci-fi')) score += 5;
    else if ((gLower.includes('heist') || gLower.includes('action')) && bgLower.includes('heist')) score += 5;
    else if (gLower.includes('horror') && bgLower.includes('horror')) score += 5;
    else if ((gLower.includes('detective') || gLower.includes('cyber') || gLower.includes('noir')) && bgLower.includes('detective')) score += 5;
    else if ((gLower.includes('nollywood') || gLower.includes('drama')) && bgLower.includes('nollywood')) score += 5;
    else if ((gLower.includes('rom') || gLower.includes('comedy')) && bgLower.includes('romcom')) score += 5;

    // 3. Act progression bonus
    if (backdrop.actRecommended === targetAct) {
      score += 2;
    }

    return { backdrop, score };
  });

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  // Filter top tier candidates (score >= 4 or top 3)
  const topCandidates = scored.filter((s) => s.score >= 4);
  const pool = topCandidates.length > 0 ? topCandidates : scored.slice(0, 3);

  // Pick candidate based on variationIndex
  const chosenIndex = Math.abs(variationIndex) % pool.length;
  return pool[chosenIndex].backdrop;
}

/**
 * Backward compatible replacement for getDefaultRealisticSceneImage
 */
export function getDefaultRealisticSceneImage(
  genre: string,
  chapter: number,
  settingDescription: string = '',
  variationIndex: number = 0
): string {
  const chosen = getSmartSceneBackdrop({
    genre,
    chapterNumber: chapter,
    settingDescription,
    variationIndex,
  });
  return chosen.url;
}

/**
 * Dynamic cinematic mood grading & atmospheric overlay configuration
 */
export interface CinematicGrade {
  filterCss: string;
  ambientTint: string;
  vignetteIntensity: string;
  particleType: 'rain' | 'dust' | 'neon' | 'sparks' | 'golden-bokeh' | 'none';
  moodLabel: string;
}

export function getCinematicMoodGrading(params: {
  genre?: string;
  tone?: string;
  settingDescription?: string;
  activeDirection?: string;
  chapterNumber?: number;
}): CinematicGrade {
  const {
    genre = '',
    tone = '',
    settingDescription = '',
    activeDirection = '',
    chapterNumber = 1,
  } = params;

  const text = `${genre} ${tone} ${settingDescription} ${activeDirection}`.toLowerCase();

  // 1. High Emergency / Crimson Danger / Climax
  if (
    text.includes('alarm') ||
    text.includes('breach') ||
    text.includes('red alert') ||
    text.includes('warning') ||
    text.includes('danger') ||
    text.includes('fight') ||
    text.includes('gun') ||
    text.includes('panic')
  ) {
    return {
      filterCss: 'contrast(1.22) saturate(1.25) brightness(0.88)',
      ambientTint: 'radial-gradient(ellipse at 50% 40%, rgba(225, 29, 72, 0.22) 0%, rgba(159, 18, 57, 0.08) 50%, rgba(0,0,0,0.6) 100%)',
      vignetteIntensity: 'ring-red-500/20 shadow-[inset_0_0_80px_rgba(225,29,72,0.4)]',
      particleType: 'sparks',
      moodLabel: 'Crimson Suspense',
    };
  }

  // 2. Noir Rain / Cold Urban Mystery
  if (
    text.includes('rain') ||
    text.includes('alley') ||
    text.includes('noir') ||
    text.includes('puddle') ||
    text.includes('detective') ||
    text.includes('wet') ||
    text.includes('storm')
  ) {
    return {
      filterCss: 'contrast(1.18) saturate(0.85) brightness(0.92) hue-rotate(-8deg)',
      ambientTint: 'radial-gradient(ellipse at 50% 30%, rgba(6, 182, 212, 0.16) 0%, rgba(15, 23, 42, 0.2) 60%, rgba(2, 6, 23, 0.7) 100%)',
      vignetteIntensity: 'shadow-[inset_0_0_90px_rgba(6,182,212,0.25)]',
      particleType: 'rain',
      moodLabel: 'Noir Rain Mist',
    };
  }

  // 3. Cyberpunk Neon / Digital Standoff
  if (
    text.includes('cyber') ||
    text.includes('neon') ||
    text.includes('laser') ||
    text.includes('hologram') ||
    text.includes('matrix') ||
    text.includes('hack')
  ) {
    return {
      filterCss: 'contrast(1.15) saturate(1.3) brightness(0.95)',
      ambientTint: 'radial-gradient(circle at 70% 30%, rgba(236, 72, 153, 0.18) 0%, rgba(6, 182, 212, 0.12) 40%, rgba(10, 10, 26, 0.6) 100%)',
      vignetteIntensity: 'shadow-[inset_0_0_80px_rgba(236,72,153,0.25)]',
      particleType: 'neon',
      moodLabel: 'Neon Synthwave',
    };
  }

  // 4. Horror / Gothic Shadows / Dread
  if (
    text.includes('horror') ||
    text.includes('crypt') ||
    text.includes('ghost') ||
    text.includes('whisper') ||
    text.includes('blood') ||
    text.includes('curse') ||
    text.includes('dread')
  ) {
    return {
      filterCss: 'contrast(1.25) saturate(0.65) brightness(0.8) sepia(0.15)',
      ambientTint: 'radial-gradient(circle at 50% 40%, rgba(124, 58, 237, 0.16) 0%, rgba(59, 7, 100, 0.25) 50%, rgba(0,0,0,0.85) 100%)',
      vignetteIntensity: 'shadow-[inset_0_0_110px_rgba(0,0,0,0.9)]',
      particleType: 'dust',
      moodLabel: 'Gothic Dread',
    };
  }

  // 5. Opulent Gold / High Society / Rom-Com Warmth
  if (
    text.includes('palace') ||
    text.includes('gold') ||
    text.includes('parlour') ||
    text.includes('ikoyi') ||
    text.includes('champagne') ||
    text.includes('cafe') ||
    text.includes('romance') ||
    text.includes('wedding') ||
    text.includes('luxury')
  ) {
    return {
      filterCss: 'contrast(1.08) saturate(1.18) brightness(1.02) sepia(0.08)',
      ambientTint: 'radial-gradient(circle at 50% 25%, rgba(245, 158, 11, 0.18) 0%, rgba(180, 83, 9, 0.08) 50%, rgba(10, 10, 10, 0.55) 100%)',
      vignetteIntensity: 'shadow-[inset_0_0_70px_rgba(245,158,11,0.18)]',
      particleType: 'golden-bokeh',
      moodLabel: 'Hollywood Golden Hour',
    };
  }

  // Default Cinematic Film Look
  return {
    filterCss: 'contrast(1.1) saturate(1.08) brightness(0.95)',
    ambientTint: 'radial-gradient(circle at 50% 35%, rgba(255, 255, 255, 0.05) 0%, rgba(0, 0, 0, 0.25) 60%, rgba(0, 0, 0, 0.75) 100%)',
    vignetteIntensity: 'shadow-[inset_0_0_80px_rgba(0,0,0,0.7)]',
    particleType: chapterNumber === 3 ? 'sparks' : 'dust',
    moodLabel: '35mm Film Still',
  };
}
