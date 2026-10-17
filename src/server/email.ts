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
    senderEmail: process.env.RESEND_FROM_EMAIL || 'SceneSwap Studio <onboarding@resend.dev>',
  };
}

export interface SupportEmailRequest {
  fromEmail?: string;
  name?: string;
  subject?: string;
  category?: string;
  message: string;
  genre?: string;
  chapterNumber?: number;
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

  const defaultFrom = 'SceneSwap Studio <onboarding@resend.dev>';
  const configuredFrom = process.env.RESEND_FROM_EMAIL?.trim();
  const fromEmail = (configuredFrom && !isWebmailDomain(configuredFrom)) ? configuredFrom : defaultFrom;

  const subjectCategory = payload.category ? `[${payload.category}] ` : '';
  const cleanSubject = payload.subject?.trim() || 'New SceneSwap Production Inquiry';
  const fullSubject = `SceneSwap Studio: ${subjectCategory}${cleanSubject}`;

  const userEmail = payload.fromEmail?.trim() || 'Not specified (Anonymous)';
  const senderName = payload.name?.trim() || 'SceneSwap Director';
  const genre = payload.genre || 'General Production';
  const tier = payload.isPro ? 'SceneSwap Studio Pro' : 'Free Director';
  const timestamp = new Date().toUTCString();

  const textBody = `
=== SCENESWAP PRODUCTION INQUIRY ===
From: ${senderName} <${userEmail}>
Subject: ${cleanSubject}
Category: ${payload.category || 'General'}
Genre / Focus: ${genre}
Membership: ${tier}
Timestamp: ${timestamp}

--- MESSAGE ---
${payload.message}

---
Dispatched via SceneSwap Resend Gateway
Destination: ${targetEmail}
`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f1f5f9; padding: 24px; margin: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #131b2e; border: 1px solid rgba(245,158,11,0.3); border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #b45309, #f59e0b, #7c3aed); padding: 24px; text-align: left; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px; }
    .header p { margin: 4px 0 0; font-size: 12px; color: rgba(255,255,255,0.85); text-transform: uppercase; letter-spacing: 1.5px; }
    .content { padding: 24px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; background: rgba(245,158,11,0.2); color: #fde047; border: 1px solid rgba(245,158,11,0.4); margin-bottom: 16px; }
    .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
    .meta-table td { padding: 8px 10px; border-bottom: 1px solid rgba(255,255,200,0.06); }
    .meta-table td.label { color: #94a3b8; font-weight: 600; width: 140px; }
    .meta-table td.val { color: #f8fafc; font-weight: 500; }
    .message-box { background: rgba(0,0,0,0.4); border-left: 4px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 14px; line-height: 1.6; color: #f1f5f9; white-space: pre-wrap; }
    .footer { padding: 16px 24px; background: rgba(0,0,0,0.2); border-top: 1px solid rgba(255,255,255,0.05); font-size: 11px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SceneSwap Production Desk</h1>
      <p>Interactive AI Party Screenplay Studio</p>
    </div>
    <div class="content">
      <span class="badge">${payload.category || 'Production Inquiry'}</span>
      
      <table class="meta-table">
        <tr>
          <td class="label">Sender / Reply:</td>
          <td class="val"><strong style="color: #38bdf8;">${userEmail}</strong></td>
        </tr>
        <tr>
          <td class="label">Production Genre:</td>
          <td class="val">${genre}</td>
        </tr>
        <tr>
          <td class="label">Membership Tier:</td>
          <td class="val"><span style="color: ${payload.isPro ? '#fbbf24' : '#94a3b8'}; font-weight: 700;">${tier}</span></td>
        </tr>
        <tr>
          <td class="label">Timestamp:</td>
          <td class="val">${timestamp}</td>
        </tr>
      </table>

      <h3 style="margin: 0 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #fde047;">Production Message:</h3>
      <div class="message-box">${payload.message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    </div>
    <div class="footer">
      Delivered to <strong>${targetEmail}</strong> via Resend API.
    </div>
  </div>
</body>
</html>
`;

  if (!apiKey) {
    console.warn('[Resend] RESEND_API_KEY is not set. Simulating transactional email transmission in development mode.');
    return {
      success: true,
      mode: 'simulated',
      messageId: `sim_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      note: 'Resend ready. Simulated mode active until custom SceneSwap Resend API key is provided.',
    };
  }

  try {
    const resend = new Resend(apiKey);
    let { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [targetEmail],
      replyTo: payload.fromEmail?.trim() || undefined,
      subject: fullSubject,
      text: textBody,
      html: htmlBody,
    });

    if (error && (error.message?.toLowerCase().includes('domain') || error.message?.toLowerCase().includes('verify'))) {
      const fallbackFrom = 'onboarding@resend.dev';
      const fallbackResult = await resend.emails.send({
        from: fallbackFrom,
        to: [targetEmail],
        replyTo: payload.fromEmail?.trim() || undefined,
        subject: fullSubject,
        text: textBody,
        html: htmlBody,
      });
      data = fallbackResult.data;
      error = fallbackResult.error;
    }

    if (error) {
      console.error('[Resend Error]', error);
      return {
        success: false,
        mode: 'live',
        error: error.message || 'Failed to dispatch email via Resend',
      };
    }

    return {
      success: true,
      mode: 'live',
      messageId: data?.id,
      note: 'Email successfully delivered to SceneSwap production desk.',
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
  const defaultFrom = 'SceneSwap Studio <onboarding@resend.dev>';
  const configuredFrom = process.env.RESEND_FROM_EMAIL?.trim();
  const fromEmail = (configuredFrom && !configuredFrom.includes('@gmail.com')) ? configuredFrom : defaultFrom;

  const subject = `SceneSwap Studio Pro Pass Receipt - Reference #${payload.reference.slice(-8).toUpperCase()}`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #050811; color: #f1f5f9; padding: 24px; margin: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #0f172a; border: 1px solid rgba(245,158,11,0.3); border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.6); }
    .header { background: linear-gradient(135deg, #b45309, #f59e0b, #7c3aed); padding: 32px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px; }
    .header p { margin: 8px 0 0; font-size: 13px; color: rgba(255,255,255,0.9); letter-spacing: 1px; }
    .content { padding: 28px 24px; }
    .badge { display: inline-block; padding: 6px 14px; border-radius: 9999px; font-size: 12px; font-weight: 700; background: rgba(234,179,8,0.2); color: #fde047; border: 1px solid rgba(234,179,8,0.4); margin-bottom: 20px; }
    .receipt-box { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; margin: 20px 0; }
    .perks-list { margin: 20px 0; padding-left: 20px; font-size: 13px; line-height: 1.8; color: #cbd5e1; }
    .footer { padding: 20px 24px; background: rgba(0,0,0,0.3); border-top: 1px solid rgba(255,255,255,0.06); font-size: 11px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SceneSwap Studio Pro Unlocked</h1>
      <p>Interactive AI Party Screenplay Studio</p>
    </div>
    <div class="content">
      <div style="text-align: center;">
        <span class="badge">🎬 SCENESWAP STUDIO PRO DIRECTOR 🎬</span>
      </div>
      <p style="font-size: 14px; line-height: 1.6; color: #e2e8f0;">
        Greetings <strong>${payload.customerName || 'Director'}</strong>,
      </p>
      <p style="font-size: 13px; line-height: 1.6; color: #94a3b8;">
        Your transaction through Paystack has been verified. You now hold VIP Studio Pro access across all SceneSwap multi-branch productions.
      </p>

      <div class="receipt-box">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;">Item:</td>
            <td style="padding: 6px 0; text-align: right; color: #f8fafc; font-weight: 600;">SceneSwap Studio Pro Pass</td>
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
            <td style="padding: 12px 0 0; text-align: right; color: #f59e0b; font-weight: 800; font-size: 16px;">${payload.amount} ${payload.currency}</td>
          </tr>
        </table>
      </div>

      <h4 style="margin: 20px 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #fde047;">Unlocked Studio Perks:</h4>
      <ul class="perks-list">
        <li>Unlimited multi-branch screenplay acts beyond Act 3</li>
        <li>Generative AI scene backdrop rendering</li>
        <li>Print-ready production call sheet & script exports</li>
        <li>Director soundboard audio enhancements</li>
      </ul>
    </div>
    <div class="footer">
      Production Desk: <strong>${adminEmail}</strong> &bull; SceneSwap Studio
    </div>
  </div>
</body>
</html>
`;

  if (!apiKey) {
    console.warn('[Resend] RESEND_API_KEY is not set. Simulating receipt email transmission to', targetEmail);
    return {
      success: true,
      mode: 'simulated',
      messageId: `receipt_sim_${Date.now()}`,
      note: `Receipt simulated for ${targetEmail}.`,
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
    fromEmail: 'test-director@sceneswap.internal',
    name: 'SceneSwap Test Ping',
    subject: 'Verification & Diagnostic Ping',
    category: 'System Integration Test',
    message: 'Test dispatch from SceneSwap standalone production server.',
  });
}
