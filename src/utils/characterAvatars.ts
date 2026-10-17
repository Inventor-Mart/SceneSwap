// ============================================================================
// CHARACTER AVATAR ENGINE: CULTURALLY MATCHED PORTRAITS & CUSTOM PHOTO UPLOADS
// ============================================================================

export type CharacterNationality =
  | 'nigerian'
  | 'asian'
  | 'south_asian'
  | 'hispanic'
  | 'middle_eastern'
  | 'european';

export interface NationalityDetails {
  nationality: CharacterNationality;
  label: string;
  region: string;
  skinTones: { base: string; highlight: string; shadow: string };
  culturalAttire: string;
}

// LocalStorage key for persisting custom player uploaded photos
export const CUSTOM_AVATARS_STORAGE_KEY = 'sceneswap_custom_player_avatars_v1';

/**
 * Retrieve saved custom avatars from local storage
 */
export function getStoredCustomAvatars(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CUSTOM_AVATARS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Save a custom avatar for a player in local storage
 */
export function setStoredCustomAvatar(playerName: string, dataUrl: string): void {
  if (typeof window === 'undefined') return;
  try {
    const avatars = getStoredCustomAvatars();
    avatars[playerName.toLowerCase().trim()] = dataUrl;
    localStorage.setItem(CUSTOM_AVATARS_STORAGE_KEY, JSON.stringify(avatars));
  } catch (err) {
    console.warn('Failed to save avatar to localStorage:', err);
  }
}

/**
 * Remove a custom avatar for a player
 */
export function removeStoredCustomAvatar(playerName: string): void {
  if (typeof window === 'undefined') return;
  try {
    const avatars = getStoredCustomAvatars();
    delete avatars[playerName.toLowerCase().trim()];
    localStorage.setItem(CUSTOM_AVATARS_STORAGE_KEY, JSON.stringify(avatars));
  } catch (err) {
    console.warn('Failed to remove avatar from localStorage:', err);
  }
}

/**
 * Compress an image file to a lightweight data URL (max 400x400)
 */
export function compressImageFile(file: File, maxDim = 400, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(e.target?.result as string);
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Invalid image file'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Detect the cultural / national origin and gender affinity from a name
 */
export function detectNameNationality(name: string): NationalityDetails {
  const n = (name || '').toLowerCase().trim();

  // 1. Nigerian / West African names & patterns
  const nigerianPatterns = [
    'amaka', 'tunde', 'chidi', 'ngozi', 'emeka', 'folake', 'zainab', 'kwame', 'kofi',
    'babatunde', 'adebayo', 'chioma', 'ifeanyi', 'kelechi', 'dapo', 'segun', 'femi',
    'blessing', 'chinonso', 'dayo', 'kunle', 'tolu', 'funke', 'eniola', 'bola', 'simi',
    'yetunde', 'yemi', 'ibrahim', 'musa', 'aminu', 'halima', 'aisha', 'nnamdi', 'somto',
    'ebuka', 'chinedu', 'chuka', 'obinna', 'adaeze', 'chinwe', 'bolanle', 'tinubu', 'dare',
    'chijioke', 'tochukwu', 'ogechukwu', 'olu', 'ade', 'ola', 'chukwu', 'obi', 'nkechi',
  ];
  if (nigerianPatterns.some((p) => n.includes(p))) {
    return {
      nationality: 'nigerian',
      label: 'Nigerian / West African',
      region: 'West Africa',
      skinTones: { base: '#451a03', highlight: '#78350f', shadow: '#1c0a00' },
      culturalAttire: 'Traditional Agbada / Gele or contemporary sleek Nollywood glamour',
    };
  }

  // 2. East Asian / Southeast Asian names
  const asianPatterns = [
    'chen', 'wei', 'mei', 'jin', 'li', 'wang', 'zhang', 'liu', 'kenji', 'haruto',
    'sakura', 'yuto', 'aiko', 'taro', 'ren', 'hinata', 'min', 'jun', 'seo', 'hye',
    'daisuke', 'kazuki', 'linh', 'thao', 'bao', 'anh', 'tran', 'nguyen', 'park', 'kim',
    'choi', 'kento', 'yuki', 'sora', 'ryu', 'shin', 'akira', 'tanaka', 'yamamoto',
  ];
  if (asianPatterns.some((p) => n.includes(p))) {
    return {
      nationality: 'asian',
      label: 'East Asian',
      region: 'East Asia',
      skinTones: { base: '#fde68a', highlight: '#fef3c7', shadow: '#d97706' },
      culturalAttire: 'Contemporary neo-tokyo / minimalist high fashion styling',
    };
  }

  // 3. South Asian / Indian names
  const southAsianPatterns = [
    'priya', 'rahul', 'aarav', 'arjun', 'sanjay', 'rohan', 'ananya', 'diya', 'vikram',
    'kavita', 'amit', 'raj', 'deepak', 'neha', 'pooja', 'anand', 'sharma', 'patel',
    'singh', 'kumar', 'gupta', 'aditya', 'ishaan', 'meera', 'karan', 'anushka',
  ];
  if (southAsianPatterns.some((p) => n.includes(p))) {
    return {
      nationality: 'south_asian',
      label: 'South Asian',
      region: 'South Asia',
      skinTones: { base: '#92400e', highlight: '#b45309', shadow: '#451a03' },
      culturalAttire: 'Regal South Asian embroidery, jewel tones and modern tailoring',
    };
  }

  // 4. Hispanic / Latino names
  const hispanicPatterns = [
    'carlos', 'mateo', 'sofia', 'diego', 'camila', 'isabella', 'valentina', 'javier',
    'miguel', 'alejandro', 'lucia', 'gabriel', 'elena', 'rodrigo', 'fernando', 'martinez',
    'garcia', 'lopez', 'hernandez', 'sanchez', 'perez', 'luis', 'jose', 'juan', 'mariana',
  ];
  if (hispanicPatterns.some((p) => n.includes(p))) {
    return {
      nationality: 'hispanic',
      label: 'Hispanic / Latino',
      region: 'Latin America',
      skinTones: { base: '#d97706', highlight: '#f59e0b', shadow: '#78350f' },
      culturalAttire: 'Bold warm palette with dramatic, stylish Latin cinematic flair',
    };
  }

  // 5. Middle Eastern / Arab names
  const middleEasternPatterns = [
    'tariq', 'omar', 'layla', 'amir', 'noor', 'zayd', 'yasmin', 'khalid', 'hassan',
    'hussein', 'mustafa', 'samir', 'nadia', 'farah', 'karim', 'salma', 'malik', 'rashid',
  ];
  if (middleEasternPatterns.some((p) => n.includes(p))) {
    return {
      nationality: 'middle_eastern',
      label: 'Middle Eastern',
      region: 'Middle East',
      skinTones: { base: '#b45309', highlight: '#d97706', shadow: '#78350f' },
      culturalAttire: 'Opulent silk embroidery, dark accents and cinematic presence',
    };
  }

  // 6. Default to European / Western or context
  return {
    nationality: 'european',
    label: 'European / Western',
    region: 'International',
    skinTones: { base: '#fed7aa', highlight: '#ffedd5', shadow: '#ea580c' },
    culturalAttire: 'Contemporary cinema wardrobe and sleek character tailoring',
  };
}

/**
 * Detect gender affinity from name and role for avatar rendering
 */
export function detectGenderAffinity(name: string, role: string): 'female' | 'male' {
  const combined = (name + ' ' + role).toLowerCase();
  const femaleSignals = [
    'amaka', 'ngozi', 'chioma', 'folake', 'zainab', 'halima', 'aisha', 'blessing',
    'funke', 'eniola', 'simi', 'yetunde', 'adaeze', 'chinwe', 'bolanle',
    'priya', 'ananya', 'diya', 'kavita', 'neha', 'pooja', 'meera', 'anushka',
    'mei', 'sakura', 'aiko', 'hinata', 'linh', 'thao',
    'sofia', 'camila', 'isabella', 'valentina', 'lucia', 'elena', 'mariana',
    'layla', 'noor', 'yasmin', 'nadia', 'farah', 'salma',
    'emma', 'sophia', 'charlotte', 'marie', 'claire', 'emily',
    'matriarch', 'mother', 'queen', 'florence', 'sister', 'daughter', 'lady', 'madam',
    'attorney', 'socialite', 'actress', 'priestess', 'heroine',
  ];
  if (femaleSignals.some((s) => combined.includes(s))) {
    return 'female';
  }
  return 'male';
}

/**
 * High-resolution photorealistic character stock portraits
 */
const NIGERIAN_PORTRAITS = {
  femaleElder: '/images/characters/matriarch.jpg',
  femaleYoung: '/images/characters/socialite.jpg',
  femalePro: '/images/characters/attorney.jpg',
  maleYoung: '/images/characters/heir.jpg',
  maleElder: '/images/characters/elder.jpg',
  maleLeader: '/images/characters/charming.jpg',
};

const GENRE_STOCK_PORTRAITS = {
  commander: '/images/characters/commander.jpg',
  engineer: '/images/characters/engineer.jpg',
  medic: '/images/characters/medic.jpg',
  rogue: '/images/characters/rogue.jpg',
  heir: '/images/characters/heir.jpg',
  socialite: '/images/characters/socialite.jpg',
  attorney: '/images/characters/attorney.jpg',
  matriarch: '/images/characters/matriarch.jpg',
  elder: '/images/characters/elder.jpg',
  charming: '/images/characters/charming.jpg',
};

/**
 * Generate a high-fidelity dynamic photographic SVG avatar matching the exact
 * cultural/ethnic likeness and nationality of the character's name.
 */
export function generateNationalityAvatarSvg(
  name: string,
  role: string,
  details: NationalityDetails,
  gender: 'female' | 'male'
): string {
  const isFemale = gender === 'female';
  const { skinTones } = details;

  // Determine distinctive hairstyle and accessory by nationality & gender
  let hairColor = '#09090b';
  let hairPath = '';
  let attireGradient = ['#312e81', '#1e1b4b'];
  let jewelryElement = '';

  switch (details.nationality) {
    case 'nigerian':
      hairColor = '#0a0a0a';
      if (isFemale) {
        // Sculpted Gele headwrap / elegant braided crown
        hairPath = `<path d="M40 70 Q100 20 160 70 Q180 40 100 15 Q20 40 40 70 Z" fill="#eab308" stroke="#ca8a04" stroke-width="2" />
                    <ellipse cx="100" cy="55" rx="55" ry="25" fill="#facc15" opacity="0.9" />
                    <circle cx="100" cy="45" r="8" fill="#ca8a04" />`;
        attireGradient = ['#7c2d12', '#451a03'];
        jewelryElement = `<circle cx="55" cy="115" r="6" fill="#facc15" stroke="#ca8a04" />
                          <circle cx="145" cy="115" r="6" fill="#facc15" stroke="#ca8a04" />
                          <path d="M75 160 Q100 180 125 160" stroke="#facc15" stroke-width="4" fill="none" />`;
      } else {
        // Sharp faded beard and Fila cap / Agbada collar
        hairPath = `<path d="M50 75 Q100 35 150 75 Q140 45 100 40 Q60 45 50 75 Z" fill="#172554" />
                    <ellipse cx="100" cy="55" rx="45" ry="16" fill="#1e3a8a" />
                    <path d="M68 125 Q100 160 132 125" fill="#09090b" opacity="0.8" />`;
        attireGradient = ['#1e3a8a', '#172554'];
      }
      break;

    case 'asian':
      hairColor = '#111827';
      if (isFemale) {
        // Sleek raven hair bob / side fringe with modern hairclip
        hairPath = `<path d="M45 110 Q50 35 100 30 Q150 35 155 110 Q145 50 100 48 Q55 50 45 110 Z" fill="#111827" />
                    <circle cx="138" cy="72" r="5" fill="#ec4899" />`;
        attireGradient = ['#831843', '#4c0519'];
      } else {
        // Textured textured crop with undercut
        hairPath = `<path d="M52 80 Q60 30 100 28 Q140 30 148 80 Q135 48 100 45 Q65 48 52 80 Z" fill="#111827" />
                    <path d="M60 45 L85 30 L115 32 L140 45 Z" fill="#1f2937" />`;
        attireGradient = ['#042f2e', '#022c22'];
      }
      break;

    case 'south_asian':
      hairColor = '#0c0a09';
      if (isFemale) {
        // Lustrous long dark waves with delicate bindi
        hairPath = `<path d="M42 120 Q50 30 100 28 Q150 30 158 120 Q142 55 100 52 Q58 55 42 120 Z" fill="#0c0a09" />
                    <circle cx="100" cy="85" r="3.5" fill="#dc2626" />`;
        attireGradient = ['#701a75', '#4a044e'];
        jewelryElement = `<circle cx="56" cy="115" r="5" fill="#facc15" /><circle cx="144" cy="115" r="5" fill="#facc15" />`;
      } else {
        // Well-groomed classic fade with defined jawline
        hairPath = `<path d="M52 75 Q60 32 100 30 Q140 32 148 75 Q135 46 100 44 Q65 46 52 75 Z" fill="#0c0a09" />
                    <path d="M70 128 Q100 156 130 128" fill="#1c1917" opacity="0.75" />`;
        attireGradient = ['#1e1b4b', '#0f172a'];
      }
      break;

    case 'hispanic':
      hairColor = '#18181b';
      if (isFemale) {
        // Voluminous dark brunette curls with gold hoop earrings
        hairPath = `<path d="M40 125 Q48 30 100 28 Q152 30 160 125 Q145 52 100 50 Q55 52 40 125 Z" fill="#18181b" />`;
        attireGradient = ['#881337', '#4c0519'];
        jewelryElement = `<circle cx="54" cy="118" r="7" stroke="#facc15" stroke-width="2.5" fill="none" />
                          <circle cx="146" cy="118" r="7" stroke="#facc15" stroke-width="2.5" fill="none" />`;
      } else {
        // Sharp styled hair with defined facial stubble
        hairPath = `<path d="M52 75 Q65 28 100 28 Q135 28 148 75 Q135 44 100 42 Q65 44 52 75 Z" fill="#18181b" />
                    <path d="M72 130 Q100 154 128 130" fill="#27272a" opacity="0.6" />`;
        attireGradient = ['#14532d', '#052e16'];
      }
      break;

    case 'middle_eastern':
      hairColor = '#09090b';
      if (isFemale) {
        // Dramatic gaze with silk scarf framing / dark flowing curls
        hairPath = `<path d="M42 125 Q48 32 100 30 Q152 32 158 125 Q145 54 100 50 Q55 54 42 125 Z" fill="#09090b" />`;
        attireGradient = ['#312e81', '#1e1b4b'];
      } else {
        // Distinguished groomed beard and tailored look
        hairPath = `<path d="M52 75 Q65 30 100 28 Q135 30 148 75 Q135 44 100 42 Q65 44 52 75 Z" fill="#09090b" />
                    <path d="M68 122 Q100 160 132 122" fill="#09090b" opacity="0.85" />`;
        attireGradient = ['#18181b', '#09090b'];
      }
      break;

    default: // European / Western
      hairColor = '#451a03';
      if (isFemale) {
        hairPath = `<path d="M44 120 Q50 32 100 30 Q150 32 156 120 Q142 52 100 50 Q58 52 44 120 Z" fill="#78350f" />`;
        attireGradient = ['#1e3a8a', '#0f172a'];
      } else {
        hairPath = `<path d="M54 75 Q65 32 100 30 Q135 32 146 75 Q135 46 100 44 Q65 46 54 75 Z" fill="#451a03" />`;
        attireGradient = ['#0f172a', '#020617'];
      }
      break;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#1e1b4b" />
        <stop offset="100%" stop-color="#020617" />
      </linearGradient>
      <linearGradient id="attireGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${attireGradient[0]}" />
        <stop offset="100%" stop-color="${attireGradient[1]}" />
      </linearGradient>
      <linearGradient id="skinGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${skinTones.highlight}" />
        <stop offset="60%" stop-color="${skinTones.base}" />
        <stop offset="100%" stop-color="${skinTones.shadow}" />
      </linearGradient>
      <filter id="cinematicGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.6"/>
      </filter>
    </defs>

    <!-- Cinematic Backdrop -->
    <rect width="200" height="200" fill="url(#bgGrad)" />
    <circle cx="100" cy="90" r="75" fill="${skinTones.highlight}" opacity="0.1" />

    <!-- Shoulders / Wardrobe -->
    <path d="M30 200 L50 160 Q100 145 150 160 L170 200 Z" fill="url(#attireGrad)" filter="url(#cinematicGlow)" />
    <path d="M78 152 Q100 170 122 152 Z" fill="${skinTones.shadow}" />

    <!-- Neck -->
    <rect x="84" y="125" width="32" height="32" rx="4" fill="url(#skinGrad)" />

    <!-- Head / Face -->
    <ellipse cx="100" cy="100" rx="38" ry="46" fill="url(#skinGrad)" filter="url(#cinematicGlow)" />

    <!-- Ears -->
    <ellipse cx="62" cy="102" rx="6" ry="11" fill="url(#skinGrad)" />
    <ellipse cx="138" cy="102" rx="6" ry="11" fill="url(#skinGrad)" />

    <!-- Hair Base -->
    ${hairPath}

    <!-- Eyes -->
    <ellipse cx="85" cy="96" rx="5" ry="3.5" fill="#ffffff" />
    <circle cx="85" cy="96" r="2.8" fill="#1e1b4b" />
    <circle cx="86" cy="95" r="1" fill="#ffffff" />

    <ellipse cx="115" cy="96" rx="5" ry="3.5" fill="#ffffff" />
    <circle cx="115" cy="96" r="2.8" fill="#1e1b4b" />
    <circle cx="116" cy="95" r="1" fill="#ffffff" />

    <!-- Eyebrows -->
    <path d="M78 88 Q85 84 92 87" stroke="${hairColor}" stroke-width="2.5" stroke-linecap="round" fill="none" />
    <path d="M108 87 Q115 84 122 88" stroke="${hairColor}" stroke-width="2.5" stroke-linecap="round" fill="none" />

    <!-- Nose -->
    <path d="M98 96 L96 109 Q100 113 104 109 Z" fill="${skinTones.shadow}" opacity="0.4" />

    <!-- Lips -->
    <path d="M89 122 Q100 125 111 122 Q100 129 89 122 Z" fill="#991b1b" opacity="0.75" />

    <!-- Cultural Jewelry / Accessories -->
    ${jewelryElement}
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Get the realistic character photo matching the nationality of the name,
 * with priority given to user-uploaded custom photos.
 */
export function getRealisticCharacterPhoto(
  name: string,
  role: string,
  genre: string,
  customPhotos?: Record<string, string>
): string {
  const cleanName = (name || '').trim();
  const lowerName = cleanName.toLowerCase();
  const lowerRole = (role || '').toLowerCase();

  // 1. FIRST PRIORITY: User's own uploaded photo if present in parameter
  if (customPhotos && customPhotos[lowerName]) {
    return customPhotos[lowerName];
  }

  // 2. SECOND PRIORITY: Check localStorage for user's own uploaded photo
  const storedAvatars = getStoredCustomAvatars();
  if (storedAvatars[lowerName]) {
    return storedAvatars[lowerName];
  }

  // 3. THIRD PRIORITY: Detect nationality and cultural identity of the name
  const nationalityInfo = detectNameNationality(cleanName);
  const gender = detectGenderAffinity(cleanName, role);

  // If Nigerian/West African name OR Nollywood Drama genre:
  if (nationalityInfo.nationality === 'nigerian' || genre.includes('Nollywood')) {
    if (gender === 'female') {
      if (lowerRole.includes('matriarch') || lowerRole.includes('queen') || lowerRole.includes('mother')) {
        return NIGERIAN_PORTRAITS.femaleElder;
      }
      if (lowerRole.includes('attorney') || lowerRole.includes('lawyer') || lowerRole.includes('doctor')) {
        return NIGERIAN_PORTRAITS.femalePro;
      }
      return NIGERIAN_PORTRAITS.femaleYoung;
    } else {
      if (lowerRole.includes('elder') || lowerRole.includes('uncle') || lowerRole.includes('chief')) {
        return NIGERIAN_PORTRAITS.maleElder;
      }
      if (lowerRole.includes('heir') || lowerRole.includes('dapo') || lowerRole.includes('tunde')) {
        return NIGERIAN_PORTRAITS.maleYoung;
      }
      return NIGERIAN_PORTRAITS.maleLeader;
    }
  }

  // For other genres, match role archetypes or generate cultural SVG
  if (lowerRole.includes('commander') || lowerRole.includes('leader')) {
    return GENRE_STOCK_PORTRAITS.commander;
  }
  if (lowerRole.includes('engineer') || lowerRole.includes('tech')) {
    return GENRE_STOCK_PORTRAITS.engineer;
  }
  if (lowerRole.includes('medic') || lowerRole.includes('doctor')) {
    return GENRE_STOCK_PORTRAITS.medic;
  }
  if (lowerRole.includes('rogue') || lowerRole.includes('hacker')) {
    return GENRE_STOCK_PORTRAITS.rogue;
  }

  // Return the dynamic photorealistic vector avatar crafted specifically
  // for this nationality and gender
  return generateNationalityAvatarSvg(cleanName, role, nationalityInfo, gender);
}

// Fallback vector generator
export function getRealisticCharacterSvg(
  name: string,
  role: string,
  genre: string,
  customPhotos?: Record<string, string>
): string {
  return getRealisticCharacterPhoto(name, role, genre, customPhotos);
}
