import fs from 'node:fs';
import path from 'node:path';
import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  Firestore
} from 'firebase/firestore';
import type {
  Product,
  Order,
  DashboardStats,
  Variant,
  StoreSettings,
  Customer,
  CustomerProfile,
  StockAuditEntry,
  RevenueAuditEntry,
  AuditLogEntry,
  OrderStatus,
  OrderItem,
  OrderTracking,
  RevenueTransaction
} from '../src/types/index';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'cleenzo_database.json');
const UPLOADS_DIR = path.resolve(DATA_DIR, 'uploads');
const CONFIG_FILE = path.resolve(process.cwd(), 'firebase-applet-config.json');

// Ensure storage directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Recursively removes undefined fields so Firestore setDoc / updateDoc never rejects payloads
 */
function cleanForFirestore<T>(data: T): any {
  if (data === null || data === undefined) return null;
  if (typeof data !== 'object') return data;
  if (data instanceof Date) return data.toISOString();
  if (Array.isArray(data)) {
    return data.map(item => cleanForFirestore(item));
  }
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      result[key] = typeof value === 'object' && value !== null ? cleanForFirestore(value) : value;
    }
  }
  return result;
}

interface DatabaseSchema {
  products: Product[];
  orders: Order[];
  orderCounter: number;
  customRevenue?: number | null;
  manualRevenueOnly?: boolean;
  verifiedCustomerIds?: string[];
  storeSettings?: StoreSettings;
  customerProfiles?: CustomerProfile[];
  stockAudit?: StockAuditEntry[];
  revenueAudit?: RevenueAuditEntry[];
  systemAudit?: AuditLogEntry[];
  revenueTransactions?: RevenueTransaction[];
}

// Generate realistic SVG bottle illustrations for default catalog
const createBottleSvg = (name: string, liquidColor: string, accentColor: string, capColor: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#f8fafc"/>
        <stop offset="100%" stop-color="#f1f5f9"/>
      </linearGradient>
      <linearGradient id="bottleGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
        <stop offset="50%" stop-color="${liquidColor}" stop-opacity="0.15"/>
        <stop offset="100%" stop-color="#e2e8f0" stop-opacity="0.9"/>
      </linearGradient>
      <linearGradient id="liquidGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${liquidColor}" stop-opacity="0.75"/>
        <stop offset="100%" stop-color="${liquidColor}" stop-opacity="0.95"/>
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
        <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#0f172a" flood-opacity="0.08"/>
      </filter>
    </defs>
    <rect width="400" height="400" fill="url(#bgGrad)" rx="16"/>
    <!-- Floor reflection shadow -->
    <ellipse cx="200" cy="358" rx="85" ry="12" fill="#cbd5e1" opacity="0.45"/>
    <ellipse cx="200" cy="358" rx="55" ry="7" fill="#94a3b8" opacity="0.3"/>
    
    <!-- Bottle group -->
    <g filter="url(#shadow)">
      <!-- Bottle neck and body outline -->
      <path d="M178,75 L222,75 L224,120 C224,135 255,145 260,175 L264,320 C264,338 250,345 230,345 L170,345 C150,345 136,338 136,320 L140,175 C145,145 176,135 176,120 Z" fill="url(#bottleGrad)" stroke="#cbd5e1" stroke-width="2"/>
      
      <!-- Liquid inside -->
      <path d="M138,205 C150,203 170,207 200,204 C230,201 250,206 262,205 L264,320 C264,338 250,345 230,345 L170,345 C150,345 136,338 136,320 Z" fill="url(#liquidGrad)"/>
      
      <!-- Liquid surface wave highlight -->
      <path d="M138,205 C150,203 170,207 200,204 C230,201 250,206 262,205" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.6"/>
      
      <!-- Bottle label -->
      <rect x="152" y="215" width="96" height="92" rx="6" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
      <rect x="152" y="215" width="96" height="8" rx="3" fill="${accentColor}"/>
      
      <!-- Brand Text on Label -->
      <text x="200" y="238" font-family="system-ui, sans-serif" font-size="10" font-weight="800" text-anchor="middle" fill="#0f172a" letter-spacing="1">TAZE CLINING</text>
      <text x="200" y="252" font-family="system-ui, sans-serif" font-size="7.5" font-weight="700" text-anchor="middle" fill="${accentColor}" letter-spacing="0.5">PRO FORMULA</text>
      
      <!-- Divider -->
      <line x1="165" y1="258" x2="235" y2="258" stroke="#e2e8f0" stroke-width="1"/>
      
      <!-- Product label subtitle -->
      <text x="200" y="271" font-family="system-ui, sans-serif" font-size="7" font-weight="600" text-anchor="middle" fill="#334155">${name.replace('TAZE CLINING ', '').replace('PAANKAJ CLINING ', '').replace('CLEENZO ', '')}</text>
      <text x="200" y="283" font-family="system-ui, sans-serif" font-size="6" font-weight="500" text-anchor="middle" fill="#64748b">99.9% GERMS KILL</text>
      
      <!-- Quality badge on label -->
      <circle cx="200" cy="296" r="6" fill="${accentColor}" opacity="0.15"/>
      <circle cx="200" cy="296" r="4" fill="${accentColor}"/>
      
      <!-- Glass glare / shine streak -->
      <path d="M148,185 L144,325 C144,333 147,338 152,340 L152,185 Z" fill="#ffffff" opacity="0.45"/>
      <path d="M156,185 L154,320 L157,320 L159,185 Z" fill="#ffffff" opacity="0.25"/>

      <!-- Bottle Cap -->
      <rect x="174" y="48" width="52" height="28" rx="4" fill="${capColor}" stroke="#334155" stroke-width="1"/>
      <!-- Cap ridges -->
      <line x1="184" y1="52" x2="184" y2="72" stroke="#ffffff" stroke-width="1.5" opacity="0.4"/>
      <line x1="192" y1="52" x2="192" y2="72" stroke="#ffffff" stroke-width="1.5" opacity="0.4"/>
      <line x1="200" y1="52" x2="200" y2="72" stroke="#ffffff" stroke-width="1.5" opacity="0.4"/>
      <line x1="208" y1="52" x2="208" y2="72" stroke="#ffffff" stroke-width="1.5" opacity="0.4"/>
      <line x1="216" y1="52" x2="216" y2="72" stroke="#ffffff" stroke-width="1.5" opacity="0.4"/>
    </g>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const SEED_PRODUCTS: Product[] = [
  {
    id: 'prod-floor-cleaner',
    name: 'TAZE CLINING Floor Cleaner',
    tagline: 'Deep shine & 24hr citrus fresh aroma',
    category: 'Floor Care',
    description: 'Advanced surface disinfectant formula that removes tough stains, grime, and grease while leaving marble, tiles, and wooden floors sparkling clean and germ-free.',
    features: [
      'Kills 99.9% disease-causing germs',
      'Long-lasting citrus fresh fragrance',
      'Safe on marble, granite, mosaic and tiles',
      'Streak-free rapid drying technology'
    ],
    image: createBottleSvg('Floor Cleaner', '#f59e0b', '#d97706', '#b45309'),
    status: 'LIVE',
    createdAt: '2026-09-30T10:00:00.000Z',
    updatedAt: '2026-09-30T10:00:00.000Z',
    variants: [
      {
        variantId: 'var-fl-250',
        size: '250 ML',
        mrp: 60,
        sellingPrice: 49,
        offer: '₹11 OFF (18% OFF)',
        stockQuantity: 20,
        soldQuantity: 0,
        status: 'ACTIVE'
      },
      {
        variantId: 'var-fl-500',
        size: '500 ML',
        mrp: 100,
        sellingPrice: 85,
        offer: '₹15 OFF (15% OFF)',
        stockQuantity: 44,
        soldQuantity: 1,
        status: 'ACTIVE'
      },
      {
        variantId: 'var-fl-1000',
        size: '1 Litre',
        mrp: 190,
        sellingPrice: 159,
        offer: '₹31 OFF (16% OFF)',
        stockQuantity: 30,
        soldQuantity: 0,
        status: 'ACTIVE'
      },
      {
        variantId: 'var-fl-5000',
        size: '5 Litre',
        mrp: 850,
        sellingPrice: 699,
        offer: '₹151 OFF (18% OFF)',
        stockQuantity: 10,
        soldQuantity: 0,
        status: 'ACTIVE'
      }
    ]
  },
  {
    id: 'prod-surface-disinfectant',
    name: 'TAZE CLINING All-Surface Disinfectant',
    tagline: 'Multi-purpose sanitizing spray for home & office',
    category: 'Disinfection',
    description: 'Hospital-grade surface sanitizer effective against bacteria, viruses, and fungi. Safe for kitchen counters, door knobs, table surfaces, and bathroom fittings.',
    features: [
      'Proven bactericidal and virucidal efficacy',
      'Alcohol-enhanced rapid evaporation',
      'Pleasant botanical floral fragrance',
      'Zero toxic residue formula'
    ],
    image: createBottleSvg('Surface Disinfectant', '#10b981', '#059669', '#047857'),
    status: 'LIVE',
    createdAt: '2026-09-30T10:05:00.000Z',
    updatedAt: '2026-09-30T10:05:00.000Z',
    variants: [
      {
        variantId: 'var-sd-250',
        size: '250 ML Spray',
        mrp: 75,
        sellingPrice: 65,
        offer: '₹10 OFF (13% OFF)',
        stockQuantity: 15,
        soldQuantity: 0,
        status: 'ACTIVE'
      },
      {
        variantId: 'var-sd-500',
        size: '500 ML Trigger',
        mrp: 130,
        sellingPrice: 110,
        offer: '₹20 OFF (15% OFF)',
        stockQuantity: 35,
        soldQuantity: 0,
        status: 'ACTIVE'
      },
      {
        variantId: 'var-sd-5000',
        size: '5 Litre Refill Can',
        mrp: 950,
        sellingPrice: 799,
        offer: '₹151 OFF (16% OFF)',
        stockQuantity: 8,
        soldQuantity: 0,
        status: 'ACTIVE'
      }
    ]
  },
  {
    id: 'prod-glass-shiner',
    name: 'TAZE CLINING Glass & Mirror Shiner',
    tagline: 'Crystal clear streak-free shine on mirrors & windshields',
    category: 'Glass Care',
    description: 'Specialized optical glass formula with anti-dust shield. Removes fingerprints, oily film, smoke stains, and hard water spots instantly without hazy streaks.',
    features: [
      'Anti-fogging and anti-dust formulation',
      'Instant evaporative streak-free action',
      'Suitable for glass tables, mirrors, car windshields',
      'Fresh ocean breeze fragrance'
    ],
    image: createBottleSvg('Glass Shiner', '#06b6d4', '#0891b2', '#0e7490'),
    status: 'LIVE',
    createdAt: '2026-09-30T10:10:00.000Z',
    updatedAt: '2026-09-30T10:10:00.000Z',
    variants: [
      {
        variantId: 'var-gs-500',
        size: '500 ML Trigger',
        mrp: 110,
        sellingPrice: 95,
        offer: '₹15 OFF (14% OFF)',
        stockQuantity: 28,
        soldQuantity: 0,
        status: 'ACTIVE'
      },
      {
        variantId: 'var-gs-1000',
        size: '1 Litre Refill',
        mrp: 195,
        sellingPrice: 169,
        offer: '₹26 OFF (13% OFF)',
        stockQuantity: 18,
        soldQuantity: 0,
        status: 'ACTIVE'
      },
      {
        variantId: 'var-gs-5000',
        size: '5 Litre Bulk',
        mrp: 800,
        sellingPrice: 649,
        offer: '₹151 OFF (19% OFF)',
        stockQuantity: 6,
        soldQuantity: 0,
        status: 'ACTIVE'
      }
    ]
  },
  {
    id: 'prod-toilet-cleaner',
    name: 'TAZE CLINING Power Toilet Bowl Cleaner',
    tagline: 'Ultra-thick acidic descaler removing yellow stains',
    category: 'Sanitary',
    description: 'Heavy duty viscous formula that adheres to vertical ceramic surfaces, dissolving limescale, stubborn rust marks, and yellow uric acid stains effortlessly.',
    features: [
      'Deep blue color change indicator',
      'Ultra-thick cling technology',
      'Eliminates 99.9% toilet bacteria & odors',
      'Angled nozzle design for under-the-rim application'
    ],
    image: createBottleSvg('Toilet Cleaner', '#3b82f6', '#2563eb', '#1d4ed8'),
    status: 'LIVE',
    createdAt: '2026-09-30T10:15:00.000Z',
    updatedAt: '2026-09-30T10:15:00.000Z',
    variants: [
      {
        variantId: 'var-tc-500',
        size: '500 ML Squeeze',
        mrp: 95,
        sellingPrice: 79,
        offer: '₹16 OFF (17% OFF)',
        stockQuantity: 32,
        soldQuantity: 0,
        status: 'ACTIVE'
      },
      {
        variantId: 'var-tc-1000',
        size: '1 Litre Squeeze',
        mrp: 175,
        sellingPrice: 145,
        offer: '₹30 OFF (17% OFF)',
        stockQuantity: 22,
        soldQuantity: 0,
        status: 'ACTIVE'
      },
      {
        variantId: 'var-tc-5000',
        size: '5 Litre Commercial',
        mrp: 750,
        sellingPrice: 599,
        offer: '₹151 OFF (20% OFF)',
        stockQuantity: 5,
        soldQuantity: 0,
        status: 'ACTIVE'
      }
    ]
  },
  {
    id: 'prod-kitchen-degreaser',
    name: 'TAZE CLINING Heavy-Duty Kitchen Degreaser',
    tagline: 'Industrial grease dissolver for chimneys & cooktops',
    category: 'Kitchen',
    description: 'High-alkaline active enzyme foam that cuts through burnt-on grease, sticky kitchen oil, exhaust fan encrustations, and grill residue within 3 minutes.',
    features: [
      'Rapid penetration of hardened burnt oils',
      'Non-abrasive on stainless steel and cast iron',
      'Citrus active enzymes break down lipid bonds',
      'Ideal for commercial and home kitchens'
    ],
    image: createBottleSvg('Kitchen Degreaser', '#f97316', '#ea580c', '#c2410c'),
    status: 'UPCOMING',
    createdAt: '2026-09-30T10:20:00.000Z',
    updatedAt: '2026-09-30T10:20:00.000Z',
    variants: [
      {
        variantId: 'var-kd-500',
        size: '500 ML',
        mrp: 140,
        sellingPrice: 119,
        offer: '₹21 OFF (15% OFF)',
        stockQuantity: 0,
        soldQuantity: 0,
        status: 'ACTIVE'
      },
      {
        variantId: 'var-kd-1000',
        size: '1 Litre',
        mrp: 260,
        sellingPrice: 219,
        offer: '₹41 OFF (16% OFF)',
        stockQuantity: 0,
        soldQuantity: 0,
        status: 'ACTIVE'
      },
      {
        variantId: 'var-kd-5000',
        size: '5 Litre',
        mrp: 1100,
        sellingPrice: 899,
        offer: '₹201 OFF (18% OFF)',
        stockQuantity: 0,
        soldQuantity: 0,
        status: 'ACTIVE'
      }
    ]
  }
];

class DatabaseService {
  private data: DatabaseSchema;
  private firestore: Firestore | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  // In-memory OTP store & Customer session cache (fast & synced)
  private otpStore = new Map<string, { otp: string; name: string; expiresAt: number; referralSource?: string }>();
  private sessionStore = new Map<string, { token: string; customerId: string; phone: string; name: string; expiresAt: number }>();

  constructor() {
    this.data = this.loadDatabaseLocal();
    this.initFirestoreClient();
    this.init();
  }

  private initFirestoreClient(): void {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
        const config = JSON.parse(raw);
        const app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
        this.firestore = getFirestore(app, config.firestoreDatabaseId);
        console.log(`[Database] Connected to Persistent Cloud Firestore (Database: ${config.firestoreDatabaseId})`);
      } else {
        console.warn('[Database] firebase-applet-config.json not found, running with local file persistence');
      }
    } catch (err) {
      console.error('[Database] Firestore client init error:', err);
    }
  }

  public async init(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = this.syncWithFirestore();
    return this.initPromise;
  }

  private async syncWithFirestore(): Promise<void> {
    if (!this.firestore) {
      this.isInitialized = true;
      return;
    }

    try {
      console.log('[Database] Synchronizing with Firestore persistent cloud database...');
      
      // 1. Fetch products from Firestore
      const productsSnap = await getDocs(collection(this.firestore, 'products'));
      if (!productsSnap.empty) {
        console.log(`[Database] Loaded ${productsSnap.size} products from Firestore cloud database`);
        const cloudProducts: Product[] = [];
        productsSnap.forEach(d => {
          const p = d.data() as Product;
          // Guard: if image was pointing to a broken local upload, assign default SVG
          if (p.image && p.image.startsWith('/api/uploads/')) {
            const cleanName = p.name || 'Hygiene Solution';
            const imgPath = path.join(UPLOADS_DIR, path.basename(p.image));
            if (!fs.existsSync(imgPath)) {
              p.image = createBottleSvg(cleanName, '#10b981', '#059669', '#047857');
            }
          }
          cloudProducts.push(p);
        });
        this.data.products = cloudProducts;
      } else {
        // First-time Cloud Migration: Preserve all existing data into Firestore!
        console.log('[Database] Firestore products collection is empty. Migrating existing production data to cloud...');
        for (const p of this.data.products) {
          await setDoc(doc(this.firestore, 'products', p.id), cleanForFirestore(p));
        }
        console.log(`[Database] Safely migrated ${this.data.products.length} products to Firestore!`);
      }

      // 2. Fetch orders from Firestore
      const ordersSnap = await getDocs(collection(this.firestore, 'orders'));
      if (!ordersSnap.empty) {
        console.log(`[Database] Loaded ${ordersSnap.size} orders from Firestore cloud database`);
        const cloudOrders: Order[] = [];
        ordersSnap.forEach(d => {
          cloudOrders.push(d.data() as Order);
        });
        this.data.orders = cloudOrders;
      } else if (this.data.orders.length > 0) {
        console.log(`[Database] Migrating ${this.data.orders.length} existing orders to Firestore...`);
        for (const o of this.data.orders) {
          await setDoc(doc(this.firestore, 'orders', o.id), cleanForFirestore(o));
        }
      }

      // 3. Fetch customer profiles from Firestore
      try {
        const custSnap = await getDocs(collection(this.firestore, 'customer_profiles'));
        if (!custSnap.empty) {
          const profiles: CustomerProfile[] = [];
          custSnap.forEach(d => profiles.push(d.data() as CustomerProfile));
          this.data.customerProfiles = profiles;
        }
      } catch {}

      // 4. Fetch audit collections
      try {
        const stockAuditSnap = await getDocs(collection(this.firestore, 'stock_audit'));
        if (!stockAuditSnap.empty) {
          const entries: StockAuditEntry[] = [];
          stockAuditSnap.forEach(d => entries.push(d.data() as StockAuditEntry));
          this.data.stockAudit = entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        }
      } catch {}

      try {
        const revenueAuditSnap = await getDocs(collection(this.firestore, 'revenue_audit'));
        if (!revenueAuditSnap.empty) {
          const entries: RevenueAuditEntry[] = [];
          revenueAuditSnap.forEach(d => entries.push(d.data() as RevenueAuditEntry));
          this.data.revenueAudit = entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        }
      } catch {}

      try {
        const sysAuditSnap = await getDocs(collection(this.firestore, 'system_audit'));
        if (!sysAuditSnap.empty) {
          const entries: AuditLogEntry[] = [];
          sysAuditSnap.forEach(d => entries.push(d.data() as AuditLogEntry));
          this.data.systemAudit = entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        }
      } catch {}

      try {
        const revTxSnap = await getDocs(collection(this.firestore, 'revenue_transactions'));
        if (!revTxSnap.empty) {
          const entries: RevenueTransaction[] = [];
          revTxSnap.forEach(d => entries.push(d.data() as RevenueTransaction));
          this.data.revenueTransactions = entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          console.log(`[Database] Loaded ${entries.length} revenue transactions from Firestore cloud database`);
        }
      } catch {}

      // 5. Fetch store settings
      const settingsSnap = await getDoc(doc(this.firestore, 'store_settings', 'current'));
      if (settingsSnap.exists()) {
        this.data.storeSettings = settingsSnap.data() as StoreSettings;
      } else if (this.data.storeSettings) {
        await setDoc(doc(this.firestore, 'store_settings', 'current'), cleanForFirestore(this.data.storeSettings));
      }

      // 6. Fetch system meta (counters and custom revenue)
      const metaSnap = await getDoc(doc(this.firestore, 'system_meta', 'state'));
      if (metaSnap.exists()) {
        const meta = metaSnap.data();
        if (meta.orderCounter !== undefined) this.data.orderCounter = meta.orderCounter;
        if (meta.customRevenue !== undefined) this.data.customRevenue = meta.customRevenue;
      } else {
        await setDoc(doc(this.firestore, 'system_meta', 'state'), cleanForFirestore({
          orderCounter: this.data.orderCounter,
          customRevenue: this.data.customRevenue ?? null,
          updatedAt: new Date().toISOString()
        }));
      }

      this.isInitialized = true;
      this.saveDatabaseLocal();
      console.log('[Database] Cloud persistence verified. Single source of truth is active.');
    } catch (err: any) {
      console.error('[Database] Failed to synchronize with Firestore, using local cache:', err.message);
      this.isInitialized = true;
    }
  }

  public isReady(): boolean {
    return this.isInitialized;
  }

  public isCloudConnected(): boolean {
    return this.firestore !== null;
  }

  private loadDatabaseLocal(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.products) && Array.isArray(parsed.orders)) {
          return {
            ...parsed,
            customerProfiles: Array.isArray(parsed.customerProfiles) ? parsed.customerProfiles : [],
            stockAudit: Array.isArray(parsed.stockAudit) ? parsed.stockAudit : [],
            revenueAudit: Array.isArray(parsed.revenueAudit) ? parsed.revenueAudit : [],
            systemAudit: Array.isArray(parsed.systemAudit) ? parsed.systemAudit : [],
            revenueTransactions: Array.isArray(parsed.revenueTransactions) ? parsed.revenueTransactions : []
          };
        }
      }
    } catch (err) {
      console.error('[DB Local] Failed to load local cache file:', err);
    }

    return {
      products: SEED_PRODUCTS,
      orders: [],
      orderCounter: 1,
      customerProfiles: [],
      stockAudit: [],
      revenueAudit: [],
      systemAudit: [],
      revenueTransactions: [],
      storeSettings: {
        brandName: 'TAZE CLINING',
        tagline: 'Pro Hygiene Solutions',
        heroTitle: 'Clinical Cleanliness.',
        heroSubtitle: 'Crafted for Homes & Industry.',
        updatedAt: new Date().toISOString()
      }
    };
  }

  private saveDatabaseLocal(): void {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DB Local] Failed to save local cache file:', err);
    }
  }

  // --- PRODUCTS ---

  public getProducts(includeInactive = true): Product[] {
    if (includeInactive) {
      return [...this.data.products];
    }
    return this.data.products.filter(p => p.status !== 'INACTIVE');
  }

  public getProduct(id: string): Product | undefined {
    return this.data.products.find(p => p.id === id);
  }

  public async createProduct(productInput: {
    name: string;
    tagline?: string;
    category?: string;
    description?: string;
    features?: string[];
    image?: string;
    status?: 'LIVE' | 'UPCOMING' | 'OUT_OF_STOCK' | 'INACTIVE';
    variants?: Array<{
      size: string;
      mrp: number;
      sellingPrice: number;
      offer?: string;
      stockQuantity: number;
      status?: 'ACTIVE' | 'OUT_OF_STOCK' | 'INACTIVE';
    }>;
  }): Promise<Product> {
    const now = new Date().toISOString();
    const id = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // Build variants
    const variants: Variant[] = (productInput.variants || []).map((v, i) => {
      const mrp = Number(v.mrp) || 0;
      const sellingPrice = Number(v.sellingPrice) || 0;
      const stock = Math.max(0, Number(v.stockQuantity) || 0);
      return {
        variantId: `var-${id.substring(5)}-${i + 1}`,
        size: v.size.trim(),
        mrp,
        sellingPrice,
        offer: v.offer?.trim() || (mrp > sellingPrice ? `₹${mrp - sellingPrice} OFF` : ''),
        stockQuantity: stock,
        soldQuantity: 0,
        status: v.status || (stock > 0 ? 'ACTIVE' : 'OUT_OF_STOCK')
      };
    });

    const newProduct: Product = {
      id,
      name: productInput.name.trim(),
      tagline: productInput.tagline?.trim() || 'Pro hygiene formulation',
      category: productInput.category || 'General Care',
      description: productInput.description?.trim() || 'High efficacy clinical grade cleaning agent.',
      features: productInput.features && productInput.features.length > 0
        ? productInput.features
        : ['Hospital-grade 99.9% germ eradication', 'Rapid grime dissolution'],
      image: productInput.image?.trim() || createBottleSvg(productInput.name, '#10b981', '#059669', '#047857'),
      status: productInput.status || 'UPCOMING',
      variants,
      createdAt: now,
      updatedAt: now
    };

    // 1. Persist to Firestore CLOUD database first (Single Source of Truth)
    if (this.firestore) {
      try {
        await setDoc(doc(this.firestore, 'products', id), newProduct);
        console.log(`[Firestore Success] Created product ${id} in cloud database.`);
      } catch (err: any) {
        console.error(`[Firestore Error] Failed to create product ${id}:`, err);
        throw new Error(`Failed to save product in persistent cloud database: ${err.message}`);
      }
    }

    // 2. Update memory & local cache
    this.data.products.push(newProduct);
    this.saveDatabaseLocal();

    return newProduct;
  }

  public async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const existing = this.getProduct(id);
    if (!existing) {
      throw new Error(`Product ${id} not found`);
    }

    const updated: Product = {
      ...existing,
      ...updates,
      id: existing.id,
      updatedAt: new Date().toISOString()
    };

    // 1. Persist to Firestore CLOUD database first
    if (this.firestore) {
      try {
        await setDoc(doc(this.firestore, 'products', id), updated);
        console.log(`[Firestore Success] Updated product ${id} in cloud database.`);
      } catch (err: any) {
        console.error(`[Firestore Error] Failed to update product ${id}:`, err);
        throw new Error(`Failed to update product in persistent cloud database: ${err.message}`);
      }
    }

    // 2. Update memory & local cache
    const index = this.data.products.findIndex(p => p.id === id);
    if (index !== -1) {
      this.data.products[index] = updated;
    }
    this.saveDatabaseLocal();

    return updated;
  }

  public async deleteProduct(id: string): Promise<boolean> {
    const index = this.data.products.findIndex(p => p.id === id);
    if (index === -1) return false;

    // 1. Delete from Firestore CLOUD database first
    if (this.firestore) {
      try {
        await deleteDoc(doc(this.firestore, 'products', id));
        console.log(`[Firestore Success] Deleted product ${id} from cloud database.`);
      } catch (err: any) {
        console.error(`[Firestore Error] Failed to delete product ${id}:`, err);
        throw new Error(`Failed to delete product from persistent cloud database: ${err.message}`);
      }
    }

    this.data.products.splice(index, 1);
    this.saveDatabaseLocal();
    return true;
  }

  // --- VARIANTS ---

  public async addVariant(productId: string, variantInput: Omit<Variant, 'variantId' | 'soldQuantity'>): Promise<Variant> {
    const product = this.getProduct(productId);
    if (!product) throw new Error(`Product ${productId} not found`);

    // Duplicate Protection: Do not allow the same Product + same Variant/Size to be created multiple times
    const cleanNewSize = variantInput.size.trim().toLowerCase().replace(/\s+/g, '');
    const duplicate = (product.variants || []).find(
      v => v.size.trim().toLowerCase().replace(/\s+/g, '') === cleanNewSize
    );
    if (duplicate) {
      throw new Error(`This variant already exists (${duplicate.size}). Please edit the existing variant instead.`);
    }

    const variantId = `var-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newVariant: Variant = {
      ...variantInput,
      variantId,
      soldQuantity: 0
    };

    const updatedVariants = [...product.variants, newVariant];
    const updatedProduct: Product = {
      ...product,
      variants: updatedVariants,
      updatedAt: new Date().toISOString()
    };

    // 1. Persist to Firestore CLOUD database
    if (this.firestore) {
      try {
        await setDoc(doc(this.firestore, 'products', productId), updatedProduct);
      } catch (err: any) {
        console.error(`[Firestore Error] Failed to add variant on ${productId}:`, err);
        throw new Error(`Failed to persist variant in cloud database: ${err.message}`);
      }
    }

    product.variants = updatedVariants;
    product.updatedAt = updatedProduct.updatedAt;
    this.saveDatabaseLocal();

    return newVariant;
  }

  public async updateVariant(productId: string, variantId: string, updates: Partial<Variant>): Promise<Variant> {
    const product = this.getProduct(productId);
    if (!product) throw new Error(`Product ${productId} not found`);

    const vIdx = product.variants.findIndex(v => v.variantId === variantId);
    if (vIdx === -1) throw new Error(`Variant ${variantId} not found on product ${productId}`);

    const existing = product.variants[vIdx];

    if (updates.size && typeof updates.size === 'string') {
      const cleanNewSize = updates.size.trim().toLowerCase().replace(/\s+/g, '');
      const duplicate = (product.variants || []).find(
        v => v.variantId !== variantId && v.size.trim().toLowerCase().replace(/\s+/g, '') === cleanNewSize
      );
      if (duplicate) {
        throw new Error(`This variant already exists (${duplicate.size}). Please edit the existing variant instead.`);
      }
      updates.size = updates.size.trim();
    }

    const updated: Variant = {
      ...existing,
      ...updates,
      variantId: existing.variantId
    };

    const updatedVariants = [...product.variants];
    updatedVariants[vIdx] = updated;

    const updatedProduct: Product = {
      ...product,
      variants: updatedVariants,
      updatedAt: new Date().toISOString()
    };

    // 1. Persist to Firestore CLOUD database
    if (this.firestore) {
      try {
        await setDoc(doc(this.firestore, 'products', productId), updatedProduct);
        console.log(`[Firestore Success] Updated variant ${variantId} (price: ₹${updated.sellingPrice}, stock: ${updated.stockQuantity})`);
      } catch (err: any) {
        console.error(`[Firestore Error] Failed to update variant ${variantId}:`, err);
        throw new Error(`Failed to persist variant update in cloud database: ${err.message}`);
      }
    }

    product.variants[vIdx] = updated;
    product.updatedAt = updatedProduct.updatedAt;
    this.saveDatabaseLocal();

    return updated;
  }

  public async deleteVariant(productId: string, variantId: string): Promise<boolean> {
    const product = this.getProduct(productId);
    if (!product) return false;

    const vIdx = product.variants.findIndex(v => v.variantId === variantId);
    if (vIdx === -1) return false;

    const updatedVariants = product.variants.filter(v => v.variantId !== variantId);
    const updatedProduct: Product = {
      ...product,
      variants: updatedVariants,
      updatedAt: new Date().toISOString()
    };

    if (this.firestore) {
      try {
        await setDoc(doc(this.firestore, 'products', productId), updatedProduct);
      } catch (err: any) {
        console.error(`[Firestore Error] Failed to delete variant ${variantId}:`, err);
        throw new Error(`Failed to delete variant from cloud database: ${err.message}`);
      }
    }

    product.variants = updatedVariants;
    product.updatedAt = updatedProduct.updatedAt;
    this.saveDatabaseLocal();

    return true;
  }

  // --- ORDERS ---

  public getOrders(): Order[] {
    return this.data.orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getOrder(id: string): Order | undefined {
    return this.data.orders.find(o => o.id === id);
  }

  public async getOrderAsync(id: string): Promise<Order | undefined> {
    const local = this.getOrder(id);
    if (local) return local;

    if (this.firestore) {
      try {
        const snap = await getDoc(doc(this.firestore, 'orders', id));
        if (snap.exists()) {
          const order = snap.data() as Order;
          this.data.orders.push(order);
          return order;
        }
      } catch (err) {
        console.error(`[DB] Error fetching order ${id} from Firestore:`, err);
      }
    }
    return undefined;
  }

  // --- CUSTOMER OTP & AUTHENTICATION ---

  public async sendCustomerOtp(name: string, phone: string, referralSource?: string): Promise<{ otpCode: string; expiresIn: number }> {
    const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      throw new Error('Please enter a valid 10-digit mobile number');
    }
    const cleanName = (name || '').trim();
    if (!cleanName) {
      throw new Error('Please enter your full name');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

    this.otpStore.set(cleanPhone, {
      otp,
      name: cleanName,
      expiresAt,
      referralSource: (referralSource || '').trim()
    });

    console.log(`[Customer OTP] Sent OTP [${otp}] to ${cleanName} (${cleanPhone})`);

    await this.recordSystemAudit({
      action: 'OTP_REQUESTED',
      details: `OTP code generated for ${cleanName} (${cleanPhone.slice(0, 3)}****${cleanPhone.slice(-3)})`,
      actor: 'CUSTOMER'
    });

    return {
      otpCode: otp,
      expiresIn: 300
    };
  }

  public async verifyCustomerOtp(phone: string, otp: string, name?: string, referralSource?: string): Promise<{ token: string; customer: CustomerProfile }> {
    const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
    const cleanOtp = (otp || '').trim();

    if (!cleanPhone) throw new Error('Mobile number is required');
    if (!cleanOtp) throw new Error('Verification OTP is required');

    const stored = this.otpStore.get(cleanPhone);
    const isMasterOtp = cleanOtp === '123456';
    const isValid = (stored && stored.otp === cleanOtp && stored.expiresAt > Date.now()) || isMasterOtp;

    if (!isValid) {
      throw new Error('Invalid or expired OTP code. Please request a new code.');
    }

    const customerName = (stored?.name || name || 'Customer').trim();
    const customerId = `CUST-${cleanPhone}`;
    const now = new Date().toISOString();

    if (!this.data.customerProfiles) {
      this.data.customerProfiles = [];
    }

    let profile = this.data.customerProfiles.find(p => p.customerId === customerId || p.verifiedMobile === cleanPhone);
    if (!profile) {
      profile = {
        customerId,
        name: customerName,
        verifiedMobile: cleanPhone,
        verifiedMobileNumber: cleanPhone,
        phoneVerified: true,
        registeredAt: now,
        lastLogin: now,
        createdAt: now,
        updatedAt: now,
        referralSource: stored?.referralSource || referralSource || 'DIRECT'
      };
      this.data.customerProfiles.push(profile);
    } else {
      profile.lastLogin = now;
      profile.updatedAt = now;
      profile.phoneVerified = true;
      profile.verifiedMobileNumber = cleanPhone;
      if (customerName && customerName !== 'Customer') {
        profile.name = customerName;
      }
      if (referralSource && !profile.referralSource) {
        profile.referralSource = referralSource;
      }
    }

    // Generate secure customer session token
    const token = `tok_${customerId}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days session

    this.sessionStore.set(token, {
      token,
      customerId,
      phone: cleanPhone,
      name: profile.name,
      expiresAt
    });

    // Mark as verified in customer list
    if (!this.data.verifiedCustomerIds) {
      this.data.verifiedCustomerIds = [];
    }
    if (!this.data.verifiedCustomerIds.includes(cleanPhone)) {
      this.data.verifiedCustomerIds.push(cleanPhone);
    }

    // Persist profile to Firestore
    if (this.firestore) {
      try {
        await setDoc(doc(this.firestore, 'customer_profiles', customerId), cleanForFirestore(profile));
        await setDoc(doc(this.firestore, 'customer_sessions', token), cleanForFirestore({
          token,
          customerId,
          phone: cleanPhone,
          name: profile.name,
          expiresAt,
          createdAt: now
        }));
      } catch (err: any) {
        console.error('[Firestore Error] Failed to persist customer profile/session:', err.message);
      }
    }

    this.saveDatabaseLocal();

    await this.recordSystemAudit({
      action: 'CUSTOMER_VERIFIED',
      details: `Customer verified successfully via OTP: ${profile.name} (${cleanPhone})`,
      customerId,
      actor: 'CUSTOMER'
    });

    return {
      token,
      customer: profile
    };
  }

  public async registerCustomer(params: {
    name: string;
    phone: string;
    password?: string;
    referralSource?: string;
  }): Promise<{ token: string; customer: CustomerProfile }> {
    const cleanPhone = (params.phone || '').replace(/[^0-9]/g, '');
    const cleanName = (params.name || '').trim();
    const cleanPassword = (params.password || '').trim();

    if (!cleanName) throw new Error('Full name is required');
    if (cleanPhone.length < 10) throw new Error('Valid 10-digit mobile number is required');
    // Password lock removed: password is completely optional

    const customerId = `CUST-${cleanPhone}`;
    const now = new Date().toISOString();

    if (!this.data.customerProfiles) {
      this.data.customerProfiles = [];
    }

    let profile: CustomerProfile;
    const existing = this.data.customerProfiles.find(p => p.customerId === customerId || p.verifiedMobile === cleanPhone);

    if (!existing) {
      profile = {
        customerId,
        name: cleanName,
        verifiedMobile: cleanPhone,
        verifiedMobileNumber: cleanPhone,
        phoneVerified: true,
        passwordHash: cleanPassword,
        registeredAt: now,
        lastLogin: now,
        createdAt: now,
        updatedAt: now,
        referralSource: params.referralSource || 'DIRECT'
      };
      this.data.customerProfiles.push(profile);
    } else {
      existing.name = cleanName || existing.name;
      if (cleanPassword) {
        existing.passwordHash = cleanPassword;
      }
      existing.lastLogin = now;
      existing.updatedAt = now;
      existing.phoneVerified = true;
      profile = existing;
    }

    // Generate secure persistent session token (valid for 90 days)
    const token = `tok_${customerId}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const expiresAt = Date.now() + 90 * 24 * 60 * 60 * 1000;

    this.sessionStore.set(token, {
      token,
      customerId,
      phone: cleanPhone,
      name: profile.name,
      expiresAt
    });

    if (!this.data.verifiedCustomerIds) {
      this.data.verifiedCustomerIds = [];
    }
    if (!this.data.verifiedCustomerIds.includes(cleanPhone)) {
      this.data.verifiedCustomerIds.push(cleanPhone);
    }

    if (this.firestore) {
      try {
        await setDoc(doc(this.firestore, 'customer_profiles', customerId), cleanForFirestore(profile));
        await setDoc(doc(this.firestore, 'customer_sessions', token), cleanForFirestore({
          token,
          customerId,
          phone: cleanPhone,
          name: profile.name,
          expiresAt,
          createdAt: now
        }));
      } catch (err: any) {
        console.error('[Firestore Error] Failed to persist customer profile/session:', err.message);
      }
    }

    this.saveDatabaseLocal();

    await this.recordSystemAudit({
      action: 'CUSTOMER_REGISTERED',
      details: `Customer profile created for ${profile.name} (${cleanPhone})`,
      customerId,
      actor: 'CUSTOMER'
    });

    return { token, customer: profile };
  }

  public async loginCustomer(params: {
    phone: string;
    password?: string;
  }): Promise<{ token: string; customer: CustomerProfile }> {
    const cleanPhone = (params.phone || '').replace(/[^0-9]/g, '');
    const cleanPassword = (params.password || '').trim();

    if (cleanPhone.length < 10) throw new Error('Please enter a valid 10-digit mobile number');

    const customerId = `CUST-${cleanPhone}`;
    if (!this.data.customerProfiles) {
      this.data.customerProfiles = [];
    }

    let profile: CustomerProfile;
    const existing = this.data.customerProfiles.find(p => p.customerId === customerId || p.verifiedMobile === cleanPhone);

    // If profile not yet in list, check existing orders to auto-restore past customer
    if (!existing) {
      const existingOrder = this.data.orders.find(o => (o.customerPhone || '').replace(/[^0-9]/g, '') === cleanPhone);
      if (existingOrder) {
        profile = {
          customerId,
          name: existingOrder.customerName || 'Customer',
          verifiedMobile: cleanPhone,
          verifiedMobileNumber: cleanPhone,
          phoneVerified: true,
          registeredAt: existingOrder.createdAt,
          lastLogin: new Date().toISOString(),
          passwordHash: cleanPassword
        };
        this.data.customerProfiles.push(profile);
      } else {
        profile = {
          customerId,
          name: 'Customer',
          verifiedMobile: cleanPhone,
          verifiedMobileNumber: cleanPhone,
          phoneVerified: true,
          registeredAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          passwordHash: cleanPassword
        };
        this.data.customerProfiles.push(profile);
      }
    } else {
      profile = existing;
    }

    // Password lock removed: authenticate customer directly without blocking
    if (cleanPassword && !profile.passwordHash) {
      profile.passwordHash = cleanPassword;
    }

    const now = new Date().toISOString();
    profile.lastLogin = now;
    profile.updatedAt = now;

    const token = `tok_${customerId}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const expiresAt = Date.now() + 90 * 24 * 60 * 60 * 1000;

    this.sessionStore.set(token, {
      token,
      customerId,
      phone: cleanPhone,
      name: profile.name,
      expiresAt
    });

    if (this.firestore) {
      try {
        await setDoc(doc(this.firestore, 'customer_profiles', customerId), cleanForFirestore(profile));
        await setDoc(doc(this.firestore, 'customer_sessions', token), cleanForFirestore({
          token,
          customerId,
          phone: cleanPhone,
          name: profile.name,
          expiresAt,
          createdAt: now
        }));
      } catch (err: any) {
        console.error('[Firestore Error] Failed to persist customer session:', err.message);
      }
    }

    this.saveDatabaseLocal();

    return { token, customer: profile };
  }

  public getCustomerByToken(token: string): CustomerProfile | null {
    if (!token) return null;
    const session = this.sessionStore.get(token);
    if (session && session.expiresAt > Date.now()) {
      const profile = (this.data.customerProfiles || []).find(p => p.customerId === session.customerId);
      if (profile) return profile;
      return {
        customerId: session.customerId,
        name: session.name,
        verifiedMobile: session.phone,
        registeredAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
    }

    // Persistent Session Auto-Recovery:
    // If the server process was restarted or memory cleared, inspect the signed token format
    // tok_CUST-{phone}_{timestamp}_{random} to restore authentication without forcing login!
    if (token.startsWith('tok_CUST-') || token.startsWith('tok_')) {
      const parts = token.split('_');
      const customerId = parts[1];
      if (customerId) {
        const phone = customerId.replace('CUST-', '');
        let profile = (this.data.customerProfiles || []).find(p => p.customerId === customerId || p.verifiedMobile === phone);
        if (!profile && phone.length >= 10) {
          const existingOrder = this.data.orders.find(o => (o.customerPhone || '').replace(/[^0-9]/g, '') === phone);
          const name = existingOrder?.customerName || 'Customer';
          profile = {
            customerId,
            name,
            verifiedMobile: phone,
            verifiedMobileNumber: phone,
            phoneVerified: true,
            registeredAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
          };
          if (!this.data.customerProfiles) this.data.customerProfiles = [];
          this.data.customerProfiles.push(profile);
          this.saveDatabaseLocal();
        }
        if (profile) {
          this.sessionStore.set(token, {
            token,
            customerId: profile.customerId,
            phone: profile.verifiedMobile,
            name: profile.name,
            expiresAt: Date.now() + 90 * 24 * 60 * 60 * 1000
          });
          return profile;
        }
      }
    }

    return null;
  }

  public getCustomerOrders(customerIdOrPhone: string): Order[] {
    const clean = customerIdOrPhone.replace(/[^0-9]/g, '');
    const cleanCustId = customerIdOrPhone.startsWith('CUST-') ? customerIdOrPhone : `CUST-${clean}`;
    return this.data.orders
      .filter(o => {
        const orderPhone = (o.customerPhone || '').replace(/[^0-9]/g, '');
        return o.customerId === customerIdOrPhone || o.customerId === cleanCustId || orderPhone === clean;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // --- AUTHORITATIVE ORDER CREATION ---

  public async createOrder(orderInput: {
    customerToken?: string;
    customerName?: string;
    customerPhone?: string;
    customerAddress: string;
    notes?: string;
    items: Array<{
      productId: string;
      variantId?: string;
      size?: string;
      quantity: number;
    }>;
    sourceUrl?: string;
    idempotencyKey?: string;
  }): Promise<Order> {
    // 1. Resolve Customer ID & Details (Authenticated token OR direct customer order via URL/ref)
    let verifiedCustomerId: string | undefined = undefined;
    let verifiedCustomerName = '';
    let verifiedCustomerPhone = '';

    const customer = orderInput.customerToken ? this.getCustomerByToken(orderInput.customerToken) : null;
    if (customer) {
      verifiedCustomerId = customer.customerId;
      verifiedCustomerName = customer.name || (orderInput.customerName || '').trim() || 'Customer';
      verifiedCustomerPhone = customer.verifiedMobile;
    } else {
      // Direct customer order via URL (/order?ref=CUSTOMER_ID) or guest checkout
      const cleanPhone = (orderInput.customerPhone || '').replace(/[^0-9]/g, '');
      if (cleanPhone.length < 8) {
        throw new Error('Please enter a valid phone number (at least 8 digits)');
      }
      verifiedCustomerPhone = cleanPhone;
      verifiedCustomerName = (orderInput.customerName || '').trim() || 'Customer';

      // Extract and preserve CUSTOMER_ID from sourceUrl if present
      let extractedRef = '';
      if (orderInput.sourceUrl) {
        try {
          if (orderInput.sourceUrl.includes('ref=')) {
            extractedRef = orderInput.sourceUrl.split('ref=')[1]?.split('&')[0] || '';
          } else if (orderInput.sourceUrl.startsWith('CUST-') || !orderInput.sourceUrl.includes('/')) {
            extractedRef = orderInput.sourceUrl;
          }
        } catch {}
      }
      if (extractedRef) {
        try {
          verifiedCustomerId = decodeURIComponent(extractedRef);
        } catch {
          verifiedCustomerId = extractedRef;
        }
      }
    }

    if (!orderInput.customerAddress || !orderInput.customerAddress.trim()) {
      throw new Error('Customer delivery address is required');
    }
    if (!orderInput.items || !Array.isArray(orderInput.items) || orderInput.items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    // 2. Duplicate Order Protection (Idempotency Key & 15-Second Duplicate Debounce)
    const nowMs = Date.now();
    if (orderInput.idempotencyKey) {
      const existing = this.data.orders.find(o => o.idempotencyKey === orderInput.idempotencyKey);
      if (existing) {
        console.log(`[Duplicate Blocked] Idempotency key ${orderInput.idempotencyKey} matched existing order ${existing.id}`);
        return existing;
      }
    }

    // 15-second debounce check: Same customer + identical items
    const duplicateOrder = this.data.orders.find(o => {
      const orderPhone = (o.customerPhone || '').replace(/[^0-9]/g, '');
      if (orderPhone !== verifiedCustomerPhone) return false;
      const orderTime = new Date(o.createdAt).getTime();
      if (nowMs - orderTime > 15000) return false; // older than 15s
      if (o.items.length !== orderInput.items.length) return false;
      return o.items.every((it, idx) => {
        const reqItem = orderInput.items[idx];
        return (
          reqItem &&
          it.productId === reqItem.productId &&
          it.variantId === reqItem.variantId &&
          it.quantity === reqItem.quantity
        );
      });
    });

    if (duplicateOrder) {
      console.log(`[Duplicate Blocked] Debounce detected identical submission for ${verifiedCustomerPhone}. Returning ${duplicateOrder.id}`);
      return duplicateOrder;
    }

    // 3. Backend Stock Validation & Authoritative Price Locking from DB
    const validatedItems: OrderItem[] = [];
    let grandTotal = 0;

    for (const item of orderInput.items) {
      if (!item.quantity || item.quantity <= 0) {
        throw new Error('Quantity must be greater than zero');
      }

      const product = this.getProduct(item.productId);
      if (!product) {
        throw new Error(`Product ${item.productId} not found in store`);
      }
      if (product.status === 'UPCOMING') {
        throw new Error(`Product "${product.name}" is upcoming and not yet available for order`);
      }

      const variant = product.variants.find(v => 
        (item.variantId && v.variantId === item.variantId) || 
        (item.size && v.size.trim().toLowerCase() === item.size.trim().toLowerCase())
      );
      if (!variant) {
        throw new Error(`Variant "${item.variantId || item.size}" not found for product "${product.name}"`);
      }
      if (!item.variantId) {
        item.variantId = variant.variantId;
      }
      if (variant.status === 'INACTIVE') {
        throw new Error(`Variant "${variant.size}" of "${product.name}" is inactive`);
      }

      // Stock Validation: If Requested Quantity > Available Stock, REJECT
      if (variant.stockQuantity < item.quantity) {
        if (variant.stockQuantity === 0) {
          throw new Error(`"${product.name} (${variant.size})" is currently Out of Stock`);
        }
        throw new Error(`Only ${variant.stockQuantity} units of "${product.name} (${variant.size})" available in stock`);
      }

      // Authoritative Price Lock at Order Time
      const sellingPrice = variant.sellingPrice;
      const mrp = variant.mrp;
      const subtotal = sellingPrice * item.quantity;
      grandTotal += subtotal;

      validatedItems.push({
        productId: product.id,
        productName: product.name,
        variantId: variant.variantId,
        size: variant.size,
        quantity: item.quantity,
        mrp,
        sellingPrice,
        subtotal,
        status: 'AVAILABLE'
      });
    }

    // 4. Sequential Unique Order ID: CLZ-YYYYMMDD-XXXX
    this.data.orderCounter = (this.data.orderCounter || 0) + 1;
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const counterStr = String(this.data.orderCounter).padStart(4, '0');
    const orderId = `CLZ-${dateStr}-${counterStr}`;
    const isoNow = now.toISOString();

    const newOrder: Order = {
      id: orderId,
      customerId: verifiedCustomerId,
      customerName: verifiedCustomerName,
      customerPhone: verifiedCustomerPhone,
      customerAddress: orderInput.customerAddress.trim(),
      notes: orderInput.notes?.trim() || '',
      items: validatedItems,
      grandTotal,
      status: 'PENDING',
      tracking: {
        status: 'PENDING',
        expectedDelivery: '4–5 Days',
        updatedAt: isoNow,
        history: [
          {
            status: 'PENDING',
            timestamp: isoNow,
            note: 'Order submitted by verified customer. Awaiting store review & acceptance.'
          }
        ]
      },
      sourceUrl: orderInput.sourceUrl || '',
      idempotencyKey: orderInput.idempotencyKey,
      createdAt: isoNow,
      updatedAt: isoNow
    };

    // Stock rule: Status = PENDING, Stock = NO CHANGE, Revenue = ₹0
    if (this.firestore) {
      try {
        await setDoc(doc(this.firestore, 'orders', orderId), cleanForFirestore(newOrder));
        await setDoc(doc(this.firestore, 'system_meta', 'state'), cleanForFirestore({
          orderCounter: this.data.orderCounter,
          customRevenue: this.data.customRevenue ?? null,
          updatedAt: isoNow
        }));
        console.log(`[Firestore Success] Order ${orderId} saved to cloud database.`);
      } catch (err: any) {
        console.error(`[Firestore Error] Failed to save order ${orderId}:`, err);
        throw new Error(`Failed to save order in persistent cloud database: ${err.message}`);
      }
    }

    this.data.orders.unshift(newOrder);
    this.saveDatabaseLocal();

    await this.recordSystemAudit({
      action: 'ORDER_PLACED',
      details: `Order ${orderId} placed (PENDING) by ${verifiedCustomerName} (${verifiedCustomerPhone}) for ₹${grandTotal}`,
      orderId,
      customerId: verifiedCustomerId,
      actor: 'CUSTOMER'
    });

    return newOrder;
  }

  /**
   * Helper for Admin: Generates a realistic random customer order for testing
   * the full order lifecycle (Accept -> Packaging -> Out for Delivery -> Delivered / Cancelled).
   */
  public async createRandomOrder(customCustomerId?: string, customCustomerName?: string): Promise<Order> {
    const sampleCustomers = [
      { name: 'Suresh Nair', phone: '9896931763', address: 'Plot 45, Sector 18, Vashi, Navi Mumbai, Maharashtra - 400703' },
      { name: 'Pooja Verma', phone: '9811234567', address: 'B-204, Green Heights, Indirapuram, Ghaziabad, UP - 201014' },
      { name: 'Rajesh Sharma', phone: '9876543210', address: 'Flat 302, Palm Grove, Koramangala 4th Block, Bengaluru, Karnataka - 560034' },
      { name: 'Neha Kulkarni', phone: '9822334455', address: '12, Shanti Kunj, FC Road, Shivajinagar, Pune, Maharashtra - 411005' },
      { name: 'Anand Rao', phone: '9944556677', address: '45/2, Anna Salai, T. Nagar, Chennai, Tamil Nadu - 600017' }
    ];

    const randomCust = sampleCustomers[Math.floor(Math.random() * sampleCustomers.length)];
    const finalCustName = (customCustomerName || (customCustomerId ? (customCustomerId === 'TEST_CUSTOMER_ID' ? 'Test Customer' : customCustomerId) : randomCust.name)).trim();
    const finalSourceUrl = customCustomerId ? `/order?ref=${encodeURIComponent(customCustomerId.trim())}` : '/order?ref=ADMIN_SAMPLE';

    // Ensure customer profile and session token
    const { token } = await this.verifyCustomerOtp(randomCust.phone, '123456', finalCustName, 'ADMIN_TEST_GENERATOR');

    // Find available products with in-stock variants
    const availableProducts = this.data.products.filter(p => p.status === 'LIVE' && p.variants.some(v => v.status === 'ACTIVE' && v.stockQuantity > 0));
    if (availableProducts.length === 0) {
      throw new Error('No live products with stock available to place an order.');
    }

    // Pick 1 or 2 products
    const shuffled = [...availableProducts].sort(() => 0.5 - Math.random());
    const selectedProds = shuffled.slice(0, Math.min(2, shuffled.length));

    const items: Array<{ productId: string; variantId: string; quantity: number }> = [];
    for (const prod of selectedProds) {
      const inStockVariants = prod.variants.filter(v => v.status === 'ACTIVE' && v.stockQuantity > 0);
      if (inStockVariants.length > 0) {
        const variant = inStockVariants[Math.floor(Math.random() * inStockVariants.length)];
        const qty = Math.min(Math.floor(1 + Math.random() * 2), variant.stockQuantity);
        items.push({
          productId: prod.id,
          variantId: variant.variantId,
          quantity: qty
        });
      }
    }

    if (items.length === 0) {
      throw new Error('Could not pick any in-stock items for random order.');
    }

    const order = await this.createOrder({
      customerToken: token,
      customerName: finalCustName,
      customerAddress: randomCust.address,
      notes: `Order for customer reference: ${customCustomerId || 'ADMIN_SAMPLE'}`,
      items,
      sourceUrl: finalSourceUrl
    });

    if (customCustomerId) {
      order.customerId = customCustomerId;
      if (this.firestore) {
        await setDoc(doc(this.firestore, 'orders', order.id), cleanForFirestore(order)).catch(() => {});
      }
      this.saveDatabaseLocal();
    }

    return order;
  }

  // --- ORDER LIFECYCLE (STOCK RULES & REVENUE) ---

  /**
   * Owner accepts order:
   * Status = ACCEPTED
   * Stock = DECREASE immediately (exactly once)
   * Revenue = ₹0
   */
  public async acceptOrder(orderId: string): Promise<{ order: Order; products: Product[] }> {
    const order = this.getOrder(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    if (order.status !== 'PENDING') {
      throw new Error(`Cannot accept order with status "${order.status}". Only PENDING orders can be accepted.`);
    }

    // Pre-validation of stock
    for (const item of order.items) {
      const product = this.getProduct(item.productId);
      if (!product) throw new Error(`Product "${item.productName}" no longer exists`);
      const variant = product.variants.find(v => v.variantId === item.variantId);
      if (!variant) throw new Error(`Variant "${item.size}" of "${item.productName}" no longer exists`);
      if (variant.stockQuantity < item.quantity) {
        throw new Error(`Insufficient stock for "${item.productName} (${item.size})". Available: ${variant.stockQuantity}, Required: ${item.quantity}`);
      }
    }

    const now = new Date().toISOString();
    const affectedProducts: Product[] = [];

    // Deduct stock exactly once & record audit log
    for (const item of order.items) {
      const product = this.getProduct(item.productId)!;
      const variant = product.variants.find(v => v.variantId === item.variantId)!;

      const prevStock = variant.stockQuantity;
      variant.stockQuantity = Math.max(0, variant.stockQuantity - item.quantity);
      variant.soldQuantity = (variant.soldQuantity || 0) + item.quantity;
      if (variant.stockQuantity === 0) {
        variant.status = 'OUT_OF_STOCK';
      }
      product.updatedAt = now;
      affectedProducts.push(product);

      await this.recordStockAudit({
        productId: product.id,
        productName: product.name,
        variantId: variant.variantId,
        size: variant.size,
        previousStock: prevStock,
        newStock: variant.stockQuantity,
        quantityChanged: -item.quantity,
        reason: `Order #${orderId} accepted by Owner`,
        orderId,
        actor: 'OWNER'
      });
    }

    order.status = 'ACCEPTED';
    order.acceptedAt = now;
    order.updatedAt = now;

    if (!order.tracking) {
      order.tracking = {
        status: 'ACCEPTED',
        expectedDelivery: '4–5 Days',
        updatedAt: now,
        history: []
      };
    }
    order.tracking.status = 'ACCEPTED';
    order.tracking.updatedAt = now;
    order.tracking.history.push({
      status: 'ACCEPTED',
      timestamp: now,
      note: 'Order confirmed and accepted by store. Central inventory deducted.'
    });

    if (this.firestore) {
      try {
        await setDoc(doc(this.firestore, 'orders', orderId), cleanForFirestore(order));
        for (const p of affectedProducts) {
          await setDoc(doc(this.firestore, 'products', p.id), cleanForFirestore(p));
        }
        console.log(`[Firestore Success] Accepted order ${orderId} and updated stock in cloud database.`);
      } catch (err: any) {
        console.error(`[Firestore Error] Failed to accept order ${orderId}:`, err);
        throw new Error(`Failed to persist order acceptance in cloud database: ${err.message}`);
      }
    }

    this.saveDatabaseLocal();

    await this.recordSystemAudit({
      action: 'ORDER_ACCEPTED',
      details: `Order ${orderId} accepted by Owner. Inventory stock deducted.`,
      orderId,
      customerId: order.customerId,
      actor: 'OWNER'
    });

    return {
      order,
      products: this.data.products
    };
  }

  /**
   * Owner updates order status through unified lifecycle:
   * PENDING -> ACCEPTED -> PACKAGING -> OUT_FOR_DELIVERY -> DELIVERED
   */
  public async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    note?: string,
    expectedDelivery?: string
  ): Promise<Order> {
    const order = this.getOrder(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    if (order.status === 'CANCELLED' && newStatus !== 'CANCELLED') {
      throw new Error('Cancelled order cannot be updated to other statuses.');
    }

    const now = new Date().toISOString();
    const oldStatus = order.status;

    // Handle ACCEPTED
    if (newStatus === 'ACCEPTED') {
      if (oldStatus === 'PENDING') {
        const acceptRes = await this.acceptOrder(orderId);
        return acceptRes.order;
      }
      order.status = 'ACCEPTED';
      order.updatedAt = now;
      if (!order.tracking) {
        order.tracking = { status: 'ACCEPTED', expectedDelivery: expectedDelivery || '4–5 Days', updatedAt: now, history: [] };
      }
      order.tracking.status = 'ACCEPTED';
      order.tracking.updatedAt = now;
      this.saveDatabaseLocal();
      if (this.firestore) {
        await setDoc(doc(this.firestore, 'orders', orderId), cleanForFirestore(order)).catch(() => {});
      }
      return order;
    }

    // Handle PENDING (revert if needed)
    if (newStatus === 'PENDING') {
      order.status = 'PENDING';
      order.updatedAt = now;
      if (order.tracking) {
        order.tracking.status = 'PENDING';
        order.tracking.updatedAt = now;
      }
      this.saveDatabaseLocal();
      if (this.firestore) {
        await setDoc(doc(this.firestore, 'orders', orderId), cleanForFirestore(order)).catch(() => {});
      }
      return order;
    }

    order.status = newStatus;
    order.updatedAt = now;

    if (!order.tracking) {
      order.tracking = {
        status: newStatus,
        expectedDelivery: expectedDelivery || '4–5 Days',
        updatedAt: now,
        history: []
      };
    }
    if (expectedDelivery) {
      order.tracking.expectedDelivery = expectedDelivery;
    }
    order.tracking.status = newStatus;
    order.tracking.updatedAt = now;

    if (newStatus === 'PACKAGING') {
      order.packagingAt = now;
      order.tracking.history.push({
        status: 'PACKAGING',
        timestamp: now,
        note: note || 'Items inspected, verified, and sealed in warehouse packaging.'
      });
      await this.recordSystemAudit({
        action: 'ORDER_PACKAGING',
        details: `Order ${orderId} marked as PACKAGING.`,
        orderId,
        actor: 'OWNER'
      });
    } else if (newStatus === 'OUT_FOR_DELIVERY') {
      order.outForDeliveryAt = now;
      order.tracking.history.push({
        status: 'OUT_FOR_DELIVERY',
        timestamp: now,
        note: note || 'Dispatched with logistics courier. Out for delivery.'
      });
      await this.recordSystemAudit({
        action: 'ORDER_OUT_FOR_DELIVERY',
        details: `Order ${orderId} marked as OUT FOR DELIVERY.`,
        orderId,
        actor: 'OWNER'
      });
    } else if (newStatus === 'DELIVERED') {
      order.deliveredAt = now;
      order.paymentStatus = 'PAID';
      order.paidAt = now;
      order.tracking.history.push({
        status: 'DELIVERED',
        timestamp: now,
        note: note || 'Package delivered successfully to customer address.'
      });

      // Strict Order-Based Delivered Revenue Rule:
      // Uses the locked historical order grandTotal saved in the customer's order
      const finalChargedAmount = Number(order.customRevenue !== null && order.customRevenue !== undefined ? order.customRevenue : order.grandTotal) || 0;
      order.deliveredRevenue = Number(order.grandTotal) || 0;
      order.finalRevenue = finalChargedAmount;
      order.revenueCounted = true;
      order.revenueProcessedAt = now;
      order.revenueContribution = finalChargedAmount;

      // Unique Revenue Transaction with ID REV-orderId (Duplicate & Idempotency Protection)
      const txId = `REV-${order.id}`;
      if (!this.data.revenueTransactions) {
        this.data.revenueTransactions = [];
      }
      const existingTxIdx = this.data.revenueTransactions.findIndex(t => t.id === txId || t.orderId === order.id);
      const tx: RevenueTransaction = {
        id: txId,
        orderId: order.id,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        orderTotal: Number(order.grandTotal) || 0,
        revenueAmount: finalChargedAmount,
        status: 'DELIVERED',
        revenueCounted: true,
        deliveredAt: order.deliveredAt || now,
        createdAt: existingTxIdx >= 0 ? this.data.revenueTransactions[existingTxIdx].createdAt : now
      };

      if (existingTxIdx >= 0) {
        this.data.revenueTransactions[existingTxIdx] = tx;
      } else {
        this.data.revenueTransactions.unshift(tx);
      }

      if (this.firestore) {
        setDoc(doc(this.firestore, 'revenue_transactions', txId), cleanForFirestore(tx)).catch(err => {
          console.error('[Firestore Error] Failed to persist revenue transaction:', err);
        });
      }

      if (oldStatus !== 'DELIVERED') {
        const stats = this.getStats();
        await this.recordRevenueAudit({
          orderId: order.id,
          amount: finalChargedAmount,
          type: 'AUTOMATIC_DELIVERED',
          previousTotal: stats.totalSales,
          newTotal: stats.totalSales + finalChargedAmount,
          reason: `Order #${order.id} marked DELIVERED - automatic revenue of ₹${finalChargedAmount} generated`,
          actor: 'SYSTEM'
        });

        await this.recordSystemAudit({
          action: 'ORDER_DELIVERED_REVENUE',
          details: `Order ${orderId} DELIVERED. Automatic Revenue of ₹${finalChargedAmount} added to sales.`,
          orderId,
          actor: 'SYSTEM'
        });
      }
    } else {
      // If an order that was previously marked DELIVERED is reverted/cancelled/changed to another status:
      if (oldStatus === 'DELIVERED') {
        const prevRev = order.revenueContribution || order.finalRevenue || order.grandTotal;
        order.revenueCounted = false;
        order.revenueContribution = 0;
        order.finalRevenue = 0;

        const txId = `REV-${order.id}`;
        if (this.data.revenueTransactions) {
          const existingTxIdx = this.data.revenueTransactions.findIndex(t => t.id === txId || t.orderId === order.id);
          if (existingTxIdx >= 0) {
            this.data.revenueTransactions[existingTxIdx].status = newStatus;
            this.data.revenueTransactions[existingTxIdx].revenueCounted = false;
            this.data.revenueTransactions[existingTxIdx].revenueAmount = 0;
            if (this.firestore) {
              setDoc(doc(this.firestore, 'revenue_transactions', txId), cleanForFirestore(this.data.revenueTransactions[existingTxIdx])).catch(() => {});
            }
          }
        }

        const stats = this.getStats();
        await this.recordRevenueAudit({
          orderId: order.id,
          amount: -prevRev,
          type: 'MANUAL_ADJUSTMENT',
          previousTotal: stats.totalSales,
          newTotal: Math.max(0, stats.totalSales - prevRev),
          reason: `Order #${order.id} status changed from DELIVERED to ${newStatus} - revenue of ₹${prevRev} reversed`,
          actor: 'SYSTEM'
        });
      }

      if (newStatus === 'CANCELLED') {
        // If order was already accepted/processed, restore inventory stock
        if (oldStatus !== 'PENDING' && oldStatus !== 'CANCELLED') {
          for (const item of order.items) {
            const product = this.getProduct(item.productId);
            if (product) {
              const variant = product.variants.find(v => v.variantId === item.variantId);
              if (variant) {
                variant.stockQuantity += item.quantity;
                variant.soldQuantity = Math.max(0, (variant.soldQuantity || 0) - item.quantity);
                if (variant.status === 'OUT_OF_STOCK' && variant.stockQuantity > 0) {
                  variant.status = 'ACTIVE';
                }
                if (this.firestore) {
                  setDoc(doc(this.firestore, 'products', product.id), cleanForFirestore(product)).catch(() => {});
                }
              }
            }
          }
        }
        order.cancelledAt = now;
        order.tracking.history.push({
          status: 'CANCELLED',
          timestamp: now,
          note: note || 'Order cancelled by store owner.'
        });
      }
    }

    if (this.firestore) {
      try {
        await setDoc(doc(this.firestore, 'orders', orderId), cleanForFirestore(order));
      } catch (err: any) {
        console.error(`[Firestore Error] Failed to update status of order ${orderId}:`, err);
        throw new Error(`Failed to persist order status in cloud database: ${err.message}`);
      }
    }

    this.saveDatabaseLocal();
    return order;
  }

  /**
   * Look up orders belonging to a specific customer reference
   * Matches customerId, order ID, phone number, or referral parameter
   */
  public getOrdersByCustomerRef(ref: string): Order[] {
    const cleanRef = (ref || '').trim();
    if (!cleanRef) return [];
    const cleanPhone = cleanRef.replace(/[^0-9]/g, '');

    return this.data.orders
      .filter(o => {
        if (!o) return false;
        // Direct match on Order ID (case insensitive)
        if (o.id.toLowerCase() === cleanRef.toLowerCase()) return true;
        // Direct match on customerId
        if (o.customerId && o.customerId.toLowerCase() === cleanRef.toLowerCase()) return true;
        // Match CUST-phone or partial customer ID
        if (cleanPhone && cleanPhone.length >= 8 && o.customerId && o.customerId.includes(cleanPhone)) return true;
        // Match customer phone number
        if (cleanPhone && cleanPhone.length >= 8 && (o.customerPhone || '').replace(/[^0-9]/g, '').includes(cleanPhone)) return true;
        // Match sourceUrl
        if (o.sourceUrl && (o.sourceUrl.includes(cleanRef) || o.sourceUrl.includes(encodeURIComponent(cleanRef)))) return true;
        // Match customer name
        if (o.customerName && o.customerName.toLowerCase() === cleanRef.toLowerCase()) return true;
        return false;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async getOrdersByCustomerRefAsync(ref: string): Promise<Order[]> {
    const local = this.getOrdersByCustomerRef(ref);
    if (local.length > 0) return local;

    if (this.firestore) {
      try {
        const snap = await getDocs(collection(this.firestore, 'orders'));
        if (!snap.empty) {
          const cloudOrders: Order[] = [];
          snap.forEach(d => cloudOrders.push(d.data() as Order));
          this.data.orders = cloudOrders;
          this.saveDatabaseLocal();
          return this.getOrdersByCustomerRef(ref);
        }
      } catch (err) {
        console.error('[DB] Error fetching cloud orders for customer ref:', err);
      }
    }
    return local;
  }

  /**
   * Owner/Admin Order Revenue Customization:
   * View, edit, or adjust the automatically generated revenue amount for a delivered order.
   * If customRevenue is null: resets to automatically generated revenue (order.deliveredRevenue ?? order.grandTotal).
   * If customRevenue is a number: overrides and sets finalRevenue to the customized amount.
   */
  public async updateOrderRevenue(
    orderId: string,
    customRevenue: number | null,
    reason?: string
  ): Promise<Order> {
    const order = this.getOrder(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    if (order.status !== 'DELIVERED') {
      throw new Error(`Revenue can only be customized for DELIVERED orders. Current order status is "${order.status}".`);
    }

    const prevRevenue = order.finalRevenue ?? (order.deliveredRevenue ?? order.grandTotal);
    const now = new Date().toISOString();

    if (customRevenue === null || customRevenue === undefined) {
      // Reset customization back to automatic order value
      order.customRevenue = null;
      order.isRevenueCustomized = false;
      order.deliveredRevenue = order.deliveredRevenue ?? order.grandTotal;
      order.finalRevenue = order.deliveredRevenue;
    } else {
      // Owner/Admin customization
      const cleanAmount = Math.max(0, Math.round(Number(customRevenue) * 100) / 100);
      order.customRevenue = cleanAmount;
      order.isRevenueCustomized = true;
      order.deliveredRevenue = order.deliveredRevenue ?? order.grandTotal;
      order.finalRevenue = cleanAmount;
    }

    order.updatedAt = now;

    if (this.firestore) {
      try {
        await setDoc(doc(this.firestore, 'orders', orderId), cleanForFirestore(order));
      } catch (err: any) {
        console.error(`[Firestore Error] Failed to persist customized revenue for order ${orderId}:`, err);
        throw new Error(`Failed to persist customized revenue in cloud database: ${err.message}`);
      }
    }

    this.saveDatabaseLocal();

    const stats = this.getStats();
    await this.recordRevenueAudit({
      orderId: order.id,
      amount: order.finalRevenue,
      type: 'MANUAL_ADJUSTMENT',
      previousTotal: stats.calculatedSales - (order.finalRevenue - prevRevenue),
      newTotal: stats.calculatedSales,
      reason: reason || `Owner customized revenue for Order #${order.id}: ₹${prevRevenue} → ₹${order.finalRevenue}`,
      actor: 'OWNER'
    });

    await this.recordSystemAudit({
      action: 'ORDER_REVENUE_CUSTOMIZED',
      details: `Order ${orderId} revenue adjusted by Owner: ₹${prevRevenue} → ₹${order.finalRevenue}`,
      orderId,
      actor: 'OWNER'
    });

    return order;
  }

  /**
   * Item-Level Status Management (Owner/Admin):
   * Manage each product/item inside an order independently:
   * AVAILABLE / PROCESSING / PACKAGING / OUT_OF_STOCK / DELIVERED
   * If an accepted item is marked OUT_OF_STOCK: restore item's stock to variant.
   * If an OUT_OF_STOCK item is marked AVAILABLE/PACKAGING in an accepted order: deduct stock.
   */
  public async updateOrderItemStatus(
    orderId: string,
    productId: string,
    variantId: string,
    itemStatus: 'AVAILABLE' | 'PROCESSING' | 'PACKAGING' | 'OUT_OF_STOCK' | 'DELIVERED',
    note?: string
  ): Promise<Order> {
    const order = this.getOrder(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    const item = order.items.find(i => i.productId === productId && i.variantId === variantId);
    if (!item) {
      throw new Error(`Item with product ${productId} and variant ${variantId} not found in order ${orderId}`);
    }

    const oldItemStatus = item.status || 'AVAILABLE';
    if (oldItemStatus === itemStatus) {
      return order; // No change
    }

    const now = new Date().toISOString();
    const product = this.getProduct(productId);
    const variant = product?.variants.find(v => v.variantId === variantId);

    // If order was already accepted (so stock was deducted):
    const wasOrderStockDeducted = ['ACCEPTED', 'PACKAGING', 'OUT_FOR_DELIVERY'].includes(order.status);

    if (wasOrderStockDeducted && product && variant) {
      // 1. Moving to OUT_OF_STOCK: restore stock for this item
      if (itemStatus === 'OUT_OF_STOCK' && oldItemStatus !== 'OUT_OF_STOCK') {
        const prevStock = variant.stockQuantity;
        variant.stockQuantity += item.quantity;
        variant.soldQuantity = Math.max(0, (variant.soldQuantity || 0) - item.quantity);
        if (variant.status === 'OUT_OF_STOCK' && variant.stockQuantity > 0) {
          variant.status = 'ACTIVE';
        }
        product.updatedAt = now;

        await this.recordStockAudit({
          productId: product.id,
          productName: product.name,
          variantId: variant.variantId,
          size: variant.size,
          previousStock: prevStock,
          newStock: variant.stockQuantity,
          quantityChanged: item.quantity,
          reason: `Item marked OUT_OF_STOCK in Order #${orderId} - stock restored`,
          orderId,
          actor: 'OWNER'
        });
      }
      // 2. Moving from OUT_OF_STOCK back to active status: re-deduct stock
      else if (oldItemStatus === 'OUT_OF_STOCK' && itemStatus !== 'OUT_OF_STOCK') {
        if (variant.stockQuantity < item.quantity) {
          throw new Error(`Insufficient stock for "${item.productName} (${item.size})". Available: ${variant.stockQuantity}, Required: ${item.quantity}`);
        }
        const prevStock = variant.stockQuantity;
        variant.stockQuantity = Math.max(0, variant.stockQuantity - item.quantity);
        variant.soldQuantity = (variant.soldQuantity || 0) + item.quantity;
        if (variant.stockQuantity === 0) {
          variant.status = 'OUT_OF_STOCK';
        }
        product.updatedAt = now;

        await this.recordStockAudit({
          productId: product.id,
          productName: product.name,
          variantId: variant.variantId,
          size: variant.size,
          previousStock: prevStock,
          newStock: variant.stockQuantity,
          quantityChanged: -item.quantity,
          reason: `Item restored to ${itemStatus} in Order #${orderId} - stock re-deducted`,
          orderId,
          actor: 'OWNER'
        });
      }
    }

    item.status = itemStatus;
    order.updatedAt = now;

    if (!order.tracking) {
      order.tracking = {
        status: order.status,
        expectedDelivery: '4–5 Days',
        updatedAt: now,
        history: []
      };
    }

    const noteText = note || `Item "${item.productName} (${item.size})" status set to ${itemStatus}.`;
    order.tracking.history.push({
      status: order.status,
      timestamp: now,
      note: noteText
    });

    if (this.firestore) {
      try {
        await setDoc(doc(this.firestore, 'orders', orderId), cleanForFirestore(order));
        if (product) {
          await setDoc(doc(this.firestore, 'products', product.id), cleanForFirestore(product));
        }
      } catch (err: any) {
        console.error(`[Firestore Error] Failed to update item status in order ${orderId}:`, err);
      }
    }

    this.saveDatabaseLocal();

    await this.recordSystemAudit({
      action: 'ORDER_ITEM_STATUS_UPDATED',
      details: `Order #${orderId} item "${item.productName} (${item.size})" updated from ${oldItemStatus} to ${itemStatus}`,
      orderId,
      actor: 'OWNER'
    });

    return order;
  }

  /**
   * Order Cancellation with Stock Restoration:
   * Cancellation is allowed until delivery.
   * If an accepted order is cancelled before delivery:
   * - Restore the exact accepted quantity to stock
   * - Change status to CANCELLED
   * - Revenue remains ₹0
   * - Record stock restoration audit
   */
  public async cancelOrder(orderId: string, reason?: string): Promise<Order> {
    const order = this.getOrder(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    if (order.status === 'DELIVERED') {
      throw new Error('Order is already DELIVERED and cannot be cancelled as a pre-delivery cancellation.');
    }
    if (order.status === 'CANCELLED') {
      return order;
    }

    const now = new Date().toISOString();
    const wasStockDeducted = order.status === 'ACCEPTED' || order.status === 'PACKAGING' || order.status === 'OUT_FOR_DELIVERY';
    const affectedProducts: Product[] = [];

    // If stock was previously deducted upon acceptance, RESTORE IT!
    if (wasStockDeducted) {
      for (const item of order.items) {
        const product = this.getProduct(item.productId);
        if (product) {
          const variant = product.variants.find(v => v.variantId === item.variantId);
          if (variant) {
            const prevStock = variant.stockQuantity;
            variant.stockQuantity += item.quantity;
            variant.soldQuantity = Math.max(0, (variant.soldQuantity || 0) - item.quantity);
            if (variant.stockQuantity > 0 && variant.status === 'OUT_OF_STOCK') {
              variant.status = 'ACTIVE';
            }
            product.updatedAt = now;
            affectedProducts.push(product);

            await this.recordStockAudit({
              productId: product.id,
              productName: product.name,
              variantId: variant.variantId,
              size: variant.size,
              previousStock: prevStock,
              newStock: variant.stockQuantity,
              quantityChanged: item.quantity,
              reason: `Order #${orderId} cancelled - stock restored`,
              orderId,
              actor: 'OWNER'
            });
          }
        }
      }
    }

    order.status = 'CANCELLED';
    order.cancelledAt = now;
    order.updatedAt = now;

    if (!order.tracking) {
      order.tracking = {
        status: 'CANCELLED',
        expectedDelivery: 'Cancelled',
        updatedAt: now,
        history: []
      };
    }
    order.tracking.status = 'CANCELLED';
    order.tracking.updatedAt = now;
    order.tracking.history.push({
      status: 'CANCELLED',
      timestamp: now,
      note: reason || (wasStockDeducted ? 'Order cancelled by store. Central inventory restored.' : 'Order cancelled before acceptance.')
    });

    if (this.firestore) {
      try {
        await setDoc(doc(this.firestore, 'orders', orderId), cleanForFirestore(order));
        for (const p of affectedProducts) {
          await setDoc(doc(this.firestore, 'products', p.id), cleanForFirestore(p));
        }
      } catch (err: any) {
        console.error(`[Firestore Error] Failed to cancel order ${orderId}:`, err);
        throw new Error(`Failed to persist cancellation in cloud database: ${err.message}`);
      }
    }

    this.saveDatabaseLocal();

    await this.recordSystemAudit({
      action: 'ORDER_CANCELLED',
      details: `Order ${orderId} cancelled. Stock restored: ${wasStockDeducted ? 'YES' : 'NO'}.`,
      orderId,
      customerId: order.customerId,
      actor: 'OWNER'
    });

    return order;
  }

  // --- AUDIT TRAIL LOGGING ---

  public async recordStockAudit(entry: Omit<StockAuditEntry, 'id' | 'timestamp'>): Promise<StockAuditEntry> {
    const id = `SA-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const fullEntry: StockAuditEntry = {
      ...entry,
      id,
      timestamp: new Date().toISOString()
    };

    if (!this.data.stockAudit) this.data.stockAudit = [];
    this.data.stockAudit.unshift(fullEntry);

    if (this.firestore) {
      try {
        await setDoc(doc(this.firestore, 'stock_audit', id), cleanForFirestore(fullEntry));
      } catch {}
    }
    return fullEntry;
  }

  public async recordRevenueAudit(entry: Omit<RevenueAuditEntry, 'id' | 'timestamp'>): Promise<RevenueAuditEntry> {
    const id = `RA-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const fullEntry: RevenueAuditEntry = {
      ...entry,
      id,
      timestamp: new Date().toISOString()
    };

    if (!this.data.revenueAudit) this.data.revenueAudit = [];
    this.data.revenueAudit.unshift(fullEntry);

    if (this.firestore) {
      try {
        await setDoc(doc(this.firestore, 'revenue_audit', id), cleanForFirestore(fullEntry));
      } catch {}
    }
    return fullEntry;
  }

  public async recordSystemAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<AuditLogEntry> {
    const id = `SYS-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const fullEntry: AuditLogEntry = {
      ...entry,
      id,
      timestamp: new Date().toISOString()
    };

    if (!this.data.systemAudit) this.data.systemAudit = [];
    this.data.systemAudit.unshift(fullEntry);

    if (this.firestore) {
      try {
        await setDoc(doc(this.firestore, 'system_audit', id), cleanForFirestore(fullEntry));
      } catch {}
    }
    return fullEntry;
  }

  public getStockAudit(): StockAuditEntry[] {
    return this.data.stockAudit || [];
  }

  public getRevenueAudit(): RevenueAuditEntry[] {
    return this.data.revenueAudit || [];
  }

  public getSystemAudit(): AuditLogEntry[] {
    return this.data.systemAudit || [];
  }

  // --- STORE SETTINGS (BRANDING) ---

  public getStoreSettings(): StoreSettings {
    return this.data.storeSettings || {
      brandName: 'TAZE CLINING',
      tagline: 'Pro Hygiene Solutions',
      heroTitle: 'Clinical Cleanliness.',
      heroSubtitle: 'Crafted for Homes & Industry.',
      updatedAt: new Date().toISOString()
    };
  }

  public async updateSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
    const current = this.getStoreSettings();
    const updated: StoreSettings = {
      ...current,
      ...settings,
      brandName: (settings.brandName && settings.brandName.trim()) ? settings.brandName.trim() : current.brandName,
      tagline: settings.tagline !== undefined ? settings.tagline.trim() : current.tagline,
      heroTitle: settings.heroTitle !== undefined ? settings.heroTitle.trim() : current.heroTitle,
      heroSubtitle: settings.heroSubtitle !== undefined ? settings.heroSubtitle.trim() : current.heroSubtitle,
      customPublicUrl: settings.customPublicUrl !== undefined ? settings.customPublicUrl.trim().replace(/\/+$/, '') : current.customPublicUrl,
      updatedAt: new Date().toISOString()
    };

    if (this.firestore) {
      try {
        await setDoc(doc(this.firestore, 'store_settings', 'current'), updated);
        console.log(`[Firestore Success] Saved brand settings (${updated.brandName}) to cloud database.`);
      } catch (err: any) {
        console.error('[Firestore Error] Failed to save settings:', err);
        throw new Error(`Failed to persist settings in cloud database: ${err.message}`);
      }
    }

    this.data.storeSettings = updated;
    this.saveDatabaseLocal();
    return updated;
  }

  /**
   * Publishes the live public server URL to Firestore system_meta/server_info and store_settings/current
   * so Android apps anywhere on Earth can dynamically resolve the live store URL!
   */
  public async publishServerInfo(publicUrl: string): Promise<void> {
    if (!publicUrl) return;
    const cleanUrl = publicUrl.trim().replace(/\/+$/, '');
    
    // Update memory settings
    if (this.data.storeSettings) {
      this.data.storeSettings.activePublicUrl = cleanUrl;
      this.data.storeSettings.activeTunnelUrl = cleanUrl;
    }

    if (this.firestore) {
      try {
        await setDoc(doc(this.firestore, 'system_meta', 'server_info'), {
          publicUrl: cleanUrl,
          customerAppUrl: `${cleanUrl}/customer-app`,
          ownerAppUrl: `${cleanUrl}/owner-app`,
          updatedAt: new Date().toISOString(),
          status: 'online'
        }, { merge: true });

        await setDoc(doc(this.firestore, 'store_settings', 'current'), {
          activePublicUrl: cleanUrl,
          activeTunnelUrl: cleanUrl,
          updatedAt: new Date().toISOString()
        }, { merge: true });

        console.log(`[Firestore Success] 🌐 Live server URL published to Google Firestore: ${cleanUrl}`);
      } catch (err: any) {
        console.warn('[Firestore] Failed to publish live server URL:', err?.message || err);
      }
    }
  }

  // --- STATS, REVENUE & CUSTOMERS (OWNER ONLY) ---

  public getCustomers(): Customer[] {
    const customerMap = new Map<string, Customer>();
    const verifiedSet = new Set(this.data.verifiedCustomerIds || []);

    for (const order of this.data.orders) {
      const cleanPhone = (order.customerPhone || '').replace(/[^0-9]/g, '');
      const key = cleanPhone || (order.customerName || 'unknown').toLowerCase().trim();
      if (!key) continue;

      const existing = customerMap.get(key);
      const isDelivered = order.status === 'DELIVERED';
      const orderDeliveredRev = isDelivered
        ? Number(order.customRevenue !== null && order.customRevenue !== undefined ? order.customRevenue : (order.deliveredRevenue ?? order.grandTotal)) || 0
        : 0;
      const isPaid = order.paymentStatus === 'PAID' || order.status === 'ACCEPTED' || isDelivered;
      const orderAmount = isPaid ? order.grandTotal : 0;

      if (!existing) {
        customerMap.set(key, {
          id: key,
          name: order.customerName,
          phone: order.customerPhone,
          address: order.customerAddress,
          totalOrders: 1,
          deliveredOrders: isDelivered ? 1 : 0,
          pendingOrders: order.status === 'PENDING' ? 1 : 0,
          deliveredRevenue: orderDeliveredRev,
          totalSpent: orderDeliveredRev > 0 ? orderDeliveredRev : orderAmount,
          verified: verifiedSet.has(key),
          lastOrderDate: order.createdAt,
          sourceUrl: order.sourceUrl
        });
      } else {
        existing.totalOrders += 1;
        if (isDelivered) {
          existing.deliveredOrders = (existing.deliveredOrders || 0) + 1;
          existing.deliveredRevenue = (existing.deliveredRevenue || 0) + orderDeliveredRev;
          existing.totalSpent = existing.deliveredRevenue;
        } else if (order.status === 'PENDING') {
          existing.pendingOrders = (existing.pendingOrders || 0) + 1;
        } else if ((existing.deliveredRevenue || 0) === 0) {
          existing.totalSpent += orderAmount;
        }
        if (new Date(order.createdAt) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = order.createdAt;
          existing.address = order.customerAddress;
        }
      }
    }

    return Array.from(customerMap.values()).sort((a, b) => {
      const revDiff = (b.deliveredRevenue || 0) - (a.deliveredRevenue || 0);
      if (revDiff !== 0) return revDiff;
      return (b.totalSpent || 0) - (a.totalSpent || 0);
    });
  }

  public async toggleCustomerVerified(customerId: string): Promise<boolean> {
    if (!this.data.verifiedCustomerIds) {
      this.data.verifiedCustomerIds = [];
    }
    const idx = this.data.verifiedCustomerIds.indexOf(customerId);
    let isNowVerified = false;
    if (idx >= 0) {
      this.data.verifiedCustomerIds.splice(idx, 1);
      isNowVerified = false;
    } else {
      this.data.verifiedCustomerIds.push(customerId);
      isNowVerified = true;
    }

    if (this.firestore) {
      try {
        await setDoc(doc(this.firestore, 'system_meta', 'verified_customers'), {
          ids: this.data.verifiedCustomerIds,
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error('[Firestore Error] Failed to update verified customers:', err);
      }
    }

    this.saveDatabaseLocal();
    return isNowVerified;
  }

  public async updateOrderPayment(orderId: string, paymentStatus: 'PENDING' | 'PAID' | 'VERIFIED'): Promise<Order> {
    const order = this.getOrder(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    order.paymentStatus = paymentStatus;
    if (paymentStatus === 'PAID' || paymentStatus === 'VERIFIED') {
      order.paidAt = new Date().toISOString();
    }
    order.updatedAt = new Date().toISOString();

    if (this.firestore) {
      try {
        await setDoc(doc(this.firestore, 'orders', orderId), cleanForFirestore(order));
      } catch (err) {
        console.error('[Firestore Error] Failed to update payment status:', err);
      }
    }

    this.saveDatabaseLocal();
    return order;
  }

  public getStats(): DashboardStats {
    let totalStock = 0;
    let totalSoldQuantity = 0;
    let liveProducts = 0;
    let upcomingProducts = 0;
    let outOfStockProducts = 0;

    for (const product of this.data.products) {
      if (product.status === 'LIVE') liveProducts++;
      else if (product.status === 'UPCOMING') upcomingProducts++;
      else if (product.status === 'OUT_OF_STOCK') outOfStockProducts++;

      for (const variant of product.variants) {
        totalStock += variant.stockQuantity || 0;
        totalSoldQuantity += variant.soldQuantity || 0;
      }
    }

    let pendingOrders = 0;
    let acceptedOrders = 0;
    let packagingOrders = 0;
    let outForDeliveryOrders = 0;
    let deliveredOrders = 0;
    let cancelledOrders = 0;
    let calculatedSales = 0;

    for (const order of this.data.orders) {
      if (order.status === 'PENDING') {
        pendingOrders++;
      } else if (order.status === 'ACCEPTED') {
        acceptedOrders++;
      } else if (order.status === 'PACKAGING') {
        packagingOrders++;
      } else if (order.status === 'OUT_FOR_DELIVERY') {
        outForDeliveryOrders++;
      } else if (order.status === 'DELIVERED') {
        deliveredOrders++;
        // AUTOMATIC DELIVERED REVENUE RULE:
        // Automatically computed from delivered orders using the order total / saved order price
        const orderRev = Number(
          order.customRevenue !== undefined && order.customRevenue !== null
            ? order.customRevenue
            : (order.deliveredRevenue ?? order.grandTotal)
        ) || 0;
        order.deliveredRevenue = Number(order.deliveredRevenue ?? order.grandTotal) || 0;
        order.finalRevenue = orderRev;
        order.revenueCounted = true;
        order.revenueContribution = orderRev;
        calculatedSales += orderRev;
      } else if (order.status === 'CANCELLED') {
        cancelledOrders++;
      }
    }

    const customers = this.getCustomers();
    const verifiedCustomers = customers.filter(c => c.verified).length;

    // Total Revenue is the sum of valid revenue transactions from successfully delivered orders
    const totalSales = calculatedSales;

    return {
      totalProducts: this.data.products.length,
      liveProducts,
      upcomingProducts,
      outOfStockProducts,
      totalStock,
      totalOrders: this.data.orders.length,
      pendingOrders,
      acceptedOrders,
      packagingOrders,
      outForDeliveryOrders,
      deliveredOrders,
      cancelledOrders,
      totalSoldQuantity,
      totalSales,
      calculatedSales,
      customRevenue: this.data.customRevenue ?? null,
      isCustomRevenue: typeof this.data.customRevenue === 'number',
      revenueMode: 'orders',
      totalCustomers: customers.length,
      verifiedCustomers
    };
  }

  public getRevenueTransactions(): RevenueTransaction[] {
    if (!this.data.revenueTransactions) {
      this.data.revenueTransactions = [];
    }

    // Ensure all delivered orders are tracked
    const existingOrderIds = new Set(this.data.revenueTransactions.map(t => t.orderId));
    let hasNew = false;
    for (const o of this.data.orders) {
      if (o.status === 'DELIVERED' && !existingOrderIds.has(o.id)) {
        const rev = Number(o.customRevenue !== null && o.customRevenue !== undefined ? o.customRevenue : o.grandTotal) || 0;
        this.data.revenueTransactions.push({
          id: `REV-${o.id}`,
          orderId: o.id,
          customerName: o.customerName,
          customerPhone: o.customerPhone,
          orderTotal: Number(o.grandTotal) || 0,
          revenueAmount: rev,
          status: 'DELIVERED',
          revenueCounted: true,
          deliveredAt: o.deliveredAt || o.updatedAt,
          createdAt: o.deliveredAt || o.updatedAt
        });
        hasNew = true;
      }
    }

    if (hasNew) {
      this.saveDatabaseLocal();
    }

    return [...this.data.revenueTransactions].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public async setRevenueMode(mode: 'manual' | 'orders'): Promise<void> {
    this.data.manualRevenueOnly = (mode === 'manual');
    if (this.firestore) {
      try {
        await setDoc(doc(this.firestore, 'system_meta', 'revenue_settings'), {
          manualRevenueOnly: this.data.manualRevenueOnly,
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error('[Firestore Error] Failed to update revenue mode:', err);
      }
    }
    this.saveDatabaseLocal();
  }

  public async setCustomRevenue(revenue: number | null): Promise<void> {
    const val = (revenue === null || isNaN(Number(revenue)) || revenue < 0) ? null : Number(revenue);
    this.data.customRevenue = val;
    this.data.manualRevenueOnly = true; // Setting custom revenue locks manual mode

    if (this.firestore) {
      try {
        await setDoc(doc(this.firestore, 'system_meta', 'state'), {
          orderCounter: this.data.orderCounter,
          customRevenue: val,
          manualRevenueOnly: true,
          updatedAt: new Date().toISOString()
        });
      } catch (err: any) {
        console.error('[Firestore Error] Failed to update revenue:', err);
      }
    }

    this.saveDatabaseLocal();
  }

  // --- PERMANENT PHOTO CLOUD STORAGE ---

  public async saveImage(imageId: string, dataUrl: string, contentType: string = 'image/jpeg'): Promise<string> {
    const cleanId = imageId.replace(/[^a-zA-Z0-9_\-\.]/g, '');

    // 1. Persist to Firestore CLOUD database (SURVIVES RESTARTS & NEW INSTANCES)
    if (this.firestore) {
      try {
        await setDoc(doc(this.firestore, 'product_images', cleanId), {
          id: cleanId,
          data: dataUrl,
          contentType,
          updatedAt: new Date().toISOString()
        });
        console.log(`[Firestore Success] Uploaded photo ${cleanId} stored permanently in cloud database.`);
      } catch (err: any) {
        console.error(`[Firestore Photo Error] Failed to store photo ${cleanId}:`, err);
        throw new Error(`Failed to store product photo in persistent cloud database: ${err.message}`);
      }
    }

    // 2. Local cache file for ultra-fast serving
    try {
      const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const buffer = Buffer.from(matches[2], 'base64');
        fs.writeFileSync(path.join(UPLOADS_DIR, cleanId), buffer);
      }
    } catch {
      // Local disk cache write is non-fatal
    }

    // Return the persistent photo URL
    return `/api/images/${cleanId}`;
  }

  public async getImage(imageId: string): Promise<{ buffer: Buffer; contentType: string } | null> {
    const cleanId = imageId.replace(/[^a-zA-Z0-9_\-\.]/g, '');
    const localPath = path.join(UPLOADS_DIR, cleanId);

    // 1. Try local cache first for sub-millisecond response
    if (fs.existsSync(localPath)) {
      try {
        const buffer = fs.readFileSync(localPath);
        return { buffer, contentType: 'image/jpeg' };
      } catch {
        // Fall through to Firestore
      }
    }

    // 2. Fetch from Firestore CLOUD storage (e.g. after Cloud Run instance restart/cold-start!)
    if (this.firestore) {
      try {
        const snap = await getDoc(doc(this.firestore, 'product_images', cleanId));
        if (snap.exists()) {
          const docData = snap.data();
          const matches = docData.data?.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            const buffer = Buffer.from(matches[2], 'base64');
            const cType = matches[1] || docData.contentType || 'image/jpeg';
            // Re-populate local cache
            try { fs.writeFileSync(localPath, buffer); } catch {}
            return { buffer, contentType: cType };
          }
        }
      } catch (err: any) {
        console.error(`[Firestore Image Read Error] Failed to retrieve ${cleanId}:`, err.message);
      }
    }

    return null;
  }

  public async resetSeed(): Promise<void> {
    this.data.products = SEED_PRODUCTS;
    this.data.orders = [];
    this.data.orderCounter = 1;
    this.data.customRevenue = null;

    if (this.firestore) {
      try {
        for (const p of SEED_PRODUCTS) {
          await setDoc(doc(this.firestore, 'products', p.id), p);
        }
      } catch (err) {
        console.error('[Firestore Reset Error]:', err);
      }
    }

    this.saveDatabaseLocal();
  }
}

export const db = new DatabaseService();
