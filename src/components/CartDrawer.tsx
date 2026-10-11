import React, { useState, useEffect } from 'react';
import type { Product, Order, OrderItem, CustomerProfile } from '../types/index';
import { api } from '../services/api';
import { createWhatsAppOrderLink, formatWhatsAppMessage } from '../utils/whatsapp';
import { X, Trash2, Plus, Minus, Send, AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, MessageCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export interface CartItem {
  product: Product;
  variantId: string;
  size: string;
  mrp: number;
  sellingPrice: number;
  quantity: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, variantId: string, quantity: number) => void;
  onRemoveItem: (productId: string, variantId: string) => void;
  onClearCart: () => void;
  onOrderSuccess: (order: Order) => void;
  customerRef?: string;
  brandName?: string;
  customerProfile?: CustomerProfile | null;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderSuccess,
  customerRef,
  brandName = 'TAZE CLINING',
  customerProfile
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (customerProfile) {
      if (customerProfile.name) setCustomerName(customerProfile.name);
      if (customerProfile.verifiedMobile) setCustomerPhone(customerProfile.verifiedMobile);
      if (customerProfile.address) setCustomerAddress(customerProfile.address);
    }
  }, [customerProfile]);

  if (!isOpen) return null;

  // Compute totals
  const totalMrp = cartItems.reduce((acc, item) => acc + item.mrp * item.quantity, 0);
  const grandTotal = cartItems.reduce((acc, item) => acc + item.sellingPrice * item.quantity, 0);
  const totalSavings = Math.max(0, totalMrp - grandTotal);

  const handleSubmitOrder = async (openWhatsApp = true) => {
    setErrorMessage(null);

    // Validation
    if (!customerName.trim()) {
      setErrorMessage('Please enter your full name');
      return;
    }
    if (!customerPhone.trim() || customerPhone.trim().length < 8) {
      setErrorMessage('Please enter a valid phone number (at least 8 digits)');
      return;
    }
    if (!customerAddress.trim()) {
      setErrorMessage('Please enter your delivery address with landmark');
      return;
    }
    if (cartItems.length === 0) {
      setErrorMessage('Your order basket is empty');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Submit order to shared backend database
      // The backend validates live stock, assigns unique Order ID, and sets status = PENDING
      const fullAddress = landmark.trim()
        ? `${customerAddress.trim()} (Landmark: ${landmark.trim()})`
        : customerAddress.trim();

      const idempotencyKey = `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const orderPayload = {
        customerName: (customerProfile?.name || customerName).trim(),
        customerPhone: (customerProfile?.verifiedMobile || customerPhone).trim(),
        customerAddress: fullAddress,
        notes: notes.trim() || undefined,
        items: cartItems.map(item => ({
          productId: item.product.id,
          variantId: item.variantId,
          quantity: item.quantity
        })),
        sourceUrl: customerRef
          ? (customerRef.startsWith('/') ? customerRef : `/order?ref=${encodeURIComponent(customerRef)}`)
          : (typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : '/order'),
        idempotencyKey
      };

      const createdOrder = await api.createOrder(orderPayload);

      // 2. Clear cart
      onClearCart();
      onClose();
      onOrderSuccess(createdOrder);

      // 3. If WhatsApp requested, open WhatsApp with the dynamically generated message
      if (openWhatsApp) {
        const whatsappUrl = createWhatsAppOrderLink(createdOrder, undefined, brandName);
        try {
          window.open(whatsappUrl, '_blank');
        } catch {
          // Fallback handled in OrderConfirmationModal
        }
      }
    } catch (err: any) {
      console.error('[Order Submission Error]:', err);
      setErrorMessage(err.message || 'Failed to place order. Please check item stock.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-display">Customer Order Basket</h2>
            <p className="text-xs text-slate-500">
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} ready for order
              {customerRef ? ` · Ref: ${customerRef}` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            aria-label="Close basket"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Order Error:</strong>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {cartItems.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">Your basket is empty</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Explore our catalog to select {brandName} hygiene products and variant sizes.
              </p>
            </div>
          ) : (
            <>
              {/* Cart Items List */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Order Items ({cartItems.length})
                </div>

                {cartItems.map(item => {
                  const variant = item.product.variants.find(v => v.variantId === item.variantId);
                  const maxStock = variant ? variant.stockQuantity : 99;

                  return (
                    <div
                      key={`${item.product.id}-${item.variantId}`}
                      className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 flex items-center gap-3"
                    >
                      <div className="w-14 h-14 bg-white rounded-lg p-1 border border-slate-200 shrink-0 flex items-center justify-center">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-full h-full object-contain"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {item.product.name}
                        </h4>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="font-semibold text-emerald-700">{item.size}</span>
                          <span>·</span>
                          <span className="font-mono-nums">₹{item.sellingPrice} each</span>
                        </div>

                        {/* Quantity Stepper */}
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center border border-slate-300 rounded bg-white p-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                if (item.quantity > 1) {
                                  onUpdateQuantity(item.product.id, item.variantId, item.quantity - 1);
                                } else {
                                  onRemoveItem(item.product.id, item.variantId);
                                }
                              }}
                              className="w-5 h-5 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <span className="w-6 text-center text-xs font-bold text-slate-800 font-mono-nums">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              disabled={item.quantity >= maxStock}
                              onClick={() => {
                                if (item.quantity < maxStock) {
                                  onUpdateQuantity(item.product.id, item.variantId, item.quantity + 1);
                                }
                              }}
                              className="w-5 h-5 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded disabled:opacity-30"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>

                          <span className="text-[11px] text-slate-400">
                            Max: {maxStock}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-sm font-extrabold text-slate-900 font-mono-nums">
                          ₹{item.sellingPrice * item.quantity}
                        </div>
                        {item.mrp > item.sellingPrice && (
                          <div className="text-[10px] text-slate-400 line-through font-mono-nums">
                            ₹{item.mrp * item.quantity}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.product.id, item.variantId)}
                          className="mt-1 text-slate-400 hover:text-rose-600 transition-colors p-1"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Customer Information Form */}
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Customer Details</span>
                  {customerProfile ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>OTP Verified Mobile</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-700 font-normal">Direct dispatch</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Your Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center justify-between">
                    <span>WhatsApp / Phone Number <span className="text-rose-500">*</span></span>
                    {customerProfile && (
                      <span className="text-[10px] text-emerald-600 font-semibold">Locked to verified identity</span>
                    )}
                  </label>
                  <input
                    type="tel"
                    required
                    readOnly={Boolean(customerProfile?.verifiedMobile)}
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className={`w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 ${
                      customerProfile ? 'bg-slate-50 text-slate-800 font-mono font-medium cursor-not-allowed' : 'bg-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Delivery Address <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={customerAddress}
                    onChange={e => setCustomerAddress(e.target.value)}
                    placeholder="Flat/House No., Street, Area, City, Pincode"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Optional Landmark
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={e => setLandmark(e.target.value)}
                    placeholder="e.g. Near Metro Station / Opposite Apollo Pharmacy"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Special Notes / Delivery Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="e.g. Call before delivery, deliver in morning"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                  />
                </div>
              </div>

              {/* Order Summary Snapshot */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-500">
                  <span>Total MRP:</span>
                  <span className="font-mono-nums">₹{totalMrp}</span>
                </div>
                {totalSavings > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Discount / Savings:</span>
                    <span className="font-mono-nums">- ₹{totalSavings}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-900 font-bold text-sm pt-1.5 border-t border-slate-200">
                  <span>Grand Total (Selling Price):</span>
                  <span className="font-mono-nums text-emerald-700 text-base">₹{grandTotal}</span>
                </div>
                <div className="text-[11px] text-slate-500 pt-1">
                  Status on submit: <strong className="text-amber-700 font-semibold">PENDING</strong> (Inventory confirmed upon merchant acceptance)
                </div>
              </div>
            </>
          )}
        </div>

        {/* Drawer Action Footer */}
        {cartItems.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-white space-y-2">
            {/* Primary Submit Button: WhatsApp Flow */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmitOrder(true)}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Placing Order...</span>
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Submit Order & Open WhatsApp</span>
                  <span className="font-mono-nums font-semibold ml-1">(₹{grandTotal})</span>
                </>
              )}
            </button>

            {/* Secondary Direct Order without opening WhatsApp */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmitOrder(false)}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <span>Submit Direct Order to Database Only</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
