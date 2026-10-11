import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Link,
  Copy,
  Check,
  MessageCircle,
  ExternalLink,
  Sparkles,
  Shield,
  RefreshCw,
  ShoppingBag,
  Send,
  QrCode,
  Download,
  Printer,
  ArrowRight,
  Smartphone,
  Globe
} from 'lucide-react';
import { getDirectPublicOrderUrl, getPublicCustomerOrderUrl } from '../../utils/urlHelper';

interface CustomerLinkGeneratorProps {
  onGenerateRef?: (ref: string) => void;
  brandName?: string;
  onOpenFullGenerator?: () => void;
}

export const CustomerLinkGenerator: React.FC<CustomerLinkGeneratorProps> = ({
  onGenerateRef,
  brandName = 'TAZE CLINING',
  onOpenFullGenerator
}) => {
  const [copiedPublic, setCopiedPublic] = useState(false);
  const [copiedTagged, setCopiedTagged] = useState(false);
  const [customTag, setCustomTag] = useState('');
  const [generatedRef, setGeneratedRef] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Universal Public Order URL (Direct /order per specification)
  const publicOrderUrl = getDirectPublicOrderUrl();

  // Tagged Order URL (Optional campaign/client tracking)
  const currentActiveRef = generatedRef || customTag;
  const taggedOrderUrl = getPublicCustomerOrderUrl(currentActiveRef);
  const effectiveUrl = currentActiveRef ? taggedOrderUrl : publicOrderUrl;

  // Render QR Code for the active URL
  useEffect(() => {
    QRCode.toDataURL(effectiveUrl, {
      width: 256,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then(url => setQrCodeDataUrl(url))
      .catch(err => console.error('QR generation error:', err));
  }, [effectiveUrl]);

  const handleCopyPublic = () => {
    navigator.clipboard.writeText(publicOrderUrl);
    setCopiedPublic(true);
    setTimeout(() => setCopiedPublic(false), 2000);
  };

  const handleSharePublicWhatsApp = () => {
    const text = `Hello! Place your order directly with ${brandName}:
${effectiveUrl}

Tap the link to select products, choose variants (250ml, 500ml, 1L, 5L), and enter delivery details. No login or customer ID required!`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCopyTagged = () => {
    navigator.clipboard.writeText(taggedOrderUrl);
    setCopiedTagged(true);
    setTimeout(() => setCopiedTagged(false), 2000);
  };

  const handleGenerateTag = (nameInput?: string) => {
    const raw = (nameInput !== undefined ? nameInput : customTag).trim();
    let ref = '';
    if (raw) {
      ref = raw.replace(/[^a-zA-Z0-9_-]/g, '_').toUpperCase();
    } else {
      const cleanBrand = brandName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      ref = `${cleanBrand}_CAMPAIGN_${randomSuffix}`;
    }
    setGeneratedRef(ref);
    if (onGenerateRef) {
      onGenerateRef(ref);
    }
  };

  const applyPreset = (tag: string) => {
    setCustomTag(tag);
    setGeneratedRef(tag);
    if (onGenerateRef) onGenerateRef(tag);
  };

  const handleDownloadQr = () => {
    if (!qrCodeDataUrl) return;
    const a = document.createElement('a');
    a.href = qrCodeDataUrl;
    a.download = `order-qr-${currentActiveRef || 'public-order'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrintQr = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${brandName} - Scan to Order QR</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 40px; margin: 0; background: #fff; }
            .card { border: 2px solid #0f172a; border-radius: 16px; padding: 32px; max-width: 400px; margin: 0 auto; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
            h1 { margin: 0 0 8px 0; color: #047857; font-size: 26px; }
            p { margin: 4px 0 20px 0; color: #475569; font-size: 14px; }
            img { width: 240px; height: 240px; margin-bottom: 20px; }
            .url { font-family: monospace; font-size: 11px; color: #0f172a; word-break: break-all; }
            .badge { display: inline-block; background: #ecfdf5; color: #065f46; padding: 6px 12px; border-radius: 20px; font-weight: bold; font-size: 12px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>${brandName}</h1>
            <p>Scan with any mobile camera to view products and place direct order</p>
            <img src="${qrCodeDataUrl}" alt="Order QR Code" />
            <div class="url">${effectiveUrl}</div>
            <div class="badge">Universal Public Order • No Login Required</div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-7 border border-emerald-700/60 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>ORDER URL & QR LINK GENERATOR</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-white">
            Customer Public Order URL (/order)
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Customers open this link on WhatsApp, mobile, or desktop to browse products, select variants, and enter delivery details.
            <strong className="text-emerald-300"> No login, password, or app download required.</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (onOpenFullGenerator) {
                onOpenFullGenerator();
              } else {
                window.location.href = '/generator';
              }
            }}
            className="px-3.5 py-2 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-emerald-500/40 shadow-xs"
          >
            <span>Launch Full URL & Analytics Hub</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick 1-Click Link Presets */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Quick Presets:
        </span>
        <button
          type="button"
          onClick={() => applyPreset('')}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1 ${
            !currentActiveRef
              ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
              : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
        >
          <Globe className="w-3 h-3" />
          <span>Universal /order</span>
        </button>
        <button
          type="button"
          onClick={() => applyPreset('VIP_CLIENT')}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1 ${
            currentActiveRef === 'VIP_CLIENT'
              ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
              : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
        >
          <Smartphone className="w-3 h-3 text-emerald-400" />
          <span>VIP WhatsApp</span>
        </button>
        <button
          type="button"
          onClick={() => applyPreset('STORE_COUNTER')}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1 ${
            currentActiveRef === 'STORE_COUNTER'
              ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
              : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
        >
          <QrCode className="w-3 h-3 text-indigo-400" />
          <span>Counter QR Standee</span>
        </button>
        <button
          type="button"
          onClick={() => applyPreset('INSTA_BIO')}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1 ${
            currentActiveRef === 'INSTA_BIO'
              ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
              : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
        >
          <Sparkles className="w-3 h-3 text-pink-400" />
          <span>Instagram Bio</span>
        </button>
      </div>

      {/* PRIMARY SECTION: ACTIVE URL & ACTIONS */}
      <div className="p-4 sm:p-5 bg-emerald-950/40 rounded-2xl border border-emerald-600/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider">
              {currentActiveRef ? `Tagged Order Link (${currentActiveRef}):` : 'Permanent Fixed Public Order Link:'}
            </span>
          </div>
          <span className="text-[11px] text-emerald-400 font-semibold">Permanent Fixed URL · 100% active on all devices</span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="flex-1 flex items-center gap-2 bg-slate-950/90 border border-emerald-700/70 rounded-xl px-3.5 py-2.5 overflow-hidden shadow-inner">
            <code className="text-emerald-300 font-mono text-xs sm:text-sm font-bold truncate select-all">
              {effectiveUrl}
            </code>
          </div>

          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(effectiveUrl);
              setCopiedPublic(true);
              setTimeout(() => setCopiedPublic(false), 2000);
            }}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 shrink-0"
          >
            {copiedPublic ? (
              <>
                <Check className="w-4 h-4 text-slate-950" />
                <span>Copied Link!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Order Link</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSharePublicWhatsApp}
            className="px-4 py-2.5 bg-green-600 hover:bg-green-500 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-1.5 transition-all shrink-0 shadow-xs"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Send on WhatsApp</span>
          </button>

          <a
            href={effectiveUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-1.5 transition-colors shrink-0 border border-slate-700"
          >
            <span>Test /order</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* QR Code and Print Standee Card */}
        <div className="pt-3 border-t border-emerald-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {qrCodeDataUrl ? (
              <img
                src={qrCodeDataUrl}
                alt="Order QR"
                className="w-16 h-16 rounded-xl bg-white p-1 border border-emerald-500/50 shrink-0 shadow-xs"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                <QrCode className="w-6 h-6 animate-pulse" />
              </div>
            )}
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                <span>Printable Counter QR Standee</span>
              </h4>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Scan with any phone camera to view catalog & place instant orders without login.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownloadQr}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download QR</span>
            </button>
            <button
              type="button"
              onClick={handlePrintQr}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Standee</span>
            </button>
          </div>
        </div>
      </div>

      {/* CUSTOM CAMPAIGN TAG GENERATOR */}
      <div className="pt-1">
        <details className="text-xs text-slate-300 group">
          <summary className="cursor-pointer font-bold text-slate-300 hover:text-emerald-300 flex items-center gap-1.5 select-none py-1 transition-colors">
            <Link className="w-3.5 h-3.5 text-emerald-400" />
            <span>Customize Campaign / Client Tag (?ref=...)</span>
          </summary>
          <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-3 animate-in fade-in">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex-1 flex items-center gap-2 bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2">
                <Link className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={customTag}
                  onChange={e => {
                    const val = e.target.value;
                    setCustomTag(val);
                    handleGenerateTag(val);
                  }}
                  placeholder="Enter campaign or client tag (e.g. DIWALI_DEAL or RAJESH_ENTERPRISES)"
                  className="w-full bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none uppercase font-mono"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setCustomTag('');
                  handleGenerateTag('');
                }}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded-xl text-white flex items-center justify-center gap-1.5 transition-colors shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Random Tag</span>
              </button>

              <button
                type="button"
                onClick={handleCopyTagged}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shrink-0 border border-slate-700"
              >
                {copiedTagged ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Tagged</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px]">
              <span className="text-slate-400 truncate">
                Active URL: <code className="text-emerald-300 font-mono">{taggedOrderUrl}</code>
              </span>
              <a
                href={taggedOrderUrl}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 shrink-0 ml-2"
              >
                <span>Test Link</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};
