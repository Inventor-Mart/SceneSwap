# 🎬 SCENESWAP — PRODUCT REQUIREMENT DOCUMENT (PRD)

## PROJECT CODE: **SCENESWAP-01**
## PRODUCT TITLE: **SceneSwap (Interactive Multi-Branch Party Script Engine)**

**Platform Version:** 2.0.0  
**Last Updated:** October 11, 2026  
**Tech Stack:** React 19 + TypeScript + Vite + Tailwind CSS + Google Gemini AI + Firebase Firestore & Auth + Paystack Engine + Resend Email  

---

## 📜 REVISION HISTORY

| Version | Date | Author | Description of Changes |
| :--- | :--- | :--- | :--- |
| **1.0.0** | Sept 17, 2026 | Lead Architect | Initial party script concept baseline. |
| **1.1.0** | Oct 9, 2026 | Lead Architect | Added 3-Act branching screenplay pipeline with Choice Matrix voting and TikTok/Reels portrait view. |
| **2.0.0** | Oct 11, 2026 | Lead Architect | **Standalone Architecture Decoupling**: Completely separated SceneSwap into its own independent application. Removed all external character sheets and legacy RPG schemas. Upgraded Party Lobby with custom player photo avatars, realistic scene artwork generation, Gen Z soundboard FX deck, script history cloud saves, and VIP Director Pass checkout. |

---

## 🧭 1. EXECUTIVE SUMMARY & OBJECTIVES

* **Target Audience:** Friends, party hosts, casual gamers, streamers, drama clubs, and creative collectives seeking spontaneous, high-energy entertainment.
* **Core Problem:** Traditional board games and party activities suffer from predictable scripts, long setup times, passive bystanders, and lack of personalization.
* **Value Proposition:** SceneSwap turns any room or virtual hangout into an interactive movie set. Players are cast directly into hilarious, high-stakes screenplays across vibrant genres (Nollywood Drama, Cyberpunk Heist, Sci-Fi Survival, Murder Mystery, Zombie Apocalypse, Romantic Comedy, Yoruba Royal Epic, Paranormal Horror). Equipped with a teleprompter, photorealistic scene backdrops, soundboard effects, and group choice voting, every shoot is unique, personal, and unforgettable.

---

## 📦 2. DETAILED FUNCTIONAL REQUIREMENTS (FR)

### 📦 FR-1.0: THE PARTY LOBBY ENGINE
* **Player Roster Configuration:**
  * Supports 2 to 5 live party players.
  * Validation: Player names must be between 1 and 16 characters, sanitized with whitespace trimmed.
  * Quick Cast Presets: One-click roster loaders (e.g., "Lagos Squad", "London Crew", "Office Drama", "College Flat").
  * **Custom Player Avatars:** Each player slot allows uploading a custom photo or defaults to genre-authentic realistic portraits. Thumbnails display upload indicator badges and allow on-the-fly photo changes during the shoot.
* **Genre Selection:**
  * 8 Curated Genres: *Nollywood Drama*, *Cyberpunk Heist*, *Sci-Fi Survival*, *Murder Mystery*, *Zombie Apocalypse*, *Romantic Comedy*, *Yoruba Royal Epic*, and *Paranormal Horror*.
  * Interactive thematic cards displaying genre tone, badge, and suggested seed themes.
* **Premise & Wildcard Hook Input:**
  * Free-text premise input allowing custom inside jokes, office rumors, or party themes.
  * "Roll Random Premise Dice" button generates high-energy situational hooks instantly.

### 📦 FR-2.0: 3-ACT BRANCHING NARRATIVE ENGINE
* **Screenplay Structure:**
  * **Act 1: Inciting Incident & First Twist** — Establishes high-tension setup, character secret reveals, and initial conflict.
  * **Act 2: The Rising Crisis** — Escalates stakes directly driven by the group's voted choice from Act 1.
  * **Act 3: The Grand Finale** — Climax and explosive resolution with punchy final lines and memorable outcome summary.
* **Screenplay JSON Contract:**
  * `title`: Punchy movie title matching genre and premise.
  * `genre` & `tone`: Active atmosphere descriptor.
  * `scene_heading`: Standard script slugline (e.g. `INT. CHIEF ODUKOYA'S PENTHOUSE - MIDNIGHT`).
  * `setting_description`: Rich sensory backdrop details.
  * `audio_cue`: Evocative music, percussion, or environmental sound cue.
  * `cast`: Enriched cast roster mapping each player to `role`, `archetype`, `motivation`, and a quirky/dramatic `secret`.
  * `script_lines`: 6 to 9 dialogue items where each spoken line includes `speaker`, bracketed `direction` (acting delivery), and spoken `line`.
  * `plot_choices`: In Acts 1 & 2, exactly 3 distinct branching options (A, B, C) with punchy labels, descriptions, and teaser consequence hints. In Act 3, provides `is_finale: true` and `finale_summary`.

### 📦 FR-3.0: DUAL PERFORMANCE EXPERIENCES

#### Mode A: Cinematic Graphic Novel Stage
* Full-screen cinematic backdrop featuring dynamically generated realistic scene artwork or stylized SVG visuals.
* Prominent spotlight character portrait displaying the active speaker with custom player photo overlay.
* Teleprompter overlay: Tap-to-advance line progression, back button, auto-play pacing, and audio acting cue indicators.
* Live sound effect blips on speech delivery.

#### Mode B: Mobile Studio Script / TikTok View
* Vertical 9:16 portrait orientation formatted for social creators recording with friends.
* Full screenplay view with actor cue cards, line counters, and quick copy-to-clipboard functionality.

### 📦 FR-4.0: GEN Z SOUNDBOARD & AUDIO FX DECK
* Integrated multi-channel Web Audio sound engine:
  * **Vine Boom** (sub-bass impact)
  * **Suspense Sting** (tremolo tension)
  * **Record Scratch** (comedic halt)
  * **Comedic Boing** (playful pitch sweep)
  * **Thunder** (atmospheric rumble)
  * **Applause / Cheer** (celebratory audience roar)
  * **Dialogue Blips** (interactive line advance sounds)
* Global mute/unmute control with state persistence.

### 📦 FR-5.0: CHOICE MATRIX & LIVE GROUP VOTING HUB
* Appears immediately upon finishing an Act's script lines.
* Displays 3 branching paths with interactive vote counters for each player.
* Allows players to cast votes in real-time, displays live percentage bars, and locks in the winning path.
* "Roll Next Act" triggers the AI director to generate the next chapter informed by the group's decision.

### 📦 FR-6.0: CLOUD SAVES & SCRIPT EXPORTS
* **Exporting & Sharing:**
  * One-click "Copy Full Script" formatted for text sharing or table reading.
  * Native web share sheet trigger.
* **Firebase Cloud Sync:**
  * Stores active party rosters, custom avatar preferences, and finished movie scripts under `/users/{userId}/sceneswap/`.
  * Enables seamless multi-device play and persistence across sessions.

### 📦 FR-7.0: IN-APP MONETIZATION (VIP DIRECTOR PASS) & SUPPORT
* **VIP Director Pass:**
  * Unlockable via Paystack inline checkout or simulated developer mode.
  * Grants unlimited acts, customized genre crafting, and director badge.
  * Generates instant email transaction receipts via Resend.
* **Support Desk:**
  * Direct inquiry modal routing user questions and bug reports to developer support (`martorefe@gmail.com`) via Resend API.

---

## 🔒 3. SECURITY & PRIVACY SPECIFICATIONS
* Firestore database rules adhere to strict Attribute-Based Access Control (ABAC):
  * Catch-all default deny.
  * User-scoped write permissions restricted to `request.auth.uid == userId`.
  * Strict schema validation and character length limits on all script text fields.
* API credentials and Gemini keys secured server-side behind `/api/*` proxy endpoints.
