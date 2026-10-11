import React, { useState } from 'react';
import type { Product, Variant } from '../types/index';
import { Check, Plus, Minus, AlertCircle, Sparkles, MessageCircle } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, variant: Variant, quantity: number) => void;
  onQuickWhatsApp?: (product: Product, variant: Variant, quantity: number) => void;
  brandName?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onQuickWhatsApp,
  brandName = 'TAZE CLINING'
}) => {
  // Find first active variant with stock, or first variant
  const defaultVariant = product.variants.find(v => v.status !== 'OUT_OF_STOCK' && v.stockQuantity > 0) || product.variants[0];
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    defaultVariant?.variantId || ''
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [quantityError, setQuantityError] = useState<string | null>(null);
  const [addedFeedback, setAddedFeedback] = useState<boolean>(false);
  const [showDetails, setShowDetails] = useState<boolean>(false);

  const selectedVariant =
    product.variants.find(v => v.variantId === selectedVariantId) || product.variants[0];

  const isLive = product.status === 'LIVE';
  const isUpcoming = product.status === 'UPCOMING';
  const isOutOfStock =
    product.status === 'OUT_OF_STOCK' ||
    (selectedVariant && (selectedVariant.status === 'OUT_OF_STOCK' || selectedVariant.stockQuantity <= 0));

  const availableStock = selectedVariant && selectedVariant.status !== 'OUT_OF_STOCK' ? selectedVariant.stockQuantity : 0;

  const handleVariantChange = (varId: string) => {
    setSelectedVariantId(varId);
    setQuantity(1);
    setQuantityError(null);
  };

  const handleQuantityIncrease = () => {
    if (!selectedVariant) return;
    if (quantity >= availableStock) {
      setQuantityError(`Only ${availableStock} units are available.`);
      return;
    }
    setQuantity(q => q + 1);
    setQuantityError(null);
  };

  const handleQuantityDecrease = () => {
    if (quantity > 1) {
      setQuantity(q => q - 1);
      setQuantityError(null);
    }
  };

  const handleAdd = () => {
    if (!isLive || !selectedVariant || availableStock <= 0) return;
    if (quantity > availableStock) {
      setQuantityError(`Only ${availableStock} units are available.`);
      return;
    }

    onAddToCart(product, selectedVariant, quantity);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1800);
  };

  const handleQuickWhatsAppClick = () => {
    if (!isLive || !selectedVariant || availableStock <= 0) return;
    if (onQuickWhatsApp) {
      onQuickWhatsApp(product, selectedVariant, quantity);
    }
  };

  // Calculate discount percentage if not provided in offer
  const discountPercent =
    selectedVariant && selectedVariant.mrp > selectedVariant.sellingPrice
      ? Math.round(
          ((selectedVariant.mrp - selectedVariant.sellingPrice) / selectedVariant.mrp) * 100
        )
      : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden group">
      {/* Product Image Container */}
      <div className="relative aspect-square w-full bg-slate-50 flex items-center justify-center p-4 overflow-hidden border-b border-slate-100">
        {(selectedVariant?.image || product.image) ? (
          <img
            src={selectedVariant?.image || product.image}
            alt={`${product.name} ${selectedVariant?.size || ''}`}
            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100/60 rounded-xl p-4 text-center">
            <Sparkles className="w-8 h-8 mb-2 text-slate-300" />
            <span className="text-xs font-medium">{brandName} Original</span>
          </div>
        )}

        {/* Status Text Indicator (Unboxed, clean metadata per anti-slop guidelines) */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
          {isUpcoming && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500 text-white shadow-xs">
              COMING SOON
            </span>
          )}
          {isOutOfStock && !isUpcoming && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-600 text-white shadow-xs">
              OUT OF STOCK
            </span>
          )}
          {isLive && !isOutOfStock && discountPercent > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-600 text-white shadow-xs">
              {selectedVariant.offer || `${discountPercent}% OFF`}
            </span>
          )}
        </div>

        {/* Category Unboxed text */}
        <div className="absolute top-3 right-3 text-[11px] font-medium text-slate-500 bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded">
          {product.category}
        </div>
      </div>

      {/* Product Content Details */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors leading-snug">
            {product.name}
          </h3>
          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
            {product.tagline || product.description}
          </p>

          {/* Variants / Sizes Selector */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5 font-medium">
              <span>Select Size Variant:</span>
              {selectedVariant && (
                <span className="text-emerald-700 font-semibold">{selectedVariant.size}</span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {product.variants.map(variant => {
                const isSelected = variant.variantId === selectedVariant?.variantId;
                const isVariantOutOfStock = variant.stockQuantity <= 0;

                return (
                  <button
                    key={variant.variantId}
                    type="button"
                    onClick={() => handleVariantChange(variant.variantId)}
                    className={`py-2 px-2 text-xs font-medium rounded-lg border text-center transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs'
                        : isVariantOutOfStock
                        ? 'border-slate-200 bg-slate-50 text-slate-400 opacity-60'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-semibold">{variant.size}</span>
                    <span className="block text-[11px] text-slate-500 mt-0.5">
                      {isVariantOutOfStock ? '0 left' : `₹${variant.sellingPrice}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price & Stock Display for Selected Variant */}
          {selectedVariant && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-slate-900 font-mono-nums">
                      ₹{selectedVariant.sellingPrice}
                    </span>
                    {selectedVariant.mrp > selectedVariant.sellingPrice && (
                      <span className="text-xs text-slate-400 line-through font-mono-nums">
                        MRP ₹{selectedVariant.mrp}
                      </span>
                    )}
                  </div>
                  {selectedVariant.offer && (
                    <span className="text-[11px] font-semibold text-emerald-600 block mt-0.5">
                      {selectedVariant.offer}
                    </span>
                  )}
                </div>

                {/* Stock Level Text */}
                <div className="text-right text-xs">
                  {isUpcoming ? (
                    <span className="text-amber-600 font-medium">Coming Soon</span>
                  ) : availableStock > 0 ? (
                    <span className="text-slate-600">
                      Available:{' '}
                      <strong className="text-slate-900 font-mono-nums font-semibold">
                        {availableStock}
                      </strong>
                    </span>
                  ) : (
                    <span className="text-rose-600 font-semibold">Out of Stock</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quantity Validation Error */}
          {quantityError && (
            <div className="mt-2.5 p-2 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-1.5 text-xs text-rose-700">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{quantityError}</span>
            </div>
          )}

          {/* Expandable Features */}
          {product.features && product.features.length > 0 && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="text-[11px] font-semibold text-slate-500 hover:text-emerald-700 transition-colors flex items-center gap-1"
              >
                {showDetails ? 'Hide Details' : 'View Specifications & Features'}
              </button>

              {showDetails && (
                <ul className="mt-2 space-y-1 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {product.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-500 shrink-0 mt-0.5">•</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="mt-5 space-y-2">
          {isLive && !isOutOfStock && availableStock > 0 ? (
            <div className="flex items-center gap-2">
              {/* Quantity Stepper */}
              <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={handleQuantityDecrease}
                  disabled={quantity <= 1}
                  className="w-7 h-7 flex items-center justify-center rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-8 text-center text-xs font-semibold text-slate-900 font-mono-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={handleQuantityIncrease}
                  disabled={quantity >= availableStock}
                  className="w-7 h-7 flex items-center justify-center rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Add to Order Button */}
              <button
                type="button"
                onClick={handleAdd}
                className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-98 ${
                  addedFeedback
                    ? 'bg-emerald-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {addedFeedback ? (
                  <>
                    <Check className="w-4 h-4" />
                    Added to Order!
                  </>
                ) : (
                  <>
                    <span>Add to Order</span>
                    <span className="font-mono-nums">
                      (₹{selectedVariant ? selectedVariant.sellingPrice * quantity : 0})
                    </span>
                  </>
                )}
              </button>
            </div>
          ) : isUpcoming ? (
            <button
              disabled
              className="w-full py-2.5 px-4 bg-slate-100 text-slate-400 font-semibold text-xs rounded-lg cursor-not-allowed border border-slate-200"
            >
              UPCOMING — COMING SOON
            </button>
          ) : (
            <button
              disabled
              className="w-full py-2.5 px-4 bg-rose-50 text-rose-400 font-semibold text-xs rounded-lg cursor-not-allowed border border-rose-100"
            >
              OUT OF STOCK
            </button>
          )}

          {/* Quick WhatsApp button option if available and live */}
          {isLive && !isOutOfStock && onQuickWhatsApp && availableStock > 0 && (
            <button
              type="button"
              onClick={handleQuickWhatsAppClick}
              className="w-full py-2 px-3 border border-emerald-300 hover:border-emerald-400 text-emerald-800 bg-emerald-50/60 hover:bg-emerald-50 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Direct WhatsApp Inquiry</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
