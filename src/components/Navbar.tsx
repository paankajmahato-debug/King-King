import React from 'react';
import type { CustomerProfile } from '../types/index';
import { ShoppingBag, ShieldCheck, Sparkles, Package, Compass, Lock, Link as LinkIcon, Share2, UserCheck, LogOut, Smartphone, Download } from 'lucide-react';

interface NavbarProps {
  activeTab: 'store' | 'order' | 'generator' | 'track' | 'admin' | 'customer_app' | 'owner_app';
  setActiveTab: (tab: 'store' | 'order' | 'generator' | 'track' | 'admin' | 'customer_app' | 'owner_app') => void;
  cartCount: number;
  openCart: () => void;
  customerRef?: string;
  isCustomerFront?: boolean;
  brandName?: string;
  tagline?: string;
  customerProfile?: CustomerProfile | null;
  onOpenCustomerLogin?: () => void;
  onLogoutCustomer?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  cartCount,
  openCart,
  customerRef,
  isCustomerFront = false,
  brandName = 'TAZE CLINING',
  tagline = 'Pro Hygiene Solutions',
  customerProfile = null,
  onOpenCustomerLogin,
  onLogoutCustomer
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Wordmark Zone */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab(isCustomerFront ? 'order' : 'store')}
              className="flex items-center gap-2 group text-left focus:outline-none"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20 group-hover:bg-emerald-700 transition-colors">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="font-display text-xl font-extrabold tracking-tight text-slate-900 block leading-tight">
                  {brandName}
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider block">
                  {isCustomerFront ? 'Customer Order Portal' : tagline}
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {isCustomerFront ? (
              <>
                <button
                  onClick={() => setActiveTab('order')}
                  className={`px-3.5 py-2 text-sm font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'order'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Order Portal</span>
                </button>
                <button
                  onClick={() => setActiveTab('track')}
                  className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'track'
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{customerProfile ? 'My Orders' : 'Track Order'}</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('store')}
                  className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'store'
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Catalog
                </button>
                <button
                  onClick={() => setActiveTab('order')}
                  className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'order'
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Customer Order Page
                </button>
                <button
                  onClick={() => setActiveTab('generator')}
                  className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'generator'
                      ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                      : 'text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
                  }`}
                >
                  <Share2 className="w-3.5 h-3.5" />
                  URL Generator
                </button>
                <button
                  onClick={() => setActiveTab('track')}
                  className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'track'
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Track Order
                </button>
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'admin'
                      ? 'bg-emerald-50 text-emerald-800 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  Admin Portal
                </button>
                <button
                  onClick={() => setActiveTab('customer_app')}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
                  title="Switch to TAZE CLINING Customer App"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Customer App</span>
                </button>
              </>
            )}
          </nav>

          {/* Action Zone: Customer Auth Status + Cart Button */}
          <div className="flex items-center gap-2.5">
            {/* Prominent Customer Login / Order Access Link in Main Website Navbar */}
            {customerProfile ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveTab('track')}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs ${
                    activeTab === 'track'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                  }`}
                  title="View My Orders & Live Tracking"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>My Orders</span>
                </button>
                <div
                  className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-medium"
                  title={`Customer ID: ${customerProfile.customerId}`}
                >
                  <UserCheck className="w-3 h-3 text-emerald-600" />
                  <span>{customerProfile.name.split(' ')[0]}</span>
                </div>
                {onLogoutCustomer && (
                  <button
                    onClick={onLogoutCustomer}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : !isCustomerFront ? (
              <button
                onClick={() => setActiveTab('order')}
                className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95 border border-emerald-500/30"
              >
                <Package className="w-3.5 h-3.5 text-emerald-200" />
                <span>Order Now</span>
              </button>
            ) : null}

            <button
              onClick={openCart}
              className="relative flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95"
              aria-label="View Order Basket"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Basket</span>
              {cartCount > 0 && (
                <span className="px-1.5 py-0.5 text-[11px] font-bold bg-emerald-500 text-white rounded-full font-mono-nums">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden border-t border-slate-200/80 bg-slate-50 px-2 py-1.5 flex items-center justify-around text-xs font-medium text-slate-600">
        {isCustomerFront ? (
          <>
            <button
              onClick={() => setActiveTab('order')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 ${
                activeTab === 'order' ? 'bg-white shadow-xs text-emerald-700 font-bold' : ''
              }`}
            >
              <Package className="w-4 h-4" />
              Products
            </button>
            <button
              onClick={() => setActiveTab('track')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 ${
                activeTab === 'track' ? 'bg-white shadow-xs text-emerald-700 font-bold' : ''
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{customerProfile ? 'My Orders' : 'Track'}</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setActiveTab('store')}
              className={`px-2.5 py-1.5 rounded-md flex items-center gap-1 ${
                activeTab === 'store' ? 'bg-white shadow-xs text-emerald-700 font-semibold' : ''
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              Catalog
            </button>
            <button
              onClick={() => setActiveTab('order')}
              className={`px-2.5 py-1.5 rounded-md flex items-center gap-1 ${
                activeTab === 'order' ? 'bg-white shadow-xs text-emerald-700 font-semibold' : ''
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              Order
            </button>
            <button
              onClick={() => setActiveTab('generator')}
              className={`px-2.5 py-1.5 rounded-md flex items-center gap-1 ${
                activeTab === 'generator' ? 'bg-emerald-600 text-white font-semibold shadow-xs' : 'text-emerald-800'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              Links
            </button>
            <button
              onClick={() => setActiveTab('track')}
              className={`px-2.5 py-1.5 rounded-md flex items-center gap-1 ${
                activeTab === 'track' ? 'bg-white shadow-xs text-emerald-700 font-semibold' : ''
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{customerProfile ? 'Orders' : 'Track'}</span>
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-2.5 py-1.5 rounded-md flex items-center gap-1 ${
                activeTab === 'admin' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-700'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              Admin
            </button>
          </>
        )}
      </div>
    </header>
  );
};
