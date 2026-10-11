import React, { useState, useEffect, useCallback } from 'react';
import type { Product, Variant, Order, OrderStatus } from '../types/index';
import { api } from '../services/api';
import { ProductCard } from './ProductCard';
import { MyOrderSection } from './MyOrderSection';
import { createWhatsAppOrderLink } from '../utils/whatsapp';
import {
  Clock,
  CheckCircle2,
  Package,
  Truck,
  CheckCheck,
  XCircle,
  RefreshCw,
  Search,
  Copy,
  Check,
  ShoppingBag,
  MapPin,
  MessageCircle,
  Calendar,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Globe,
  Share2
} from 'lucide-react';
import { getDirectPublicOrderUrl, getPublicCustomerOrderUrl, PERMANENT_FIXED_CUSTOMER_ORDER_URL, PERMANENT_FIXED_PUBLIC_DOMAIN } from '../utils/urlHelper';

interface CustomerOrderPageProps {
  customerRef?: string;
  onUpdateCustomerRef?: (newRef: string) => void;
  brandName?: string;
  products: Product[];
  onAddToCart: (product: Product, variant: Variant, quantity: number) => void;
  onQuickWhatsApp: (product: Product, variant: Variant, quantity: number) => void;
  onOpenCart: () => void;
  cartCount: number;
  latestPlacedOrder?: Order | null;
}

export const CustomerOrderPage: React.FC<CustomerOrderPageProps> = ({
  customerRef,
  onUpdateCustomerRef,
  brandName = 'TAZE CLINING',
  products,
  onAddToCart,
  onQuickWhatsApp,
  onOpenCart,
  cartCount,
  latestPlacedOrder
}) => {
  // Store recent order placed in this browser session
  const [activeSessionOrder, setActiveSessionOrder] = useState<Order | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('taze_session_order');
        if (stored) {
          return JSON.parse(stored);
        }
      } catch {}
    }
    return latestPlacedOrder || null;
  });

  const [loadingOrderStatus, setLoadingOrderStatus] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [copiedPageUrl, setCopiedPageUrl] = useState(false);

  // Catalog filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Synchronize when a new order is placed from the cart
  useEffect(() => {
    if (latestPlacedOrder) {
      setActiveSessionOrder(latestPlacedOrder);
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('taze_session_order', JSON.stringify(latestPlacedOrder));
        } catch {}
      }
    }
  }, [latestPlacedOrder]);

  // Real-time live status polling for the customer's placed order (every 4s)
  const refreshActiveOrderStatus = useCallback(async (silent = false) => {
    if (!activeSessionOrder?.id) return;

    if (!silent) setLoadingOrderStatus(true);
    try {
      const res = await api.getOrder(activeSessionOrder.id);
      if (res && res.id) {
        setActiveSessionOrder(prev => (prev ? { ...prev, ...res, status: res.status } : res));
        setLastRefreshedAt(new Date());
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem('taze_session_order', JSON.stringify({ ...activeSessionOrder, ...res }));
          } catch {}
        }
      }
    } catch {
      // If error, preserve current order state without disrupting customer view
    } finally {
      if (!silent) setLoadingOrderStatus(false);
    }
  }, [activeSessionOrder?.id]);

  useEffect(() => {
    if (!activeSessionOrder?.id) return;

    const interval = setInterval(() => {
      refreshActiveOrderStatus(true);
    }, 4000);

    return () => clearInterval(interval);
  }, [activeSessionOrder?.id, refreshActiveOrderStatus]);

  // 5-Step Status Sequence per Specification
  const STATUS_STEPS: Array<{ key: OrderStatus; label: string; desc: string }> = [
    { key: 'PENDING', label: 'Pending', desc: 'Order received & under review' },
    { key: 'ACCEPTED', label: 'Accepted', desc: 'Confirmed & stock reserved' },
    { key: 'PACKAGING', label: 'Packaging', desc: 'Packed & quality sealed' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'Dispatched with courier' },
    { key: 'DELIVERED', label: 'Delivered', desc: 'Delivered to address' }
  ];

  const getStepState = (stepKey: OrderStatus, currentStatus: OrderStatus) => {
    const orderSequence = ['PENDING', 'ACCEPTED', 'PACKAGING', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    const currentIdx = orderSequence.indexOf(currentStatus);
    const stepIdx = orderSequence.indexOf(stepKey);

    if (currentStatus === 'CANCELLED') {
      return { isCompleted: false, isCurrent: false, isCancelled: true };
    }
    if (stepIdx < currentIdx) {
      return { isCompleted: true, isCurrent: false, isCancelled: false };
    }
    if (stepIdx === currentIdx) {
      return { isCompleted: true, isCurrent: true, isCancelled: false };
    }
    return { isCompleted: false, isCurrent: false, isCancelled: false };
  };

  const renderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
            PENDING
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-900 border border-sky-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-sky-700" />
            ACCEPTED
          </span>
        );
      case 'PACKAGING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-300">
            <Package className="w-3.5 h-3.5 text-purple-700" />
            PACKAGING
          </span>
        );
      case 'OUT_FOR_DELIVERY':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-900 border border-indigo-300">
            <Truck className="w-3.5 h-3.5 text-indigo-700 animate-bounce" />
            OUT FOR DELIVERY
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <CheckCheck className="w-3.5 h-3.5 text-emerald-700" />
            DELIVERED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-700" />
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  };

  // Product filtering
  const categories = ['All', 'Floor Care', 'Disinfection', 'Glass Care', 'Sanitary', 'Toilet Care', 'Kitchen'];
  const safeProducts = Array.isArray(products) ? products : [];
  const visibleProducts = safeProducts.filter(p => {
    if (!p || p.status === 'INACTIVE') return false;
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner / Customer Context Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              DIRECT CUSTOMER ORDER PORTAL
            </span>
            {customerRef && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-500" />
                <span>LINK REF: {customerRef}</span>
              </span>
            )}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-display mt-1.5 tracking-tight">
            {brandName} Professional Hygiene Solutions
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Select products and variants below. Prices and stock sync directly from our production database in real time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Share / Copy Permanent Fixed Public Order Link */}
          <button
            type="button"
            onClick={() => {
              const url = customerRef ? getPublicCustomerOrderUrl(customerRef) : getDirectPublicOrderUrl();
              navigator.clipboard.writeText(url);
              setCopiedPageUrl(true);
              setTimeout(() => setCopiedPageUrl(false), 2000);
            }}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-all border border-slate-200 flex items-center gap-1.5 active:scale-95"
            title="Copy Permanent Fixed Public Order URL"
          >
            {copiedPageUrl ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy Order Link</span>
              </>
            )}
          </button>

          {/* Basket Trigger */}
          <button
            onClick={onOpenCart}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 active:scale-95"
          >
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <span>Order Basket</span>
            {cartCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[11px] font-mono-nums font-bold">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Permanent Fixed Public Customer Order Link Box */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white rounded-2xl p-4 sm:p-5 border border-emerald-800/80 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Permanent Fixed Public Link · Active
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Open to all customers on any phone or browser
              </span>
            </div>
            <div className="flex items-center gap-2 pt-0.5">
              <code className="text-emerald-300 font-mono text-xs sm:text-sm font-bold truncate select-all bg-black/40 px-3 py-1.5 rounded-xl border border-emerald-800/60 max-w-full sm:max-w-xl">
                {customerRef ? getPublicCustomerOrderUrl(customerRef) : getDirectPublicOrderUrl()}
              </code>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                const url = customerRef ? getPublicCustomerOrderUrl(customerRef) : getDirectPublicOrderUrl();
                navigator.clipboard.writeText(url);
                setCopiedPageUrl(true);
                setTimeout(() => setCopiedPageUrl(false), 2000);
              }}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
            >
              {copiedPageUrl ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Public Link</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                const url = customerRef ? getPublicCustomerOrderUrl(customerRef) : getDirectPublicOrderUrl();
                const text = `Order directly with ${brandName}:\n${url}\n\nSelect hygiene products and size variants (250 ML, 500 ML, 1 L, 5 L). Direct factory dispatch!`;
                const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
                window.open(waUrl, '_blank');
              }}
              className="px-3.5 py-2 bg-emerald-900 hover:bg-emerald-800 text-emerald-200 border border-emerald-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
              title="Share permanent customer order link via WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Share WhatsApp</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: LIVE ORDER STATUS CARD (ONLY SHOWN FOR THE CURRENT CUSTOMER'S PLACED ORDER) */}
      {activeSessionOrder && (
        <div className="bg-white rounded-2xl border-2 border-emerald-500/40 p-5 sm:p-6 shadow-sm space-y-5 animate-in fade-in duration-200">
          {/* Status Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Your Placed Order
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg sm:text-xl font-extrabold text-slate-900 font-mono">
                  {activeSessionOrder.id}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(activeSessionOrder.id);
                    setCopiedOrderId(true);
                    setTimeout(() => setCopiedOrderId(false), 2000);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                  title="Copy Order ID"
                >
                  {copiedOrderId ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                <span>Customer: <strong className="text-slate-800">{activeSessionOrder.customerName}</strong></span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Placed on {new Date(activeSessionOrder.createdAt).toLocaleDateString()}</span>
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:items-end gap-2">
              <div>{renderStatusBadge(activeSessionOrder.status)}</div>
              <button
                type="button"
                onClick={() => refreshActiveOrderStatus(false)}
                disabled={loadingOrderStatus}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors self-start sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingOrderStatus ? 'animate-spin text-emerald-600' : ''}`} />
                <span>
                  {loadingOrderStatus ? 'Syncing...' : lastRefreshedAt ? `Updated ${lastRefreshedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Refresh Status'}
                </span>
              </button>
            </div>
          </div>

          {/* Unified 5-Step Order Status Progress Timeline */}
          {activeSessionOrder.status !== 'CANCELLED' ? (
            <div className="p-4 sm:p-5 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  <span>Order Lifecycle Timeline</span>
                </span>
                <span className="text-xs font-semibold text-slate-600">
                  Current Status: <strong className="text-emerald-700">{activeSessionOrder.status}</strong>
                </span>
              </div>

              {/* Responsive Progress Stepper */}
              <div className="grid grid-cols-5 gap-2 pt-1">
                {STATUS_STEPS.map((s, idx) => {
                  const state = getStepState(s.key, activeSessionOrder.status);
                  return (
                    <div key={s.key} className="flex flex-col items-center text-center">
                      {/* Step Indicator Bar / Circle */}
                      <div className="relative w-full flex items-center justify-center mb-2">
                        {/* Connecting bar */}
                        {idx > 0 && (
                          <div
                            className={`absolute left-0 right-1/2 top-1/2 -translate-y-1/2 h-1 -z-0 ${
                              state.isCompleted ? 'bg-emerald-600' : 'bg-slate-200'
                            }`}
                          />
                        )}
                        {idx < 4 && (
                          <div
                            className={`absolute left-1/2 right-0 top-1/2 -translate-y-1/2 h-1 -z-0 ${
                              getStepState(STATUS_STEPS[idx + 1].key, activeSessionOrder.status).isCompleted
                                ? 'bg-emerald-600'
                                : 'bg-slate-200'
                            }`}
                          />
                        )}

                        {/* Node Symbol: ✓ for completed, ● for current active, number for upcoming */}
                        <div
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold relative z-10 transition-all shadow-2xs ${
                            state.isCurrent
                              ? 'bg-emerald-600 text-white ring-4 ring-emerald-500/20 scale-105'
                              : state.isCompleted
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white border-2 border-slate-300 text-slate-400'
                          }`}
                        >
                          {state.isCompleted && !state.isCurrent ? (
                            <Check className="w-4 h-4 text-white" />
                          ) : state.isCurrent ? (
                            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                          ) : (
                            <span className="text-[11px] font-mono">{idx + 1}</span>
                          )}
                        </div>
                      </div>

                      {/* Step Label */}
                      <span
                        className={`text-[11px] sm:text-xs font-bold leading-tight ${
                          state.isCurrent
                            ? 'text-emerald-800 font-extrabold'
                            : state.isCompleted
                            ? 'text-slate-800'
                            : 'text-slate-400'
                        }`}
                      >
                        {s.label}
                      </span>
                      <span className="text-[10px] text-slate-400 hidden sm:block mt-0.5">
                        {s.desc}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Status Explanation Box */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-600">
                {activeSessionOrder.status === 'PENDING' && (
                  <div>
                    <strong className="text-amber-800 block">Step 1: Order Pending Merchant Verification</strong>
                    Your order is safely recorded. Central inventory will be deducted upon store owner acceptance.
                  </div>
                )}
                {activeSessionOrder.status === 'ACCEPTED' && (
                  <div>
                    <strong className="text-sky-800 block">Step 2: Order Accepted & Confirmed</strong>
                    Store owner has approved your order! Items are reserved from central inventory and sent to packaging.
                  </div>
                )}
                {activeSessionOrder.status === 'PACKAGING' && (
                  <div>
                    <strong className="text-purple-800 block">Step 3: Packaging & Quality Seal</strong>
                    Your hygiene bottles are being inspected, sealed, and packaged in dispatch cartons.
                  </div>
                )}
                {activeSessionOrder.status === 'OUT_FOR_DELIVERY' && (
                  <div>
                    <strong className="text-indigo-800 block">Step 4: Out for Delivery</strong>
                    Your order has departed our distribution center and is out for doorstep delivery.
                  </div>
                )}
                {activeSessionOrder.status === 'DELIVERED' && (
                  <div>
                    <strong className="text-emerald-800 block">Step 5: Order Delivered</strong>
                    Package delivered successfully to your address. Thank you for choosing {brandName}!
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-bold">
              Order was cancelled by store.
            </div>
          )}

          {/* Ordered Products Table & Totals */}
          {/* Ordered Products Table & Totals */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ordered Items</span>
              </h4>
              <span className="text-[11px] text-slate-500 font-mono-nums">
                {Array.isArray(activeSessionOrder.items) ? activeSessionOrder.items.length : 0} items
              </span>
            </div>

            <div className="divide-y divide-slate-100 p-4 space-y-2">
              {Array.isArray(activeSessionOrder.items) && activeSessionOrder.items.length > 0 ? (
                activeSessionOrder.items.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">{it.productName || 'Cleaning Product'}</span>
                      <span className="text-slate-500 text-[11px]">
                        Size: <strong className="text-emerald-700">{it.size || 'Standard'}</strong> · Qty: <strong>{it.quantity || 1}</strong> · Rate: ₹{it.sellingPrice || 0}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-slate-900 font-mono-nums text-sm">
                        ₹{it.subtotal || 0}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-2 text-xs text-slate-500">Order recorded in database.</div>
              )}
            </div>

            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-sm">
              <span className="font-bold text-slate-700">Order Total:</span>
              <span className="text-base font-extrabold text-slate-900 font-mono-nums">
                ₹{activeSessionOrder.grandTotal}
              </span>
            </div>
          </div>

          {/* WhatsApp Direct Action Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <a
              href={createWhatsAppOrderLink(activeSessionOrder, '919242150040', brandName)}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors shadow-xs"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>SEND ORDER ON WHATSAPP (+91 9242150040)</span>
            </a>

            <button
              type="button"
              onClick={() => {
                setActiveSessionOrder(null);
                try {
                  sessionStorage.removeItem('taze_session_order');
                } catch {}
              }}
              className="text-xs text-slate-400 hover:text-slate-600 underline"
            >
              Dismiss Order Card
            </button>
          </div>
        </div>
      )}

      {/* SECTION 2: PRODUCT CATALOG (SELECT PRODUCTS & ADD TO BASKET) */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 font-display">
              {brandName} Products & Variants
            </h2>
            <p className="text-xs text-slate-500">
              Select product sizes (250 ml, 500 ml, 1 Liter, 5 Liter) and add to basket for immediate order dispatch.
            </p>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {visibleProducts.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-2xl border border-slate-200">
            <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <h3 className="text-sm font-semibold text-slate-800">No products match this filter</h3>
            <p className="text-xs text-slate-500 mt-1">Try selecting another category or clear search query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {visibleProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                brandName={brandName}
                onAddToCart={onAddToCart}
                onQuickWhatsApp={onQuickWhatsApp}
              />
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: MY ORDER / ORDER STATUS LOOKUP BY ORDER ID */}
      <div className="pt-6 border-t border-slate-200">
        <MyOrderSection
          initialOrderId={activeSessionOrder?.id || ''}
          onOrderFound={foundId => {
            if (activeSessionOrder?.id !== foundId) {
              refreshActiveOrderStatus(false);
            }
          }}
        />
      </div>
    </div>
  );
};
