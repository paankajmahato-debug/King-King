import React, { useState, useEffect } from 'react';
import type { Order, CustomerProfile } from '../types/index';
import { api } from '../services/api';
import { getPublicOrderTrackingUrl } from '../utils/urlHelper';
import {
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Calendar,
  User,
  Phone,
  MapPin,
  Package,
  Copy,
  Check,
  MessageCircle,
  Truck,
  CheckCheck,
  ShieldCheck,
  ChevronRight,
  ShoppingBag,
  LogIn
} from 'lucide-react';

interface OrderTrackerProps {
  initialOrderId?: string;
  onBackToStore: () => void;
  brandName?: string;
  customerProfile?: CustomerProfile | null;
  onOpenCustomerLogin?: () => void;
}

export const OrderTracker: React.FC<OrderTrackerProps> = ({
  initialOrderId = '',
  onBackToStore,
  brandName = 'TAZE CLINING',
  customerProfile = null,
  onOpenCustomerLogin
}) => {
  const [orderIdInput, setOrderIdInput] = useState(initialOrderId);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Fetch logged-in customer's orders from database
  const loadCustomerOrders = async (silent = false) => {
    if (!customerProfile) return;
    if (!silent) setLoadingOrders(true);
    try {
      const orders = await api.getCustomerOrders();
      setMyOrders(orders);
      // If an order was previously selected, keep it updated in sync with latest backend status
      if (selectedOrder) {
        const fresh = orders.find(o => o.id === selectedOrder.id);
        if (fresh) setSelectedOrder(fresh);
      }
    } catch {
      // Non-blocking fallback
    } finally {
      if (!silent) setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (customerProfile) {
      loadCustomerOrders();
      // Poll every 6 seconds to automatically sync Admin status updates live
      const interval = setInterval(() => {
        loadCustomerOrders(true);
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [customerProfile]);

  const fetchOrderDetails = async (idToSearch: string) => {
    if (!idToSearch.trim()) return;
    setLoadingSearch(true);
    setError(null);
    try {
      const data = await api.getOrder(idToSearch.trim());
      setSelectedOrder(data);
    } catch (err: any) {
      setSelectedOrder(null);
      setError(err.message || 'Order not found. Please verify your Order ID.');
    } finally {
      setLoadingSearch(false);
    }
  };

  useEffect(() => {
    if (initialOrderId) {
      fetchOrderDetails(initialOrderId);
    }
  }, [initialOrderId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrderDetails(orderIdInput);
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5" />
            PENDING VERIFICATION
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            ACCEPTED & RESERVED
          </span>
        );
      case 'PACKAGING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">
            <Package className="w-3.5 h-3.5" />
            PACKAGING
          </span>
        );
      case 'OUT_FOR_DELIVERY':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
            <Truck className="w-3.5 h-3.5" />
            OUT FOR DELIVERY
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCheck className="w-3.5 h-3.5" />
            DELIVERED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5" />
            CANCELLED
          </span>
        );
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToStore}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Store
        </button>
        <div className="flex items-center gap-2">
          {customerProfile && (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              Customer: {customerProfile.name}
            </span>
          )}
        </div>
      </div>

      {/* SECTION 1: MY ORDERS (AUTOMATICALLY POPULATED FOR LOGGED-IN CUSTOMER) */}
      {customerProfile ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-display flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
                <span>My Orders</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  {myOrders.length}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Orders linked permanently to Customer ID: <strong className="font-mono text-slate-700">{customerProfile.customerId}</strong>
              </p>
            </div>
            <button
              onClick={() => loadCustomerOrders()}
              disabled={loadingOrders}
              className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors"
              title="Refresh Orders"
            >
              <RefreshCw className={`w-4 h-4 ${loadingOrders ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {myOrders.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No orders placed yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Select your cleaning solutions from the catalog to place your first direct order.
              </p>
              <button
                onClick={onBackToStore}
                className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                Browse Catalog
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myOrders.map(ord => {
                const isSelected = selectedOrder?.id === ord.id;
                return (
                  <div
                    key={ord.id}
                    onClick={() => {
                      setSelectedOrder(ord);
                      setOrderIdInput(ord.id);
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-slate-900 text-sm">
                            {ord.id}
                          </span>
                          <span className="text-[11px] text-slate-400">·</span>
                          <span className="text-[11px] text-slate-500">
                            {new Date(ord.createdAt).toLocaleDateString()} at{' '}
                            {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      <div>{getStatusBadge(ord.status)}</div>
                    </div>

                    <div className="pt-2.5 flex items-center justify-between text-xs">
                      <div className="text-slate-600 line-clamp-1 max-w-md">
                        {ord.items.map(it => `${it.productName} (${it.size}) × ${it.quantity}`).join(', ')}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-extrabold text-slate-900 font-mono-nums text-sm">
                          ₹{ord.grandTotal}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {/* SECTION 2: SEARCH DIRECT ORDER ID */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 font-display">
          {selectedOrder ? 'Order Tracking Timeline' : 'Search by Order ID'}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Enter an Order ID to inspect live status transitions and item snapshots.
        </p>

        <form onSubmit={handleSearch} className="mt-3 flex gap-2">
          <input
            type="text"
            value={orderIdInput}
            onChange={e => setOrderIdInput(e.target.value)}
            placeholder="CLZ-YYYYMMDD-XXXX"
            className="flex-1 px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
          />
          <button
            type="submit"
            disabled={loadingSearch || !orderIdInput.trim()}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {loadingSearch ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5" />
            )}
            <span>Track</span>
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* DETAILED TRACKING TIMELINE & SNAPSHOT */}
        {selectedOrder && (
          <div className="mt-6 pt-6 border-t border-slate-100 space-y-5 animate-in fade-in">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Order ID
                </span>
                <span className="text-base font-extrabold text-slate-900 font-mono">
                  {selectedOrder.id}
                </span>
                <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3" />
                  <span>Placed on {new Date(selectedOrder.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div>{getStatusBadge(selectedOrder.status)}</div>
            </div>

            {/* Public Direct Order Link */}
            <div className="p-3 bg-emerald-950/90 text-emerald-100 rounded-xl border border-emerald-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 text-xs shadow-xs">
              <div className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="font-semibold text-emerald-300 uppercase text-[10px] shrink-0 tracking-wider">
                  Public Order URL:
                </span>
                <code className="text-emerald-200 font-mono text-[11px] truncate bg-black/40 px-2 py-0.5 rounded border border-emerald-800/80">
                  {getPublicOrderTrackingUrl(selectedOrder.id)}
                </code>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(getPublicOrderTrackingUrl(selectedOrder.id));
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-200" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Order URL</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const trackingLink = getPublicOrderTrackingUrl(selectedOrder.id);
                    const text = `${brandName} Order Update for ${selectedOrder.customerName}:
Order ID: ${selectedOrder.id}
Status: ${selectedOrder.status}
Total: ₹${selectedOrder.grandTotal}

Track your order live here:
${trackingLink}`;
                    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
                    window.open(url, '_blank');
                  }}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>

            {/* 5-Step Order Progress Tracker */}
            {selectedOrder.status !== 'CANCELLED' ? (
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Delivery Progress
                  </span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    Expected: {selectedOrder.tracking?.expectedDelivery || '4–5 Days'}
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-1.5 pt-2">
                  {[
                    { key: 'PENDING', label: 'Pending', step: 1 },
                    { key: 'ACCEPTED', label: 'Accepted', step: 2 },
                    { key: 'PACKAGING', label: 'Packaging', step: 3 },
                    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', step: 4 },
                    { key: 'DELIVERED', label: 'Delivered', step: 5 }
                  ].map((s, idx) => {
                    const stepOrder = ['PENDING', 'ACCEPTED', 'PACKAGING', 'OUT_FOR_DELIVERY', 'DELIVERED'];
                    const currentIdx = stepOrder.indexOf(selectedOrder.status);
                    const isCompleted = idx <= currentIdx;
                    const isCurrent = idx === currentIdx;

                    return (
                      <div key={s.key} className="text-center space-y-1.5">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            isCompleted ? 'bg-emerald-600' : 'bg-slate-200'
                          }`}
                        />
                        <div
                          className={`text-[10px] sm:text-[11px] font-bold leading-tight ${
                            isCurrent
                              ? 'text-emerald-700 font-extrabold'
                              : isCompleted
                              ? 'text-slate-800'
                              : 'text-slate-400'
                          }`}
                        >
                          {s.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium">
                Order was cancelled. Central inventory restored.
              </div>
            )}

            {/* Status Timeline explainer */}
            <div className="p-3.5 bg-slate-50/60 rounded-xl border border-slate-200/80 text-xs">
              {selectedOrder.status === 'PENDING' && (
                <div className="text-slate-600">
                  <strong className="text-amber-800 block mb-0.5">Order Received (Pending Verification)</strong>
                  Your order has been recorded. Our inventory team reviews and approves orders. Stock will be reserved upon merchant acceptance.
                </div>
              )}
              {selectedOrder.status === 'ACCEPTED' && (
                <div className="text-slate-600">
                  <strong className="text-sky-800 block mb-0.5">Order Accepted by {brandName}</strong>
                  Order verified and stock reserved from central inventory at {selectedOrder.acceptedAt ? new Date(selectedOrder.acceptedAt).toLocaleTimeString() : 'acceptance'}. Our dispatch team is packing your items!
                </div>
              )}
              {selectedOrder.status === 'PACKAGING' && (
                <div className="text-slate-600">
                  <strong className="text-purple-800 block mb-0.5">Packaging & Quality Check</strong>
                  Your hygiene products are being packed, sealed, and prepared for dispatch.
                </div>
              )}
              {selectedOrder.status === 'OUT_FOR_DELIVERY' && (
                <div className="text-slate-600">
                  <strong className="text-indigo-800 block mb-0.5">Out for Delivery</strong>
                  Package handed over to our delivery partner. Expected arrival in 4–5 days.
                </div>
              )}
              {selectedOrder.status === 'DELIVERED' && (
                <div className="text-slate-600">
                  <strong className="text-emerald-800 block mb-0.5">Delivered Successfully</strong>
                  Order has been delivered. Thank you for choosing {brandName}!
                </div>
              )}
              {selectedOrder.status === 'CANCELLED' && (
                <div className="text-slate-600">
                  <strong className="text-rose-800 block mb-0.5">Order Cancelled</strong>
                  This order was cancelled. Any reserved inventory was restored to stock.
                </div>
              )}
            </div>

            {/* Delivery Details */}
            <div className="border border-slate-200 rounded-xl p-4 text-xs space-y-2">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Delivery Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 pt-1">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedOrder.customerName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedOrder.customerPhone}</span>
                </div>
                <div className="flex items-start gap-2 sm:col-span-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{selectedOrder.customerAddress}</span>
                </div>
              </div>
            </div>

            {/* Permanent snapshot of ordered items */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-emerald-600" />
                  Permanent Snapshot of Items
                </h3>
                <span className="text-[10px] text-slate-400">Locked prices at order time</span>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">{item.productName}</div>
                        <div className="text-slate-500 text-[11px] mt-0.5">
                          Size: <strong className="text-emerald-700">{item.size}</strong> · Qty: {item.quantity} · Price: ₹{item.sellingPrice}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-extrabold text-slate-900 font-mono-nums">
                          ₹{item.subtotal}
                        </div>
                        {item.mrp > item.sellingPrice && (
                          <div className="text-[10px] text-slate-400 line-through font-mono-nums">
                            MRP ₹{item.mrp * item.quantity}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-2 text-slate-500">Order recorded in database.</div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-sm font-bold text-slate-900">
                <span>Grand Total:</span>
                <span className="text-base text-emerald-700 font-mono-nums">
                  ₹{selectedOrder.grandTotal}
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => fetchOrderDetails(selectedOrder.id)}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 py-1"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh Status
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
