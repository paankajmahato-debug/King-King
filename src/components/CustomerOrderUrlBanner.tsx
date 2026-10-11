import React, { useState, useEffect } from 'react';
import { Link2, Copy, Check, ExternalLink, Globe, Settings, X, RefreshCw, AlertCircle, MessageCircle } from 'lucide-react';
import {
  getDirectPublicOrderUrl,
  getPublicCustomerOrderUrl,
  getPublicBaseUrl,
  getCustomPublicUrl,
  setCustomPublicUrl,
  getCurrentOrigin,
  getSharedPublicBaseUrl,
  onPublicUrlChange,
  sanitizeBaseDomain
} from '../utils/urlHelper';

interface CustomerOrderUrlBannerProps {
  currentRef: string;
  onUpdateRef: (ref: string) => void;
  onOpenGenerator?: () => void;
}

export const CustomerOrderUrlBanner: React.FC<CustomerOrderUrlBannerProps> = ({
  currentRef,
  onUpdateRef,
  onOpenGenerator
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditingRef, setIsEditingRef] = useState(false);
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [tempRef, setTempRef] = useState(currentRef);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [urlSavedSuccess, setUrlSavedSuccess] = useState(false);
  const [currentBaseUrl, setCurrentBaseUrl] = useState(getPublicBaseUrl());

  // Listen for public URL changes across components
  useEffect(() => {
    setCurrentBaseUrl(getPublicBaseUrl());
    setCustomUrlInput(getCustomPublicUrl());
    const unsubscribe = onPublicUrlChange(() => {
      setCurrentBaseUrl(getPublicBaseUrl());
      setCustomUrlInput(getCustomPublicUrl());
    });
    return unsubscribe;
  }, []);

  // Compute live customer URL: defaults to direct /order unless a genuine custom campaign ref is provided
  const hasCustomRef = Boolean(currentRef && currentRef.trim() && currentRef !== 'CUSTOMER_ID' && currentRef !== 'VIP_CLIENT');
  const customerUrl = hasCustomRef ? getPublicCustomerOrderUrl(currentRef) : getDirectPublicOrderUrl();

  const handleCopy = () => {
    navigator.clipboard.writeText(customerUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveRef = () => {
    onUpdateRef(tempRef.trim());
    setIsEditingRef(false);
  };

  const handleSaveCustomUrl = async (urlToSave: string) => {
    let cleanOrigin = sanitizeBaseDomain(urlToSave);
    await setCustomPublicUrl(cleanOrigin);
    setCurrentBaseUrl(cleanOrigin || getPublicBaseUrl());
    setCustomUrlInput(cleanOrigin);
    setUrlSavedSuccess(true);
    setTimeout(() => {
      setUrlSavedSuccess(false);
      setIsEditingUrl(false);
    }, 1500);
  };

  const handleResetToCurrentOrigin = async () => {
    await setCustomPublicUrl('');
    setCurrentBaseUrl(getPublicBaseUrl());
    setCustomUrlInput('');
    setUrlSavedSuccess(true);
    setTimeout(() => {
      setUrlSavedSuccess(false);
      setIsEditingUrl(false);
    }, 1200);
  };

  return (
    <>
      <div className="bg-emerald-900 text-white px-4 py-2.5 border-b border-emerald-800 shadow-xs relative z-30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          {/* Left: Indicator & URL Display */}
          <div className="flex items-center gap-2 overflow-hidden w-full md:w-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-bold tracking-wide uppercase text-[10px] bg-emerald-950/90 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700/60 shrink-0">
              Permanent Fixed Public Order Link:
            </span>

            {isEditingRef ? (
              <div className="flex items-center gap-1 shrink-0">
                <input
                  type="text"
                  value={tempRef}
                  onChange={e => setTempRef(e.target.value)}
                  placeholder="Optional Campaign Ref (e.g. PROMO)"
                  className="px-2 py-0.5 bg-emerald-950 border border-emerald-700 rounded text-xs text-white focus:outline-none"
                />
                <button
                  onClick={handleSaveRef}
                  className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 rounded font-semibold text-[11px]"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setTempRef('');
                    onUpdateRef('');
                    setIsEditingRef(false);
                  }}
                  className="px-2 py-0.5 bg-slate-700 hover:bg-slate-600 rounded font-semibold text-[11px]"
                >
                  Clear to /order
                </button>
              </div>
            ) : (
              <code className="bg-emerald-950/90 px-2.5 py-1 rounded text-emerald-200 font-mono text-[11px] font-bold border border-emerald-700 truncate max-w-xs sm:max-w-md select-all">
                {customerUrl}
              </code>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            {!isEditingRef && (
              <button
                onClick={() => {
                  setTempRef(hasCustomRef ? currentRef : '');
                  setIsEditingRef(true);
                }}
                className="text-emerald-300 hover:text-white underline text-[11px]"
              >
                {hasCustomRef ? 'Edit Ref' : 'Add Campaign Tag'}
              </button>
            )}

            <button
              onClick={() => {
                setCustomUrlInput(getCustomPublicUrl() || currentBaseUrl);
                setIsEditingUrl(true);
              }}
              className="text-emerald-300 hover:text-white underline text-[11px] flex items-center gap-1"
              title="Update public domain or custom URL"
            >
              <Globe className="w-3 h-3" />
              <span>Update Public URL</span>
            </button>

            {onOpenGenerator && (
              <button
                onClick={onOpenGenerator}
                className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-700 rounded-md font-semibold text-[11px] text-white flex items-center gap-1 transition-colors shadow-xs"
              >
                <ExternalLink className="w-3 h-3" />
                <span>URL Generator</span>
              </button>
            )}

            <a
              href={customerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 rounded-md font-semibold text-white flex items-center gap-1.5 transition-colors shadow-xs"
              title="Open permanent public customer order URL in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Link</span>
            </a>

            <button
              type="button"
              onClick={() => {
                const text = `Order directly from our factory store:\n${customerUrl}\n\n100% verified cleaning solutions. Direct customer order portal!`;
                const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
                window.open(waUrl, '_blank');
              }}
              className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-700 text-emerald-200 border border-emerald-600/70 rounded-md font-semibold text-[11px] flex items-center gap-1 transition-colors shadow-xs"
              title="Share customer order URL on WhatsApp"
            >
              <MessageCircle className="w-3 h-3 text-emerald-400" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleCopy}
              className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-md flex items-center gap-1.5 transition-colors shadow-xs active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-slate-950" />
                  <span>Copied Link!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Public URL</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Update Public URL / Domain */}
      {isEditingUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white text-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Update Public Order URL</h3>
                  <p className="text-[11px] text-slate-500">Configure public domain for customer order links</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditingUrl(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {urlSavedSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                Public URL updated and saved successfully!
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Custom Public Domain / Host URL
                </label>
                <input
                  type="text"
                  value={customUrlInput}
                  onChange={e => setCustomUrlInput(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Enter your custom website domain (must start with https:// or http://).
                </span>
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">
                  Quick Domain Presets:
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomUrlInput(getCurrentOrigin())}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all group"
                  >
                    <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Current Workspace
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5 font-mono">
                      {getCurrentOrigin()}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCustomUrlInput(getSharedPublicBaseUrl())}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 text-left transition-all group"
                  >
                    <div className="text-xs font-bold text-slate-800 group-hover:text-teal-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-teal-500" />
                      Shared Preview URL
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5 font-mono">
                      {getSharedPublicBaseUrl()}
                    </div>
                  </button>
                </div>
              </div>

              {/* Live Preview */}
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Preview Generated Link:
                </span>
                <div className="font-mono text-xs text-emerald-800 break-all select-all font-medium">
                  {(sanitizeBaseDomain(customUrlInput) || getCurrentOrigin())}/order?ref={encodeURIComponent(currentRef || 'VIP_CLIENT')}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleResetToCurrentOrigin}
                className="text-xs text-slate-500 hover:text-slate-700 underline font-medium"
              >
                Reset to Default
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingUrl(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveCustomUrl(customUrlInput)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl text-xs font-bold text-white transition-all shadow-sm shadow-emerald-600/20"
                >
                  Save & Apply Public URL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
