import React, { useState } from 'react';
import type { Order, OrderStatus } from '../types/index';
import {
  Clock,
  Package,
  Truck,
  CheckCheck,
  CheckCircle2,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface CustomerLiveOrderStatusProps {
  order: Order;
  brandName?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const STATUS_STEPS: Array<{ key: OrderStatus; label: string; description: string }> = [
  { key: 'PENDING', label: 'Pending', description: 'Order submitted & awaiting merchant review' },
  { key: 'ACCEPTED', label: 'Accepted', description: 'Order accepted & inventory reserved' },
  { key: 'PACKAGING', label: 'Packaging', description: 'Items verified & packaged for dispatch' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', description: 'Dispatched with delivery agent' },
  { key: 'DELIVERED', label: 'Delivered', description: 'Delivered successfully to customer' }
];

export const CustomerLiveOrderStatus: React.FC<CustomerLiveOrderStatusProps> = ({
  order,
  brandName = 'TAZE CLINING',
  onRefresh,
  isRefreshing = false
}) => {
  const [showItems, setShowItems] = useState(true);

  const stepKeys: OrderStatus[] = ['PENDING', 'ACCEPTED', 'PACKAGING', 'OUT_FOR_DELIVERY', 'DELIVERED'];
  const currentStepIndex = stepKeys.indexOf(order.status);

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
            PENDING
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-sky-100 text-sky-900 border border-sky-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-sky-700" />
            ACCEPTED
          </span>
        );
      case 'PACKAGING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-purple-100 text-purple-900 border border-purple-300">
            <Package className="w-3.5 h-3.5 text-purple-700 animate-bounce" />
            PACKAGING
          </span>
        );
      case 'OUT_FOR_DELIVERY':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-100 text-indigo-900 border border-indigo-300">
            <Truck className="w-3.5 h-3.5 text-indigo-700 animate-pulse" />
            OUT FOR DELIVERY
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <CheckCheck className="w-3.5 h-3.5 text-emerald-700" />
            DELIVERED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-900 border border-rose-300">
            CANCELLED
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md overflow-hidden animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-widest">
                Live Order Status
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-xs text-slate-300 font-mono">
                Order ID: <strong className="text-white font-extrabold">{order.id}</strong>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold font-display text-white">
              Customer: <span className="text-emerald-300">{order.customerName}</span>
            </h2>
            <p className="text-xs text-slate-300">
              Placed on {new Date(order.createdAt).toLocaleDateString()} at{' '}
              {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center">
            {getStatusBadge(order.status)}
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="p-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                title="Refresh latest status from server"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Sync Live</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5-Step Order Status Progress Timeline */}
      <div className="p-5 sm:p-7 border-b border-slate-100 bg-slate-50/60">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
            Order Lifecycle Progress
          </h3>
          <span className="text-xs text-slate-500 font-semibold">
            Status: <strong className="text-slate-900 font-bold">{order.status.replace(/_/g, ' ')}</strong>
          </span>
        </div>

        {/* Desktop & Tablet Progress Bar */}
        <div className="hidden sm:grid grid-cols-5 gap-2 relative">
          {STATUS_STEPS.map((s, idx) => {
            const isCompleted = currentStepIndex >= idx;
            const isCurrent = currentStepIndex === idx;

            return (
              <div key={s.key} className="flex flex-col items-center text-center space-y-2">
                {/* Step indicator bar */}
                <div
                  className={`w-full h-2 rounded-full transition-all duration-300 ${
                    isCompleted
                      ? 'bg-emerald-600'
                      : 'bg-slate-200'
                  }`}
                />

                {/* Step icon / symbol */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCurrent
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-xs'
                      : isCompleted
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {isCurrent ? (
                    '●'
                  ) : isCompleted ? (
                    '✓'
                  ) : (
                    '○'
                  )}
                </div>

                {/* Step text */}
                <div>
                  <div
                    className={`text-xs font-bold ${
                      isCurrent
                        ? 'text-emerald-900 font-extrabold'
                        : isCompleted
                        ? 'text-slate-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {isCompleted && !isCurrent ? '✓ ' : isCurrent ? '● ' : '○ '}
                    {s.label}
                  </div>
                  <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                    {s.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Vertical Progress List */}
        <div className="sm:hidden space-y-3">
          {STATUS_STEPS.map((s, idx) => {
            const isCompleted = currentStepIndex >= idx;
            const isCurrent = currentStepIndex === idx;

            return (
              <div
                key={s.key}
                className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-emerald-50 border-emerald-300 shadow-2xs'
                    : isCompleted
                    ? 'bg-white border-slate-200'
                    : 'bg-slate-50/50 border-transparent opacity-60'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                    isCurrent
                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-200'
                      : isCompleted
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {isCurrent ? '●' : isCompleted ? '✓' : '○'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        isCurrent ? 'text-emerald-900 font-extrabold' : 'text-slate-800'
                      }`}
                    >
                      {s.label}
                    </span>
                    {isCurrent && (
                      <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold">
                        ACTIVE NOW
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{s.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ordered Products Breakdown */}
      <div className="p-5 sm:p-7 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Ordered Products ({order.items.reduce((acc, i) => acc + i.quantity, 0)} items)
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowItems(!showItems)}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold"
          >
            {showItems ? 'Collapse' : 'Expand'}
          </button>
        </div>

        {showItems && (
          <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
            {order.items.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/50 transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">
                      {item.productName}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded text-[10px]">
                      {item.size}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono-nums">
                    ₹{item.sellingPrice} each × <strong className="text-slate-800 font-bold">{item.quantity}</strong>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono-nums text-sm font-extrabold text-slate-900">
                    ₹{item.subtotal}
                  </span>
                </div>
              </div>
            ))}

            {/* Total Footer */}
            <div className="p-4 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-700">Order Grand Total</span>
                <span className="text-[11px] text-slate-500 block">Includes all applicable charges</span>
              </div>
              <span className="font-mono-nums text-lg sm:text-xl font-extrabold text-slate-900">
                ₹{order.grandTotal}
              </span>
            </div>
          </div>
        )}

        {/* Live Sync Status Info Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Connected to central database · Status updates live automatically</span>
          </div>
          {order.tracking?.expectedDelivery && (
            <span className="font-semibold text-slate-700">
              Estimated Delivery: {order.tracking.expectedDelivery}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
