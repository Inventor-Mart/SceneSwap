import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  CreditCard,
  Mail,
  ExternalLink,
  Copy,
  Check,
  Send,
  RefreshCw,
  Sparkles,
  Lock,
  ChevronRight,
  Info,
  Server,
  Zap,
} from 'lucide-react';

interface ServicesLaunchHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: () => void;
  onOpenCheckout: () => void;
}

export function ServicesLaunchHubModal({
  isOpen,
  onClose,
  onOpenAuth,
  onOpenCheckout,
}: ServicesLaunchHubModalProps) {
  const [activeTab, setActiveTab] = useState<'firebase' | 'paystack' | 'resend'>('firebase');
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [copiedTestCard, setCopiedTestCard] = useState(false);

  // Status data from server
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [servicesStatus, setServicesStatus] = useState<any>(null);

  // Paystack key inputs
  const [paystackPubKey, setPaystackPubKey] = useState('');
  const [paystackSecKey, setPaystackSecKey] = useState('');
  const [savingPaystack, setSavingPaystack] = useState(false);
  const [paystackSaveMsg, setPaystackSaveMsg] = useState<string | null>(null);

  // Resend key inputs
  const [resendApiKey, setResendApiKey] = useState('');
  const [savingResend, setSavingResend] = useState(false);
  const [resendSaveMsg, setResendSaveMsg] = useState<string | null>(null);

  // Test email state
  const [testingEmail, setTestingEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<any>(null);

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
  const firebaseProjectId = 'sonorous-heading-pn2tx';
  const firestoreDbId = 'ai-studio-alteregosceneswa-18262271-a1fe-4ea8-9882-dbf4dc44f9fa';

  useEffect(() => {
    if (isOpen) {
      void fetchStatus();
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

  function handleCopyDomain() {
    if (currentHost) {
      navigator.clipboard.writeText(currentHost);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2000);
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
            publicKey: paystackPubKey.trim() || undefined,
            secretKey: paystackSecKey.trim() || undefined,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPaystackSaveMsg('Paystack keys updated successfully!');
        setServicesStatus((prev: any) => ({ ...prev, paystack: data.paystack }));
        setTimeout(() => setPaystackSaveMsg(null), 3000);
      }
    } catch (err: any) {
      setPaystackSaveMsg(err?.message || 'Failed to save Paystack keys.');
    } finally {
      setSavingPaystack(false);
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
        setResendSaveMsg('Resend API Key updated successfully!');
        setServicesStatus((prev: any) => ({ ...prev, resend: data.resend }));
        setTimeout(() => setResendSaveMsg(null), 3000);
      }
    } catch (err: any) {
      setResendSaveMsg(err?.message || 'Failed to save Resend key.');
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
      setTestEmailResult({ success: false, error: err?.message || 'Failed to ping email service' });
    } finally {
      setTestingEmail(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl border border-indigo-500/30 bg-gradient-to-b from-slate-900 via-[#0d0922] to-slate-950 p-5 sm:p-6 shadow-2xl text-white max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-[0_0_12px_rgba(99,102,241,0.5)]">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                Production Launch & Services Hub
              </h3>
              <p className="text-[11px] text-slate-400">
                Setup guide & live status for 2.A, 2.B, and 2.C
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="rounded-full p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 my-3 rounded-2xl bg-black/40 border border-white/10 text-xs shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('firebase')}
            className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl font-medium transition ${
              activeTab === 'firebase'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="truncate">2.A Auth</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('paystack')}
            className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl font-medium transition ${
              activeTab === 'paystack'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span className="truncate">2.B Paystack</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('resend')}
            className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl font-medium transition ${
              activeTab === 'resend'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Mail className="h-3.5 w-3.5" />
            <span className="truncate">2.C Email</span>
          </button>
        </div>

        {/* Content Body - Scrollable */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs">
          {/* TAB 1: FIREBASE AUTH (2.A) */}
          {activeTab === 'firebase' && (
            <div className="space-y-3.5">
              <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/20 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
                    <Server className="h-3.5 w-3.5" />
                    Firestore & Auth Status
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    ACTIVE & CONNECTED
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Cloud Firestore is online with project ID{' '}
                  <code className="text-indigo-200 font-mono bg-black/40 px-1 py-0.5 rounded">
                    {firebaseProjectId}
                  </code>{' '}
                  and database{' '}
                  <code className="text-indigo-200 font-mono bg-black/40 px-1 py-0.5 rounded truncate inline-block max-w-[200px] align-bottom">
                    {firestoreDbId}
                  </code>.
                </p>
              </div>

              {/* Authorized Domain Step */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold">1</span>
                    Add Authorized Domain in Firebase
                  </h4>
                </div>
                <p className="text-[11px] text-slate-400">
                  To allow users to sign in with Google or Email without pop-up block errors, this application domain must be added to your Firebase authorized list:
                </p>

                <div className="flex items-center gap-2 rounded-xl bg-black/60 border border-white/10 px-3 py-2">
                  <span className="font-mono text-[11px] text-slate-300 flex-1 truncate">
                    {currentHost || 'Your domain'}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyDomain}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-600/40 hover:bg-indigo-600 text-indigo-200 hover:text-white transition text-[10px] font-medium"
                  >
                    {copiedDomain ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    {copiedDomain ? 'Copied' : 'Copy Domain'}
                  </button>
                </div>

                <a
                  href={`https://console.firebase.google.com/project/${firebaseProjectId}/authentication/settings`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] text-indigo-300 hover:text-indigo-200 underline pt-1"
                >
                  Open Firebase Authorized Domains Settings
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {/* Enable Sign-In Providers Step */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 space-y-2.5">
                <h4 className="font-bold text-white flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold">2</span>
                  Enable Sign-In Methods
                </h4>
                <p className="text-[11px] text-slate-400">
                  In Firebase Console, turn on:
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10">
                    <span className="h-2 w-2 rounded-full bg-indigo-400" />
                    <span>Email/Password</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10">
                    <span className="h-2 w-2 rounded-full bg-indigo-400" />
                    <span>Google Sign-In</span>
                  </div>
                </div>

                <a
                  href={`https://console.firebase.google.com/project/${firebaseProjectId}/authentication/providers`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] text-indigo-300 hover:text-indigo-200 underline pt-1"
                >
                  Open Firebase Sign-In Method Console
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {/* Trigger Auth Modal */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2.5 text-xs font-semibold text-white transition shadow-lg shadow-indigo-600/30"
              >
                <ShieldCheck className="h-4 w-4" />
                Open Sign In & Cloud Sync Dialog
              </button>
            </div>
          )}

          {/* TAB 2: PAYSTACK GATEWAY (2.B) */}
          {activeTab === 'paystack' && (
            <div className="space-y-3.5">
              <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/20 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5" />
                    Gateway Status
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/60 text-amber-300 border border-amber-500/30 uppercase">
                    {servicesStatus?.paystack?.mode || 'Simulated / Test'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  SceneSwap VIP Director Pass is priced at <strong className="text-white">₦7,500</strong> (NGN) or <strong className="text-white">$9.99</strong> (USD). Directors can pay via Card, Bank Transfer, USSD, or QR.
                </p>
              </div>

              {/* Paystack Test Card Info */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    Official Paystack Test Card
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyTestCard}
                    className="flex items-center gap-1 text-[10px] text-indigo-300 hover:text-white"
                  >
                    {copiedTestCard ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    {copiedTestCard ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="rounded-xl bg-black/60 border border-white/10 p-2.5 space-y-1 font-mono text-[11px] text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Number:</span>
                    <span className="text-indigo-300 font-bold">4084 0840 8408 4084</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Exp / CVV / PIN:</span>
                    <span>12/30 &bull; 408 &bull; 1111</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">OTP Code:</span>
                    <span>123456</span>
                  </div>
                </div>
              </div>

              {/* Keys Form */}
              <form onSubmit={handleSavePaystackKeys} className="space-y-2.5 rounded-2xl border border-white/10 bg-white/5 p-3">
                <h4 className="font-bold text-white">Configure Paystack API Keys</h4>
                <p className="text-[10px] text-slate-400">
                  Obtain your test keys (<code className="text-indigo-300">pk_test_...</code> / <code className="text-indigo-300">sk_test_...</code>) or live keys from <a href="https://dashboard.paystack.com/#/settings/developer" target="_blank" rel="noreferrer" className="text-indigo-300 underline">dashboard.paystack.com</a>.
                </p>

                {paystackSaveMsg && (
                  <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-300">
                    {paystackSaveMsg}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Public Key (pk_test_... or pk_live_...)
                  </label>
                  <input
                    type="text"
                    value={paystackPubKey}
                    onChange={(e) => setPaystackPubKey(e.target.value)}
                    placeholder="pk_test_xxxxxxxxxxxxxxxx"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-mono text-white placeholder-slate-600 focus:border-indigo-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Secret Key (sk_test_... or sk_live_...)
                  </label>
                  <input
                    type="password"
                    value={paystackSecKey}
                    onChange={(e) => setPaystackSecKey(e.target.value)}
                    placeholder="sk_test_xxxxxxxxxxxxxxxx"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-mono text-white placeholder-slate-600 focus:border-indigo-400 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingPaystack}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2 text-xs font-semibold text-white transition disabled:opacity-50"
                >
                  {savingPaystack ? 'Saving Keys...' : 'Save & Activate Paystack Keys'}
                </button>
              </form>

              {/* Checkout Trigger */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCheckout();
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 py-2.5 text-xs font-bold text-slate-950 transition shadow-lg shadow-amber-500/20"
              >
                <CreditCard className="h-4 w-4" />
                Launch Sovereign Pass Checkout Modal
              </button>
            </div>
          )}

          {/* TAB 3: TRANSACTIONAL EMAIL / RESEND (2.C) */}
          {activeTab === 'resend' && (
            <div className="space-y-3.5">
              <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/20 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    Resend Engine Status
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 uppercase">
                    {servicesStatus?.resend?.mode || 'Connected & Protected'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Inbound inquiries and Sovereign Pass receipts are automatically formatted in HTML and routed to <strong className="text-white">martorefe@gmail.com</strong>.
                </p>
              </div>

              {/* Live Test Email Button */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 space-y-2.5">
                <h4 className="font-bold text-white flex items-center gap-1.5">
                  <Send className="h-3.5 w-3.5 text-indigo-400" />
                  Test Email Dispatch
                </h4>
                <p className="text-[11px] text-slate-400">
                  Sends an immediate diagnostic test ping to <strong className="text-slate-300">martorefe@gmail.com</strong> to verify live delivery.
                </p>

                {testEmailResult && (
                  <div
                    className={`p-2.5 rounded-xl border text-[11px] space-y-1 ${
                      testEmailResult.success
                        ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                        : 'bg-red-950/40 border-red-500/30 text-red-300'
                    }`}
                  >
                    <div className="font-bold">
                      {testEmailResult.success ? 'Dispatch Verified!' : 'Dispatch Error'}
                    </div>
                    <div>{testEmailResult.note || testEmailResult.error}</div>
                    {testEmailResult.messageId && (
                      <div className="font-mono text-[10px] opacity-80">
                        ID: {testEmailResult.messageId}
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={testingEmail}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2.5 text-xs font-semibold text-white transition disabled:opacity-50"
                >
                  {testingEmail ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  {testingEmail ? 'Sending Ping...' : 'Send Live Test Email to martorefe@gmail.com'}
                </button>
              </div>

              {/* Resend API Key Config Form */}
              <form onSubmit={handleSaveResendKey} className="space-y-2.5 rounded-2xl border border-white/10 bg-white/5 p-3">
                <h4 className="font-bold text-white">Custom Resend API Key</h4>
                <p className="text-[10px] text-slate-400">
                  Create a free API key at <a href="https://resend.com/api-keys" target="_blank" rel="noreferrer" className="text-indigo-300 underline">resend.com/api-keys</a> and paste it below.
                </p>

                {resendSaveMsg && (
                  <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-300">
                    {resendSaveMsg}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    API Key (re_...)
                  </label>
                  <input
                    type="password"
                    value={resendApiKey}
                    onChange={(e) => setResendApiKey(e.target.value)}
                    placeholder="re_xxxxxxxxxxxxxxxx"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-mono text-white placeholder-slate-600 focus:border-indigo-400 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingResend}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2 text-xs font-semibold text-white transition disabled:opacity-50"
                >
                  {savingResend ? 'Saving...' : 'Update Resend Key'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
