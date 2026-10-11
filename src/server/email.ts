import { Resend } from 'resend';

let runtimeResendApiKey: string | null = null;

export function setRuntimeResendApiKey(key: string | null) {
  runtimeResendApiKey = key ? key.trim() : null;
}

export function getResendStatus() {
  const apiKey = runtimeResendApiKey || process.env.RESEND_API_KEY;
  const isSet = Boolean(apiKey && apiKey.length > 5);
  const isSandbox = !isSet || apiKey?.startsWith('re_test_') || apiKey === 're_123456789';
  return {
    isConfigured: isSet,
    mode: isSet ? (isSandbox ? 'sandbox' : 'live') : 'simulated',
    targetEmail: process.env.SUPPORT_EMAIL || 'martorefe@gmail.com',
    senderEmail: process.env.RESEND_FROM_EMAIL || 'SceneSwap Support <onboarding@resend.dev>',
  };
}

export interface SupportEmailRequest {
  fromEmail?: string;
  name?: string;
  subject?: string;
  category?: string;
  message: string;
  genre?: string;
  act?: number;
  playersCount?: number;
  isPro?: boolean;
}

export interface SupportEmailResponse {
  success: boolean;
  messageId?: string;
  mode: 'live' | 'simulated';
  note?: string;
  error?: string;
}

export interface ReceiptEmailRequest {
  customerEmail: string;
  customerName?: string;
  amount: string;
  currency: string;
  reference: string;
  planName?: string;
}

export async function sendSupportEmail(payload: SupportEmailRequest): Promise<SupportEmailResponse> {
  const apiKey = runtimeResendApiKey || process.env.RESEND_API_KEY;
  const targetEmail = process.env.SUPPORT_EMAIL || 'martorefe@gmail.com';
  
  const isWebmailDomain = (email: string) => {
    const webmails = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com', 'live.com', 'msn.com'];
    return webmails.some(d => email.toLowerCase().includes(`@${d}`));
  };

  const defaultFrom = 'SceneSwap Support <onboarding@resend.dev>';
  const configuredFrom = process.env.RESEND_FROM_EMAIL?.trim();
  const fromEmail = (configuredFrom && !isWebmailDomain(configuredFrom)) ? configuredFrom : defaultFrom;

  const subjectCategory = payload.category ? `[${payload.category}] ` : '';
  const cleanSubject = payload.subject?.trim() || 'New Party Host & Director Inbound Inquiry';
  const fullSubject = `SceneSwap Support: ${subjectCategory}${cleanSubject}`;

  const userEmail = payload.fromEmail?.trim() || 'Not specified (Anonymous)';
  const senderName = payload.name?.trim() || 'Party Host / Director';
  const genre = payload.genre || 'Party Screenplay';
  const act = payload.act ? `Act ${payload.act}` : 'Act 1';
  const players = payload.playersCount !== undefined ? `${payload.playersCount} Players` : 'Ensemble Cast';
  const tier = payload.isPro ? 'VIP Director Pass' : 'Standard Host';
  const timestamp = new Date().toUTCString();

  const textBody = `
=== SCENESWAP SUPPORT DISPATCH ===
From: ${senderName} <${userEmail}>
Subject: ${cleanSubject}
Category: ${payload.category || 'General'}
Active Genre: ${genre}
Current Act: ${act} (${players})
Membership Tier: ${tier}
Timestamp: ${timestamp}

--- USER MESSAGE ---
${payload.message}

---
Dispatched via Resend Transactional Email Engine
Destination: ${targetEmail}
`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #070913; color: #f1f5f9; padding: 20px; }
    .container { max-width: 580px; margin: 0 auto; background: #0f172a; border: 1px solid rgba(168,85,247,0.3); border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #4f46e5, #7c3aed, #db2777); padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 20px; color: #fff; font-weight: 800; }
    .content { padding: 24px; }
    .meta-box { background: rgba(255,255,255,0.05); border-radius: 10px; padding: 14px; margin: 16px 0; font-size: 13px; line-height: 1.6; }
    .msg-box { background: rgba(168,85,247,0.08); border-left: 4px solid #a855f7; padding: 16px; border-radius: 4px; font-size: 14px; line-height: 1.6; color: #e2e8f0; }
    .footer { padding: 16px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid rgba(255,255,255,0.06); }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SceneSwap Support Dispatch</h1>
    </div>
    <div class="content">
      <p style="font-size: 14px; color: #94a3b8;">Inbound inquiry from party host <strong>${senderName}</strong> (&lt;${userEmail}&gt;):</p>
      <div class="meta-box">
        <strong>Category:</strong> ${payload.category || 'General'}<br>
        <strong>Genre:</strong> ${genre} &bull; ${act} (${players})<br>
        <strong>Status:</strong> ${tier}<br>
        <strong>Timestamp:</strong> ${timestamp}
      </div>
      <h3 style="font-size: 13px; text-transform: uppercase; color: #c084fc; margin-bottom: 8px;">Message:</h3>
      <div class="msg-box">
        ${payload.message.replace(/\n/g, '<br>')}
      </div>
    </div>
    <div class="footer">
      SceneSwap Interactive Party Script Engine &bull; Support: ${targetEmail}
    </div>
  </div>
</body>
</html>
`;

  if (!apiKey) {
    console.warn('[Resend] RESEND_API_KEY is not set. Simulating support dispatch to', targetEmail);
    return {
      success: true,
      mode: 'simulated',
      messageId: `sim_${Date.now()}`,
      note: `Email simulated! Target: ${targetEmail}. Set RESEND_API_KEY to send real emails.`,
    };
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [targetEmail],
      replyTo: payload.fromEmail?.trim() || undefined,
      subject: fullSubject,
      text: textBody,
      html: htmlBody,
    });

    if (error) {
      console.error('[Resend Error]', error);
      return {
        success: false,
        mode: 'live',
        error: error.message || 'Failed to dispatch email via Resend API.',
      };
    }

    return {
      success: true,
      mode: 'live',
      messageId: data?.id,
      note: 'Email successfully delivered to support desk via Resend API.',
    };
  } catch (err: any) {
    console.error('[Resend Exception]', err);
    return {
      success: false,
      mode: 'live',
      error: err?.message || 'Unexpected failure connecting to Resend API.',
    };
  }
}

export async function sendReceiptEmail(payload: ReceiptEmailRequest): Promise<SupportEmailResponse> {
  const apiKey = runtimeResendApiKey || process.env.RESEND_API_KEY;
  const targetEmail = payload.customerEmail.trim();
  const adminEmail = process.env.SUPPORT_EMAIL || 'martorefe@gmail.com';
  const defaultFrom = 'SceneSwap Pass <onboarding@resend.dev>';
  const configuredFrom = process.env.RESEND_FROM_EMAIL?.trim();
  const fromEmail = (configuredFrom && !configuredFrom.includes('@gmail.com')) ? configuredFrom : defaultFrom;

  const subject = `SceneSwap VIP Director Pass Receipt - Reference #${payload.reference.slice(-8).toUpperCase()}`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #070913; color: #f1f5f9; padding: 24px; }
    .container { max-width: 600px; margin: 0 auto; background: #0f172a; border: 1px solid rgba(168,85,247,0.3); border-radius: 20px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #4f46e5, #7c3aed, #db2777); padding: 32px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 800; color: #fff; }
    .content { padding: 28px 24px; }
    .badge { display: inline-block; padding: 6px 14px; border-radius: 9999px; font-size: 12px; font-weight: 700; background: rgba(234,179,8,0.2); color: #fde047; border: 1px solid rgba(234,179,8,0.4); margin-bottom: 20px; }
    .receipt-box { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; margin: 20px 0; }
    .footer { padding: 20px 24px; background: rgba(0,0,0,0.3); border-top: 1px solid rgba(255,255,255,0.06); font-size: 11px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>VIP Director Pass Unlocked 🎬</h1>
      <p style="margin: 8px 0 0; font-size: 12px; color: rgba(255,255,255,0.85);">SceneSwap Interactive Film Engine</p>
    </div>
    <div class="content">
      <div style="text-align: center;">
        <span class="badge">&starf; VIP DIRECTOR PASS &starf;</span>
      </div>
      <p style="font-size: 14px; color: #e2e8f0;">
        Greetings <strong>${payload.customerName || 'Director'}</strong>,
      </p>
      <p style="font-size: 13px; color: #94a3b8;">
        Your Paystack transaction is verified. You now hold full VIP Director access across all SceneSwap productions and features.
      </p>

      <div class="receipt-box">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;">Item:</td>
            <td style="padding: 6px 0; text-align: right; color: #f8fafc; font-weight: 600;">SceneSwap VIP Director Pass</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;">Transaction Reference:</td>
            <td style="padding: 6px 0; text-align: right; font-family: monospace; color: #38bdf8;">${payload.reference}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;">Payment Gateway:</td>
            <td style="padding: 6px 0; text-align: right; color: #10b981;">Paystack Direct</td>
          </tr>
          <tr style="border-top: 1px solid rgba(255,255,255,0.15);">
            <td style="padding: 12px 0 0; color: #f8fafc; font-weight: 700; font-size: 15px;">Total Paid:</td>
            <td style="padding: 12px 0 0; text-align: right; color: #ec4899; font-weight: 800; font-size: 16px;">${payload.amount} ${payload.currency}</td>
          </tr>
        </table>
      </div>

      <h4 style="margin: 20px 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #c084fc;">Director Privileges:</h4>
      <ul style="font-size: 13px; line-height: 1.8; color: #cbd5e1; padding-left: 20px;">
        <li>Unlimited screenplay acts and party shoots</li>
        <li>Custom genre prompts and premise creation</li>
        <li>Photorealistic scene visual generation</li>
        <li>Cloud script backups and direct support desk access</li>
      </ul>
    </div>
    <div class="footer">
      Support Desk: <strong>${adminEmail}</strong> &bull; SceneSwap Engine
    </div>
  </div>
</body>
</html>
`;

  if (!apiKey) {
    console.warn('[Resend] RESEND_API_KEY is not set. Simulating receipt transmission to', targetEmail);
    return {
      success: true,
      mode: 'simulated',
      messageId: `receipt_sim_${Date.now()}`,
      note: `Receipt simulated! Email prepared for ${targetEmail}.`,
    };
  }

  try {
    const resend = new Resend(apiKey);
    const recipients = [targetEmail];
    if (adminEmail && adminEmail !== targetEmail) {
      recipients.push(adminEmail);
    }

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: recipients,
      subject,
      html: htmlBody,
    });

    if (error) {
      console.error('[Resend Receipt Error]', error);
      return {
        success: false,
        mode: 'live',
        error: error.message || 'Failed to dispatch receipt via Resend',
      };
    }

    return {
      success: true,
      mode: 'live',
      messageId: data?.id,
      note: `Receipt dispatched successfully to ${targetEmail}!`,
    };
  } catch (err: any) {
    console.error('[Resend Receipt Exception]', err);
    return {
      success: false,
      mode: 'live',
      error: err?.message || 'Error communicating with Resend',
    };
  }
}

export async function sendTestEmail(targetEmail?: string): Promise<SupportEmailResponse> {
  const destination = targetEmail?.trim() || process.env.SUPPORT_EMAIL || 'martorefe@gmail.com';
  return sendSupportEmail({
    fromEmail: 'director@sceneswap.internal',
    name: 'SceneSwap Health Probe',
    subject: 'Verification & Diagnostic Ping',
    category: 'System Integration Test',
    message: `This is a live integration verification message sent to verify Resend Transactional Email connectivity for project SceneSwap.\nTarget Destination: ${destination}\nTimestamp: ${new Date().toISOString()}`,
    genre: 'Nollywood Drama',
    act: 1,
    playersCount: 3,
    isPro: true,
  });
}
