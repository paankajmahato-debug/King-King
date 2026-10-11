import React, { useState } from 'react';
import { Lock, Copy, Check, MessageCircle, ExternalLink, Bookmark, ShieldCheck, Key, Download } from 'lucide-react';
import { getPublicBaseUrl } from '../../utils/urlHelper';

interface OwnerLinkCardProps {
  brandName?: string;
}

export const OwnerLinkCard: React.FC<OwnerLinkCardProps> = ({ brandName = 'TAZE CLINING' }) => {
  const [copied, setCopied] = useState(false);

  // Generate public owner link accessible across all devices
  const baseUrl = getPublicBaseUrl();
  const ownerPublicUrl = `${baseUrl}/owner`;
  const ownerAltUrl = `${baseUrl}/?admin=true`;

  const handleCopy = () => {
    navigator.clipboard.writeText(ownerPublicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppMyself = () => {
    const text = `${brandName} — Private Owner Access Link:
${ownerPublicUrl}

Bookmark this link to directly open your Master Operations Admin Dashboard anytime.`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Key className="w-3.5 h-3.5" />
            <span>CONFIDENTIAL · OWNER PUBLIC ACCESS URL</span>
          </div>
          <h2 className="text-lg font-extrabold font-display tracking-tight text-white mt-1">
            Direct Owner Portal Link
          </h2>
          <p className="text-xs text-slate-400 max-w-xl mt-0.5">
            This is your dedicated public URL to access the Master Admin Terminal directly from any phone, tablet, or browser without visiting customer pages.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-emerald-400 shrink-0">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>Full Operations Access</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Link Box */}
        <div className="flex-1 flex items-center gap-2.5 bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 truncate">
          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
          <code className="text-amber-200 font-mono text-xs font-semibold truncate select-all">
            {ownerPublicUrl}
          </code>
        </div>

        {/* Copy Button */}
        <button
          type="button"
          onClick={handleCopy}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs shrink-0 active:scale-95"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-slate-950" />
              <span>Copied Owner Link!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy Owner Link</span>
            </>
          )}
        </button>

        {/* WhatsApp to Self */}
        <button
          type="button"
          onClick={handleWhatsAppMyself}
          className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shrink-0 border border-slate-700"
          title="Save this link in your personal WhatsApp chat"
        >
          <MessageCircle className="w-4 h-4 text-emerald-400" />
          <span>Send to My WhatsApp</span>
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
        <span>Alternate direct link: <code className="text-slate-400 font-mono">{ownerAltUrl}</code></span>
        <span className="flex items-center gap-1 text-slate-400">
          <Bookmark className="w-3 h-3 text-amber-400" />
          Bookmark for instant access
        </span>
      </div>

      {/* DUAL ANDROID APK DOWNLOAD SECTION */}
      <div className="mt-4 pt-4 border-t border-slate-800 bg-slate-950/60 -mx-5 -mb-5 p-5 rounded-b-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
              <Download className="w-4 h-4" />
              <span>DUAL ANDROID APPS — DIRECT DOWNLOAD</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Two separate native Android APKs connected to this same live database.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/download/owner-apk"
              download="TAZE-CLINING-Owner.apk"
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
              title="Download Private Owner Android APK"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Owner APK (Private)</span>
            </a>

            <a
              href="/download/customer-apk"
              download="TAZE-CLINING-Customer.apk"
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
              title="Download Customer Android APK to share with clients"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Customer APK (Shareable)</span>
            </a>

            <a
              href="/owner-app"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl flex items-center gap-1 transition-colors border border-slate-700"
              title="Open Mobile Owner App in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span>Open Owner App</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
