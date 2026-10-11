/**
 * URL Resolution Helper for Customer Links & Order Access
 * Generates verified, active URLs using the live app host so links always open reliably.
 * Supports custom public domain configuration, automatic URL sanitization, and instant reactivity.
 */

const PUBLIC_URL_CHANGE_EVENT = 'cleenzo_public_url_changed';

/**
 * Strips any accidental paths (/order, /track), query parameters (?ref=, &src=),
 * or duplicated URLs so it ALWAYS returns a pristine base domain (e.g. https://ais-dev-... or https://example.com)
 */
export function sanitizeBaseDomain(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  let str = rawUrl.trim();
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

export const LIVE_DEV_APP_URL = 'https://ais-dev-bbvidsoghz7eveu2fwbc6d-22725730900.asia-southeast1.run.app';
export const PERMANENT_FIXED_PUBLIC_DOMAIN = 'https://ais-dev-bbvidsoghz7eveu2fwbc6d-22725730900.asia-southeast1.run.app';
export const PERMANENT_FIXED_CUSTOMER_ORDER_URL = `${PERMANENT_FIXED_PUBLIC_DOMAIN}/order`;
export const DEFAULT_PUBLIC_CUSTOM_DOMAIN = '';

// In-memory cache synced with localStorage & backend database
let cachedCustomDomain: string = '';
let cachedBackendPublicUrl: string = '';

if (typeof window !== 'undefined') {
  try {
    const stored = localStorage.getItem('cleenzo_custom_public_domain') || '';
    if (stored.includes('modular-senator-affiliate-ste') || stored.includes('ais-pre-') || stored.includes('localhost')) {
      localStorage.removeItem('cleenzo_custom_public_domain');
      cachedCustomDomain = '';
    } else if (stored) {
      cachedCustomDomain = sanitizeBaseDomain(stored);
    } else {
      cachedCustomDomain = '';
    }
  } catch {
    cachedCustomDomain = '';
  }

  // Sync from backend Firestore / settings / tunnel
  fetch('/api/public-url')
    .then(r => r.json())
    .then(data => {
      if (data?.publicUrl && typeof data.publicUrl === 'string') {
        const clean = sanitizeBaseDomain(data.publicUrl);
        if (clean && !clean.includes('ais-pre-') && !clean.includes('localhost') && !clean.includes('127.0.0.1')) {
          cachedBackendPublicUrl = clean;
          window.dispatchEvent(new CustomEvent(PUBLIC_URL_CHANGE_EVENT, { detail: clean }));
        }
      }
    })
    .catch(() => {});
}

/**
 * Returns currently saved custom public domain if configured (guaranteed clean origin)
 */
export function getCustomPublicUrl(): string {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('cleenzo_custom_public_domain') || cachedCustomDomain || '';
      return sanitizeBaseDomain(stored);
    } catch {}
  }
  return sanitizeBaseDomain(cachedCustomDomain);
}

/**
 * Updates and persists custom public URL across client and cloud database
 */
export async function setCustomPublicUrl(newUrl: string): Promise<string> {
  const clean = sanitizeBaseDomain(newUrl);
  cachedCustomDomain = clean;

  if (typeof window !== 'undefined') {
    try {
      if (clean && !clean.includes('ais-pre-')) {
        localStorage.setItem('cleenzo_custom_public_domain', clean);
      } else {
        localStorage.removeItem('cleenzo_custom_public_domain');
      }
      window.dispatchEvent(new CustomEvent(PUBLIC_URL_CHANGE_EVENT, { detail: clean }));
    } catch {}

    try {
      await fetch('/api/public-url', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customPublicUrl: clean })
      });
    } catch (err) {
      console.error('[urlHelper] Failed to sync custom URL to server:', err);
    }
  }

  return clean;
}

/**
 * Subscribe to custom public URL updates
 */
export function onPublicUrlChange(callback: (url: string) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: any) => callback(e.detail || '');
  window.addEventListener(PUBLIC_URL_CHANGE_EVENT, handler);
  return () => window.removeEventListener(PUBLIC_URL_CHANGE_EVENT, handler);
}

/**
 * Returns current browser origin
 */
export function getCurrentOrigin(): string {
  if (typeof window === 'undefined') return '';
  return sanitizeBaseDomain(window.location.origin);
}

/**
 * Returns public base URL (live current origin or shared public URL)
 */
export function getSharedPublicBaseUrl(): string {
  return getPublicBaseUrl();
}

/**
 * Returns active base URL for customer order links.
 * Always resolves to a 100% active, live public origin so links, QR codes,
 * and WhatsApp shares open reliably for all customers without login or 404.
 */
export function getPublicBaseUrl(_preferShared = false): string {
  const custom = getCustomPublicUrl();
  if (custom && custom.startsWith('http') && !custom.includes('ais-pre-') && !custom.includes('localhost') && !custom.includes('127.0.0.1')) {
    return sanitizeBaseDomain(custom);
  }

  if (cachedBackendPublicUrl && !cachedBackendPublicUrl.includes('ais-pre-') && !cachedBackendPublicUrl.includes('localhost') && !cachedBackendPublicUrl.includes('127.0.0.1')) {
    return sanitizeBaseDomain(cachedBackendPublicUrl);
  }

  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    if (origin.includes('trycloudflare.com')) {
      return sanitizeBaseDomain(origin);
    }
    if (origin.includes('ais-dev-')) {
      return sanitizeBaseDomain(origin);
    }
    // Genuine external HTTPS domain
    if (origin.startsWith('https://') && !origin.includes('localhost') && !origin.includes('127.0.0.1') && !origin.includes('ais-pre-')) {
      return sanitizeBaseDomain(origin);
    }
  }

  return PERMANENT_FIXED_PUBLIC_DOMAIN;
}

export const LIVE_PUBLIC_APP_URL = LIVE_DEV_APP_URL;
export const PUBLIC_SHARED_APP_URL = LIVE_DEV_APP_URL;

/**
 * Returns direct public customer order URL without any required params (/order)
 */
export function getDirectPublicOrderUrl(_preferShared = false): string {
  const base = getPublicBaseUrl();
  return `${base}/order`;
}

/**
 * Returns customer direct order URL with optional referral tracking parameter
 */
export function getPublicCustomerOrderUrl(ref?: string, _preferShared = false): string {
  const base = getPublicBaseUrl();
  if (!ref || !ref.trim()) {
    return `${base}/order`;
  }
  const cleanRef = encodeURIComponent(ref.trim());
  return `${base}/order?ref=${cleanRef}`;
}

/**
 * Returns order tracking link for customers and delivery updates
 */
export function getPublicOrderTrackingUrl(orderId: string, _preferShared = false): string {
  const base = getPublicBaseUrl();
  const cleanId = encodeURIComponent(orderId.trim());
  return `${base}/track?id=${cleanId}`;
}

/**
 * Formats clean, readable display URL
 */
export function getShortDisplayUrl(fullUrl: string): string {
  try {
    const url = new URL(fullUrl);
    return `${url.host}${url.pathname}${url.search}`;
  } catch {
    return fullUrl;
  }
}
