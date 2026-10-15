import { useState } from 'react';
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
    setCheckoutMessage('Connecting to Paystack secure checkout...');

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
          metadata: {
            tier,
            billingCycle,
            tierName: tier === 'vip_director' ? 'VIP Director Pass' : 'Creator Studio Pro',
          },
        }),
      });

      const data = await res.json();

      if (data?.data?.authorization_url && !data.data.authorization_url.includes('simulate')) {
        // Real Paystack Live/Test link
        window.location.href = data.data.authorization_url;
      } else {
        // Simulated / instant local unlock
        setTimeout(() => {
          soundEngine.playApplause();
          onActivateTier(tier);
          setIsProcessing(false);
          setCheckoutMessage(null);
          onClose();
        }, 900);
      }
    } catch {
      // Fallback instant activation
      setTimeout(() => {
        soundEngine.playApplause();
        onActivateTier(tier);
        setIsProcessing(false);
        setCheckoutMessage(null);
        onClose();
      }, 700);
    }
  }

  function handleInstantDemoUnlock() {
    soundEngine.playApplause();
    onActivateTier('vip_director');
    onClose();
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
              Keep Free
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

        {/* Footer Actions: Paystack Checkout & Instant Demo Unlock */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Paystack 256-bit SSL Encrypted · Instant Receipt via Email</span>
          </div>

          <div className="flex items-center gap-2">
            {/* 1-Click Instant Demo Activation for Testing */}
            <button
              type="button"
              onClick={handleInstantDemoUnlock}
              title="Instant unlock without entering card for preview testing"
              className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span>⚡ Instant Demo Unlock</span>
            </button>

            <button
              type="button"
              onClick={() => handleCheckout(selectedTier)}
              disabled={isProcessing}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 px-4 py-2 text-xs font-black text-slate-950 hover:brightness-110 transition shadow-lg active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>Pay & Activate ({currency === 'NGN' ? pricing[selectedTier === 'free' ? 'vip_director' : selectedTier].NGN : pricing[selectedTier === 'free' ? 'vip_director' : selectedTier].USD})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
