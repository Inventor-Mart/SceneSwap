export interface SceneSwapChapterInputs {
  players: string[];
  genre: string;
  tone: string;
  wildcardHook?: string;
  chapterNumber?: number;
  chosenChoice?: { id: 'A' | 'B' | 'C'; label: string; description: string };
  priorChaptersSummary?: Array<{ chapterNumber: number; title: string; chosenChoiceLabel?: string }>;
}

export interface SceneSwapChapterResult {
  chapter_number: number;
  chapter_title: string;
  genre: string;
  tone: string;
  setting_description: string;
  audio_cue: string;
  cast: { player: string; role: string; archetype: string; motivation: string; secret?: string }[];
  script_lines: { speaker: string; direction?: string; line: string }[];
  plot_choices: { id: 'A' | 'B' | 'C'; label: string; description: string; consequence_hint: string }[];
  is_finale: boolean;
  finale_summary?: string;
}

export function getClientFallbackChapter(inputs: SceneSwapChapterInputs): SceneSwapChapterResult {
  const players = (inputs.players || []).map((p) => p.trim()).filter(Boolean);
  const p1 = players[0] || 'Amaka';
  const p2 = players[1] || 'Tunde';
  const p3 = players[2] || 'Chioma';
  const p4 = players[3] || 'Femi';
  const p5 = players[4] || 'Segun';

  const ch = Math.min(Math.max(inputs.chapterNumber || 1, 1), 3);
  const isFinale = ch === 3;
  const genre = inputs.genre || 'Nollywood Drama';
  const tone = inputs.tone || 'High Energy & Hilarious Drama';
  const hook = inputs.wildcardHook?.trim();

  // 1. Sci-Fi Survival
  if (genre.includes('Sci-Fi')) {
    if (ch === 1) {
      return {
        chapter_number: 1,
        chapter_title: 'Act I: Pressure Drop',
        genre,
        tone,
        setting_description: 'INT. SECTOR 4 AIRLOCK - ORBITAL RESEARCH STATION - RED ALERT STROBE LIGHTS',
        audio_cue: 'Deafening atmospheric decompression horn with frantic mechanical clicking.',
        cast: [
          { player: p1, role: 'Commander', archetype: 'The Stoic Veteran', motivation: 'Seal the hull before oxygen drops to zero.', secret: 'Knows the station was sabotaged from within.' },
          { player: p2, role: 'Chief Engineer', archetype: 'The Nervous Tech', motivation: 'Reroute power before reactor overload.', secret: 'Lost the master biometric key thirty minutes ago.' },
          { player: p3, role: 'Medical Officer', archetype: 'The Skeptic', motivation: 'Keep everyone from hyperventilating.', secret: 'Discovered an unknown synthetic mist in the air scrubbers.' },
          ...(players.length >= 4 ? [{ player: p4, role: 'Communications Officer', archetype: 'The Renegade', motivation: 'Broadcast distress beacon.', secret: 'Intercepted a classified bounty order.' }] : []),
          ...(players.length >= 5 ? [{ player: p5, role: 'Mission Specialist', archetype: 'The Wildcard', motivation: 'Guard the sealed cargo container.', secret: 'Never opened the container.' }] : []),
        ],
        script_lines: [
          { speaker: p1, direction: '[Pounding on the emergency lockdown terminal as warning sirens wail]', line: `Hold your breath! Sector 4 seal has breached, and oxygen is dropping fast! ${hook ? `And look: ${hook}` : ''}` },
          { speaker: p2, direction: '[Crawling under glowing conduit rack, sparks bouncing off helmet]', line: 'The main fuse didn\'t blow! Someone physically cut the primary backup cables with laser shears!' },
          { speaker: p3, direction: '[Checking the biometric bio-scanner with trembling fingers]', line: 'Forget the cables! The air filtration system is pumping unknown synthetic mist into the cabins!' },
          ...(players.length >= 4 ? [{ speaker: p4, direction: '[Tapping encrypted headset with wide eyes]', line: 'Commander, someone just transmitted an override command from inside this exact airlock!' }] : []),
          ...(players.length >= 5 ? [{ speaker: p5, direction: '[Clutching the metallic cargo container]', line: 'Whatever is in this canister just tapped on the glass from the inside!' }] : []),
          { speaker: p1, direction: '[Turning slowly toward the squad, hand resting near side holster]', line: 'Nobody touches that blast door until we figure out who just locked us in.' },
          { speaker: p2, direction: '[Wiping hydraulic oil from helmet visor]', line: 'The oxygen clock is ticking! In eighty seconds, cabin pressure will drop to zero!' },
          { speaker: p3, direction: '[Analyzing the biological residue on the airlock seal]', line: 'This isn\'t an accident—it\'s an orchestrated extraction protocol!' },
          ...(players.length >= 4 ? [{ speaker: p4, direction: '[Decrypting distress transponder data]', line: 'I\'ve traced the external signal! There is an unmarked stealth ship parked in our radar blindspot!' }] : []),
          { speaker: p1, direction: '[Locking eyes with each member of the crew]', line: 'Prepare for decompression or prepare to fight. Choose our path right now!' },
        ],
        plot_choices: [
          { id: 'A', label: 'Option A: Manual Airlock Venting', description: 'Purge the toxic mist into deep space, risking complete atmospheric collapse.', consequence_hint: 'Saves them from poison, but leaves only 2 minutes of reserve oxygen!' },
          { id: 'B', label: 'Option B: Confront the Saboteur', description: 'Demand everyone reveal their personal logs before unlocking the security hatch.', consequence_hint: 'Mutiny could erupt, but the traitor will be exposed immediately!' },
          { id: 'C', label: 'Option C: Reroute to Auxiliary Core', description: 'Crawl through the radiation-shielded maintenance tunnel to reach bridge controls.', consequence_hint: 'Extremely dangerous crawl, but unlocks station surveillance cameras!' },
        ],
        is_finale: false,
      };
    } else if (ch === 2) {
      return {
        chapter_number: 2,
        chapter_title: 'Act II: Containment Protocol',
        genre,
        tone,
        setting_description: 'INT. AUXILIARY POWER JUNCTION - ZERO GRAVITY TUNNEL - SPARKS & SMOKE',
        audio_cue: 'Heavy magnetic boot clangs echo against cold titanium bulkheads.',
        cast: [
          { player: p1, role: 'Commander', archetype: 'The Stoic Veteran', motivation: 'Prevent total blowout.', secret: 'Battery charge at 12%.' },
          { player: p2, role: 'Chief Engineer', archetype: 'The Pragmatist', motivation: 'Restore gravity stabilizers.', secret: 'Bypassed three safety interlocks.' },
          { player: p3, role: 'Medical Officer', archetype: 'The Truth-Seeker', motivation: 'Contain biological contamination.', secret: 'Has an antidote vial.' },
          ...(players.length >= 4 ? [{ player: p4, role: 'Comms Officer', archetype: 'The Wildcard', motivation: 'Signal rescue frigate.', secret: 'Signal might ping pirate vessels.' }] : []),
          ...(players.length >= 5 ? [{ player: p5, role: 'Specialist', archetype: 'The Survivor', motivation: 'Guard the reactor.', secret: 'Holding the last flare.' }] : []),
        ],
        script_lines: [
          { speaker: p2, direction: '[Floating in zero-G, wrestling with charred copper busbar]', line: 'I rerouted the secondary junction! We have three minutes of emergency gravity, that is all!' },
          { speaker: p1, direction: '[Grabbing safety railing as boots clamp to the metal deck]', line: 'Gravity is back, but look at the pressure monitors. The escape pods are ejecting empty!' },
          { speaker: p3, direction: '[Holding up glowing cyan canister found inside the wall panel]', line: 'Someone wanted us trapped while they stole the Genesis sample! Look at this seal!' },
          ...(players.length >= 4 ? [{ speaker: p4, direction: '[Frantically scanning telemetry]', line: 'A stealth shuttle just decoupled from the exterior hull! They are leaving us behind!' }] : []),
          ...(players.length >= 5 ? [{ speaker: p5, direction: '[Priming plasma torch]', line: 'Then we weld ourselves into their docking bay before they make the jump!' }] : []),
          { speaker: p1, direction: '[Eyes hardening behind the illuminated visor glass]', line: 'We are not dying in orbit today. We take control of the orbital rail cannon.' },
          { speaker: p2, direction: '[Adjusting the targeting relays with smoking gloves]', line: 'Capacitors at eighty percent! One direct hit will punch through their hyperdrive shield!' },
          { speaker: p3, direction: '[Checking the sample stability monitor]', line: 'Be careful! If their core explodes, the orbital radiation will wash over our bridge!' },
          ...(players.length >= 4 ? [{ speaker: p4, direction: '[Locking crosshairs on the escaping shuttle]', line: 'Target solution locked in three... two... one!' }] : []),
          { speaker: p1, direction: '[Grasping the manual fire lever]', line: 'Stand by for station shudder! We take our future back!' },
        ],
        plot_choices: [
          { id: 'A', label: 'Option A: Fire the Rail Cannon', description: 'Disable the fleeing shuttle\'s thrusters to force them back.', consequence_hint: 'Could detonate the entire docking ring!' },
          { id: 'B', label: 'Option B: Overload the Reactor Core', description: 'Create an electromagnetic pulse that paralyzes all local ships including the shuttle.', consequence_hint: 'High risk of total darkness and hypothermia!' },
          { id: 'C', label: 'Option C: Space Walk Boarding', description: 'Leap across open vacuum to intercept the shuttle docking hatch manually.', consequence_hint: 'Wildly heroic stunt with fifty-fifty survival odds!' },
        ],
        is_finale: false,
      };
    } else {
      return {
        chapter_number: 3,
        chapter_title: 'Act III: The Genesis Gambit (Grand Finale)',
        genre,
        tone,
        setting_description: 'INT. COMMAND BRIDGE - EARTH LOOMING MAJESTICALLY IN THE BACKGROUND - SUNBURST HORIZON',
        audio_cue: 'Triumphant electronic brass crescendo accompanied by steady heartbeat monitor.',
        cast: [
          { player: p1, role: 'Commander', archetype: 'The Legend', motivation: 'Save Earth and the crew.', secret: 'Vindicated.' },
          { player: p2, role: 'Chief Engineer', archetype: 'The Heroic Genius', motivation: 'Celebrated survivor.', secret: 'Fixed the impossible.' },
          { player: p3, role: 'Medical Officer', archetype: 'Guardian', motivation: 'Secured the cure.', secret: 'Saved humanity.' },
          ...(players.length >= 4 ? [{ player: p4, role: 'Comms Master', archetype: 'The Ace', motivation: 'Broadcasting victory.', secret: 'Worldwide broadcast.' }] : []),
          ...(players.length >= 5 ? [{ player: p5, role: 'Specialist', archetype: 'The Victor', motivation: 'Stand triumphant.', secret: 'Promoted to captain.' }] : []),
        ],
        script_lines: [
          { speaker: p1, direction: '[Slamming master command beacon into console socket with authority]', line: 'Target locked. Shuttles neutralized, life support restored to one hundred percent!' },
          { speaker: p2, direction: '[Collapsing into pilot chair with an ecstatic sigh of relief]', line: 'I never doubted my wiring for a single second! Okay... maybe for two seconds.' },
          { speaker: p3, direction: '[Holding intact medical vial up to sunlight pouring through canopy]', line: 'The sample is safe. Earth will have the cure before morning.' },
          ...(players.length >= 4 ? [{ speaker: p4, direction: '[Throwing both hands in the air cheering]', line: 'Earth Command is responding on all frequencies! They are naming an entire fleet after us!' }] : []),
          ...(players.length >= 5 ? [{ speaker: p5, direction: '[Saluting with broad smile]', line: 'Next time someone asks for space volunteers, I am requesting double hazard pay!' }] : []),
          { speaker: p1, direction: '[Looking out into sunrise with an unforgettable smirk]', line: 'Cut the alarms. Someone pour a victory ration. We just saved the world.' },
          { speaker: p2, direction: '[Clinking emergency rations with the team]', line: 'Here is to the finest crew in the quadrant!' },
          { speaker: p3, direction: '[Looking down at Earth glowing blue beneath the orbital vista]', line: 'Home never looked so beautiful.' },
        ],
        plot_choices: [],
        is_finale: true,
        finale_summary: 'Against impossible orbital odds, the crew thwarted the sabotage, retrieved the vital Genesis sample, and steered Station 9 into triumphant stabilization as heroes of the Sol System.',
      };
    }
  }

  // 2. Nollywood Drama (Default)
  if (ch === 1) {
    return {
      chapter_number: 1,
      chapter_title: 'Act I: The Reading of the Will',
      genre,
      tone,
      setting_description: "INT. CHIEF BALOGUN'S BANQUET PARLOUR - IKOYI - HEAVY MAHOGANY FURNITURE & GOLD CHANDELIER",
      audio_cue: 'Dramatic Nollywood high-suspense synthetic piano strike followed by distant thunder rumble.',
      cast: [
        { player: p1, role: 'Chief Mrs. Florence', archetype: 'The Fierce Matriarch', motivation: 'Retain total control over the Balogun shipping empire.', secret: "Has the original lawyer's testament locked in her handbag." },
        { player: p2, role: 'Dapo Balogun', archetype: 'The Ambitious London Returnee', motivation: 'Seize the family conglomerate before creditors call.', secret: 'Owes thirty million naira in overseas debts.' },
        { player: p3, role: 'Barrister Kemi', archetype: 'The Unbribable Attorney', motivation: "Read the unadulterated truth of Chief's final wishes.", secret: 'Was offered a blank check this morning to alter page four.' },
        ...(players.length >= 4 ? [{ player: p4, role: 'Uncle Segun', archetype: 'The Suspicious Elder', motivation: 'Claim ancestral family land in Ibadan.', secret: 'Arrived with two fake witnesses in the gatehouse.' }] : []),
        ...(players.length >= 5 ? [{ player: p5, role: 'Bimbo the Heiress', archetype: 'The Wildcard Sibling', motivation: 'Expose the family secrets to social media.', secret: 'Livestreaming with phone hidden in flower vase.' }] : []),
      ],
      script_lines: [
        { speaker: p1, direction: '[Slowly adjusting her towering golden gélé with regal, terrifying calm]', line: `Look at me very well, ${p2}. Do you think sixty years of sweat and empire was built for you to gamble away? ${hook ? `Especially when ${hook}` : ''}` },
        { speaker: p2, direction: '[Slamming an Italian leather briefcase onto the mahogany glass table]', line: 'Mama, times have changed! The London board recognized my signature as sole managing director yesterday!' },
        { speaker: p3, direction: '[Clearing throat loudly and breaking the red wax seal on a thick blue envelope]', line: 'Excuse me, everyone! Before anyone signs any checks, Chief Balogun recorded a video testament with me yesterday.' },
        ...(players.length >= 4 ? [{ speaker: p4, direction: '[Spitting out kola nut and pointing his walking stick aggressively]', line: 'Video what?! In this culture, a dead man cannot speak through a television set!' }] : []),
        ...(players.length >= 5 ? [{ speaker: p5, direction: '[Pretending to powder nose while adjusting hidden phone camera]', line: 'Let the man speak, Uncle Segun! Some of us have eighty thousand followers waiting for the truth!' }] : []),
        { speaker: p1, direction: '[Eyes narrowing with ice-cold venom as she turns to the lawyer]', line: 'Barrister Kemi... if you value your license and your car parked outside, choose your next words very carefully.' },
        { speaker: p2, direction: '[Stepping between Mama and the lawyer, arms spread wide]', line: 'Let her read it, Mama! Unless you already know what Chief wrote about the Swiss accounts!' },
        { speaker: p3, direction: '[Pulling the notarized deed from the envelope with steady hands]', line: 'Clause four states explicitly: whoever attempts to hide this document forfeits all rights to the Balogun estate.' },
        ...(players.length >= 4 ? [{ speaker: p4, direction: '[Gasping and clutching his prayer beads]', line: 'Ewooo! May the ancestors forbid such calamity in Ikoyi!' }] : []),
        { speaker: p1, direction: '[Sitting upright like an empress preparing for battle]', line: 'Nobody leaves this parlour until every signature is verified by the high court.' },
      ],
      plot_choices: [
        { id: 'A', label: 'Option A: Play the Secret Video', description: "Insert the flash drive into the 85-inch television to reveal Chief's dying confession.", consequence_hint: "Will expose Dapo's secret debt, but might disinherit everyone!" },
        { id: 'B', label: "Option B: Florence's Power Play", description: 'Chief Mrs. Florence orders the bodyguards to confiscate the envelope immediately.', consequence_hint: 'Will trigger an all-out shouting match and flying champagne glasses!' },
        { id: 'C', label: 'Option C: The Mysterious Stranger Knocks', description: "A loud bang at the ornate front double doors reveals an uninvited guest claiming to be Chief's first-born.", consequence_hint: 'Complete pandemonium in Ikoyi!' },
      ],
      is_finale: false,
    };
  } else if (ch === 2) {
    return {
      chapter_number: 2,
      chapter_title: 'Act II: Bloodline & Betrayal',
      genre,
      tone,
      setting_description: 'INT. PRIVATE STUDY - THE BALOGUN MANSION - DRAMATIC LIGHTNING FLASHES THROUGH RAIN WINDOWS',
      audio_cue: 'Furious talking drums syncopated with high-pitched suspense string trills.',
      cast: [
        { player: p1, role: 'Chief Mrs. Florence', archetype: 'The Untouchable Matriarch', motivation: 'Crush the rebellion.', secret: 'Already hired new forensic accountants.' },
        { player: p2, role: 'Dapo Balogun', archetype: 'The Cornered Heir', motivation: 'Find the real vault key.', secret: 'Sweating profusely.' },
        { player: p3, role: 'Barrister Kemi', archetype: 'The Whistleblower', motivation: 'Protect the truth.', secret: 'Wearing a hidden wire.' },
        ...(players.length >= 4 ? [{ player: p4, role: 'Uncle Segun', archetype: 'The Opportunist', motivation: 'Switch allegiances.', secret: 'Stole the deed from the study.' }] : []),
        ...(players.length >= 5 ? [{ player: p5, role: 'Bimbo the Heiress', archetype: 'The Reporter', motivation: 'Record the confrontation.', secret: 'Trending number one in Lagos.' }] : []),
      ],
      script_lines: [
        { speaker: p2, direction: '[Pacing frantically, loosening silk tie as thunder claps]', line: 'The bank accounts are frozen! Every single one! Mama, did you instruct the Central Bank?!' },
        { speaker: p1, direction: '[Sipping hot hibiscus tea from a porcelain teacup with total serenity]', line: 'God gives, and Mama takes away. You thought you were playing chess with small boys in London?' },
        { speaker: p3, direction: '[Unrolling a stamped deed with government seal in front of them]', line: 'The accounts weren\'t frozen by Mama! The anti-fraud commission traced a twenty billion transfer initiated from this IP address!' },
        ...(players.length >= 4 ? [{ speaker: p4, direction: '[Sneaking toward the garden exit with a bulging briefcase]', line: 'Family matter is good, but when police sirens enter the compound, elder must take evening stroll!' }] : []),
        ...(players.length >= 5 ? [{ speaker: p5, direction: '[Holding up phone reading comments aloud with glee]', line: 'Too late, Uncle Segun! Twitter already geo-located your wristwatch in the bank vault!' }] : []),
        { speaker: p2, direction: '[Grabbing the edge of the desk, staring in sheer terror]', line: 'Wait... someone set me up! The password was only known by one other person in this room!' },
        { speaker: p1, direction: '[Setting down tea cup with thunderous dignity]', line: 'Did you think your mother was blind to your overseas gambling debts, Dapo?' },
        { speaker: p3, direction: '[Presenting the verified security audit printout]', line: 'The transaction logs reveal two distinct IP addresses... Mama\'s study, and Segun\'s penthouse suite.' },
        ...(players.length >= 4 ? [{ speaker: p4, direction: '[Freezing by the mahogany door with sweat pouring down collar]', line: 'It was an investment consultation! Purely traditional financial advice!' }] : []),
        { speaker: p1, direction: '[Standing tall, pointing imperiously toward the chairs]', line: 'Sit down, all of you. You will confess everything before dawn!' },
      ],
      plot_choices: [
        { id: 'A', label: 'Option A: Unmask the Real Mole', description: 'Check the study CCTV footage on the iPad to catch the real culprit red-handed.', consequence_hint: 'Guaranteed jaw-dropping reveal of who transferred the billions!' },
        { id: 'B', label: 'Option B: The Dramatic Collapse', description: 'Dapo feigns sudden medical distress to buy time while his driver sneaks into the vault.', consequence_hint: 'Pure theatrical drama with ambulance sirens!' },
        { id: 'C', label: 'Option C: Call the Elder Council', description: 'Summon the royal elders to adjudicate the dispute with customary oath-taking.', consequence_hint: 'Swearing before the ancestral staff of truth!' },
      ],
      is_finale: false,
    };
  } else {
    return {
      chapter_number: 3,
      chapter_title: 'Act III: The Coronation of Truth (Grand Finale)',
      genre,
      tone,
      setting_description: 'INT. THE GRAND BALLROOM - EKO HOTEL GALA - FLASHBULBS POPPING & ROYAL TRUMPETS SOUNDING',
      audio_cue: 'Joyous highlife music erupts with celebratory brass and traditional cheering.',
      cast: [
        { player: p1, role: 'Chief Mrs. Florence', archetype: 'The Undisputed Empress', motivation: 'Rule the empire in peace.', secret: 'Finally smiling.' },
        { player: p2, role: 'Dapo Balogun', archetype: 'The Reformed Heir', motivation: 'Accept humble redemption.', secret: 'Promised to work from ground floor up.' },
        { player: p3, role: 'Barrister Kemi', archetype: 'Senior Advocate of Nigeria', motivation: 'Justice delivered.', secret: 'Awarded master retainership.' },
        ...(players.length >= 4 ? [{ player: p4, role: 'Uncle Segun', archetype: 'The Subdued Elder', motivation: 'Content with small allowance.', secret: 'Sitting quietly.' }] : []),
        ...(players.length >= 5 ? [{ player: p5, role: 'Bimbo the Heiress', archetype: 'Media Mogul', motivation: 'Launch family podcast.', secret: 'Signed multi-million streaming deal.' }] : []),
      ],
      script_lines: [
        { speaker: p1, direction: '[Raising golden champagne glass under glittering chandeliers]', line: 'To the Balogun family! The storm came, the wind blew, but the rock of Victoria Island did not shake!' },
        { speaker: p2, direction: '[Clinking glass with a humble, relieved bow]', line: 'I have learned my lesson, Mama. No more London hedge funds. From tomorrow, I manage the Apapa docks.' },
        { speaker: p3, direction: '[Holding up the notarized constitution signed by all parties]', line: 'All assets restored, all debts settled, and Chief\'s charity foundation is endowed forever!' },
        ...(players.length >= 4 ? [{ speaker: p4, direction: '[Dancing with walking stick to highlife drums]', line: 'Music is sweet! As long as my monthly allowance lands on the 25th, I have no problem!' }] : []),
        ...(players.length >= 5 ? [{ speaker: p5, direction: '[Selfie stick high in the air panning the whole ballroom]', line: 'And that, my beloved subscribers, is how you save a Nigerian empire! Cut and print!' }] : []),
        { speaker: p1, direction: '[Flashing royal smile directly into camera with ultimate authority]', line: 'Tell the DJ to turn the volume to maximum. Tonight, we celebrate!' },
        { speaker: p2, direction: '[Laughing heartily as family members join the dance circle]', line: 'Long live the Balogun empire! Long live Mama!' },
        { speaker: p3, direction: '[Raising her glass with a joyful smile]', line: 'To justice, to truth, and to the power of family!' },
      ],
      plot_choices: [],
      is_finale: true,
      finale_summary: 'Through thunderous drama, courtroom revelations, and royal confrontation, the Balogun dynasty purged the deceit and reunited in triumphant luxury under Chief Mrs. Florence.',
    };
  }
}
