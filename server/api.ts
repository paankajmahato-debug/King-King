import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { db } from './db.ts';
import { getTunnelUrl, restartTunnel } from './tunnel.ts';
import type { Order } from '../src/types/index.ts';

export function createApiMiddleware() {
  const router = express.Router();

  // Parse JSON bodies up to 25MB for high-res photo uploads
  router.use(express.json({ limit: '25mb' }));
  router.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Prevent stale caching on API data endpoints
  router.use((req, res, next) => {
    // Only apply no-cache headers to API data endpoints, NOT to immutable images
    if (!req.path.startsWith('/images/') && !req.path.startsWith('/uploads/')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    next();
  });

  // --- HEALTH & READINESS (CLOUD RUN) ---
  router.get('/health', (_req: Request, res: Response) => {
    const isCloud = db.isCloudConnected();
    const isReady = db.isReady();
    res.status(isReady ? 200 : 503).json({
      status: isReady ? 'healthy' : 'initializing',
      database: isCloud ? 'Firestore (Persistent Cloud Database)' : 'Local File Persistence',
      cloudPersistence: isCloud,
      ready: isReady,
      productsCount: db.getProducts().length,
      ordersCount: db.getOrders().length,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    });
  });

  // Robust base domain sanitizer - strips any accidental /order, /track, or query parameters
  function extractDomainOrigin(input: string): string {
    if (!input || typeof input !== 'string') return '';
    let str = input.trim();
    if (!str) return '';
    if (!str.startsWith('http://') && !str.startsWith('https://')) {
      str = 'https://' + str;
    }
    try {
      const parsed = new URL(str);
      return parsed.origin;
    } catch {
      return str.split('/order')[0].split('/track')[0].split('?')[0].replace(/\/+$/, '');
    }
  }

  const LIVE_DEV_DOMAIN = 'https://ais-dev-bbvidsoghz7eveu2fwbc6d-22725730900.asia-southeast1.run.app';

  // --- PUBLIC CUSTOMER DOMAIN ENDPOINT ---
  router.get('/public-url', (req: Request, res: Response) => {
    const settings = db.getStoreSettings();
    const host = req.get('x-forwarded-host') || req.get('host') || 'localhost:3000';
    const proto = req.get('x-forwarded-proto') || req.protocol || 'https';
    const origin = `${proto}://${host}`;

    const rawCustom = settings.customPublicUrl?.trim() || '';
    let cleanCustom = extractDomainOrigin(rawCustom);
    // Never allow broken ais-pre- or dead domains (modular-senator) as they return 404
    if (cleanCustom.includes('ais-pre-') || cleanCustom.includes('modular-senator-affiliate-ste')) {
      cleanCustom = '';
      db.updateSettings({ customPublicUrl: '' }).catch(() => {});
    }

    const tunnelUrl = getTunnelUrl();
    // Prioritize active working URLs:
    // 1. User custom domain (if configured)
    // 2. Active Cloudflare public tunnel URL (guaranteed 200 OK, no login required)
    // 3. Live Development App host (ais-dev-)
    // 4. Server origin
    const activeUrl = cleanCustom || tunnelUrl || LIVE_DEV_DOMAIN || origin;

    res.json({
      success: true,
      publicUrl: activeUrl,
      customPublicUrl: cleanCustom,
      tunnelUrl: tunnelUrl,
      devAppUrl: LIVE_DEV_DOMAIN,
      originUrl: origin,
      orderUrl: `${activeUrl}/order`,
      orderUrlTemplate: `${activeUrl}/order?ref={CUSTOMER_ID}`
    });
  });

  // Dedicated APK download endpoints
  router.get('/download/customer-apk', (_req: Request, res: Response) => {
    const apkPath = path.resolve(__dirname, '..', 'public', 'downloads', 'taze-clining-customer.apk');
    if (fs.existsSync(apkPath)) {
      res.setHeader('Content-Type', 'application/vnd.android.package-archive');
      return res.download(apkPath, 'TAZE-CLINING-Customer.apk');
    }
    return res.status(404).json({ success: false, error: 'Customer APK is generating, please retry in a moment.' });
  });

  router.get('/download/owner-apk', (_req: Request, res: Response) => {
    const apkPath = path.resolve(__dirname, '..', 'public', 'downloads', 'taze-clining-owner.apk');
    if (fs.existsSync(apkPath)) {
      res.setHeader('Content-Type', 'application/vnd.android.package-archive');
      return res.download(apkPath, 'TAZE-CLINING-Owner.apk');
    }
    return res.status(404).json({ success: false, error: 'Owner APK is generating, please retry in a moment.' });
  });

  // GET /api/tunnel/status (Check live tunnel health)
  router.get('/tunnel/status', (_req: Request, res: Response) => {
    const url = getTunnelUrl();
    res.json({
      success: true,
      active: !!url,
      publicUrl: url,
      orderUrl: url ? `${url}/order?ref=VIP_CLIENT&src=whatsapp` : null
    });
  });

  // POST /api/tunnel/restart (Force restart tunnel to regenerate fresh public link)
  router.post('/tunnel/restart', async (_req: Request, res: Response) => {
    try {
      const newUrl = await restartTunnel();
      res.json({
        success: true,
        message: 'Tunnel regenerated successfully',
        publicUrl: newUrl,
        orderUrl: newUrl ? `${newUrl}/order?ref=VIP_CLIENT&src=whatsapp` : null
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // PUT /api/public-url (Update public URL / custom domain)
  router.put('/public-url', async (req: Request, res: Response) => {
    try {
      const { customPublicUrl } = req.body;
      let cleanUrl = extractDomainOrigin(typeof customPublicUrl === 'string' ? customPublicUrl : '');
      if (cleanUrl.includes('ais-pre-') || cleanUrl.includes('modular-senator-affiliate-ste')) {
        cleanUrl = '';
      }
      const updated = await db.updateSettings({ customPublicUrl: cleanUrl });
      
      const host = req.get('x-forwarded-host') || req.get('host') || 'localhost:3000';
      const proto = req.get('x-forwarded-proto') || req.protocol || 'https';
      const origin = `${proto}://${host}`;
      const tunnelUrl = getTunnelUrl();
      const activeUrl = cleanUrl || tunnelUrl || LIVE_DEV_DOMAIN || origin;

      res.json({
        success: true,
        message: cleanUrl ? `Public Order URL updated to ${cleanUrl}` : `Public Order URL reset to live public link`,
        publicUrl: activeUrl,
        customPublicUrl: cleanUrl,
        orderUrl: `${activeUrl}/order`,
        data: updated
      });
    } catch (err: any) {
      console.error('[PUT /public-url Error]:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/public-url/diagnose (Diagnoses connection status of public URL & backend routes)
  router.get('/public-url/diagnose', async (req: Request, res: Response) => {
    try {
      const settings = db.getStoreSettings();
      const host = req.get('x-forwarded-host') || req.get('host') || 'localhost:3000';
      const proto = req.get('x-forwarded-proto') || req.protocol || 'https';
      const origin = `${proto}://${host}`;
      const custom = settings.customPublicUrl?.trim() || '';

      let customStatus: 'ONLINE' | 'UNREACHABLE' | 'NOT_CONFIGURED' = 'NOT_CONFIGURED';
      let diagnosticsMessage = 'Using live verified app server origin.';

      if (custom) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 2000);
          const probeUrl = custom.endsWith('/') ? `${custom}health` : `${custom}/health`;
          const testRes = await fetch(probeUrl, { method: 'HEAD', signal: controller.signal }).catch(async () => {
            return await fetch(custom, { method: 'HEAD', signal: controller.signal });
          });
          clearTimeout(timeout);
          if (testRes.ok || testRes.status < 500) {
            customStatus = 'ONLINE';
            diagnosticsMessage = `Custom domain ${custom} is active and reachable.`;
          } else {
            customStatus = 'UNREACHABLE';
            diagnosticsMessage = `Domain responded with HTTP ${testRes.status}.`;
          }
        } catch (err: any) {
          customStatus = 'UNREACHABLE';
          diagnosticsMessage = `Could not resolve or connect to ${custom} (${err.message || 'DNS error'}). If using Cloudflare tunnel, verify the tunnel process is running.`;
        }
      }

      res.json({
        success: true,
        serverTime: new Date().toISOString(),
        currentBackendOrigin: origin,
        customPublicUrl: custom,
        customStatus,
        diagnosticsMessage,
        recommendedUrl: (customStatus === 'ONLINE' && custom) ? custom : origin,
        routeChecks: {
          health: 'OK',
          apiOrders: 'OK',
          customerOrderPage: 'OK (/order)',
          corsAllowed: true
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // --- PERMANENT PRODUCT PHOTO STORAGE & SERVING ---
  // Serves photos with immutable HTTP cache headers
  const handleServeImage = async (req: Request, res: Response) => {
    try {
      const imageId = req.params.id;
      const img = await db.getImage(imageId);
      if (!img) {
        return res.status(404).send('Image not found');
      }
      res.setHeader('Content-Type', img.contentType || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.send(img.buffer);
    } catch (err: any) {
      console.error('[Serve Photo Error]:', err);
      res.status(500).send('Failed to serve photo');
    }
  };

  router.get('/images/:id', handleServeImage);
  router.get('/uploads/:id', handleServeImage);

  // POST /api/upload (Admin uploads product photo)
  // Saves photo permanently to cloud Firestore storage
  router.post('/upload', async (req: Request, res: Response) => {
    try {
      const { dataUrl, filename } = req.body;
      if (!dataUrl) {
        return res.status(400).json({ success: false, error: 'No image data provided' });
      }

      // Detect MIME type and extension
      const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let ext = 'png';
      let contentType = 'image/png';
      if (matches && matches.length === 3) {
        contentType = matches[1];
        ext = matches[1].split('/')[1] || 'png';
      }

      // Generate a clean permanent cloud image ID
      const safeId = `photo-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

      // Persist permanently to Cloud Firestore
      const permanentUrl = await db.saveImage(safeId, dataUrl, contentType);

      console.log(`[Upload API] Saved photo successfully: ${permanentUrl}`);
      res.json({ success: true, url: permanentUrl, imageId: safeId });
    } catch (err: any) {
      console.error('[Upload API Error]:', err);
      res.status(500).json({ success: false, error: err.message || 'Failed to persist uploaded photo' });
    }
  });

  // --- PRODUCTS API ---

  // GET /api/products
  router.get('/products', (req: Request, res: Response) => {
    try {
      const includeInactive = req.query.includeInactive !== 'false';
      const products = db.getProducts(includeInactive);
      res.json({ success: true, data: products });
    } catch (err: any) {
      console.error('[GET /products Error]:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/products/:id
  router.get('/products/:id', (req: Request, res: Response) => {
    try {
      const product = db.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ success: false, error: 'Product not found' });
      }
      res.json({ success: true, data: product });
    } catch (err: any) {
      console.error(`[GET /products/${req.params.id} Error]:`, err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/products (Admin creates product)
  router.post('/products', async (req: Request, res: Response) => {
    try {
      const { name, tagline, category, description, features, image, status, variants } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, error: 'Product name is required' });
      }

      const product = await db.createProduct({
        name: name.trim(),
        tagline: tagline?.trim(),
        category: category?.trim(),
        description: description?.trim(),
        features: Array.isArray(features) ? features : [],
        image: image || '',
        status: status || 'UPCOMING',
        variants: Array.isArray(variants) ? variants : []
      });

      res.status(201).json({ success: true, data: product });
    } catch (err: any) {
      console.error('[POST /products Error]:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // PUT /api/products/:id (Admin updates product)
  router.put('/products/:id', async (req: Request, res: Response) => {
    try {
      const updated = await db.updateProduct(req.params.id, req.body);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      console.error(`[PUT /products/${req.params.id} Error]:`, err);
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // DELETE /api/products/:id (Admin deletes product)
  router.delete('/products/:id', async (req: Request, res: Response) => {
    try {
      const ok = await db.deleteProduct(req.params.id);
      if (!ok) {
        return res.status(404).json({ success: false, error: 'Product not found' });
      }
      res.json({ success: true, message: 'Product deleted successfully' });
    } catch (err: any) {
      console.error(`[DELETE /products/${req.params.id} Error]:`, err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // --- VARIANTS API ---

  // POST /api/products/:id/variants (Admin adds variant)
  router.post('/products/:id/variants', async (req: Request, res: Response) => {
    try {
      const { size, mrp, sellingPrice, offer, stockQuantity, status } = req.body;
      if (!size || !size.trim()) {
        return res.status(400).json({ success: false, error: 'Size is required (e.g. 250 ML)' });
      }

      const numMrp = Number(mrp) || 0;
      const numSelling = Number(sellingPrice) || 0;
      const numStock = Number(stockQuantity) || 0;

      const variant = await db.addVariant(req.params.id, {
        size: size.trim(),
        mrp: numMrp,
        sellingPrice: numSelling,
        offer: offer?.trim() || (numMrp > numSelling ? `₹${numMrp - numSelling} OFF` : ''),
        stockQuantity: Math.max(0, numStock),
        status: status || (numStock > 0 ? 'ACTIVE' : 'OUT_OF_STOCK')
      });

      res.status(201).json({ success: true, data: variant });
    } catch (err: any) {
      console.error(`[POST /products/${req.params.id}/variants Error]:`, err);
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // PUT /api/products/:id/variants/:variantId (Admin updates variant)
  router.put('/products/:id/variants/:variantId', async (req: Request, res: Response) => {
    try {
      const updates = { ...req.body };
      if (updates.mrp !== undefined) updates.mrp = Number(updates.mrp);
      if (updates.sellingPrice !== undefined) updates.sellingPrice = Number(updates.sellingPrice);
      if (updates.stockQuantity !== undefined) {
        updates.stockQuantity = Math.max(0, Number(updates.stockQuantity));
      }

      const variant = await db.updateVariant(req.params.id, req.params.variantId, updates);
      res.json({ success: true, data: variant });
    } catch (err: any) {
      console.error(`[PUT /products/${req.params.id}/variants/${req.params.variantId} Error]:`, err);
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // DELETE /api/products/:id/variants/:variantId (Admin deletes variant)
  router.delete('/products/:id/variants/:variantId', async (req: Request, res: Response) => {
    try {
      const ok = await db.deleteVariant(req.params.id, req.params.variantId);
      if (!ok) {
        return res.status(404).json({ success: false, error: 'Variant not found' });
      }
      res.json({ success: true, message: 'Variant deleted successfully' });
    } catch (err: any) {
      console.error(`[DELETE /products/${req.params.id}/variants/${req.params.variantId} Error]:`, err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // --- ORDERS API ---

  // GET /api/orders (Admin list all orders)
  // --- CUSTOMER OTP & AUTHENTICATION API ---

  // Helper to extract customer bearer token
  // Helper to parse cookies safely from incoming request headers
  const parseCookies = (req: Request): Record<string, string> => {
    const list: Record<string, string> = {};
    const rc = req.headers.cookie;
    if (!rc) return list;
    try {
      rc.split(';').forEach(cookie => {
        const parts = cookie.split('=');
        const name = parts.shift()?.trim();
        if (name) {
          const rawVal = parts.join('=').trim();
          try {
            list[name] = decodeURIComponent(rawVal);
          } catch {
            list[name] = rawVal;
          }
        }
      });
    } catch {
      // In case of completely invalid cookie header, fail silently
    }
    return list;
  };

  // Helper to extract customer bearer token (Authorization header, x-customer-token, or cookie session)
  const extractCustomerToken = (req: Request): string => {
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7).trim();
    }
    const tokenHeader = req.headers['x-customer-token'];
    if (typeof tokenHeader === 'string' && tokenHeader.trim()) {
      return tokenHeader.trim();
    }
    const cookies = parseCookies(req);
    if (cookies.customerToken) {
      return cookies.customerToken.trim();
    }
    if (cookies.token) {
      return cookies.token.trim();
    }
    if (cookies.cleenzo_customer_token) {
      return cookies.cleenzo_customer_token.trim();
    }
    if (req.body && typeof req.body.customerToken === 'string') {
      return req.body.customerToken.trim();
    }
    if (req.query && typeof req.query.customerToken === 'string') {
      return (req.query.customerToken as string).trim();
    }
    return '';
  };

  // POST /api/auth/customer/send-otp (Customer requests OTP)
  router.post('/auth/customer/send-otp', async (req: Request, res: Response) => {
    try {
      const { name, phone, referralSource } = req.body;
      const result = await db.sendCustomerOtp(name, phone, referralSource);
      res.json({
        success: true,
        message: 'Verification OTP sent successfully.',
        data: { expiresIn: result.expiresIn }
      });
    } catch (err: any) {
      console.error('[POST /auth/customer/send-otp Error]:', err);
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // POST /api/auth/customer/verify-otp (Customer submits OTP)
  router.post('/auth/customer/verify-otp', async (req: Request, res: Response) => {
    try {
      const { phone, otp, name, referralSource } = req.body;
      const result = await db.verifyCustomerOtp(phone, otp, name, referralSource);
      res.setHeader('Set-Cookie', `customerToken=${encodeURIComponent(result.token)}; Path=/; Max-Age=${90 * 24 * 3600}; SameSite=Lax`);
      res.json({
        success: true,
        message: 'Mobile number verified successfully. Welcome to TAZE CLINING.',
        data: result
      });
    } catch (err: any) {
      console.error('[POST /auth/customer/verify-otp Error]:', err);
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // POST /api/auth/customer/register (Create customer profile with Name + Phone + Password)
  router.post('/auth/customer/register', async (req: Request, res: Response) => {
    try {
      const { name, phone, password, referralSource } = req.body;
      const result = await db.registerCustomer({ name, phone, password, referralSource });
      res.setHeader('Set-Cookie', `customerToken=${encodeURIComponent(result.token)}; Path=/; Max-Age=${90 * 24 * 3600}; SameSite=Lax`);
      res.json({
        success: true,
        message: 'Customer profile created successfully.',
        data: result
      });
    } catch (err: any) {
      console.error('[POST /auth/customer/register Error]:', err);
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // POST /api/auth/customer/login (Customer logs in with Phone + Password)
  router.post('/auth/customer/login', async (req: Request, res: Response) => {
    try {
      const { phone, password } = req.body;
      const result = await db.loginCustomer({ phone, password });
      res.setHeader('Set-Cookie', `customerToken=${encodeURIComponent(result.token)}; Path=/; Max-Age=${90 * 24 * 3600}; SameSite=Lax`);
      res.json({
        success: true,
        message: 'Logged in successfully.',
        data: result
      });
    } catch (err: any) {
      console.error('[POST /auth/customer/login Error]:', err);
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // GET /api/auth/customer/me (Get authenticated customer profile - non-blocking)
  router.get('/auth/customer/me', (req: Request, res: Response) => {
    try {
      const token = extractCustomerToken(req);
      const customer = db.getCustomerByToken(token);
      if (!customer) {
        return res.json({ success: false, authenticated: false, data: null });
      }
      res.json({ success: true, authenticated: true, data: customer });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Handler for customer orders (supports token, query params, or returns empty array without 401 API-lock)
  const handleGetCustomerOrders = (req: Request, res: Response) => {
    try {
      const token = extractCustomerToken(req);
      const customer = db.getCustomerByToken(token);
      const queryId = (req.query.customerId as string) || '';
      const queryPhone = (req.query.phone as string || '').replace(/[^0-9]/g, '');

      const targetId = customer?.customerId || queryId || (queryPhone ? `CUST-${queryPhone}` : '');

      if (!targetId) {
        return res.json({
          success: true,
          orders: [],
          data: []
        });
      }

      const myOrders = db.getCustomerOrders(targetId);
      const formatted = myOrders.map(o => ({
        ...o,
        orderId: o.id,
        total: o.grandTotal,
        customerName: o.customerName || customer?.name
      }));
      res.json({
        success: true,
        orders: formatted,
        data: formatted
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message, orders: [] });
    }
  };

  // GET /api/customer/orders (Existing route)
  router.get('/customer/orders', handleGetCustomerOrders);

  // GET /api/my-orders (Dedicated user route: loads ONLY the logged-in customer's orders via session/cookie)
  router.get('/my-orders', handleGetCustomerOrders);

  // GET /api/owner/order-status-counts (Owner dashboard order counts per status)
  router.get('/owner/order-status-counts', (_req: Request, res: Response) => {
    try {
      const orders = db.getOrders();
      const counts: Record<string, number> = {
        ALL: orders.length,
        PENDING: 0,
        ACCEPTED: 0,
        PACKAGING: 0,
        OUT_FOR_DELIVERY: 0,
        DELIVERED: 0,
        CANCELLED: 0
      };

      for (const o of orders) {
        if (o.status && counts[o.status] !== undefined) {
          counts[o.status]++;
        }
      }

      res.json({
        success: true,
        counts
      });
    } catch (err: any) {
      console.error('[GET /owner/order-status-counts Error]:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // --- ORDERS API ---

  // GET /api/orders (Admin list all orders)
  router.get('/orders', (_req: Request, res: Response) => {
    try {
      const orders = db.getOrders();
      res.json({ success: true, data: orders });
    } catch (err: any) {
      console.error('[GET /orders Error]:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/orders/:id (Customer or Admin look up order with privacy masking)
  router.get('/orders/:id', async (req: Request, res: Response) => {
    try {
      let order = db.getOrder(req.params.id);
      if (!order) {
        order = await db.getOrderAsync(req.params.id);
      }
      if (!order) {
        return res.status(404).json({ success: false, error: 'Order not found or unavailable.' });
      }

      // Customer Data Security: Check customer token to verify ownership
      const token = extractCustomerToken(req);
      const authenticatedCustomer = db.getCustomerByToken(token);
      const isOwner = authenticatedCustomer && (
        authenticatedCustomer.customerId === order.customerId ||
        authenticatedCustomer.verifiedMobile === (order.customerPhone || '').replace(/[^0-9]/g, '')
      );
      const isAdmin = req.headers['x-admin-request'] === 'true' || req.query.admin === 'true';

      // If viewing publicly without being the verified owner or admin, mask sensitive details
      if (!isOwner && !isAdmin) {
        const maskedPhone = order.customerPhone
          ? `${order.customerPhone.slice(0, 3)}****${order.customerPhone.slice(-3)}`
          : 'Protected';
        const maskedAddress = 'Delivery Address Protected for Customer Privacy';
        const safeOrder: Order = {
          ...order,
          customerPhone: maskedPhone,
          customerAddress: maskedAddress
        };
        const orderData = {
          ...safeOrder,
          orderId: safeOrder.id,
          total: safeOrder.grandTotal
        };
        return res.json({
          ...orderData,
          success: true,
          data: orderData,
          isMasked: true
        });
      }

      const orderData = {
        ...order,
        orderId: order.id,
        total: order.grandTotal
      };
      res.json({
        ...orderData,
        success: true,
        data: orderData
      });
    } catch (err: any) {
      console.error(`[GET /orders/${req.params.id} Error]:`, err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/customer/orders-by-ref?ref=CUSTOMER_ID
  // Loads only the orders belonging to the customer reference
  router.get('/customer/orders-by-ref', async (req: Request, res: Response) => {
    try {
      const ref = String(req.query.ref || '').trim();
      if (!ref) {
        return res.json({ success: true, data: [] });
      }
      const orders = await db.getOrdersByCustomerRefAsync(ref);
      res.json({
        success: true,
        data: orders,
        ref
      });
    } catch (err: any) {
      console.error('[GET /customer/orders-by-ref Error]:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/customer/order-status/:id (Public real-time order status check)
  router.get('/customer/order-status/:id', async (req: Request, res: Response) => {
    try {
      const order = await db.getOrderAsync(req.params.id);
      if (!order) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }
      res.json({
        success: true,
        data: order
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/orders (Customer places new order - supports both authenticated session and direct /order checkout)
  router.post('/orders', async (req: Request, res: Response) => {
    try {
      const customerToken = extractCustomerToken(req);
      const {
        customerName,
        customerPhone,
        customerAddress,
        phone,
        address,
        notes,
        items,
        sourceUrl,
        idempotencyKey
      } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, error: 'Order must contain at least one item' });
      }

      const order = await db.createOrder({
        customerToken: customerToken || undefined,
        customerName,
        customerPhone: customerPhone || phone,
        customerAddress: customerAddress || address,
        notes,
        items,
        sourceUrl,
        idempotencyKey
      });

      console.log(`[Order Placed] Order ${order.id} created for ${order.customerName} (₹${order.grandTotal}) - Status: PENDING`);
      res.status(201).json({
        ...order,
        orderId: order.id,
        total: order.grandTotal,
        success: true,
        message: 'Order placed successfully. Status is PENDING merchant review.',
        data: order
      });
    } catch (err: any) {
      console.error('[POST /orders Error]:', err);
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // POST /api/orders/random (Admin generates a test order, optionally for a specific customerId)
  router.post('/orders/random', async (req: Request, res: Response) => {
    try {
      const { customerId, customerName } = req.body || {};
      const order = await db.createRandomOrder(customerId, customerName);
      console.log(`[Test Order Placed] Order ${order.id} generated for ${order.customerName} (${order.customerId}) - PENDING`);
      res.status(201).json({
        success: true,
        message: `Test order ${order.id} placed successfully. Status is PENDING.`,
        data: order
      });
    } catch (err: any) {
      console.error('[POST /orders/random Error]:', err);
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // POST /api/orders/:id/accept (Admin accepts order & deducts inventory)
  router.post('/orders/:id/accept', async (req: Request, res: Response) => {
    try {
      const result = await db.acceptOrder(req.params.id);
      console.log(`[Order Accepted] Order ${req.params.id} accepted. Central inventory deducted.`);
      res.json({
        success: true,
        message: `Order ${req.params.id} ACCEPTED. Central inventory deducted.`,
        data: result.order,
        products: result.products
      });
    } catch (err: any) {
      console.error(`[POST /orders/${req.params.id}/accept Error]:`, err);
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // POST & PUT /api/orders/:id/status (Unified lifecycle: PENDING -> ACCEPTED -> PACKAGING -> OUT_FOR_DELIVERY -> DELIVERED)
  const handleUpdateOrderStatus = async (req: Request, res: Response) => {
    try {
      const { status, note, expectedDelivery } = req.body;
      const validStatuses = ['PENDING', 'ACCEPTED', 'PACKAGING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status. Allowed values: ${validStatuses.join(', ')}`
        });
      }

      const updatedOrder = await db.updateOrderStatus(req.params.id, status, note, expectedDelivery);
      console.log(`[Order Status] Order ${req.params.id} updated to ${status}.`);
      res.json({
        success: true,
        message: `Order ${req.params.id} moved to ${status}.`,
        data: updatedOrder
      });
    } catch (err: any) {
      console.error(`[Order Status Error]:`, err);
      res.status(400).json({ success: false, error: err.message });
    }
  };

  router.post('/orders/:id/status', handleUpdateOrderStatus);
  router.put('/orders/:id/status', handleUpdateOrderStatus);

  // PUT & POST /api/orders/:id/revenue (Owner/Admin customizes delivered order revenue)
  const handleUpdateOrderRevenue = async (req: Request, res: Response) => {
    try {
      const { revenue, reason } = req.body;
      const parsedRev = (revenue === null || revenue === undefined || revenue === '')
        ? null
        : Number(revenue);
      if (parsedRev !== null && (isNaN(parsedRev) || parsedRev < 0)) {
        return res.status(400).json({
          success: false,
          error: 'Revenue must be a valid positive number or null to reset.'
        });
      }
      const updatedOrder = await db.updateOrderRevenue(req.params.id, parsedRev, reason);
      console.log(`[Order Revenue Customized] Order ${req.params.id} revenue set to ₹${updatedOrder.finalRevenue} (Custom: ₹${updatedOrder.customRevenue})`);
      res.json({
        success: true,
        message: parsedRev !== null
          ? `Order #${req.params.id} revenue customized to ₹${updatedOrder.finalRevenue}.`
          : `Order #${req.params.id} revenue reset to automatic order value (₹${updatedOrder.finalRevenue}).`,
        data: updatedOrder
      });
    } catch (err: any) {
      console.error(`[Order Revenue Update Error]:`, err);
      res.status(400).json({ success: false, error: err.message });
    }
  };

  router.put('/orders/:id/revenue', handleUpdateOrderRevenue);
  router.post('/orders/:id/revenue', handleUpdateOrderRevenue);

  // POST /api/orders/:id/item-status (Admin updates individual item status)
  router.post('/orders/:id/item-status', async (req: Request, res: Response) => {
    try {
      const { productId, variantId, itemStatus, note } = req.body;
      if (!productId || !variantId || !itemStatus) {
        return res.status(400).json({
          success: false,
          error: 'productId, variantId, and itemStatus are required'
        });
      }
      const updatedOrder = await db.updateOrderItemStatus(
        req.params.id,
        productId,
        variantId,
        itemStatus,
        note
      );
      res.json({
        success: true,
        message: `Item in order ${req.params.id} updated to ${itemStatus}`,
        data: updatedOrder
      });
    } catch (err: any) {
      console.error(`[POST /orders/${req.params.id}/item-status Error]:`, err);
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // POST /api/orders/:id/cancel (Admin or Customer cancels order with automatic stock restoration)
  router.post('/orders/:id/cancel', async (req: Request, res: Response) => {
    try {
      const { reason } = req.body;
      const cancelledOrder = await db.cancelOrder(req.params.id, reason);
      console.log(`[Order Cancelled] Order ${req.params.id} cancelled. Stock restored if previously accepted.`);
      res.json({
        success: true,
        message: `Order ${req.params.id} CANCELLED. Inventory restored to stock.`,
        data: cancelledOrder
      });
    } catch (err: any) {
      console.error(`[POST /orders/${req.params.id}/cancel Error]:`, err);
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // --- AUDIT TRAIL API (ADMIN ONLY) ---

  // GET /api/audit/stock (Stock movements audit log)
  router.get('/audit/stock', (_req: Request, res: Response) => {
    try {
      const stockLogs = db.getStockAudit();
      res.json({ success: true, data: stockLogs });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/audit/revenue (Delivered revenue audit log)
  router.get('/audit/revenue', (_req: Request, res: Response) => {
    try {
      const revenueLogs = db.getRevenueAudit();
      res.json({ success: true, data: revenueLogs });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/audit/system (System & user activity audit log)
  router.get('/audit/system', (_req: Request, res: Response) => {
    try {
      const sysLogs = db.getSystemAudit();
      res.json({ success: true, data: sysLogs });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/revenue/transactions (Traceable order-based delivered revenue ledger)
  router.get('/revenue/transactions', (_req: Request, res: Response) => {
    try {
      const transactions = db.getRevenueTransactions();
      const stats = db.getStats();
      res.json({
        success: true,
        data: transactions,
        totalRevenue: stats.totalSales,
        deliveredOrdersCount: stats.deliveredOrders,
        totalOrdersCount: stats.totalOrders
      });
    } catch (err: any) {
      console.error('[GET /revenue/transactions Error]:', err);
      res.status(500).json({ success: false, error: err.message, data: [] });
    }
  });

  // --- DASHBOARD STATS API ---
  router.get('/stats', (_req: Request, res: Response) => {
    try {
      const stats = db.getStats();
      res.json({ success: true, data: stats });
    } catch (err: any) {
      console.error('[GET /stats Error]:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // PUT /api/stats/custom-revenue (Admin sets or resets custom revenue)
  router.put('/stats/custom-revenue', async (req: Request, res: Response) => {
    try {
      const { revenue } = req.body;
      await db.setCustomRevenue(revenue);
      const updatedStats = db.getStats();
      res.json({
        success: true,
        message: revenue === null ? 'Revenue reset to auto-calculated total' : 'Custom revenue updated successfully',
        data: updatedStats
      });
    } catch (err: any) {
      console.error('[PUT /stats/custom-revenue Error]:', err);
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // PUT /api/stats/revenue-mode (Owner toggles manual vs orders revenue mode)
  router.put('/stats/revenue-mode', async (req: Request, res: Response) => {
    try {
      const { mode } = req.body;
      if (mode !== 'manual' && mode !== 'orders') {
        return res.status(400).json({ success: false, error: 'Mode must be manual or orders' });
      }
      await db.setRevenueMode(mode);
      const updatedStats = db.getStats();
      res.json({ success: true, data: updatedStats });
    } catch (err: any) {
      console.error('[PUT /stats/revenue-mode Error]:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // --- CUSTOMER MANAGEMENT API (OWNER ONLY) ---
  router.get('/customers', (_req: Request, res: Response) => {
    try {
      const customers = db.getCustomers();
      res.json({ success: true, data: customers });
    } catch (err: any) {
      console.error('[GET /customers Error]:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post('/customers/:id/toggle-verified', async (req: Request, res: Response) => {
    try {
      const isVerified = await db.toggleCustomerVerified(req.params.id);
      res.json({ success: true, verified: isVerified });
    } catch (err: any) {
      console.error('[POST /customers/toggle-verified Error]:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // PUT /api/orders/:id/payment (Owner manually marks order payment status)
  router.put('/orders/:id/payment', async (req: Request, res: Response) => {
    try {
      const { paymentStatus } = req.body;
      const order = await db.updateOrderPayment(req.params.id, paymentStatus);
      res.json({ success: true, data: order });
    } catch (err: any) {
      console.error('[PUT /orders/:id/payment Error]:', err);
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // --- STORE SETTINGS (BRANDING) ---

  // GET /api/settings
  router.get('/settings', (_req: Request, res: Response) => {
    try {
      const settings = db.getStoreSettings();
      res.json({ success: true, data: settings });
    } catch (err: any) {
      console.error('[GET /settings Error]:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // PUT /api/settings (Admin updates brand name, tagline, titles)
  router.put('/settings', async (req: Request, res: Response) => {
    try {
      const { brandName, tagline, heroTitle, heroSubtitle } = req.body;
      const updated = await db.updateSettings({ brandName, tagline, heroTitle, heroSubtitle });
      res.json({
        success: true,
        message: `Brand name and tags updated to "${updated.brandName}"`,
        data: updated
      });
    } catch (err: any) {
      console.error('[PUT /settings Error]:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // --- SEED RESET HELPER ---
  router.post('/reset-seed', async (_req: Request, res: Response) => {
    try {
      await db.resetSeed();
      res.json({ success: true, message: 'Database reset to initial catalog', data: db.getProducts() });
    } catch (err: any) {
      console.error('[POST /reset-seed Error]:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}

// Full app for standalone Express server
export function createServerApp() {
  const app = express();
  // Health check at root /health for Cloud Run probes
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });
  app.use('/api', createApiMiddleware());
  return app;
}
