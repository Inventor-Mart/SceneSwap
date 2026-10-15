import { SceneSwapChapterResult, SceneSwapCastMember, SceneSwapScriptLine, SceneSwapPlotChoice } from '../App';

export interface ChapterGeneratorInputs {
  players: string[];
  genre: string;
  tone: string;
  wildcardHook?: string;
  chapterNumber: number;
  chosenChoice?: SceneSwapPlotChoice;
}

export function generateClientFallbackChapter(inputs: ChapterGeneratorInputs): SceneSwapChapterResult {
  const rawPlayers = Array.isArray(inputs.players) ? inputs.players : [];
  const cleanPlayers = rawPlayers
    .map((p: any) => (typeof p === 'string' ? p : p?.name || String(p || '')).trim())
    .filter(Boolean);

  const players = cleanPlayers.length >= 2 ? cleanPlayers : ['Amaka', 'Tunde', 'Chioma'];
  const p1 = players[0] || 'Amaka';
  const p2 = players[1] || 'Tunde';
  const p3 = players[2] || 'Chioma';
  const p4 = players[3] || 'Femi';

  const ch = Math.min(Math.max(inputs.chapterNumber || 1, 1), 3);
  const isFinale = ch === 3;
  const genre = inputs.genre || 'Nollywood Drama';
  const tone = inputs.tone || 'High Energy & Hilarious Drama';
  const hook = inputs.wildcardHook?.trim();

  // Helper for extra players
  const extraCast: SceneSwapCastMember[] = players.slice(3).map((p, i) => ({
    player: p,
    role: `Key Operative ${i + 1}`,
    archetype: 'The Catalyst',
    motivation: 'Keep the team united while watching their own back',
    secret: 'Holds the backup communication cipher',
  }));

  if (genre.includes('Sci-Fi')) {
    if (ch === 1) {
      return {
        chapter_number: 1,
        chapter_title: 'Act I: Pressure Drop',
        genre: 'Sci-Fi Survival',
        tone,
        setting_description: 'INT. SECTOR 4 AIRLOCK - ORBITAL RESEARCH STATION - RED ALERT STROBE LIGHTS',
        audio_cue: 'Deafening atmospheric decompression horn with frantic mechanical clicking.',
        cast: [
          { player: p1, role: 'Commander', archetype: 'The Stoic Veteran', motivation: 'Seal the hull before oxygen drops to zero.', secret: 'Knows the station was sabotaged from within.' },
          { player: p2, role: 'Chief Engineer', archetype: 'The Nervous Tech', motivation: 'Reroute power before reactor overload.', secret: 'Lost the master biometric key thirty minutes ago.' },
          { player: p3, role: 'Medical Officer', archetype: 'The Skeptic', motivation: 'Keep everyone from panicking.', secret: 'Discovered an unknown pathogen in the air scrubbers.' },
          ...extraCast,
        ],
        script_lines: [
          { speaker: p1, direction: '[Pounding on the emergency lockdown terminal]', line: `Hold your breath! Sector 4 seal has breached, and life support is dropping fast! ${hook ? `And explain why ${hook} is showing on my screen!` : ''}` },
          { speaker: p2, direction: '[Crawling under the conduit rack, sparks flying]', line: 'The main fuse didn\'t blow! Someone physically cut the primary backup cables with laser shears!' },
          { speaker: p3, direction: '[Checking the biometric bio-scanner with trembling fingers]', line: 'Forget the cables! The air filtration system is pumping unknown synthetic mist into the cabins!' },
          ...(players.length >= 4 ? [{ speaker: p4, direction: '[Tapping the encrypted headset]', line: 'Commander, someone just transmitted an override command from inside this exact airlock!' }] : []),
          { speaker: p1, direction: '[Turning slowly toward the squad, hand on side holster]', line: 'Nobody touches that blast door until we figure out who just locked us in.' },
          { speaker: p2, direction: '[Shaking with adrenaline while gripping a plasma torque]', line: 'Commander, we have seventy seconds before the air scrubbers fail completely!' },
          { speaker: p3, direction: '[Holding a chemical reading to the emergency lamp]', line: 'The mist is neuro-active! Whoever did this wanted us unconscious before impact!' },
          ...(players.length >= 4 ? [{ speaker: p4, direction: '[Locking eyes with the crew]', line: 'I\'m detecting an external docking clamp latching onto our outer hull right now!' }] : []),
          { speaker: p1, direction: '[Stepping firmly into the airlock center]', line: 'We stand our ground. We make our decision right now as one crew!' },
        ],
        plot_choices: [
          { id: 'A', label: 'Eject the Contaminated Module', description: 'Jettison Sector 4 into space to save the main habitat ring.', consequence_hint: 'Stops the breach, but destroys valuable emergency rations and equipment.' },
          { id: 'B', label: 'Manual Coolant Override', description: 'Dive into the radioactive sub-level to seal the reactor manually.', consequence_hint: 'Risks heavy radiation exposure, but saves the primary generators.' },
          { id: 'C', label: 'Trust the AI Protocol', description: 'Hand over full station control to the rogue mainframe AI.', consequence_hint: 'The AI locks the crew in quarantine, but stabilizes life support.' },
        ],
        is_finale: false,
      };
    }
  }

  if (genre.includes('Cyber') || genre.includes('Detective')) {
    return {
      chapter_number: ch,
      chapter_title: ch === 1 ? 'Act I: The Chrome Alley Shakedown' : ch === 2 ? 'Act II: Neural Infiltration' : 'Act III: The Megacorp Showdown',
      genre: 'Cyberpunk Detective',
      tone,
      setting_description: 'EXT. LOWER DISTRICT NEON ALLEYWAY - MIDNIGHT ACID RAIN - STEAM RISING FROM GRATES',
      audio_cue: 'Distant cybernetic sirens, deep modular bass drone, and flickering neon buzz.',
      cast: [
        { player: p1, role: 'Ex-Cop Investigator', archetype: 'The Cynical Gumshoe', motivation: 'Crack the syndicate case before the neural chip burns out.', secret: 'Hacked the police dispatch feed.' },
        { player: p2, role: 'Underground Netrunner', archetype: 'The Wired Prodigy', motivation: 'Download the encrypted biometric ledger.', secret: 'Owes five hundred thousand credits to the Kuro Syndicate.' },
        { player: p3, role: 'Street Fixer', archetype: 'The Smooth Operator', motivation: 'Broker the data to the highest corporate bidder.', secret: 'Has a tracker stitched into their leather duster.' },
        ...extraCast,
      ],
      script_lines: [
        { speaker: p1, direction: '[Flicking a holographic lighter under the brim of their fedora]', line: `The rain in this district never washes anything clean. ${hook ? `Especially not ${hook}.` : 'Especially not stolen corporate chips.'}` },
        { speaker: p2, direction: '[Jacking a glowing fiber cable into the junction box]', line: 'I\'m inside their sub-network, but we\'ve got about ninety seconds before their hunter-killer drones lock onto our neural signatures!' },
        { speaker: p3, direction: '[Glancing over both shoulders while thumbing a heavy sidearm]', line: 'Make it sixty seconds. The local street sentries just went dark, which means we\'re already surrounded!' },
        ...(players.length >= 4 ? [{ speaker: p4, direction: '[Stepping out of the steam holding an optical scanner]', line: 'Too late! The corporate extraction squad just landed on the rooftop above us!' }] : []),
        { speaker: p1, direction: '[Cocking the heavy revolver under the neon sign glow]', line: 'Nobody panics. We didn\'t come this far into the Lower Sector to fold for corporate suits.' },
        { speaker: p2, direction: '[Neural cyberdeck humming with violent static sparks]', line: 'I\'ve extracted sixty percent of the transaction keys! If I pull the jack now, my cerebral implant fries!' },
        { speaker: p3, direction: '[Kicking an iron trash dumpster over to form barricade cover]', line: 'Then keep typing, kid! Red laser sights just painted the brick wall behind your head!' },
        ...(players.length >= 4 ? [{ speaker: p4, direction: '[Deploying an EMP scrambler grenade]', line: 'I can blind their optical trackers for ten seconds! Tell me when to drop it!' }] : []),
        { speaker: p1, direction: '[Spitting into the wet gutter with a grim grin]', line: 'Choose our exit vector now, team—shoot through the front or ride the monorail!' },
      ],
      plot_choices: [
        { id: 'A', label: 'Overload the Power Grid', description: 'Trigger an EMP surge to blackout the entire alleyway.', consequence_hint: 'Blind your pursuers, but disables your netrunner\'s neural deck.' },
        { id: 'B', label: 'Sprint for the Monorail', description: 'Make a break for the moving cargo train three blocks away.', consequence_hint: 'High-speed rooftop shootout with corporate enforcers.' },
        { id: 'C', label: 'Bluff the Syndicate Fixer', description: 'Offer them fifty percent of the data to switch sides.', consequence_hint: 'A tense standoff that could make you allies or corpses.' },
      ],
      is_finale: isFinale,
      finale_summary: isFinale ? 'The team cracked the corporate mainframe and broadcast the truth across Neo-City!' : undefined,
    };
  }

  // Default Nollywood Drama & High Society Chaos
  return {
    chapter_number: ch,
    chapter_title: ch === 1 ? 'Act I: The Scandal at Banana Island' : ch === 2 ? 'Act II: The Rising Crisis' : 'Act III: The Grand Finale',
    genre: 'Nollywood Drama',
    tone,
    setting_description: 'INT. CHIEF ODUKOYA PENTHOUSE - BANANA ISLAND - MIDNIGHT RAINSTORM. Dripping in gold leaf and velvet.',
    audio_cue: 'Deep, thumping talking drums mixed with the distant, ominous howl of a Lagos thunderstorm.',
    cast: [
      { player: p1, role: "Chief's Widow", archetype: 'The Mourning Vixen', motivation: 'Securing the offshore bank account codes before the police arrive.', secret: "She is actually the Chief's long-lost secret daughter, not his wife." },
      { player: p2, role: "Chief's Prodigal Son", archetype: 'The Debt-Ridden Playboy', motivation: 'Finding the money to pay off the Lagos underworld syndicate.', secret: 'He lost the original will in a high-stakes poker game last night.' },
      { player: p3, role: 'The Head Housekeeper', archetype: 'The All-Seeing Observer', motivation: 'Exposing the family corruption to the national newspapers.', secret: 'She has been recording every conversation in the house for months.' },
      ...extraCast,
    ],
    script_lines: [
      { speaker: p1, direction: '[Dabbing tears with a silk handkerchief, eyes darting to the safe]', line: `The Chief is barely cold, and already the vultures are circling his mahogany desk! ${hook ? `And what about ${hook}?!` : ''}` },
      { speaker: p2, direction: '[Slamming his fist against the liquor cabinet, trembling]', line: 'Don\'t you dare talk to me about vultures, Amaka! I am the blood heir, and I need what belongs to me!' },
      { speaker: p3, direction: '[Slowly polishing a silver tray, voice dripping with icy sarcasm]', line: 'Blood heir? My dear Tunde, the only thing you\'ve inherited is your father\'s taste for ruin.' },
      { speaker: p1, direction: '[Spinning around with fire in her eyes, pointing a manicured finger]', line: 'Chioma, stay in your place! You are a servant, not a member of this household!' },
      { speaker: p3, direction: '[Stopping her polishing, revealing a hidden digital recorder]', line: 'I see everything, Madam. Perhaps the inspector would like to hear what happened in this room at midnight?' },
      { speaker: p2, direction: '[Turning pale, eyes widening as he realizes the threat]', line: 'Wait... if you have a recording, then you know about the poker game!' },
      ...(players.length >= 4 ? [{ speaker: p4, direction: '[Stepping in through the storm doors holding a wet umbrella]', line: 'Nobody moves! The gate security just let in three black Mercedes SUVs without license plates!' }] : []),
      { speaker: p1, direction: '[Rushing to the window and pulling back the gold velvet drape]', line: 'Police sirens?! Tunde, did you bring creditors to our father\'s mansion?!' },
      { speaker: p2, direction: '[Frantically searching the secret panel behind the oil portrait]', line: 'I didn\'t call them! The key code has been changed! Someone cleaned out the bearer bonds!' },
      { speaker: p3, direction: '[Holding a brass key between two polished fingers with a faint smirk]', line: 'Looking for this, master Tunde? In this house, the walls don\'t just have ears—they have attorneys.' },
      { speaker: p1, direction: '[Clutching her chest with royal theatrical gasps]', line: 'Blood of Jesus! Chioma, hand over that key before thunder strikes you where you stand!' },
    ],
    plot_choices: [
      { id: 'A', label: 'The Bribe', description: "Attempt to buy Chioma's silence with the remaining household gold.", consequence_hint: 'Chioma takes the gold, but records the bribery attempt too.' },
      { id: 'B', label: 'The Confrontation', description: 'Seize the recorder from Chioma before she can leave the room.', consequence_hint: 'A physical struggle ensues that reveals the secret identity of the Widow.' },
      { id: 'C', label: 'The Alliance', description: 'Amaka and Tunde team up to frame Chioma for the Chief\'s death.', consequence_hint: 'The police sirens blare outside; someone is going to prison tonight.' },
    ],
    is_finale: isFinale,
    finale_summary: isFinale ? 'The family secrets exploded across the nation as the ultimate mastermind walked away with everything!' : undefined,
  };
}
