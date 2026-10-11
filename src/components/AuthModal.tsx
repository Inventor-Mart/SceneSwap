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
} from 'lucide-react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: FirebaseUser | null;
  lastSyncedAt?: string | null;
  onSyncNow?: () => Promise<void>;
  isSyncing?: boolean;
}

export function AuthModal({
  isOpen,
  onClose,
  currentUser,
  lastSyncedAt,
  onSyncNow,
  isSyncing = false,
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
  const firebaseProjectId = 'sonorous-heading-pn2tx';

  if (!isOpen) return null;

  function handleCopyDomain() {
    if (currentHost) {
      navigator.clipboard.writeText(currentHost);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2000);
    }
  }

  async function handleGoogleSignIn() {
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
    if (!email.trim() || !password.trim()) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    setIsDomainError(false);
    try {
      if (mode === 'signup') {
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }
        await createUserWithEmailAndPassword(auth, email.trim(), password);
        setSuccessMessage('Account created! Your SceneSwap party sessions will now sync to the cloud.');
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        setSuccessMessage('Signed in successfully! Loading SceneSwap party data...');
      }
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1400);
    } catch (err: any) {
      let msg = err?.message || 'Authentication failed.';
      if (err?.code === 'auth/invalid-credential' || err?.code === 'auth/user-not-found' || err?.code === 'auth/wrong-password') {
        msg = 'Invalid email or password.';
      } else if (err?.code === 'auth/email-already-in-use') {
        msg = 'This email is already registered. Please switch to Sign In.';
      } else if (err?.code === 'auth/operation-not-allowed') {
        msg = 'Email/Password sign-in is disabled in Firebase Console. Enable it in Authentication > Sign-in method.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    setLoading(true);
    try {
      await signOut(auth);
      setSuccessMessage('Signed out. Local session remains cached on this device.');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err?.message || 'Failed to sign out.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm rounded-3xl border border-indigo-500/30 bg-gradient-to-b from-slate-900 via-[#0e0a24] to-slate-950 p-6 shadow-2xl text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            <Cloud className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">
              {currentUser ? 'Cloud Account & Sync' : 'SceneSwap Cloud Account'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {currentUser ? 'Firebase Firestore Connected' : 'Sync party scripts and custom avatars across devices'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-950/40 p-2.5 text-xs text-red-300 space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>

            {isDomainError && currentHost && (
              <div className="pt-1 border-t border-red-500/20 space-y-1.5 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] text-slate-300 bg-black/40 px-2 py-1 rounded truncate flex-1">
                    {currentHost}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyDomain}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-semibold transition"
                  >
                    {copiedDomain ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    {copiedDomain ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <a
                  href={`https://console.firebase.google.com/project/${firebaseProjectId}/authentication/settings`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] text-indigo-300 hover:text-indigo-200 underline"
                >
                  Open Firebase Authorized Domains
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
            )}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {currentUser ? (
          /* User Profile & Sync Controls */
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/30 text-indigo-300 font-bold text-xs uppercase">
                  {currentUser.email ? currentUser.email[0] : 'U'}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-white truncate">
                    {currentUser.displayName || currentUser.email}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px]">
                <span className="text-slate-400">Cloud Status</span>
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Connected & Protected
                </span>
              </div>

              {lastSyncedAt && (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Last Synced</span>
                  <span className="text-slate-300">
                    {new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>

            {/* Sync Now Action */}
            {onSyncNow && (
              <button
                type="button"
                onClick={onSyncNow}
                disabled={isSyncing}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3 py-2 text-xs font-semibold text-white transition disabled:opacity-50"
              >
                {isSyncing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                )}
                {isSyncing ? 'Syncing to Firestore...' : 'Sync Current Character to Cloud'}
              </button>
            )}

            {/* Sign Out Button */}
            <button
              type="button"
              onClick={handleSignOut}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 hover:border-red-500/30 hover:bg-red-950/20 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-red-300 transition"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>
        ) : (
          /* Sign In / Sign Up Form */
          <div className="space-y-4">
            {/* Quick Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-3 py-2.5 text-xs font-semibold text-white transition shadow-sm"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-widest my-2">
              <div className="h-px flex-1 bg-white/10" />
              <span>Or with email</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 transition disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : mode === 'signin' ? (
                  'Sign In & Restore Progress'
                ) : (
                  'Create Cloud Account'
                )}
              </button>
            </form>

            {/* Toggle Sign In / Sign Up */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                  setError(null);
                }}
                className="text-xs text-indigo-300 hover:text-indigo-200 underline transition"
              >
                {mode === 'signin'
                  ? "Don't have an account? Create one"
                  : 'Already have an account? Sign In'}
              </button>
            </div>

            <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-2.5 text-[10px] text-slate-400 flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                Your character blueprint, 1,000 XP season progression, and Sovereign Pass will be permanently secured.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
