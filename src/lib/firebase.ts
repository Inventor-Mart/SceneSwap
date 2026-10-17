import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  getDocs,
  type Firestore,
} from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type Auth,
  type User,
} from 'firebase/auth';
import firebaseAppletConfig from '../../firebase-applet-config.json';

/**
 * SceneSwap Firebase Configuration
 */
export interface SceneSwapFirebaseConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain?: string;
  firestoreDatabaseId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
}

const defaultFirebaseConfig: SceneSwapFirebaseConfig = {
  projectId: firebaseAppletConfig.projectId,
  appId: firebaseAppletConfig.appId,
  apiKey: firebaseAppletConfig.apiKey,
  authDomain: firebaseAppletConfig.authDomain,
  firestoreDatabaseId: firebaseAppletConfig.firestoreDatabaseId,
  storageBucket: firebaseAppletConfig.storageBucket,
  messagingSenderId: firebaseAppletConfig.messagingSenderId,
};

function getStoredSceneSwapConfig(): SceneSwapFirebaseConfig | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('sceneswap_firebase_config');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading SceneSwap firebase config:', e);
  }
  return null;
}

export const activeSceneSwapConfig: SceneSwapFirebaseConfig =
  getStoredSceneSwapConfig() || defaultFirebaseConfig;

export const isSceneSwapFirebaseConfigured = true;

// Initialize Firebase App
export const app: FirebaseApp = !getApps().length
  ? initializeApp(activeSceneSwapConfig)
  : getApp();

export const db: Firestore = getFirestore(
  app,
  activeSceneSwapConfig.firestoreDatabaseId || '(default)'
);

export const auth: Auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export function setRuntimeSceneSwapFirebaseConfig(cfg: SceneSwapFirebaseConfig) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('sceneswap_firebase_config', JSON.stringify(cfg));
    window.location.reload();
  }
}

// SceneSwap Saved Shoot Interface
export interface SceneSwapSavedShoot {
  id: string;
  title: string;
  genre: string;
  players: string[];
  chaptersCount: number;
  lastChapterNumber: number;
  createdAt: string;
  updatedAt: string;
}

export interface SavedSceneSwapData {
  activeChapter?: any;
  partyPlayers?: string[];
  playerCustomPhotos?: Record<string, string>;
  selectedGenre?: string;
  premiseSeed?: string;
  activeScriptMode?: 'comic' | 'studio' | 'stage' | 'portrait';
  isSoundMuted?: boolean;
  isDirectorPro?: boolean;
  updatedAt?: string;
  [key: string]: any;
}

/**
 * Save user session data to Firestore and LocalStorage
 */
export async function saveUserSceneSwapData(userId: string, data: Partial<SavedSceneSwapData>): Promise<void> {
  try {
    const raw = localStorage.getItem(`sceneswap_user_${userId}`) || '{}';
    const merged = { ...JSON.parse(raw), ...data, updatedAt: new Date().toISOString() };
    localStorage.setItem(`sceneswap_user_${userId}`, JSON.stringify(merged));
  } catch (e) {
    console.warn('Failed to save user data locally:', e);
  }

  if (db && userId) {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, data, { merge: true });
    } catch (err) {
      console.warn('Failed to sync user data to Firestore:', err);
    }
  }
}

/**
 * Load user session data from Firestore or LocalStorage
 */
export async function loadUserSceneSwapData(userId: string): Promise<SavedSceneSwapData | null> {
  if (db && userId) {
    try {
      const userRef = doc(db, 'users', userId);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        return snap.data() as SavedSceneSwapData;
      }
    } catch (err) {
      console.warn('Error loading user data from Firestore:', err);
    }
  }

  try {
    const raw = localStorage.getItem(`sceneswap_user_${userId}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return null;
}

/**
 * Connectivity test probe
 */
export async function testConnection(): Promise<boolean> {
  if (!db) return false;
  try {
    const testDoc = doc(db, 'test', 'probe');
    await getDoc(testDoc);
    return true;
  } catch {
    return false;
  }
}

/**
 * Save a SceneSwap shoot to Firestore (or local storage fallback)
 */
export async function saveSceneSwapShoot(shoot: SceneSwapSavedShoot, userId?: string) {
  try {
    const raw = localStorage.getItem('sceneswap_shoots_history') || '[]';
    const list: SceneSwapSavedShoot[] = JSON.parse(raw);
    const existingIdx = list.findIndex(s => s.id === shoot.id);
    if (existingIdx >= 0) {
      list[existingIdx] = shoot;
    } else {
      list.unshift(shoot);
    }
    localStorage.setItem('sceneswap_shoots_history', JSON.stringify(list.slice(0, 20)));
  } catch (e) {
    console.warn('Failed to save shoot locally', e);
  }

  if (db && userId) {
    try {
      const shootRef = doc(db, 'users', userId, 'sceneswap_shoots', shoot.id);
      await setDoc(shootRef, shoot, { merge: true });
    } catch (err) {
      console.warn('Failed to sync shoot to SceneSwap Firestore', err);
    }
  }
}

/**
 * Retrieve saved SceneSwap shoots
 */
export async function getSceneSwapShoots(userId?: string): Promise<SceneSwapSavedShoot[]> {
  if (db && userId) {
    try {
      const shootsRef = collection(db, 'users', userId, 'sceneswap_shoots');
      const snap = await getDocs(query(shootsRef));
      if (!snap.empty) {
        return snap.docs.map(d => d.data() as SceneSwapSavedShoot);
      }
    } catch (err) {
      console.warn('Error fetching shoots from Firestore, using local cache', err);
    }
  }

  try {
    const raw = localStorage.getItem('sceneswap_shoots_history') || '[]';
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
};
