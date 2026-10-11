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
  cast: Array<{ player: string; role: string; archetype?: string; motivation?: string }>,
  genre: string,
  customPhotos: Record<string, string> = {}
): CharacterVisualBible {
  const existing = getStoredVisualBible();
  let updated = { ...existing };
  let hasNew = false;

  const normalizedGenre = genre.toLowerCase().includes('scifi') || genre.toLowerCase().includes('sci-fi')
    ? 'scifi'
    : genre.toLowerCase().includes('heist')
    ? 'heist'
    : genre.toLowerCase().includes('cyber')
    ? 'cyberpunk'
    : genre.toLowerCase().includes('horror')
    ? 'horror'
    : genre.toLowerCase().includes('nollywood') || genre.toLowerCase().includes('afro')
    ? 'nollywood'
    : 'default';

  const presets = WARDROBE_PRESETS[normalizedGenre] || WARDROBE_PRESETS.default;

  cast.forEach((member, index) => {
    const key = member.player.toLowerCase().trim();
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
    return 'HIGH-OCTANE PHYSICAL COMBAT: The characters are in dynamic, mid-action combat—striking, defending, weapons drawn or clashing hand-to-hand with kinetic energy, debris and dramatic motion blur like a premier graphic novel fight splash page.';
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
  scriptLines: Array<{ speaker: string; direction?: string; line: string }>,
  cast: Array<{ player: string; role: string }>,
  bible: CharacterVisualBible
): CharacterActionBeat[] {
  return cast.map((member) => {
    const key = member.player.toLowerCase().trim();
    const locked = bible[key];
    const memberLines = scriptLines.filter(
      (l) => l.speaker.toLowerCase().trim() === key
    );

    const actions = memberLines
      .map((l) => (l.direction ? l.direction.replace(/[[\]()]/g, '').trim() : ''))
      .filter(Boolean)
      .join('; ');

    const dialogues = memberLines
      .map((l) => `"${l.line}"`)
      .slice(0, 2)
      .join(' / ');

    return {
      player: member.player,
      role: member.role,
      action: actions || 'Visually reacting in the scene with intense focus and body language',
      dialogue: dialogues || '',
      wardrobe: locked?.wardrobe,
      props: locked?.signatureProps,
    };
  });
}

/**
 * Generate a dynamic high-fidelity graphic novel scene SVG that directly
 * renders the exact SCENE HEADING and the CHARACTERS performing their actions inside the room.
 */
export function generateDynamicSceneSvg(
  sceneHeading: string,
  genre: string,
  characterBeats: CharacterActionBeat[],
  aspectRatio: '9:16' | '16:9' = '9:16'
): string {
  const isPortrait = aspectRatio === '9:16';
  const width = isPortrait ? 720 : 1280;
  const height = isPortrait ? 1280 : 720;

  const headingLower = (sceneHeading || '').toLowerCase();
  const genreLower = (genre || '').toLowerCase();

  // Color grading and architecture based on the scene heading
  const isAirlockOrScifi = headingLower.includes('airlock') || headingLower.includes('orbit') || headingLower.includes('station') || genreLower.includes('sci-fi');
  const isParlourOrMansion = headingLower.includes('parlour') || headingLower.includes('banquet') || headingLower.includes('manor') || headingLower.includes('ikoyi') || genreLower.includes('nollywood');
  const isHeistOrVault = headingLower.includes('vault') || headingLower.includes('safe') || headingLower.includes('junction') || headingLower.includes('heist') || genreLower.includes('heist');
  const isHorrorOrCrypt = headingLower.includes('crypt') || headingLower.includes('grave') || headingLower.includes('attic') || genreLower.includes('horror');

  // Palette selection
  let bgTop = '#020617';
  let bgMid = '#0f172a';
  let bgBottom = '#020617';
  let ambientGlow = '#38bdf8';
  let accentStrobe = '#ef4444';

  if (isAirlockOrScifi) {
    bgTop = '#030712';
    bgMid = '#1e1b4b';
    bgBottom = '#09090b';
    ambientGlow = '#06b6d4';
    accentStrobe = '#ef4444';
  } else if (isParlourOrMansion) {
    bgTop = '#1c1917';
    bgMid = '#292524';
    bgBottom = '#0c0a09';
    ambientGlow = '#f59e0b';
    accentStrobe = '#fbbf24';
  } else if (isHeistOrVault) {
    bgTop = '#020617';
    bgMid = '#042f2e';
    bgBottom = '#020617';
    ambientGlow = '#10b981';
    accentStrobe = '#06b6d4';
  } else if (isHorrorOrCrypt) {
    bgTop = '#09090b';
    bgMid = '#18181b';
    bgBottom = '#030712';
    ambientGlow = '#a855f7';
    accentStrobe = '#7e22ce';
  }

  // Architectural elements
  let environmentElements = '';
  if (isAirlockOrScifi) {
    environmentElements = `
      <!-- Pressurized Airlock Bulkhead Arch -->
      <circle cx="${width / 2}" cy="${height * 0.45}" r="${width * 0.42}" fill="none" stroke="#334155" stroke-width="28" opacity="0.6" />
      <circle cx="${width / 2}" cy="${height * 0.45}" r="${width * 0.38}" fill="none" stroke="#64748b" stroke-width="8" stroke-dasharray="24 16" opacity="0.7" />
      <!-- Red Alert Strobe Lights -->
      <circle cx="${width * 0.15}" cy="${height * 0.2}" r="14" fill="${accentStrobe}" filter="url(#glowFilter)" opacity="0.9" />
      <circle cx="${width * 0.85}" cy="${height * 0.2}" r="14" fill="${accentStrobe}" filter="url(#glowFilter)" opacity="0.9" />
      <!-- Glowing Conduit Racks & Sparks -->
      <path d="M0 ${height * 0.25} L${width} ${height * 0.25}" stroke="${ambientGlow}" stroke-width="4" opacity="0.5" />
      <path d="M${width * 0.08} 0 L${width * 0.08} ${height}" stroke="#475569" stroke-width="12" opacity="0.4" />
      <path d="M${width * 0.92} 0 L${width * 0.92} ${height}" stroke="#475569" stroke-width="12" opacity="0.4" />
      <!-- Spark Particles -->
      <circle cx="${width * 0.35}" cy="${height * 0.35}" r="3" fill="#fef08a" filter="url(#glowFilter)" />
      <circle cx="${width * 0.65}" cy="${height * 0.38}" r="2.5" fill="#fef08a" filter="url(#glowFilter)" />
      <circle cx="${width * 0.42}" cy="${height * 0.28}" r="4" fill="#38bdf8" filter="url(#glowFilter)" />
    `;
  } else if (isParlourOrMansion) {
    environmentElements = `
      <!-- Ornate Banquet Arch & Damask Wall Framing -->
      <path d="M${width * 0.1} ${height * 0.15} Q${width * 0.5} ${height * 0.05} ${width * 0.9} ${height * 0.15} L${width * 0.9} ${height} L${width * 0.1} ${height} Z" fill="#292524" opacity="0.4" />
      <!-- Gold Dusted Chandelier in Center Ceiling -->
      <path d="M${width * 0.5} 0 L${width * 0.5} ${height * 0.18}" stroke="#ca8a04" stroke-width="4" />
      <ellipse cx="${width * 0.5}" cy="${height * 0.18}" rx="${width * 0.22}" ry="18" fill="none" stroke="#facc15" stroke-width="6" filter="url(#glowFilter)" opacity="0.85" />
      <circle cx="${width * 0.5}" cy="${height * 0.18}" r="22" fill="#fef08a" opacity="0.3" filter="url(#glowFilter)" />
      <circle cx="${width * 0.38}" cy="${height * 0.2}" r="8" fill="#fde047" opacity="0.8" />
      <circle cx="${width * 0.62}" cy="${height * 0.2}" r="8" fill="#fde047" opacity="0.8" />
      <!-- Heavy Mahogany Banquet Table -->
      <polygon points="${width * 0.05},${height * 0.75} ${width * 0.95},${height * 0.75} ${width},${height * 0.9} 0,${height * 0.9}" fill="#451a03" stroke="#78350f" stroke-width="4" opacity="0.9" />
      <!-- Crystal Decanter & Champagne Goblets on Table -->
      <rect x="${width * 0.47}" y="${height * 0.7}" width="26" height="42" rx="6" fill="#fef08a" opacity="0.6" filter="url(#glowFilter)" />
    `;
  } else {
    environmentElements = `
      <!-- High-Tech / Architectural Perspective Grid -->
      <line x1="0" y1="${height * 0.7}" x2="${width}" y2="${height * 0.7}" stroke="${ambientGlow}" stroke-width="2" opacity="0.4" />
      <line x1="${width * 0.2}" y1="0" x2="${width * 0.2}" y2="${height}" stroke="#334155" stroke-width="6" opacity="0.3" />
      <line x1="${width * 0.8}" y1="0" x2="${width * 0.8}" y2="${height}" stroke="#334155" stroke-width="6" opacity="0.3" />
      <circle cx="${width * 0.5}" cy="${height * 0.35}" r="${width * 0.25}" fill="${ambientGlow}" opacity="0.08" filter="url(#glowFilter)" />
    `;
  }

  // Generate character figures physically positioned and acting inside the room
  let characterFigures = '';
  const numChars = Math.min(characterBeats.length, 4);

  characterBeats.slice(0, 4).forEach((char, idx) => {
    // Distribute characters across the scene perspective
    const xPos = numChars === 1
      ? width * 0.5
      : width * (0.22 + (idx / (numChars - 1 || 1)) * 0.56);
    const yBase = height * 0.78;
    const figureScale = idx % 2 === 0 ? 1.05 : 0.95;
    const isSpeaking = idx === 0;

    // Check action type for dynamic kinetic posture
    const actionText = (char.action || '').toLowerCase();
    const isCombat = /fight|punch|strike|attack|clash|weapon|gun|knife/.test(actionText);
    const isCrawlingOrCrouching = /crawl|crouch|duck|hide|under/.test(actionText);
    const isPoundingOrSlamming = /pound|slam|bang|hit|strike|fist/.test(actionText);
    const isCheeringOrToasting = /toast|cheer|raise|drink|celebrat/.test(actionText);

    let armPath = '';
    if (isCombat) {
      // Dynamic combat stance with weapon/fist thrust forward
      armPath = `
        <path d="M${xPos - 30} ${yBase - 150} Q${xPos - 80} ${yBase - 180} ${xPos - 110} ${yBase - 160}" stroke="#0f172a" stroke-width="18" stroke-linecap="round" />
        <path d="M${xPos + 30} ${yBase - 150} Q${xPos + 70} ${yBase - 190} ${xPos + 90} ${yBase - 220}" stroke="#0f172a" stroke-width="18" stroke-linecap="round" />
      `;
    } else if (isPoundingOrSlamming) {
      // Arm raised and slamming down onto table/console
      armPath = `
        <path d="M${xPos + 25} ${yBase - 150} Q${xPos + 60} ${yBase - 230} ${xPos + 40} ${yBase - 260}" stroke="#0f172a" stroke-width="18" stroke-linecap="round" />
        <path d="M${xPos - 25} ${yBase - 150} Q${xPos - 50} ${yBase - 110} ${xPos - 60} ${yBase - 80}" stroke="#0f172a" stroke-width="18" stroke-linecap="round" />
      `;
    } else if (isCheeringOrToasting) {
      // Raised goblet/glass
      armPath = `
        <path d="M${xPos + 25} ${yBase - 150} Q${xPos + 65} ${yBase - 210} ${xPos + 75} ${yBase - 240}" stroke="#0f172a" stroke-width="16" stroke-linecap="round" />
        <polygon points="${xPos + 70},${yBase - 265} ${xPos + 86},${yBase - 265} ${xPos + 78},${yBase - 245}" fill="#facc15" filter="url(#glowFilter)" />
      `;
    } else if (isCrawlingOrCrouching) {
      // Crouched stance
      armPath = `
        <path d="M${xPos - 40} ${yBase - 100} Q${xPos - 70} ${yBase - 50} ${xPos - 90} ${yBase - 20}" stroke="#0f172a" stroke-width="16" stroke-linecap="round" />
      `;
    } else {
      // Dramatic cinematic standing dialogue posture
      armPath = `
        <path d="M${xPos - 25} ${yBase - 150} Q${xPos - 50} ${yBase - 110} ${xPos - 40} ${yBase - 70}" stroke="#0f172a" stroke-width="16" stroke-linecap="round" />
        <path d="M${xPos + 25} ${yBase - 150} Q${xPos + 55} ${yBase - 130} ${xPos + 65} ${yBase - 110}" stroke="#0f172a" stroke-width="16" stroke-linecap="round" />
      `;
    }

    // Costume color accent from wardrobe
    const wardrobeLower = (char.wardrobe || '').toLowerCase();
    let costumeColor = '#1e293b';
    let trimColor = ambientGlow;
    if (wardrobeLower.includes('blue') || wardrobeLower.includes('agbada')) {
      costumeColor = '#1e1b4b';
      trimColor = '#facc15';
    } else if (wardrobeLower.includes('green') || wardrobeLower.includes('emerald')) {
      costumeColor = '#064e3b';
      trimColor = '#34d399';
    } else if (wardrobeLower.includes('red') || wardrobeLower.includes('crimson')) {
      costumeColor = '#7f1d1d';
      trimColor = '#fbbf24';
    } else if (wardrobeLower.includes('charcoal') || wardrobeLower.includes('suit') || wardrobeLower.includes('tuxedo')) {
      costumeColor = '#18181b';
      trimColor = '#94a3b8';
    }

    const yHead = isCrawlingOrCrouching ? yBase - 120 : yBase - 220;
    const bodyHeight = isCrawlingOrCrouching ? 100 : 180;

    characterFigures += `
      <!-- Character: ${char.player} as ${char.role} -->
      <g filter="url(#dropShadow)" opacity="${isSpeaking ? '1.0' : '0.88'}">
        <!-- Cast Rim Light Aura -->
        <ellipse cx="${xPos}" cy="${yHead + 20}" rx="48" ry="58" fill="${trimColor}" opacity="0.18" filter="url(#glowFilter)" />

        <!-- Limbs & Silhouette Body -->
        ${armPath}

        <!-- Torso / Locked Wardrobe Coat / Outfit -->
        <path d="M${xPos - 38} ${yHead + 45} L${xPos + 38} ${yHead + 45} L${xPos + 48} ${yHead + bodyHeight} L${xPos - 48} ${yHead + bodyHeight} Z" fill="${costumeColor}" stroke="${trimColor}" stroke-width="2" />

        <!-- Head / Profile -->
        <circle cx="${xPos}" cy="${yHead}" r="26" fill="#1c1917" stroke="${trimColor}" stroke-width="1.5" />
        <!-- Dramatic Rim Lighting on Face & Hair -->
        <path d="M${xPos - 20} ${yHead - 22} Q${xPos} ${yHead - 30} ${xPos + 22} ${yHead - 20}" stroke="${ambientGlow}" stroke-width="4" fill="none" opacity="0.8" />
      </g>
    `;
  });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${bgTop}" />
        <stop offset="60%" stop-color="${bgMid}" />
        <stop offset="100%" stop-color="${bgBottom}" />
      </linearGradient>
      <filter id="glowFilter" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="10" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
      <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.85"/>
      </filter>
    </defs>

    <!-- Background Wallpaper / Architecture Grid -->
    <rect width="${width}" height="${height}" fill="url(#skyGrad)" />

    <!-- Scene Heading Environmental Architecture -->
    ${environmentElements}

    <!-- Characters Physically Inside the Scene Interacting in Action -->
    ${characterFigures}

    <!-- Cinematic Vignette & Atmospheric Contrast Grading -->
    <rect width="${width}" height="${height}" fill="black" opacity="0.25" />
    <path d="M0 0 L${width} 0 L${width} ${height * 0.15} L0 ${height * 0.15} Z" fill="black" opacity="0.4" />
    <path d="M0 ${height * 0.85} L${width} ${height * 0.85} L${width} ${height} L0 ${height} Z" fill="black" opacity="0.6" />
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
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

=== GRAPHIC NOVEL SCENE ACTION (CHARACTERS IN ACTION) ===
${actionDescription}
IMPORTANT: Do NOT render characters as separate portrait headshots or UI floating icons. The characters MUST be physically rendered INSIDE the scene illustration itself, interacting with one another and the environment, fully drawn into the environment just like a cinematic graphic novel or comic book panel.
`.trim();
}
