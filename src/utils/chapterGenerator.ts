import type {
  SceneSwapChapterResult,
  SceneSwapCastMember,
  SceneSwapScriptLine,
  SceneSwapPlotChoice,
} from '../App';

interface GenerateOptions {
  players: string[];
  genre: string;
  tone: string;
  wildcardHook?: string;
  chapterNumber: number;
  chosenChoice?: SceneSwapPlotChoice | string;
}

export function generateClientFallbackChapter({
  players,
  genre,
  tone,
  wildcardHook,
  chapterNumber,
  chosenChoice,
}: GenerateOptions): SceneSwapChapterResult {
  const safePlayers = players.length >= 2 ? players : ['Director Alex', 'Star Taylor', 'Co-Star Morgan'];
  const p1 = safePlayers[0];
  const p2 = safePlayers[1];
  const p3 = safePlayers[2] || 'Special Guest Jordan';
  const p4 = safePlayers[3] || 'Cameo Riley';

  const isFinale = chapterNumber >= 3;

  const archetypePool = [
    { name: 'The Mastermind', role: 'Chief Strategist', motivation: 'Control the outcome', secret: 'Has a hidden tracker' },
    { name: 'The Wildcard', role: 'Adrenaline Junkie', motivation: 'Stir pure chaos', secret: 'Swapped the real evidence' },
    { name: 'The Skeptic', role: 'Security Specialist', motivation: 'Survive the night', secret: 'Recorded every confession' },
    { name: 'The Opportunist', role: 'Insider Broker', motivation: 'Walk away rich', secret: 'Already called the backup team' },
  ];

  const cast: SceneSwapCastMember[] = safePlayers.map((name, i) => {
    const arch = archetypePool[i % archetypePool.length];
    return {
      player: name,
      role: `${name} (${arch.role})`,
      archetype: arch.name,
      motivation: arch.motivation,
      secret: arch.secret,
      wardrobe: `Bespoke tailored ${genre} attire.`,
      props: 'Encrypted communication earpiece.',
    };
  });

  const actTitles: Record<number, string> = {
    1: 'Act I: The Flashpoint',
    2: 'Act II: The Breaking Point',
    3: 'Act III: The Grand Climax',
  };

  const choiceLabel = typeof chosenChoice === 'string'
    ? chosenChoice
    : chosenChoice?.label || '';

  const script_lines: SceneSwapScriptLine[] = [
    {
      speaker: p1,
      direction: '[Staring down the lens with unwavering cinematic intensity]',
      line: `We didn't come this far in ${genre} to walk away empty-handed. Look at the board!`,
    },
    {
      speaker: p2,
      direction: '[Slamming hand onto the metal table, voice shaking with adrenaline]',
      line: `You're out of your mind! The entire grid is already tracking our coordinates!`,
    },
    {
      speaker: p3,
      direction: '[Unfolding the encrypted blueprint and stepping between them]',
      line: `Both of you calm down! If we trigger the alarm now, nobody leaves this perimeter alive!`,
    },
    ...(safePlayers.length >= 4 ? [
      {
        speaker: p4,
        direction: '[Peering through the blinds and cocking a sidearm]',
        line: `Too late. Black SUVs just pulled into the loading dock. We have sixty seconds!`,
      },
    ] : []),
    {
      speaker: p1,
      direction: '[Stepping forward with a chilling, confident smirk]',
      line: wildcardHook
        ? `Remember the plan: "${wildcardHook}". We execute right now!`
        : `That's exactly what I was counting on. Initiate stage two!`,
    },
    {
      speaker: p2,
      direction: '[Desperately keying the override code into the terminal]',
      line: choiceLabel
        ? `You voted to ${choiceLabel}, and now the consequence is staring us in the face!`
        : `If this code fails, don't say I didn't warn you!`,
    },
    {
      speaker: p3,
      direction: '[Turning toward the team with breath caught in throat]',
      line: isFinale
        ? `This is it! Everything we risked comes down to this final call!`
        : `We have a choice to make, team. Do we strike or retreat?!`,
    },
  ];

  const plot_choices: SceneSwapPlotChoice[] = isFinale ? [] : [
    {
      id: 'A',
      label: 'Trigger the EMP Override',
      description: 'Cut electrical power to all perimeter gates and surveillance cams.',
      consequence_hint: 'Shuts down all electronics, but plunges the compound into pitch black.',
    },
    {
      id: 'B',
      label: 'Bluff Through the Security Gate',
      description: 'Flash diplomatic badges and talk your way past the armed perimeter.',
      consequence_hint: 'High risk social deception with guaranteed high drama.',
    },
    {
      id: 'C',
      label: 'Deploy the Wildcard Detour',
      description: 'Trigger the smoke diversion in the courtyard to isolate the boss.',
      consequence_hint: 'Sacrifice the main asset to expose the mole inside.',
    },
  ];

  return {
    chapter_number: chapterNumber,
    chapter_title: `${genre}: ${actTitles[chapterNumber] || `Act ${chapterNumber}`}`,
    genre,
    tone,
    scene_heading: `INT. HIGH-TENSION CONTROL SUITE - ${genre.toUpperCase()} HEADQUARTERS - MIDNIGHT`,
    setting_description: `A shadowy high-tech chamber bathed in amber terminal lights and tension so thick you can cut it with a knife.`,
    audio_cue: 'Deep, resonant cinematic sub-bass drone and rhythmic tension clock tick.',
    cast,
    script_lines,
    plot_choices,
    is_finale: isFinale,
    finale_summary: isFinale
      ? `The confrontation reaches its stunning peak. The ensemble stands triumphant as the dust clears over ${genre}.`
      : undefined,
  };
}
