import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocFromServer,
} from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export const firebaseConfig = {
  projectId: "sonorous-heading-pn2tx",
  appId: "1:865139828790:web:524b53949759fd6ec8d097",
  apiKey: "AIzaSyDPGLnZ3pzPFef8Cz4aSreBL5ZUmhZozXw",
  authDomain: "sonorous-heading-pn2tx.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-alteregosceneswa-18262271-a1fe-4ea8-9882-dbf4dc44f9fa",
  storageBucket: "sonorous-heading-pn2tx.firebasestorage.app",
  messagingSenderId: "865139828790",
  measurementId: "",
  oAuthClientId: "865139828790-3skp7ovpj93qh8flark2nmchmrl23uqh.apps.googleusercontent.com",
};

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with the provisioned database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection per Firebase Skill specifications
export async function testConnection(): Promise<boolean> {
  const testPath = 'test/connection';
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase connection test: client is currently offline.');
    } else {
      console.warn('Firebase test connection:', error);
    }
    return false;
  }
}

// Data synchronization interfaces for SceneSwap
export interface SavedSceneSwapData {
  activeChapter: any;
  partyPlayers: string[];
  playerCustomPhotos: Record<string, string>;
  selectedGenre: string;
  premiseSeed: string;
  activeScriptMode: 'comic' | 'studio';
  isSoundMuted: boolean;
  isDirectorPro?: boolean;
  updatedAt: string;
}

/**
 * Save user SceneSwap active session, cast roster, and custom avatars to Firestore
 */
export async function saveUserSceneSwapData(userId: string, data: Partial<SavedSceneSwapData>): Promise<void> {
  if (!userId) return;
  const userPath = `users/${userId}`;
  const sessionPath = `users/${userId}/sceneswap/session`;
  const payload = {
    ...data,
    updatedAt: new Date().toISOString(),
  };

  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      uid: userId,
      is_director_pro: data.isDirectorPro ?? false,
      updated_at: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }

  try {
    const sessionRef = doc(db, 'users', userId, 'sceneswap', 'session');
    await setDoc(sessionRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, sessionPath);
  }
}

/**
 * Load user SceneSwap active session and cast roster from Firestore
 */
export async function loadUserSceneSwapData(userId: string): Promise<SavedSceneSwapData | null> {
  if (!userId) return null;
  const sessionPath = `users/${userId}/sceneswap/session`;
  try {
    const sessionRef = doc(db, 'users', userId, 'sceneswap', 'session');
    const snap = await getDoc(sessionRef);
    if (snap.exists()) {
      return snap.data() as SavedSceneSwapData;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, sessionPath);
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
