import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

async function generatePrdPdf() {
  const doc = await PDFDocument.create();
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await doc.embedFont(StandardFonts.HelveticaOblique);

  // Page dimensions: Standard Letter (612 x 792)
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;

  let currentPage = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  // Colors
  const primaryColor = rgb(0.12, 0.12, 0.28); // Deep Navy
  const accentColor = rgb(0.78, 0.45, 0.05); // Gold / Amber
  const textColor = rgb(0.15, 0.15, 0.18); // Dark Charcoal
  const subtextColor = rgb(0.4, 0.42, 0.48); // Slate Grey
  const dividerColor = rgb(0.85, 0.86, 0.9); // Light Border
  const headerBgColor = rgb(0.96, 0.96, 0.98); // Light Accent

  function checkPageBreak(neededSpace: number) {
    if (y - neededSpace < margin + 40) {
      // Draw footer on current page
      drawFooter();
      currentPage = doc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
      drawHeader();
    }
  }

  function drawHeader() {
    currentPage.drawText('SCENESWAP · PRODUCT REQUIREMENTS DOCUMENT', {
      x: margin,
      y: pageHeight - 32,
      size: 8,
      font: fontBold,
      color: subtextColor,
    });
    currentPage.drawLine({
      start: { x: margin, y: pageHeight - 38 },
      end: { x: pageWidth - margin, y: pageHeight - 38 },
      thickness: 0.5,
      color: dividerColor,
    });
  }

  function drawFooter() {
    const pageNum = doc.getPageCount();
    currentPage.drawLine({
      start: { x: margin, y: margin + 20 },
      end: { x: pageWidth - margin, y: margin + 20 },
      thickness: 0.5,
      color: dividerColor,
    });
    currentPage.drawText('SceneSwap Interactive Party Script Platform · Confidential & Proprietary', {
      x: margin,
      y: margin + 8,
      size: 7.5,
      font: fontRegular,
      color: subtextColor,
    });
    currentPage.drawText(`Page ${pageNum}`, {
      x: pageWidth - margin - 35,
      y: margin + 8,
      size: 8,
      font: fontBold,
      color: primaryColor,
    });
  }

  function addCoverOrHeroHeader(title: string, subtitle: string, meta: string) {
    // Top banner block
    currentPage.drawRectangle({
      x: margin,
      y: y - 85,
      width: contentWidth,
      height: 90,
      color: rgb(0.1, 0.08, 0.2),
    });

    currentPage.drawText('OFFICIAL PRODUCT DOCUMENTATION', {
      x: margin + 20,
      y: y - 20,
      size: 8.5,
      font: fontBold,
      color: rgb(0.95, 0.75, 0.25),
    });

    currentPage.drawText(title, {
      x: margin + 20,
      y: y - 48,
      size: 24,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    currentPage.drawText(subtitle, {
      x: margin + 20,
      y: y - 70,
      size: 11,
      font: fontRegular,
      color: rgb(0.85, 0.88, 0.95),
    });

    y -= 105;

    // Metadata pill line
    currentPage.drawText(meta, {
      x: margin,
      y,
      size: 8.5,
      font: fontItalic,
      color: subtextColor,
    });

    y -= 20;
    currentPage.drawLine({
      start: { x: margin, y },
      end: { x: pageWidth - margin, y },
      thickness: 1,
      color: dividerColor,
    });
    y -= 20;
  }

  function addSectionHeader(title: string) {
    checkPageBreak(50);
    y -= 10;
    currentPage.drawRectangle({
      x: margin,
      y: y - 18,
      width: 4,
      height: 20,
      color: accentColor,
    });
    currentPage.drawText(title.toUpperCase(), {
      x: margin + 12,
      y: y - 14,
      size: 13,
      font: fontBold,
      color: primaryColor,
    });
    y -= 26;
  }

  function addSubSectionHeader(title: string) {
    checkPageBreak(35);
    y -= 6;
    currentPage.drawText(title, {
      x: margin,
      y,
      size: 10.5,
      font: fontBold,
      color: accentColor,
    });
    y -= 16;
  }

  function addParagraph(text: string, indent: number = 0, isItalic: boolean = false) {
    const font = isItalic ? fontItalic : fontRegular;
    const fontSize = 9;
    const lineHeight = 13.5;
    const maxLineWidth = contentWidth - indent;

    // Simple word-wrap
    const words = text.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const width = font.widthOfTextAtSize(testLine, fontSize);
      if (width > maxLineWidth) {
        checkPageBreak(lineHeight);
        currentPage.drawText(currentLine, {
          x: margin + indent,
          y,
          size: fontSize,
          font,
          color: textColor,
        });
        y -= lineHeight;
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      checkPageBreak(lineHeight);
      currentPage.drawText(currentLine, {
        x: margin + indent,
        y,
        size: fontSize,
        font,
        color: textColor,
      });
      y -= lineHeight;
    }

    y -= 4; // Paragraph spacing
  }

  function addBullet(bulletTitle: string, description: string) {
    checkPageBreak(25);
    const bulletPrefix = '• ';
    const titleWidth = fontBold.widthOfTextAtSize(`${bulletPrefix}${bulletTitle}: `, 9);
    
    // Draw bullet dot + title
    currentPage.drawText(`${bulletPrefix}${bulletTitle}: `, {
      x: margin + 8,
      y,
      size: 9,
      font: fontBold,
      color: primaryColor,
    });

    // Remainder text wrapped
    const remainingWidth = contentWidth - 8 - titleWidth;
    const words = description.split(' ');
    let currentLine = '';
    let isFirstLine = true;

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const width = fontRegular.widthOfTextAtSize(testLine, 9);
      const allowedWidth = isFirstLine ? remainingWidth : contentWidth - 20;

      if (width > allowedWidth) {
        if (isFirstLine) {
          currentPage.drawText(currentLine, {
            x: margin + 8 + titleWidth,
            y,
            size: 9,
            font: fontRegular,
            color: textColor,
          });
          y -= 13;
          isFirstLine = false;
        } else {
          checkPageBreak(13);
          currentPage.drawText(currentLine, {
            x: margin + 20,
            y,
            size: 9,
            font: fontRegular,
            color: textColor,
          });
          y -= 13;
        }
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      if (isFirstLine) {
        currentPage.drawText(currentLine, {
          x: margin + 8 + titleWidth,
          y,
          size: 9,
          font: fontRegular,
          color: textColor,
        });
        y -= 13;
      } else {
        checkPageBreak(13);
        currentPage.drawText(currentLine, {
          x: margin + 20,
          y,
          size: 9,
          font: fontRegular,
          color: textColor,
        });
        y -= 13;
      }
    }

    y -= 3;
  }

  function addTable(headers: string[], rows: string[][], colWidths: number[]) {
    checkPageBreak(30 + rows.length * 20);
    y -= 6;
    const rowHeight = 18;

    // Header Row Background
    currentPage.drawRectangle({
      x: margin,
      y: y - rowHeight + 4,
      width: contentWidth,
      height: rowHeight,
      color: rgb(0.92, 0.93, 0.96),
    });

    // Headers
    let curX = margin + 6;
    headers.forEach((h, idx) => {
      currentPage.drawText(h, {
        x: curX,
        y: y - 9,
        size: 8,
        font: fontBold,
        color: primaryColor,
      });
      curX += colWidths[idx];
    });

    y -= rowHeight;

    // Rows
    rows.forEach((row, rIdx) => {
      checkPageBreak(rowHeight + 5);
      if (rIdx % 2 === 1) {
        currentPage.drawRectangle({
          x: margin,
          y: y - rowHeight + 4,
          width: contentWidth,
          height: rowHeight,
          color: rgb(0.98, 0.98, 0.99),
        });
      }

      curX = margin + 6;
      row.forEach((cell, cIdx) => {
        currentPage.drawText(cell, {
          x: curX,
          y: y - 9,
          size: 8,
          font: fontRegular,
          color: textColor,
        });
        curX += colWidths[cIdx];
      });

      currentPage.drawLine({
        start: { x: margin, y: y - rowHeight + 4 },
        end: { x: pageWidth - margin, y: y - rowHeight + 4 },
        thickness: 0.5,
        color: dividerColor,
      });

      y -= rowHeight;
    });

    y -= 8;
  }

  // -------------------------------------------------------------
  // BUILD DOCUMENT CONTENT
  // -------------------------------------------------------------

  addCoverOrHeroHeader(
    'SCENESWAP',
    'Interactive Multi-Branch Party Script Engine & Live Film Set',
    'Document Version: 3.0.0 · Publication Date: October 2026 · Status: Approved & Active'
  );

  // Section 1: Executive Summary
  addSectionHeader('1. Executive Summary & Vision');
  addParagraph(
    'SceneSwap is an interactive entertainment application designed to turn social hangouts, family game nights, creative collectives, and social media content creators into a live, collaborative movie set. By removing the steep setup time, repetitive cards, and passive bystander syndrome of traditional party games, SceneSwap casts real participants directly into gripping, comedic, and high-tension screenplays.'
  );
  addParagraph(
    'Every game session is structured as an interactive 3-Act or 5-Act cinematic story tailored to player names, custom face avatars, chosen genres, and personal inside jokes. Equipped with a portrait teleprompter, photorealistic scene backdrops, live sound effect blips, and real-time choice voting, SceneSwap delivers a complete social performance experience.'
  );

  // Section 2: Problem Statement & Value Proposition
  addSectionHeader('2. Problem Statement & Value Proposition');
  addSubSectionHeader('The Core Problems Addressed:');
  addBullet('Party Game Fatigue', 'Standard board games and card decks become predictable after a few plays and lack personalization.');
  addBullet('Improv Performance Anxiety', 'Most social groups love dramatic banter and comedy, but freeze when asked to improvise without a script.');
  addBullet('Passive Bystanders', 'Traditional party games typically allow only 1 or 2 players to act at a time while others wait disengaged.');
  addBullet('Content Creator Bottlenecks', 'Short-form video creators spend hours scripting multi-character sketches for TikTok and Instagram Reels.');

  addSubSectionHeader('The SceneSwap Solution:');
  addBullet('Personalized Character Casting', 'Friends are assigned distinct roles, secret motivations, and dramatic archetypes under their real names.');
  addBullet('Full Teleprompter Pacing', 'Each player reads punchy, customized lines with bracketed acting delivery directions right from the screen.');
  addBullet('Dynamic Branching Choice Matrix', 'At the end of each act, the room votes on 3 divergent plot directions that dynamically reshape the story.');
  addBullet('Cinematic Studio Quality', 'Photorealistic 9:16 scene backdrops and responsive acting sound effects immerse everyone into the film universe.');

  // Section 3: Target Audience & User Personas
  addSectionHeader('3. Target Audience & User Personas');
  addTable(
    ['Persona', 'Description', 'Primary Need / Goal'],
    [
      ['The Social Host', 'Organizes game nights, dinner parties, and hangouts', 'Zero-friction icebreaker that gets everyone laughing immediately'],
      ['The Creative Performer', 'Loves theater, comedy, and expressive roleplay', 'Smart dialogue and dramatic cliffhangers to showcase personality'],
      ['The TikTok / Reel Creator', 'Produces short-form comedic drama and skits', 'Ready-to-record vertical format with auto-scroll and clean visual staging'],
      ['The Remote / Streaming Crew', 'Plays over video calls, Discord, or live streaming', 'Live vote matrix where audience and remote friends steer the plot'],
    ],
    [120, 190, 202]
  );

  // Section 4: Core Functional Requirements
  addSectionHeader('4. Core Product Features & Experiences');

  addSubSectionHeader('4.1 Clean Welcome & Single-Button Entry');
  addParagraph(
    'A minimalist, welcoming arrival screen free of clutter, ads, or geometric distractions. A single prominent "Continue" call-to-action seamlessly guides users into the production studio.'
  );

  addSubSectionHeader('4.2 Party Roster & Custom Avatar Studio');
  addBullet('Cast Capacity', 'Supports 2 to 5 live party players with intuitive name entry and quick-loader presets (Lagos Squad, London Crew, Office Drama, etc.).');
  addBullet('Custom Avatar Upload', 'Players can snap or upload their real photos directly from their phone camera or select authentic genre portraits.');
  addBullet('Color Identity System', 'Each player receives a distinct color signature and badge that highlights their lines across teleprompter views.');

  addSubSectionHeader('4.3 Curated Genres & Atmosphere Engine');
  addParagraph(
    'SceneSwap provides 8 rich, culturally resonant and globally beloved entertainment genres:'
  );
  addBullet('Nollywood Drama & High Society', 'Extravagant family dynasties, contested inheritances, secret lawyers, and fiery matriarch showdowns.');
  addBullet('Sci-Fi Survival & Orbital Hazard', 'Zero-gravity airlock breaches, rogue station AI, toxic synthetic mist, and emergency space walks.');
  addBullet('Cyberpunk Heist & Neon Syndicate', 'Midnight rain, encrypted neural decks, corporate enforcers, and black market data trades.');
  addBullet('Murder Mystery & Manor Intrigue', 'Private investigators, poisoned champagne, blackmail diaries, and dramatic parlor accusations.');
  addBullet('Zombie Apocalypse & Road Survival', 'Barricaded safehouses, dwindling ammo, bite mark inspections, and desperate evacuation convoys.');
  addBullet('Romantic Comedy & Wedding Chaos', 'Fake engagements, runaway spouses, awkward rehearsal dinner toasts, and secret true confessions.');
  addBullet('Yoruba Royal Epic & Throne War', 'Ancestral crown disputes, imperial warrior oaths, sacred palace drums, and ancient dynasty secrets.');
  addBullet('Paranormal Horror & Ghost Manor', 'Flickering lights, hidden recordings, sealed attic doors, and ancient spiritual awakenings.');

  addSubSectionHeader('4.4 Extended Act Generation & Screenplay Depth');
  addParagraph(
    'Every act is composed as a full theatrical scene consisting of 14 to 20 spoken dialogue lines. Every player is guaranteed 3 to 4 substantial speaking lines with multi-beat dialogue exchanges, emotional revelations, and dramatic confrontation beats before branching voting.'
  );

  addSubSectionHeader('4.5 Dual Viewing Modes (Studio & Stage)');
  addBullet('TikTok / Reels Portrait Studio View', 'Vertical 9:16 layout designed for social filming. Unobstructed realistic scene background, live speaker highlight, and auto-scrolling dialogue teleprompter.');
  addBullet('Cinematic Stage View', 'Landscape format optimized for casting to living room television screens or projectors for audience viewing.');

  addSubSectionHeader('4.6 Photorealistic Scene Backdrops');
  addParagraph(
    'Every scene features a newly generated, realistic cinematic photograph aligned with the act’s exact setting, lighting conditions, and dramatic mood (35mm film stock, volumetric mist, anamorphic depth of field) without cartoons or illustrative vectors.'
  );

  addSubSectionHeader('4.7 Interactive Party Soundboard & FX Deck');
  addParagraph(
    'Instant acting reaction audio cues including Vine Boom, Suspense Sting, Record Scratch, Comedic Boing, Thunder Crash, and Crowd Applause to punctuate punchlines and shocking revelations.'
  );

  addSubSectionHeader('4.8 Choice Matrix & Real-Time Group Voting');
  addParagraph(
    'At the conclusion of each act, the room is presented with 3 distinct branching narrative choices (Option A, Option B, Option C), complete with consequence hints. Group voting determines the direction of the subsequent act.'
  );

  // Section 5: Subscriptions & Monetization
  addSectionHeader('5. Subscriptions, Monetization & Packaging');
  addParagraph(
    'SceneSwap operates a transparent freemium model combining instant free access for casual parties with comprehensive premium passes for power hosts and professional content creators.'
  );

  addTable(
    ['Tier', 'Pricing Model', 'Included Capabilities & Perks'],
    [
      ['Free Host', '$0 Forever', 'Standard 3-Act plays, 2 realistic scene photos per session, TikTok & Screenplay views, standard soundboard.'],
      ['VIP Director Pass', '$4.99/mo or $9.99 Lifetime (N7,500)', '5-Act Epic Campaigns, unlimited photorealistic scene photos, custom cinematic styles, VIP crown badge across UI, priority AI generation.'],
      ['Creator Studio Pro', '$14.99/mo or $29.99/yr (N28,000)', 'Everything in VIP Director, plus full 9:16 vertical video & audio export, watermark removal, Hollywood Screenplay PDF & .FDX export, multi-voice narration.'],
    ],
    [105, 135, 272]
  );

  // Section 6: User Experience & Design Constitution
  addSectionHeader('6. User Experience & Design Guidelines');
  addBullet('Anti-Clutter Discipline', 'No decorative geometric vectors or obstructive cards covering the backdrop. The cinematic frame remains clean.');
  addBullet('Zero-Lag Fallback Guarantee', 'If network or offline conditions occur, intelligent local narrative engines seamlessly deliver complete 12-line theatrical scripts.');
  addBullet('Universal Screen Support', 'Flawless responsiveness across smartphones, tablets, laptops, and smart TVs via AirPlay and Chromecast.');
  addBullet('Accessible Subtitles', 'High-contrast typography with colored speaker labels ensure legibility in dimly lit party rooms.');

  // Section 7: Success Metrics & Future Roadmap
  addSectionHeader('7. Success Metrics & Future Roadmap');
  addSubSectionHeader('Key Performance Indicators (KPIs):');
  addBullet('Session Completion Rate', 'Target: >85% of initialized parties complete all three acts.');
  addBullet('Social Sharing & Virality', 'Target: >25% of hosts copy or share final scripts to WhatsApp, TikTok, or Instagram.');
  addBullet('VIP Conversion Rate', 'Target: >6% of repeat party hosts upgrade to the VIP Director Pass.');

  addSubSectionHeader('Upcoming Roadmap Milestones:');
  addBullet('Phase 1: Multi-Device QR Join', 'Friends join room sessions on their own smartphones to vote and read private secret roles.');
  addBullet('Phase 2: Automated Multi-Voice Dubbing', 'Expressive AI voice actors automatically voice each character line for podcast export.');
  addBullet('Phase 3: Live Streamer Audience Overlay', 'Twitch and YouTube chat commands directly vote on Option A, B, or C in real time.');

  // Draw final footer on the last page
  drawFooter();

  // Save PDF to public and root directories
  const pdfBytes = await doc.save();
  const publicPath = path.resolve(process.cwd(), 'public', 'SceneSwap_Product_Requirements_Document.pdf');
  const rootPath = path.resolve(process.cwd(), 'SceneSwap_Product_Requirements_Document.pdf');

  fs.writeFileSync(publicPath, pdfBytes);
  fs.writeFileSync(rootPath, pdfBytes);

  console.log(`Successfully generated SceneSwap PRD PDF:`);
  console.log(`- ${publicPath} (${pdfBytes.length} bytes)`);
  console.log(`- ${rootPath} (${pdfBytes.length} bytes)`);
}

generatePrdPdf().catch((err) => {
  console.error('Error generating PRD PDF:', err);
  process.exit(1);
});
