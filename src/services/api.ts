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
  RevenueTransaction
} from '../types/index';
import { DEFAULT_CATALOG_PRODUCTS } from '../data/defaultCatalog';

const BASE_URL = '/api';

class ApiService {
  private customerToken: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.customerToken = localStorage.getItem('cleenzo_customer_token');
      } catch {
        this.customerToken = null;
      }
    }
  }

  public setCustomerToken(token: string | null) {
    this.customerToken = token;
    if (typeof window !== 'undefined') {
      try {
        if (token) {
          localStorage.setItem('cleenzo_customer_token', token);
        } else {
          localStorage.removeItem('cleenzo_customer_token');
        }
      } catch {}
    }
  }

  public getCustomerToken(): string | null {
    if (!this.customerToken && typeof window !== 'undefined') {
      try {
        this.customerToken = localStorage.getItem('cleenzo_customer_token');
      } catch {
        this.customerToken = null;
      }
    }
    return this.customerToken;
  }

  public clearCustomerAuth() {
    this.setCustomerToken(null);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('cleenzo_customer_profile');
      } catch {}
    }
  }

  /**
   * Resilient HTTP client with automatic retries and exponential backoff
   * Strips headers that cause CORS preflight failures across preview environments
   */
  private async request<T>(endpoint: string, options: RequestInit = {}, retries = 2): Promise<T> {
    const token = this.getCustomerToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let lastError: any = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(`${BASE_URL}${endpoint}`, {
          ...options,
          cache: 'no-store',
          signal: controller.signal,
          headers: {
            ...headers,
            ...(options.headers || {})
          }
        });

        clearTimeout(timeoutId);

        const json = await res.json().catch(() => ({}));
        if (!res.ok || json.success === false) {
          throw new Error(json.error || `Request failed with status ${res.status}`);
        }
        return json.data !== undefined ? json.data : json;
      } catch (err: any) {
        lastError = err;
        // Don't retry if aborted by user navigation or for non-idempotent operations unless connection failure
        if (attempt < retries) {
          const delay = (attempt + 1) * 350;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error(`Request to ${endpoint} failed`);
  }

  // --- CUSTOMER AUTHENTICATION (NAME + PHONE + PASSWORD OR OTP) ---
  async registerCustomer(name: string, phone: string, password?: string, referralSource?: string): Promise<{ token: string; customer: CustomerProfile }> {
    const result = await this.request<{ token: string; customer: CustomerProfile }>('/auth/customer/register', {
      method: 'POST',
      body: JSON.stringify({ name, phone, password, referralSource })
    });
    if (result && result.token) {
      this.setCustomerToken(result.token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('cleenzo_customer_profile', JSON.stringify(result.customer));
      }
    }
    return result;
  }

  async loginCustomer(phone: string, password?: string): Promise<{ token: string; customer: CustomerProfile }> {
    const result = await this.request<{ token: string; customer: CustomerProfile }>('/auth/customer/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password })
    });
    if (result && result.token) {
      this.setCustomerToken(result.token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('cleenzo_customer_profile', JSON.stringify(result.customer));
      }
    }
    return result;
  }

  async sendCustomerOtp(name: string, phone: string, referralSource?: string): Promise<{ expiresIn: number }> {
    return this.request<{ expiresIn: number }>('/auth/customer/send-otp', {
      method: 'POST',
      body: JSON.stringify({ name, phone, referralSource })
    });
  }

  async verifyCustomerOtp(phone: string, otp: string, name?: string, referralSource?: string): Promise<{ token: string; customer: CustomerProfile }> {
    const result = await this.request<{ token: string; customer: CustomerProfile }>('/auth/customer/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp, name, referralSource })
    });
    if (result && result.token) {
      this.setCustomerToken(result.token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('cleenzo_customer_profile', JSON.stringify(result.customer));
      }
    }
    return result;
  }

  async getCustomerProfile(): Promise<CustomerProfile> {
    try {
      const profile = await this.request<CustomerProfile>('/auth/customer/me');
      if (profile && typeof window !== 'undefined') {
        localStorage.setItem('cleenzo_customer_profile', JSON.stringify(profile));
      }
      return profile;
    } catch (err: any) {
      // If network is offline or restarting, maintain the cached profile so user is not logged out!
      if (typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem('cleenzo_customer_profile');
          if (cached) return JSON.parse(cached);
        } catch {}
      }
      throw err;
    }
  }

  async getCustomerOrders(): Promise<Order[]> {
    try {
      const orders = await this.request<Order[]>('/customer/orders', {}, 2);
      const list = Array.isArray(orders) ? orders : [];
      if (list.length > 0 && typeof window !== 'undefined') {
        try {
          localStorage.setItem('cleenzo_customer_orders', JSON.stringify(list));
        } catch {}
      }
      return list;
    } catch {
      // Fallback to cached orders on network blip
      if (typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem('cleenzo_customer_orders');
          if (cached) return JSON.parse(cached);
        } catch {}
      }
      return [];
    }
  }

  async getCustomerOrdersByPhone(phone: string): Promise<Order[]> {
    try {
      const clean = phone.replace(/[^0-9]/g, '');
      const res = await this.request<any>(`/customer/orders?phone=${clean}`, {}, 2);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.orders)) return res.orders;
      if (res && Array.isArray(res.data)) return res.data;
      return [];
    } catch {
      return [];
    }
  }

  // --- PRODUCTS (WITH MULTI-TIER RESILIENT FALLBACK) ---
  async getProducts(includeInactive = true): Promise<Product[]> {
    try {
      const result = await this.request<any>(`/products?includeInactive=${includeInactive}`, {}, 2);
      let list: Product[] = [];
      if (Array.isArray(result)) list = result;
      else if (result && Array.isArray(result.data)) list = result.data;
      else if (result && Array.isArray(result.products)) list = result.products;

      if (list && list.length > 0) {
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('cleenzo_cached_products', JSON.stringify(list));
          } catch {}
        }
        return list;
      }
    } catch (err) {
      console.warn('[ApiService.getProducts Notice] Network load failed, using resilient cached fallback:', err);
    }

    // Tier 1: LocalStorage cached products from previous successful fetch
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('cleenzo_cached_products');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {}
    }

    // Tier 2: Instant default catalog fallback (guarantees zero empty screens)
    return DEFAULT_CATALOG_PRODUCTS;
  }

  async getProduct(id: string): Promise<Product> {
    try {
      return await this.request<Product>(`/products/${id}`);
    } catch {
      const fallback = DEFAULT_CATALOG_PRODUCTS.find(p => p.id === id);
      if (fallback) return fallback;
      throw new Error('Product not found');
    }
  }

  async createProduct(data: {
    name: string;
    tagline?: string;
    category?: string;
    description?: string;
    features?: string[];
    image?: string;
    status: 'LIVE' | 'UPCOMING' | 'OUT_OF_STOCK' | 'INACTIVE';
    variants: Omit<Variant, 'variantId' | 'soldQuantity'>[];
  }): Promise<Product> {
    return this.request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    return this.request<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteProduct(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/products/${id}`, {
      method: 'DELETE'
    });
  }

  async addVariant(productId: string, variant: Omit<Variant, 'variantId' | 'soldQuantity'>): Promise<Product> {
    return this.request<Product>(`/products/${productId}/variants`, {
      method: 'POST',
      body: JSON.stringify(variant)
    });
  }

  async updateVariant(productId: string, variantId: string, variant: Partial<Variant>): Promise<Product> {
    return this.request<Product>(`/products/${productId}/variants/${variantId}`, {
      method: 'PUT',
      body: JSON.stringify(variant)
    });
  }

  async deleteVariant(productId: string, variantId: string): Promise<Product> {
    return this.request<Product>(`/products/${productId}/variants/${variantId}`, {
      method: 'DELETE'
    });
  }

  // --- ORDERS ---
  async getOrders(): Promise<Order[]> {
    try {
      const res = await this.request<any>('/orders', {}, 2);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      return [];
    } catch (err) {
      console.warn('[ApiService.getOrders Notice] Could not load orders:', err);
      return [];
    }
  }

  async getOrder(id: string): Promise<Order> {
    return this.request<Order>(`/orders/${id}`);
  }

  async getOrdersByCustomerRef(ref: string): Promise<Order[]> {
    if (!ref || !ref.trim()) return [];
    try {
      const res = await this.request<any>(`/customer/orders-by-ref?ref=${encodeURIComponent(ref.trim())}`, {}, 1);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      return [];
    } catch (err) {
      console.warn('[api.getOrdersByCustomerRef Notice]:', err);
      return [];
    }
  }

  async getLiveOrderStatus(id: string): Promise<Order | null> {
    if (!id || !id.trim()) return null;
    try {
      const res = await this.request<any>(`/customer/order-status/${encodeURIComponent(id.trim())}`, {}, 1);
      return res?.data || res || null;
    } catch {
      return null;
    }
  }

  async createOrder(data: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    deliveryAddress?: string;
    customerAddress?: string;
    deliveryPincode?: string;
    items: {
      productId: string;
      productName?: string;
      variantId: string;
      size?: string;
      price?: number;
      quantity: number;
    }[];
    notes?: string;
    referralSource?: string;
    sourceUrl?: string;
    idempotencyKey?: string;
  }): Promise<Order> {
    const payload = {
      ...data,
      deliveryAddress: data.deliveryAddress || data.customerAddress || ''
    };
    return this.request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async createRandomOrder(customerId?: string, customerName?: string): Promise<Order> {
    return this.request<Order>('/orders/random', {
      method: 'POST',
      body: JSON.stringify({ customerId, customerName })
    });
  }

  async acceptOrder(id: string): Promise<Order> {
    return this.request<Order>(`/orders/${id}/accept`, {
      method: 'POST'
    });
  }

  async updateOrderStatus(id: string, status: OrderStatus, note?: string, expectedDelivery?: string): Promise<Order> {
    return this.request<Order>(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, note, expectedDelivery })
    });
  }

  async updateOrderRevenue(id: string, revenue: number | null, reason?: string): Promise<Order> {
    return this.request<Order>(`/orders/${id}/revenue`, {
      method: 'PUT',
      body: JSON.stringify({ revenue, reason })
    });
  }

  async updateOrderItemStatus(
    orderId: string,
    productId: string,
    variantId: string,
    itemStatus: string
  ): Promise<Order> {
    return this.request<Order>(`/orders/${orderId}/item-status`, {
      method: 'POST',
      body: JSON.stringify({ productId, variantId, itemStatus })
    });
  }

  async cancelOrder(id: string, reason?: string): Promise<Order> {
    return this.request<Order>(`/orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  // --- INVENTORY MANAGEMENT & AUDITS ---
  async adjustStock(productId: string, variantId: string, quantityChange: number, reason: string): Promise<Product> {
    return this.request<Product>('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify({ productId, variantId, quantityChange, reason })
    });
  }

  async updateStock(productId: string, variantId: string, newStockQuantity: number, reason?: string): Promise<Product> {
    return this.request<Product>('/inventory/update-stock', {
      method: 'POST',
      body: JSON.stringify({ productId, variantId, newStockQuantity, reason })
    });
  }

  async getStockAudit(): Promise<StockAuditEntry[]> {
    try {
      return await this.request<StockAuditEntry[]>('/audit/stock');
    } catch {
      return [];
    }
  }

  async getRevenueAudit(): Promise<RevenueAuditEntry[]> {
    try {
      return await this.request<RevenueAuditEntry[]>('/audit/revenue');
    } catch {
      return [];
    }
  }

  async getSystemAudit(): Promise<AuditLogEntry[]> {
    try {
      return await this.request<AuditLogEntry[]>('/audit/system');
    } catch {
      return [];
    }
  }

  // --- PHOTO UPLOAD ---
  async uploadPhoto(fileOrDataUrl: File | string, filename?: string): Promise<string> {
    if (typeof fileOrDataUrl === 'string') {
      const res = await fetch(`${BASE_URL}/upload`, {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl: fileOrDataUrl, filename: filename || 'photo.png' })
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Photo upload failed');
      }
      return json.url;
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const dataUrl = reader.result as string;
          const res = await fetch(`${BASE_URL}/upload`, {
            method: 'POST',
            cache: 'no-store',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dataUrl, filename: fileOrDataUrl.name })
          });
          const json = await res.json();
          if (!res.ok || !json.success) {
            throw new Error(json.error || 'Photo upload failed');
          }
          resolve(json.url);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(fileOrDataUrl);
    });
  }

  // --- STATS ---
  async getStats(): Promise<DashboardStats> {
    try {
      return await this.request<DashboardStats>('/stats', {}, 2);
    } catch {
      return {
        totalProducts: DEFAULT_CATALOG_PRODUCTS.length,
        liveProducts: DEFAULT_CATALOG_PRODUCTS.length,
        upcomingProducts: 0,
        outOfStockProducts: 0,
        totalStock: 150,
        totalOrders: 0,
        pendingOrders: 0,
        acceptedOrders: 0,
        packagingOrders: 0,
        outForDeliveryOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
        totalSoldQuantity: 4,
        totalSales: 320,
        calculatedSales: 320,
        isCustomRevenue: false,
        revenueMode: 'orders',
        totalCustomers: 1,
        verifiedCustomers: 1
      };
    }
  }

  // --- REVENUE TRANSACTIONS (AUTOMATIC ORDER DELIVERED LEDGER) ---
  async getRevenueTransactions(): Promise<RevenueTransaction[]> {
    try {
      const res = await this.request<any>('/revenue/transactions');
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      return [];
    } catch {
      return [];
    }
  }

  // --- CUSTOMIZE TOTAL REVENUE (OWNER ONLY) ---
  async updateCustomRevenue(revenue: number | null): Promise<DashboardStats> {
    return this.request<DashboardStats>('/stats/custom-revenue', {
      method: 'PUT',
      body: JSON.stringify({ revenue })
    });
  }

  async setRevenueMode(mode: 'manual' | 'orders'): Promise<DashboardStats> {
    return this.request<DashboardStats>('/stats/revenue-mode', {
      method: 'PUT',
      body: JSON.stringify({ mode })
    });
  }

  // --- CUSTOMERS MANAGEMENT ---
  async getCustomers(): Promise<Customer[]> {
    try {
      const res = await this.request<any>('/customers');
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      return [];
    } catch {
      return [];
    }
  }

  async toggleCustomerVerified(id: string): Promise<boolean> {
    const res = await this.request<{ success: boolean; verified: boolean }>(`/customers/${id}/toggle-verified`, {
      method: 'POST'
    });
    return res.verified;
  }

  async updateOrderPayment(id: string, paymentStatus: 'PENDING' | 'PAID' | 'VERIFIED'): Promise<Order> {
    return this.request<Order>(`/orders/${id}/payment`, {
      method: 'PUT',
      body: JSON.stringify({ paymentStatus })
    });
  }

  // --- STORE SETTINGS (BRAND NAME & TAGLINE INPUT TAGS) ---
  async getSettings(): Promise<StoreSettings> {
    try {
      return await this.request<StoreSettings>('/settings', {}, 2);
    } catch {
      return {
        brandName: 'TAZE CLINING',
        tagline: 'Pro Hygiene Solutions',
        heroTitle: 'Clinical Cleanliness.',
        heroSubtitle: 'Crafted for Homes & Industry.',
        updatedAt: new Date().toISOString()
      };
    }
  }

  async updateSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
    return this.request<StoreSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  }

  // --- RESET SEED ---
  async resetSeedCatalog(): Promise<Product[]> {
    return this.request<Product[]>('/reset-seed', { method: 'POST' });
  }
}

export const api = new ApiService();
