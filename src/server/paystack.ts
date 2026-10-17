/**
 * Paystack Integration Helper for SceneSwap VIP Director Pass
 * Supports inline/popup modal, standard checkout, webhooks, and verification.
 */

import fs from 'fs';
import path from 'path';

function loadStoredPaystackConfig(): { publicKey?: string; secretKey?: string } {
  try {
    const configPath = path.resolve(process.cwd(), 'paystack-runtime-config.json');
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn('Could not read paystack-runtime-config.json:', err);
  }
  return {};
}

const initialConfig = loadStoredPaystackConfig();
let runtimePaystackSecretKey: string | null = initialConfig.secretKey || null;
let runtimePaystackPublicKey: string | null = initialConfig.publicKey || null;

export function setRuntimePaystackKeys(keys: { secretKey?: string | null; publicKey?: string | null }) {
  if (keys.secretKey !== undefined) runtimePaystackSecretKey = keys.secretKey ? keys.secretKey.trim() : null;
  if (keys.publicKey !== undefined) runtimePaystackPublicKey = keys.publicKey ? keys.publicKey.trim() : null;

  try {
    const configPath = path.resolve(process.cwd(), 'paystack-runtime-config.json');
    fs.writeFileSync(
      configPath,
      JSON.stringify(
        {
          publicKey: runtimePaystackPublicKey || undefined,
          secretKey: runtimePaystackSecretKey || undefined,
        },
        null,
        2
      )
    );
  } catch (err) {
    console.warn('Could not save paystack-runtime-config.json:', err);
  }
}

export function getPaystackStatus() {
  const secretKey = runtimePaystackSecretKey || process.env.PAYSTACK_SECRET_KEY;
  const publicKey = runtimePaystackPublicKey || process.env.VITE_PAYSTACK_PUBLIC_KEY;
  const isConfigured = Boolean(secretKey && secretKey.length > 5);
  const isLive = Boolean(
    (secretKey && secretKey.startsWith('sk_live_')) ||
    (publicKey && publicKey.startsWith('pk_live_'))
  );
  const isTest = secretKey?.startsWith('sk_test_') || publicKey?.startsWith('pk_test_');

  return {
    isConfigured,
    mode: isLive ? 'live' : (isTest ? 'test' : 'simulated'),
    hasPublicKey: Boolean(publicKey),
    hasSecretKey: Boolean(secretKey),
    publicKeyMasked: publicKey ? `${publicKey.slice(0, 7)}...${publicKey.slice(-4)}` : null,
    secretKeyMasked: secretKey ? `${secretKey.slice(0, 7)}...${secretKey.slice(-4)}` : null,
    supportedCurrencies: ['NGN', 'USD'],
    pricing: {
      NGN: { label: '₦7,500', minorUnits: 750000 },
      USD: { label: '$9.99', minorUnits: 999 },
    },
  };
}

export interface PaystackInitParams {
  email: string;
  amount: number; // in minor units (e.g. 750000 kobo = 7,500 NGN)
  currency?: string; // 'NGN' | 'USD'
  reference?: string;
  callback_url?: string;
  metadata?: Record<string, any>;
  channels?: string[];
  secretKey?: string;
}

export interface PaystackInitResponse {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data?: {
    id: number;
    status: string; // 'success' | 'failed' | 'abandoned'
    reference: string;
    amount: number;
    currency: string;
    paid_at: string;
    customer?: {
      email: string;
    };
    metadata?: Record<string, any>;
  };
}

/**
 * Initialize a transaction on Paystack
 */
export async function initializePaystackTransaction(params: PaystackInitParams): Promise<PaystackInitResponse> {
  const secretKey = params.secretKey || runtimePaystackSecretKey || process.env.PAYSTACK_SECRET_KEY;
  const reference = params.reference || `SCENESWAP_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  // If no secret key provided yet, return simulated response for instant developer preview mode
  if (!secretKey) {
    return {
      status: true,
      message: 'Paystack simulated initialization (Key not configured)',
      data: {
        authorization_url: `https://checkout.paystack.com/simulate/${reference}`,
        access_code: `mock_code_${Date.now()}`,
        reference,
      },
    };
  }

  try {
    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: params.email,
        amount: params.amount,
        currency: params.currency || 'NGN',
        reference,
        callback_url: params.callback_url,
        metadata: params.metadata,
        channels: params.channels || ['card', 'bank', 'ussd', 'qr', 'bank_transfer'],
      }),
    });

    const data = await res.json();
    return data;
  } catch (error: any) {
    return {
      status: false,
      message: error?.message || 'Failed to connect to Paystack API',
    };
  }
}

/**
 * Verify a transaction reference on Paystack
 */
export async function verifyPaystackTransaction(reference: string, customSecretKey?: string): Promise<PaystackVerifyResponse> {
  const secretKey = customSecretKey || runtimePaystackSecretKey || process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    // Simulated successful verification if secret key is not yet set
    return {
      status: true,
      message: 'Simulated verification successful',
      data: {
        id: 99999999,
        status: 'success',
        reference,
        amount: 750000,
        currency: 'NGN',
        paid_at: new Date().toISOString(),
      },
    };
  }

  try {
    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secretKey.trim()}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();
    return data;
  } catch (error: any) {
    return {
      status: false,
      message: error?.message || 'Failed to verify transaction with Paystack',
    };
  }
}
