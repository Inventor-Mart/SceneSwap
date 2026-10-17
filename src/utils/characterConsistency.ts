// ============================================================================
// CHARACTER VISUAL BIBLE & CONTINUITY LOCK ENGINE
// Locks characters' physical look, facial features, wardrobe, and props
// across all acts and scene branches for graphic novel & cinematic consistency.
// ============================================================================

import { detectNameNationality, detectGenderAffinity } from './characterAvatars';

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
 * Resolve high-fidelity photographic scene image strictly matching the SCENE HEADING
 * and genre environment. Uses real cinematic photography, never geometric shapes!
 */
export function resolveRealisticSceneImage(
  sceneHeading: string = '',
  genre: string = '',
  chapterNumber: number = 1
): string {
  const heading = (sceneHeading || '').toLowerCase();
  const g = (genre || '').toLowerCase();
  const ch = Math.min(Math.max(chapterNumber || 1, 1), 3);

  // 1. SCIFI / SPACE / AIRLOCK / ORBIT
  if (
    heading.includes('airlock') ||
    heading.includes('cockpit') ||
    heading.includes('bridge') ||
    heading.includes('orbit') ||
    heading.includes('space') ||
    heading.includes('station') ||
    heading.includes('hangar') ||
    heading.includes('warp') ||
    g.includes('sci-fi') ||
    g.includes('scifi')
  ) {
    if (ch === 1 || heading.includes('airlock')) return '/images/scenes/scifi_act1.jpg';
    if (ch === 2 || heading.includes('bridge') || heading.includes('station')) return '/images/scenes/scifi_act2.jpg';
    return '/images/scenes/scifi_act3.jpg';
  }

  // 2. HEIST / VAULT / BANK / TUNNEL / SAFE
  if (
    heading.includes('vault') ||
    heading.includes('safe') ||
    heading.includes('bank') ||
    heading.includes('tunnel') ||
    heading.includes('grid') ||
    heading.includes('heist') ||
    g.includes('heist')
  ) {
    if (ch === 1 || heading.includes('tunnel')) return '/images/scenes/heist_act1.jpg';
    if (ch === 2 || heading.includes('safe') || heading.includes('vault')) return '/images/scenes/heist_act2.jpg';
    return '/images/scenes/heist_act3.jpg';
  }

  // 3. HORROR / CRYPT / ATTIC / CEMETERY
  if (
    heading.includes('crypt') ||
    heading.includes('cemetery') ||
    heading.includes('grave') ||
    heading.includes('attic') ||
    heading.includes('corridor') ||
    heading.includes('basement') ||
    heading.includes('horror') ||
    g.includes('horror')
  ) {
    if (ch === 1 || heading.includes('cemetery')) return '/images/scenes/horror_act1.jpg';
    if (ch === 2 || heading.includes('attic')) return '/images/scenes/horror_act2.jpg';
    return '/images/scenes/horror_act3.jpg';
  }

  // 4. ROMANCE / COMEDY / BISTRO / CAFE / ROOFTOP
  if (
    heading.includes('bistro') ||
    heading.includes('cafe') ||
    heading.includes('terrace') ||
    heading.includes('restaurant') ||
    heading.includes('rooftop') ||
    heading.includes('park') ||
    heading.includes('romcom') ||
    g.includes('rom') ||
    g.includes('comedy')
  ) {
    if (ch === 1 || heading.includes('bistro')) return '/images/scenes/romcom_act1.jpg';
    if (ch === 2 || heading.includes('rooftop')) return '/images/scenes/romcom_act2.jpg';
    return '/images/scenes/romcom_act3.jpg';
  }

  // 5. DETECTIVE / NOIR / RAIN / DOCKS / ALLEY / OFFICE
  if (
    heading.includes('dock') ||
    heading.includes('harbor') ||
    heading.includes('alley') ||
    heading.includes('rain') ||
    heading.includes('office') ||
    heading.includes('interrogation') ||
    heading.includes('crime') ||
    g.includes('detective') ||
    g.includes('cyber') ||
    g.includes('noir')
  ) {
    if (ch === 1 || heading.includes('alley') || heading.includes('rain')) return '/images/scenes/detective_act1.jpg';
    if (ch === 2 || heading.includes('office') || heading.includes('interrogation')) return '/images/scenes/detective_act2.jpg';
    return '/images/scenes/detective_act3.jpg';
  }

  // 6. NOLLYWOOD / DRAMA / LUXURY MANOR / PENTHOUSE / BANQUET
  if (ch === 1 || heading.includes('hall') || heading.includes('parlour') || heading.includes('banquet')) {
    return '/images/scenes/nollywood_act1.jpg';
  }
  if (ch === 2 || heading.includes('boardroom') || heading.includes('study') || heading.includes('penthouse')) {
    return '/images/scenes/nollywood_act2.jpg';
  }
  return '/images/scenes/nollywood_act3.jpg';
}

/**
 * Generate a dynamic realistic graphic novel scene that directly
 * resolves the exact SCENE HEADING using photorealistic photography.
 * Eliminates all geometric shapes!
 */
export function generateDynamicSceneSvg(
  sceneHeading: string,
  genre: string,
  _characterBeats: CharacterActionBeat[] = [],
  _aspectRatio: '9:16' | '16:9' = '9:16',
  speakerOrChapter?: string | number,
  _line?: string,
  _direction?: string,
  _customPhotos?: Record<string, string>,
  chapterNumber?: number
): string {
  const act = typeof speakerOrChapter === 'number'
    ? speakerOrChapter
    : (typeof chapterNumber === 'number' ? chapterNumber : 1);
  return resolveRealisticSceneImage(sceneHeading, genre, act);
}

/**
 * Provide a rich default starting chapter with whole-body cast and high-stakes drama
 * so the TikTok View and Comic Stage open instantly on first click without waiting.
 */
export function getDefaultSceneSwapChapter() {
  return {
    chapter_number: 1,
    chapter_title: 'Act 1: The Disputed Will & The Blue Envelope',
    genre: 'Nollywood Drama',
    tone: 'Explosive & Theatrical',
    setting_description:
      'INT. IKOYI ROYAL PENTHOUSE - NIGHT. High-society mahogany boardroom overlooking Lagos lagoon with crystal decanters and tension thick in the humid air.',
    audio_cue:
      'A thunderous clash of distant Lagos storm clouds punctuated by the sharp click of a brass briefcase latch.',
    is_finale: false,
    cast: [
      {
        player: 'Chief Balogun',
        role: 'Ruthless Family Patriarch',
        archetype: 'Dynastic Ruler',
        motivation: 'Protect the Balogun empire from unraveling at all costs',
        nationality: 'nigerian',
      },
      {
        player: 'Folake',
        role: 'Ambitious Eldest Heir',
        archetype: 'Corporate Strategist',
        motivation: 'Claim her rightful inheritance before her siblings freeze the assets',
        nationality: 'nigerian',
      },
      {
        player: 'Barrister Dapo',
        role: 'Senior Legal Counsel',
        archetype: 'Conflicted Gatekeeper',
        motivation: 'Execute the secret codicil while staying alive',
        nationality: 'nigerian',
      },
    ],
    script_lines: [
      {
        speaker: 'Chief Balogun',
        direction: '[slams his heavy brass walking cane against the mahogany floor, glaring across the table]',
        line: 'No one leaves this penthouse until I find out who opened the blue envelope!',
      },
      {
        speaker: 'Folake',
        direction: '[strides forward holding the legal dossier, eyes ablaze with defiance]',
        line: 'Father, the bank already froze the accounts. The truth will be read tonight, whether you like it or not!',
      },
      {
        speaker: 'Barrister Dapo',
        direction: '[nervously wipes his forehead with a monogrammed handkerchief, stepping between them]',
        line: 'Please, both of you! If the press catches wind of this codicil, the entire Balogun conglomerate collapses by morning!',
      },
      {
        speaker: 'Chief Balogun',
        direction: '[points a trembling, accusatory finger at Dapo, voice dropping to a dangerous whisper]',
        line: 'You drafted that clause, Dapo. Did you sell my bloodline out to the rival syndicate in Victoria Island?',
      },
      {
        speaker: 'Folake',
        direction: '[unseals the wax stamped envelope and lays three birth certificates onto the table]',
        line: 'He did what honor demanded. Now look at the names, Father. Look at who your true heirs really are!',
      },
    ],
    plot_choices: [
      {
        id: 'A' as const,
        label: 'Burn the Blue Envelope',
        description: 'Chief Balogun hurls the dossier into the fireplace, triggering an all-out physical confrontation.',
        consequence_hint: 'Leads to armed security intervention and locked doors in Act 2.',
      },
      {
        id: 'B' as const,
        label: 'Broadcast the DNA Results Live',
        description: "Folake starts an emergency press conference livestream to force the board's hand.",
        consequence_hint: 'Public scandal sends stock into freefall with emergency board vote.',
      },
      {
        id: 'C' as const,
        label: 'Forge an Uneasy Truce',
        description: 'Barrister Dapo locks the documents inside the vault while they negotiate a secret settlement.',
        consequence_hint: 'A covert midnight rendezvous at the Lagos Yacht Club.',
      },
    ],
  };
}

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
