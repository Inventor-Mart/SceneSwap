import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  CheckCircle2,
  AlertCircle,
  Cloud,
  LogOut,
  Sparkles,
  ShieldCheck,
  Loader2,
  ExternalLink,
  Copy,
  Check,
  Server,
} from 'lucide-react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
  activeSceneSwapConfig,
  isSceneSwapFirebaseConfigured,
} from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: FirebaseUser | null;
  lastSyncedAt?: string | null;
  onSyncNow?: () => Promise<void>;
  isSyncing?: boolean;
  onOpenServicesHub?: () => void;
}

export function AuthModal({
  isOpen,
  onClose,
  currentUser,
  lastSyncedAt,
  onSyncNow,
  isSyncing = false,
  onOpenServicesHub,
}: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDomainError, setIsDomainError] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
  const firebaseProjectId = activeSceneSwapConfig?.projectId || '';

  if (!isOpen) return null;

  function handleCopyDomain() {
    if (currentHost) {
      navigator.clipboard.writeText(currentHost);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2000);
    }
  }

  async function handleGoogleSignIn() {
    if (!auth) {
      setError('SceneSwap Firebase is not configured yet. Please configure it in the Services Hub.');
      return;
    }
    setLoading(true);
    setError(null);
    setIsDomainError(false);
    try {
      await signInWithPopup(auth, googleProvider);
      setSuccessMessage('Successfully signed in with Google!');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/unauthorized-domain') {
        setIsDomainError(true);
        setError(`Domain not authorized. Please add "${currentHost}" in Firebase Console Authorized Domains.`);
      } else if (code === 'auth/operation-not-allowed') {
        setError('Google Sign-in is disabled in Firebase Console. Go to Authentication > Sign-in method to enable it.');
      } else if (code === 'auth/popup-closed-by-user') {
        setError('Sign-in window was closed before completing.');
      } else {
        setError(err?.message || 'Failed to sign in with Google. Check pop-up settings.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    if (!auth) {
      setError('SceneSwap Firebase is not configured yet. Please configure it in the Services Hub.');
      return;
    }
    if (!email.trim() || !password.trim()) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (mode === 'signup') {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
        setSuccessMessage('Account created! Your SceneSwap party scripts will sync to the cloud.');
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        setSuccessMessage('Welcome back, Director! Signed in successfully.');
      }
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else if (code === 'auth/email-already-in-use') {
        setError('This email already has an account. Please sign in instead.');
      } else if (code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError(err?.message || 'Authentication error.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    if (!auth) return;
    try {
      await signOut(auth);
      setSuccessMessage('Signed out successfully.');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err?.message || 'Failed to sign out.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl border border-amber-500/40 bg-gradient-to-b from-slate-950 via-[#160a02] to-black p-6 shadow-[0_0_50px_rgba(245,158,11,0.25)] text-white">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Cloud className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">
                {currentUser ? 'Cloud Account & Sync' : 'SceneSwap Cloud Account'}
              </h3>
              <p className="text-[10px] text-amber-300/80 font-mono">
                {isSceneSwapFirebaseConfigured ? 'Connected to SceneSwap Cloud' : 'Local-First Mode Active'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* If Firebase not configured yet */}
        {!isSceneSwapFirebaseConfigured && !currentUser && (
          <div className="my-4 rounded-2xl border border-amber-500/30 bg-amber-950/30 p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
              <Server className="h-4 w-4 text-amber-400" />
              <span>Dedicated SceneSwap Database Ready</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              SceneSwap is operating in <strong>Local-First Mode</strong>. All party scripts, cast photos, and acts save locally on your device.
            </p>
            <p className="text-[11px] text-slate-400">
              To enable multi-device sync, you can add your custom SceneSwap Firebase credentials in the Services Hub.
            </p>
            {onOpenServicesHub && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenServicesHub();
                }}
                className="w-full mt-1 rounded-xl bg-amber-500 hover:bg-amber-400 py-2 text-xs font-bold text-black transition cursor-pointer"
              >
                Configure SceneSwap Keys in Services Hub
              </button>
            )}
          </div>
        )}

        {/* If user logged in */}
        {currentUser ? (
          <div className="my-4 space-y-4">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Authenticated Director
                </span>
                <span className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                  {currentUser.email}
                </span>
              </div>
              {lastSyncedAt && (
                <p className="text-[11px] text-slate-400">
                  Last synced: {new Date(lastSyncedAt).toLocaleTimeString()}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              {onSyncNow && (
                <button
                  type="button"
                  onClick={onSyncNow}
                  disabled={isSyncing}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 py-2.5 text-xs font-bold text-black transition cursor-pointer disabled:opacity-50"
                >
                  {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cloud className="h-4 w-4" />}
                  <span>{isSyncing ? 'Syncing...' : 'Sync Cloud Now'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-950/40 px-4 py-2.5 text-xs font-semibold text-rose-300 hover:bg-rose-900/40 transition cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : isSceneSwapFirebaseConfigured ? (
          /* Form for Firebase Sign In */
          <div className="my-4 space-y-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 py-2.5 text-xs font-semibold text-white transition cursor-pointer"
            >
              <span>Continue with Google</span>
            </button>

            <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-wider">
              <span className="flex-1 h-px bg-white/10" />
              <span>Or with email</span>
              <span className="flex-1 h-px bg-white/10" />
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-2.5">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="director@example.com"
                className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min 6 characters)"
                className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
              />

              {error && (
                <p className="text-[11px] text-rose-300 bg-rose-950/40 p-2 rounded-lg border border-rose-500/30">
                  {error}
                </p>
              )}
              {successMessage && (
                <p className="text-[11px] text-emerald-300 bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/30">
                  {successMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 py-2.5 text-xs font-bold text-black transition cursor-pointer"
              >
                {loading ? 'Processing...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <p className="text-center text-[11px] text-slate-400 pt-1">
              {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                className="text-amber-300 hover:underline font-semibold"
              >
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
