// ============================================================================
// CHARACTER VISUAL BIBLE & CONTINUITY LOCK ENGINE
// Locks characters' physical look, facial features, wardrobe, and props
// across all acts and scene branches for graphic novel & cinematic consistency.
// ============================================================================

import { detectNameNationality, detectGenderAffinity } from './characterAvatars.ts';

export interface LockedCharacterVisual {
  player: string;
  role: string;
  archetype: string;
  heritagePrompt: string; // Used strictly in prompts, never displayed in UI
  facialFeatures: string;
  hairStyle: string;
  wardrobe: string;
  signatureProps: string;
  expressionProfile: string;
}

export type CharacterVisualBible = Record<string, LockedCharacterVisual>;

const STORAGE_KEY_BIBLE = 'sceneswap_character_visual_bible_v2';

/**
 * Get the saved visual bible from localStorage
 */
export function getStoredVisualBible(): CharacterVisualBible {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BIBLE);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Save the visual bible to localStorage
 */
export function saveStoredVisualBible(bible: CharacterVisualBible): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_BIBLE, JSON.stringify(bible));
  } catch (err) {
    console.warn('Failed to save character visual bible:', err);
  }
}

/**
 * Clear the stored visual bible (when starting a brand new party game)
 */
export function clearStoredVisualBible(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY_BIBLE);
  } catch (err) {
    console.warn('Failed to clear character visual bible:', err);
  }
}

/**
 * Wardrobe templates locked by genre and archetype
 */
const WARDROBE_PRESETS: Record<string, { wardrobe: string; props: string }[]> = {
  nollywood: [
    {
      wardrobe: 'Crisp midnight-blue Agbada with ornate gold metallic embroidery across the chest and tailored trousers',
      props: 'Heavy engraved gold signet ring on right pinky finger, slim gold watch',
    },
    {
      wardrobe: 'Royal emerald-green silk Gele headwrap and fitted off-shoulder brocade gown with shimmering beadwork',
      props: 'Chunky polished coral beaded necklace and matching gold statement drop earrings',
    },
    {
      wardrobe: 'Sharp bespoke charcoal Italian wool three-piece suit with ivory silk tie and pocket square',
      props: 'Encrypted black leather portfolio and vintage fountain pen',
    },
    {
      wardrobe: 'Crimson tailored velvet dinner jacket with black satin peak lapels and tailored dress pants',
      props: 'Gold-rimmed aviator sunglasses hanging from collar, gold signet band',
    },
    {
      wardrobe: 'Regal burgundy traditional Kaftan with intricate diamond geometric collar embroidery',
      props: 'Carved ivory ceremonial walking cane and woven wristlet',
    },
  ],
  scifi: [
    {
      wardrobe: 'Matte carbon-fiber armored flight suit with neon cyan biometric LED seams and reinforced joints',
      props: 'Holographic wrist-mounted comms gauntlet and magnetic holster',
    },
    {
      wardrobe: 'White and chrome orbital scientist coat over slate pressurized tactical jumpsuit',
      props: 'Floating optical scanner lens over left eye, transparent datapad',
    },
    {
      wardrobe: 'Stealth combat exo-rig with titanium shoulder plating and thermal dampening mesh',
      props: 'Plasma sidearm locked in quick-draw thigh rig, tactical visor',
    },
    {
      wardrobe: 'High-collar cybernetic operative duster in distressed obsidian weave with copper wiring accents',
      props: 'Cyberware data-jack port on right temple, neural hacking deck',
    },
  ],
  heist: [
    {
      wardrobe: 'Matte black tactical turtleneck with Kevlar-weave utility harness and covert combat trousers',
      props: 'Titanium lockpick pen in breast slot, biometric earpiece communicator',
    },
    {
      wardrobe: 'Immaculate tailored midnight-navy tuxedo with concealed silk shoulder holster and cufflinks',
      props: 'Laser vault frequency bypass key fob, vintage gold pocket watch',
    },
    {
      wardrobe: 'Sleek leather motorcycle jacket with reinforced elbows, dark denim and combat boots',
      props: 'Encrypted drone remote control handset on belt, mirrored aviators',
    },
    {
      wardrobe: 'High-fashion metallic silver cocktail dress with concealed ceramic blade sheath at thigh',
      props: 'Diamond-encrusted audio bug compact mirror, sapphire pendant',
    },
  ],
  cyberpunk: [
    {
      wardrobe: 'Weathered neon-yellow reinforced courier jacket with glowing optic cables and armored knee trousers',
      props: 'Implanted cyber-optic ocular HUD in right eye, chrome deck deckpack',
    },
    {
      wardrobe: 'Synthetic leather trenchcoat with ultraviolet circuit patterns running down both sleeves',
      props: 'Glow-wire knuckle duster on left hand, data siphon jack',
    },
    {
      wardrobe: 'Corporate security carbon-weave blazer with internal ballistic plating and smart-tie',
      props: 'Micro-projector lapel pin, encrypted thumbprint reader',
    },
  ],
  horror: [
    {
      wardrobe: 'Distressed tweed academic coat with leather elbow patches, wool vest and weathered boots',
      props: 'Antique brass kerosene lantern and leather-bound occult grimoire',
    },
    {
      wardrobe: 'Heavy waxed rain canvas coat with fleece collar and waterproof field boots',
      props: 'Vintage silver crucifix pendant and tactical flash beam torch',
    },
    {
      wardrobe: 'Dark vintage Victorian high-neck mourning dress with lace collar and obsidian buttons',
      props: 'Silver locket containing dried sage, heirloom candleholder',
    },
  ],
  default: [
    {
      wardrobe: 'Sleek dark tailored cinematic wardrobe with modern structured silhouette and textured fabrics',
      props: 'Signature metallic watch and sleek smartphone device',
    },
    {
      wardrobe: 'Contemporary high-contrast cinematic ensemble with sharp lines and rich color grading',
      props: 'Distinctive leather notebook and silver pendant necklace',
    },
    {
      wardrobe: 'Rugged stylized cinematic jacket over dark knit shirt and durable field trousers',
      props: 'Tactical wrist compass and worn leather belt pouch',
    },
  ],
};

/**
 * Generate or retrieve locked visual identity for every character in the cast.
 * Once created for a story, this visual bible is completely immutable so that
 * the characters have 100% consistent faces, hair, wardrobe, and props across all scenes.
 */
export function lockOrGetCharacterVisualBible(
  cast: Array<{ player: string; role: string; archetype?: string; motivation?: string }> = [],
  genre: string = 'Nollywood Drama',
  customPhotos: Record<string, string> = {}
): CharacterVisualBible {
  const existing = getStoredVisualBible();
  let updated = { ...existing };
  let hasNew = false;
  const safeCast = Array.isArray(cast) ? cast : [];

  const genreStr = String(genre || '');
  const normalizedGenre = genreStr.toLowerCase().includes('scifi') || genreStr.toLowerCase().includes('sci-fi')
    ? 'scifi'
    : genreStr.toLowerCase().includes('heist')
    ? 'heist'
    : genreStr.toLowerCase().includes('cyber')
    ? 'cyberpunk'
    : genreStr.toLowerCase().includes('horror')
    ? 'horror'
    : genreStr.toLowerCase().includes('nollywood') || genreStr.toLowerCase().includes('afro')
    ? 'nollywood'
    : 'default';

  const presets = WARDROBE_PRESETS[normalizedGenre] || WARDROBE_PRESETS.default;

  safeCast.forEach((member, index) => {
    if (!member || !member.player) return;
    const key = String(member.player).toLowerCase().trim();
    if (!key) return;
    if (!updated[key]) {
      hasNew = true;
      const nationality = detectNameNationality(member.player);
      const gender = detectGenderAffinity(member.player, member.role);
      const isFemale = gender === 'female';
      const preset = presets[index % presets.length];

      // Physical facial features and hair locked for continuity
      let facialFeatures = '';
      let hairStyle = '';

      if (nationality.nationality === 'nigerian') {
        facialFeatures = isFemale
          ? 'Radiant warm deep espresso complexion, sculpted high cheekbones, expressive warm dark brown eyes'
          : 'Rich dark espresso skin, clean sculpted jawline, well-groomed beard fade, confident gaze';
        hairStyle = isFemale
          ? 'Intricate braided crown updo adorned with subtle gold thread'
          : 'Crisp short buzz cut with sharp temple line-up';
      } else if (nationality.nationality === 'asian') {
        facialFeatures = isFemale
          ? 'Luminous porcelain tone, elegant almond-shaped dark eyes, refined facial contours'
          : 'Sharp jawline, intense focused dark eyes, high cheekbones';
        hairStyle = isFemale
          ? 'Sleek jet-black shoulder-length hair tucked behind one ear'
          : 'Modern textured undercut styled with matte clay';
      } else if (nationality.nationality === 'south_asian') {
        facialFeatures = isFemale
          ? 'Warm golden-bronze complexion, striking kohl-rimmed dark eyes, graceful facial profile'
          : 'Warm caramel-bronze skin tone, defined sharp jaw, manicured stubble, piercing gaze';
        hairStyle = isFemale
          ? 'Thick lustrous dark wavy hair parted gracefully'
          : 'Classic groomed voluminous dark hair swept back';
      } else if (nationality.nationality === 'hispanic') {
        facialFeatures = isFemale
          ? 'Warm sun-kissed olive complexion, dramatic dark eyes, defined brows'
          : 'Sharp angular features, warm bronze skin, five o-clock shadow, charismatic intense expression';
        hairStyle = isFemale
          ? 'Dark brunette curls cascading over shoulders'
          : 'Tapered fade with textured wavy dark hair on top';
      } else if (nationality.nationality === 'middle_eastern') {
        facialFeatures = isFemale
          ? 'Warm olive-amber skin, captivating dark almond eyes with dramatic lashes'
          : 'Distinguished profile, olive undertones, trimmed full beard, piercing dark gaze';
        hairStyle = isFemale
          ? 'Long flowing midnight-black waves framing face'
          : 'Polished dark hair brushed back with clean side taper';
      } else {
        facialFeatures = isFemale
          ? 'Defined features, expressive luminous eyes, natural elegant makeup'
          : 'Chiseled jaw, focused determined eyes, clean shave or subtle stubble';
        hairStyle = isFemale
          ? 'Sophisticated styled hair with loose natural waves'
          : 'Sharp classic side-part haircut with clean silhouette';
      }

      // Check if custom photo was uploaded
      const hasCustomPhoto = !!customPhotos[key];
      const customNote = hasCustomPhoto
        ? `[Continuity Note: Match likeness and hairstyle from player's uploaded reference portrait for ${member.player}]`
        : '';

      updated[key] = {
        player: member.player,
        role: member.role,
        archetype: member.archetype || 'Lead',
        heritagePrompt: `${nationality.label} ethnic appearance and features ${customNote}`.trim(),
        facialFeatures,
        hairStyle,
        wardrobe: preset.wardrobe,
        signatureProps: preset.props,
        expressionProfile: 'Intense cinematic presence, expressive eye contact, distinct signature stance',
      };
    }
  });

  if (hasNew) {
    saveStoredVisualBible(updated);
  }

  return updated;
}

/**
 * Extract physical action keywords from the script and setting
 * to ensure characters are depicted in active physical interaction (fighting, clashing, arguing, escaping, etc.)
 */
export function extractPhysicalSceneAction(
  settingDescription: string,
  scriptLines: Array<{ speaker: string; direction?: string; line: string }>,
  chapterTitle = ''
): string {
  const combinedText = [
    chapterTitle,
    settingDescription,
    ...scriptLines.map((l) => `${l.direction || ''} ${l.line}`),
  ].join(' ').toLowerCase();

  if (/fight|punch|kick|brawl|clash|attack|strike|weapon|sword|gun|shoot|combat|duel|tackle/.test(combinedText)) {
    return 'HIGH-OCTANE PHYSICAL COMBAT: The characters are in dynamic, mid-action combat—striking, defending, weapons drawn or clashing hand-to-hand with kinetic energy, debris and dramatic motion blur like a premier cinematic live-action film sequence.';
  }

  if (/chase|run|flee|escape|sprint|pursue|dash|vehicle|drive/.test(combinedText)) {
    return 'HIGH-SPEED PURSUIT & ESCAPE: The characters are in active motion, running, sprinting through obstacles, glancing over shoulders, caught in a breathless chase sequence.';
  }

  if (/argue|shout|confront|accuse|point|yell|betray|threaten|stare/.test(combinedText)) {
    return 'INTENSE DRAMATIC CONFRONTATION: Characters are standing toe-to-toe in a fierce standoff, pointing accusing fingers, leaning across a table or cornering each other with furious facial expressions and charged body language.';
  }

  if (/hack|terminal|vault|lock|safe|laser|disable|steal|infiltrat/.test(combinedText)) {
    return 'TENSE COVERT INFILTRATION: Characters are actively working side-by-side on the heist—one hacking the glowing console or cracking the safe while another watches the doorway with weapon drawn and heightened alert.';
  }

  if (/toast|celebrat|laugh|drink|party|cheer|embrace|kiss|dance/.test(combinedText)) {
    return 'VIBRANT CELEBRATION & TOAST: Characters are raising ornate glasses in a triumphant toast, leaning in close with genuine smiles and emotional camaraderie amidst the opulent setting.';
  }

  if (/investigat|search|clue|examine|inspect|whisper|uncover/.test(combinedText)) {
    return 'ATMOSPHERIC INVESTIGATION: Characters are crouching together over crucial physical evidence, one shining a light while the other examines the artifact with keen scrutiny.';
  }

  return 'DYNAMIC DRAMATIC INTERACTION: Characters are physically interacting with each other and their environment, moving through the space with expressive body language and active cinematic engagement.';
}

/**
 * Extract specific action and dialogue beats for each character in this scene
 */
export interface CharacterActionBeat {
  player: string;
  role: string;
  action: string;
  dialogue: string;
  wardrobe?: string;
  props?: string;
}

export function extractCharacterActionBeats(
  scriptLines: Array<{ speaker: string; direction?: string; line: string }> = [],
  cast: Array<{ player: string; role: string }> = [],
  bible: CharacterVisualBible = {}
): CharacterActionBeat[] {
  const safeCast = Array.isArray(cast) ? cast : [];
  const safeLines = Array.isArray(scriptLines) ? scriptLines : [];
  const safeBible = bible || {};

  return safeCast.map((member) => {
    if (!member || !member.player) {
      return {
        player: 'Actor',
        role: 'Performer',
        action: 'Visually reacting in the scene with intense focus and body language',
        dialogue: '',
      };
    }
    const key = String(member.player).toLowerCase().trim();
    const locked = safeBible[key];
    const memberLines = safeLines.filter(
      (l) => l && typeof l.speaker === 'string' && l.speaker.toLowerCase().trim() === key
    );

    const actions = memberLines
      .map((l) => (l.direction ? l.direction.replace(/[[\]()]/g, '').trim() : ''))
      .filter(Boolean)
      .join('; ');

    const dialogues = memberLines
      .map((l) => `"${l.line || ''}"`)
      .slice(0, 2)
      .join(' / ');

    return {
      player: member.player,
      role: member.role || 'Actor',
      action: actions || 'Visually reacting in the scene with intense focus and body language',
      dialogue: dialogues || '',
      wardrobe: locked?.wardrobe,
      props: locked?.signatureProps,
    };
  });
}

/**
 * Helper to escape text for safe SVG rendering
 */
function escapeSvg(unsafe: string = ''): string {
  return String(unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Word wrap helper for SVG text rendering
 */
function wrapSvgLines(text: string, maxChars: number = 38): string[] {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  const words = clean.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if ((current + ' ' + word).trim().length <= maxChars) {
      current = (current + ' ' + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Generate a dynamic high-fidelity graphic novel scene SVG that directly
 * renders the exact SCENE HEADING, the CHARACTERS performing their physical actions,
 * and their spoken DIALOGUES in authentic comic splash panel style (no geometric shapes).
 */
export function generateDynamicSceneSvg(
  sceneHeading: string = '',
  genre: string = '',
  characterBeats: CharacterActionBeat[] = [],
  aspectRatio: '9:16' | '16:9' = '16:9',
  activeSpeaker?: string,
  activeLine?: string,
  activeDirection?: string,
  customPortraits: Record<string, string> = {},
  actNumber: number = 1
): string {
  const isPortrait = aspectRatio === '9:16';
  const width = isPortrait ? 720 : 1280;
  const height = isPortrait ? 1280 : 720;

  const headingLower = (sceneHeading || '').toLowerCase();
  const genreLower = (genre || '').toLowerCase();

  // Environment Classification
  const isScifi = headingLower.includes('airlock') || headingLower.includes('orbit') || headingLower.includes('station') || headingLower.includes('module') || genreLower.includes('sci-fi');
  const isBallroom = headingLower.includes('ballroom') || headingLower.includes('parlour') || headingLower.includes('manor') || headingLower.includes('mansion') || headingLower.includes('wedding') || headingLower.includes('ikoyi') || headingLower.includes('banquet') || genreLower.includes('nollywood');
  const isVault = headingLower.includes('vault') || headingLower.includes('safe') || headingLower.includes('junction') || headingLower.includes('heist') || headingLower.includes('bank') || genreLower.includes('heist');
  const isHorror = headingLower.includes('crypt') || headingLower.includes('grave') || headingLower.includes('attic') || headingLower.includes('manor') || genreLower.includes('horror');
  const isCyber = headingLower.includes('cyber') || headingLower.includes('neon') || headingLower.includes('alley') || headingLower.includes('detective') || genreLower.includes('cyber') || genreLower.includes('detective');

  // Palette Theme
  let wallGrad1 = '#1c1917';
  let wallGrad2 = '#292524';
  let floorColor = '#0c0a09';
  let accentColor = '#f59e0b';
  let glowColor = '#fbbf24';
  let bannerColor = '#facc15';

  if (isScifi) {
    wallGrad1 = '#020617';
    wallGrad2 = '#0f172a';
    floorColor = '#030712';
    accentColor = '#06b6d4';
    glowColor = '#38bdf8';
    bannerColor = '#38bdf8';
  } else if (isVault) {
    wallGrad1 = '#022c22';
    wallGrad2 = '#064e3b';
    floorColor = '#021814';
    accentColor = '#10b981';
    glowColor = '#34d399';
    bannerColor = '#10b981';
  } else if (isHorror) {
    wallGrad1 = '#180728';
    wallGrad2 = '#2e1065';
    floorColor = '#090514';
    accentColor = '#a855f7';
    glowColor = '#c084fc';
    bannerColor = '#c084fc';
  } else if (isCyber) {
    wallGrad1 = '#0a0a1a';
    wallGrad2 = '#1e1b4b';
    floorColor = '#050510';
    accentColor = '#ec4899';
    glowColor = '#a855f7';
    bannerColor = '#f43f5e';
  }

  // --- 1. CLEAN ATMOSPHERIC CINEMATIC LIGHTING (NO HARD SHAPES AT TOP OR BOTTOM) ---
  let environmentElements = '';

  if (isScifi) {
    // Ambient sci-fi cosmos aura - smooth atmospheric glow, no hard geometric shapes
    environmentElements = `
      <radialGradient id="scifiGlow" cx="50%" cy="35%" r="60%">
        <stop offset="0%" stop-color="#0284c7" stop-opacity="0.35" />
        <stop offset="60%" stop-color="#0369a1" stop-opacity="0.1" />
        <stop offset="100%" stop-color="#020617" stop-opacity="0" />
      </radialGradient>
      <rect width="${width}" height="${height}" fill="url(#scifiGlow)" />
      <!-- Subtle cosmic starlight dust -->
      <circle cx="${width * 0.35}" cy="${height * 0.25}" r="2" fill="#ffffff" opacity="0.6" />
      <circle cx="${width * 0.65}" cy="${height * 0.3}" r="1.5" fill="#ffffff" opacity="0.5" />
      <circle cx="${width * 0.5}" cy="${height * 0.2}" r="2.5" fill="#38bdf8" opacity="0.7" />
    `;
  } else if (isVault) {
    // High-tech stealth ambient glow - smooth gradient, no top/bottom slabs
    environmentElements = `
      <radialGradient id="vaultGlow" cx="50%" cy="40%" r="65%">
        <stop offset="0%" stop-color="#059669" stop-opacity="0.25" />
        <stop offset="70%" stop-color="#022c22" stop-opacity="0.08" />
        <stop offset="100%" stop-color="#021814" stop-opacity="0" />
      </radialGradient>
      <rect width="${width}" height="${height}" fill="url(#vaultGlow)" />
    `;
  } else if (isHorror) {
    // Dramatic gothic vignette glow - mood lighting, no geometric window arches or floor lines
    environmentElements = `
      <radialGradient id="horrorGlow" cx="50%" cy="30%" r="60%">
        <stop offset="0%" stop-color="#7c3aed" stop-opacity="0.3" />
        <stop offset="60%" stop-color="#3b0764" stop-opacity="0.1" />
        <stop offset="100%" stop-color="#090514" stop-opacity="0" />
      </radialGradient>
      <rect width="${width}" height="${height}" fill="url(#horrorGlow)" />
    `;
  } else if (isCyber) {
    // Neon noir atmospheric aura - soft color washes, no rectangular signs or floor puddles
    environmentElements = `
      <radialGradient id="cyberGlow1" cx="30%" cy="35%" r="50%">
        <stop offset="0%" stop-color="#ec4899" stop-opacity="0.25" />
        <stop offset="100%" stop-color="#0a0a1a" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="cyberGlow2" cx="70%" cy="40%" r="50%">
        <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.25" />
        <stop offset="100%" stop-color="#0a0a1a" stop-opacity="0" />
      </radialGradient>
      <rect width="${width}" height="${height}" fill="url(#cyberGlow1)" />
      <rect width="${width}" height="${height}" fill="url(#cyberGlow2)" />
    `;
  } else {
    // Opulent Ballroom / Lagos Manor - warm golden cinematic ambient spotlight, NO top chandelier or bottom floor line
    environmentElements = `
      <radialGradient id="ballroomGlow" cx="50%" cy="38%" r="65%">
        <stop offset="0%" stop-color="#d97706" stop-opacity="0.28" />
        <stop offset="50%" stop-color="#78350f" stop-opacity="0.12" />
        <stop offset="100%" stop-color="#1c1917" stop-opacity="0" />
      </radialGradient>
      <rect width="${width}" height="${height}" fill="url(#ballroomGlow)" />
      <!-- Subtle warm golden bokeh points for ambiance (soft, floating, non-geometric) -->
      <circle cx="${width * 0.42}" cy="${height * 0.32}" r="14" fill="#fef08a" opacity="0.12" filter="url(#glowFilter)" />
      <circle cx="${width * 0.58}" cy="${height * 0.36}" r="18" fill="#fef08a" opacity="0.1" filter="url(#glowFilter)" />
      <circle cx="${width * 0.5}" cy="${height * 0.45}" r="22" fill="#fde047" opacity="0.08" filter="url(#glowFilter)" />
    `;
  }

  // --- 2. ACTORS / CHARACTERS (NO GEOMETRIC SHAPES TRYING TO PORTRAY HUMANS) ---
  // When real user photos are uploaded, we present a clean photographic badge.
  // We NEVER draw stick figures, trapezoid torsos, or geometric shapes portraying human bodies.
  let characterFigures = '';

  const safeBeats = Array.isArray(characterBeats) && characterBeats.length > 0
    ? characterBeats
    : [];

  safeBeats.forEach((char, idx) => {
    if (!char) return;
    const photoUrl = customPortraits[char.player.toLowerCase()];
    if (photoUrl && photoUrl.startsWith('data:image')) {
      const xPos = width * (0.2 + (idx / Math.max(safeBeats.length - 1, 1)) * 0.6);
      const yPos = height * 0.45;
      characterFigures += `
        <!-- Custom Real Photo Likeness Badge for ${escapeSvg(char.player)} -->
        <g id="char_photo_${idx}" transform="translate(${xPos - 36}, ${yPos - 36})" filter="url(#dropShadow)">
          <circle cx="36" cy="36" r="36" fill="#000000" stroke="${accentColor}" stroke-width="3" />
          <clipPath id="avatarClip_${idx}">
            <circle cx="36" cy="36" r="34" />
          </clipPath>
          <image href="${photoUrl}" x="2" y="2" width="68" height="68" preserveAspectRatio="xMidYMid slice" clip-path="url(#avatarClip_${idx})" />
        </g>
      `;
    }
  });

  // Full SVG Assembly with Halftone pattern & Comic Inks (Pure visual illustration with zero overlapping text)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <!-- Atmospheric Wall Gradient -->
      <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${wallGrad1}" />
        <stop offset="100%" stop-color="${wallGrad2}" />
      </linearGradient>

      <!-- Floor Gradient -->
      <linearGradient id="floorGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${floorColor}" />
        <stop offset="100%" stop-color="#000000" />
      </linearGradient>

      <!-- Glow filter for dramatic lighting -->
      <filter id="glowFilter" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="8" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>

      <!-- Comic Book Deep Ink Drop Shadow -->
      <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="3" dy="5" stdDeviation="6" flood-color="#000000" flood-opacity="0.9" />
      </filter>

      <!-- Halftone Comic Ben-Day Dot Pattern Texture -->
      <pattern id="benDayDots" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
        <circle cx="2.5" cy="2.5" r="1.5" fill="#ffffff" opacity="0.05" />
      </pattern>
    </defs>

    <!-- 1. Background Wall Architecture & Ambient Lighting -->
    <rect width="${width}" height="${height}" fill="url(#wallGrad)" />
    <!-- Halftone Texture Overlay -->
    <rect width="${width}" height="${height}" fill="url(#benDayDots)" pointer-events="none" />

    <!-- 2. Scene Heading Architecture & Props -->
    ${environmentElements}

    <!-- 3. Characters Physically Positioned & Interacting inside the Room -->
    ${characterFigures}

    <!-- Borderless visual frame -->
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Formulate a complete character continuity prompt block for image generation
 */
export function buildContinuityPromptBlock(
  bible: CharacterVisualBible,
  activeCast: Array<{ player: string; role: string }>,
  actionDescription: string
): string {
  const characterDescriptions = activeCast
    .map((member) => {
      const charKey = member.player.toLowerCase().trim();
      const locked = bible[charKey];
      if (!locked) return null;

      return `- "${locked.player}" as ${locked.role}: ${locked.heritagePrompt}. Face & Hair: ${locked.facialFeatures}, ${locked.hairStyle}. LOCKED WARDROBE (MUST NOT CHANGE): ${locked.wardrobe}. LOCKED SIGNATURE PROPS: ${locked.signatureProps}.`;
    })
    .filter(Boolean)
    .join('\n');

  return `
=== MANDATORY CHARACTER CONTINUITY LOCK (STRICT COHESION) ===
The characters in this scene MUST retain their EXACT identical facial identity, hairstyle, locked wardrobe, and signature props as established in Act 1:
${characterDescriptions}

=== LIVE-ACTION CINEMATIC SCENE ACTION ===
${actionDescription}
IMPORTANT: Characters must be physically staged inside the realistic location, interacting with one another with natural postures and authentic lighting. Do NOT render drawings, cartoons, comic panels, or illustrations. Pure photorealistic feature film still.
`.trim();
}
