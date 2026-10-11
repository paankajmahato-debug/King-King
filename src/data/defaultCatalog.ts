import type { Product } from '../types/index';

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
    <ellipse cx="200" cy="358" rx="85" ry="12" fill="#cbd5e1" opacity="0.45"/>
    <ellipse cx="200" cy="358" rx="55" ry="7" fill="#94a3b8" opacity="0.3"/>
    
    <g filter="url(#shadow)">
      <path d="M178,75 L222,75 L224,120 C224,135 255,145 260,175 L264,320 C264,338 250,345 230,345 L170,345 C150,345 136,338 136,320 L140,175 C145,145 176,135 176,120 Z" fill="url(#bottleGrad)" stroke="#cbd5e1" stroke-width="2"/>
      <path d="M138,205 C150,203 170,207 200,204 C230,201 250,206 262,205 L264,320 C264,338 250,345 230,345 L170,345 C150,345 136,338 136,320 Z" fill="url(#liquidGrad)"/>
      <path d="M138,205 C150,203 170,207 200,204 C230,201 250,206 262,205" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.6"/>
      
      <rect x="152" y="215" width="96" height="92" rx="6" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
      <rect x="152" y="215" width="96" height="8" rx="3" fill="${accentColor}"/>
      
      <text x="200" y="238" font-family="system-ui, sans-serif" font-size="10" font-weight="800" text-anchor="middle" fill="#0f172a" letter-spacing="1">TAZE CLINING</text>
      <text x="200" y="252" font-family="system-ui, sans-serif" font-size="7.5" font-weight="700" text-anchor="middle" fill="${accentColor}" letter-spacing="0.5">PRO FORMULA</text>
      
      <line x1="165" y1="258" x2="235" y2="258" stroke="#e2e8f0" stroke-width="1"/>
      <text x="200" y="271" font-family="system-ui, sans-serif" font-size="7" font-weight="600" text-anchor="middle" fill="#334155">${name}</text>
      <text x="200" y="283" font-family="system-ui, sans-serif" font-size="6" font-weight="500" text-anchor="middle" fill="#64748b">99.9% GERMS KILL</text>
      
      <circle cx="200" cy="296" r="6" fill="${accentColor}" opacity="0.15"/>
      <circle cx="200" cy="296" r="4" fill="${accentColor}"/>
      
      <path d="M148,185 L144,325 C144,333 147,338 152,340 L152,185 Z" fill="#ffffff" opacity="0.45"/>
      <path d="M156,185 L154,320 L157,320 L159,185 Z" fill="#ffffff" opacity="0.25"/>

      <rect x="174" y="48" width="52" height="28" rx="4" fill="${capColor}" stroke="#334155" stroke-width="1"/>
      <line x1="184" y1="52" x2="184" y2="72" stroke="#ffffff" stroke-width="1.5" opacity="0.4"/>
      <line x1="192" y1="52" x2="192" y2="72" stroke="#ffffff" stroke-width="1.5" opacity="0.4"/>
      <line x1="200" y1="52" x2="200" y2="72" stroke="#ffffff" stroke-width="1.5" opacity="0.4"/>
      <line x1="208" y1="52" x2="208" y2="72" stroke="#ffffff" stroke-width="1.5" opacity="0.4"/>
      <line x1="216" y1="52" x2="216" y2="72" stroke="#ffffff" stroke-width="1.5" opacity="0.4"/>
    </g>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const DEFAULT_CATALOG_PRODUCTS: Product[] = [
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
    tagline: 'Streak-free crystal clarity with anti-dust shield',
    category: 'Glass Care',
    description: 'Specialized optical-clarity glass cleaner that cuts through oily fingerprints, road grime, water spots, and dust without smearing.',
    features: [
      'Diamond clear streak-free finish',
      'Anti-fog & anti-static dust shield',
      'Safe for tinted car glasses and monitors',
      'Fast evaporating formula'
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
        sellingPrice: 89,
        offer: '₹21 OFF (19% OFF)',
        stockQuantity: 28,
        soldQuantity: 0,
        status: 'ACTIVE'
      },
      {
        variantId: 'var-gs-5000',
        size: '5 Litre Commercial',
        mrp: 750,
        sellingPrice: 620,
        offer: '₹130 OFF (17% OFF)',
        stockQuantity: 12,
        soldQuantity: 0,
        status: 'ACTIVE'
      }
    ]
  },
  {
    id: 'prod-toilet-cleaner',
    name: 'TAZE CLINING Power Toilet Bowl Cleaner',
    tagline: '10x tough stain and limescale removal',
    category: 'Toilet Care',
    description: 'Thick blue concentrated formula that clings to ceramic surfaces, breaking down yellow scale, hard water marks, and rust stains while eliminating 99.9% of germs.',
    features: [
      'Deep cling action under the rim',
      'Eliminates mineral scales & rust',
      'Destroys 99.9% germs & odor-causing bacteria',
      'Angled reach nozzle design'
    ],
    image: createBottleSvg('Toilet Cleaner', '#3b82f6', '#2563eb', '#1d4ed8'),
    status: 'LIVE',
    createdAt: '2026-09-30T10:15:00.000Z',
    updatedAt: '2026-09-30T10:15:00.000Z',
    variants: [
      {
        variantId: 'var-tc-250',
        size: '250 ML',
        mrp: 55,
        sellingPrice: 45,
        offer: '₹10 OFF (18% OFF)',
        stockQuantity: 30,
        soldQuantity: 0,
        status: 'ACTIVE'
      },
      {
        variantId: 'var-tc-500',
        size: '500 ML',
        mrp: 95,
        sellingPrice: 79,
        offer: '₹16 OFF (17% OFF)',
        stockQuantity: 22,
        soldQuantity: 3,
        status: 'ACTIVE'
      },
      {
        variantId: 'var-tc-1000',
        size: '1 Litre',
        mrp: 170,
        sellingPrice: 139,
        offer: '₹31 OFF (18% OFF)',
        stockQuantity: 15,
        soldQuantity: 0,
        status: 'ACTIVE'
      },
      {
        variantId: 'var-tc-5000',
        size: '5 Litre',
        mrp: 650,
        sellingPrice: 540,
        offer: '₹110 OFF (17% OFF)',
        stockQuantity: 8,
        soldQuantity: 0,
        status: 'ACTIVE'
      }
    ]
  },
  {
    id: 'prod-dishwash-gel',
    name: 'TAZE CLINING Active Lemon Dishwash Gel',
    tagline: 'Instant grease cut with pure lime power',
    category: 'Kitchen Care',
    description: 'Concentrated grease-dissolving dishwashing liquid infused with real lemon extracts. Cleans tough burnt oil from cookware while gentle on hands.',
    features: [
      'Ultra concentrated 1-spoon formula',
      'Cuts burnt oil and curry grease',
      'Gentle on skin with pH neutral formula',
      'Leaves zero powdery white residue'
    ],
    image: createBottleSvg('Dishwash Gel', '#84cc16', '#65a30d', '#4d7c0f'),
    status: 'LIVE',
    createdAt: '2026-09-30T10:20:00.000Z',
    updatedAt: '2026-09-30T10:20:00.000Z',
    variants: [
      {
        variantId: 'var-dw-250',
        size: '250 ML',
        mrp: 50,
        sellingPrice: 42,
        offer: '₹8 OFF (16% OFF)',
        stockQuantity: 25,
        soldQuantity: 0,
        status: 'ACTIVE'
      },
      {
        variantId: 'var-dw-500',
        size: '500 ML Squeeze',
        mrp: 90,
        sellingPrice: 75,
        offer: '₹15 OFF (17% OFF)',
        stockQuantity: 40,
        soldQuantity: 0,
        status: 'ACTIVE'
      },
      {
        variantId: 'var-dw-5000',
        size: '5 Litre Can',
        mrp: 680,
        sellingPrice: 550,
        offer: '₹130 OFF (19% OFF)',
        stockQuantity: 14,
        soldQuantity: 0,
        status: 'ACTIVE'
      }
    ]
  },
  {
    id: 'prod-kitchen-degreaser',
    name: 'TAZE CLINING Heavy-Duty Kitchen Degreaser',
    tagline: 'Dissolves chimney grease, exhaust oil & stove carbon',
    category: 'Kitchen Care',
    description: 'Industrial-strength alkaline degreaser specially formulated to liquefy burnt-on grime, exhaust fan grease, kitchen tiles oil film, and barbecue grills.',
    features: [
      'Instant carbon & grease emulsifier',
      'No abrasive scraping needed',
      'Safe for stainless steel, glass and tiles',
      'Commercial strength kitchen formula'
    ],
    image: createBottleSvg('Kitchen Degreaser', '#ef4444', '#dc2626', '#b91c1c'),
    status: 'LIVE',
    createdAt: '2026-09-30T10:25:00.000Z',
    updatedAt: '2026-09-30T10:25:00.000Z',
    variants: [
      {
        variantId: 'var-kd-500',
        size: '500 ML Heavy Trigger',
        mrp: 160,
        sellingPrice: 135,
        offer: '₹25 OFF (16% OFF)',
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
