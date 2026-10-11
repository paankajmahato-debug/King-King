import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createApiMiddleware } from './server/api.ts';
import { db } from './server/db.ts';
import { startTunnel } from './server/tunnel.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT && process.env.PORT !== '8080' ? Number(process.env.PORT) : 3000;

// Prevent 400 Bad Request on malformed query strings, spaces, or percent encoding from WhatsApp / external share apps
app.use((req, _res, next) => {
  try {
    decodeURI(req.url);
    next();
  } catch {
    try {
      req.url = req.url.replace(/%(?![0-9a-fA-F]{2})/g, '%25');
      next();
    } catch {
      next();
    }
  }
});

// Universal CORS & Preflight handling - with explicit Origin mirroring & credentials support for mobile webviews
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-customer-token, x-admin-request, Range');
  res.header('Access-Control-Expose-Headers', '*');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Root /health endpoint for Cloud Run health & container probes
app.get('/health', (_req, res) => {
  const isReady = db.isReady();
  res.status(200).json({
    status: isReady ? 'healthy' : 'initializing',
    database: db.isCloudConnected() ? 'Firestore' : 'Local',
    timestamp: new Date().toISOString()
  });
});

// Dedicated Android APK Download Routes
app.get('/download/customer-apk', (_req, res) => {
  const apkPath = path.resolve(__dirname, 'public', 'downloads', 'taze-clining-customer.apk');
  if (fs.existsSync(apkPath)) {
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    return res.download(apkPath, 'TAZE-CLINING-Customer.apk');
  }
  return res.status(404).json({ success: false, error: 'Customer APK is generating, please retry in a moment.' });
});

app.get('/download/owner-apk', (_req, res) => {
  const apkPath = path.resolve(__dirname, 'public', 'downloads', 'taze-clining-owner.apk');
  if (fs.existsSync(apkPath)) {
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    return res.download(apkPath, 'TAZE-CLINING-Owner.apk');
  }
  return res.status(404).json({ success: false, error: 'Owner APK is generating, please retry in a moment.' });
});

// Serve public static directory (downloads, assets) with proper APK headers
app.use('/downloads', express.static(path.resolve(__dirname, 'public', 'downloads'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.apk')) {
      res.setHeader('Content-Type', 'application/vnd.android.package-archive');
      const filename = path.basename(filePath);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    }
  }
}));

// Attach API middleware under /api
app.use('/api', createApiMiddleware());

// Bootstrap server and start listening immediately
async function bootstrap() {
  console.log('[Server] Starting CLEENZO full-stack application...');

  const isDev = process.env.NODE_ENV !== 'production' && !process.env.SERVE_STATIC;
  const distPath = path.resolve(__dirname, 'dist');

  if (isDev) {
    console.log('[Server] Mounting Vite dev middleware...');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: 'spa'
    });

    // Helper to send rendered SPA HTML safely
    const sendSpaHtml = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        const indexPath = path.resolve(__dirname, 'index.html');
        if (fs.existsSync(indexPath)) {
          let template = fs.readFileSync(indexPath, 'utf-8');
          try {
            const cleanPath = (req.path || '/').split('?')[0];
            template = await vite.transformIndexHtml(cleanPath, template);
          } catch (transformErr) {
            console.warn('[Server] vite.transformIndexHtml warning, serving raw template:', transformErr);
          }
          return res.status(200).set({
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache'
          }).end(template);
        }
        return next();
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        const indexPath = path.resolve(__dirname, 'index.html');
        if (fs.existsSync(indexPath)) {
          return res.status(200).set({ 'Content-Type': 'text/html; charset=utf-8' }).sendFile(indexPath);
        }
        next(e);
      }
    };

    // Dedicated routes for customer order page and mobile apps - ensures routes load with 200 OK
    app.get([
      '/order', '/order/*',
      '/track', '/track/*',
      '/admin', '/admin/*',
      '/generator', '/generator/*',
      '/customer-app', '/customer-app/*',
      '/owner-app', '/owner-app/*'
    ], sendSpaHtml);

    // Vite middlewares for module and static asset loading
    app.use(vite.middlewares);

    // Guaranteed SPA fallback for any remaining HTML routes
    app.use('*', async (req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        return next();
      }
      const url = req.originalUrl;
      if (url.startsWith('/api') || url.startsWith('/health')) {
        return next();
      }
      // If a static file request with extension was not found by Vite, let it 404 cleanly
      if (path.extname(req.path) && !req.path.endsWith('.html')) {
        return res.status(404).end('Asset not found');
      }
      return sendSpaHtml(req, res, next);
    });
  } else {
    console.log('[Server] Serving production static build from dist...');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
    }
    const sendProdHtml = (res: express.Response) => {
      const distIndex = path.join(distPath, 'index.html');
      if (fs.existsSync(distIndex)) {
        return res.sendFile(distIndex);
      }
      const rootIndex = path.resolve(__dirname, 'index.html');
      if (fs.existsSync(rootIndex)) {
        return res.sendFile(rootIndex);
      }
      return res.status(404).send('Application build not found');
    };

    app.get([
      '/order', '/order/*',
      '/track', '/track/*',
      '/admin', '/admin/*',
      '/generator', '/generator/*',
      '/customer-app', '/customer-app/*',
      '/owner-app', '/owner-app/*'
    ], (_req, res) => {
      sendProdHtml(res);
    });

    app.use('*', (req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        return next();
      }
      if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
        return next();
      }
      if (path.extname(req.path) && !req.path.endsWith('.html')) {
        return res.status(404).send('Asset not found');
      }
      return sendProdHtml(res);
    });
  }

  // 404 fallback for API requests
  app.all('/api/*', (req, res) => {
    res.status(404).json({ success: false, error: `API endpoint ${req.method} ${req.path} not found` });
  });

  // Global Error Handler - recovers gracefully to index.html for page navigations instead of throwing 400 Bad Request
  app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[Server Error Handler]:', err);
    if (!res.headersSent) {
      if (req.method === 'GET' && !req.path.startsWith('/api')) {
        const indexPath = path.resolve(__dirname, 'index.html');
        if (fs.existsSync(indexPath)) {
          return res.status(200).set({ 'Content-Type': 'text/html; charset=utf-8' }).sendFile(indexPath);
        }
      }
      res.status(err?.status || 500).json({ success: false, error: err?.message || 'Server error' });
    }
  });

  // Start listening immediately so port 3000 is open right away
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CLEENZO full-stack server running on http://0.0.0.0:${PORT}`);
  });

  // Asynchronously synchronize Firestore in background without delaying server startup
  db.init().then(() => {
    console.log('[Server] Database initialized and synchronized successfully.');
    // Automatically start Cloudflare public tunnel and publish live address to Google Firestore
    startTunnel().then(url => {
      if (url) {
        db.publishServerInfo(url).catch(() => {});
      }
    }).catch(err => {
      console.warn('[Server] Could not initialize public tunnel:', err);
    });
  }).catch(err => {
    console.error('[Server] Warning during background database init:', err);
  });
}

bootstrap().catch(err => {
  console.error('[Server Fatal] Could not start server:', err);
  process.exit(1);
});
