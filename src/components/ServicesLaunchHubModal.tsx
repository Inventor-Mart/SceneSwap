import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Mail,
  Copy,
  Check,
  Send,
  RefreshCw,
  Server,
  Zap,
  Info,
} from 'lucide-react';

interface ServicesLaunchHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCheckout: () => void;
  onOpenAuth?: () => void;
}

export function ServicesLaunchHubModal({
  isOpen,
  onClose,
  onOpenCheckout,
  onOpenAuth,
}: ServicesLaunchHubModalProps) {
  const [activeTab, setActiveTab] = useState<'paystack' | 'firebase' | 'resend'>('paystack');
  const [copiedTestCard, setCopiedTestCard] = useState(false);

  // Status data from server
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [servicesStatus, setServicesStatus] = useState<any>(null);

  // Paystack key inputs
  const [paystackPubKey, setPaystackPubKey] = useState('');
  const [paystackSecKey, setPaystackSecKey] = useState('');
  const [savingPaystack, setSavingPaystack] = useState(false);
  const [paystackSaveMsg, setPaystackSaveMsg] = useState<string | null>(null);

  // SceneSwap Firebase inputs
  const [fbProjectId, setFbProjectId] = useState('');
  const [fbApiKey, setFbApiKey] = useState('');
  const [fbAppId, setFbAppId] = useState('');
  const [fbDatabaseId, setFbDatabaseId] = useState('');
  const [savingFirebase, setSavingFirebase] = useState(false);
  const [firebaseSaveMsg, setFirebaseSaveMsg] = useState<string | null>(null);

  // Resend key inputs
  const [resendApiKey, setResendApiKey] = useState('');
  const [savingResend, setSavingResend] = useState(false);
  const [resendSaveMsg, setResendSaveMsg] = useState<string | null>(null);

  // Test email state
  const [testingEmail, setTestingEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      void fetchStatus();
      try {
        const storedFb = localStorage.getItem('sceneswap_firebase_config');
        if (storedFb) {
          const parsed = JSON.parse(storedFb);
          setFbProjectId(parsed.projectId || '');
          setFbApiKey(parsed.apiKey || '');
          setFbAppId(parsed.appId || '');
          setFbDatabaseId(parsed.firestoreDatabaseId || '');
        }
      } catch (e) {
        console.warn('Failed to load stored SceneSwap Firebase keys', e);
      }
    }
  }, [isOpen]);

  async function fetchStatus() {
    setLoadingStatus(true);
    try {
      const res = await fetch('/api/services/status');
      const data = await res.json();
      setServicesStatus(data);
    } catch (err) {
      console.warn('Failed to fetch services status', err);
    } finally {
      setLoadingStatus(false);
    }
  }

  function handleCopyTestCard() {
    navigator.clipboard.writeText('4084 0840 8408 4084');
    setCopiedTestCard(true);
    setTimeout(() => setCopiedTestCard(false), 2000);
  }

  async function handleSavePaystackKeys(e: React.FormEvent) {
    e.preventDefault();
    setSavingPaystack(true);
    setPaystackSaveMsg(null);
    try {
      const res = await fetch('/api/services/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paystack: {
            publicKey: paystackPubKey.trim() || null,
            secretKey: paystackSecKey.trim() || null,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPaystackSaveMsg('Paystack keys updated successfully!');
        setServicesStatus((prev: any) => ({ ...prev, paystack: data.paystack }));
      } else {
        setPaystackSaveMsg('Failed to update Paystack keys.');
      }
    } catch (err: any) {
      setPaystackSaveMsg(err?.message || 'Network error saving Paystack keys.');
    } finally {
      setSavingPaystack(false);
    }
  }

  function handleSaveFirebaseKeys(e: React.FormEvent) {
    e.preventDefault();
    setSavingFirebase(true);
    setFirebaseSaveMsg(null);
    try {
      if (!fbProjectId.trim() || !fbApiKey.trim()) {
        setFirebaseSaveMsg('Project ID and API Key are required.');
        setSavingFirebase(false);
        return;
      }
      const config = {
        projectId: fbProjectId.trim(),
        apiKey: fbApiKey.trim(),
        appId: fbAppId.trim() || '1:sceneswap:web',
        firestoreDatabaseId: fbDatabaseId.trim() || '(default)',
      };
      localStorage.setItem('sceneswap_firebase_config', JSON.stringify(config));
      setFirebaseSaveMsg('SceneSwap Firebase credentials saved! Ready to connect.');
    } catch (err: any) {
      setFirebaseSaveMsg(err?.message || 'Error saving Firebase credentials.');
    } finally {
      setSavingFirebase(false);
    }
  }

  async function handleSaveResendKey(e: React.FormEvent) {
    e.preventDefault();
    setSavingResend(true);
    setResendSaveMsg(null);
    try {
      const res = await fetch('/api/services/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resend: {
            apiKey: resendApiKey.trim() || null,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResendSaveMsg('Resend API key updated successfully!');
        setServicesStatus((prev: any) => ({ ...prev, resend: data.resend }));
      } else {
        setResendSaveMsg('Failed to update Resend key.');
      }
    } catch (err: any) {
      setResendSaveMsg(err?.message || 'Network error saving Resend key.');
    } finally {
      setSavingResend(false);
    }
  }

  async function handleSendTestEmail() {
    setTestingEmail(true);
    setTestEmailResult(null);
    try {
      const res = await fetch('/api/services/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetEmail: 'martorefe@gmail.com' }),
      });
      const data = await res.json();
      setTestEmailResult(data);
    } catch (err: any) {
      setTestEmailResult({ success: false, error: err?.message || 'Failed to dispatch test ping' });
    } finally {
      setTestingEmail(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden rounded-3xl border border-amber-500/40 bg-slate-950 p-5 shadow-2xl space-y-3">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                SceneSwap Services Hub
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Decoupled Standalone
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Shared Paystack Gateway & Dedicated SceneSwap Infrastructure
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/10 p-1 text-slate-400 hover:bg-white/20 hover:text-white transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-white/5 p-1 border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('paystack')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-medium transition cursor-pointer ${
              activeTab === 'paystack'
                ? 'bg-amber-500 text-black shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>Paystack (Shared)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('firebase')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-medium transition cursor-pointer ${
              activeTab === 'firebase'
                ? 'bg-amber-500 text-black shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Server className="h-3.5 w-3.5" />
            <span>SceneSwap Firebase</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('resend')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-medium transition cursor-pointer ${
              activeTab === 'resend'
                ? 'bg-amber-500 text-black shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mail className="h-3.5 w-3.5" />
            <span>SceneSwap Resend</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs">
          {/* TAB 1: PAYSTACK (SHARED) */}
          {activeTab === 'paystack' && (
            <div className="space-y-3.5">
              <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5" />
                    Gateway Status (Shared)
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/60 text-amber-300 border border-amber-500/30 uppercase">
                    {servicesStatus?.paystack?.mode || 'Test / Simulated'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Paystack is actively shared across both products for seamless VIP Studio Pro passes in both Naira (₦7,500) and US Dollars ($9.99).
                </p>
              </div>

              {/* Test Card Quick Helper */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Test Payment Card</span>
                  <button
                    type="button"
                    onClick={handleCopyTestCard}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-medium"
                  >
                    {copiedTestCard ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    {copiedTestCard ? 'Copied' : 'Copy Test Card'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  Card: 4084 0840 8408 4084 &bull; CVV: 408 &bull; Exp: Any future date
                </p>
              </div>

              {/* Key Config Form */}
              <form onSubmit={handleSavePaystackKeys} className="space-y-2.5 rounded-2xl border border-white/10 bg-white/5 p-3">
                <h4 className="font-bold text-white">Update Paystack Keys</h4>
                <div>
                  <label className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
                    Public Key (pk_live_... or pk_test_...)
                  </label>
                  <input
                    type="text"
                    value={paystackPubKey}
                    onChange={(e) => setPaystackPubKey(e.target.value)}
                    placeholder="pk_test_..."
                    className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
                    Secret Key (sk_live_... or sk_test_...)
                  </label>
                  <input
                    type="password"
                    value={paystackSecKey}
                    onChange={(e) => setPaystackSecKey(e.target.value)}
                    placeholder="sk_test_..."
                    className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                {paystackSaveMsg && (
                  <p className="text-[11px] text-amber-300 bg-amber-950/40 p-2 rounded-lg border border-amber-500/30">
                    {paystackSaveMsg}
                  </p>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={savingPaystack}
                    className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-400 py-2 text-xs font-bold text-black transition cursor-pointer"
                  >
                    {savingPaystack ? 'Saving...' : 'Save Paystack Keys'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCheckout();
                    }}
                    className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 transition cursor-pointer"
                  >
                    Open Checkout
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: SCENESWAP FIREBASE (DECOUPLED) */}
          {activeTab === 'firebase' && (
            <div className="space-y-3.5">
              <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                    <Server className="h-3.5 w-3.5" />
                    Dedicated SceneSwap Database
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/60 text-amber-300 border border-amber-500/30">
                    AWAITING YOUR SCENESWAP KEYS
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  The cloud database has been decoupled per your directive. SceneSwap is currently running in <strong>Local-First Mode</strong> (shoots, custom cast photos, and acts save locally).
                </p>
              </div>

              {/* Firebase Inputs */}
              <form onSubmit={handleSaveFirebaseKeys} className="space-y-2.5 rounded-2xl border border-white/10 bg-white/5 p-3">
                <h4 className="font-bold text-white">Provide SceneSwap Firebase Credentials</h4>
                <div>
                  <label className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
                    Project ID
                  </label>
                  <input
                    type="text"
                    value={fbProjectId}
                    onChange={(e) => setFbProjectId(e.target.value)}
                    placeholder="sceneswap-prod-..."
                    className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
                    Web API Key
                  </label>
                  <input
                    type="password"
                    value={fbApiKey}
                    onChange={(e) => setFbApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
                      App ID (optional)
                    </label>
                    <input
                      type="text"
                      value={fbAppId}
                      onChange={(e) => setFbAppId(e.target.value)}
                      placeholder="1:123456:web:..."
                      className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
                      Firestore Database ID
                    </label>
                    <input
                      type="text"
                      value={fbDatabaseId}
                      onChange={(e) => setFbDatabaseId(e.target.value)}
                      placeholder="(default)"
                      className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                {firebaseSaveMsg && (
                  <p className="text-[11px] text-amber-300 bg-amber-950/40 p-2 rounded-lg border border-amber-500/30">
                    {firebaseSaveMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={savingFirebase}
                  className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 py-2 text-xs font-bold text-black transition cursor-pointer"
                >
                  {savingFirebase ? 'Saving...' : 'Save SceneSwap Firebase Config'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: SCENESWAP RESEND (DECOUPLED) */}
          {activeTab === 'resend' && (
            <div className="space-y-3.5">
              <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    Dedicated SceneSwap Email Gateway
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/60 text-amber-300 border border-amber-500/30">
                    AWAITING YOUR RESEND KEY
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Enter your dedicated SceneSwap Resend API key below when ready. Support tickets and call sheets will dispatch directly to <strong>martorefe@gmail.com</strong>.
                </p>
              </div>

              {/* Resend Input Form */}
              <form onSubmit={handleSaveResendKey} className="space-y-2.5 rounded-2xl border border-white/10 bg-white/5 p-3">
                <h4 className="font-bold text-white">SceneSwap Resend API Key</h4>
                <div>
                  <input
                    type="password"
                    value={resendApiKey}
                    onChange={(e) => setResendApiKey(e.target.value)}
                    placeholder="re_..."
                    className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                {resendSaveMsg && (
                  <p className="text-[11px] text-amber-300 bg-amber-950/40 p-2 rounded-lg border border-amber-500/30">
                    {resendSaveMsg}
                  </p>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={savingResend}
                    className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-400 py-2 text-xs font-bold text-black transition cursor-pointer"
                  >
                    {savingResend ? 'Saving...' : 'Save Resend Key'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSendTestEmail}
                    disabled={testingEmail}
                    className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 transition cursor-pointer flex items-center gap-1"
                  >
                    <Send className="h-3 w-3" />
                    {testingEmail ? 'Sending...' : 'Test Ping'}
                  </button>
                </div>

                {testEmailResult && (
                  <p className={`text-[11px] p-2 rounded-lg border ${
                    testEmailResult.success
                      ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-300'
                      : 'border-rose-500/30 bg-rose-950/30 text-rose-300'
                  }`}>
                    {testEmailResult.note || testEmailResult.error || 'Test email completed.'}
                  </p>
                )}
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
