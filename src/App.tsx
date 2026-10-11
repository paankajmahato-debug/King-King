import React, { useState, useEffect, useCallback } from 'react';
import type { Product, Variant, Order, StoreSettings, CustomerProfile } from './types/index';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { ProductCard } from './components/ProductCard';
import { CartDrawer, CartItem } from './components/CartDrawer';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { OrderTracker } from './components/OrderTracker';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { CustomerOrderUrlBanner } from './components/CustomerOrderUrlBanner';
import { OrderUrlGeneratorApp } from './components/OrderUrlGeneratorApp';
import { CustomerOrderPage } from './components/CustomerOrderPage';
import { MyOrderSection } from './components/MyOrderSection';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  Package,
  Layers,
  PhoneCall,
  Clock,
  Award,
  Truck,
  Flame,
  ArrowRight
} from 'lucide-react';
import { DEFAULT_CATALOG_PRODUCTS } from './data/defaultCatalog';
import { CustomerAppView } from './components/mobile/CustomerAppView';
import { OwnerAppView } from './components/mobile/OwnerAppView';

export default function App() {
  // Initial route and customer mode detection:
  const [activeTab, setActiveTab] = useState<'store' | 'order' | 'generator' | 'track' | 'admin' | 'customer_app' | 'owner_app'>(() => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      if (pathname.startsWith('/customer-app') || params.get('app') === 'customer' || params.get('mode') === 'customer_app') {
        return 'customer_app';
      }
      if (pathname.startsWith('/owner-app') || params.get('app') === 'owner' || params.get('mode') === 'owner_app') {
        return 'owner_app';
      }
      if (pathname.startsWith('/order') || pathname.startsWith('/c/') || params.has('ref')) {
        return 'order';
      }
      if (pathname.startsWith('/track') || params.has('id') || params.has('orderId') || params.has('track')) {
        return 'track';
      }
      if (pathname.startsWith('/admin') || pathname.startsWith('/owner') || params.get('admin') === 'true') {
        return 'admin';
      }
      if (pathname.startsWith('/generator') || pathname.startsWith('/generate') || pathname.startsWith('/links')) {
        return 'generator';
      }
    }
    return 'store'; // Root website storefront by default
  });

  const [customerRef, setCustomerRef] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        let r = params.get('ref') || '';
        if (r && r.includes('/')) r = r.split('/')[0];
        return r.trim();
      } catch {}
    }
    return '';
  });

  const [isCustomerFront, setIsCustomerFront] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      if (pathname.startsWith('/order') || pathname.startsWith('/c/') || params.has('ref')) {
        return true;
      }
    }
    return false; // Full storefront by default on root
  });

  const [products, setProducts] = useState<Product[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('cleenzo_cached_products');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return DEFAULT_CATALOG_PRODUCTS;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store Brand Settings (Dynamic Name & Tags)
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    brandName: 'TAZE CLINING',
    tagline: 'Pro Hygiene Solutions',
    heroTitle: 'Clinical Cleanliness.',
    heroSubtitle: 'Crafted for Homes & Industry.'
  });

  // Authenticated Customer Profile State (Real OTP verification)
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('cleenzo_customer_profile');
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return null;
  });

  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Placed order modal
  const [latestOrder, setLatestOrder] = useState<Order | null>(null);
  const [trackingOrderId, setTrackingOrderId] = useState<string>('');

  // Catalog filtering
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Parse URL on mount: Support all Order URLs, tracking deep-links, customer refs, and admin access
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const rawHref = window.location.href;

      // Self-heal duplicate /order paths (e.g., .../order?ref=XYZ&src=whatsapp/order?ref=XYZ&src=whatsapp)
      if (rawHref.includes('/order') && (rawHref.match(/\/order/g) || []).length > 1) {
        try {
          const firstQueryIndex = rawHref.indexOf('?');
          if (firstQueryIndex !== -1) {
            const rawQuery = rawHref.substring(firstQueryIndex + 1).split('/order')[0];
            const cleanParams = new URLSearchParams(rawQuery);
            const extractedRef = cleanParams.get('ref') || '';
            const extractedSrc = cleanParams.get('src') || '';
            const normalizedUrl = extractedRef
              ? `/order?ref=${encodeURIComponent(extractedRef)}${extractedSrc ? `&src=${encodeURIComponent(extractedSrc)}` : ''}`
              : '/order';
            window.history.replaceState({}, '', normalizedUrl);
          }
        } catch {}
      }

      const urlParams = new URLSearchParams(window.location.search);
      let ref = urlParams.get('ref');
      if (ref && ref.includes('/')) {
        ref = ref.split('/')[0];
      }
      
      // Order tracking query parameters
      const orderIdParam = urlParams.get('id') || urlParams.get('orderId') || urlParams.get('track');
      
      // Path inspection
      const pathname = window.location.pathname.toLowerCase();
      const isTrackRoute = pathname.startsWith('/track');
      const isOrderRoute = pathname.startsWith('/order') || pathname.startsWith('/c/');
      const isGeneratorRoute =
        pathname.startsWith('/generator') ||
        pathname.startsWith('/generate') ||
        pathname.startsWith('/links') ||
        pathname.startsWith('/order-url') ||
        urlParams.get('tool') === 'generator' ||
        urlParams.get('view') === 'generator';
      const isAdminRoute =
        pathname.startsWith('/admin') ||
        pathname.startsWith('/owner') ||
        urlParams.get('admin') === 'true' ||
        urlParams.get('panel') === 'admin' ||
        urlParams.get('owner') === 'true';

      // Check for deep-link pattern /track/ORD-XXX or /order/ORD-XXX
      let pathOrderId = '';
      const pathMatch = window.location.pathname.match(/^\/(?:track|order)\/([a-zA-Z0-9_-]+)/i);
      if (pathMatch && pathMatch[1]) {
        pathOrderId = pathMatch[1];
      }

      const targetOrderId = (orderIdParam || pathOrderId || '').trim();

      if (targetOrderId) {
        // Direct Order URL clicked (e.g. /track?id=ORD-... or /order?id=ORD-...)
        setTrackingOrderId(targetOrderId);
        setActiveTab('track');
        if (isOrderRoute) {
          setIsCustomerFront(true);
        } else {
          setIsCustomerFront(false);
        }
      } else if (isTrackRoute) {
        // Direct track page visited without prefilled ID
        setActiveTab('track');
      } else if (isGeneratorRoute) {
        // Dedicated Order URL Generator App
        setIsCustomerFront(false);
        setActiveTab('generator');
      } else if (isAdminRoute) {
        // Admin or Owner portal
        setIsCustomerFront(false);
        setActiveTab('admin');
      } else if (ref || isOrderRoute) {
        // Dedicated customer ordering front: /order or /order?ref=CUSTOMER_ID
        setIsCustomerFront(true);
        setCustomerRef(ref ? ref.trim() : '');
        setActiveTab('order');
      }
    }
  }, []);

  // Verify and maintain persistent customer session with backend
  useEffect(() => {
    const token = api.getCustomerToken();
    if (token) {
      api.getCustomerProfile()
        .then(profile => {
          if (profile) {
            setCustomerProfile(profile);
          }
        })
        .catch(() => {
          // Resilient session: Do not wipe customer profile on network hiccup
          if (typeof window !== 'undefined') {
            try {
              const cached = localStorage.getItem('cleenzo_customer_profile');
              if (cached) setCustomerProfile(JSON.parse(cached));
            } catch {}
          }
        });
    }
  }, []);

  const handleCustomerVerified = (profile: CustomerProfile) => {
    setCustomerProfile(profile);
  };

  const handleCustomerLogout = () => {
    api.clearCustomerAuth();
    setCustomerProfile(null);
  };

  // Tab switching with strict isolation for customer order portal
  const handleTabChange = (tab: 'store' | 'order' | 'generator' | 'track' | 'admin' | 'customer_app' | 'owner_app') => {
    // When on customer order portal, isolate customer completely from main website & admin
    if (isCustomerFront) {
      if (tab === 'store' || tab === 'admin' || tab === 'generator') {
        return; // Prevent showing main site or admin layout
      }
    }

    if (tab === 'store') {
      setIsCustomerFront(false);
      if (typeof window !== 'undefined') {
        try {
          window.history.pushState({}, '', '/');
        } catch {}
      }
    } else if (tab === 'order') {
      if (typeof window !== 'undefined') {
        try {
          const u = customerRef ? `/order?ref=${encodeURIComponent(customerRef)}` : '/order';
          window.history.pushState({}, '', u);
        } catch {}
      }
    }
    setActiveTab(tab);
  };

  // Fetch products from shared backend
  const fetchCatalog = useCallback(async () => {
    try {
      const prods = await api.getProducts(true);
      if (Array.isArray(prods) && prods.length > 0) {
        setProducts(prods);
        setError(null);
      }
    } catch (err: any) {
      console.warn('[Fetch Catalog Notice]:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Store Brand Name & Tag Settings
  const fetchSettings = useCallback(async () => {
    try {
      const s = await api.getSettings();
      if (s && s.brandName) {
        setStoreSettings(s);
        if (typeof document !== 'undefined') {
          document.title = `${s.brandName} - Cleaning Solutions & Order Management`;
        }
      }
    } catch {
      // non-blocking
    }
  }, []);

  useEffect(() => {
    fetchCatalog();
    fetchSettings();

    // Auto-refresh products periodically to ensure real-time synchronization
    const interval = setInterval(() => {
      fetchCatalog();
      fetchSettings();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchCatalog, fetchSettings]);

  // Cart Handlers
  const handleAddToCart = (product: Product, variant: Variant, quantity: number) => {
    setCartItems(prev => {
      const existingIdx = prev.findIndex(
        item => item.product.id === product.id && item.variantId === variant.variantId
      );

      if (existingIdx > -1) {
        const updated = [...prev];
        const newQty = Math.min(variant.stockQuantity, updated[existingIdx].quantity + quantity);
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQty,
          mrp: variant.mrp,
          sellingPrice: variant.sellingPrice
        };
        return updated;
      }

      return [
        ...prev,
        {
          product,
          variantId: variant.variantId,
          size: variant.size,
          mrp: variant.mrp,
          sellingPrice: variant.sellingPrice,
          quantity: Math.min(variant.stockQuantity, quantity)
        }
      ];
    });
  };

  const handleUpdateQuantity = (productId: string, variantId: string, quantity: number) => {
    setCartItems(prev =>
      prev.map(item => {
        if (item.product.id === productId && item.variantId === variantId) {
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  const handleRemoveCartItem = (productId: string, variantId: string) => {
    setCartItems(prev =>
      prev.filter(item => !(item.product.id === productId && item.variantId === variantId))
    );
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleOrderSuccess = (order: Order) => {
    setLatestOrder(order);
    // Refresh products to show updated stock immediately
    fetchCatalog();
  };

  const handleTrackOrderFromModal = (orderId: string) => {
    setTrackingOrderId(orderId);
    setActiveTab('track');
  };

  // Quick single-product WhatsApp inquiry
  const handleQuickWhatsApp = (product: Product, variant: Variant, qty: number) => {
    const text = `Hi ${storeSettings.brandName} Team, I would like to order:
Product: ${product.name}
Size: ${variant.size}
Quantity: ${qty}
Price: ₹${variant.sellingPrice} (MRP: ₹${variant.mrp})
Please confirm delivery timeline.`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Filter products for customer/store views
  const safeProducts = Array.isArray(products) ? products : [];
  const visibleProducts = safeProducts.filter(p => {
    if (!p) return false;
    if (p.status === 'INACTIVE') return false;
    if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name ? p.name.toLowerCase().includes(q) : false;
      const matchCat = p.category ? p.category.toLowerCase().includes(q) : false;
      const matchDesc = p.description ? p.description.toLowerCase().includes(q) : false;
      if (!matchName && !matchCat && !matchDesc) return false;
    }
    return true;
  });

  const categories = ['All', 'Floor Care', 'Disinfection', 'Glass Care', 'Sanitary', 'Kitchen'];

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // APP 1: Dedicated Customer Android App View
  if (activeTab === 'customer_app') {
    return <CustomerAppView storeSettings={storeSettings} />;
  }

  // APP 2: Dedicated Owner / Admin Android App View
  if (activeTab === 'owner_app') {
    return <OwnerAppView storeSettings={storeSettings} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Customer URL Banner - ONLY shown in Admin or Store mode, NEVER exposed on Customer Front */}
      {!isCustomerFront && (activeTab === 'admin' || activeTab === 'store') && (
        <CustomerOrderUrlBanner
          currentRef={customerRef || ''}
          onOpenGenerator={() => setActiveTab('generator')}
          onUpdateRef={newRef => {
            setCustomerRef(newRef);
            if (typeof window !== 'undefined') {
              const url = new URL(window.location.href);
              if (newRef) {
                url.searchParams.set('ref', newRef);
              } else {
                url.searchParams.delete('ref');
              }
              window.history.replaceState({}, '', url.toString());
            }
          }}
        />
      )}

      {/* Top Bar Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        cartCount={totalCartCount}
        openCart={() => setIsCartOpen(true)}
        customerRef={customerRef}
        isCustomerFront={isCustomerFront}
        brandName={storeSettings.brandName}
        tagline={storeSettings.tagline}
        customerProfile={customerProfile}
        onLogoutCustomer={handleCustomerLogout}
      />

      {/* Main Content Areas */}
      <main className="flex-1 pb-16">
        {/* VIEW 1: MAIN WEBSITE CATALOG */}
        {activeTab === 'store' && (
          <div>
            {/* Storefront Hero */}
            <section className="relative bg-slate-900 text-white overflow-hidden py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
              <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="max-w-2xl space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Hospital-Grade 99.9% Germ Protection Formula</span>
                  </div>

                  <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-display leading-tight text-white">
                    {storeSettings.heroTitle || 'Clinical Cleanliness.'} <br className="hidden sm:inline" />
                    <span className="text-emerald-400">{storeSettings.heroSubtitle || 'Crafted for Homes & Industry.'}</span>
                  </h1>

                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
                    {storeSettings.brandName} manufactures ultra-concentrated hygiene solutions engineered to dissolve
                    stubborn grime, grease, and hard water stains. Available in precision 250 ML to
                    industrial 5 Litre bulk packs.
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => {
                        const el = document.getElementById('catalog-grid');
                        el?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-sm flex items-center gap-2 active:scale-95"
                    >
                      <span>Explore Catalog</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setActiveTab('order')}
                      className="px-5 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs sm:text-sm rounded-xl transition-colors flex items-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>{customerProfile ? 'Enter Customer Order Portal' : 'Customer Direct Order Portal'}</span>
                    </button>
                  </div>
                </div>

                {/* Trust Highlights Bento */}
                <div className="grid grid-cols-2 gap-3 w-full lg:max-w-md">
                  <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80">
                    <Award className="w-6 h-6 text-emerald-400 mb-2" />
                    <h2 className="text-xs font-bold text-white">99.99% Efficacy</h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Laboratory tested bactericidal & virucidal agent.
                    </p>
                  </div>
                  <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80">
                    <Truck className="w-6 h-6 text-emerald-400 mb-2" />
                    <h2 className="text-xs font-bold text-white">Direct Dispatch</h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Factory fresh inventory with guaranteed purity.
                    </p>
                  </div>
                  <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80">
                    <Flame className="w-6 h-6 text-emerald-400 mb-2" />
                    <h2 className="text-xs font-bold text-white">Multi-Pack Sizing</h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Independent 250 ML, 500 ML, 1L & 5L packs.
                    </p>
                  </div>
                  <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80">
                    <Clock className="w-6 h-6 text-emerald-400 mb-2" />
                    <h2 className="text-xs font-bold text-white">Instant WhatsApp</h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      One-click dynamic order dispatch to merchant.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Catalog Section */}
            <section id="catalog-grid" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {/* Category & Search Filter Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                {/* Segmented Category Buttons */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                        selectedCategory === cat
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Search input */}
                <div className="relative w-full md:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search formula, scent, surface..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-xs text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Product Grid */}
              {loading ? (
                <div className="py-20 text-center">
                  <RefreshCw className="w-8 h-8 mx-auto text-emerald-600 animate-spin mb-3" />
                  <p className="text-xs font-semibold text-slate-600">
                    Connecting to {storeSettings.brandName} central inventory...
                  </p>
                </div>
              ) : error ? (
                <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center max-w-md mx-auto my-12">
                  <p className="text-xs font-bold text-rose-800">{error}</p>
                  <button
                    onClick={fetchCatalog}
                    className="mt-3 px-4 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg"
                  >
                    Retry Connection
                  </button>
                </div>
              ) : visibleProducts.length === 0 ? (
                <div className="py-16 text-center bg-white rounded-2xl border border-slate-200">
                  <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <h3 className="text-sm font-semibold text-slate-800">No products found</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Try selecting another category or clear your search query.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {visibleProducts.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      brandName={storeSettings.brandName}
                      onAddToCart={handleAddToCart}
                      onQuickWhatsApp={handleQuickWhatsApp}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* TAZE CLINING — MY ORDER / ORDER STATUS SECTION */}
            <MyOrderSection
              initialOrderId={trackingOrderId}
              onOrderFound={foundId => setTrackingOrderId(foundId)}
            />
          </div>
        )}

        {/* VIEW 2: CUSTOMER ORDER VIEW (/order?ref=CUSTOMER_ID) */}
        {activeTab === 'order' && (
          <CustomerOrderPage
            customerRef={customerRef}
            onUpdateCustomerRef={newRef => {
              setCustomerRef(newRef);
              if (typeof window !== 'undefined') {
                const url = new URL(window.location.href);
                if (newRef) {
                  url.searchParams.set('ref', newRef);
                } else {
                  url.searchParams.delete('ref');
                }
                window.history.replaceState({}, '', url.toString());
              }
            }}
            brandName={storeSettings.brandName}
            products={products}
            onAddToCart={handleAddToCart}
            onQuickWhatsApp={handleQuickWhatsApp}
            onOpenCart={() => setIsCartOpen(true)}
            cartCount={totalCartCount}
            latestPlacedOrder={latestOrder}
          />
        )}

        {/* VIEW 3: DEDICATED ORDER URL GENERATOR APP */}
        {activeTab === 'generator' && (
          <OrderUrlGeneratorApp
            products={products}
            brandName={storeSettings.brandName}
          />
        )}

        {/* VIEW 4: TRACK ORDER STATUS & MY ORDERS */}
        {activeTab === 'track' && (
          <OrderTracker
            initialOrderId={trackingOrderId}
            brandName={storeSettings.brandName}
            onBackToStore={() => setActiveTab(isCustomerFront ? 'order' : 'store')}
            customerProfile={customerProfile}
          />
        )}

        {/* VIEW 4: ADMIN OPERATIONS PANEL */}
        {activeTab === 'admin' && (
          <AdminDashboard
            onRefreshProducts={fetchCatalog}
            settings={storeSettings}
            onUpdateSettings={updated => setStoreSettings(updated)}
            onOpenGenerator={() => setActiveTab('generator')}
          />
        )}
      </main>

      {/* Slide-over Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        brandName={storeSettings.brandName}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onOrderSuccess={handleOrderSuccess}
        customerRef={customerRef}
        customerProfile={customerProfile}
      />


      {/* Order Confirmation Modal */}
      <OrderConfirmationModal
        order={latestOrder}
        brandName={storeSettings.brandName}
        onClose={() => setLatestOrder(null)}
        onTrackOrder={handleTrackOrderFromModal}
      />

      {/* Sticky Bottom Order Bar for Mobile */}
      {cartItems.length > 0 && !isCartOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 sm:hidden shadow-lg animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-[11px] text-slate-500 block">
                {totalCartCount} {totalCartCount === 1 ? 'item' : 'items'} in basket
              </span>
              <span className="text-base font-extrabold text-slate-900 font-mono-nums">
                ₹{cartItems.reduce((acc, i) => acc + i.sellingPrice * i.quantity, 0)}
              </span>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <span>Review Order</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      {isCustomerFront ? (
        <footer className="bg-white border-t border-slate-200 py-6 px-4 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="font-semibold text-slate-700">
              {storeSettings.brandName} Direct Customer Order Portal
            </span>
            <span>Direct factory dispatch · 100% verified orders · Real-time stock</span>
          </div>
        </footer>
      ) : (
        <footer className="bg-slate-900 text-slate-400 py-8 px-4 border-t border-slate-800 text-xs text-center">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-white text-sm">{storeSettings.brandName}</span>
              <span>·</span>
              <span>Master Operations & Unified Customer Ordering Platform</span>
            </div>

            <div className="flex items-center gap-4 text-slate-500">
              <span>Real-time Inventory Synchronization</span>
              <span>·</span>
              <span>Double-Accept Protected Backend</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
