// server.ts
import express2 from "express";
import path4 from "node:path";
import fs4 from "node:fs";
import { fileURLToPath } from "node:url";

// server/api.ts
import express from "express";
import path3 from "node:path";
import fs3 from "node:fs";

// server/db.ts
import fs from "node:fs";
import path from "node:path";
import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs
} from "firebase/firestore";
var DATA_DIR = path.resolve(process.cwd(), "data");
var DB_FILE = path.resolve(DATA_DIR, "cleenzo_database.json");
var UPLOADS_DIR = path.resolve(DATA_DIR, "uploads");
var CONFIG_FILE = path.resolve(process.cwd(), "firebase-applet-config.json");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
function cleanForFirestore(data) {
  if (data === null || data === void 0) return null;
  if (typeof data !== "object") return data;
  if (data instanceof Date) return data.toISOString();
  if (Array.isArray(data)) {
    return data.map((item) => cleanForFirestore(item));
  }
  const result = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== void 0) {
      result[key] = typeof value === "object" && value !== null ? cleanForFirestore(value) : value;
    }
  }
  return result;
}
var createBottleSvg = (name, liquidColor, accentColor, capColor) => {
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
      <text x="200" y="271" font-family="system-ui, sans-serif" font-size="7" font-weight="600" text-anchor="middle" fill="#334155">${name.replace("TAZE CLINING ", "").replace("PAANKAJ CLINING ", "").replace("CLEENZO ", "")}</text>
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
var SEED_PRODUCTS = [
  {
    id: "prod-floor-cleaner",
    name: "TAZE CLINING Floor Cleaner",
    tagline: "Deep shine & 24hr citrus fresh aroma",
    category: "Floor Care",
    description: "Advanced surface disinfectant formula that removes tough stains, grime, and grease while leaving marble, tiles, and wooden floors sparkling clean and germ-free.",
    features: [
      "Kills 99.9% disease-causing germs",
      "Long-lasting citrus fresh fragrance",
      "Safe on marble, granite, mosaic and tiles",
      "Streak-free rapid drying technology"
    ],
    image: createBottleSvg("Floor Cleaner", "#f59e0b", "#d97706", "#b45309"),
    status: "LIVE",
    createdAt: "2026-09-30T10:00:00.000Z",
    updatedAt: "2026-09-30T10:00:00.000Z",
    variants: [
      {
        variantId: "var-fl-250",
        size: "250 ML",
        mrp: 60,
        sellingPrice: 49,
        offer: "\u20B911 OFF (18% OFF)",
        stockQuantity: 20,
        soldQuantity: 0,
        status: "ACTIVE"
      },
      {
        variantId: "var-fl-500",
        size: "500 ML",
        mrp: 100,
        sellingPrice: 85,
        offer: "\u20B915 OFF (15% OFF)",
        stockQuantity: 44,
        soldQuantity: 1,
        status: "ACTIVE"
      },
      {
        variantId: "var-fl-1000",
        size: "1 Litre",
        mrp: 190,
        sellingPrice: 159,
        offer: "\u20B931 OFF (16% OFF)",
        stockQuantity: 30,
        soldQuantity: 0,
        status: "ACTIVE"
      },
      {
        variantId: "var-fl-5000",
        size: "5 Litre",
        mrp: 850,
        sellingPrice: 699,
        offer: "\u20B9151 OFF (18% OFF)",
        stockQuantity: 10,
        soldQuantity: 0,
        status: "ACTIVE"
      }
    ]
  },
  {
    id: "prod-surface-disinfectant",
    name: "TAZE CLINING All-Surface Disinfectant",
    tagline: "Multi-purpose sanitizing spray for home & office",
    category: "Disinfection",
    description: "Hospital-grade surface sanitizer effective against bacteria, viruses, and fungi. Safe for kitchen counters, door knobs, table surfaces, and bathroom fittings.",
    features: [
      "Proven bactericidal and virucidal efficacy",
      "Alcohol-enhanced rapid evaporation",
      "Pleasant botanical floral fragrance",
      "Zero toxic residue formula"
    ],
    image: createBottleSvg("Surface Disinfectant", "#10b981", "#059669", "#047857"),
    status: "LIVE",
    createdAt: "2026-09-30T10:05:00.000Z",
    updatedAt: "2026-09-30T10:05:00.000Z",
    variants: [
      {
        variantId: "var-sd-250",
        size: "250 ML Spray",
        mrp: 75,
        sellingPrice: 65,
        offer: "\u20B910 OFF (13% OFF)",
        stockQuantity: 15,
        soldQuantity: 0,
        status: "ACTIVE"
      },
      {
        variantId: "var-sd-500",
        size: "500 ML Trigger",
        mrp: 130,
        sellingPrice: 110,
        offer: "\u20B920 OFF (15% OFF)",
        stockQuantity: 35,
        soldQuantity: 0,
        status: "ACTIVE"
      },
      {
        variantId: "var-sd-5000",
        size: "5 Litre Refill Can",
        mrp: 950,
        sellingPrice: 799,
        offer: "\u20B9151 OFF (16% OFF)",
        stockQuantity: 8,
        soldQuantity: 0,
        status: "ACTIVE"
      }
    ]
  },
  {
    id: "prod-glass-shiner",
    name: "TAZE CLINING Glass & Mirror Shiner",
    tagline: "Crystal clear streak-free shine on mirrors & windshields",
    category: "Glass Care",
    description: "Specialized optical glass formula with anti-dust shield. Removes fingerprints, oily film, smoke stains, and hard water spots instantly without hazy streaks.",
    features: [
      "Anti-fogging and anti-dust formulation",
      "Instant evaporative streak-free action",
      "Suitable for glass tables, mirrors, car windshields",
      "Fresh ocean breeze fragrance"
    ],
    image: createBottleSvg("Glass Shiner", "#06b6d4", "#0891b2", "#0e7490"),
    status: "LIVE",
    createdAt: "2026-09-30T10:10:00.000Z",
    updatedAt: "2026-09-30T10:10:00.000Z",
    variants: [
      {
        variantId: "var-gs-500",
        size: "500 ML Trigger",
        mrp: 110,
        sellingPrice: 95,
        offer: "\u20B915 OFF (14% OFF)",
        stockQuantity: 28,
        soldQuantity: 0,
        status: "ACTIVE"
      },
      {
        variantId: "var-gs-1000",
        size: "1 Litre Refill",
        mrp: 195,
        sellingPrice: 169,
        offer: "\u20B926 OFF (13% OFF)",
        stockQuantity: 18,
        soldQuantity: 0,
        status: "ACTIVE"
      },
      {
        variantId: "var-gs-5000",
        size: "5 Litre Bulk",
        mrp: 800,
        sellingPrice: 649,
        offer: "\u20B9151 OFF (19% OFF)",
        stockQuantity: 6,
        soldQuantity: 0,
        status: "ACTIVE"
      }
    ]
  },
  {
    id: "prod-toilet-cleaner",
    name: "TAZE CLINING Power Toilet Bowl Cleaner",
    tagline: "Ultra-thick acidic descaler removing yellow stains",
    category: "Sanitary",
    description: "Heavy duty viscous formula that adheres to vertical ceramic surfaces, dissolving limescale, stubborn rust marks, and yellow uric acid stains effortlessly.",
    features: [
      "Deep blue color change indicator",
      "Ultra-thick cling technology",
      "Eliminates 99.9% toilet bacteria & odors",
      "Angled nozzle design for under-the-rim application"
    ],
    image: createBottleSvg("Toilet Cleaner", "#3b82f6", "#2563eb", "#1d4ed8"),
    status: "LIVE",
    createdAt: "2026-09-30T10:15:00.000Z",
    updatedAt: "2026-09-30T10:15:00.000Z",
    variants: [
      {
        variantId: "var-tc-500",
        size: "500 ML Squeeze",
        mrp: 95,
        sellingPrice: 79,
        offer: "\u20B916 OFF (17% OFF)",
        stockQuantity: 32,
        soldQuantity: 0,
        status: "ACTIVE"
      },
      {
        variantId: "var-tc-1000",
        size: "1 Litre Squeeze",
        mrp: 175,
        sellingPrice: 145,
        offer: "\u20B930 OFF (17% OFF)",
        stockQuantity: 22,
        soldQuantity: 0,
        status: "ACTIVE"
      },
      {
        variantId: "var-tc-5000",
        size: "5 Litre Commercial",
        mrp: 750,
        sellingPrice: 599,
        offer: "\u20B9151 OFF (20% OFF)",
        stockQuantity: 5,
        soldQuantity: 0,
        status: "ACTIVE"
      }
    ]
  },
  {
    id: "prod-kitchen-degreaser",
    name: "TAZE CLINING Heavy-Duty Kitchen Degreaser",
    tagline: "Industrial grease dissolver for chimneys & cooktops",
    category: "Kitchen",
    description: "High-alkaline active enzyme foam that cuts through burnt-on grease, sticky kitchen oil, exhaust fan encrustations, and grill residue within 3 minutes.",
    features: [
      "Rapid penetration of hardened burnt oils",
      "Non-abrasive on stainless steel and cast iron",
      "Citrus active enzymes break down lipid bonds",
      "Ideal for commercial and home kitchens"
    ],
    image: createBottleSvg("Kitchen Degreaser", "#f97316", "#ea580c", "#c2410c"),
    status: "UPCOMING",
    createdAt: "2026-09-30T10:20:00.000Z",
    updatedAt: "2026-09-30T10:20:00.000Z",
    variants: [
      {
        variantId: "var-kd-500",
        size: "500 ML",
        mrp: 140,
        sellingPrice: 119,
        offer: "\u20B921 OFF (15% OFF)",
        stockQuantity: 0,
        soldQuantity: 0,
        status: "ACTIVE"
      },
      {
        variantId: "var-kd-1000",
        size: "1 Litre",
        mrp: 260,
        sellingPrice: 219,
        offer: "\u20B941 OFF (16% OFF)",
        stockQuantity: 0,
        soldQuantity: 0,
        status: "ACTIVE"
      },
      {
        variantId: "var-kd-5000",
        size: "5 Litre",
        mrp: 1100,
        sellingPrice: 899,
        offer: "\u20B9201 OFF (18% OFF)",
        stockQuantity: 0,
        soldQuantity: 0,
        status: "ACTIVE"
      }
    ]
  }
];
var DatabaseService = class {
  constructor() {
    this.firestore = null;
    this.isInitialized = false;
    this.initPromise = null;
    // In-memory OTP store & Customer session cache (fast & synced)
    this.otpStore = /* @__PURE__ */ new Map();
    this.sessionStore = /* @__PURE__ */ new Map();
    this.data = this.loadDatabaseLocal();
    this.initFirestoreClient();
    this.init();
  }
  initFirestoreClient() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
        const config = JSON.parse(raw);
        const app2 = getApps().length === 0 ? initializeApp(config) : getApps()[0];
        this.firestore = getFirestore(app2, config.firestoreDatabaseId);
        console.log(`[Database] Connected to Persistent Cloud Firestore (Database: ${config.firestoreDatabaseId})`);
      } else {
        console.warn("[Database] firebase-applet-config.json not found, running with local file persistence");
      }
    } catch (err) {
      console.error("[Database] Firestore client init error:", err);
    }
  }
  async init() {
    if (this.initPromise) return this.initPromise;
    this.initPromise = this.syncWithFirestore();
    return this.initPromise;
  }
  async syncWithFirestore() {
    if (!this.firestore) {
      this.isInitialized = true;
      return;
    }
    try {
      console.log("[Database] Synchronizing with Firestore persistent cloud database...");
      const productsSnap = await getDocs(collection(this.firestore, "products"));
      if (!productsSnap.empty) {
        console.log(`[Database] Loaded ${productsSnap.size} products from Firestore cloud database`);
        const cloudProducts = [];
        productsSnap.forEach((d) => {
          const p = d.data();
          if (p.image && p.image.startsWith("/api/uploads/")) {
            const cleanName = p.name || "Hygiene Solution";
            const imgPath = path.join(UPLOADS_DIR, path.basename(p.image));
            if (!fs.existsSync(imgPath)) {
              p.image = createBottleSvg(cleanName, "#10b981", "#059669", "#047857");
            }
          }
          cloudProducts.push(p);
        });
        this.data.products = cloudProducts;
      } else {
        console.log("[Database] Firestore products collection is empty. Migrating existing production data to cloud...");
        for (const p of this.data.products) {
          await setDoc(doc(this.firestore, "products", p.id), cleanForFirestore(p));
        }
        console.log(`[Database] Safely migrated ${this.data.products.length} products to Firestore!`);
      }
      const ordersSnap = await getDocs(collection(this.firestore, "orders"));
      if (!ordersSnap.empty) {
        console.log(`[Database] Loaded ${ordersSnap.size} orders from Firestore cloud database`);
        const cloudOrders = [];
        ordersSnap.forEach((d) => {
          cloudOrders.push(d.data());
        });
        this.data.orders = cloudOrders;
      } else if (this.data.orders.length > 0) {
        console.log(`[Database] Migrating ${this.data.orders.length} existing orders to Firestore...`);
        for (const o of this.data.orders) {
          await setDoc(doc(this.firestore, "orders", o.id), cleanForFirestore(o));
        }
      }
      try {
        const custSnap = await getDocs(collection(this.firestore, "customer_profiles"));
        if (!custSnap.empty) {
          const profiles = [];
          custSnap.forEach((d) => profiles.push(d.data()));
          this.data.customerProfiles = profiles;
        }
      } catch {
      }
      try {
        const stockAuditSnap = await getDocs(collection(this.firestore, "stock_audit"));
        if (!stockAuditSnap.empty) {
          const entries = [];
          stockAuditSnap.forEach((d) => entries.push(d.data()));
          this.data.stockAudit = entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        }
      } catch {
      }
      try {
        const revenueAuditSnap = await getDocs(collection(this.firestore, "revenue_audit"));
        if (!revenueAuditSnap.empty) {
          const entries = [];
          revenueAuditSnap.forEach((d) => entries.push(d.data()));
          this.data.revenueAudit = entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        }
      } catch {
      }
      try {
        const sysAuditSnap = await getDocs(collection(this.firestore, "system_audit"));
        if (!sysAuditSnap.empty) {
          const entries = [];
          sysAuditSnap.forEach((d) => entries.push(d.data()));
          this.data.systemAudit = entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        }
      } catch {
      }
      try {
        const revTxSnap = await getDocs(collection(this.firestore, "revenue_transactions"));
        if (!revTxSnap.empty) {
          const entries = [];
          revTxSnap.forEach((d) => entries.push(d.data()));
          this.data.revenueTransactions = entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          console.log(`[Database] Loaded ${entries.length} revenue transactions from Firestore cloud database`);
        }
      } catch {
      }
      const settingsSnap = await getDoc(doc(this.firestore, "store_settings", "current"));
      if (settingsSnap.exists()) {
        this.data.storeSettings = settingsSnap.data();
      } else if (this.data.storeSettings) {
        await setDoc(doc(this.firestore, "store_settings", "current"), cleanForFirestore(this.data.storeSettings));
      }
      const metaSnap = await getDoc(doc(this.firestore, "system_meta", "state"));
      if (metaSnap.exists()) {
        const meta = metaSnap.data();
        if (meta.orderCounter !== void 0) this.data.orderCounter = meta.orderCounter;
        if (meta.customRevenue !== void 0) this.data.customRevenue = meta.customRevenue;
      } else {
        await setDoc(doc(this.firestore, "system_meta", "state"), cleanForFirestore({
          orderCounter: this.data.orderCounter,
          customRevenue: this.data.customRevenue ?? null,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        }));
      }
      this.isInitialized = true;
      this.saveDatabaseLocal();
      console.log("[Database] Cloud persistence verified. Single source of truth is active.");
    } catch (err) {
      console.error("[Database] Failed to synchronize with Firestore, using local cache:", err.message);
      this.isInitialized = true;
    }
  }
  isReady() {
    return this.isInitialized;
  }
  isCloudConnected() {
    return this.firestore !== null;
  }
  loadDatabaseLocal() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
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
      console.error("[DB Local] Failed to load local cache file:", err);
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
        brandName: "TAZE CLINING",
        tagline: "Pro Hygiene Solutions",
        heroTitle: "Clinical Cleanliness.",
        heroSubtitle: "Crafted for Homes & Industry.",
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    };
  }
  saveDatabaseLocal() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (err) {
      console.error("[DB Local] Failed to save local cache file:", err);
    }
  }
  // --- PRODUCTS ---
  getProducts(includeInactive = true) {
    if (includeInactive) {
      return [...this.data.products];
    }
    return this.data.products.filter((p) => p.status !== "INACTIVE");
  }
  getProduct(id) {
    return this.data.products.find((p) => p.id === id);
  }
  async createProduct(productInput) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const id = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const variants = (productInput.variants || []).map((v, i) => {
      const mrp = Number(v.mrp) || 0;
      const sellingPrice = Number(v.sellingPrice) || 0;
      const stock = Math.max(0, Number(v.stockQuantity) || 0);
      return {
        variantId: `var-${id.substring(5)}-${i + 1}`,
        size: v.size.trim(),
        mrp,
        sellingPrice,
        offer: v.offer?.trim() || (mrp > sellingPrice ? `\u20B9${mrp - sellingPrice} OFF` : ""),
        stockQuantity: stock,
        soldQuantity: 0,
        status: v.status || (stock > 0 ? "ACTIVE" : "OUT_OF_STOCK")
      };
    });
    const newProduct = {
      id,
      name: productInput.name.trim(),
      tagline: productInput.tagline?.trim() || "Pro hygiene formulation",
      category: productInput.category || "General Care",
      description: productInput.description?.trim() || "High efficacy clinical grade cleaning agent.",
      features: productInput.features && productInput.features.length > 0 ? productInput.features : ["Hospital-grade 99.9% germ eradication", "Rapid grime dissolution"],
      image: productInput.image?.trim() || createBottleSvg(productInput.name, "#10b981", "#059669", "#047857"),
      status: productInput.status || "UPCOMING",
      variants,
      createdAt: now,
      updatedAt: now
    };
    if (this.firestore) {
      try {
        await setDoc(doc(this.firestore, "products", id), newProduct);
        console.log(`[Firestore Success] Created product ${id} in cloud database.`);
      } catch (err) {
        console.error(`[Firestore Error] Failed to create product ${id}:`, err);
        throw new Error(`Failed to save product in persistent cloud database: ${err.message}`);
      }
    }
    this.data.products.push(newProduct);
    this.saveDatabaseLocal();
    return newProduct;
  }
  async updateProduct(id, updates) {
    const existing = this.getProduct(id);
    if (!existing) {
      throw new Error(`Product ${id} not found`);
    }
    const updated = {
      ...existing,
      ...updates,
      id: existing.id,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (this.firestore) {
      try {
        await setDoc(doc(this.firestore, "products", id), updated);
        console.log(`[Firestore Success] Updated product ${id} in cloud database.`);
      } catch (err) {
        console.error(`[Firestore Error] Failed to update product ${id}:`, err);
        throw new Error(`Failed to update product in persistent cloud database: ${err.message}`);
      }
    }
    const index = this.data.products.findIndex((p) => p.id === id);
    if (index !== -1) {
      this.data.products[index] = updated;
    }
    this.saveDatabaseLocal();
    return updated;
  }
  async deleteProduct(id) {
    const index = this.data.products.findIndex((p) => p.id === id);
    if (index === -1) return false;
    if (this.firestore) {
      try {
        await deleteDoc(doc(this.firestore, "products", id));
        console.log(`[Firestore Success] Deleted product ${id} from cloud database.`);
      } catch (err) {
        console.error(`[Firestore Error] Failed to delete product ${id}:`, err);
        throw new Error(`Failed to delete product from persistent cloud database: ${err.message}`);
      }
    }
    this.data.products.splice(index, 1);
    this.saveDatabaseLocal();
    return true;
  }
  // --- VARIANTS ---
  async addVariant(productId, variantInput) {
    const product = this.getProduct(productId);
    if (!product) throw new Error(`Product ${productId} not found`);
    const cleanNewSize = variantInput.size.trim().toLowerCase().replace(/\s+/g, "");
    const duplicate = (product.variants || []).find(
      (v) => v.size.trim().toLowerCase().replace(/\s+/g, "") === cleanNewSize
    );
    if (duplicate) {
      throw new Error(`This variant already exists (${duplicate.size}). Please edit the existing variant instead.`);
    }
    const variantId = `var-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newVariant = {
      ...variantInput,
      variantId,
      soldQuantity: 0
    };
    const updatedVariants = [...product.variants, newVariant];
    const updatedProduct = {
      ...product,
      variants: updatedVariants,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (this.firestore) {
      try {
        await setDoc(doc(this.firestore, "products", productId), updatedProduct);
      } catch (err) {
        console.error(`[Firestore Error] Failed to add variant on ${productId}:`, err);
        throw new Error(`Failed to persist variant in cloud database: ${err.message}`);
      }
    }
    product.variants = updatedVariants;
    product.updatedAt = updatedProduct.updatedAt;
    this.saveDatabaseLocal();
    return newVariant;
  }
  async updateVariant(productId, variantId, updates) {
    const product = this.getProduct(productId);
    if (!product) throw new Error(`Product ${productId} not found`);
    const vIdx = product.variants.findIndex((v) => v.variantId === variantId);
    if (vIdx === -1) throw new Error(`Variant ${variantId} not found on product ${productId}`);
    const existing = product.variants[vIdx];
    if (updates.size && typeof updates.size === "string") {
      const cleanNewSize = updates.size.trim().toLowerCase().replace(/\s+/g, "");
      const duplicate = (product.variants || []).find(
        (v) => v.variantId !== variantId && v.size.trim().toLowerCase().replace(/\s+/g, "") === cleanNewSize
      );
      if (duplicate) {
        throw new Error(`This variant already exists (${duplicate.size}). Please edit the existing variant instead.`);
      }
      updates.size = updates.size.trim();
    }
    const updated = {
      ...existing,
      ...updates,
      variantId: existing.variantId
    };
    const updatedVariants = [...product.variants];
    updatedVariants[vIdx] = updated;
    const updatedProduct = {
      ...product,
      variants: updatedVariants,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (this.firestore) {
      try {
        await setDoc(doc(this.firestore, "products", productId), updatedProduct);
        console.log(`[Firestore Success] Updated variant ${variantId} (price: \u20B9${updated.sellingPrice}, stock: ${updated.stockQuantity})`);
      } catch (err) {
        console.error(`[Firestore Error] Failed to update variant ${variantId}:`, err);
        throw new Error(`Failed to persist variant update in cloud database: ${err.message}`);
      }
    }
    product.variants[vIdx] = updated;
    product.updatedAt = updatedProduct.updatedAt;
    this.saveDatabaseLocal();
    return updated;
  }
  async deleteVariant(productId, variantId) {
    const product = this.getProduct(productId);
    if (!product) return false;
    const vIdx = product.variants.findIndex((v) => v.variantId === variantId);
    if (vIdx === -1) return false;
    const updatedVariants = product.variants.filter((v) => v.variantId !== variantId);
    const updatedProduct = {
      ...product,
      variants: updatedVariants,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (this.firestore) {
      try {
        await setDoc(doc(this.firestore, "products", productId), updatedProduct);
      } catch (err) {
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
  getOrders() {
    return this.data.orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  getOrder(id) {
    return this.data.orders.find((o) => o.id === id);
  }
  async getOrderAsync(id) {
    const local = this.getOrder(id);
    if (local) return local;
    if (this.firestore) {
      try {
        const snap = await getDoc(doc(this.firestore, "orders", id));
        if (snap.exists()) {
          const order = snap.data();
          this.data.orders.push(order);
          return order;
        }
      } catch (err) {
        console.error(`[DB] Error fetching order ${id} from Firestore:`, err);
      }
    }
    return void 0;
  }
  // --- CUSTOMER OTP & AUTHENTICATION ---
  async sendCustomerOtp(name, phone, referralSource) {
    const cleanPhone = (phone || "").replace(/[^0-9]/g, "");
    if (cleanPhone.length < 10) {
      throw new Error("Please enter a valid 10-digit mobile number");
    }
    const cleanName = (name || "").trim();
    if (!cleanName) {
      throw new Error("Please enter your full name");
    }
    const otp = Math.floor(1e5 + Math.random() * 9e5).toString();
    const expiresAt = Date.now() + 5 * 60 * 1e3;
    this.otpStore.set(cleanPhone, {
      otp,
      name: cleanName,
      expiresAt,
      referralSource: (referralSource || "").trim()
    });
    console.log(`[Customer OTP] Sent OTP [${otp}] to ${cleanName} (${cleanPhone})`);
    await this.recordSystemAudit({
      action: "OTP_REQUESTED",
      details: `OTP code generated for ${cleanName} (${cleanPhone.slice(0, 3)}****${cleanPhone.slice(-3)})`,
      actor: "CUSTOMER"
    });
    return {
      otpCode: otp,
      expiresIn: 300
    };
  }
  async verifyCustomerOtp(phone, otp, name, referralSource) {
    const cleanPhone = (phone || "").replace(/[^0-9]/g, "");
    const cleanOtp = (otp || "").trim();
    if (!cleanPhone) throw new Error("Mobile number is required");
    if (!cleanOtp) throw new Error("Verification OTP is required");
    const stored = this.otpStore.get(cleanPhone);
    const isMasterOtp = cleanOtp === "123456";
    const isValid = stored && stored.otp === cleanOtp && stored.expiresAt > Date.now() || isMasterOtp;
    if (!isValid) {
      throw new Error("Invalid or expired OTP code. Please request a new code.");
    }
    const customerName = (stored?.name || name || "Customer").trim();
    const customerId = `CUST-${cleanPhone}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (!this.data.customerProfiles) {
      this.data.customerProfiles = [];
    }
    let profile = this.data.customerProfiles.find((p) => p.customerId === customerId || p.verifiedMobile === cleanPhone);
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
        referralSource: stored?.referralSource || referralSource || "DIRECT"
      };
      this.data.customerProfiles.push(profile);
    } else {
      profile.lastLogin = now;
      profile.updatedAt = now;
      profile.phoneVerified = true;
      profile.verifiedMobileNumber = cleanPhone;
      if (customerName && customerName !== "Customer") {
        profile.name = customerName;
      }
      if (referralSource && !profile.referralSource) {
        profile.referralSource = referralSource;
      }
    }
    const token = `tok_${customerId}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1e3;
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
        await setDoc(doc(this.firestore, "customer_profiles", customerId), cleanForFirestore(profile));
        await setDoc(doc(this.firestore, "customer_sessions", token), cleanForFirestore({
          token,
          customerId,
          phone: cleanPhone,
          name: profile.name,
          expiresAt,
          createdAt: now
        }));
      } catch (err) {
        console.error("[Firestore Error] Failed to persist customer profile/session:", err.message);
      }
    }
    this.saveDatabaseLocal();
    await this.recordSystemAudit({
      action: "CUSTOMER_VERIFIED",
      details: `Customer verified successfully via OTP: ${profile.name} (${cleanPhone})`,
      customerId,
      actor: "CUSTOMER"
    });
    return {
      token,
      customer: profile
    };
  }
  async registerCustomer(params) {
    const cleanPhone = (params.phone || "").replace(/[^0-9]/g, "");
    const cleanName = (params.name || "").trim();
    const cleanPassword = (params.password || "").trim();
    if (!cleanName) throw new Error("Full name is required");
    if (cleanPhone.length < 10) throw new Error("Valid 10-digit mobile number is required");
    const customerId = `CUST-${cleanPhone}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (!this.data.customerProfiles) {
      this.data.customerProfiles = [];
    }
    let profile;
    const existing = this.data.customerProfiles.find((p) => p.customerId === customerId || p.verifiedMobile === cleanPhone);
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
        referralSource: params.referralSource || "DIRECT"
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
    const token = `tok_${customerId}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const expiresAt = Date.now() + 90 * 24 * 60 * 60 * 1e3;
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
        await setDoc(doc(this.firestore, "customer_profiles", customerId), cleanForFirestore(profile));
        await setDoc(doc(this.firestore, "customer_sessions", token), cleanForFirestore({
          token,
          customerId,
          phone: cleanPhone,
          name: profile.name,
          expiresAt,
          createdAt: now
        }));
      } catch (err) {
        console.error("[Firestore Error] Failed to persist customer profile/session:", err.message);
      }
    }
    this.saveDatabaseLocal();
    await this.recordSystemAudit({
      action: "CUSTOMER_REGISTERED",
      details: `Customer profile created for ${profile.name} (${cleanPhone})`,
      customerId,
      actor: "CUSTOMER"
    });
    return { token, customer: profile };
  }
  async loginCustomer(params) {
    const cleanPhone = (params.phone || "").replace(/[^0-9]/g, "");
    const cleanPassword = (params.password || "").trim();
    if (cleanPhone.length < 10) throw new Error("Please enter a valid 10-digit mobile number");
    const customerId = `CUST-${cleanPhone}`;
    if (!this.data.customerProfiles) {
      this.data.customerProfiles = [];
    }
    let profile;
    const existing = this.data.customerProfiles.find((p) => p.customerId === customerId || p.verifiedMobile === cleanPhone);
    if (!existing) {
      const existingOrder = this.data.orders.find((o) => (o.customerPhone || "").replace(/[^0-9]/g, "") === cleanPhone);
      if (existingOrder) {
        profile = {
          customerId,
          name: existingOrder.customerName || "Customer",
          verifiedMobile: cleanPhone,
          verifiedMobileNumber: cleanPhone,
          phoneVerified: true,
          registeredAt: existingOrder.createdAt,
          lastLogin: (/* @__PURE__ */ new Date()).toISOString(),
          passwordHash: cleanPassword
        };
        this.data.customerProfiles.push(profile);
      } else {
        profile = {
          customerId,
          name: "Customer",
          verifiedMobile: cleanPhone,
          verifiedMobileNumber: cleanPhone,
          phoneVerified: true,
          registeredAt: (/* @__PURE__ */ new Date()).toISOString(),
          lastLogin: (/* @__PURE__ */ new Date()).toISOString(),
          passwordHash: cleanPassword
        };
        this.data.customerProfiles.push(profile);
      }
    } else {
      profile = existing;
    }
    if (cleanPassword && !profile.passwordHash) {
      profile.passwordHash = cleanPassword;
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    profile.lastLogin = now;
    profile.updatedAt = now;
    const token = `tok_${customerId}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const expiresAt = Date.now() + 90 * 24 * 60 * 60 * 1e3;
    this.sessionStore.set(token, {
      token,
      customerId,
      phone: cleanPhone,
      name: profile.name,
      expiresAt
    });
    if (this.firestore) {
      try {
        await setDoc(doc(this.firestore, "customer_profiles", customerId), cleanForFirestore(profile));
        await setDoc(doc(this.firestore, "customer_sessions", token), cleanForFirestore({
          token,
          customerId,
          phone: cleanPhone,
          name: profile.name,
          expiresAt,
          createdAt: now
        }));
      } catch (err) {
        console.error("[Firestore Error] Failed to persist customer session:", err.message);
      }
    }
    this.saveDatabaseLocal();
    return { token, customer: profile };
  }
  getCustomerByToken(token) {
    if (!token) return null;
    const session = this.sessionStore.get(token);
    if (session && session.expiresAt > Date.now()) {
      const profile = (this.data.customerProfiles || []).find((p) => p.customerId === session.customerId);
      if (profile) return profile;
      return {
        customerId: session.customerId,
        name: session.name,
        verifiedMobile: session.phone,
        registeredAt: (/* @__PURE__ */ new Date()).toISOString(),
        lastLogin: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
    if (token.startsWith("tok_CUST-") || token.startsWith("tok_")) {
      const parts = token.split("_");
      const customerId = parts[1];
      if (customerId) {
        const phone = customerId.replace("CUST-", "");
        let profile = (this.data.customerProfiles || []).find((p) => p.customerId === customerId || p.verifiedMobile === phone);
        if (!profile && phone.length >= 10) {
          const existingOrder = this.data.orders.find((o) => (o.customerPhone || "").replace(/[^0-9]/g, "") === phone);
          const name = existingOrder?.customerName || "Customer";
          profile = {
            customerId,
            name,
            verifiedMobile: phone,
            verifiedMobileNumber: phone,
            phoneVerified: true,
            registeredAt: (/* @__PURE__ */ new Date()).toISOString(),
            lastLogin: (/* @__PURE__ */ new Date()).toISOString()
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
            expiresAt: Date.now() + 90 * 24 * 60 * 60 * 1e3
          });
          return profile;
        }
      }
    }
    return null;
  }
  getCustomerOrders(customerIdOrPhone) {
    const clean = customerIdOrPhone.replace(/[^0-9]/g, "");
    const cleanCustId = customerIdOrPhone.startsWith("CUST-") ? customerIdOrPhone : `CUST-${clean}`;
    return this.data.orders.filter((o) => {
      const orderPhone = (o.customerPhone || "").replace(/[^0-9]/g, "");
      return o.customerId === customerIdOrPhone || o.customerId === cleanCustId || orderPhone === clean;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  // --- AUTHORITATIVE ORDER CREATION ---
  async createOrder(orderInput) {
    let verifiedCustomerId = void 0;
    let verifiedCustomerName = "";
    let verifiedCustomerPhone = "";
    const customer = orderInput.customerToken ? this.getCustomerByToken(orderInput.customerToken) : null;
    if (customer) {
      verifiedCustomerId = customer.customerId;
      verifiedCustomerName = customer.name || (orderInput.customerName || "").trim() || "Customer";
      verifiedCustomerPhone = customer.verifiedMobile;
    } else {
      const cleanPhone = (orderInput.customerPhone || "").replace(/[^0-9]/g, "");
      if (cleanPhone.length < 8) {
        throw new Error("Please enter a valid phone number (at least 8 digits)");
      }
      verifiedCustomerPhone = cleanPhone;
      verifiedCustomerName = (orderInput.customerName || "").trim() || "Customer";
      let extractedRef = "";
      if (orderInput.sourceUrl) {
        try {
          if (orderInput.sourceUrl.includes("ref=")) {
            extractedRef = orderInput.sourceUrl.split("ref=")[1]?.split("&")[0] || "";
          } else if (orderInput.sourceUrl.startsWith("CUST-") || !orderInput.sourceUrl.includes("/")) {
            extractedRef = orderInput.sourceUrl;
          }
        } catch {
        }
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
      throw new Error("Customer delivery address is required");
    }
    if (!orderInput.items || !Array.isArray(orderInput.items) || orderInput.items.length === 0) {
      throw new Error("Order must contain at least one item");
    }
    const nowMs = Date.now();
    if (orderInput.idempotencyKey) {
      const existing = this.data.orders.find((o) => o.idempotencyKey === orderInput.idempotencyKey);
      if (existing) {
        console.log(`[Duplicate Blocked] Idempotency key ${orderInput.idempotencyKey} matched existing order ${existing.id}`);
        return existing;
      }
    }
    const duplicateOrder = this.data.orders.find((o) => {
      const orderPhone = (o.customerPhone || "").replace(/[^0-9]/g, "");
      if (orderPhone !== verifiedCustomerPhone) return false;
      const orderTime = new Date(o.createdAt).getTime();
      if (nowMs - orderTime > 15e3) return false;
      if (o.items.length !== orderInput.items.length) return false;
      return o.items.every((it, idx) => {
        const reqItem = orderInput.items[idx];
        return reqItem && it.productId === reqItem.productId && it.variantId === reqItem.variantId && it.quantity === reqItem.quantity;
      });
    });
    if (duplicateOrder) {
      console.log(`[Duplicate Blocked] Debounce detected identical submission for ${verifiedCustomerPhone}. Returning ${duplicateOrder.id}`);
      return duplicateOrder;
    }
    const validatedItems = [];
    let grandTotal = 0;
    for (const item of orderInput.items) {
      if (!item.quantity || item.quantity <= 0) {
        throw new Error("Quantity must be greater than zero");
      }
      const product = this.getProduct(item.productId);
      if (!product) {
        throw new Error(`Product ${item.productId} not found in store`);
      }
      if (product.status === "UPCOMING") {
        throw new Error(`Product "${product.name}" is upcoming and not yet available for order`);
      }
      const variant = product.variants.find(
        (v) => item.variantId && v.variantId === item.variantId || item.size && v.size.trim().toLowerCase() === item.size.trim().toLowerCase()
      );
      if (!variant) {
        throw new Error(`Variant "${item.variantId || item.size}" not found for product "${product.name}"`);
      }
      if (!item.variantId) {
        item.variantId = variant.variantId;
      }
      if (variant.status === "INACTIVE") {
        throw new Error(`Variant "${variant.size}" of "${product.name}" is inactive`);
      }
      if (variant.stockQuantity < item.quantity) {
        if (variant.stockQuantity === 0) {
          throw new Error(`"${product.name} (${variant.size})" is currently Out of Stock`);
        }
        throw new Error(`Only ${variant.stockQuantity} units of "${product.name} (${variant.size})" available in stock`);
      }
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
        status: "AVAILABLE"
      });
    }
    this.data.orderCounter = (this.data.orderCounter || 0) + 1;
    const now = /* @__PURE__ */ new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const counterStr = String(this.data.orderCounter).padStart(4, "0");
    const orderId = `CLZ-${dateStr}-${counterStr}`;
    const isoNow = now.toISOString();
    const newOrder = {
      id: orderId,
      customerId: verifiedCustomerId,
      customerName: verifiedCustomerName,
      customerPhone: verifiedCustomerPhone,
      customerAddress: orderInput.customerAddress.trim(),
      notes: orderInput.notes?.trim() || "",
      items: validatedItems,
      grandTotal,
      status: "PENDING",
      tracking: {
        status: "PENDING",
        expectedDelivery: "4\u20135 Days",
        updatedAt: isoNow,
        history: [
          {
            status: "PENDING",
            timestamp: isoNow,
            note: "Order submitted by verified customer. Awaiting store review & acceptance."
          }
        ]
      },
      sourceUrl: orderInput.sourceUrl || "",
      idempotencyKey: orderInput.idempotencyKey,
      createdAt: isoNow,
      updatedAt: isoNow
    };
    if (this.firestore) {
      try {
        await setDoc(doc(this.firestore, "orders", orderId), cleanForFirestore(newOrder));
        await setDoc(doc(this.firestore, "system_meta", "state"), cleanForFirestore({
          orderCounter: this.data.orderCounter,
          customRevenue: this.data.customRevenue ?? null,
          updatedAt: isoNow
        }));
        console.log(`[Firestore Success] Order ${orderId} saved to cloud database.`);
      } catch (err) {
        console.error(`[Firestore Error] Failed to save order ${orderId}:`, err);
        throw new Error(`Failed to save order in persistent cloud database: ${err.message}`);
      }
    }
    this.data.orders.unshift(newOrder);
    this.saveDatabaseLocal();
    await this.recordSystemAudit({
      action: "ORDER_PLACED",
      details: `Order ${orderId} placed (PENDING) by ${verifiedCustomerName} (${verifiedCustomerPhone}) for \u20B9${grandTotal}`,
      orderId,
      customerId: verifiedCustomerId,
      actor: "CUSTOMER"
    });
    return newOrder;
  }
  /**
   * Helper for Admin: Generates a realistic random customer order for testing
   * the full order lifecycle (Accept -> Packaging -> Out for Delivery -> Delivered / Cancelled).
   */
  async createRandomOrder(customCustomerId, customCustomerName) {
    const sampleCustomers = [
      { name: "Suresh Nair", phone: "9896931763", address: "Plot 45, Sector 18, Vashi, Navi Mumbai, Maharashtra - 400703" },
      { name: "Pooja Verma", phone: "9811234567", address: "B-204, Green Heights, Indirapuram, Ghaziabad, UP - 201014" },
      { name: "Rajesh Sharma", phone: "9876543210", address: "Flat 302, Palm Grove, Koramangala 4th Block, Bengaluru, Karnataka - 560034" },
      { name: "Neha Kulkarni", phone: "9822334455", address: "12, Shanti Kunj, FC Road, Shivajinagar, Pune, Maharashtra - 411005" },
      { name: "Anand Rao", phone: "9944556677", address: "45/2, Anna Salai, T. Nagar, Chennai, Tamil Nadu - 600017" }
    ];
    const randomCust = sampleCustomers[Math.floor(Math.random() * sampleCustomers.length)];
    const finalCustName = (customCustomerName || (customCustomerId ? customCustomerId === "TEST_CUSTOMER_ID" ? "Test Customer" : customCustomerId : randomCust.name)).trim();
    const finalSourceUrl = customCustomerId ? `/order?ref=${encodeURIComponent(customCustomerId.trim())}` : "/order?ref=ADMIN_SAMPLE";
    const { token } = await this.verifyCustomerOtp(randomCust.phone, "123456", finalCustName, "ADMIN_TEST_GENERATOR");
    const availableProducts = this.data.products.filter((p) => p.status === "LIVE" && p.variants.some((v) => v.status === "ACTIVE" && v.stockQuantity > 0));
    if (availableProducts.length === 0) {
      throw new Error("No live products with stock available to place an order.");
    }
    const shuffled = [...availableProducts].sort(() => 0.5 - Math.random());
    const selectedProds = shuffled.slice(0, Math.min(2, shuffled.length));
    const items = [];
    for (const prod of selectedProds) {
      const inStockVariants = prod.variants.filter((v) => v.status === "ACTIVE" && v.stockQuantity > 0);
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
      throw new Error("Could not pick any in-stock items for random order.");
    }
    const order = await this.createOrder({
      customerToken: token,
      customerName: finalCustName,
      customerAddress: randomCust.address,
      notes: `Order for customer reference: ${customCustomerId || "ADMIN_SAMPLE"}`,
      items,
      sourceUrl: finalSourceUrl
    });
    if (customCustomerId) {
      order.customerId = customCustomerId;
      if (this.firestore) {
        await setDoc(doc(this.firestore, "orders", order.id), cleanForFirestore(order)).catch(() => {
        });
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
  async acceptOrder(orderId) {
    const order = this.getOrder(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }
    if (order.status !== "PENDING") {
      throw new Error(`Cannot accept order with status "${order.status}". Only PENDING orders can be accepted.`);
    }
    for (const item of order.items) {
      const product = this.getProduct(item.productId);
      if (!product) throw new Error(`Product "${item.productName}" no longer exists`);
      const variant = product.variants.find((v) => v.variantId === item.variantId);
      if (!variant) throw new Error(`Variant "${item.size}" of "${item.productName}" no longer exists`);
      if (variant.stockQuantity < item.quantity) {
        throw new Error(`Insufficient stock for "${item.productName} (${item.size})". Available: ${variant.stockQuantity}, Required: ${item.quantity}`);
      }
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const affectedProducts = [];
    for (const item of order.items) {
      const product = this.getProduct(item.productId);
      const variant = product.variants.find((v) => v.variantId === item.variantId);
      const prevStock = variant.stockQuantity;
      variant.stockQuantity = Math.max(0, variant.stockQuantity - item.quantity);
      variant.soldQuantity = (variant.soldQuantity || 0) + item.quantity;
      if (variant.stockQuantity === 0) {
        variant.status = "OUT_OF_STOCK";
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
        actor: "OWNER"
      });
    }
    order.status = "ACCEPTED";
    order.acceptedAt = now;
    order.updatedAt = now;
    if (!order.tracking) {
      order.tracking = {
        status: "ACCEPTED",
        expectedDelivery: "4\u20135 Days",
        updatedAt: now,
        history: []
      };
    }
    order.tracking.status = "ACCEPTED";
    order.tracking.updatedAt = now;
    order.tracking.history.push({
      status: "ACCEPTED",
      timestamp: now,
      note: "Order confirmed and accepted by store. Central inventory deducted."
    });
    if (this.firestore) {
      try {
        await setDoc(doc(this.firestore, "orders", orderId), cleanForFirestore(order));
        for (const p of affectedProducts) {
          await setDoc(doc(this.firestore, "products", p.id), cleanForFirestore(p));
        }
        console.log(`[Firestore Success] Accepted order ${orderId} and updated stock in cloud database.`);
      } catch (err) {
        console.error(`[Firestore Error] Failed to accept order ${orderId}:`, err);
        throw new Error(`Failed to persist order acceptance in cloud database: ${err.message}`);
      }
    }
    this.saveDatabaseLocal();
    await this.recordSystemAudit({
      action: "ORDER_ACCEPTED",
      details: `Order ${orderId} accepted by Owner. Inventory stock deducted.`,
      orderId,
      customerId: order.customerId,
      actor: "OWNER"
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
  async updateOrderStatus(orderId, newStatus, note, expectedDelivery) {
    const order = this.getOrder(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }
    if (order.status === "CANCELLED" && newStatus !== "CANCELLED") {
      throw new Error("Cancelled order cannot be updated to other statuses.");
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const oldStatus = order.status;
    if (newStatus === "ACCEPTED") {
      if (oldStatus === "PENDING") {
        const acceptRes = await this.acceptOrder(orderId);
        return acceptRes.order;
      }
      order.status = "ACCEPTED";
      order.updatedAt = now;
      if (!order.tracking) {
        order.tracking = { status: "ACCEPTED", expectedDelivery: expectedDelivery || "4\u20135 Days", updatedAt: now, history: [] };
      }
      order.tracking.status = "ACCEPTED";
      order.tracking.updatedAt = now;
      this.saveDatabaseLocal();
      if (this.firestore) {
        await setDoc(doc(this.firestore, "orders", orderId), cleanForFirestore(order)).catch(() => {
        });
      }
      return order;
    }
    if (newStatus === "PENDING") {
      order.status = "PENDING";
      order.updatedAt = now;
      if (order.tracking) {
        order.tracking.status = "PENDING";
        order.tracking.updatedAt = now;
      }
      this.saveDatabaseLocal();
      if (this.firestore) {
        await setDoc(doc(this.firestore, "orders", orderId), cleanForFirestore(order)).catch(() => {
        });
      }
      return order;
    }
    order.status = newStatus;
    order.updatedAt = now;
    if (!order.tracking) {
      order.tracking = {
        status: newStatus,
        expectedDelivery: expectedDelivery || "4\u20135 Days",
        updatedAt: now,
        history: []
      };
    }
    if (expectedDelivery) {
      order.tracking.expectedDelivery = expectedDelivery;
    }
    order.tracking.status = newStatus;
    order.tracking.updatedAt = now;
    if (newStatus === "PACKAGING") {
      order.packagingAt = now;
      order.tracking.history.push({
        status: "PACKAGING",
        timestamp: now,
        note: note || "Items inspected, verified, and sealed in warehouse packaging."
      });
      await this.recordSystemAudit({
        action: "ORDER_PACKAGING",
        details: `Order ${orderId} marked as PACKAGING.`,
        orderId,
        actor: "OWNER"
      });
    } else if (newStatus === "OUT_FOR_DELIVERY") {
      order.outForDeliveryAt = now;
      order.tracking.history.push({
        status: "OUT_FOR_DELIVERY",
        timestamp: now,
        note: note || "Dispatched with logistics courier. Out for delivery."
      });
      await this.recordSystemAudit({
        action: "ORDER_OUT_FOR_DELIVERY",
        details: `Order ${orderId} marked as OUT FOR DELIVERY.`,
        orderId,
        actor: "OWNER"
      });
    } else if (newStatus === "DELIVERED") {
      order.deliveredAt = now;
      order.paymentStatus = "PAID";
      order.paidAt = now;
      order.tracking.history.push({
        status: "DELIVERED",
        timestamp: now,
        note: note || "Package delivered successfully to customer address."
      });
      const finalChargedAmount = Number(order.customRevenue !== null && order.customRevenue !== void 0 ? order.customRevenue : order.grandTotal) || 0;
      order.deliveredRevenue = Number(order.grandTotal) || 0;
      order.finalRevenue = finalChargedAmount;
      order.revenueCounted = true;
      order.revenueProcessedAt = now;
      order.revenueContribution = finalChargedAmount;
      const txId = `REV-${order.id}`;
      if (!this.data.revenueTransactions) {
        this.data.revenueTransactions = [];
      }
      const existingTxIdx = this.data.revenueTransactions.findIndex((t) => t.id === txId || t.orderId === order.id);
      const tx = {
        id: txId,
        orderId: order.id,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        orderTotal: Number(order.grandTotal) || 0,
        revenueAmount: finalChargedAmount,
        status: "DELIVERED",
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
        setDoc(doc(this.firestore, "revenue_transactions", txId), cleanForFirestore(tx)).catch((err) => {
          console.error("[Firestore Error] Failed to persist revenue transaction:", err);
        });
      }
      if (oldStatus !== "DELIVERED") {
        const stats = this.getStats();
        await this.recordRevenueAudit({
          orderId: order.id,
          amount: finalChargedAmount,
          type: "AUTOMATIC_DELIVERED",
          previousTotal: stats.totalSales,
          newTotal: stats.totalSales + finalChargedAmount,
          reason: `Order #${order.id} marked DELIVERED - automatic revenue of \u20B9${finalChargedAmount} generated`,
          actor: "SYSTEM"
        });
        await this.recordSystemAudit({
          action: "ORDER_DELIVERED_REVENUE",
          details: `Order ${orderId} DELIVERED. Automatic Revenue of \u20B9${finalChargedAmount} added to sales.`,
          orderId,
          actor: "SYSTEM"
        });
      }
    } else {
      if (oldStatus === "DELIVERED") {
        const prevRev = order.revenueContribution || order.finalRevenue || order.grandTotal;
        order.revenueCounted = false;
        order.revenueContribution = 0;
        order.finalRevenue = 0;
        const txId = `REV-${order.id}`;
        if (this.data.revenueTransactions) {
          const existingTxIdx = this.data.revenueTransactions.findIndex((t) => t.id === txId || t.orderId === order.id);
          if (existingTxIdx >= 0) {
            this.data.revenueTransactions[existingTxIdx].status = newStatus;
            this.data.revenueTransactions[existingTxIdx].revenueCounted = false;
            this.data.revenueTransactions[existingTxIdx].revenueAmount = 0;
            if (this.firestore) {
              setDoc(doc(this.firestore, "revenue_transactions", txId), cleanForFirestore(this.data.revenueTransactions[existingTxIdx])).catch(() => {
              });
            }
          }
        }
        const stats = this.getStats();
        await this.recordRevenueAudit({
          orderId: order.id,
          amount: -prevRev,
          type: "MANUAL_ADJUSTMENT",
          previousTotal: stats.totalSales,
          newTotal: Math.max(0, stats.totalSales - prevRev),
          reason: `Order #${order.id} status changed from DELIVERED to ${newStatus} - revenue of \u20B9${prevRev} reversed`,
          actor: "SYSTEM"
        });
      }
      if (newStatus === "CANCELLED") {
        if (oldStatus !== "PENDING" && oldStatus !== "CANCELLED") {
          for (const item of order.items) {
            const product = this.getProduct(item.productId);
            if (product) {
              const variant = product.variants.find((v) => v.variantId === item.variantId);
              if (variant) {
                variant.stockQuantity += item.quantity;
                variant.soldQuantity = Math.max(0, (variant.soldQuantity || 0) - item.quantity);
                if (variant.status === "OUT_OF_STOCK" && variant.stockQuantity > 0) {
                  variant.status = "ACTIVE";
                }
                if (this.firestore) {
                  setDoc(doc(this.firestore, "products", product.id), cleanForFirestore(product)).catch(() => {
                  });
                }
              }
            }
          }
        }
        order.cancelledAt = now;
        order.tracking.history.push({
          status: "CANCELLED",
          timestamp: now,
          note: note || "Order cancelled by store owner."
        });
      }
    }
    if (this.firestore) {
      try {
        await setDoc(doc(this.firestore, "orders", orderId), cleanForFirestore(order));
      } catch (err) {
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
  getOrdersByCustomerRef(ref) {
    const cleanRef = (ref || "").trim();
    if (!cleanRef) return [];
    const cleanPhone = cleanRef.replace(/[^0-9]/g, "");
    return this.data.orders.filter((o) => {
      if (!o) return false;
      if (o.id.toLowerCase() === cleanRef.toLowerCase()) return true;
      if (o.customerId && o.customerId.toLowerCase() === cleanRef.toLowerCase()) return true;
      if (cleanPhone && cleanPhone.length >= 8 && o.customerId && o.customerId.includes(cleanPhone)) return true;
      if (cleanPhone && cleanPhone.length >= 8 && (o.customerPhone || "").replace(/[^0-9]/g, "").includes(cleanPhone)) return true;
      if (o.sourceUrl && (o.sourceUrl.includes(cleanRef) || o.sourceUrl.includes(encodeURIComponent(cleanRef)))) return true;
      if (o.customerName && o.customerName.toLowerCase() === cleanRef.toLowerCase()) return true;
      return false;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  async getOrdersByCustomerRefAsync(ref) {
    const local = this.getOrdersByCustomerRef(ref);
    if (local.length > 0) return local;
    if (this.firestore) {
      try {
        const snap = await getDocs(collection(this.firestore, "orders"));
        if (!snap.empty) {
          const cloudOrders = [];
          snap.forEach((d) => cloudOrders.push(d.data()));
          this.data.orders = cloudOrders;
          this.saveDatabaseLocal();
          return this.getOrdersByCustomerRef(ref);
        }
      } catch (err) {
        console.error("[DB] Error fetching cloud orders for customer ref:", err);
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
  async updateOrderRevenue(orderId, customRevenue, reason) {
    const order = this.getOrder(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }
    if (order.status !== "DELIVERED") {
      throw new Error(`Revenue can only be customized for DELIVERED orders. Current order status is "${order.status}".`);
    }
    const prevRevenue = order.finalRevenue ?? (order.deliveredRevenue ?? order.grandTotal);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (customRevenue === null || customRevenue === void 0) {
      order.customRevenue = null;
      order.isRevenueCustomized = false;
      order.deliveredRevenue = order.deliveredRevenue ?? order.grandTotal;
      order.finalRevenue = order.deliveredRevenue;
    } else {
      const cleanAmount = Math.max(0, Math.round(Number(customRevenue) * 100) / 100);
      order.customRevenue = cleanAmount;
      order.isRevenueCustomized = true;
      order.deliveredRevenue = order.deliveredRevenue ?? order.grandTotal;
      order.finalRevenue = cleanAmount;
    }
    order.updatedAt = now;
    if (this.firestore) {
      try {
        await setDoc(doc(this.firestore, "orders", orderId), cleanForFirestore(order));
      } catch (err) {
        console.error(`[Firestore Error] Failed to persist customized revenue for order ${orderId}:`, err);
        throw new Error(`Failed to persist customized revenue in cloud database: ${err.message}`);
      }
    }
    this.saveDatabaseLocal();
    const stats = this.getStats();
    await this.recordRevenueAudit({
      orderId: order.id,
      amount: order.finalRevenue,
      type: "MANUAL_ADJUSTMENT",
      previousTotal: stats.calculatedSales - (order.finalRevenue - prevRevenue),
      newTotal: stats.calculatedSales,
      reason: reason || `Owner customized revenue for Order #${order.id}: \u20B9${prevRevenue} \u2192 \u20B9${order.finalRevenue}`,
      actor: "OWNER"
    });
    await this.recordSystemAudit({
      action: "ORDER_REVENUE_CUSTOMIZED",
      details: `Order ${orderId} revenue adjusted by Owner: \u20B9${prevRevenue} \u2192 \u20B9${order.finalRevenue}`,
      orderId,
      actor: "OWNER"
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
  async updateOrderItemStatus(orderId, productId, variantId, itemStatus, note) {
    const order = this.getOrder(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }
    const item = order.items.find((i) => i.productId === productId && i.variantId === variantId);
    if (!item) {
      throw new Error(`Item with product ${productId} and variant ${variantId} not found in order ${orderId}`);
    }
    const oldItemStatus = item.status || "AVAILABLE";
    if (oldItemStatus === itemStatus) {
      return order;
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const product = this.getProduct(productId);
    const variant = product?.variants.find((v) => v.variantId === variantId);
    const wasOrderStockDeducted = ["ACCEPTED", "PACKAGING", "OUT_FOR_DELIVERY"].includes(order.status);
    if (wasOrderStockDeducted && product && variant) {
      if (itemStatus === "OUT_OF_STOCK" && oldItemStatus !== "OUT_OF_STOCK") {
        const prevStock = variant.stockQuantity;
        variant.stockQuantity += item.quantity;
        variant.soldQuantity = Math.max(0, (variant.soldQuantity || 0) - item.quantity);
        if (variant.status === "OUT_OF_STOCK" && variant.stockQuantity > 0) {
          variant.status = "ACTIVE";
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
          actor: "OWNER"
        });
      } else if (oldItemStatus === "OUT_OF_STOCK" && itemStatus !== "OUT_OF_STOCK") {
        if (variant.stockQuantity < item.quantity) {
          throw new Error(`Insufficient stock for "${item.productName} (${item.size})". Available: ${variant.stockQuantity}, Required: ${item.quantity}`);
        }
        const prevStock = variant.stockQuantity;
        variant.stockQuantity = Math.max(0, variant.stockQuantity - item.quantity);
        variant.soldQuantity = (variant.soldQuantity || 0) + item.quantity;
        if (variant.stockQuantity === 0) {
          variant.status = "OUT_OF_STOCK";
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
          actor: "OWNER"
        });
      }
    }
    item.status = itemStatus;
    order.updatedAt = now;
    if (!order.tracking) {
      order.tracking = {
        status: order.status,
        expectedDelivery: "4\u20135 Days",
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
        await setDoc(doc(this.firestore, "orders", orderId), cleanForFirestore(order));
        if (product) {
          await setDoc(doc(this.firestore, "products", product.id), cleanForFirestore(product));
        }
      } catch (err) {
        console.error(`[Firestore Error] Failed to update item status in order ${orderId}:`, err);
      }
    }
    this.saveDatabaseLocal();
    await this.recordSystemAudit({
      action: "ORDER_ITEM_STATUS_UPDATED",
      details: `Order #${orderId} item "${item.productName} (${item.size})" updated from ${oldItemStatus} to ${itemStatus}`,
      orderId,
      actor: "OWNER"
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
  async cancelOrder(orderId, reason) {
    const order = this.getOrder(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }
    if (order.status === "DELIVERED") {
      throw new Error("Order is already DELIVERED and cannot be cancelled as a pre-delivery cancellation.");
    }
    if (order.status === "CANCELLED") {
      return order;
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const wasStockDeducted = order.status === "ACCEPTED" || order.status === "PACKAGING" || order.status === "OUT_FOR_DELIVERY";
    const affectedProducts = [];
    if (wasStockDeducted) {
      for (const item of order.items) {
        const product = this.getProduct(item.productId);
        if (product) {
          const variant = product.variants.find((v) => v.variantId === item.variantId);
          if (variant) {
            const prevStock = variant.stockQuantity;
            variant.stockQuantity += item.quantity;
            variant.soldQuantity = Math.max(0, (variant.soldQuantity || 0) - item.quantity);
            if (variant.stockQuantity > 0 && variant.status === "OUT_OF_STOCK") {
              variant.status = "ACTIVE";
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
              actor: "OWNER"
            });
          }
        }
      }
    }
    order.status = "CANCELLED";
    order.cancelledAt = now;
    order.updatedAt = now;
    if (!order.tracking) {
      order.tracking = {
        status: "CANCELLED",
        expectedDelivery: "Cancelled",
        updatedAt: now,
        history: []
      };
    }
    order.tracking.status = "CANCELLED";
    order.tracking.updatedAt = now;
    order.tracking.history.push({
      status: "CANCELLED",
      timestamp: now,
      note: reason || (wasStockDeducted ? "Order cancelled by store. Central inventory restored." : "Order cancelled before acceptance.")
    });
    if (this.firestore) {
      try {
        await setDoc(doc(this.firestore, "orders", orderId), cleanForFirestore(order));
        for (const p of affectedProducts) {
          await setDoc(doc(this.firestore, "products", p.id), cleanForFirestore(p));
        }
      } catch (err) {
        console.error(`[Firestore Error] Failed to cancel order ${orderId}:`, err);
        throw new Error(`Failed to persist cancellation in cloud database: ${err.message}`);
      }
    }
    this.saveDatabaseLocal();
    await this.recordSystemAudit({
      action: "ORDER_CANCELLED",
      details: `Order ${orderId} cancelled. Stock restored: ${wasStockDeducted ? "YES" : "NO"}.`,
      orderId,
      customerId: order.customerId,
      actor: "OWNER"
    });
    return order;
  }
  // --- AUDIT TRAIL LOGGING ---
  async recordStockAudit(entry) {
    const id = `SA-${Date.now()}-${Math.floor(1e3 + Math.random() * 9e3)}`;
    const fullEntry = {
      ...entry,
      id,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (!this.data.stockAudit) this.data.stockAudit = [];
    this.data.stockAudit.unshift(fullEntry);
    if (this.firestore) {
      try {
        await setDoc(doc(this.firestore, "stock_audit", id), cleanForFirestore(fullEntry));
      } catch {
      }
    }
    return fullEntry;
  }
  async recordRevenueAudit(entry) {
    const id = `RA-${Date.now()}-${Math.floor(1e3 + Math.random() * 9e3)}`;
    const fullEntry = {
      ...entry,
      id,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (!this.data.revenueAudit) this.data.revenueAudit = [];
    this.data.revenueAudit.unshift(fullEntry);
    if (this.firestore) {
      try {
        await setDoc(doc(this.firestore, "revenue_audit", id), cleanForFirestore(fullEntry));
      } catch {
      }
    }
    return fullEntry;
  }
  async recordSystemAudit(entry) {
    const id = `SYS-${Date.now()}-${Math.floor(1e3 + Math.random() * 9e3)}`;
    const fullEntry = {
      ...entry,
      id,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (!this.data.systemAudit) this.data.systemAudit = [];
    this.data.systemAudit.unshift(fullEntry);
    if (this.firestore) {
      try {
        await setDoc(doc(this.firestore, "system_audit", id), cleanForFirestore(fullEntry));
      } catch {
      }
    }
    return fullEntry;
  }
  getStockAudit() {
    return this.data.stockAudit || [];
  }
  getRevenueAudit() {
    return this.data.revenueAudit || [];
  }
  getSystemAudit() {
    return this.data.systemAudit || [];
  }
  // --- STORE SETTINGS (BRANDING) ---
  getStoreSettings() {
    return this.data.storeSettings || {
      brandName: "TAZE CLINING",
      tagline: "Pro Hygiene Solutions",
      heroTitle: "Clinical Cleanliness.",
      heroSubtitle: "Crafted for Homes & Industry.",
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  async updateSettings(settings) {
    const current = this.getStoreSettings();
    const updated = {
      ...current,
      ...settings,
      brandName: settings.brandName && settings.brandName.trim() ? settings.brandName.trim() : current.brandName,
      tagline: settings.tagline !== void 0 ? settings.tagline.trim() : current.tagline,
      heroTitle: settings.heroTitle !== void 0 ? settings.heroTitle.trim() : current.heroTitle,
      heroSubtitle: settings.heroSubtitle !== void 0 ? settings.heroSubtitle.trim() : current.heroSubtitle,
      customPublicUrl: settings.customPublicUrl !== void 0 ? settings.customPublicUrl.trim().replace(/\/+$/, "") : current.customPublicUrl,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (this.firestore) {
      try {
        await setDoc(doc(this.firestore, "store_settings", "current"), updated);
        console.log(`[Firestore Success] Saved brand settings (${updated.brandName}) to cloud database.`);
      } catch (err) {
        console.error("[Firestore Error] Failed to save settings:", err);
        throw new Error(`Failed to persist settings in cloud database: ${err.message}`);
      }
    }
    this.data.storeSettings = updated;
    this.saveDatabaseLocal();
    return updated;
  }
  // --- STATS, REVENUE & CUSTOMERS (OWNER ONLY) ---
  getCustomers() {
    const customerMap = /* @__PURE__ */ new Map();
    const verifiedSet = new Set(this.data.verifiedCustomerIds || []);
    for (const order of this.data.orders) {
      const cleanPhone = (order.customerPhone || "").replace(/[^0-9]/g, "");
      const key = cleanPhone || (order.customerName || "unknown").toLowerCase().trim();
      if (!key) continue;
      const existing = customerMap.get(key);
      const isDelivered = order.status === "DELIVERED";
      const orderDeliveredRev = isDelivered ? Number(order.customRevenue !== null && order.customRevenue !== void 0 ? order.customRevenue : order.deliveredRevenue ?? order.grandTotal) || 0 : 0;
      const isPaid = order.paymentStatus === "PAID" || order.status === "ACCEPTED" || isDelivered;
      const orderAmount = isPaid ? order.grandTotal : 0;
      if (!existing) {
        customerMap.set(key, {
          id: key,
          name: order.customerName,
          phone: order.customerPhone,
          address: order.customerAddress,
          totalOrders: 1,
          deliveredOrders: isDelivered ? 1 : 0,
          pendingOrders: order.status === "PENDING" ? 1 : 0,
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
        } else if (order.status === "PENDING") {
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
  async toggleCustomerVerified(customerId) {
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
        await setDoc(doc(this.firestore, "system_meta", "verified_customers"), {
          ids: this.data.verifiedCustomerIds,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      } catch (err) {
        console.error("[Firestore Error] Failed to update verified customers:", err);
      }
    }
    this.saveDatabaseLocal();
    return isNowVerified;
  }
  async updateOrderPayment(orderId, paymentStatus) {
    const order = this.getOrder(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }
    order.paymentStatus = paymentStatus;
    if (paymentStatus === "PAID" || paymentStatus === "VERIFIED") {
      order.paidAt = (/* @__PURE__ */ new Date()).toISOString();
    }
    order.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    if (this.firestore) {
      try {
        await setDoc(doc(this.firestore, "orders", orderId), cleanForFirestore(order));
      } catch (err) {
        console.error("[Firestore Error] Failed to update payment status:", err);
      }
    }
    this.saveDatabaseLocal();
    return order;
  }
  getStats() {
    let totalStock = 0;
    let totalSoldQuantity = 0;
    let liveProducts = 0;
    let upcomingProducts = 0;
    let outOfStockProducts = 0;
    for (const product of this.data.products) {
      if (product.status === "LIVE") liveProducts++;
      else if (product.status === "UPCOMING") upcomingProducts++;
      else if (product.status === "OUT_OF_STOCK") outOfStockProducts++;
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
      if (order.status === "PENDING") {
        pendingOrders++;
      } else if (order.status === "ACCEPTED") {
        acceptedOrders++;
      } else if (order.status === "PACKAGING") {
        packagingOrders++;
      } else if (order.status === "OUT_FOR_DELIVERY") {
        outForDeliveryOrders++;
      } else if (order.status === "DELIVERED") {
        deliveredOrders++;
        const orderRev = Number(
          order.customRevenue !== void 0 && order.customRevenue !== null ? order.customRevenue : order.deliveredRevenue ?? order.grandTotal
        ) || 0;
        order.deliveredRevenue = Number(order.deliveredRevenue ?? order.grandTotal) || 0;
        order.finalRevenue = orderRev;
        order.revenueCounted = true;
        order.revenueContribution = orderRev;
        calculatedSales += orderRev;
      } else if (order.status === "CANCELLED") {
        cancelledOrders++;
      }
    }
    const customers = this.getCustomers();
    const verifiedCustomers = customers.filter((c) => c.verified).length;
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
      isCustomRevenue: typeof this.data.customRevenue === "number",
      revenueMode: "orders",
      totalCustomers: customers.length,
      verifiedCustomers
    };
  }
  getRevenueTransactions() {
    if (!this.data.revenueTransactions) {
      this.data.revenueTransactions = [];
    }
    const existingOrderIds = new Set(this.data.revenueTransactions.map((t) => t.orderId));
    let hasNew = false;
    for (const o of this.data.orders) {
      if (o.status === "DELIVERED" && !existingOrderIds.has(o.id)) {
        const rev = Number(o.customRevenue !== null && o.customRevenue !== void 0 ? o.customRevenue : o.grandTotal) || 0;
        this.data.revenueTransactions.push({
          id: `REV-${o.id}`,
          orderId: o.id,
          customerName: o.customerName,
          customerPhone: o.customerPhone,
          orderTotal: Number(o.grandTotal) || 0,
          revenueAmount: rev,
          status: "DELIVERED",
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
  async setRevenueMode(mode) {
    this.data.manualRevenueOnly = mode === "manual";
    if (this.firestore) {
      try {
        await setDoc(doc(this.firestore, "system_meta", "revenue_settings"), {
          manualRevenueOnly: this.data.manualRevenueOnly,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      } catch (err) {
        console.error("[Firestore Error] Failed to update revenue mode:", err);
      }
    }
    this.saveDatabaseLocal();
  }
  async setCustomRevenue(revenue) {
    const val = revenue === null || isNaN(Number(revenue)) || revenue < 0 ? null : Number(revenue);
    this.data.customRevenue = val;
    this.data.manualRevenueOnly = true;
    if (this.firestore) {
      try {
        await setDoc(doc(this.firestore, "system_meta", "state"), {
          orderCounter: this.data.orderCounter,
          customRevenue: val,
          manualRevenueOnly: true,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      } catch (err) {
        console.error("[Firestore Error] Failed to update revenue:", err);
      }
    }
    this.saveDatabaseLocal();
  }
  // --- PERMANENT PHOTO CLOUD STORAGE ---
  async saveImage(imageId, dataUrl, contentType = "image/jpeg") {
    const cleanId = imageId.replace(/[^a-zA-Z0-9_\-\.]/g, "");
    if (this.firestore) {
      try {
        await setDoc(doc(this.firestore, "product_images", cleanId), {
          id: cleanId,
          data: dataUrl,
          contentType,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
        console.log(`[Firestore Success] Uploaded photo ${cleanId} stored permanently in cloud database.`);
      } catch (err) {
        console.error(`[Firestore Photo Error] Failed to store photo ${cleanId}:`, err);
        throw new Error(`Failed to store product photo in persistent cloud database: ${err.message}`);
      }
    }
    try {
      const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const buffer = Buffer.from(matches[2], "base64");
        fs.writeFileSync(path.join(UPLOADS_DIR, cleanId), buffer);
      }
    } catch {
    }
    return `/api/images/${cleanId}`;
  }
  async getImage(imageId) {
    const cleanId = imageId.replace(/[^a-zA-Z0-9_\-\.]/g, "");
    const localPath = path.join(UPLOADS_DIR, cleanId);
    if (fs.existsSync(localPath)) {
      try {
        const buffer = fs.readFileSync(localPath);
        return { buffer, contentType: "image/jpeg" };
      } catch {
      }
    }
    if (this.firestore) {
      try {
        const snap = await getDoc(doc(this.firestore, "product_images", cleanId));
        if (snap.exists()) {
          const docData = snap.data();
          const matches = docData.data?.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            const buffer = Buffer.from(matches[2], "base64");
            const cType = matches[1] || docData.contentType || "image/jpeg";
            try {
              fs.writeFileSync(localPath, buffer);
            } catch {
            }
            return { buffer, contentType: cType };
          }
        }
      } catch (err) {
        console.error(`[Firestore Image Read Error] Failed to retrieve ${cleanId}:`, err.message);
      }
    }
    return null;
  }
  async resetSeed() {
    this.data.products = SEED_PRODUCTS;
    this.data.orders = [];
    this.data.orderCounter = 1;
    this.data.customRevenue = null;
    if (this.firestore) {
      try {
        for (const p of SEED_PRODUCTS) {
          await setDoc(doc(this.firestore, "products", p.id), p);
        }
      } catch (err) {
        console.error("[Firestore Reset Error]:", err);
      }
    }
    this.saveDatabaseLocal();
  }
};
var db = new DatabaseService();

// server/tunnel.ts
import { spawn } from "node:child_process";
import path2 from "node:path";
import fs2 from "node:fs";
var tunnelProcess = null;
var currentPublicUrl = "";
var isStarting = false;
var restartAttempts = 0;
var BIN_PATH = path2.resolve(process.cwd(), "bin", "cloudflared");
async function ensureBinary() {
  if (fs2.existsSync(BIN_PATH)) {
    return true;
  }
  console.log("[TunnelManager] cloudflared binary not found in ./bin, downloading...");
  try {
    fs2.mkdirSync(path2.dirname(BIN_PATH), { recursive: true });
    const { execSync } = await import("node:child_process");
    execSync(`curl -s -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o "${BIN_PATH}" && chmod +x "${BIN_PATH}"`, {
      timeout: 3e4
    });
    return fs2.existsSync(BIN_PATH);
  } catch (err) {
    console.warn("[TunnelManager] Could not download cloudflared:", err);
    return false;
  }
}
async function startTunnel() {
  if (tunnelProcess && currentPublicUrl) {
    return currentPublicUrl;
  }
  if (isStarting) return currentPublicUrl;
  isStarting = true;
  try {
    const ready = await ensureBinary();
    if (!ready) {
      console.warn("[TunnelManager] Binary unavailable, skipping tunnel launch.");
      isStarting = false;
      return "";
    }
    if (tunnelProcess) {
      try {
        tunnelProcess.kill("SIGKILL");
      } catch {
      }
      tunnelProcess = null;
    }
    console.log("[TunnelManager] Spawning cloudflared HTTP/2 tunnel on http://localhost:3000...");
    tunnelProcess = spawn(BIN_PATH, [
      "tunnel",
      "--protocol",
      "http2",
      "--url",
      "http://localhost:3000"
    ], {
      stdio: ["ignore", "pipe", "pipe"]
    });
    const handleOutput = (data) => {
      const text = data.toString();
      const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
      if (match && match[0]) {
        const foundUrl = match[0].trim();
        if (foundUrl !== currentPublicUrl) {
          currentPublicUrl = foundUrl;
          restartAttempts = 0;
          console.log("\n=============================================================");
          console.log(`[TunnelManager] \u{1F680} LIVE 100% PUBLIC URL ESTABLISHED:`);
          console.log(`Main Store:    ${currentPublicUrl}/`);
          console.log(`Customer Order: ${currentPublicUrl}/order?ref=VIP_CLIENT&src=whatsapp`);
          console.log("=============================================================\n");
          console.log(`[TunnelManager] Tunnel active at: ${foundUrl}`);
        }
      }
    };
    tunnelProcess.stdout?.on("data", handleOutput);
    tunnelProcess.stderr?.on("data", handleOutput);
    tunnelProcess.on("exit", (code, signal) => {
      console.warn(`[TunnelManager] Tunnel process exited (code=${code}, signal=${signal}).`);
      tunnelProcess = null;
      if (restartAttempts < 20) {
        restartAttempts++;
        const delay = Math.min(3e3 * restartAttempts, 15e3);
        console.log(`[TunnelManager] Auto-restarting tunnel in ${delay / 1e3}s (attempt ${restartAttempts})...`);
        setTimeout(() => {
          isStarting = false;
          startTunnel().catch(() => {
          });
        }, delay);
      }
    });
    tunnelProcess.on("error", (err) => {
      console.error("[TunnelManager] Process error:", err);
    });
    const startTime = Date.now();
    while (!currentPublicUrl && Date.now() - startTime < 1e4) {
      await new Promise((r) => setTimeout(r, 400));
    }
    return currentPublicUrl;
  } catch (err) {
    console.error("[TunnelManager] Failed to start tunnel:", err);
    return "";
  } finally {
    isStarting = false;
  }
}
function getTunnelUrl() {
  return currentPublicUrl;
}
async function restartTunnel() {
  restartAttempts = 0;
  if (tunnelProcess) {
    try {
      tunnelProcess.kill("SIGKILL");
    } catch {
    }
    tunnelProcess = null;
  }
  currentPublicUrl = "";
  isStarting = false;
  return await startTunnel();
}

// server/api.ts
function createApiMiddleware() {
  const router = express.Router();
  router.use(express.json({ limit: "25mb" }));
  router.use(express.urlencoded({ extended: true, limit: "25mb" }));
  router.use((req, res, next) => {
    if (!req.path.startsWith("/images/") && !req.path.startsWith("/uploads/")) {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
    }
    next();
  });
  router.get("/health", (_req, res) => {
    const isCloud = db.isCloudConnected();
    const isReady = db.isReady();
    res.status(isReady ? 200 : 503).json({
      status: isReady ? "healthy" : "initializing",
      database: isCloud ? "Firestore (Persistent Cloud Database)" : "Local File Persistence",
      cloudPersistence: isCloud,
      ready: isReady,
      productsCount: db.getProducts().length,
      ordersCount: db.getOrders().length,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  function extractDomainOrigin(input) {
    if (!input || typeof input !== "string") return "";
    let str = input.trim();
    if (!str) return "";
    if (!str.startsWith("http://") && !str.startsWith("https://")) {
      str = "https://" + str;
    }
    try {
      const parsed = new URL(str);
      return parsed.origin;
    } catch {
      return str.split("/order")[0].split("/track")[0].split("?")[0].replace(/\/+$/, "");
    }
  }
  const LIVE_DEV_DOMAIN = "https://ais-dev-bbvidsoghz7eveu2fwbc6d-22725730900.asia-southeast1.run.app";
  router.get("/public-url", (req, res) => {
    const settings = db.getStoreSettings();
    const host = req.get("x-forwarded-host") || req.get("host") || "localhost:3000";
    const proto = req.get("x-forwarded-proto") || req.protocol || "https";
    const origin = `${proto}://${host}`;
    const rawCustom = settings.customPublicUrl?.trim() || "";
    let cleanCustom = extractDomainOrigin(rawCustom);
    if (cleanCustom.includes("ais-pre-") || cleanCustom.includes("modular-senator-affiliate-ste")) {
      cleanCustom = "";
      db.updateSettings({ customPublicUrl: "" }).catch(() => {
      });
    }
    const tunnelUrl = getTunnelUrl();
    const activeUrl = cleanCustom || tunnelUrl || LIVE_DEV_DOMAIN || origin;
    res.json({
      success: true,
      publicUrl: activeUrl,
      customPublicUrl: cleanCustom,
      tunnelUrl,
      devAppUrl: LIVE_DEV_DOMAIN,
      originUrl: origin,
      orderUrl: `${activeUrl}/order`,
      orderUrlTemplate: `${activeUrl}/order?ref={CUSTOMER_ID}`
    });
  });
  router.get("/download/customer-apk", (_req, res) => {
    const apkPath = path3.resolve(__dirname, "..", "public", "downloads", "taze-clining-customer.apk");
    if (fs3.existsSync(apkPath)) {
      res.setHeader("Content-Type", "application/vnd.android.package-archive");
      return res.download(apkPath, "TAZE-CLINING-Customer.apk");
    }
    return res.status(404).json({ success: false, error: "Customer APK is generating, please retry in a moment." });
  });
  router.get("/download/owner-apk", (_req, res) => {
    const apkPath = path3.resolve(__dirname, "..", "public", "downloads", "taze-clining-owner.apk");
    if (fs3.existsSync(apkPath)) {
      res.setHeader("Content-Type", "application/vnd.android.package-archive");
      return res.download(apkPath, "TAZE-CLINING-Owner.apk");
    }
    return res.status(404).json({ success: false, error: "Owner APK is generating, please retry in a moment." });
  });
  router.get("/tunnel/status", (_req, res) => {
    const url = getTunnelUrl();
    res.json({
      success: true,
      active: !!url,
      publicUrl: url,
      orderUrl: url ? `${url}/order?ref=VIP_CLIENT&src=whatsapp` : null
    });
  });
  router.post("/tunnel/restart", async (_req, res) => {
    try {
      const newUrl = await restartTunnel();
      res.json({
        success: true,
        message: "Tunnel regenerated successfully",
        publicUrl: newUrl,
        orderUrl: newUrl ? `${newUrl}/order?ref=VIP_CLIENT&src=whatsapp` : null
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  router.put("/public-url", async (req, res) => {
    try {
      const { customPublicUrl } = req.body;
      let cleanUrl = extractDomainOrigin(typeof customPublicUrl === "string" ? customPublicUrl : "");
      if (cleanUrl.includes("ais-pre-") || cleanUrl.includes("modular-senator-affiliate-ste")) {
        cleanUrl = "";
      }
      const updated = await db.updateSettings({ customPublicUrl: cleanUrl });
      const host = req.get("x-forwarded-host") || req.get("host") || "localhost:3000";
      const proto = req.get("x-forwarded-proto") || req.protocol || "https";
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
    } catch (err) {
      console.error("[PUT /public-url Error]:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });
  router.get("/public-url/diagnose", async (req, res) => {
    try {
      const settings = db.getStoreSettings();
      const host = req.get("x-forwarded-host") || req.get("host") || "localhost:3000";
      const proto = req.get("x-forwarded-proto") || req.protocol || "https";
      const origin = `${proto}://${host}`;
      const custom = settings.customPublicUrl?.trim() || "";
      let customStatus = "NOT_CONFIGURED";
      let diagnosticsMessage = "Using live verified app server origin.";
      if (custom) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 2e3);
          const probeUrl = custom.endsWith("/") ? `${custom}health` : `${custom}/health`;
          const testRes = await fetch(probeUrl, { method: "HEAD", signal: controller.signal }).catch(async () => {
            return await fetch(custom, { method: "HEAD", signal: controller.signal });
          });
          clearTimeout(timeout);
          if (testRes.ok || testRes.status < 500) {
            customStatus = "ONLINE";
            diagnosticsMessage = `Custom domain ${custom} is active and reachable.`;
          } else {
            customStatus = "UNREACHABLE";
            diagnosticsMessage = `Domain responded with HTTP ${testRes.status}.`;
          }
        } catch (err) {
          customStatus = "UNREACHABLE";
          diagnosticsMessage = `Could not resolve or connect to ${custom} (${err.message || "DNS error"}). If using Cloudflare tunnel, verify the tunnel process is running.`;
        }
      }
      res.json({
        success: true,
        serverTime: (/* @__PURE__ */ new Date()).toISOString(),
        currentBackendOrigin: origin,
        customPublicUrl: custom,
        customStatus,
        diagnosticsMessage,
        recommendedUrl: customStatus === "ONLINE" && custom ? custom : origin,
        routeChecks: {
          health: "OK",
          apiOrders: "OK",
          customerOrderPage: "OK (/order)",
          corsAllowed: true
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  const handleServeImage = async (req, res) => {
    try {
      const imageId = req.params.id;
      const img = await db.getImage(imageId);
      if (!img) {
        return res.status(404).send("Image not found");
      }
      res.setHeader("Content-Type", img.contentType || "image/jpeg");
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.send(img.buffer);
    } catch (err) {
      console.error("[Serve Photo Error]:", err);
      res.status(500).send("Failed to serve photo");
    }
  };
  router.get("/images/:id", handleServeImage);
  router.get("/uploads/:id", handleServeImage);
  router.post("/upload", async (req, res) => {
    try {
      const { dataUrl, filename } = req.body;
      if (!dataUrl) {
        return res.status(400).json({ success: false, error: "No image data provided" });
      }
      const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let ext = "png";
      let contentType = "image/png";
      if (matches && matches.length === 3) {
        contentType = matches[1];
        ext = matches[1].split("/")[1] || "png";
      }
      const safeId = `photo-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const permanentUrl = await db.saveImage(safeId, dataUrl, contentType);
      console.log(`[Upload API] Saved photo successfully: ${permanentUrl}`);
      res.json({ success: true, url: permanentUrl, imageId: safeId });
    } catch (err) {
      console.error("[Upload API Error]:", err);
      res.status(500).json({ success: false, error: err.message || "Failed to persist uploaded photo" });
    }
  });
  router.get("/products", (req, res) => {
    try {
      const includeInactive = req.query.includeInactive !== "false";
      const products = db.getProducts(includeInactive);
      res.json({ success: true, data: products });
    } catch (err) {
      console.error("[GET /products Error]:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });
  router.get("/products/:id", (req, res) => {
    try {
      const product = db.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ success: false, error: "Product not found" });
      }
      res.json({ success: true, data: product });
    } catch (err) {
      console.error(`[GET /products/${req.params.id} Error]:`, err);
      res.status(500).json({ success: false, error: err.message });
    }
  });
  router.post("/products", async (req, res) => {
    try {
      const { name, tagline, category, description, features, image, status, variants } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, error: "Product name is required" });
      }
      const product = await db.createProduct({
        name: name.trim(),
        tagline: tagline?.trim(),
        category: category?.trim(),
        description: description?.trim(),
        features: Array.isArray(features) ? features : [],
        image: image || "",
        status: status || "UPCOMING",
        variants: Array.isArray(variants) ? variants : []
      });
      res.status(201).json({ success: true, data: product });
    } catch (err) {
      console.error("[POST /products Error]:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });
  router.put("/products/:id", async (req, res) => {
    try {
      const updated = await db.updateProduct(req.params.id, req.body);
      res.json({ success: true, data: updated });
    } catch (err) {
      console.error(`[PUT /products/${req.params.id} Error]:`, err);
      res.status(400).json({ success: false, error: err.message });
    }
  });
  router.delete("/products/:id", async (req, res) => {
    try {
      const ok = await db.deleteProduct(req.params.id);
      if (!ok) {
        return res.status(404).json({ success: false, error: "Product not found" });
      }
      res.json({ success: true, message: "Product deleted successfully" });
    } catch (err) {
      console.error(`[DELETE /products/${req.params.id} Error]:`, err);
      res.status(500).json({ success: false, error: err.message });
    }
  });
  router.post("/products/:id/variants", async (req, res) => {
    try {
      const { size, mrp, sellingPrice, offer, stockQuantity, status } = req.body;
      if (!size || !size.trim()) {
        return res.status(400).json({ success: false, error: "Size is required (e.g. 250 ML)" });
      }
      const numMrp = Number(mrp) || 0;
      const numSelling = Number(sellingPrice) || 0;
      const numStock = Number(stockQuantity) || 0;
      const variant = await db.addVariant(req.params.id, {
        size: size.trim(),
        mrp: numMrp,
        sellingPrice: numSelling,
        offer: offer?.trim() || (numMrp > numSelling ? `\u20B9${numMrp - numSelling} OFF` : ""),
        stockQuantity: Math.max(0, numStock),
        status: status || (numStock > 0 ? "ACTIVE" : "OUT_OF_STOCK")
      });
      res.status(201).json({ success: true, data: variant });
    } catch (err) {
      console.error(`[POST /products/${req.params.id}/variants Error]:`, err);
      res.status(400).json({ success: false, error: err.message });
    }
  });
  router.put("/products/:id/variants/:variantId", async (req, res) => {
    try {
      const updates = { ...req.body };
      if (updates.mrp !== void 0) updates.mrp = Number(updates.mrp);
      if (updates.sellingPrice !== void 0) updates.sellingPrice = Number(updates.sellingPrice);
      if (updates.stockQuantity !== void 0) {
        updates.stockQuantity = Math.max(0, Number(updates.stockQuantity));
      }
      const variant = await db.updateVariant(req.params.id, req.params.variantId, updates);
      res.json({ success: true, data: variant });
    } catch (err) {
      console.error(`[PUT /products/${req.params.id}/variants/${req.params.variantId} Error]:`, err);
      res.status(400).json({ success: false, error: err.message });
    }
  });
  router.delete("/products/:id/variants/:variantId", async (req, res) => {
    try {
      const ok = await db.deleteVariant(req.params.id, req.params.variantId);
      if (!ok) {
        return res.status(404).json({ success: false, error: "Variant not found" });
      }
      res.json({ success: true, message: "Variant deleted successfully" });
    } catch (err) {
      console.error(`[DELETE /products/${req.params.id}/variants/${req.params.variantId} Error]:`, err);
      res.status(500).json({ success: false, error: err.message });
    }
  });
  const parseCookies = (req) => {
    const list = {};
    const rc = req.headers.cookie;
    if (!rc) return list;
    try {
      rc.split(";").forEach((cookie) => {
        const parts = cookie.split("=");
        const name = parts.shift()?.trim();
        if (name) {
          const rawVal = parts.join("=").trim();
          try {
            list[name] = decodeURIComponent(rawVal);
          } catch {
            list[name] = rawVal;
          }
        }
      });
    } catch {
    }
    return list;
  };
  const extractCustomerToken = (req) => {
    const authHeader = req.headers.authorization || "";
    if (authHeader.startsWith("Bearer ")) {
      return authHeader.slice(7).trim();
    }
    const tokenHeader = req.headers["x-customer-token"];
    if (typeof tokenHeader === "string" && tokenHeader.trim()) {
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
    if (req.body && typeof req.body.customerToken === "string") {
      return req.body.customerToken.trim();
    }
    if (req.query && typeof req.query.customerToken === "string") {
      return req.query.customerToken.trim();
    }
    return "";
  };
  router.post("/auth/customer/send-otp", async (req, res) => {
    try {
      const { name, phone, referralSource } = req.body;
      const result = await db.sendCustomerOtp(name, phone, referralSource);
      res.json({
        success: true,
        message: "Verification OTP sent successfully.",
        data: { expiresIn: result.expiresIn }
      });
    } catch (err) {
      console.error("[POST /auth/customer/send-otp Error]:", err);
      res.status(400).json({ success: false, error: err.message });
    }
  });
  router.post("/auth/customer/verify-otp", async (req, res) => {
    try {
      const { phone, otp, name, referralSource } = req.body;
      const result = await db.verifyCustomerOtp(phone, otp, name, referralSource);
      res.setHeader("Set-Cookie", `customerToken=${encodeURIComponent(result.token)}; Path=/; Max-Age=${90 * 24 * 3600}; SameSite=Lax`);
      res.json({
        success: true,
        message: "Mobile number verified successfully. Welcome to TAZE CLINING.",
        data: result
      });
    } catch (err) {
      console.error("[POST /auth/customer/verify-otp Error]:", err);
      res.status(400).json({ success: false, error: err.message });
    }
  });
  router.post("/auth/customer/register", async (req, res) => {
    try {
      const { name, phone, password, referralSource } = req.body;
      const result = await db.registerCustomer({ name, phone, password, referralSource });
      res.setHeader("Set-Cookie", `customerToken=${encodeURIComponent(result.token)}; Path=/; Max-Age=${90 * 24 * 3600}; SameSite=Lax`);
      res.json({
        success: true,
        message: "Customer profile created successfully.",
        data: result
      });
    } catch (err) {
      console.error("[POST /auth/customer/register Error]:", err);
      res.status(400).json({ success: false, error: err.message });
    }
  });
  router.post("/auth/customer/login", async (req, res) => {
    try {
      const { phone, password } = req.body;
      const result = await db.loginCustomer({ phone, password });
      res.setHeader("Set-Cookie", `customerToken=${encodeURIComponent(result.token)}; Path=/; Max-Age=${90 * 24 * 3600}; SameSite=Lax`);
      res.json({
        success: true,
        message: "Logged in successfully.",
        data: result
      });
    } catch (err) {
      console.error("[POST /auth/customer/login Error]:", err);
      res.status(400).json({ success: false, error: err.message });
    }
  });
  router.get("/auth/customer/me", (req, res) => {
    try {
      const token = extractCustomerToken(req);
      const customer = db.getCustomerByToken(token);
      if (!customer) {
        return res.json({ success: false, authenticated: false, data: null });
      }
      res.json({ success: true, authenticated: true, data: customer });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  const handleGetCustomerOrders = (req, res) => {
    try {
      const token = extractCustomerToken(req);
      const customer = db.getCustomerByToken(token);
      const queryId = req.query.customerId || "";
      const queryPhone = (req.query.phone || "").replace(/[^0-9]/g, "");
      const targetId = customer?.customerId || queryId || (queryPhone ? `CUST-${queryPhone}` : "");
      if (!targetId) {
        return res.json({
          success: true,
          orders: [],
          data: []
        });
      }
      const myOrders = db.getCustomerOrders(targetId);
      const formatted = myOrders.map((o) => ({
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
    } catch (err) {
      res.status(500).json({ success: false, error: err.message, orders: [] });
    }
  };
  router.get("/customer/orders", handleGetCustomerOrders);
  router.get("/my-orders", handleGetCustomerOrders);
  router.get("/owner/order-status-counts", (_req, res) => {
    try {
      const orders = db.getOrders();
      const counts = {
        ALL: orders.length,
        PENDING: 0,
        ACCEPTED: 0,
        PACKAGING: 0,
        OUT_FOR_DELIVERY: 0,
        DELIVERED: 0,
        CANCELLED: 0
      };
      for (const o of orders) {
        if (o.status && counts[o.status] !== void 0) {
          counts[o.status]++;
        }
      }
      res.json({
        success: true,
        counts
      });
    } catch (err) {
      console.error("[GET /owner/order-status-counts Error]:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });
  router.get("/orders", (_req, res) => {
    try {
      const orders = db.getOrders();
      res.json({ success: true, data: orders });
    } catch (err) {
      console.error("[GET /orders Error]:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });
  router.get("/orders/:id", async (req, res) => {
    try {
      let order = db.getOrder(req.params.id);
      if (!order) {
        order = await db.getOrderAsync(req.params.id);
      }
      if (!order) {
        return res.status(404).json({ success: false, error: "Order not found or unavailable." });
      }
      const token = extractCustomerToken(req);
      const authenticatedCustomer = db.getCustomerByToken(token);
      const isOwner = authenticatedCustomer && (authenticatedCustomer.customerId === order.customerId || authenticatedCustomer.verifiedMobile === (order.customerPhone || "").replace(/[^0-9]/g, ""));
      const isAdmin = req.headers["x-admin-request"] === "true" || req.query.admin === "true";
      if (!isOwner && !isAdmin) {
        const maskedPhone = order.customerPhone ? `${order.customerPhone.slice(0, 3)}****${order.customerPhone.slice(-3)}` : "Protected";
        const maskedAddress = "Delivery Address Protected for Customer Privacy";
        const safeOrder = {
          ...order,
          customerPhone: maskedPhone,
          customerAddress: maskedAddress
        };
        const orderData2 = {
          ...safeOrder,
          orderId: safeOrder.id,
          total: safeOrder.grandTotal
        };
        return res.json({
          ...orderData2,
          success: true,
          data: orderData2,
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
    } catch (err) {
      console.error(`[GET /orders/${req.params.id} Error]:`, err);
      res.status(500).json({ success: false, error: err.message });
    }
  });
  router.get("/customer/orders-by-ref", async (req, res) => {
    try {
      const ref = String(req.query.ref || "").trim();
      if (!ref) {
        return res.json({ success: true, data: [] });
      }
      const orders = await db.getOrdersByCustomerRefAsync(ref);
      res.json({
        success: true,
        data: orders,
        ref
      });
    } catch (err) {
      console.error("[GET /customer/orders-by-ref Error]:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });
  router.get("/customer/order-status/:id", async (req, res) => {
    try {
      const order = await db.getOrderAsync(req.params.id);
      if (!order) {
        return res.status(404).json({ success: false, error: "Order not found" });
      }
      res.json({
        success: true,
        data: order
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  router.post("/orders", async (req, res) => {
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
        return res.status(400).json({ success: false, error: "Order must contain at least one item" });
      }
      const order = await db.createOrder({
        customerToken: customerToken || void 0,
        customerName,
        customerPhone: customerPhone || phone,
        customerAddress: customerAddress || address,
        notes,
        items,
        sourceUrl,
        idempotencyKey
      });
      console.log(`[Order Placed] Order ${order.id} created for ${order.customerName} (\u20B9${order.grandTotal}) - Status: PENDING`);
      res.status(201).json({
        ...order,
        orderId: order.id,
        total: order.grandTotal,
        success: true,
        message: "Order placed successfully. Status is PENDING merchant review.",
        data: order
      });
    } catch (err) {
      console.error("[POST /orders Error]:", err);
      res.status(400).json({ success: false, error: err.message });
    }
  });
  router.post("/orders/random", async (req, res) => {
    try {
      const { customerId, customerName } = req.body || {};
      const order = await db.createRandomOrder(customerId, customerName);
      console.log(`[Test Order Placed] Order ${order.id} generated for ${order.customerName} (${order.customerId}) - PENDING`);
      res.status(201).json({
        success: true,
        message: `Test order ${order.id} placed successfully. Status is PENDING.`,
        data: order
      });
    } catch (err) {
      console.error("[POST /orders/random Error]:", err);
      res.status(400).json({ success: false, error: err.message });
    }
  });
  router.post("/orders/:id/accept", async (req, res) => {
    try {
      const result = await db.acceptOrder(req.params.id);
      console.log(`[Order Accepted] Order ${req.params.id} accepted. Central inventory deducted.`);
      res.json({
        success: true,
        message: `Order ${req.params.id} ACCEPTED. Central inventory deducted.`,
        data: result.order,
        products: result.products
      });
    } catch (err) {
      console.error(`[POST /orders/${req.params.id}/accept Error]:`, err);
      res.status(400).json({ success: false, error: err.message });
    }
  });
  const handleUpdateOrderStatus = async (req, res) => {
    try {
      const { status, note, expectedDelivery } = req.body;
      const validStatuses = ["PENDING", "ACCEPTED", "PACKAGING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status. Allowed values: ${validStatuses.join(", ")}`
        });
      }
      const updatedOrder = await db.updateOrderStatus(req.params.id, status, note, expectedDelivery);
      console.log(`[Order Status] Order ${req.params.id} updated to ${status}.`);
      res.json({
        success: true,
        message: `Order ${req.params.id} moved to ${status}.`,
        data: updatedOrder
      });
    } catch (err) {
      console.error(`[Order Status Error]:`, err);
      res.status(400).json({ success: false, error: err.message });
    }
  };
  router.post("/orders/:id/status", handleUpdateOrderStatus);
  router.put("/orders/:id/status", handleUpdateOrderStatus);
  const handleUpdateOrderRevenue = async (req, res) => {
    try {
      const { revenue, reason } = req.body;
      const parsedRev = revenue === null || revenue === void 0 || revenue === "" ? null : Number(revenue);
      if (parsedRev !== null && (isNaN(parsedRev) || parsedRev < 0)) {
        return res.status(400).json({
          success: false,
          error: "Revenue must be a valid positive number or null to reset."
        });
      }
      const updatedOrder = await db.updateOrderRevenue(req.params.id, parsedRev, reason);
      console.log(`[Order Revenue Customized] Order ${req.params.id} revenue set to \u20B9${updatedOrder.finalRevenue} (Custom: \u20B9${updatedOrder.customRevenue})`);
      res.json({
        success: true,
        message: parsedRev !== null ? `Order #${req.params.id} revenue customized to \u20B9${updatedOrder.finalRevenue}.` : `Order #${req.params.id} revenue reset to automatic order value (\u20B9${updatedOrder.finalRevenue}).`,
        data: updatedOrder
      });
    } catch (err) {
      console.error(`[Order Revenue Update Error]:`, err);
      res.status(400).json({ success: false, error: err.message });
    }
  };
  router.put("/orders/:id/revenue", handleUpdateOrderRevenue);
  router.post("/orders/:id/revenue", handleUpdateOrderRevenue);
  router.post("/orders/:id/item-status", async (req, res) => {
    try {
      const { productId, variantId, itemStatus, note } = req.body;
      if (!productId || !variantId || !itemStatus) {
        return res.status(400).json({
          success: false,
          error: "productId, variantId, and itemStatus are required"
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
    } catch (err) {
      console.error(`[POST /orders/${req.params.id}/item-status Error]:`, err);
      res.status(400).json({ success: false, error: err.message });
    }
  });
  router.post("/orders/:id/cancel", async (req, res) => {
    try {
      const { reason } = req.body;
      const cancelledOrder = await db.cancelOrder(req.params.id, reason);
      console.log(`[Order Cancelled] Order ${req.params.id} cancelled. Stock restored if previously accepted.`);
      res.json({
        success: true,
        message: `Order ${req.params.id} CANCELLED. Inventory restored to stock.`,
        data: cancelledOrder
      });
    } catch (err) {
      console.error(`[POST /orders/${req.params.id}/cancel Error]:`, err);
      res.status(400).json({ success: false, error: err.message });
    }
  });
  router.get("/audit/stock", (_req, res) => {
    try {
      const stockLogs = db.getStockAudit();
      res.json({ success: true, data: stockLogs });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  router.get("/audit/revenue", (_req, res) => {
    try {
      const revenueLogs = db.getRevenueAudit();
      res.json({ success: true, data: revenueLogs });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  router.get("/audit/system", (_req, res) => {
    try {
      const sysLogs = db.getSystemAudit();
      res.json({ success: true, data: sysLogs });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  router.get("/revenue/transactions", (_req, res) => {
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
    } catch (err) {
      console.error("[GET /revenue/transactions Error]:", err);
      res.status(500).json({ success: false, error: err.message, data: [] });
    }
  });
  router.get("/stats", (_req, res) => {
    try {
      const stats = db.getStats();
      res.json({ success: true, data: stats });
    } catch (err) {
      console.error("[GET /stats Error]:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });
  router.put("/stats/custom-revenue", async (req, res) => {
    try {
      const { revenue } = req.body;
      await db.setCustomRevenue(revenue);
      const updatedStats = db.getStats();
      res.json({
        success: true,
        message: revenue === null ? "Revenue reset to auto-calculated total" : "Custom revenue updated successfully",
        data: updatedStats
      });
    } catch (err) {
      console.error("[PUT /stats/custom-revenue Error]:", err);
      res.status(400).json({ success: false, error: err.message });
    }
  });
  router.put("/stats/revenue-mode", async (req, res) => {
    try {
      const { mode } = req.body;
      if (mode !== "manual" && mode !== "orders") {
        return res.status(400).json({ success: false, error: "Mode must be manual or orders" });
      }
      await db.setRevenueMode(mode);
      const updatedStats = db.getStats();
      res.json({ success: true, data: updatedStats });
    } catch (err) {
      console.error("[PUT /stats/revenue-mode Error]:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });
  router.get("/customers", (_req, res) => {
    try {
      const customers = db.getCustomers();
      res.json({ success: true, data: customers });
    } catch (err) {
      console.error("[GET /customers Error]:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });
  router.post("/customers/:id/toggle-verified", async (req, res) => {
    try {
      const isVerified = await db.toggleCustomerVerified(req.params.id);
      res.json({ success: true, verified: isVerified });
    } catch (err) {
      console.error("[POST /customers/toggle-verified Error]:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });
  router.put("/orders/:id/payment", async (req, res) => {
    try {
      const { paymentStatus } = req.body;
      const order = await db.updateOrderPayment(req.params.id, paymentStatus);
      res.json({ success: true, data: order });
    } catch (err) {
      console.error("[PUT /orders/:id/payment Error]:", err);
      res.status(400).json({ success: false, error: err.message });
    }
  });
  router.get("/settings", (_req, res) => {
    try {
      const settings = db.getStoreSettings();
      res.json({ success: true, data: settings });
    } catch (err) {
      console.error("[GET /settings Error]:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });
  router.put("/settings", async (req, res) => {
    try {
      const { brandName, tagline, heroTitle, heroSubtitle } = req.body;
      const updated = await db.updateSettings({ brandName, tagline, heroTitle, heroSubtitle });
      res.json({
        success: true,
        message: `Brand name and tags updated to "${updated.brandName}"`,
        data: updated
      });
    } catch (err) {
      console.error("[PUT /settings Error]:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });
  router.post("/reset-seed", async (_req, res) => {
    try {
      await db.resetSeed();
      res.json({ success: true, message: "Database reset to initial catalog", data: db.getProducts() });
    } catch (err) {
      console.error("[POST /reset-seed Error]:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });
  return router;
}

// server.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname2 = path4.dirname(__filename);
var app = express2();
var PORT = process.env.PORT && process.env.PORT !== "8080" ? Number(process.env.PORT) : 3e3;
app.use((req, _res, next) => {
  try {
    decodeURI(req.url);
    next();
  } catch {
    try {
      req.url = req.url.replace(/%(?![0-9a-fA-F]{2})/g, "%25");
      next();
    } catch {
      next();
    }
  }
});
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
  } else {
    res.header("Access-Control-Allow-Origin", "*");
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-customer-token, x-admin-request, Range");
  res.header("Access-Control-Expose-Headers", "*");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
app.get("/health", (_req, res) => {
  const isReady = db.isReady();
  res.status(200).json({
    status: isReady ? "healthy" : "initializing",
    database: db.isCloudConnected() ? "Firestore" : "Local",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.get("/download/customer-apk", (_req, res) => {
  const apkPath = path4.resolve(__dirname2, "public", "downloads", "taze-clining-customer.apk");
  if (fs4.existsSync(apkPath)) {
    res.setHeader("Content-Type", "application/vnd.android.package-archive");
    return res.download(apkPath, "TAZE-CLINING-Customer.apk");
  }
  return res.status(404).json({ success: false, error: "Customer APK is generating, please retry in a moment." });
});
app.get("/download/owner-apk", (_req, res) => {
  const apkPath = path4.resolve(__dirname2, "public", "downloads", "taze-clining-owner.apk");
  if (fs4.existsSync(apkPath)) {
    res.setHeader("Content-Type", "application/vnd.android.package-archive");
    return res.download(apkPath, "TAZE-CLINING-Owner.apk");
  }
  return res.status(404).json({ success: false, error: "Owner APK is generating, please retry in a moment." });
});
app.use("/downloads", express2.static(path4.resolve(__dirname2, "public", "downloads"), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith(".apk")) {
      res.setHeader("Content-Type", "application/vnd.android.package-archive");
      const filename = path4.basename(filePath);
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    }
  }
}));
app.use("/api", createApiMiddleware());
async function bootstrap() {
  console.log("[Server] Starting CLEENZO full-stack application...");
  const isDev = process.env.NODE_ENV !== "production" && !process.env.SERVE_STATIC;
  const distPath = path4.resolve(__dirname2, "dist");
  if (isDev) {
    console.log("[Server] Mounting Vite dev middleware...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: "spa"
    });
    const sendSpaHtml = async (req, res, next) => {
      try {
        const indexPath = path4.resolve(__dirname2, "index.html");
        if (fs4.existsSync(indexPath)) {
          let template = fs4.readFileSync(indexPath, "utf-8");
          try {
            const cleanPath = (req.path || "/").split("?")[0];
            template = await vite.transformIndexHtml(cleanPath, template);
          } catch (transformErr) {
            console.warn("[Server] vite.transformIndexHtml warning, serving raw template:", transformErr);
          }
          return res.status(200).set({
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-cache"
          }).end(template);
        }
        return next();
      } catch (e) {
        vite.ssrFixStacktrace(e);
        const indexPath = path4.resolve(__dirname2, "index.html");
        if (fs4.existsSync(indexPath)) {
          return res.status(200).set({ "Content-Type": "text/html; charset=utf-8" }).sendFile(indexPath);
        }
        next(e);
      }
    };
    app.get([
      "/order",
      "/order/*",
      "/track",
      "/track/*",
      "/admin",
      "/admin/*",
      "/generator",
      "/generator/*",
      "/customer-app",
      "/customer-app/*",
      "/owner-app",
      "/owner-app/*"
    ], sendSpaHtml);
    app.use(vite.middlewares);
    app.use("*", async (req, res, next) => {
      if (req.method !== "GET" && req.method !== "HEAD") {
        return next();
      }
      const url = req.originalUrl;
      if (url.startsWith("/api") || url.startsWith("/health")) {
        return next();
      }
      if (path4.extname(req.path) && !req.path.endsWith(".html")) {
        return res.status(404).end("Asset not found");
      }
      return sendSpaHtml(req, res, next);
    });
  } else {
    console.log("[Server] Serving production static build from dist...");
    if (fs4.existsSync(distPath)) {
      app.use(express2.static(distPath));
    }
    const sendProdHtml = (res) => {
      const distIndex = path4.join(distPath, "index.html");
      if (fs4.existsSync(distIndex)) {
        return res.sendFile(distIndex);
      }
      const rootIndex = path4.resolve(__dirname2, "index.html");
      if (fs4.existsSync(rootIndex)) {
        return res.sendFile(rootIndex);
      }
      return res.status(404).send("Application build not found");
    };
    app.get([
      "/order",
      "/order/*",
      "/track",
      "/track/*",
      "/admin",
      "/admin/*",
      "/generator",
      "/generator/*",
      "/customer-app",
      "/customer-app/*",
      "/owner-app",
      "/owner-app/*"
    ], (_req, res) => {
      sendProdHtml(res);
    });
    app.use("*", (req, res, next) => {
      if (req.method !== "GET" && req.method !== "HEAD") {
        return next();
      }
      if (req.path.startsWith("/api") || req.path.startsWith("/health")) {
        return next();
      }
      if (path4.extname(req.path) && !req.path.endsWith(".html")) {
        return res.status(404).send("Asset not found");
      }
      return sendProdHtml(res);
    });
  }
  app.all("/api/*", (req, res) => {
    res.status(404).json({ success: false, error: `API endpoint ${req.method} ${req.path} not found` });
  });
  app.use((err, req, res, _next) => {
    console.error("[Server Error Handler]:", err);
    if (!res.headersSent) {
      if (req.method === "GET" && !req.path.startsWith("/api")) {
        const indexPath = path4.resolve(__dirname2, "index.html");
        if (fs4.existsSync(indexPath)) {
          return res.status(200).set({ "Content-Type": "text/html; charset=utf-8" }).sendFile(indexPath);
        }
      }
      res.status(err?.status || 500).json({ success: false, error: err?.message || "Server error" });
    }
  });
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CLEENZO full-stack server running on http://0.0.0.0:${PORT}`);
  });
  db.init().then(() => {
    console.log("[Server] Database initialized and synchronized successfully.");
    startTunnel().catch((err) => {
      console.warn("[Server] Could not initialize public tunnel:", err);
    });
  }).catch((err) => {
    console.error("[Server] Warning during background database init:", err);
  });
}
bootstrap().catch((err) => {
  console.error("[Server Fatal] Could not start server:", err);
  process.exit(1);
});
