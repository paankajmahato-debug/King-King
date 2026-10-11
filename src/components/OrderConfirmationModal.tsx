import React, { useState } from 'react';
import type { Order } from '../types/index';
import { formatWhatsAppMessage, createWhatsAppOrderLink } from '../utils/whatsapp';
import { getPublicOrderTrackingUrl } from '../utils/urlHelper';
import { CheckCircle2, MessageCircle, Copy, Check, ExternalLink, X, Clock, ArrowRight, Globe } from 'lucide-react';

interface OrderConfirmationModalProps {
  order: Order | null;
  onClose: () => void;
  onTrackOrder: (orderId: string) => void;
  brandName?: string;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  order,
  onClose,
  onTrackOrder,
  brandName = 'TAZE CLINING'
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!order) return null;

  const publicTrackingUrl = getPublicOrderTrackingUrl(order.id);
  const whatsappMessage = formatWhatsAppMessage(order, brandName);
  const whatsappUrl = createWhatsAppOrderLink(order, undefined, brandName);

  const handleCopy = () => {
    navigator.clipboard.writeText(whatsappMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicTrackingUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-emerald-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Order Successfully Placed!</h3>
              <p className="text-xs text-slate-500">Recorded in {brandName} central database</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Order ID banner */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Permanent Order ID
            </span>
            <div className="text-xl font-extrabold text-slate-900 font-mono-nums mt-0.5 tracking-tight">
              {order.id}
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 mt-2">
              <Clock className="w-3 h-3" />
              <span>Status: PENDING</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Stock remains in database until merchant confirms and accepts your order.
            </p>
          </div>

          {/* Public Order URL (Accessible on all devices) */}
          <div className="p-3 bg-emerald-950 text-white rounded-xl border border-emerald-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-emerald-300 font-semibold text-[11px] uppercase tracking-wider">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>Public Order Link (All Devices)</span>
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 transition-colors"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-200" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
            <code className="block bg-black/40 px-2.5 py-1 rounded text-emerald-200 font-mono text-[11px] truncate border border-emerald-900">
              {publicTrackingUrl}
            </code>
            <p className="text-[10px] text-emerald-300/80">
              Opens directly on mobile phones, WhatsApp, laptops, and tablets without requiring login.
            </p>
          </div>

          {/* Itemized Snapshot */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Order Snapshot
            </h4>
            <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200 space-y-2 text-xs">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-200/60 last:border-none">
                  <div>
                    <span className="font-semibold text-slate-900">{item.productName}</span>
                    <span className="text-slate-500 ml-1.5">({item.size} × {item.quantity})</span>
                  </div>
                  <span className="font-mono-nums font-bold text-slate-900">₹{item.subtotal}</span>
                </div>
              ))}
              <div className="pt-2 flex justify-between items-center font-bold text-sm text-slate-900 border-t border-slate-200">
                <span>Grand Total:</span>
                <span className="font-mono-nums text-emerald-700 text-base">₹{order.grandTotal}</span>
              </div>
            </div>
          </div>

          {/* WhatsApp formatted message card */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-700">Official WhatsApp Order Text</span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-emerald-300 font-mono text-[11px] rounded-xl overflow-x-auto whitespace-pre-wrap max-h-40 leading-relaxed border border-slate-800">
              {whatsappMessage}
            </pre>
          </div>

          {/* Action buttons */}
          <div className="pt-2 space-y-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>SEND ORDER ON WHATSAPP</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </a>

            <button
              type="button"
              onClick={() => {
                onClose();
                onTrackOrder(order.id);
              }}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Track Order Live Status</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
