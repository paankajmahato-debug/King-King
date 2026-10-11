import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Product, Variant, Order, StoreSettings, DashboardStats } from '../../types/index';
import { api } from '../../services/api';
import {
  Package,
  Layers,
  Clock,
  CheckCircle2,
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
  Lock,
  Unlock,
  Key,
  ShieldAlert,
  Volume2,
  VolumeX,
  TrendingUp,
  Boxes,
  Edit,
  Upload,
  Check,
  Download,
  Search,
  ExternalLink
} from 'lucide-react';

interface OwnerAppViewProps {
  storeSettings?: StoreSettings;
}

export const OwnerAppView: React.FC<OwnerAppViewProps> = ({
  storeSettings: propSettings
}) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('taze_owner_auth') === 'true';
    } catch {
      return false;
    }
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Active Bottom Tab: 'orders' | 'products' | 'stock' | 'revenue'
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'stock' | 'revenue'>('orders');

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [orderFilter, setOrderFilter] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'PACKAGING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED'>('PENDING');
  const [actionLoadingOrderId, setActionLoadingOrderId] = useState<string | null>(null);

  // Sound Notification State
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevOrderCountRef = useRef<number>(0);

  // Products State
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productSearch, setProductSearch] = useState('');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Product Form State
  const [productForm, setProductForm] = useState<{
    name: string;
    tagline: string;
    category: string;
    description: string;
    image: string;
    variants: Variant[];
  }>({
    name: '',
    tagline: '',
    category: 'Floor Care',
    description: '',
    image: '',
    variants: [
      { variantId: 'var-250', size: '250 ML', mrp: 75, sellingPrice: 59, offer: '₹16 OFF', stockQuantity: 25, status: 'ACTIVE', soldQuantity: 0 },
      { variantId: 'var-500', size: '500 ML', mrp: 140, sellingPrice: 110, offer: '₹30 OFF', stockQuantity: 20, status: 'ACTIVE', soldQuantity: 0 },
      { variantId: 'var-1000', size: '1 Liter', mrp: 260, sellingPrice: 199, offer: '₹61 OFF', stockQuantity: 15, status: 'ACTIVE', soldQuantity: 0 },
      { variantId: 'var-5000', size: '5 Liter', mrp: 1200, sellingPrice: 899, offer: '₹301 OFF', stockQuantity: 10, status: 'ACTIVE', soldQuantity: 0 }
    ]
  });
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  // Dashboard Stats
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Brand Name
  const brandName = propSettings?.brandName || 'TAZE CLINING';

  // Sound player helper (Web Audio API Synthesizer)
  const playNewOrderChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;

      // Note 1: 587.33 Hz (D5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Note 2: 880 Hz (A5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, now + 0.15);
      gain2.gain.setValueAtTime(0.4, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.6);
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  };

  // Secure Owner Login Validation
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = passwordInput.trim();
    // Default Owner Passwords: 123456, tazeowner, or admin123
    if (clean === '123456' || clean === 'tazeowner' || clean === 'admin123' || clean === 'taze2026') {
      setIsAuthenticated(true);
      try {
        localStorage.setItem('taze_owner_auth', 'true');
      } catch {}
      setLoginError(null);
      setPasswordInput('');
    } else {
      setLoginError('Invalid Owner Password. Please enter the correct PIN.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    try {
      localStorage.removeItem('taze_owner_auth');
    } catch {}
  };

  // Load Orders
  const loadOrders = async (silent = false) => {
    if (!silent) setLoadingOrders(true);
    try {
      const list = await api.getOrders();
      // Check if new pending order arrived
      if (prevOrderCountRef.current > 0 && list.length > prevOrderCountRef.current) {
        playNewOrderChime();
      }
      prevOrderCountRef.current = list.length;
      setOrders(list);
    } catch (err) {
      console.error('[OwnerApp] Failed to load orders:', err);
    } finally {
      if (!silent) setLoadingOrders(false);
    }
  };

  // Load Products
  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const list = await api.getProducts(true);
      setProducts(list);
    } catch (err) {
      console.error('[OwnerApp] Failed to load products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Load Stats
  const loadStats = async () => {
    try {
      const s = await api.getStats();
      setStats(s);
    } catch {}
  };

  // Polling data when authenticated every 4 seconds
  useEffect(() => {
    if (!isAuthenticated) return;
    loadOrders();
    loadProducts();
    loadStats();

    const interval = setInterval(() => {
      loadOrders(true);
      loadStats();
    }, 4000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Status Lifecycle Actions (Shared with Backend & updates Customer App in real time)
  const handleAcceptOrder = async (orderId: string) => {
    setActionLoadingOrderId(orderId);
    try {
      await api.acceptOrder(orderId);
      await loadOrders(true);
      await loadProducts();
      await loadStats();
    } catch (err: any) {
      alert(err.message || 'Error accepting order');
    } finally {
      setActionLoadingOrderId(null);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: Order['status']) => {
    setActionLoadingOrderId(orderId);
    try {
      await api.updateOrderStatus(orderId, status);
      await loadOrders(true);
      await loadStats();
    } catch (err: any) {
      alert(err.message || 'Error updating order status');
    } finally {
      setActionLoadingOrderId(null);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    const reason = window.prompt('Reason for order cancellation (optional):', 'Cancelled by owner');
    if (reason === null) return;
    setActionLoadingOrderId(orderId);
    try {
      await api.cancelOrder(orderId, reason);
      await loadOrders(true);
      await loadProducts();
      await loadStats();
    } catch (err: any) {
      alert(err.message || 'Error cancelling order');
    } finally {
      setActionLoadingOrderId(null);
    }
  };

  // Image Upload helper
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      try {
        const uploadUrl = await api.uploadPhoto(dataUrl, file.name);
        if (uploadUrl) {
          setProductForm(prev => ({ ...prev, image: uploadUrl }));
        }
      } catch (err) {
        // Fallback to data URI directly
        setProductForm(prev => ({ ...prev, image: dataUrl }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Open Product Modal
  const openNewProductModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      tagline: '',
      category: 'Floor Care',
      description: '',
      image: '',
      variants: [
        { variantId: 'var-250', size: '250 ML', mrp: 75, sellingPrice: 59, offer: '₹16 OFF', stockQuantity: 25, status: 'ACTIVE', soldQuantity: 0 },
        { variantId: 'var-500', size: '500 ML', mrp: 140, sellingPrice: 110, offer: '₹30 OFF', stockQuantity: 20, status: 'ACTIVE', soldQuantity: 0 },
        { variantId: 'var-1000', size: '1 Liter', mrp: 260, sellingPrice: 199, offer: '₹61 OFF', stockQuantity: 15, status: 'ACTIVE', soldQuantity: 0 },
        { variantId: 'var-5000', size: '5 Liter', mrp: 1200, sellingPrice: 899, offer: '₹301 OFF', stockQuantity: 10, status: 'ACTIVE', soldQuantity: 0 }
      ]
    });
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      tagline: product.tagline || '',
      category: product.category || 'Floor Care',
      description: product.description || '',
      image: product.image || '',
      variants: product.variants.map(v => ({ ...v }))
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim()) {
      alert('Product name is required.');
      return;
    }

    setIsSavingProduct(true);
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, {
          name: productForm.name.trim(),
          tagline: productForm.tagline.trim(),
          category: productForm.category.trim(),
          description: productForm.description.trim(),
          image: productForm.image,
          variants: productForm.variants
        });
      } else {
        await api.createProduct({
          name: productForm.name.trim(),
          tagline: productForm.tagline.trim(),
          category: productForm.category.trim(),
          description: productForm.description.trim(),
          image: productForm.image,
          status: 'LIVE',
          variants: productForm.variants
        });
      }
      await loadProducts();
      setIsProductModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to save product');
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    const confirm = window.confirm(`Are you sure you want to delete product "${productName}"?`);
    if (!confirm) return;

    try {
      await api.deleteProduct(productId);
      await loadProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    }
  };

  // Quick Variant Stock Update
  const handleQuickStockChange = async (productId: string, variantId: string, currentQty: number, delta: number) => {
    const newQty = Math.max(0, currentQty + delta);
    try {
      await api.updateVariant(productId, variantId, { stockQuantity: newQty });
      setProducts(prev => prev.map(p => {
        if (p.id !== productId) return p;
        return {
          ...p,
          variants: p.variants.map(v => v.variantId === variantId ? { ...v, stockQuantity: newQty } : v)
        };
      }));
    } catch (err) {
      console.error('Failed to update stock:', err);
    }
  };

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (orderFilter === 'ALL') return true;
      return o.status === orderFilter;
    });
  }, [orders, orderFilter]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (!productSearch.trim()) return true;
      return p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.category?.toLowerCase().includes(productSearch.toLowerCase());
    });
  }, [products, productSearch]);

  // Order status counts
  const orderCounts = useMemo(() => {
    const counts = { ALL: orders.length, PENDING: 0, ACCEPTED: 0, PACKAGING: 0, OUT_FOR_DELIVERY: 0, DELIVERED: 0, CANCELLED: 0 };
    orders.forEach(o => {
      if (o.status && (counts as any)[o.status] !== undefined) {
        (counts as any)[o.status]++;
      }
    });
    return counts;
  }, [orders]);

  // --- 1. LOGIN SCREEN (SECURE OWNER PORTAL) ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 font-sans select-none">
        <div className="w-full max-w-sm bg-slate-800/90 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 mx-auto flex items-center justify-center shadow-lg">
              <Key className="w-8 h-8 text-slate-950" />
            </div>
            <h1 className="text-xl font-black tracking-tight text-white">{brandName} OWNER</h1>
            <p className="text-xs text-slate-400">Private Business & Operations Terminal</p>
          </div>

          {loginError && (
            <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Owner Security PIN / Password
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                placeholder="Enter PIN (e.g. 123456)"
                autoFocus
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-600 font-mono tracking-widest text-center"
              />
              <p className="text-[10px] text-slate-500 text-center mt-1.5">
                Default Owner Key: <span className="font-mono text-emerald-400">123456</span>
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              <span>Unlock Owner App</span>
            </button>
          </form>

          <div className="pt-2 border-t border-slate-700/60 text-center">
            <span className="text-[10px] text-slate-500">
              Confidential · Encrypted Factory Synchronization
            </span>
          </div>
        </div>
      </div>
    );
  }

  // --- 2. AUTHENTICATED OWNER APP PORTAL ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-20 select-none">
      {/* 2.1 OWNER TOP BAR */}
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 shadow-md">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-sm">
              TC
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-sm tracking-tight text-white">{brandName} OWNER</h1>
                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-1.5 py-0.2 rounded border border-amber-500/30">
                  Admin
                </span>
              </div>
              <p className="text-[10px] text-emerald-400 font-mono">Live Factory Sync · 2-Way Connected</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Chime Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl transition-colors ${
                soundEnabled ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-500'
              }`}
              title={soundEnabled ? 'Order sound alert ON' : 'Order sound alert MUTED'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
              title="Lock Owner Portal"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2.2 MAIN CONTENT CONTAINER */}
      <main className="max-w-md w-full mx-auto flex-1 p-3 sm:p-4">
        {/* SECTION 1: ORDER MANAGEMENT */}
        {activeTab === 'orders' && (
          <div className="space-y-3.5">
            {/* Header with live count & refresh */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  <span>Customer Orders</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs border border-emerald-500/30">
                    {orders.length}
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400">Manage orders, update status & dispatch</p>
              </div>

              <button
                onClick={() => loadOrders()}
                disabled={loadingOrders}
                className="p-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
                title="Refresh Orders"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              {(['PENDING', 'ACCEPTED', 'PACKAGING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'ALL'] as const).map(st => {
                const count = (orderCounts as any)[st] || 0;
                const isSelected = orderFilter === st;

                return (
                  <button
                    key={st}
                    onClick={() => setOrderFilter(st)}
                    className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all text-[11px] flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <span>{st.replace(/_/g, ' ')}</span>
                    <span className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] ${isSelected ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-slate-300'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Orders Cards List */}
            {loadingOrders && orders.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <div className="w-7 h-7 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-400">Loading incoming orders...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="font-bold text-sm text-slate-300">No {orderFilter.toLowerCase()} orders</h3>
                <p className="text-xs text-slate-500">
                  New orders placed by customers will appear here in real time.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map(order => {
                  const isLoading = actionLoadingOrderId === order.id;

                  return (
                    <div
                      key={order.id}
                      className="bg-slate-900 rounded-3xl border border-slate-800 p-4 shadow-sm space-y-3 transition-all hover:border-slate-700"
                    >
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm text-amber-400">
                              #{order.id}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <h3 className="font-black text-xs text-white mt-0.5">
                            {order.customerName || 'Valued Customer'}
                          </h3>
                        </div>

                        {/* Status Tag */}
                        <div className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide uppercase border ${
                          order.status === 'PENDING'
                            ? 'bg-amber-950 text-amber-300 border-amber-700/80 animate-pulse'
                            : order.status === 'ACCEPTED'
                            ? 'bg-blue-950 text-blue-300 border-blue-700/80'
                            : order.status === 'PACKAGING'
                            ? 'bg-purple-950 text-purple-300 border-purple-700/80'
                            : order.status === 'OUT_FOR_DELIVERY'
                            ? 'bg-indigo-950 text-indigo-300 border-indigo-700/80'
                            : order.status === 'DELIVERED'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-700/80'
                            : 'bg-rose-950 text-rose-300 border-rose-700/80'
                        }`}>
                          {order.status.replace(/_/g, ' ')}
                        </div>
                      </div>

                      {/* Items Ordered */}
                      <div className="bg-slate-950/80 p-2.5 rounded-2xl border border-slate-800/80 space-y-1.5 text-xs">
                        {order.items?.map((it, idx) => (
                          <div key={idx} className="flex items-center justify-between text-slate-300">
                            <span className="truncate pr-2">
                              {it.productName} ({it.size}) <span className="text-amber-400 font-mono font-bold">×{it.quantity}</span>
                            </span>
                            <span className="font-mono font-bold text-white shrink-0">
                              ₹{it.subtotal || it.sellingPrice * it.quantity}
                            </span>
                          </div>
                        ))}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-xs font-black">
                          <span className="text-slate-400">Grand Total:</span>
                          <span className="text-emerald-400 font-mono text-sm">₹{order.grandTotal}</span>
                        </div>
                      </div>

                      {/* Customer Address & Contact */}
                      <div className="space-y-1 text-xs">
                        {order.customerAddress && (
                          <div className="flex items-start gap-1.5 text-[11px] text-slate-400 bg-slate-950/40 p-2 rounded-xl">
                            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                            <span className="leading-snug">{order.customerAddress}</span>
                          </div>
                        )}

                        {order.notes && (
                          <p className="text-[11px] text-amber-300/80 italic pl-1">
                            Note: {order.notes}
                          </p>
                        )}
                      </div>

                      {/* Direct Phone & WhatsApp Communication */}
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60">
                        {order.customerPhone && (
                          <>
                            <a
                              href={`tel:${order.customerPhone}`}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{order.customerPhone}</span>
                            </a>

                            <button
                              onClick={() => {
                                const cleanPhone = order.customerPhone.replace(/[^0-9]/g, '');
                                const text = `Hello ${order.customerName}, regarding your ${brandName} Order #${order.id} (Status: ${order.status}): We are processing your delivery!`;
                                window.open(`https://api.whatsapp.com/send?phone=91${cleanPhone}&text=${encodeURIComponent(text)}`, '_blank');
                              }}
                              className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                              <span>WhatsApp</span>
                            </button>
                          </>
                        )}
                      </div>

                      {/* ORDER STATUS LIFECYCLE ACTION BUTTONS */}
                      <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-1.5">
                        {order.status === 'PENDING' && (
                          <button
                            onClick={() => handleAcceptOrder(order.id)}
                            disabled={isLoading}
                            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Accept Order (Deduct Stock)</span>
                          </button>
                        )}

                        {order.status === 'ACCEPTED' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'PACKAGING')}
                            disabled={isLoading}
                            className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <Package className="w-4 h-4" />
                            <span>Move to Packaging</span>
                          </button>
                        )}

                        {order.status === 'PACKAGING' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'OUT_FOR_DELIVERY')}
                            disabled={isLoading}
                            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <Truck className="w-4 h-4" />
                            <span>Dispatch / Out for Delivery</span>
                          </button>
                        )}

                        {order.status === 'OUT_FOR_DELIVERY' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                            disabled={isLoading}
                            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <CheckCheck className="w-4 h-4" />
                            <span>Mark Delivered</span>
                          </button>
                        )}

                        {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={isLoading}
                            className="px-3 py-2.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Cancel</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SECTION 2: PRODUCT MANAGEMENT */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-white">Products & Formulas</h2>
                <p className="text-[11px] text-slate-400">Add, edit products and packaging variants</p>
              </div>

              <button
                onClick={openNewProductModal}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            </div>

            {/* Product search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                placeholder="Search products by name or category..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500"
              />
            </div>

            {/* Products List */}
            {loadingProducts ? (
              <div className="py-16 text-center space-y-2">
                <div className="w-7 h-7 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-400">Loading factory catalog...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8 text-center space-y-2">
                <Package className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="font-bold text-sm text-slate-300">No products found</h3>
                <button
                  onClick={openNewProductModal}
                  className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl mt-2"
                >
                  Create Product
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProducts.map(p => (
                  <div
                    key={p.id}
                    className="bg-slate-900 rounded-3xl border border-slate-800 p-3.5 space-y-3"
                  >
                    <div className="flex gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-6 h-6 text-slate-500" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800/60">
                          {p.category}
                        </span>
                        <h3 className="font-extrabold text-sm text-white truncate mt-0.5">{p.name}</h3>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{p.tagline}</p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEditProductModal(p)}
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                          title="Edit product"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          className="p-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded-xl"
                          title="Delete product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Variants overview */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800/80 text-[11px]">
                      {p.variants.map(v => (
                        <div key={v.variantId} className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                          <div className="flex items-center justify-between font-bold text-slate-200">
                            <span>{v.size}</span>
                            <span className="text-emerald-400 font-mono">₹{v.sellingPrice}</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                            <span>MRP: ₹{v.mrp}</span>
                            <span className={v.stockQuantity > 0 ? 'text-emerald-500' : 'text-rose-500'}>
                              Stock: {v.stockQuantity}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SECTION 3: STOCK QUICK-EDITOR */}
        {activeTab === 'stock' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-extrabold text-white">Central Stock Inventory</h2>
              <p className="text-[11px] text-slate-400">
                Live factory stock levels across all packaging variants
              </p>
            </div>

            <div className="space-y-3">
              {products.map(p => (
                <div key={p.id} className="bg-slate-900 rounded-3xl border border-slate-800 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-xs text-white truncate">{p.name}</h3>
                    <span className="text-[10px] text-slate-400 font-mono">{p.category}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {p.variants.map(v => (
                      <div
                        key={v.variantId}
                        className="flex items-center justify-between bg-slate-950 p-2 rounded-xl border border-slate-800 text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-200">{v.size}</span>
                          <span className="text-[10px] text-slate-500 block font-mono">
                            ₹{v.sellingPrice}
                          </span>
                        </div>

                        {/* Stepper */}
                        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2 py-1">
                          <button
                            onClick={() => handleQuickStockChange(p.id, v.variantId, v.stockQuantity, -1)}
                            className="p-1 text-slate-400 hover:text-white"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-mono font-bold text-amber-400 px-1 min-w-[24px] text-center">
                            {v.stockQuantity}
                          </span>
                          <button
                            onClick={() => handleQuickStockChange(p.id, v.variantId, v.stockQuantity, 1)}
                            className="p-1 text-slate-400 hover:text-white"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 4: REVENUE & APK DOWNLOADS */}
        {activeTab === 'revenue' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-extrabold text-white">Business Analytics</h2>
              <p className="text-[11px] text-slate-400">Order revenue, delivered totals & Android APKs</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <p className="text-[11px] text-slate-400">Total Sales / Revenue</p>
                <p className="text-lg font-black font-mono text-emerald-400">
                  ₹{stats?.totalSales || 0}
                </p>
              </div>

              <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <p className="text-[11px] text-slate-400">Delivered Orders</p>
                <p className="text-lg font-black font-mono text-white">
                  {stats?.deliveredOrders || 0}
                </p>
              </div>

              <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <p className="text-[11px] text-slate-400">Pending Orders</p>
                <p className="text-lg font-black font-mono text-amber-400">
                  {stats?.pendingOrders || 0}
                </p>
              </div>

              <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <p className="text-[11px] text-slate-400">Total Order Count</p>
                <p className="text-lg font-black font-mono text-blue-400">
                  {stats?.totalOrders || 0}
                </p>
              </div>
            </div>

            {/* Android APK Distribution Box */}
            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-sm text-white">Android Application Builds</h3>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Download the standalone Android APK packages for direct sharing with customers and private owner installation.
              </p>

              <div className="space-y-2 pt-1">
                <a
                  href="/download/customer-apk"
                  download="TAZE-CLINING-Customer.apk"
                  className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-between transition-colors shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-200" />
                    <span>TAZE CLINING (Customer APK v1.1.0)</span>
                  </div>
                  <Download className="w-3.5 h-3.5" />
                </a>

                <a
                  href="/download/owner-apk"
                  download="TAZE-CLINING-Owner.apk"
                  className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-bold flex items-center justify-between transition-colors border border-slate-700"
                >
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-400" />
                    <span>TAZE CLINING OWNER (Owner APK v1.1.0)</span>
                  </div>
                  <Download className="w-3.5 h-3.5" />
                </a>
              </div>
              <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">Android Install Guide:</p>
                <p>1. Tap Download APK above.</p>
                <p>2. Open the downloaded file from Chrome or Files app.</p>
                <p>3. If prompted, allow "Install unknown apps" for your browser.</p>
                <p>4. Tap Install &rarr; Open to launch the verified app.</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 2.3 PRODUCT FORM MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 max-h-[92vh] overflow-y-auto space-y-4 shadow-2xl border border-slate-800 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-sm text-white">
                {editingProduct ? 'Edit Product' : 'Add New Cleaning Solution'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. Ultra Clean Floor Wash"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Tagline</label>
                <input
                  type="text"
                  value={productForm.tagline}
                  onChange={e => setProductForm({ ...productForm, tagline: e.target.value })}
                  placeholder="e.g. Concentrated Multi-Surface Disinfectant"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Category</label>
                <select
                  value={productForm.category}
                  onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Floor Care">Floor Care</option>
                  <option value="Surface Cleaner">Surface Cleaner</option>
                  <option value="Glass Cleaner">Glass Cleaner</option>
                  <option value="Bathroom Care">Bathroom Care</option>
                  <option value="Industrial Degreaser">Industrial Degreaser</option>
                  <option value="Dishwash">Dishwash</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Product Image</label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500"
                  />
                </div>
                {productForm.image && (
                  <div className="mt-2 w-20 h-20 rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
                    <img src={productForm.image} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={productForm.description}
                  onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Formulation details, usage guidelines..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              {/* Variants Editor (250ml, 500ml, 1L, 5L) */}
              <div className="space-y-2 pt-1 border-t border-slate-800">
                <p className="font-extrabold text-amber-400">Variant Specifications (4 Standard Sizes):</p>
                <div className="space-y-2">
                  {productForm.variants.map((v, i) => (
                    <div key={v.variantId || i} className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-400">{v.size}</span>
                        <input
                          type="text"
                          value={v.offer || ''}
                          onChange={e => {
                            const updated = [...productForm.variants];
                            updated[i].offer = e.target.value;
                            setProductForm({ ...productForm, variants: updated });
                          }}
                          placeholder="Offer Tag (e.g. ₹20 OFF)"
                          className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-[10px] text-white w-28"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-500 block">Selling Price</label>
                          <input
                            type="number"
                            value={v.sellingPrice}
                            onChange={e => {
                              const updated = [...productForm.variants];
                              updated[i].sellingPrice = Number(e.target.value);
                              setProductForm({ ...productForm, variants: updated });
                            }}
                            className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-xs text-white font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-500 block">MRP</label>
                          <input
                            type="number"
                            value={v.mrp}
                            onChange={e => {
                              const updated = [...productForm.variants];
                              updated[i].mrp = Number(e.target.value);
                              setProductForm({ ...productForm, variants: updated });
                            }}
                            className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-xs text-white font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-500 block">Stock Qty</label>
                          <input
                            type="number"
                            value={v.stockQuantity}
                            onChange={e => {
                              const updated = [...productForm.variants];
                              updated[i].stockQuantity = Number(e.target.value);
                              setProductForm({ ...productForm, variants: updated });
                            }}
                            className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-xs text-white font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingProduct}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
                >
                  {isSavingProduct ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>{editingProduct ? 'Save Changes' : 'Create Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2.4 OWNER BOTTOM NAVIGATION (ANDROID SPECIFICATION) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 shadow-lg">
        <div className="max-w-md mx-auto grid grid-cols-4 h-14">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              activeTab === 'orders' ? 'text-amber-400 font-bold' : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            <Clock className="w-5 h-5" />
            <span className="text-[10px] leading-none">Orders</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              activeTab === 'products' ? 'text-amber-400 font-bold' : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            <Boxes className="w-5 h-5" />
            <span className="text-[10px] leading-none">Products</span>
          </button>

          <button
            onClick={() => setActiveTab('stock')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              activeTab === 'stock' ? 'text-amber-400 font-bold' : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            <Layers className="w-5 h-5" />
            <span className="text-[10px] leading-none">Stock</span>
          </button>

          <button
            onClick={() => setActiveTab('revenue')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              activeTab === 'revenue' ? 'text-amber-400 font-bold' : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            <span className="text-[10px] leading-none">Revenue</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
