import React, { useState, useEffect, useRef, useMemo } from 'react';
import QRCode from 'qrcode';
import {
  Link2,
  Copy,
  Check,
  Share2,
  ExternalLink,
  QrCode,
  Download,
  Printer,
  Sparkles,
  ShieldCheck,
  Smartphone,
  RefreshCw,
  Users,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowRight,
  BarChart3,
  TrendingUp,
  MousePointerClick,
  Eye,
  Award,
  Zap,
  Activity,
  Filter,
  Globe
} from 'lucide-react';
import type { Product } from '../types/index';
import {
  getPublicBaseUrl,
  getSharedPublicBaseUrl,
  getCurrentOrigin,
  getCustomPublicUrl,
  setCustomPublicUrl,
  onPublicUrlChange,
  sanitizeBaseDomain,
  getDirectPublicOrderUrl,
  DEFAULT_PUBLIC_CUSTOM_DOMAIN
} from '../utils/urlHelper';

interface OrderUrlGeneratorAppProps {
  products: Product[];
  brandName: string;
}

export interface SavedLink {
  id: string;
  name: string;
  phone: string;
  ref: string;
  url: string;
  productName?: string;
  channel: string;
  createdAt: string;
  clicks: number;
  ordersConverted: number;
  lastClickedAt?: string;
}

const getSeededLinks = (): SavedLink[] => {
  const base = getPublicBaseUrl();
  return [
    {
      id: 'link-preset-1',
      name: 'Counter QR Standee (Main Store)',
      phone: '-',
      ref: 'STORE_COUNTER',
      url: `${base}/order?ref=STORE_COUNTER&src=qr`,
      productName: 'Full Catalog',
      channel: 'In-Store QR',
      createdAt: '2 days ago',
      clicks: 142,
      ordersConverted: 28,
      lastClickedAt: '12 mins ago'
    },
    {
      id: 'link-preset-2',
      name: 'VIP Client WhatsApp Direct',
      phone: '+91 98200 12345',
      ref: 'VIP_CLIENT',
      url: `${base}/order?ref=VIP_CLIENT&src=whatsapp`,
      productName: 'Full Catalog',
      channel: 'WhatsApp',
      createdAt: 'Yesterday',
      clicks: 98,
      ordersConverted: 23,
      lastClickedAt: '4 mins ago'
    },
    {
      id: 'link-preset-3',
      name: 'Instagram Bio Link Campaign',
      phone: '-',
      ref: 'INSTA_BIO',
      url: `${base}/order?ref=INSTA_BIO&src=instagram`,
      productName: 'All Products',
      channel: 'Instagram',
      createdAt: '3 days ago',
      clicks: 64,
      ordersConverted: 11,
      lastClickedAt: '1 hour ago'
    },
    {
      id: 'link-preset-4',
      name: 'Package Delivery Carton Sticker',
      phone: '-',
      ref: 'BOX_STICKER',
      url: `${base}/order?ref=BOX_STICKER&src=flyer`,
      productName: 'Floor Care 5L',
      channel: 'Package Flyer',
      createdAt: '4 days ago',
      clicks: 37,
      ordersConverted: 8,
      lastClickedAt: '3 hours ago'
    }
  ];
};

export const OrderUrlGeneratorApp: React.FC<OrderUrlGeneratorAppProps> = ({
  products,
  brandName = 'TAZE CLINING'
}) => {
  // Diagnostics state from backend
  const [diagnostics, setDiagnostics] = useState<{
    serverTime?: string;
    customStatus?: string;
    diagnosticsMessage?: string;
    currentBackendOrigin?: string;
    recommendedUrl?: string;
  } | null>(null);

  // Form fields
  const [customerName, setCustomerName] = useState('VIP Client');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customRef, setCustomRef] = useState('VIP_CLIENT');
  const [channel, setChannel] = useState('WhatsApp');
  const [selectedProductId, setSelectedProductId] = useState<string>('all');
  const [domainMode, setDomainMode] = useState<'current' | 'custom'>(() => {
    const custom = getCustomPublicUrl();
    if (custom && !custom.includes('modular-senator')) {
      return 'custom';
    }
    return 'current';
  });
  const [customDomainInput, setCustomDomainInput] = useState(() => {
    const custom = getCustomPublicUrl();
    if (custom && !custom.includes('modular-senator')) {
      return custom;
    }
    return '';
  });
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  
  // Output state
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedDirectPublic, setCopiedDirectPublic] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  
  // Direct Public Order URL state
  const directPublicUrl = `${getPublicBaseUrl()}/order`;

  // History of generated links with click analytics (auto-healed to permanent fixed link)
  const [savedLinks, setSavedLinks] = useState<SavedLink[]>(() => {
    const permanentBase = getPublicBaseUrl();
    try {
      const stored = localStorage.getItem('cleenzo_saved_order_urls');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: any, idx: number) => {
            let fixedUrl = item.url || '';
            if (fixedUrl.includes('modular-senator-affiliate-ste') || fixedUrl.includes('trycloudflare') || fixedUrl.includes('localhost') || fixedUrl.includes('127.0.0.1')) {
              try {
                const u = new URL(fixedUrl);
                fixedUrl = `${permanentBase}${u.pathname}${u.search}`;
              } catch {
                fixedUrl = `${permanentBase}/order`;
              }
            }
            return {
              ...item,
              url: fixedUrl,
              clicks: typeof item.clicks === 'number' ? item.clicks : Math.floor(15 + (idx * 7)),
              ordersConverted: typeof item.ordersConverted === 'number' ? item.ordersConverted : Math.floor(3 + (idx * 2))
            };
          });
        }
      }
    } catch {}
    return getSeededLinks();
  });

  // Table filtering and sorting for Mock Analytics
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'clicks' | 'recent' | 'conversion'>('clicks');

  // Batch generator state
  const [showBatch, setShowBatch] = useState(false);
  const [batchInput, setBatchInput] = useState('');
  const [batchResults, setBatchResults] = useState<Array<{ name: string; url: string }>>([]);

  // Probe backend diagnostics on mount
  useEffect(() => {
    fetch('/api/public-url/diagnose')
      .then(r => r.json())
      .then(d => {
        if (d && d.success) {
          setDiagnostics(d);
          if (d.customStatus === 'UNREACHABLE') {
            setDomainMode('current');
          }
        }
      })
      .catch(() => {});
  }, []);

  // Sync custom domain if changed externally
  useEffect(() => {
    const unsub = onPublicUrlChange((newUrl) => {
      if (newUrl && !newUrl.includes('modular-senator')) {
        setCustomDomainInput(newUrl);
      } else {
        setCustomDomainInput('');
      }
    });
    return unsub;
  }, []);

  // Compute clean referral string
  const computeRef = () => {
    if (customRef.trim()) {
      return customRef.trim().replace(/\s+/g, '_').toUpperCase();
    }
    if (customerName.trim()) {
      return customerName.trim().replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
    }
    if (customerPhone.trim()) {
      return customerPhone.trim().replace(/[^0-9]/g, '');
    }
    return '';
  };

  const getActiveBase = () => {
    if (domainMode === 'custom' && customDomainInput.trim()) {
      let custom = sanitizeBaseDomain(customDomainInput);
      if (custom && !custom.includes('modular-senator')) {
        return custom;
      }
    }
    return getPublicBaseUrl();
  };

  // Re-generate live URL whenever parameters change
  useEffect(() => {
    const base = getActiveBase();
    const refCode = computeRef();
    let url = refCode ? `${base}/order?ref=${encodeURIComponent(refCode)}` : `${base}/order`;
    
    const queryParams: string[] = [];
    if (refCode) {
      queryParams.push(`ref=${encodeURIComponent(refCode)}`);
    }
    if (selectedProductId !== 'all') {
      queryParams.push(`product=${encodeURIComponent(selectedProductId)}`);
    }
    if (channel && channel !== 'General') {
      queryParams.push(`src=${encodeURIComponent(channel.toLowerCase().replace(/[^a-z0-9]/g, ''))}`);
    }

    if (queryParams.length > 0) {
      url = `${base}/order?${queryParams.join('&')}`;
    } else {
      url = `${base}/order`;
    }

    setGeneratedUrl(url);

    // Render QR Code
    QRCode.toDataURL(url, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then(dataUrl => setQrDataUrl(dataUrl))
      .catch(err => console.error('QR code generation error:', err));
  }, [customerName, customerPhone, customRef, channel, selectedProductId, domainMode, customDomainInput]);

  const [isRegeneratingTunnel, setIsRegeneratingTunnel] = useState(false);

  const handleRegenerateTunnel = async () => {
    setIsRegeneratingTunnel(true);
    try {
      const res = await fetch('/api/tunnel/restart', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.publicUrl) {
        setCustomDomainInput(data.publicUrl);
        await setCustomPublicUrl(data.publicUrl);
        setDomainMode('custom');
        setIsSavedNotice(true);
        setTimeout(() => setIsSavedNotice(false), 3000);
      }
    } catch (e) {
      console.error('Failed to regenerate tunnel:', e);
    } finally {
      setIsRegeneratingTunnel(false);
    }
  };

  const handleSaveCustomDomain = async () => {
    const clean = sanitizeBaseDomain(customDomainInput);
    const saved = await setCustomPublicUrl(clean);
    setCustomDomainInput(saved);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);

    // Save to history if not duplicate
    saveToHistory();
  };

  const handleCopyDirectPublic = () => {
    navigator.clipboard.writeText(directPublicUrl);
    setCopiedDirectPublic(true);
    setTimeout(() => setCopiedDirectPublic(false), 2200);
  };

  const saveToHistory = () => {
    const refCode = computeRef();
    const existing = savedLinks.find(l => l.url === generatedUrl);
    if (!existing) {
      const productObj = products.find(p => p.id === selectedProductId);
      const newEntry: SavedLink = {
        id: 'link-' + Date.now(),
        name: customerName.trim() || 'Direct Client Link',
        phone: customerPhone.trim() || '-',
        ref: refCode || 'DIRECT_ORDER',
        url: generatedUrl,
        productName: productObj ? productObj.name : 'Full Catalog',
        channel,
        createdAt: 'Just now',
        clicks: 1,
        ordersConverted: 0,
        lastClickedAt: 'Just now'
      };
      const updated = [newEntry, ...savedLinks.slice(0, 19)];
      setSavedLinks(updated);
      try {
        localStorage.setItem('cleenzo_saved_order_urls', JSON.stringify(updated));
      } catch {}
    } else {
      // Increment clicks on duplicate generated action
      incrementLinkClicks(existing.id);
    }
  };

  // Mock Click Simulation for Analytics verification
  const incrementLinkClicks = (linkId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSavedLinks(prev => {
      const updated = prev.map(item => {
        if (item.id === linkId) {
          const newClicks = (item.clicks || 0) + 1;
          const newOrders = Math.random() > 0.65 ? (item.ordersConverted || 0) + 1 : item.ordersConverted;
          return {
            ...item,
            clicks: newClicks,
            ordersConverted: newOrders,
            lastClickedAt: 'Just now'
          };
        }
        return item;
      });
      try {
        localStorage.setItem('cleenzo_saved_order_urls', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleWhatsAppShare = () => {
    saveToHistory();
    const clientNameStr = customerName.trim() ? `Hello ${customerName.trim()}!` : 'Hello!';
    const message = `*${brandName} - Order Link*\n\n${clientNameStr}\n\nClick the link below to view our products, live stock, and place your order directly:\n👉 ${generatedUrl}\n\n✅ 100% Genuine Quality\n✅ Fast Dispatch & Cash/Online Delivery\n✅ No app download or login required`;
    
    let waUrl = `https://wa.me/`;
    const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.length >= 10) {
      const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      waUrl += `${fullPhone}?text=${encodeURIComponent(message)}`;
    } else {
      waUrl += `?text=${encodeURIComponent(message)}`;
    }
    
    window.open(waUrl, '_blank');
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `order-qr-${computeRef() || 'public-order'}.png`;
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
            img { width: 260px; height: 260px; margin-bottom: 20px; }
            .url { font-family: monospace; font-size: 11px; color: #0f172a; word-break: break-all; }
            .badge { display: inline-block; background: #ecfdf5; color: #065f46; padding: 6px 12px; border-radius: 20px; font-weight: bold; font-size: 12px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>${brandName}</h1>
            <p>Scan with any camera or phone to place your direct order</p>
            <img src="${qrDataUrl}" alt="Order QR Code" />
            <div class="url">${generatedUrl}</div>
            <div class="badge">Universal Public Order • Instant Checkout</div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleClearHistory = () => {
    setSavedLinks([]);
    try {
      localStorage.removeItem('cleenzo_saved_order_urls');
    } catch {}
  };

  const handleResetToSeededAnalytics = () => {
    const seeded = getSeededLinks();
    setSavedLinks(seeded);
    try {
      localStorage.setItem('cleenzo_saved_order_urls', JSON.stringify(seeded));
    } catch {}
  };

  const handleBatchGenerate = () => {
    const lines = batchInput.split('\n').map(l => l.trim()).filter(Boolean);
    const base = getActiveBase();
    const results = lines.map(line => {
      const parts = line.split(/[,;\t]/).map(p => p.trim());
      const name = parts[0] || 'Client';
      const ref = name.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
      const url = `${base}/order?ref=${encodeURIComponent(ref)}`;
      return { name, url };
    });
    setBatchResults(results);
  };

  // Quick Preset Loader (e.g. VIP Client & WhatsApp)
  const applyPreset = (presetName: 'vip_whatsapp' | 'counter_standee' | 'direct_order' | 'insta_bio') => {
    if (presetName === 'vip_whatsapp') {
      setCustomerName('VIP Client');
      setCustomRef('VIP_CLIENT');
      setChannel('WhatsApp');
      setSelectedProductId('all');
    } else if (presetName === 'counter_standee') {
      setCustomerName('Counter Standee');
      setCustomRef('STORE_COUNTER');
      setChannel('In-Store QR');
      setSelectedProductId('all');
    } else if (presetName === 'direct_order') {
      setCustomerName('');
      setCustomerPhone('');
      setCustomRef('');
      setChannel('General');
      setSelectedProductId('all');
    } else if (presetName === 'insta_bio') {
      setCustomerName('Instagram Bio Link');
      setCustomRef('INSTA_BIO');
      setChannel('Instagram');
      setSelectedProductId('all');
    }
  };

  // === MOCK ANALYTICS CALCULATIONS ===
  const analyticsSummary = useMemo(() => {
    const totalClicks = savedLinks.reduce((acc, l) => acc + (l.clicks || 0), 0);
    const totalOrders = savedLinks.reduce((acc, l) => acc + (l.ordersConverted || 0), 0);
    const avgOrderValue = 2700; // Estimated ৳2,700 average cart size
    const estimatedRevenue = totalOrders * avgOrderValue;
    const overallConversionRate = totalClicks > 0 ? ((totalOrders / totalClicks) * 100).toFixed(1) : '0.0';

    // Channel breakdown
    const channelMap: Record<string, { clicks: number; orders: number }> = {};
    savedLinks.forEach(l => {
      const ch = l.channel || 'General';
      if (!channelMap[ch]) {
        channelMap[ch] = { clicks: 0, orders: 0 };
      }
      channelMap[ch].clicks += l.clicks || 0;
      channelMap[ch].orders += l.ordersConverted || 0;
    });

    let topChannelName = 'In-Store QR';
    let maxClicks = 0;
    Object.entries(channelMap).forEach(([ch, data]) => {
      if (data.clicks > maxClicks) {
        maxClicks = data.clicks;
        topChannelName = ch;
      }
    });

    return {
      totalClicks,
      totalOrders,
      estimatedRevenue,
      overallConversionRate,
      topChannelName,
      maxClicks,
      channelBreakdown: Object.entries(channelMap).map(([ch, data]) => ({
        channel: ch,
        clicks: data.clicks,
        orders: data.orders,
        percentage: totalClicks > 0 ? ((data.clicks / totalClicks) * 100).toFixed(1) : '0'
      })).sort((a, b) => b.clicks - a.clicks)
    };
  }, [savedLinks]);

  // Filtered & Sorted Links
  const displayedLinks = useMemo(() => {
    let list = [...savedLinks];
    if (channelFilter !== 'ALL') {
      list = list.filter(l => l.channel === channelFilter);
    }
    list.sort((a, b) => {
      if (sortBy === 'clicks') return (b.clicks || 0) - (a.clicks || 0);
      if (sortBy === 'conversion') {
        const rateA = a.clicks ? (a.ordersConverted / a.clicks) : 0;
        const rateB = b.clicks ? (b.ordersConverted / b.clicks) : 0;
        return rateB - rateA;
      }
      return 0; // default order
    });
    return list;
  }, [savedLinks, channelFilter, sortBy]);

  const uniqueChannels = useMemo(() => {
    const set = new Set(savedLinks.map(l => l.channel).filter(Boolean));
    return Array.from(set);
  }, [savedLinks]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* SECTION 1: PRIMARY PUBLIC ORDER URL SHOWCASE */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-700/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>Public Customer Order URL Active</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display text-white">
              Universal Customer Order Link
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Customers can open this public order URL on WhatsApp, Mobile, or Desktop to browse the catalog, select packaging, and place orders directly. <strong>No customer ID</strong>, <strong>no password</strong>, and <strong>no account registration required</strong>.
            </p>

            {/* Display the active Public Order URL */}
            <div className="pt-1 flex items-center gap-2">
              <code className="px-3.5 py-2 bg-emerald-950/80 rounded-xl text-emerald-300 font-mono text-xs sm:text-sm border border-emerald-700/60 truncate max-w-md sm:max-w-xl select-all">
                {directPublicUrl}
              </code>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap lg:flex-col gap-2.5 shrink-0 justify-end">
            <button
              onClick={handleCopyDirectPublic}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-extrabold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20"
            >
              {copiedDirectPublic ? (
                <>
                  <Check className="w-4 h-4 text-emerald-900" />
                  <span>Copied Public Order URL!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Public Order URL</span>
                </>
              )}
            </button>

            <a
              href={directPublicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all border border-white/15"
            >
              <ExternalLink className="w-4 h-4 text-emerald-300" />
              <span>Open /order in New Tab</span>
            </a>

            <button
              onClick={() => {
                const message = `*${brandName} - Online Order Catalog*\n\nBrowse products and place your order directly:\n👉 ${directPublicUrl}\n\n✅ 100% Genuine Quality\n✅ Cash on Delivery & Express Dispatch`;
                window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
              }}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 active:scale-95 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <Share2 className="w-4 h-4" />
              <span>Share on WhatsApp</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: GENERATOR & QR WORKBENCH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Builder */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-display">Targeted Order Link & QR Generator</h2>
              <p className="text-xs text-slate-500">Create customized links for WhatsApp broadcasts, QR standees, or marketing campaigns</p>
            </div>
            <button
              onClick={() => setShowBatch(!showBatch)}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors"
            >
              {showBatch ? 'Single Link Mode' : 'Bulk Batch Generator'}
            </button>
          </div>

          {/* Quick Presets Bar */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Quick 1-Click Link Presets:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => applyPreset('vip_whatsapp')}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                <span>VIP Client (WhatsApp)</span>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('counter_standee')}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                <span>Store Counter Standee</span>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('direct_order')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Globe className="w-3.5 h-3.5 text-slate-600" />
                <span>Clean Universal /order</span>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('insta_bio')}
                className="px-3 py-1.5 bg-pink-50 hover:bg-pink-100 text-pink-800 border border-pink-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-pink-600" />
                <span>Instagram Bio Link</span>
              </button>
            </div>
          </div>

          {!showBatch ? (
            <div className="space-y-5">
              {/* Domain Host Target Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Order Link Host Domain
                  </label>
                  <span className="text-[10px] text-emerald-700 font-medium">
                    Verified Public Engine Active
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDomainMode('current')}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold text-left border transition-all ${
                      domainMode === 'current'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Live App Host (Guaranteed Working)</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                      {getPublicBaseUrl() || 'Verified Public Customer Domain'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDomainMode('custom')}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold text-left border transition-all ${
                      domainMode === 'custom'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${diagnostics?.customStatus === 'UNREACHABLE' ? 'bg-amber-500' : 'bg-slate-400'}`} />
                      <span>Custom Tunnel / Domain</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                      {customDomainInput || 'Enter custom tunnel or domain'}
                    </span>
                  </button>
                </div>

                {/* Connection Health Alert if custom tunnel is unreachable */}
                {diagnostics?.customStatus === 'UNREACHABLE' && customDomainInput && (
                  <div className="mt-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2">
                    <div>
                      <span className="font-bold block">⚠️ External Tunnel Unreachable:</span>
                      <span className="text-[11px] text-amber-800">
                        {customDomainInput} cannot be reached (tunnel may be closed or offline). All links automatically route to your active server host.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDomainMode('current');
                        setCustomDomainInput('');
                        handleSaveCustomDomain();
                      }}
                      className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 rounded-lg font-bold text-xs shrink-0 transition-colors"
                    >
                      Clear & Use Live Host
                    </button>
                  </div>
                )}

                {/* Domain Input Field */}
                <div className="mt-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-slate-800">
                      Custom Public Domain / Tunnel URL:
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleRegenerateTunnel}
                        disabled={isRegeneratingTunnel}
                        className="text-[10px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 hover:underline disabled:opacity-50"
                        title="Start or restart Cloudflare tunnel to get fresh public link"
                      >
                        <RefreshCw className={`w-3 h-3 ${isRegeneratingTunnel ? 'animate-spin' : ''}`} />
                        <span>{isRegeneratingTunnel ? 'Connecting...' : '🔄 Auto-Generate Public URL'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomDomainInput('');
                          handleSaveCustomDomain();
                        }}
                        className="text-[10px] text-rose-600 hover:underline font-semibold"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customDomainInput}
                      onChange={e => setCustomDomainInput(e.target.value)}
                      placeholder="e.g. https://your-domain.com or https://new-tunnel.trycloudflare.com"
                      className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={handleSaveCustomDomain}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-xs transition-colors shrink-0 shadow-xs"
                    >
                      {isSavedNotice ? 'Saved!' : 'Save Domain'}
                    </button>
                  </div>
                  {isSavedNotice && (
                    <span className="text-[11px] text-emerald-700 font-semibold block animate-fade-in">
                      ✓ Public Order URL domain saved and synchronized across the app!
                    </span>
                  )}
                </div>
              </div>

              {/* Customer Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Customer / Campaign Name
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="e.g. VIP Client, Shanti Hotel, Counter QR"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    WhatsApp Number (for 1-click share)
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="e.g. 9820012345 or +91..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Custom Referral Code Override */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Campaign Ref Code (optional)
                  </label>
                  <span className="text-[11px] text-slate-400">Leave blank for clean /order</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customRef}
                    onChange={e => setCustomRef(e.target.value)}
                    placeholder="VIP_CLIENT"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm uppercase text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setCustomRef('')}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold shrink-0"
                    title="Clear ref to generate clean /order link"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Marketing Channel Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Marketing Channel (for QR Click & Sales Analytics)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['WhatsApp', 'In-Store QR', 'Instagram', 'Package Flyer', 'SMS', 'Facebook', 'Direct Standee', 'General'].map(ch => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setChannel(ch)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                        channel === ch
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-800 shadow-2xs font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Target */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Landing Catalog Target
                </label>
                <select
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                >
                  <option value="all">Full Product Catalog (All Categories)</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.category})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            /* Bulk Batch Input */
            <div className="space-y-4">
              <label className="block text-xs font-semibold text-slate-700">
                Paste Customer Names or Numbers (one per line)
              </label>
              <textarea
                rows={5}
                value={batchInput}
                onChange={e => setBatchInput(e.target.value)}
                placeholder={"Ramesh Patel\nSuresh Shah\n9820011223\nHotel Green Palace"}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
              <button
                onClick={handleBatchGenerate}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-all"
              >
                Generate Bulk Order Links
              </button>

              {batchResults.length > 0 && (
                <div className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-1">
                  {batchResults.map((res, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                      <div>
                        <span className="font-semibold text-slate-800">{res.name}</span>
                        <div className="text-[10px] text-slate-500 truncate max-w-xs">{res.url}</div>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(res.url);
                          alert(`Copied link for ${res.name}!`);
                        }}
                        className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-slate-700 font-medium shrink-0"
                      >
                        Copy
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Live Output & Action Hub */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Output Card */}
          <div className="bg-white rounded-3xl border-2 border-emerald-500/40 shadow-lg p-6 sm:p-8 space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Live Order Link Ready
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Ref: {computeRef() || 'NONE (DIRECT)'}
                </span>
              </div>

              {/* Clickable / Copyable URL Box */}
              <div className="relative group">
                <div className="p-3.5 bg-slate-900 text-emerald-400 rounded-2xl font-mono text-xs break-all border border-slate-800 shadow-inner select-all">
                  {generatedUrl}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleCopy}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-200" />
                      <span>Copied URL!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Order Link</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleWhatsAppShare}
                  className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 active:scale-95 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-green-600/20"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Send on WhatsApp</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <a
                  href={generatedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-slate-600 hover:text-emerald-700 flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Live Link in New Tab
                </a>
                <span className="text-[11px] text-slate-400 font-medium">
                  Direct Order • No Login
                </span>
              </div>
            </div>

            {/* Scannable QR Code Box */}
            <div className="border-t border-slate-100 pt-5 flex items-center gap-5">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Order QR Code"
                  className="w-24 h-24 rounded-xl border border-slate-200 p-1 bg-white shrink-0 shadow-xs"
                />
              ) : (
                <div className="w-24 h-24 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                  <QrCode className="w-8 h-8 animate-spin" />
                </div>
              )}

              <div className="space-y-2 flex-1">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Printable Order QR Code
                </h4>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Display at billing counter, table standees, or print on product delivery cartons.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleDownloadQr}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1 transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    Download PNG
                  </button>
                  <button
                    onClick={handlePrintQr}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1 transition-colors"
                  >
                    <Printer className="w-3 h-3" />
                    Print Standee
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: MOCK MARKETING ANALYTICS & QR CLICK TRACKING */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Analytics Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg font-display">
                Order Link & QR Code Analytics
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Track total clicks, scans, and conversion rates per marketing channel to identify your most profitable channels.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleResetToSeededAnalytics}
              className="text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              Reset Sample Data
            </button>
            <button
              onClick={handleClearHistory}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear All Links
            </button>
          </div>
        </div>

        {/* 4 Key Metric Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Clicks & Scans */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">Total Clicks & Scans</span>
              <MousePointerClick className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 font-display">
              {analyticsSummary.totalClicks}
            </div>
            <div className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>+18% from last week</span>
            </div>
          </div>

          {/* Card 2: Most Effective Channel */}
          <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200">
            <div className="flex items-center justify-between text-emerald-800 mb-2">
              <span className="text-xs font-semibold">Top Marketing Channel</span>
              <Award className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-black text-emerald-950 font-display truncate">
              {analyticsSummary.topChannelName}
            </div>
            <div className="text-[11px] text-emerald-700 font-medium mt-1">
              {analyticsSummary.maxClicks} scans ({analyticsSummary.channelBreakdown[0]?.percentage || 0}% share)
            </div>
          </div>

          {/* Card 3: Order Conversion Rate */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">Order Conversion Rate</span>
              <Activity className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 font-display">
              {analyticsSummary.overallConversionRate}%
            </div>
            <div className="text-[11px] text-indigo-700 font-medium mt-1">
              {analyticsSummary.totalOrders} direct orders converted
            </div>
          </div>

          {/* Card 4: Estimated Channel Revenue */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">Attributed Link Revenue</span>
              <Zap className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 font-display">
              ৳{analyticsSummary.estimatedRevenue.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              Avg. ৳2,700 per converted cart
            </div>
          </div>
        </div>

        {/* Channel Performance Share Breakdown Bars */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">
              Channel Engagement & Traffic Breakdown
            </span>
            <span className="text-[11px] text-slate-500">
              Based on QR scans & referral links
            </span>
          </div>

          <div className="space-y-2">
            {analyticsSummary.channelBreakdown.map((item, idx) => (
              <div key={item.channel} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${
                      idx === 0 ? 'bg-emerald-500' : idx === 1 ? 'bg-indigo-500' : idx === 2 ? 'bg-amber-500' : 'bg-slate-400'
                    }`} />
                    {item.channel}
                  </span>
                  <span className="text-slate-500 font-mono text-[11px]">
                    {item.clicks} clicks • {item.orders} orders ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      idx === 0 ? 'bg-emerald-500' : idx === 1 ? 'bg-indigo-500' : idx === 2 ? 'bg-amber-500' : 'bg-slate-400'
                    }`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 4: RECENT LINKS TABLE WITH LIVE CLICK TRACKING */}
        <div className="space-y-3 pt-2">
          {/* Controls: Filter & Sort */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <h4 className="font-bold text-slate-900 text-sm">
                Generated Links Table ({displayedLinks.length})
              </h4>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Channel Filter */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>Channel:</span>
                <select
                  value={channelFilter}
                  onChange={e => setChannelFilter(e.target.value)}
                  className="bg-transparent font-semibold text-slate-900 focus:outline-none"
                >
                  <option value="ALL">All Channels</option>
                  {uniqueChannels.map(ch => (
                    <option key={ch} value={ch}>{ch}</option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg">
                <span>Sort:</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="bg-transparent font-semibold text-slate-900 focus:outline-none"
                >
                  <option value="clicks">Most Clicks / Scans</option>
                  <option value="conversion">Highest Conversion</option>
                  <option value="recent">Recent First</option>
                </select>
              </div>
            </div>
          </div>

          {/* Links Table */}
          {displayedLinks.length === 0 ? (
            <div className="py-12 text-center bg-slate-50 rounded-2xl border border-slate-200">
              <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-600">No links found for selected channel</p>
              <button
                onClick={() => setChannelFilter('ALL')}
                className="mt-2 text-xs text-emerald-700 hover:underline font-bold"
              >
                Clear filter
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3.5">Customer / Campaign</th>
                    <th className="py-3 px-3">Channel</th>
                    <th className="py-3 px-3">Tracking Ref</th>
                    <th className="py-3 px-3 text-center">Clicks / Scans</th>
                    <th className="py-3 px-3 text-center">Converted Orders</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {displayedLinks.map(link => {
                    const convRate = link.clicks > 0 ? ((link.ordersConverted / link.clicks) * 100).toFixed(0) : '0';
                    const isTopChannel = link.channel === analyticsSummary.topChannelName;

                    return (
                      <tr key={link.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3.5">
                          <span className="font-semibold text-slate-900 block">{link.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono block truncate max-w-xs">
                            {link.url}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            link.channel === 'WhatsApp'
                              ? 'bg-green-100 text-green-800'
                              : link.channel === 'In-Store QR'
                              ? 'bg-indigo-100 text-indigo-800'
                              : link.channel === 'Instagram'
                              ? 'bg-pink-100 text-pink-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {link.channel}
                          </span>
                        </td>

                        <td className="py-3 px-3 font-mono text-[11px] font-bold text-emerald-800">
                          {link.ref}
                        </td>

                        {/* Interactive Click Counter */}
                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-xs px-2 py-0.5 bg-slate-100 rounded-md">
                              {link.clicks || 0}
                            </span>
                            <button
                              onClick={(e) => incrementLinkClicks(link.id, e)}
                              title="Simulate a test scan/click to see analytics increment"
                              className="px-1.5 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[10px] font-bold transition-all active:scale-90"
                            >
                              +1 Click
                            </button>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className="font-bold text-slate-700">
                            {link.ordersConverted || 0}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            ({convRate}% conv)
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          {isTopChannel ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              <Award className="w-3 h-3 text-amber-600" />
                              Top Performer
                            </span>
                          ) : (link.clicks || 0) > 30 ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <TrendingUp className="w-3 h-3" />
                              Active Traffic
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">
                              Monitoring
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(link.url);
                                alert(`Copied order URL for ${link.name}!`);
                                incrementLinkClicks(link.id);
                              }}
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                              title="Copy URL"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => incrementLinkClicks(link.id)}
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                              title="Open in new tab"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
