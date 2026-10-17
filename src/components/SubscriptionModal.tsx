import { useState, useEffect } from 'react';
import {
  Crown,
  Check,
  Sparkles,
  Zap,
  Film,
  Camera,
  ShieldCheck,
  X,
  CreditCard,
  ArrowRight,
  Flame,
  Star,
  Download,
  Key,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

export type SubscriptionTier = 'free' | 'vip_director' | 'creator_studio';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDirectorPro: boolean;
  currentTier?: SubscriptionTier;
  onActivateTier: (tier: SubscriptionTier) => void;
  userEmail?: string;
}

export function SubscriptionModal({
  isOpen,
  onClose,
  isDirectorPro,
  currentTier = isDirectorPro ? 'vip_director' : 'free',
  onActivateTier,
  userEmail = 'director@sceneswap.app',
}: SubscriptionModalProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'lifetime'>('lifetime');
  const [currency, setCurrency] = useState<'NGN' | 'USD'>('NGN');
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>(
    currentTier === 'free' ? 'vip_director' : currentTier
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);

  // Paystack Live / Test Mode Status & Config
  const [paystackStatus, setPaystackStatus] = useState<any>(null);
  const [showGatewayConfig, setShowGatewayConfig] = useState(false);
  const [livePubKey, setLivePubKey] = useState('');
  const [liveSecKey, setLiveSecKey] = useState('');
  const [isSavingKeys, setIsSavingKeys] = useState(false);
  const [keySaveMessage, setKeySaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/services/status')
      .then((res) => res.json())
      .then((data) => {
        if (data?.paystack) {
          setPaystackStatus(data.paystack);
        }
      })
      .catch((err) => console.warn('Could not fetch services status:', err));
  }, [isOpen]);

  async function handleSaveLiveKeys() {
    if (!livePubKey.trim() && !liveSecKey.trim()) return;
    setIsSavingKeys(true);
    setKeySaveMessage(null);
    try {
      const res = await fetch('/api/services/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paystack: {
            publicKey: livePubKey.trim() || undefined,
            secretKey: liveSecKey.trim() || undefined,
          },
        }),
      });
      const data = await res.json();
      if (data?.paystack) {
        setPaystackStatus(data.paystack);
        setKeySaveMessage(data.paystack.mode === 'live' ? '✅ Switched to Live Production Mode!' : '✅ Paystack keys updated!');
        setTimeout(() => {
          setShowGatewayConfig(false);
          setKeySaveMessage(null);
        }, 1500);
      }
    } catch (err: any) {
      setKeySaveMessage(`Failed to update keys: ${err?.message || err}`);
    } finally {
      setIsSavingKeys(false);
    }
  }

  if (!isOpen) return null;

  const pricing = {
    vip_director: {
      NGN: billingCycle === 'monthly' ? '₦4,500/mo' : '₦7,500',
      USD: billingCycle === 'monthly' ? '$4.99/mo' : '$9.99',
      kobo: billingCycle === 'monthly' ? 450000 : 750000,
      cents: billingCycle === 'monthly' ? 499 : 999,
    },
    creator_studio: {
      NGN: billingCycle === 'monthly' ? '₦12,500/mo' : '₦28,000',
      USD: billingCycle === 'monthly' ? '$14.99/mo' : '$29.99',
      kobo: billingCycle === 'monthly' ? 1250000 : 2800000,
      cents: billingCycle === 'monthly' ? 1499 : 2999,
    },
  };

  async function handleCheckout(tier: SubscriptionTier) {
    if (tier === 'free') {
      onActivateTier('free');
      onClose();
      return;
    }

    setIsProcessing(true);
    setCheckoutMessage('Initializing Paystack secure checkout...');

    const amount =
      currency === 'NGN' ? pricing[tier].kobo : pricing[tier].cents;

    try {
      const res = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          amount,
          currency,
          callback_url: typeof window !== 'undefined' ? `${window.location.origin}/?payment_tier=${tier}` : undefined,
          metadata: {
            tier,
            billingCycle,
            tierName: tier === 'vip_director' ? 'VIP Director Pass' : 'Creator Studio Pro',
          },
        }),
      });

      const data = await res.json();

      if (!data?.status || !data?.data) {
        setIsProcessing(false);
        setCheckoutMessage(
          data?.message || 'Payment initialization could not be completed. Please try again.'
        );
        setTimeout(() => setCheckoutMessage(null), 4500);
        return;
      }

      // 1. Try Paystack Inline Popup (modal stays on screen, zero redirects)
      const paystackPubKey =
        (import.meta as any).env?.VITE_PAYSTACK_PUBLIC_KEY ||
        'pk_live_287be14c6e94e43d9b380bb17915340bb55cf8ac';

      if (
        typeof window !== 'undefined' &&
        (window as any).PaystackPop &&
        data.data.reference &&
        !data.data.authorization_url?.includes('simulate')
      ) {
        try {
          const handler = (window as any).PaystackPop.setup({
            key: paystackPubKey,
            email: userEmail,
            amount,
            currency,
            ref: data.data.reference,
            callback: async function (response: { reference: string }) {
              setIsProcessing(true);
              setCheckoutMessage('Verifying payment with Paystack...');
              try {
                const verifyRes = await fetch('/api/paystack/verify', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ reference: response.reference }),
                });
                const verifyData = await verifyRes.json();
                if (verifyData?.status && verifyData?.data?.status === 'success') {
                  soundEngine.playApplause();
                  onActivateTier(tier);
                  setCheckoutMessage('🎉 Payment verified! VIP subscription activated!');
                  setTimeout(() => {
                    setIsProcessing(false);
                    setCheckoutMessage(null);
                    onClose();
                  }, 1200);
                } else {
                  setIsProcessing(false);
                  setCheckoutMessage('Payment verification unconfirmed. VIP Pass was not activated.');
                  setTimeout(() => setCheckoutMessage(null), 4500);
                }
              } catch {
                setIsProcessing(false);
                setCheckoutMessage('Network error verifying payment with server.');
                setTimeout(() => setCheckoutMessage(null), 4000);
              }
            },
            onClose: function () {
              setIsProcessing(false);
              setCheckoutMessage('Payment was cancelled. Subscription was not activated.');
              setTimeout(() => setCheckoutMessage(null), 3000);
            },
          });

          handler.openIframe();
          setCheckoutMessage(null);
          setIsProcessing(false);
          return;
        } catch (inlineErr) {
          console.warn('Paystack inline modal error, falling back to redirect:', inlineErr);
        }
      }

      // 2. Redirect fallback for full-page Paystack checkout
      if (data?.data?.authorization_url && !data.data.authorization_url.includes('simulate')) {
        window.location.href = data.data.authorization_url;
      } else {
        // If simulation or keys not configured on server, inform user - NEVER activate free pass!
        setIsProcessing(false);
        setCheckoutMessage(
          'Live Paystack keys required for real subscription checkout. VIP Pass was not activated.'
        );
        setTimeout(() => setCheckoutMessage(null), 5000);
      }
    } catch {
      setIsProcessing(false);
      setCheckoutMessage('Unable to reach payment gateway. Subscription was not activated.');
      setTimeout(() => setCheckoutMessage(null), 4000);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-5 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-amber-500/40 bg-gradient-to-b from-slate-950 via-[#0d071a] to-black p-5 sm:p-7 shadow-[0_0_60px_rgba(245,158,11,0.25)] space-y-5 my-auto">
        {/* Subtle Ambient Backlight */}
        <div className="absolute top-0 right-1/4 -z-10 h-64 w-64 bg-amber-500/10 blur-[80px] pointer-events-none rounded-full" />
        <div className="absolute bottom-0 left-1/4 -z-10 h-64 w-64 bg-purple-600/15 blur-[80px] pointer-events-none rounded-full" />

        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 shadow-md">
                <Crown className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  SceneSwap Subscriptions & VIP Passes
                </h2>
                <p className="text-xs text-amber-300 font-medium">
                  Supercharge your film sets, live game nights, and social content creation
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/10 p-1.5 text-slate-400 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Currency & Billing Period Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-2 sm:p-2.5">
          {/* Billing Cycle Tabs */}
          <div className="flex items-center gap-1 rounded-xl bg-black/50 p-1 border border-white/10">
            <button
              type="button"
              onClick={() => setBillingCycle('lifetime')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition ${
                billingCycle === 'lifetime'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Lifetime Pass</span>
              <span className="rounded bg-black/30 px-1 py-0.2 text-[9px] font-extrabold uppercase">
                Best Value
              </span>
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                billingCycle === 'monthly'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
          </div>

          {/* Currency Switcher */}
          <div className="flex items-center gap-1 rounded-xl bg-black/50 p-1 border border-white/10">
            <button
              type="button"
              onClick={() => setCurrency('NGN')}
              className={`rounded-lg px-2.5 py-1 text-xs font-mono font-bold transition ${
                currency === 'NGN'
                  ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ₦ NGN (Paystack)
            </button>
            <button
              type="button"
              onClick={() => setCurrency('USD')}
              className={`rounded-lg px-2.5 py-1 text-xs font-mono font-bold transition ${
                currency === 'USD'
                  ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-400/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              $ USD (Card)
            </button>
          </div>
        </div>

        {/* Subscription Plan Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
          {/* Plan 1: Free Host */}
          <div
            onClick={() => setSelectedTier('free')}
            className={`relative flex flex-col justify-between rounded-2xl border p-4 transition cursor-pointer ${
              selectedTier === 'free'
                ? 'border-purple-400 bg-purple-950/20 ring-1 ring-purple-400/50'
                : 'border-white/10 bg-white/5 hover:border-white/20'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Free Host
                </span>
                {currentTier === 'free' && (
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[9px] font-bold text-slate-300">
                    Current
                  </span>
                )}
              </div>
              <div>
                <span className="text-2xl font-black text-white">Free</span>
                <span className="text-xs text-slate-400 ml-1">forever</span>
              </div>
              <ul className="text-[11px] text-slate-300 space-y-1.5 pt-1">
                <li className="flex items-start gap-1.5">
                  <Check className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>3-Act Interactive Stories</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>TikTok & Screenplay View</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>2 Realistic Scene Photo Generates</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>Standard Soundboard</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCheckout('free');
              }}
              className="mt-4 w-full rounded-xl border border-white/15 bg-white/5 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 transition"
            >
              {isDirectorPro ? 'Downgrade to Free Host' : 'Keep Free'}
            </button>
          </div>

          {/* Plan 2: VIP Director Pass (Featured) */}
          <div
            onClick={() => setSelectedTier('vip_director')}
            className={`relative flex flex-col justify-between rounded-2xl border p-4 transition cursor-pointer shadow-lg ${
              selectedTier === 'vip_director'
                ? 'border-amber-400 bg-gradient-to-b from-amber-950/40 via-slate-950 to-black ring-2 ring-amber-400/60'
                : 'border-amber-500/30 bg-amber-950/10 hover:border-amber-400/50'
            }`}
          >
            {/* Best Seller Pill */}
            <div className="absolute -top-2.5 right-4 flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 py-0.5 text-[9px] font-black uppercase text-slate-950 shadow">
              <Flame className="h-3 w-3" />
              <span>Most Popular</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-1.5">
                <Crown className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                  VIP Director Pass
                </span>
              </div>

              <div>
                <span className="text-2xl font-black text-white">
                  {currency === 'NGN'
                    ? pricing.vip_director.NGN
                    : pricing.vip_director.USD}
                </span>
                <span className="text-xs text-slate-400 ml-1">
                  {billingCycle === 'lifetime' ? 'one-time' : ''}
                </span>
              </div>

              <ul className="text-[11px] text-slate-200 space-y-1.5 pt-1">
                <li className="flex items-start gap-1.5 font-medium">
                  <Star className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5 fill-amber-400" />
                  <span>Extended 5-Act Epic Campaigns</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>Unlimited Photorealistic Scene Photos</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>Custom Cinematic Visual Styles</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>VIP Crown Gold Badge across UI</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>Priority AI script generation</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCheckout('vip_director');
              }}
              disabled={isProcessing}
              className="mt-4 flex items-center justify-center gap-1.5 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-2.5 text-xs font-black text-slate-950 hover:brightness-110 transition shadow-md cursor-pointer"
            >
              <span>{isDirectorPro ? 'Renew / Update Pass' : 'Unlock VIP Pass'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Plan 3: Creator Studio Pro */}
          <div
            onClick={() => setSelectedTier('creator_studio')}
            className={`relative flex flex-col justify-between rounded-2xl border p-4 transition cursor-pointer ${
              selectedTier === 'creator_studio'
                ? 'border-pink-500 bg-pink-950/20 ring-1 ring-pink-400/60'
                : 'border-white/10 bg-white/5 hover:border-pink-500/40'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center gap-1.5">
                <Film className="h-4 w-4 text-pink-400" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-pink-300">
                  Creator Studio Pro
                </span>
              </div>

              <div>
                <span className="text-2xl font-black text-white">
                  {currency === 'NGN'
                    ? pricing.creator_studio.NGN
                    : pricing.creator_studio.USD}
                </span>
                <span className="text-xs text-slate-400 ml-1">
                  {billingCycle === 'lifetime' ? 'one-time' : ''}
                </span>
              </div>

              <ul className="text-[11px] text-slate-200 space-y-1.5 pt-1">
                <li className="flex items-start gap-1.5 font-medium">
                  <Sparkles className="h-3.5 w-3.5 text-pink-400 shrink-0 mt-0.5" />
                  <span>Everything in VIP Director Pass</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="h-3.5 w-3.5 text-pink-400 shrink-0 mt-0.5" />
                  <span>Full 9:16 Vertical Video Export</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="h-3.5 w-3.5 text-pink-400 shrink-0 mt-0.5" />
                  <span>Remove watermarks & add custom logo</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="h-3.5 w-3.5 text-pink-400 shrink-0 mt-0.5" />
                  <span>Industry Screenplay PDF & .FDX Export</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="h-3.5 w-3.5 text-pink-400 shrink-0 mt-0.5" />
                  <span>Expressive Multi-Voice AI Narration</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCheckout('creator_studio');
              }}
              disabled={isProcessing}
              className="mt-4 flex items-center justify-center gap-1.5 w-full rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 py-2.5 text-xs font-black text-white hover:brightness-110 transition shadow-md cursor-pointer"
            >
              <span>Get Creator Studio</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Processing Message */}
        {checkoutMessage && (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-amber-500/20 border border-amber-400/40 p-2.5 text-xs font-bold text-amber-200 animate-pulse">
            <Zap className="h-4 w-4 text-amber-400" />
            <span>{checkoutMessage}</span>
          </div>
        )}

        {/* Paystack Gateway Configuration Drawer */}
        {showGatewayConfig && (
          <div className="rounded-2xl border border-amber-500/30 bg-black/80 p-4 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-amber-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Paystack Mode & Live Key Setup
                </h4>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                paystackStatus?.mode === 'live' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
              }`}>
                Current: {paystackStatus?.mode === 'live' ? 'LIVE MODE (Real Charges)' : 'TEST MODE (Simulated / Test Banner)'}
              </span>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              Paystack automatically displays <strong className="text-amber-300">&ldquo;TEST&rdquo;</strong> across the checkout page when test keys (<code className="text-amber-300">pk_test_...</code> / <code className="text-amber-300">sk_test_...</code>) are used.
              To accept real payments and remove the test badge, paste your <strong className="text-emerald-300">Live API Keys</strong> from <a href="https://dashboard.paystack.com/#/settings/developer" target="_blank" rel="noreferrer" className="text-emerald-400 underline font-semibold">dashboard.paystack.com</a> below:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">
                  Paystack Public Key (Live: pk_live_... or Test: pk_test_...)
                </label>
                <input
                  type="text"
                  placeholder={paystackStatus?.publicKeyMasked || "pk_live_..."}
                  value={livePubKey}
                  onChange={(e) => setLivePubKey(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-1.5 text-xs font-mono text-white placeholder:text-slate-600 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">
                  Paystack Secret Key (Live: sk_live_... or Test: sk_test_...)
                </label>
                <input
                  type="password"
                  placeholder={paystackStatus?.secretKeyMasked || "sk_live_..."}
                  value={liveSecKey}
                  onChange={(e) => setLiveSecKey(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-1.5 text-xs font-mono text-white placeholder:text-slate-600 focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            {keySaveMessage && (
              <p className={`text-xs font-bold ${keySaveMessage.startsWith('✅') ? 'text-emerald-300' : 'text-rose-400'}`}>
                {keySaveMessage}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowGatewayConfig(false)}
                className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSaveLiveKeys}
                disabled={isSavingKeys || (!livePubKey.trim() && !liveSecKey.trim())}
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-xs font-black text-slate-950 hover:brightness-110 disabled:opacity-50 transition cursor-pointer"
              >
                {isSavingKeys ? 'Activating...' : 'Activate Live Mode'}
              </button>
            </div>
          </div>
        )}

        {/* Footer Actions: Paystack Checkout */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
          <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Paystack 256-bit SSL Encrypted · Instant Receipt via Email</span>
            {paystackStatus && (
              <button
                type="button"
                onClick={() => setShowGatewayConfig(!showGatewayConfig)}
                className="text-[10px] text-slate-500 hover:text-amber-300 transition cursor-pointer underline ml-1"
                title="Configure Live Paystack Keys"
              >
                {paystackStatus.mode === 'live' ? '🟢 Live' : '⚙️ Gateway Settings'}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleCheckout(selectedTier)}
            disabled={isProcessing}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 px-5 py-2.5 text-xs font-black text-slate-950 hover:brightness-110 transition shadow-lg active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>Pay & Activate ({currency === 'NGN' ? pricing[selectedTier === 'free' ? 'vip_director' : selectedTier].NGN : pricing[selectedTier === 'free' ? 'vip_director' : selectedTier].USD})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
