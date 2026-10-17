import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";
import { generateDynamicSceneSvg } from "../utils/characterConsistency.ts";
import { getSmartSceneBackdrop } from "../utils/sceneVisualEngine.ts";

function getGeminiClient(): GoogleGenAI | null {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim().length < 5) return null;
  return new GoogleGenAI({
    apiKey: apiKey.trim(),
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}


export interface SceneSwapResult {
  title: string;
  genre: string;
  logline: string;
  setting: string;
  cast: { player: string; role: string; archetype: string; motivation: string }[];
  script: { speaker: string; stageDirection?: string; line: string }[];
  directorsNote: string;
}

export interface SceneSwapCastMember {
  player: string;
  role: string;
  archetype: string;
  motivation: string;
  secret?: string;
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
  setting_description: string;
  audio_cue: string;
  cast: SceneSwapCastMember[];
  script_lines: SceneSwapScriptLine[];
  plot_choices: SceneSwapPlotChoice[];
  is_finale: boolean;
  finale_summary?: string;
}

export interface SceneSwapChapterInputs {
  players: string[];
  genre: string;
  tone?: string;
  wildcardHook?: string;
  chapterNumber: number;
  chosenChoice?: {
    id: string;
    label: string;
    description: string;
  };
  priorChaptersSummary?: Array<{
    chapterNumber: number;
    title: string;
    chosenChoiceLabel?: string;
  }>;
}

export async function generateSceneSwap(inputs: {
  playerNames: string;
  genre: string;
}): Promise<SceneSwapResult> {
  const ai = getGeminiClient();

  if (!ai) {
    return getFallbackSceneSwap(inputs);
  }

  try {
    const prompt = `You are the SceneSwap AI in Midnight Studio.
Cast the given players into a living, dynamic screenplay scene in the genre "${inputs.genre}".
Cast of Players: ${inputs.playerNames || "Amaka, Tunde, Chioma"}

Create an extended, gripping, high-tension 10 to 14 line scene matching "${inputs.genre}".
Each player must have 3-4 sharp lines with expressive stage directions and rapid back-and-forth dialogue.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        systemInstruction: "You are a master screenwriter. Return ONLY a valid JSON object matching the requested schema.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            genre: { type: Type.STRING },
            logline: { type: Type.STRING },
            setting: { type: Type.STRING },
            cast: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  player: { type: Type.STRING },
                  role: { type: Type.STRING },
                  archetype: { type: Type.STRING },
                  motivation: { type: Type.STRING },
                },
                required: ["player", "role", "archetype", "motivation"],
              },
            },
            script: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  speaker: { type: Type.STRING },
                  stageDirection: { type: Type.STRING },
                  line: { type: Type.STRING },
                },
                required: ["speaker", "line"],
              },
            },
            directorsNote: { type: Type.STRING },
          },
          required: ["title", "genre", "logline", "setting", "cast", "script", "directorsNote"],
        },
      },
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text) as SceneSwapResult;
    }
    return getFallbackSceneSwap(inputs);
  } catch (error) {
    console.error("Gemini SceneSwap generation error:", error);
    return getFallbackSceneSwap(inputs);
  }
}


function getFallbackSceneSwap(inputs: { playerNames: string; genre: string }): SceneSwapResult {
  const players = inputs.playerNames
    .split(/[,&]+/)
    .map((n) => n.trim())
    .filter(Boolean);
  const player1 = players[0] || "Amaka";
  const player2 = players[1] || "Tunde";
  const player3 = players[2] || "Chioma";

  if (inputs.genre === "Sci-Fi Survival") {
    return {
      title: "Oxygen Zero: Orbital Lockdown",
      genre: "Sci-Fi Survival",
      logline: "When life support fails aboard Station 9, three crew members discover the override key only has one remaining charge.",
      setting: "INT. SECTOR 4 AIRLOCK - DEEP ORBIT - ZERO GRAVITY",
      cast: [
        { player: player1, role: "Commander Alex", archetype: "The Stoic Leader", motivation: "Keep the crew alive at all costs." },
        { player: player2, role: "Chief Engineer Ray", archetype: "The Pragmatist", motivation: "Bypass the failing cooling grid before containment breaches." },
        { player: player3, role: "Specialist Maya", archetype: "The Codebreaker", motivation: "Uncover why the distress beacon was manually cut." },
      ],
      script: [
        { speaker: player1, stageDirection: "adjusting visor as warning lights strobe crimson", line: "Oxygen reserves are down to six minutes. Report!" },
        { speaker: player2, stageDirection: "sparks flying from the manual override relay", line: "The conduit fried. Someone rerouted the main conduit from the bridge." },
        { speaker: player3, stageDirection: "staring intently at the encrypted terminal display", line: "It wasn't a malfunction, Commander. The seal was locked from the outside." },
        { speaker: player1, stageDirection: "voice dropping to a cold, steady whisper", line: "Then we don't fix the ship. We find out who locked us in here." },
      ],
      directorsNote: "Keep the camera tight on reflections in the helmets. Sound design should emphasize breathing and metal creaks.",
    };
  }

  return {
    title: "The Will of Victoria Island",
    genre: "Nollywood Drama",
    logline: "A family dynasty teeters on the brink as long-buried secrets surface during the reading of Chief Balogun's final testament.",
    setting: "INT. BALOGUN BANQUET HALL - VICTORIA ISLAND - EVENING",
    cast: [
      { player: player1, role: "Chief Mrs. Florence", archetype: "The Fierce Matriarch", motivation: "Protect the Balogun empire from pretenders." },
      { player: player2, role: "Dapo Balogun", archetype: "The Ambitious Heir", motivation: "Take rightful control of the conglomerate." },
      { player: player3, role: "Dr. Kemi", archetype: "The Inconvenient Truth", motivation: "Reveal the truth of the missing foundation funds." },
    ],
    script: [
      { speaker: player1, stageDirection: "adjusting her royal gélé with slow, deliberate authority", line: "Look at me very well, Dapo. Do you think this empire was built on excuses and empty signatures?" },
      { speaker: player2, stageDirection: "standing up, slamming the leather document binder on the mahogany table", line: "Mama, times have changed! The board voted this morning, and the shares are signed to my name!" },
      { speaker: player3, stageDirection: "stepping forward from the doorway holding a sealed blue envelope", line: "Not those shares, Dapo. Before Papa closed his eyes, he gave me this deed. You might want to sit down." },
      { speaker: player1, stageDirection: "a knowing smile curling at the corner of her lips", line: "I told you, my son. In this house, walls have ears, and bank accounts have memories." },
    ],
    directorsNote: "Dramatic crash-zoom on Dapo's face as the blue envelope drops. Swelling strings with suspenseful African percussions.",
  };
}

export async function generateSceneSwapChapter(inputs: SceneSwapChapterInputs): Promise<SceneSwapChapterResult> {
  const cleanPlayers = (Array.isArray(inputs.players) ? inputs.players : [])
    .map((p: any) => (typeof p === 'string' ? p : p?.name || String(p || '')).trim())
    .filter((p) => p.length > 0 && p.length <= 24);
  const playerList = cleanPlayers.length >= 2 ? cleanPlayers : ["Amaka", "Tunde", "Chioma"];
  const chapterNumber = Math.min(Math.max(inputs.chapterNumber || 1, 1), 3);
  const isFinale = chapterNumber === 3;
  const genre = String(inputs.genre || "Nollywood Drama");
  const tone = String(inputs.tone || "High Energy & Hilarious Drama");
  const wildcardHook = typeof inputs.wildcardHook === 'string' ? inputs.wildcardHook.trim() : '';

  const ai = getGeminiClient();
  if (!ai) {
    return getFallbackSceneSwapChapter({ ...inputs, players: playerList, chapterNumber });
  }

  try {
    let actContext = "";
    if (chapterNumber === 1) {
      actContext = `ACT I: THE INCITING INCIDENT & FIRST TWIST.
The scene must establish the high-tension scenario, reveal the dynamic between the cast, and end on a critical decision point where a secret or dilemma is exposed.
${wildcardHook ? `Wildcard Hook to weave into the scene: "${wildcardHook}"` : ""}`;
    } else if (chapterNumber === 2) {
      actContext = `ACT II: THE CRISIS & ESCALATION.
In the previous chapter, the group chose: "${inputs.chosenChoice?.label || 'Option A'}: ${inputs.chosenChoice?.description || 'Escalate the situation'}".
Now the consequences explode! The stakes are raised, an unexpected complication arises, and they are forced into an even crazier dilemma.`;
    } else {
      actContext = `ACT III: THE GRAND FINALE & RESOLUTION.
In the previous chapter, the group chose: "${inputs.chosenChoice?.label || 'Option A'}: ${inputs.chosenChoice?.description || 'The Final Gambit'}".
This is the climax! Deliver the explosive, dramatic or comedic culmination of this story. All players get unforgettable punchy final lines.`;
    }

    const prompt = `You are the SceneSwap Director (Interactive Multi-Branch Party Script Engine) in Midnight Studio.
Genre: "${genre}"
Tone: "${tone}"
Current Chapter: Chapter ${chapterNumber} of 3 (${actContext})
Cast of Real-Life Party Players: ${playerList.join(", ")}

STRICT SCREENPLAY RULES:
1. Every player in ${JSON.stringify(playerList)} MUST be cast as a distinct character with their exact player name, character role, archetype, motivation, and a quirky/dramatic secret.
2. Provide a vivid, atmospheric setting_description (e.g. "INT. CHIEF ODUKOYA'S PENTHOUSE - BANANA ISLAND - MIDNIGHT RAINSTORM").
3. Provide an evocative audio_cue (sound effects, musical tension, talking drums, or synthwave stabs).
4. Create 14 to 20 script_lines. Make this a substantial, extended scene with genuine narrative arc, rising suspense, dramatic twists, witty retorts, and heated confrontation beats. Every single player MUST have at least 3 to 4 spoken lines with realistic back-and-forth exchanges. Each line must include the exact player name as 'speaker', an evocative acting direction in brackets as 'direction' (e.g. "[Gasping, clutching their chest with royal disbelief]"), and natural, punchy, dramatic 'line' matching "${genre}".
5. Plot Choices:
   ${
     isFinale
       ? "Because this is Chapter 3 (The Grand Finale), is_finale must be true. plot_choices should be empty array []. Provide a memorable, dramatic 2-3 sentence 'finale_summary' wrapping up the story and declaring the winner or ultimate aftermath."
       : "Because this is Chapter " +
         chapterNumber +
         ", provide exactly 3 distinct, compelling branching plot choices (Option A, Option B, Option C) for the party to vote on. Each choice must have id ('A', 'B', 'C'), label (punchy title), description (what action happens next), and consequence_hint (a juicy teaser of what might happen). Set is_finale to false."
   }`;

    const apiCallPromise = ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        systemInstruction:
          "You are the SceneSwap AI Director. Generate dynamic, funny, gripping branching screenplays for live party groups. Return ONLY valid JSON matching the schema.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            chapter_number: { type: Type.INTEGER },
            chapter_title: { type: Type.STRING },
            genre: { type: Type.STRING },
            tone: { type: Type.STRING },
            setting_description: { type: Type.STRING },
            audio_cue: { type: Type.STRING },
            cast: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  player: { type: Type.STRING },
                  role: { type: Type.STRING },
                  archetype: { type: Type.STRING },
                  motivation: { type: Type.STRING },
                  secret: { type: Type.STRING },
                },
                required: ["player", "role", "archetype", "motivation"],
              },
            },
            script_lines: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  speaker: { type: Type.STRING },
                  direction: { type: Type.STRING },
                  line: { type: Type.STRING },
                },
                required: ["speaker", "direction", "line"],
              },
            },
            plot_choices: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING },
                  description: { type: Type.STRING },
                  consequence_hint: { type: Type.STRING },
                },
                required: ["id", "label", "description", "consequence_hint"],
              },
            },
            is_finale: { type: Type.BOOLEAN },
            finale_summary: { type: Type.STRING },
          },
          required: [
            "chapter_number",
            "chapter_title",
            "genre",
            "tone",
            "setting_description",
            "audio_cue",
            "cast",
            "script_lines",
            "plot_choices",
            "is_finale",
          ],
        },
      },
    });

    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), 45000);
    });

    const response = await Promise.race([apiCallPromise, timeoutPromise]);
    if (!response) {
      return getFallbackSceneSwapChapter({ ...inputs, players: playerList, chapterNumber });
    }

    const text = response.text;
    if (text) {
      try {
        const parsed = JSON.parse(text);
        return sanitizeChapterResult(parsed, inputs, playerList, chapterNumber, isFinale, genre, tone);
      } catch (parseErr) {
        console.warn("Failed to parse Gemini chapter JSON, falling back:", parseErr);
        return getFallbackSceneSwapChapter({ ...inputs, players: playerList, chapterNumber });
      }
    }
    return getFallbackSceneSwapChapter({ ...inputs, players: playerList, chapterNumber });
  } catch (error) {
    console.error("Gemini SceneSwap chapter generation error:", error);
    return getFallbackSceneSwapChapter({ ...inputs, players: playerList, chapterNumber });
  }
}

function sanitizeChapterResult(
  raw: any,
  inputs: SceneSwapChapterInputs,
  playerList: string[],
  chapterNumber: number,
  isFinale: boolean,
  genre: string,
  tone: string
): SceneSwapChapterResult {
  if (!raw || typeof raw !== 'object') {
    return getFallbackSceneSwapChapter({ ...inputs, players: playerList, chapterNumber });
  }

  // Normalize cast
  const rawCast = Array.isArray(raw.cast)
    ? raw.cast
    : Array.isArray(raw.characters)
    ? raw.characters
    : Array.isArray(raw.actors)
    ? raw.actors
    : [];
  const cast: Array<{ player: string; role: string; archetype: string; motivation: string; secret?: string }> = [];

  playerList.forEach((player, idx) => {
    const existing =
      rawCast.find(
        (c: any) => c && typeof c.player === 'string' && c.player.toLowerCase().trim() === player.toLowerCase().trim()
      ) ||
      rawCast[idx] ||
      {};
    cast.push({
      player: player,
      role: String(existing.role || existing.character || `Protagonist ${idx + 1}`),
      archetype: String(existing.archetype || 'The Wildcard'),
      motivation: String(existing.motivation || 'Uncover the truth and survive the ordeal'),
      secret: existing.secret ? String(existing.secret) : undefined,
    });
  });

  // Normalize script lines
  const rawLines = Array.isArray(raw.script_lines)
    ? raw.script_lines
    : Array.isArray(raw.script)
    ? raw.script
    : Array.isArray(raw.lines)
    ? raw.lines
    : Array.isArray(raw.dialogue)
    ? raw.dialogue
    : [];
  const script_lines: Array<{ speaker: string; direction?: string; line: string }> = [];

  rawLines.forEach((l: any, idx: number) => {
    if (!l) return;
    const speaker =
      typeof l.speaker === 'string' && l.speaker.trim()
        ? l.speaker.trim()
        : typeof l.character === 'string' && l.character.trim()
        ? l.character.trim()
        : playerList[idx % playerList.length];
    const direction =
      typeof l.direction === 'string'
        ? l.direction
        : typeof l.stageDirection === 'string'
        ? l.stageDirection
        : undefined;
    const line =
      typeof l.line === 'string' && l.line.trim()
        ? l.line.trim()
        : typeof l.dialogue === 'string' && l.dialogue.trim()
        ? l.dialogue.trim()
        : typeof l.text === 'string' && l.text.trim()
        ? l.text.trim()
        : '';
    if (line) {
      script_lines.push({ speaker, direction, line });
    }
  });

  if (script_lines.length === 0) {
    cast.forEach((c) => {
      script_lines.push({
        speaker: c.player,
        direction: '[Looking intently around the room]',
        line: `We have to make our next move right now before anyone finds out!`,
      });
    });
  }

  // Normalize plot choices
  const rawChoices = Array.isArray(raw.plot_choices)
    ? raw.plot_choices
    : Array.isArray(raw.choices)
    ? raw.choices
    : Array.isArray(raw.options)
    ? raw.options
    : [];
  const plot_choices: Array<{ id: 'A' | 'B' | 'C'; label: string; description: string; consequence_hint: string }> = [];

  if (!isFinale) {
    const choiceIds: Array<'A' | 'B' | 'C'> = ['A', 'B', 'C'];
    choiceIds.forEach((id, idx) => {
      const existing =
        rawChoices.find((c: any) => c && (c.id === id || String(c.id).toUpperCase() === id)) ||
        rawChoices[idx] ||
        {};
      plot_choices.push({
        id,
        label: String(existing.label || existing.title || `Option ${id}: The Next Move`),
        description: String(existing.description || existing.action || `Choose Option ${id} to advance the scene.`),
        consequence_hint: String(existing.consequence_hint || existing.hint || existing.consequence || 'The plot thickens with unexpected consequences!'),
      });
    });
  }

  return {
    chapter_number: chapterNumber,
    chapter_title: String(raw.chapter_title || raw.title || `Act ${chapterNumber}: The Turning Point`),
    genre: String(raw.genre || genre),
    tone: String(raw.tone || tone),
    setting_description: String(raw.setting_description || raw.setting || 'INT. SCENE STAGE - DRAMATIC CINEMATIC ATMOSPHERE'),
    audio_cue: String(raw.audio_cue || raw.audioCue || 'Dramatic synthesized audio swell.'),
    cast,
    script_lines,
    plot_choices,
    is_finale: isFinale,
    finale_summary: isFinale
      ? String(raw.finale_summary || raw.summary || 'Against all odds, the narrative reached its legendary culmination!')
      : undefined,
  };
}

export function getFallbackSceneSwapChapter(inputs: SceneSwapChapterInputs): SceneSwapChapterResult {
  const players = (inputs.players || []).filter(Boolean);
  const p1 = players[0] || "Amaka";
  const p2 = players[1] || "Tunde";
  const p3 = players[2] || "Chioma";
  const p4 = players[3] || "Femi";
  const ch = inputs.chapterNumber || 1;
  const isFinale = ch === 3;
  const genre = inputs.genre || "Nollywood Drama";
  const tone = inputs.tone || "Dramatic & High Energy";

  // Sci-Fi Survival Fallback
  if (genre === "Sci-Fi Survival") {
    if (ch === 1) {
      return {
        chapter_number: 1,
        chapter_title: "Act I: Pressure Drop",
        genre: "Sci-Fi Survival",
        tone,
        setting_description: "INT. SECTOR 4 AIRLOCK - ORBITAL RESEARCH STATION - RED ALERT STROBE LIGHTS",
        audio_cue: "Deafening atmospheric decompression horn with frantic mechanical clicking.",
        cast: [
          { player: p1, role: "Commander", archetype: "The Stoic Veteran", motivation: "Seal the hull before oxygen hits zero.", secret: "Knows the station was sabotaged from within." },
          { player: p2, role: "Chief Engineer", archetype: "The Nervous Tech", motivation: "Reroute power before the reactor overloads.", secret: "Lost the master biometric key thirty minutes ago." },
          { player: p3, role: "Medical Officer", archetype: "The Skeptic", motivation: "Keep everyone from hyperventilating.", secret: "Discovered an unknown pathogen in the air scrubbers." },
          ...(players.length >= 4 ? [{ player: p4, role: "Communications Officer", archetype: "The Renegade", motivation: "Broadcast distress beacon.", secret: "Intercepted a classified bounty order." }] : []),
        ],
        script_lines: [
          { speaker: p1, direction: "[Pounding on the emergency lockdown terminal as warning sirens wail]", line: "Hold your breath! Sector 4 seal has breached, and life support is dropping three percent every second!" },
          { speaker: p2, direction: "[Crawling under the glowing conduit rack, sparks bouncing off their helmet visor]", line: "The main fuse didn't blow! Someone physically cut the primary backup cables with laser shears!" },
          { speaker: p3, direction: "[Checking the biometric bio-scanner with trembling fingers]", line: "Forget the cables! The air filtration system is pumping unknown synthetic mist into the cabins!" },
          ...(players.length >= 4 ? [{ speaker: p4, direction: "[Tapping the encrypted headset with wide eyes]", line: "Commander, someone just transmitted an override command from inside this exact airlock!" }] : []),
          { speaker: p1, direction: "[Turning slowly toward the squad, hand resting near the side holster]", line: "Nobody touches that blast door until we figure out who just locked us in." },
          { speaker: p2, direction: "[Wiping oil from visor, voice shaking with adrenaline]", line: "Commander, my telemetry monitor says we have ninety seconds before the emergency oxygen tank vents into deep vacuum!" },
          { speaker: p3, direction: "[Shining an ultraviolet beam at the ventilation grill]", line: "Look at these traces! This isn't station equipment—it's military-grade neurotoxin!" },
          ...(players.length >= 4 ? [{ speaker: p4, direction: "[Frantically cycling through audio logs on the datapad]", line: "I found the transmission log! The command originated from a terminal registered to someone standing right here!" }] : []),
          { speaker: p1, direction: "[Stepping in front of the manual purge valve]", line: "Then we settle this right now. Nobody leaves this compartment until we vote on our next move." },
          { speaker: p2, direction: "[Holding up a severed hydraulic hose like a weapon]", line: "If we don't vent this airlock right now, there won't be anyone left alive to accuse!" },
          { speaker: p3, direction: "[Bracing against the bulkhead as the deck shudders violently]", line: "Decide now, Commander! The hull integrity alarm is at critical red!" },
        ],
        plot_choices: [
          { id: "A", label: "Option A: Manual Airlock Venting", description: "Purge the toxic mist into deep space, risking complete atmospheric collapse.", consequence_hint: "Will save them from the poison, but leaves only 2 minutes of reserve oxygen!" },
          { id: "B", label: "Option B: Confront the Saboteur", description: "Demand everyone reveal their personal logs before unlocking the security hatch.", consequence_hint: "Mutiny could erupt, but the traitor will be exposed immediately!" },
          { id: "C", label: "Option C: Reroute to Auxiliary Core", description: "Crawl through the radiation-shielded maintenance tunnel to reach bridge controls.", consequence_hint: "Extremely dangerous crawl, but unlocks station surveillance cameras!" },
        ],
        is_finale: false,
      };
    } else if (ch === 2) {
      return {
        chapter_number: 2,
        chapter_title: "Act II: Containment Protocol",
        genre: "Sci-Fi Survival",
        tone,
        setting_description: "INT. AUXILIARY POWER JUNCTION - ZERO GRAVITY TUNNEL - SPARKS & SMOKE",
        audio_cue: "Heavy magnetic boot clangs echo against cold titanium bulkheads.",
        cast: [
          { player: p1, role: "Commander", archetype: "The Stoic Veteran", motivation: "Prevent total ship blowout.", secret: "Battery charge at 12%." },
          { player: p2, role: "Chief Engineer", archetype: "The Pragmatist", motivation: "Restore gravity stabilizers.", secret: "Bypassed three safety interlocks." },
          { player: p3, role: "Medical Officer", archetype: "The Truth-Seeker", motivation: "Contain biological contamination.", secret: "Has an antidote vial." },
          ...(players.length >= 4 ? [{ player: p4, role: "Communications Officer", archetype: "The Wildcard", motivation: "Signal rescue frigate.", secret: "Signal might ping pirate vessels." }] : []),
        ],
        script_lines: [
          { speaker: p2, direction: "[Floating in zero-G, wrestling with a charred copper busbar]", line: "I rerouted the secondary junction! We have three minutes of emergency gravity, that is all!" },
          { speaker: p1, direction: "[Grabbing the safety railing as boots clamp to the metal deck]", line: "Gravity is back, but look at the pressure monitors. The escape pods are ejecting empty!" },
          { speaker: p3, direction: "[Holding up a glowing cyan canister found inside the wall panel]", line: "Someone wanted us trapped while they stole the Genesis sample! Look at this seal!" },
          ...(players.length >= 4 ? [{ speaker: p4, direction: "[Frantically scanning telemetry]", line: "A stealth shuttle just decoupled from the exterior hull! They are leaving us behind!" }] : []),
          { speaker: p2, direction: "[Spitting blood from a cut lip, coughing against the smoke]", line: "The shuttle is spooling up warp drives! In forty seconds they will be out of sub-orbital range!" },
          { speaker: p1, direction: "[Eyes hardening behind the illuminated visor glass]", line: "We are not dying in orbit today. We take control of the orbital rail cannon." },
          { speaker: p3, direction: "[Checking the remaining pulse levels of the sample]", line: "If the cannon blast hits their reactor, the Genesis sample will vaporize with the shuttle!" },
          ...(players.length >= 4 ? [{ speaker: p4, direction: "[Rerouting station targeting sensors]", line: "I've locked onto their port thruster! A clean surgical shot can disable them without detonation!" }] : []),
          { speaker: p2, direction: "[Grasping the manual railgun capacitor levers]", line: "Targeting capacitor is charging... but it will drain all remaining life support to fifty percent!" },
          { speaker: p1, direction: "[Slamming the targeting visor down]", line: "Do it. Fortune favors the desperate. Stand by for impact!" },
        ],
        plot_choices: [
          { id: "A", label: "Option A: Fire the Rail Cannon", description: "Disable the fleeing shuttle's thrusters to force them back.", consequence_hint: "Could detonate the entire docking ring!" },
          { id: "B", label: "Option B: Overload the Reactor Core", description: "Create an electromagnetic pulse that paralyzes all local ships including the shuttle.", consequence_hint: "High risk of total darkness and hypothermia!" },
          { id: "C", label: "Option C: Space Walk Boarding", description: "Leap across open vacuum to intercept the shuttle docking hatch manually.", consequence_hint: "Wildly heroic stunt with fifty-fifty survival odds!" },
        ],
        is_finale: false,
      };
    } else {
      return {
        chapter_number: 3,
        chapter_title: "Act III: The Genesis Gambit (Grand Finale)",
        genre: "Sci-Fi Survival",
        tone,
        setting_description: "INT. COMMAND BRIDGE - EARTH LOOMING MAJESTICALLY IN THE BACKGROUND - SUNBURST HORIZON",
        audio_cue: "Triumphant electronic brass crescendo accompanied by steady heartbeat monitor.",
        cast: [
          { player: p1, role: "Commander", archetype: "The Legend", motivation: "Save Earth and the crew.", secret: "Vindicated." },
          { player: p2, role: "Chief Engineer", archetype: "The Heroic Genius", motivation: "Celebrated survivor.", secret: "Fixed the impossible." },
          { player: p3, role: "Chief Medical Officer", archetype: "Guardian", motivation: "Secured the cure.", secret: "Saved humanity." },
          ...(players.length >= 4 ? [{ player: p4, role: "Comms Master", archetype: "The Ace", motivation: "Broadcasting victory.", secret: "Worldwide broadcast." }] : []),
        ],
        script_lines: [
          { speaker: p1, direction: "[Slamming the master command beacon into the console socket with authority]", line: "Target locked. Shuttles neutralized, life support restored to one hundred percent!" },
          { speaker: p2, direction: "[Collapsing into the pilot chair with an ecstatic sigh of relief]", line: "I never doubted my wiring for a single second! Okay... maybe for two seconds." },
          { speaker: p3, direction: "[Holding the intact medical vial up to the sunlight pouring through the canopy]", line: "The sample is safe. Earth will have the cure before morning." },
          ...(players.length >= 4 ? [{ speaker: p4, direction: "[Throwing both hands in the air cheering]", line: "Earth Command is responding on all frequencies! They are naming an entire fleet after us!" }] : []),
          { speaker: p1, direction: "[Looking out into the sunrise with an unforgettable smirk]", line: "Cut the alarms. Someone pour a victory ration. We just saved the world." },
          { speaker: p2, direction: "[Laughing aloud as zero-gravity tools gently float around the bridge]", line: "Next time someone offers me an orbital station contract, I'm staying on solid ground in Lagos!" },
          { speaker: p3, direction: "[Smiling warmly and securing the Genesis vial in the cryo-locker]", line: "Admit it, Ray—you wouldn't trade this crew for anything in the galaxy." },
          ...(players.length >= 4 ? [{ speaker: p4, direction: "[Broadcasting the victory fanfare across all orbital channels]", line: "Orbital Command confirms extraction shuttle ETA: fifteen minutes! We're going home!" }] : []),
          { speaker: p1, direction: "[Raising a dented metal canteen in a silent toast to the crew]", line: "To Station 9. We faced the abyss, and the abyss blinked first." },
        ],
        plot_choices: [],
        is_finale: true,
        finale_summary: "Against impossible orbital odds, the crew thwarted the sabotage, retrieved the vital Genesis sample, and steered Station 9 into triumphant stabilization as heroes of the Sol System.",
      };
    }
  }

  // Nollywood Drama Fallback (Default)
  if (ch === 1) {
    return {
      chapter_number: 1,
      chapter_title: "Act I: The Reading of the Will",
      genre: "Nollywood Drama",
      tone,
      setting_description: "INT. CHIEF BALOGUN'S BANQUET PARLOUR - IKOYI - HEAVY MAHOGANY FURNITURE & GOLD DUSTED CHANDELIER",
      audio_cue: "Dramatic Nollywood high-suspense synthetic piano strike followed by distant thunder rumble.",
      cast: [
        { player: p1, role: "Chief Mrs. Florence", archetype: "The Fierce Matriarch", motivation: "Retain total control over the Balogun shipping empire.", secret: "Has the original lawyer's testament locked in her royal handbag." },
        { player: p2, role: "Dapo Balogun", archetype: "The Ambitious London Returnee", motivation: "Seize the family conglomerate before creditors call.", secret: "Owes thirty million naira in overseas cryptocurrency debts." },
        { player: p3, role: "Barrister Kemi", archetype: "The Unbribable Attorney", motivation: "Read the unadulterated truth of Chief's final wishes.", secret: "Was offered a blank check this morning to alter page four." },
        ...(players.length >= 4 ? [{ player: p4, role: "Uncle Segun", archetype: "The Suspicious Elder", motivation: "Claim ancestral family land in Ibadan.", secret: "Arrived with two fake witnesses waiting in the gatehouse." }] : []),
      ],
      script_lines: [
        { speaker: p1, direction: "[Slowly adjusting her towering golden gélé with regal, terrifying calm]", line: "Look at me very well, Dapo. Do you think sixty years of sweat and empire was built for you to gamble away?" },
        { speaker: p2, direction: "[Slamming an Italian leather briefcase onto the mahogany glass table]", line: "Mama, times have changed! The London board recognized my signature as sole managing director yesterday!" },
        { speaker: p3, direction: "[Clearing throat loudly and breaking the red wax seal on a thick blue envelope]", line: "Excuse me, everyone! Before anyone signs any checks, Chief Balogun recorded a video testament with me yesterday." },
        ...(players.length >= 4 ? [{ speaker: p4, direction: "[Spitting out kola nut and pointing his walking stick aggressively]", line: "Video what?! In this culture, a dead man cannot speak through a television set!" }] : []),
        { speaker: p1, direction: "[Eyes narrowing with ice-cold venom as she turns to the lawyer]", line: "Barrister Kemi... if you value your license and your car parked outside, choose your next words very carefully." },
        { speaker: p2, direction: "[Leaning across the table, neck veins bulging]", line: "Don't intimidate the attorney, Mama! We all know Papa amended his testament three days before he was admitted to hospital!" },
        { speaker: p3, direction: "[Calmly sliding reading glasses down the bridge of nose]", line: "Indeed he did, Dapo. And according to clause seven, any beneficiary with undeclared international debt is instantly disqualified." },
        ...(players.length >= 4 ? [{ speaker: p4, direction: "[Throwing arms wide in theatrical outrage]", line: "Yeeepa! Disqualified?! Then what of the eighty million naira for the ancestral palace in Ibadan?!" }] : []),
        { speaker: p1, direction: "[Pouring herself a glass of vintage palm wine with a chilling smile]", line: "Sit down, Segun. The only thing you are inheriting from this parlour tonight is your own walking stick." },
        { speaker: p2, direction: "[Frantically dialing a number under the table]", line: "This is a setup! The board in London will never ratify this bogus paperwork!" },
        { speaker: p3, direction: "[Pressing the remote control button toward the wall screen]", line: "Then let Chief Balogun explain it himself. Roll the tape!" },
      ],
      plot_choices: [
        { id: "A", label: "Option A: Play the Secret Video", description: "Insert the flash drive into the 85-inch television to reveal Chief's dying confession.", consequence_hint: "Will expose Dapo's secret debt, but might disinherit everyone!" },
        { id: "B", label: "Option B: Florence's Power Play", description: "Chief Mrs. Florence orders the bodyguards to confiscate the envelope immediately.", consequence_hint: "Will trigger an all-out shouting match and flying champagne glasses!" },
        { id: "C", label: "Option C: The Mysterious Stranger Knocks", description: "A loud bang at the ornate front double doors reveals an uninvited guest claiming to be Chief's first-born.", consequence_hint: "Complete pandemonium in Ikoyi!" },
      ],
      is_finale: false,
    };
  } else if (ch === 2) {
    return {
      chapter_number: 2,
      chapter_title: "Act II: Bloodline & Betrayal",
      genre: "Nollywood Drama",
      tone,
      setting_description: "INT. PRIVATE STUDY - THE BALOGUN MANSION - DRAMATIC LIGHTNING FLASHES THROUGH RAIN WINDOWS",
      audio_cue: "Furious talking drums syncopated with high-pitched suspense string trills.",
      cast: [
        { player: p1, role: "Chief Mrs. Florence", archetype: "The Untouchable Matriarch", motivation: "Crush the rebellion.", secret: "Already hired new forensic accountants." },
        { player: p2, role: "Dapo Balogun", archetype: "The Cornered Heir", motivation: "Find the real vault key.", secret: "Sweating profusely." },
        { player: p3, role: "Barrister Kemi", archetype: "The Whistleblower", motivation: "Protect the truth.", secret: "Wearing a hidden wire." },
        ...(players.length >= 4 ? [{ player: p4, role: "Uncle Segun", archetype: "The Opportunist", motivation: "Switch allegiances.", secret: "Stole the deed from the study." }] : []),
      ],
      script_lines: [
        { speaker: p2, direction: "[Pacing frantically, loosening silk tie as thunder claps]", line: "The bank accounts are frozen! Every single one! Mama, did you instruct the Central Bank?!" },
        { speaker: p1, direction: "[Sipping hot hibiscus tea from a porcelain teacup with total serenity]", line: "God gives, and Mama takes away. You thought you were playing chess with small boys in London?" },
        { speaker: p3, direction: "[Unrolling a stamped deed with government seal in front of them]", line: "The accounts weren't frozen by Mama! The anti-fraud commission traced a twenty billion transfer initiated from this IP address!" },
        ...(players.length >= 4 ? [{ speaker: p4, direction: "[Sneaking toward the garden exit with a bulging briefcase]", line: "Family matter is good, but when police sirens enter the compound, elder must take evening stroll!" }] : []),
        { speaker: p2, direction: "[Grabbing the edge of the desk, staring in sheer terror]", line: "Wait... someone set me up! The password was only known by one other person in this room!" },
        { speaker: p1, direction: "[Setting the porcelain cup down with a sharp porcelain click]", line: "You think your father didn't install keyloggers on the family Wi-Fi? Sit down before I summon the gate guards!" },
        { speaker: p3, direction: "[Tapping her pen against the ledger pages]", line: "The transfer went to an offshore holding entity registered under the name: Segun Ventures International." },
        ...(players.length >= 4 ? [{ speaker: p4, direction: "[Freezing mid-step at the French doors, turning with an innocent grin]", line: "Segun Ventures?! Ah, that must be a typographical error by the British clerks!" }] : []),
        { speaker: p2, direction: "[Lurching toward Segun in disbelief]", line: "Uncle Segun?! You were advising me to take the loan while you were siphoning the vault?!" },
        { speaker: p1, direction: "[Rising from her throne-like armchair, eyes flashing like lightning]", line: "Enough! Neither of you will leave this mansion until the family deed is returned to this table!" },
      ],
      plot_choices: [
        { id: "A", label: "Option A: Unmask the Real Mole", description: "Check the study CCTV footage on the iPad to catch the real culprit red-handed.", consequence_hint: "Guaranteed jaw-dropping reveal of who transferred the billions!" },
        { id: "B", label: "Option B: The Dramatic Collapse", description: "Dapo feigns sudden medical distress to buy time while his driver sneaks into the vault.", consequence_hint: "Pure theatrical drama with ambulance sirens!" },
        { id: "C", label: "Option C: Call the Elder Council", description: "Summon the royal elders to adjudicate the dispute with customary oath-taking.", consequence_hint: "Swearing before the ancestral staff of truth!" },
      ],
      is_finale: false,
    };
  } else {
    return {
      chapter_number: 3,
      chapter_title: "Act III: The Coronation of Truth (Grand Finale)",
      genre: "Nollywood Drama",
      tone,
      setting_description: "INT. THE GRAND BALLROOM - EKO HOTEL GALA - FLASHBULBS POPPING & ROYAL TRUMPETS SOUNDING",
      audio_cue: "Joyous highlife music erupts with celebratory brass and traditional cheering.",
      cast: [
        { player: p1, role: "Chief Mrs. Florence", archetype: "The Undisputed Empress", motivation: "Rule the empire in peace.", secret: "Finally smiling." },
        { player: p2, role: "Dapo Balogun", archetype: "The Reformed Heir", motivation: "Accept humble redemption.", secret: "Promised to work from ground floor up." },
        { player: p3, role: "Barrister Kemi", archetype: "Senior Advocate of Nigeria", motivation: "Justice delivered.", secret: "Awarded master retainership." },
        ...(players.length >= 4 ? [{ player: p4, role: "Uncle Segun", archetype: "The Dancing Elder", motivation: "Spray crisp naira notes.", secret: "First on the dancefloor." }] : []),
      ],
      script_lines: [
        { speaker: p3, direction: "[Stepping up to the podium microphone as three hundred guests applaud]", line: "Ladies and gentlemen, the truth has spoken! The Balogun Foundation belongs equally to the people, and the empire stands united!" },
        { speaker: p2, direction: "[Bowing respectfully before Florence with hands held out in truce]", line: "Mama, forgive my impatience. A son must learn to walk before he runs to seize the crown." },
        { speaker: p1, direction: "[Placing a royal beaded necklace over Dapo's neck with tears of joy]", line: "Stand up, my son! When gold passes through fire, it shines brighter! Let the champagne flow!" },
        ...(players.length >= 4 ? [{ speaker: p4, direction: "[Throwing stacks of crisp naira notes into the air dancing Shaku-Shaku]", line: "Oya spray the money! Sorrow has vanished from Ikoyi tonight!" }] : []),
        { speaker: p1, direction: "[Raising her golden champagne flute high toward the ceiling]", line: "To the Balogun bloodline: unbreakable, undefeated, and forever glorious!" },
        { speaker: p2, direction: "[Raising his glass alongside hers, smiling genuinely for the first time]", line: "To family, to legacy, and to the lessons that made us who we are today!" },
        { speaker: p3, direction: "[Toast echoed by the cheering grand ballroom]", line: "Long live the Balogun dynasty!" },
        ...(players.length >= 4 ? [{ speaker: p4, direction: "[Grabbing the live microphone from the highlife band]", line: "Band leader, hit that talking drum louder! We are celebrating until sunrise!" }] : []),
      ],
      plot_choices: [],
      is_finale: true,
      finale_summary: "In a breathtaking climax of loyalty and grace, the family secrets were cleansed, the conspirators were exposed, and the dynasty celebrated its triumphant royal reunion with laughter, dance, and an unbreakable covenant.",
    };
  }
}

export interface RealisticImageRequest {
  genre: string;
  tone?: string;
  setting_description: string;
  scene_heading?: string;
  chapter_number?: number;
  chapter_title?: string;
  type?: 'scene' | 'character';
  aspectRatio?: '9:16' | '16:9' | '3:4' | '1:1';
  forceRegenerate?: boolean;
  cast?: Array<{
    player: string;
    role: string;
    archetype?: string;
    motivation?: string;
    secret?: string;
    wardrobe?: string;
    props?: string;
    facialFeatures?: string;
    heritagePrompt?: string;
  }>;
  character_beats?: Array<{
    player: string;
    role: string;
    action: string;
    dialogue: string;
    wardrobe?: string;
    props?: string;
  }>;
  characterConsistencyPrompt?: string;
  physicalActionPrompt?: string;
  activeSpeaker?: string;
  activeLine?: string;
  character?: {
    player: string;
    role: string;
    archetype: string;
    secret?: string;
  };
  variationIndex?: number;
}

export interface RealisticImageResponse {
  imageUrl: string;
  promptUsed: string;
  isAiGenerated: boolean;
  type: 'scene' | 'character';
}

// Global in-memory cache and circuit breaker for image generation
const imageCache = new Map<string, RealisticImageResponse>();
let imageQuotaCooldownUntil = 0;

export async function generateSceneSwapRealisticImage(
  inputs: RealisticImageRequest
): Promise<RealisticImageResponse> {
  const isCharacter = inputs.type === 'character';
  const genre = inputs.genre || 'Nollywood Drama';
  const tone = inputs.tone || 'Cinematic & Dramatic';
  const setting = inputs.scene_heading || inputs.setting_description || 'Opulent Lagos Manor Hall';
  const chapterNumber = inputs.chapter_number || 1;

  // Generate cache key
  const cacheKey = isCharacter && inputs.character
    ? `char:${inputs.character.player}:${inputs.character.role}:${genre}`
    : `scene:${genre}:${chapterNumber}:${setting.slice(0, 50)}:${inputs.activeSpeaker || ''}`;

  if (!inputs.forceRegenerate && imageCache.has(cacheKey)) {
    const cached = imageCache.get(cacheKey)!;
    // Don't return SVG cached fallbacks for scene view
    if (!cached.imageUrl.startsWith('data:image/svg')) {
      return cached;
    }
  }

  // Characters are generated with instant photorealistic portrait art
  if (isCharacter && inputs.character) {
    const result: RealisticImageResponse = {
      imageUrl: getFallbackRealisticImage(inputs),
      promptUsed: `Portrait of ${inputs.character.player} as ${inputs.character.role}`,
      isAiGenerated: false,
      type: 'character',
    };
    imageCache.set(cacheKey, result);
    return result;
  }

  const targetAspectRatio = inputs.aspectRatio === '16:9' ? '16:9' : '9:16';

  // Build character actions and dialogue details
  const characterActionsFormatted = inputs.character_beats && inputs.character_beats.length > 0
    ? inputs.character_beats
        .map((b) => {
          const wardrobeTxt = b.wardrobe ? ` [Wearing: ${b.wardrobe}]` : '';
          const propsTxt = b.props ? ` [Props: ${b.props}]` : '';
          return `- "${b.player}" as ${b.role}${wardrobeTxt}${propsTxt}:\n  PHYSICAL ACTION: ${b.action}\n  SPOKEN DIALOGUE IN SCENE: "${b.dialogue}"`;
        })
        .join('\n')
    : inputs.cast && inputs.cast.length > 0
    ? inputs.cast
        .map((c) => {
          const wardrobeInfo = c.wardrobe ? ` wearing ${c.wardrobe}` : '';
          const propsInfo = c.props ? ` carrying/using ${c.props}` : '';
          return `Character "${c.player}" as "${c.role}" (${c.archetype || 'Lead'})${wardrobeInfo}${propsInfo}`;
        })
        .join(', ')
    : 'The main ensemble cast members dressed in genre-authentic costumes';

  const activeFocusText = inputs.activeSpeaker
    ? `Spotlight moment: ${inputs.activeSpeaker} is in active dialogue mid-delivery: "${inputs.activeLine || ''}".`
    : '';

  const consistencyDirective = inputs.characterConsistencyPrompt
    ? `\n${inputs.characterConsistencyPrompt}\n`
    : '';

  const actionDirective = inputs.physicalActionPrompt
    ? `PRIMARY SCENE ACTION: ${inputs.physicalActionPrompt}`
    : `PHYSICAL ACTION: The characters are physically inside the setting interacting together and engaging with the environment with expressive, natural cinematic presence.`;

  const prompt = targetAspectRatio === '9:16'
    ? `A photorealistic, vertical 9:16 cinematic feature film still, shot on 35mm Arri Alexa 35 with Panavision anamorphic lenses, 8k resolution, filling the entire vertical frame.
=== SCENE LOCATION & ARCHITECTURE ===
LOCATION: "${setting}"
FILM GENRE: "${genre}" | TONE: "${tone}" | ACT ${chapterNumber}: "${inputs.chapter_title || ''}"
The visual composition must showcase the exact location specified in the setting: authentic architectural details, atmospheric depth, realistic environmental lighting, practical light sources, natural reflections, and rich physical textures.

=== DRAMATIC ACTION & SCENE ATMOSPHERE ===
${activeFocusText}
${actionDirective}
${characterActionsFormatted ? `ENSEMBLE CAST MOMENT:\n${characterActionsFormatted}` : ''}
${consistencyDirective}

=== PHOTOREALISTIC CINEMATOGRAPHY REQUIREMENTS ===
- Pure cinematic live-action cinematography with realistic lighting, volumetric atmosphere, and natural depth of field.
- Full vertical 9:16 frame composition that completely fills the vertical screen from top to bottom.
- ABSOLUTELY NO illustration, NO cartoon, NO anime, NO comic art, NO sketch, NO graphic novel shapes, NO geometric stick figures.
- NO borders, NO margins, NO letterboxing, NO subtitles, NO floating avatars, NO text, NO watermarks, NO badges.`
    : `A photorealistic, cinematic 16:9 movie production still, shot on 35mm Arri Alexa 35 anamorphic lens, 8k resolution.
=== SCENE LOCATION & ARCHITECTURE ===
LOCATION: "${setting}"
FILM GENRE: "${genre}" | TONE: "${tone}" | ACT ${chapterNumber}
The visual composition must depict the exact location specified in the setting with realistic architectural details, practical lighting, and rich textures.

=== DRAMATIC ACTION & ENSEMBLE ===
${actionDirective}
${characterActionsFormatted ? `CAST DETAILS:\n${characterActionsFormatted}` : ''}
${consistencyDirective}

=== MANDATORY CINEMATOGRAPHY RULES ===
- Photorealistic live-action cinema still with realistic lighting and cinematic staging.
- ABSOLUTELY NO cartoons, NO illustrations, NO comic art, NO graphic novel panels, NO geometric drawings, NO text overlays.`;

  const ai = getGeminiClient();
  const isCooldown = Date.now() < imageQuotaCooldownUntil;

  if (ai && !isCooldown) {
    try {
      const apiCallPromise = ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: targetAspectRatio,
          },
        },
      });

      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), 25000);
      });

      const response = await Promise.race([apiCallPromise, timeoutPromise]);

      if (response && response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            const mime = part.inlineData.mimeType || 'image/png';
            const imageUrl = `data:${mime};base64,${part.inlineData.data}`;
            const successResult: RealisticImageResponse = {
              imageUrl,
              promptUsed: prompt,
              isAiGenerated: true,
              type: 'scene',
            };
            imageCache.set(cacheKey, successResult);
            return successResult;
          }
        }
      }
    } catch (err: any) {
      // Check for rate limit / quota exhaustion (429 RESOURCE_EXHAUSTED)
      const errStr = String(err?.message || err);
      if (err?.status === 'RESOURCE_EXHAUSTED' || errStr.includes('429') || errStr.includes('quota') || errStr.includes('limit: 0')) {
        // Short 10s cooldown to allow quick recovery
        imageQuotaCooldownUntil = Date.now() + 10 * 1000;
      }
    }
  }

  // Fallback to high-fidelity realistic photographic backdrop
  const fallbackUrl = getFallbackRealisticImage(inputs);
  const fallbackResult: RealisticImageResponse = {
    imageUrl: fallbackUrl,
    promptUsed: prompt,
    isAiGenerated: false,
    type: 'scene',
  };
  imageCache.set(cacheKey, fallbackResult);
  return fallbackResult;
}

export function getSceneBackdropImage(genre: string, chapter: number): string {
  const ch = Math.min(Math.max(chapter || 1, 1), 3);
  const g = String(genre || '').toLowerCase();
  if (g.includes('sci-fi') || g.includes('scifi')) {
    if (ch === 1) return '/images/scenes/scifi_act1.jpg';
    if (ch === 2) return '/images/scenes/scifi_act2.jpg';
    return '/images/scenes/scifi_act3.jpg';
  }
  if (g.includes('afro') || g.includes('heist')) {
    if (ch === 1) return '/images/scenes/heist_act1.jpg';
    if (ch === 2) return '/images/scenes/heist_act2.jpg';
    return '/images/scenes/heist_act3.jpg';
  }
  if (g.includes('horror')) {
    if (ch === 1) return '/images/scenes/horror_act1.jpg';
    if (ch === 2) return '/images/scenes/horror_act2.jpg';
    return '/images/scenes/horror_act3.jpg';
  }
  if (g.includes('rom') || g.includes('comedy')) {
    if (ch === 1) return '/images/scenes/romcom_act1.jpg';
    if (ch === 2) return '/images/scenes/romcom_act2.jpg';
    return '/images/scenes/romcom_act3.jpg';
  }
  if (g.includes('cyber') || g.includes('detective')) {
    if (ch === 1) return '/images/scenes/detective_act1.jpg';
    if (ch === 2) return '/images/scenes/detective_act2.jpg';
    return '/images/scenes/detective_act3.jpg';
  }
  if (ch === 1) return '/images/scenes/nollywood_act1.jpg';
  if (ch === 2) return '/images/scenes/nollywood_act2.jpg';
  return '/images/scenes/nollywood_act3.jpg';
}

export function getFallbackRealisticImage(inputs: RealisticImageRequest): string {
  const isCharacter = inputs.type === 'character';

  if (isCharacter) {
    const role = (inputs.character?.role || '').toLowerCase();
    const player = (inputs.character?.player || '').toLowerCase();

    if (role.includes('matriarch') || role.includes('florence') || player.includes('amaka')) return '/images/characters/matriarch.jpg';
    if (role.includes('heir') || role.includes('dapo') || player.includes('tunde')) return '/images/characters/heir.jpg';
    if (role.includes('attorney') || role.includes('lawyer') || role.includes('barrister') || player.includes('chioma') || player.includes('kemi')) return '/images/characters/attorney.jpg';
    if (role.includes('elder') || role.includes('uncle') || role.includes('segun') || player.includes('femi')) return '/images/characters/elder.jpg';
    if (role.includes('commander') || role.includes('captain')) return '/images/characters/commander.jpg';
    if (role.includes('engineer') || role.includes('tech')) return '/images/characters/engineer.jpg';
    if (role.includes('medic') || role.includes('doctor')) return '/images/characters/medic.jpg';
    if (role.includes('rogue') || role.includes('hacker')) return '/images/characters/rogue.jpg';
    return '/images/characters/socialite.jpg';
  }

  // Return high-resolution realistic cinematic scene photograph matching setting and act
  return getSmartSceneBackdrop({
    genre: inputs.genre || 'Nollywood Drama',
    chapterNumber: inputs.chapter_number || 1,
    settingDescription: inputs.setting_description || inputs.scene_heading || '',
    tone: inputs.tone || '',
    variationIndex: inputs.variationIndex || 0,
  }).url;
}


function getRealisticCharacterSvg(name: string, role: string, genre: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash << 5) - hash + name.charCodeAt(i);
  const colorIndex = Math.abs(hash) % 5;

  const skinTones = ['#8d5524', '#c68642', '#e0ac69', '#f1c27d', '#50331e'];
  const skin = skinTones[Math.abs(hash) % skinTones.length];
  const hairColors = ['#09090b', '#1c1917', '#292524', '#18181b', '#0f172a'];
  const hair = hairColors[(Math.abs(hash) >> 2) % hairColors.length];
  const outfitAccents = ['#eab308', '#ec4899', '#38bdf8', '#a855f7', '#10b981'];
  const accent = outfitAccents[colorIndex];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
    <defs>
      <linearGradient id="charBg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#18181b" />
        <stop offset="100%" stop-color="#09090b" />
      </linearGradient>
      <radialGradient id="rimLight" cx="30%" cy="20%" r="70%">
        <stop offset="0%" stop-color="${accent}" stop-opacity="0.6" />
        <stop offset="60%" stop-color="${accent}" stop-opacity="0.1" />
        <stop offset="100%" stop-color="transparent" stop-opacity="0" />
      </radialGradient>
      <linearGradient id="skinGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${skin}" />
        <stop offset="100%" stop-color="#2d1a0e" />
      </linearGradient>
    </defs>
    
    <rect width="400" height="400" rx="32" fill="url(#charBg)" />
    <circle cx="150" cy="120" r="180" fill="url(#rimLight)" />

    <path d="M 60 380 Q 200 310 340 380 L 340 400 L 60 400 Z" fill="#1c1917" />
    <path d="M 120 340 L 200 375 L 280 340 Z" fill="${accent}" opacity="0.9" />

    <rect x="175" y="240" width="50" height="70" rx="8" fill="url(#skinGrad)" />
    <ellipse cx="200" cy="190" rx="65" ry="85" fill="url(#skinGrad)" />

    <path d="M 130 190 Q 120 100 200 95 Q 280 100 270 190 Q 250 120 200 125 Q 150 120 130 190 Z" fill="${hair}" />

    <ellipse cx="175" cy="180" rx="8" ry="5" fill="#ffffff" />
    <circle cx="175" cy="180" r="3.5" fill="#18181b" />
    <ellipse cx="225" cy="180" rx="8" ry="5" fill="#ffffff" />
    <circle cx="225" cy="180" r="3.5" fill="#18181b" />
    
    <path d="M 160 165 Q 175 160 190 166" stroke="#18181b" stroke-width="3.5" fill="none" stroke-linecap="round" />
    <path d="M 210 166 Q 225 160 240 165" stroke="#18181b" stroke-width="3.5" fill="none" stroke-linecap="round" />

    <path d="M 197 185 L 195 205 L 205 205" stroke="#2d1a0e" stroke-width="2.5" fill="none" stroke-linecap="round" />
    <path d="M 180 225 Q 200 240 220 225" stroke="#ffffff" stroke-width="3.5" fill="none" stroke-linecap="round" />

    <path d="M 135 150 Q 130 230 170 265" stroke="${accent}" stroke-width="3" fill="none" opacity="0.8" />

    <rect x="20" y="340" width="360" height="42" rx="12" fill="#000000" fill-opacity="0.75" />
    <text x="200" y="360" text-anchor="middle" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="bold">${name}</text>
    <text x="200" y="375" text-anchor="middle" fill="${accent}" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="600">${role}</text>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

