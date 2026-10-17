import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateSceneSwap, generateSceneSwapChapter, generateSceneSwapRealisticImage } from './src/server/gemini.ts';
import { sendSupportEmail, sendReceiptEmail, sendTestEmail, getResendStatus, setRuntimeResendApiKey } from './src/server/email.ts';
import { initializePaystackTransaction, verifyPaystackTransaction, getPaystackStatus, setRuntimePaystackKeys } from './src/server/paystack.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(express.static(path.resolve(__dirname, 'public')));
app.use(express.static(path.resolve(__dirname, 'dist')));

// API endpoints
app.post('/api/sceneswap', async (req, res) => {
  try {
    const result = await generateSceneSwap(req.body || {});
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Server error' });
  }
});

app.post('/api/sceneswap/chapter', async (req, res) => {
  try {
    const result = await generateSceneSwapChapter(req.body || {});
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Server error' });
  }
});

app.post('/api/sceneswap/generate-image', async (req, res) => {
  try {
    const result = await generateSceneSwapRealisticImage(req.body || {});
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Server error' });
  }
});

app.post('/api/support', async (req, res) => {
  try {
    const result = await sendSupportEmail(req.body || {});
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to dispatch email' });
  }
});

app.post('/api/receipt', async (req, res) => {
  try {
    const result = await sendReceiptEmail(req.body || {});
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to dispatch receipt email' });
  }
});

app.get('/api/services/status', (req, res) => {
  try {
    res.json({
      firebase: {
        projectId: "sonorous-heading-pn2tx",
        databaseId: "ai-studio-alteregosceneswa-18262271-a1fe-4ea8-9882-dbf4dc44f9fa",
        authDomain: "sonorous-heading-pn2tx.firebaseapp.com",
        status: "connected",
      },
      paystack: getPaystackStatus(),
      resend: getResendStatus(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to get services status' });
  }
});

app.post('/api/services/config', (req, res) => {
  try {
    const { paystack, resend } = req.body || {};
    if (paystack) {
      setRuntimePaystackKeys(paystack);
    }
    if (resend && resend.apiKey !== undefined) {
      setRuntimeResendApiKey(resend.apiKey);
    }
    res.json({
      success: true,
      paystack: getPaystackStatus(),
      resend: getResendStatus(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update config' });
  }
});

app.post('/api/services/test-email', async (req, res) => {
  try {
    const { targetEmail } = req.body || {};
    const result = await sendTestEmail(targetEmail);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to send test email' });
  }
});

app.post('/api/paystack/initialize', async (req, res) => {
  try {
    const result = await initializePaystackTransaction(req.body || {});
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to initialize Paystack payment' });
  }
});

app.post('/api/paystack/verify', async (req, res) => {
  try {
    const { reference } = req.body || {};
    if (!reference) {
      return res.status(400).json({ status: false, message: 'Reference is required' });
    }
    const result = await verifyPaystackTransaction(reference);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to verify Paystack payment' });
  }
});

// SPA fallback for production
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`SceneSwap server running on port ${PORT}`);
});
