import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import express from 'express';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { generateSceneSwap, generateSceneSwapChapter, generateSceneSwapRealisticImage } from './src/server/gemini.ts';
import { sendSupportEmail, sendReceiptEmail, sendTestEmail, getResendStatus, setRuntimeResendApiKey } from './src/server/email.ts';
import { initializePaystackTransaction, verifyPaystackTransaction, getPaystackStatus, setRuntimePaystackKeys } from './src/server/paystack.ts';

function createApiApp() {
  const app = express();
  app.use(express.json());
  app.use(express.static(path.resolve(process.cwd(), 'public')));

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
      return app;
}

function apiServerPlugin(): Plugin {
  return {
    name: 'api-server-endpoints',
    configureServer(server) {
      const app = createApiApp();
      server.middlewares.use(app);
    },
    configurePreviewServer(server) {
      const app = createApiApp();
      server.middlewares.use(app);
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      apiServerPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'pwa-icon.svg'],
        manifest: {
          id: '/',
          name: 'SceneSwap',
          short_name: 'SceneSwap',
          description: 'Turn any hangout into an interactive film set where friends star in personalized, branching scripts with teleprompter navigation and choice voting.',
          theme_color: '#0b0416',
          background_color: '#0b0416',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
