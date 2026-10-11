import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Product, Variant, Order, StoreSettings } from '../../types/index';
import { api } from '../../services/api';
import {
  ShoppingBag,
  Package,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  CheckCheck,
  XCircle,
  AlertCircle,
  RefreshCw,
  Phone,
  MessageCircle,
  MapPin,
  ChevronRight,
  Plus,
  Minus,
  Trash2,
  X,
  Share2,
  Sparkles,
  ShieldCheck,
  WifiOff,
  Filter,
  ArrowRight,
  Download,
  Info
} from 'lucide-react';

interface CartItem {
  product: Product;
  variant: Variant;
  quantity: number;
}

interface CustomerAppViewProps {
  storeSettings?: StoreSettings;
}

export const CustomerAppView: React.FC<CustomerAppViewProps> = ({
  storeSettings: propSettings
}) => {
  // Navigation tabs in Customer App: 'shop' | 'orders' | 'support'
  const [activeTab, setActiveTab] = useState<'shop' | 'orders' | 'support'>('shop');
  
  // Products & Categories
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem('taze_customer_cart');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Customer Checkout Details
  const [customerName, setCustomerName] = useState(() => {
    try {
      return localStorage.getItem('taze_customer_name') || '';
    } catch {
      return '';
    }
  });
  const [customerPhone, setCustomerPhone] = useState(() => {
    try {
      return localStorage.getItem('taze_customer_phone') || '';
    } catch {
      return '';
    }
  });
  const [customerAddress, setCustomerAddress] = useState(() => {
    try {
      return localStorage.getItem('taze_customer_address') || '';
    } catch {
      return '';
    }
  });
  const [orderNotes, setOrderNotes] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Completed Order Confirmation
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  // Customer Orders (Strictly only the customer's own orders)
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  // Network State
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Store Brand Settings
  const brandName = propSettings?.brandName || 'TAZE CLINING';
  const tagline = propSettings?.tagline || 'Pro Hygiene Solutions';

  // Persist cart
  useEffect(() => {
    try {
      localStorage.setItem('taze_customer_cart', JSON.stringify(cart));
    } catch {}
  }, [cart]);

  // Online / Offline listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      fetchProducts();
      loadMyOrders();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initial products fetch
  const fetchProducts = async () => {
    try {
      const list = await api.getProducts();
      setProducts(list.filter(p => p.status !== 'INACTIVE'));
    } catch (err) {
      console.error('[CustomerApp] Failed to load products:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Poll for customer order status updates every 4 seconds when viewing orders or placed order
  useEffect(() => {
    loadMyOrders();
    const interval = setInterval(() => {
      loadMyOrders(true);
      if (placedOrder) {
        api.getLiveOrderStatus(placedOrder.id).then((ord: Order | null) => {
          if (ord) {
            setPlacedOrder(ord);
          }
        }).catch(() => {});
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [customerPhone, placedOrder?.id]);

  // Load ONLY this customer's placed orders
  const loadMyOrders = async (silent = false) => {
    if (!silent) setLoadingOrders(true);
    try {
      // 1. Check orders stored locally for this device
      const localIds: string[] = [];
      try {
        const stored = localStorage.getItem('taze_my_order_ids');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) localIds.push(...parsed);
        }
      } catch {}

      // 2. Query orders for verified phone or device order IDs
      const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
      const fetchedOrders: Order[] = [];

      if (cleanPhone.length >= 10) {
        try {
          const res = await api.getCustomerOrdersByPhone(cleanPhone);
          if (Array.isArray(res)) {
            fetchedOrders.push(...res);
          }
        } catch {}
      }

      // Fetch individual orders tracked by ID on this phone
      for (const id of localIds) {
        if (!fetchedOrders.some(o => o.id === id)) {
          try {
            const single = await api.getLiveOrderStatus(id);
            if (single) {
              fetchedOrders.push(single);
            }
          } catch {}
        }
      }

      // Sort newest first
      fetchedOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setMyOrders(fetchedOrders);
    } catch (err) {
      console.warn('[CustomerApp] Failed to refresh customer orders:', err);
    } finally {
      if (!silent) setLoadingOrders(false);
    }
  };

  // Add to Cart
  const handleAddToCart = (product: Product, variant: Variant, qty: number = 1) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(
        item => item.product.id === product.id && item.variant.variantId === variant.variantId
      );
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += qty;
        return updated;
      }
      return [...prev, { product, variant, quantity: qty }];
    });
    setIsCartOpen(true);
  };

  const updateCartQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      setCart(prev => prev.filter((_, i) => i !== index));
    } else {
      setCart(prev => {
        const updated = [...prev];
        updated[index].quantity = newQty;
        return updated;
      });
    }
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.variant.sellingPrice * item.quantity), 0);
  }, [cart]);

  const cartTotalMrp = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.variant.mrp * item.quantity), 0);
  }, [cart]);

  const cartTotalSavings = cartTotalMrp - cartTotal;

  // Handle Order Placement
  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      setOrderError('Your cart is empty. Please add items to proceed.');
      return;
    }
    if (!customerName.trim()) {
      setOrderError('Please enter your full name.');
      return;
    }
    const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setOrderError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!customerAddress.trim()) {
      setOrderError('Please provide your complete delivery address with PIN code.');
      return;
    }

    setOrderError(null);
    setIsPlacingOrder(true);

    try {
      // Save customer profile locally for fast next order
      localStorage.setItem('taze_customer_name', customerName.trim());
      localStorage.setItem('taze_customer_phone', cleanPhone);
      localStorage.setItem('taze_customer_address', customerAddress.trim());

      const orderPayload = {
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        customerAddress: customerAddress.trim(),
        notes: orderNotes.trim() ? `[Android App] ${orderNotes.trim()}` : '[Android App]',
        sourceUrl: 'Android Customer App',
        items: cart.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          variantId: item.variant.variantId,
          size: item.variant.size,
          quantity: item.quantity,
          mrp: item.variant.mrp,
          sellingPrice: item.variant.sellingPrice,
          subtotal: item.variant.sellingPrice * item.quantity
        }))
      };

      const res = await api.createOrder(orderPayload);
      if (res && res.id) {
        // Save order ID to customer's order history on this device
        try {
          const stored = localStorage.getItem('taze_my_order_ids');
          const ids: string[] = stored ? JSON.parse(stored) : [];
          if (!ids.includes(res.id)) {
            ids.unshift(res.id);
            localStorage.setItem('taze_my_order_ids', JSON.stringify(ids.slice(0, 50)));
          }
        } catch {}

        setPlacedOrder(res);
        setCart([]);
        setIsCartOpen(false);
        setActiveTab('orders');
        loadMyOrders();
      } else {
        throw new Error('Failed to generate order ID from server.');
      }
    } catch (err: any) {
      console.error('[CustomerApp] Error placing order:', err);
      setOrderError(err.message || 'Unable to place order. Please check your network connection.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // WhatsApp Quick Order for Cart
  const handleWhatsAppCartOrder = () => {
    if (cart.length === 0) return;
    const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
    let text = `*NEW ORDER — ${brandName}*\n\n`;
    text += `*Customer:* ${customerName.trim() || 'Valued Customer'}\n`;
    text += `*Phone:* ${cleanPhone || 'Via WhatsApp'}\n`;
    text += `*Address:* ${customerAddress.trim() || 'Will provide on chat'}\n\n`;
    text += `*Items Ordered:*\n`;
    cart.forEach((item, idx) => {
      text += `${idx + 1}. *${item.product.name}* (${item.variant.size}) × ${item.quantity} = ₹${item.variant.sellingPrice * item.quantity}\n`;
    });
    text += `\n*Total Amount:* ₹${cartTotal}`;
    if (cartTotalSavings > 0) {
      text += ` (Saved: ₹${cartTotalSavings})`;
    }
    if (orderNotes.trim()) {
      text += `\n*Note:* ${orderNotes.trim()}`;
    }
    text += `\n\n_Placed via ${brandName} Customer Android App_`;

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  // Customer Cancel Order (Only allowed while PENDING or ACCEPTED)
  const handleCancelOrder = async (orderId: string) => {
    const confirmCancel = window.confirm(
      'Are you sure you want to cancel this order? Once cancelled, this action cannot be undone.'
    );
    if (!confirmCancel) return;

    setCancellingOrderId(orderId);
    try {
      await api.cancelOrder(orderId, 'Cancelled by customer via Android App');
      await loadMyOrders();
      if (placedOrder?.id === orderId) {
        setPlacedOrder(prev => prev ? { ...prev, status: 'CANCELLED' } : null);
      }
      alert(`Order #${orderId} has been successfully cancelled.`);
    } catch (err: any) {
      alert(err.message || 'Unable to cancel order at this stage.');
    } finally {
      setCancellingOrderId(null);
    }
  };

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return ['ALL', ...Array.from(set)];
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
      const matchesSearch = !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.tagline && p.tagline.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Status helper badge for customer orders
  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'PENDING':
        return {
          label: 'Order Placed (Pending Confirmation)',
          color: 'bg-amber-100 text-amber-800 border-amber-300',
          icon: <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
        };
      case 'ACCEPTED':
        return {
          label: 'Accepted by Factory',
          color: 'bg-blue-100 text-blue-800 border-blue-300',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
        };
      case 'PACKAGING':
        return {
          label: 'Packaging in Progress',
          color: 'bg-purple-100 text-purple-800 border-purple-300',
          icon: <Package className="w-3.5 h-3.5 text-purple-600 animate-bounce" />
        };
      case 'OUT_FOR_DELIVERY':
        return {
          label: 'Out for Delivery',
          color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
          icon: <Truck className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
        };
      case 'DELIVERED':
        return {
          label: 'Delivered',
          color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          icon: <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
        };
      case 'CANCELLED':
        return {
          label: 'Cancelled',
          color: 'bg-rose-100 text-rose-800 border-rose-300',
          icon: <XCircle className="w-3.5 h-3.5 text-rose-600" />
        };
      default:
        return {
          label: status,
          color: 'bg-slate-100 text-slate-800 border-slate-300',
          icon: <Clock className="w-3.5 h-3.5" />
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans pb-20 select-none">
      {/* 1. TOP APP BAR */}
      <header className="sticky top-0 z-40 bg-emerald-900 text-white shadow-md border-b border-emerald-800">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-base shadow-sm">
              TC
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-base tracking-tight leading-tight">{brandName}</h1>
                <span className="bg-emerald-500/30 text-emerald-300 text-[10px] font-bold px-1.5 py-0.2 rounded border border-emerald-400/40">
                  App
                </span>
              </div>
              <p className="text-[11px] text-emerald-200 leading-none">{tagline}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh */}
            <button
              onClick={() => {
                setRefreshing(true);
                fetchProducts();
                loadMyOrders();
              }}
              disabled={refreshing}
              className="p-2 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-emerald-200 transition-colors"
              title="Refresh catalog"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Cart trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-all shadow-sm active:scale-95 flex items-center justify-center"
              title="View Cart"
            >
              <ShoppingBag className="w-4 h-4" />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-emerald-900 shadow-sm animate-scale">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Offline indicator bar */}
        {!isOnline && (
          <div className="bg-amber-600 text-white text-xs py-1 px-4 flex items-center justify-center gap-1.5 font-medium animate-pulse">
            <WifiOff className="w-3.5 h-3.5" />
            <span>Offline mode. Retrying connection...</span>
          </div>
        )}
      </header>

      {/* 2. MAIN CONTENT CONTAINER (MOBILE VIEWPORT OPTIMIZED) */}
      <main className="max-w-md w-full mx-auto flex-1 p-3 sm:p-4">
        {/* TAB 1: SHOPPING / CATALOG */}
        {activeTab === 'shop' && (
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search cleaning solutions, floor care, acid..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all shadow-2xs ${
                    selectedCategory === cat
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat === 'ALL' ? 'All Products' : cat}
                </button>
              ))}
            </div>

            {/* Product List Loading */}
            {loading ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-500 font-medium">Syncing live catalog from factory...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-6 space-y-2">
                <Package className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-800 text-sm">No products found</h3>
                <p className="text-xs text-slate-500">
                  {searchQuery ? `No match for "${searchQuery}"` : 'No products available in this category.'}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('ALL');
                    }}
                    className="text-xs font-bold text-emerald-700 underline mt-2"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {filteredProducts.map(product => (
                  <CustomerProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    onOpenDetails={() => {
                      setSelectedProduct(product);
                      setSelectedVariant(product.variants[0] || null);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MY ORDERS & ORDER TRACKING */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">My Orders</h2>
                <p className="text-xs text-slate-500">Live order status from factory to your doorstep</p>
              </div>
              <button
                onClick={() => loadMyOrders()}
                disabled={loadingOrders}
                className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-emerald-700 shadow-2xs"
                title="Refresh Orders"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* If there is a freshly placed order, highlight it at the very top */}
            {placedOrder && (
              <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white rounded-3xl p-4 shadow-md border border-emerald-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                      Recent Order Confirmation
                    </span>
                  </div>
                  <span className="text-xs font-mono font-black text-emerald-200">
                    #{placedOrder.id}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 pb-2 border-b border-emerald-800/80">
                  <div>
                    <p className="text-xs text-emerald-200/80">Total Amount</p>
                    <p className="text-lg font-black font-mono text-white">₹{placedOrder.grandTotal}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-emerald-200/80">Current Status</p>
                    <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-300">
                      {placedOrder.status}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-emerald-100/90 leading-relaxed">
                  Thank you, <strong>{placedOrder.customerName}</strong>! Our production dispatch team has received your order.
                </p>

                {/* Cancel allowed only in Pending / Accepted */}
                {(placedOrder.status === 'PENDING' || placedOrder.status === 'ACCEPTED') && (
                  <button
                    onClick={() => handleCancelOrder(placedOrder.id)}
                    disabled={cancellingOrderId === placedOrder.id}
                    className="w-full py-2 bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/40 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Cancel Order</span>
                  </button>
                )}
              </div>
            )}

            {/* Orders list */}
            {loadingOrders && myOrders.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-7 h-7 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-500">Checking your placed orders...</p>
              </div>
            ) : myOrders.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-3">
                <Package className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-800 text-sm">No orders yet</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Browse our certified cleaning formulations and place your first order.
                </p>
                <button
                  onClick={() => setActiveTab('shop')}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-2xl shadow-sm transition-all"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {myOrders.map(order => {
                  const badge = getStatusBadge(order.status);
                  const canCancel = order.status === 'PENDING' || order.status === 'ACCEPTED';

                  return (
                    <div
                      key={order.id}
                      className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3 transition-all hover:border-slate-300"
                    >
                      {/* Order Header */}
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-extrabold text-sm text-slate-900">
                              #{order.id}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short'
                              })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            {order.items?.length || 0} items · ₹{order.grandTotal}
                          </p>
                        </div>

                        {/* Status Badge */}
                        <div className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${badge.color}`}>
                          {badge.icon}
                          <span>{badge.label}</span>
                        </div>
                      </div>

                      {/* Items Preview */}
                      <div className="space-y-1.5 text-xs">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-slate-700">
                            <span className="truncate pr-2">
                              {item.productName} ({item.size}) <span className="text-slate-400 font-mono">×{item.quantity}</span>
                            </span>
                            <span className="font-mono font-bold text-slate-900 shrink-0">
                              ₹{item.subtotal || item.sellingPrice * item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Delivery Address */}
                      {order.customerAddress && (
                        <div className="flex items-start gap-1.5 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="truncate">{order.customerAddress}</span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        {/* WhatsApp support for order */}
                        <button
                          onClick={() => {
                            const text = `Hi ${brandName}, I need an update on my Order #${order.id} (Status: ${order.status}).`;
                            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                          }}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>WhatsApp Help</span>
                        </button>

                        {/* Cancellation Button */}
                        {canCancel ? (
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={cancellingOrderId === order.id}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>{cancellingOrderId === order.id ? 'Cancelling...' : 'Cancel Order'}</span>
                          </button>
                        ) : order.status === 'CANCELLED' ? (
                          <span className="text-[11px] text-rose-600 font-bold">Order Cancelled</span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">In dispatch stage</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: FACTORY & SUPPORT */}
        {activeTab === 'support' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xl">
                  TC
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">{brandName}</h3>
                  <p className="text-xs text-slate-500">Official Factory Customer Support</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Direct factory manufacturing and wholesale supply of specialized cleaning chemicals, floor care solutions, sanitizers, and detergents. All products are laboratory verified and packaged to industrial standards.
              </p>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    const text = `Hello ${brandName}, I would like to inquire about your product catalog and bulk ordering options.`;
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat on WhatsApp (Direct Support)</span>
                </button>

                <a
                  href="/download/customer-apk"
                  download="TAZE-CLINING-Customer.apk"
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-semibold text-xs flex items-center justify-center gap-2 transition-colors border border-slate-200"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>Download Customer Android App (APK)</span>
                </a>
              </div>
            </div>

            {/* Quality Commitment Card */}
            <div className="bg-emerald-950 text-white rounded-3xl p-5 space-y-3 border border-emerald-800 shadow-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-300">
                  Direct Factory Quality Guarantee
                </h4>
              </div>
              <ul className="text-xs text-emerald-100/90 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Available in 250 ML, 500 ML, 1 Liter & 5 Liter industrial cans</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Live stock verification directly from warehouse</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Safe door-step delivery with real-time status tracker</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </main>

      {/* 3. PRODUCT DETAIL MODAL */}
      {selectedProduct && selectedVariant && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {selectedProduct.category || 'Hygiene Solution'}
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                  {selectedProduct.name}
                </h3>
                {selectedProduct.tagline && (
                  <p className="text-xs text-slate-500">{selectedProduct.tagline}</p>
                )}
              </div>
              <button
                onClick={() => {
                  setSelectedProduct(null);
                  setSelectedVariant(null);
                }}
                className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product Image */}
            <div className="w-full h-44 bg-slate-100 rounded-2xl overflow-hidden relative border border-slate-200 flex items-center justify-center">
              {selectedProduct.image ? (
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-4">
                  <Package className="w-12 h-12 text-slate-300 mx-auto mb-1" />
                  <span className="text-xs font-bold text-slate-400">Direct Factory Product</span>
                </div>
              )}
            </div>

            {/* Variant Selector: 250 ML, 500 ML, 1 L, 5 L */}
            <div>
              <p className="text-xs font-bold text-slate-800 mb-2">Select Size Variant:</p>
              <div className="grid grid-cols-2 gap-2">
                {selectedProduct.variants.map(v => {
                  const isSelected = selectedVariant.variantId === v.variantId;
                  const isOutOfStock = v.status === 'OUT_OF_STOCK' || v.stockQuantity <= 0;

                  return (
                    <button
                      key={v.variantId}
                      onClick={() => !isOutOfStock && setSelectedVariant(v)}
                      disabled={isOutOfStock}
                      className={`p-2.5 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                          : isOutOfStock
                          ? 'border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-900">{v.size}</span>
                        {v.offer && (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                            {v.offer}
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-sm font-black font-mono text-emerald-800">
                          ₹{v.sellingPrice}
                        </span>
                        {v.mrp > v.sellingPrice && (
                          <span className="text-[10px] text-slate-400 line-through font-mono">
                            ₹{v.mrp}
                          </span>
                        )}
                      </div>
                      {isOutOfStock ? (
                        <span className="text-[9px] font-bold text-rose-600 block mt-0.5">Out of Stock</span>
                      ) : (
                        <span className="text-[9px] text-emerald-600 font-semibold block mt-0.5">In Stock ({v.stockQuantity} avail)</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description & Features */}
            {selectedProduct.description && (
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-800">Description:</p>
                <p className="leading-relaxed">{selectedProduct.description}</p>
              </div>
            )}

            {/* Add to Cart Actions */}
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => {
                  if (selectedVariant) {
                    handleAddToCart(selectedProduct, selectedVariant, 1);
                    setSelectedProduct(null);
                    setSelectedVariant(null);
                  }
                }}
                disabled={selectedVariant.status === 'OUT_OF_STOCK' || selectedVariant.stockQuantity <= 0}
                className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-300 text-white rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add {selectedVariant.size} to Cart (₹{selectedVariant.sellingPrice})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. CART DRAWER & ORDER FORM MODAL */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 max-h-[92vh] overflow-y-auto space-y-4 shadow-2xl border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-700" />
                <h3 className="font-black text-base text-slate-900">Your Order Basket</h3>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  {cart.length} items
                </span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            {cart.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">Your basket is currently empty</p>
                <p className="text-[11px] text-slate-400">Select products from the catalog to proceed</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {cart.map((item, idx) => (
                  <div
                    key={`${item.product.id}-${item.variant.variantId}`}
                    className="flex items-center justify-between bg-slate-50 p-2.5 rounded-2xl border border-slate-200 gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-slate-900 truncate">{item.product.name}</p>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <span className="font-semibold text-emerald-800">{item.variant.size}</span>
                        <span>·</span>
                        <span className="font-mono">₹{item.variant.sellingPrice} each</span>
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-1.5 py-0.5 shadow-2xs">
                      <button
                        onClick={() => updateCartQuantity(idx, item.quantity - 1)}
                        className="p-1 text-slate-500 hover:text-slate-800"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold font-mono px-1">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(idx, item.quantity + 1)}
                        className="p-1 text-slate-500 hover:text-slate-800"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-bold font-mono text-xs text-slate-900">
                        ₹{item.variant.sellingPrice * item.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Price Summary */}
            {cart.length > 0 && (
              <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200 space-y-1 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Subtotal MRP:</span>
                  <span className="font-mono line-through">₹{cartTotalMrp}</span>
                </div>
                {cartTotalSavings > 0 && (
                  <div className="flex items-center justify-between text-emerald-700 font-bold">
                    <span>Direct Factory Discount:</span>
                    <span className="font-mono">-₹{cartTotalSavings}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-slate-900 font-black text-sm pt-1 border-t border-emerald-200">
                  <span>Total Payable:</span>
                  <span className="font-mono text-emerald-900 text-base">₹{cartTotal}</span>
                </div>
              </div>
            )}

            {/* Customer Checkout Form */}
            {cart.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <p className="text-xs font-extrabold text-slate-900">Customer Delivery Information:</p>

                {orderError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{orderError}</span>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">10-Digit Mobile Number *</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Complete Delivery Address with PIN *</label>
                  <textarea
                    rows={2}
                    value={customerAddress}
                    onChange={e => setCustomerAddress(e.target.value)}
                    placeholder="House/Shop No., Street, Landmark, City, PIN Code"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Optional Notes</label>
                  <input
                    type="text"
                    value={orderNotes}
                    onChange={e => setOrderNotes(e.target.value)}
                    placeholder="e.g. Call before delivery, deliver after 3 PM"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Checkout Actions */}
                <div className="pt-2 space-y-2">
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isPlacingOrder}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-300 text-white rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                  >
                    {isPlacingOrder ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Confirming with Factory...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                        <span>Place Order Directly (₹{cartTotal})</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleWhatsAppCartOrder}
                    className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 border border-emerald-200 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>Order via WhatsApp Instead</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. BOTTOM NAVIGATION BAR (ANDROID MOBILE SPECIFICATION) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg">
        <div className="max-w-md mx-auto grid grid-cols-3 h-14">
          <button
            onClick={() => setActiveTab('shop')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              activeTab === 'shop' ? 'text-emerald-700 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-[10px] leading-none">Catalog</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('orders');
              loadMyOrders();
            }}
            className={`flex flex-col items-center justify-center gap-1 relative transition-colors ${
              activeTab === 'orders' ? 'text-emerald-700 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Package className="w-5 h-5" />
            <span className="text-[10px] leading-none">My Orders</span>
            {myOrders.length > 0 && (
              <span className="absolute top-1.5 right-8 w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('support')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              activeTab === 'support' ? 'text-emerald-700 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-[10px] leading-none">Support</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

// --- SUB-COMPONENT: PRODUCT CARD FOR CUSTOMER APP ---
interface CustomerProductCardProps {
  product: Product;
  onAddToCart: (product: Product, variant: Variant, quantity: number) => void;
  onOpenDetails: () => void;
}

const CustomerProductCard: React.FC<CustomerProductCardProps> = ({
  product,
  onAddToCart,
  onOpenDetails
}) => {
  // Default to first variant
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product.variants[0]?.variantId || ''
  );

  const activeVariant = useMemo(() => {
    return product.variants.find(v => v.variantId === selectedVariantId) || product.variants[0];
  }, [product, selectedVariantId]);

  const isOutOfStock = !activeVariant || activeVariant.status === 'OUT_OF_STOCK' || activeVariant.stockQuantity <= 0;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs hover:shadow-xs transition-all space-y-3">
      {/* Top row: Photo, Title, Category */}
      <div className="flex gap-3">
        {/* Product Photo */}
        <div
          onClick={onOpenDetails}
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 cursor-pointer flex items-center justify-center relative"
        >
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="text-center p-2">
              <Package className="w-6 h-6 text-slate-300 mx-auto" />
              <span className="text-[9px] font-bold text-slate-400">Certified</span>
            </div>
          )}

          {activeVariant?.offer && (
            <span className="absolute top-1 left-1 bg-emerald-600 text-white font-extrabold text-[8px] px-1 py-0.2 rounded shadow-xs">
              {activeVariant.offer}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
              {product.category || 'Cleaning'}
            </span>
            {isOutOfStock ? (
              <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                Out of Stock
              </span>
            ) : (
              <span className="text-[9px] font-semibold text-emerald-600">
                In Stock ({activeVariant?.stockQuantity})
              </span>
            )}
          </div>

          <h3
            onClick={onOpenDetails}
            className="font-extrabold text-sm text-slate-900 truncate mt-1 cursor-pointer hover:text-emerald-700 transition-colors"
          >
            {product.name}
          </h3>

          {product.tagline && (
            <p className="text-[11px] text-slate-500 line-clamp-1">{product.tagline}</p>
          )}

          {/* Pricing Display */}
          {activeVariant && (
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="text-base font-black font-mono text-emerald-800">
                ₹{activeVariant.sellingPrice}
              </span>
              {activeVariant.mrp > activeVariant.sellingPrice && (
                <span className="text-xs text-slate-400 line-through font-mono">
                  ₹{activeVariant.mrp}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Variant Pills Selector (250 ML, 500 ML, 1 Liter, 5 Liter) */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-semibold text-slate-500">Select Packaging Size:</span>
          {activeVariant && (
            <span className="font-mono font-bold text-slate-700">₹{activeVariant.sellingPrice} / {activeVariant.size}</span>
          )}
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {product.variants.map(v => {
            const isSelected = selectedVariantId === v.variantId;
            const vOutOfStock = v.status === 'OUT_OF_STOCK' || v.stockQuantity <= 0;

            return (
              <button
                key={v.variantId}
                type="button"
                onClick={() => setSelectedVariantId(v.variantId)}
                className={`py-1.5 px-1 rounded-xl text-center font-bold text-[10px] transition-all border ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                    : vOutOfStock
                    ? 'border-slate-200 bg-slate-50 text-slate-400 line-through'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="truncate">{v.size}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Row */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={onOpenDetails}
          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
        >
          <Info className="w-3.5 h-3.5" />
          <span>Details</span>
        </button>

        <button
          onClick={() => activeVariant && onAddToCart(product, activeVariant, 1)}
          disabled={isOutOfStock}
          className="flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Add to Basket</span>
        </button>
      </div>
    </div>
  );
};
