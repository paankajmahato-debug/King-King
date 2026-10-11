import React, { useState, useEffect } from 'react';
import { Tag, Sparkles, Check, Save, RotateCcw, Building2 } from 'lucide-react';
import type { StoreSettings } from '../../types/index';
import { api } from '../../services/api';

interface StoreBrandEditorProps {
  settings: StoreSettings;
  onUpdateSettings: (updated: StoreSettings) => void;
}

export const StoreBrandEditor: React.FC<StoreBrandEditorProps> = ({
  settings,
  onUpdateSettings
}) => {
  const [brandName, setBrandName] = useState(settings.brandName || 'TAZE CLINING');
  const [tagline, setTagline] = useState(settings.tagline || 'Pro Hygiene Solutions');
  const [heroTitle, setHeroTitle] = useState(settings.heroTitle || 'Clinical Cleanliness.');
  const [heroSubtitle, setHeroSubtitle] = useState(settings.heroSubtitle || 'Crafted for Homes & Industry.');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync internal state if prop updates from server
  useEffect(() => {
    if (settings.brandName) setBrandName(settings.brandName);
    if (settings.tagline) setTagline(settings.tagline);
    if (settings.heroTitle) setHeroTitle(settings.heroTitle);
    if (settings.heroSubtitle) setHeroSubtitle(settings.heroSubtitle);
  }, [settings]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!brandName.trim()) {
      setErrorMessage('Store brand name cannot be empty');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);
      const updated = await api.updateSettings({
        brandName: brandName.trim(),
        tagline: tagline.trim(),
        heroTitle: heroTitle.trim(),
        heroSubtitle: heroSubtitle.trim()
      });
      onUpdateSettings(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save store brand settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyPreset = (presetName: string, presetTag: string) => {
    setBrandName(presetName);
    setTagline(presetTag);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-slate-900 font-display">
              Store Brand Name & Tagline Settings
            </h2>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Live Input
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Change your business brand name and tags using the input fields below. Updates apply immediately to the website, customer order pages, and WhatsApp orders.
          </p>
        </div>

        {/* Live Preview Pill */}
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 self-start sm:self-auto">
          <div className="w-7 h-7 rounded-md bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-xs font-black tracking-tight text-slate-900 leading-tight">
              {brandName || 'Store Name'}
            </div>
            <div className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">
              {tagline || 'Tagline'}
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="mt-5 space-y-4">
        {/* Quick Presets */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
            Quick One-Click Name Presets
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleApplyPreset('TAZE CLINING', 'Pro Hygiene Solutions')}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                brandName === 'TAZE CLINING'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              TAZE CLINING
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('TEJ CLINING', 'Pro Hygiene Solutions')}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                brandName === 'TEJ CLINING'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              TEJ CLINING
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('PAANKAJ CLINING', 'Pro Hygiene Solutions')}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                brandName === 'PAANKAJ CLINING'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              PAANKAJ CLINING
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('TAGE HYGIENE SOLUTIONS', 'Hospital-Grade Cleanliness')}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                brandName === 'TAGE HYGIENE SOLUTIONS'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              TAGE HYGIENE
            </button>
          </div>
        </div>

        {/* Input Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Brand Name Input Tag */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                Store Brand Name <span className="text-rose-500">*</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Primary Brand Header</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={brandName}
                onChange={e => setBrandName(e.target.value)}
                placeholder="Enter Brand Name (e.g. TAZE CLINING)"
                className="w-full px-3.5 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white text-sm font-bold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-display"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Appears in Navbar, Page Title, Footer, and Customer Links.
            </p>
          </div>

          {/* Tagline Input Tag */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-500" />
                Tagline / Subtitle Tag
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Under Brand Name</span>
            </label>
            <input
              type="text"
              value={tagline}
              onChange={e => setTagline(e.target.value)}
              placeholder="e.g. Pro Hygiene Solutions"
              className="w-full px-3.5 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white text-sm font-medium text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Displays as the secondary badge under the logo in the header.
            </p>
          </div>

          {/* Hero Headline Tag */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
              <span>Homepage Hero Headline Tag</span>
              <span className="text-[10px] text-slate-400 font-normal">Banner Top</span>
            </label>
            <input
              type="text"
              value={heroTitle}
              onChange={e => setHeroTitle(e.target.value)}
              placeholder="e.g. Clinical Cleanliness."
              className="w-full px-3.5 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white text-xs font-semibold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
            />
          </div>

          {/* Hero Subtitle Tag */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
              <span>Homepage Sub-Headline Highlight Tag</span>
              <span className="text-[10px] text-slate-400 font-normal">Banner Accent</span>
            </label>
            <input
              type="text"
              value={heroSubtitle}
              onChange={e => setHeroSubtitle(e.target.value)}
              placeholder="e.g. Crafted for Homes & Industry."
              className="w-full px-3.5 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white text-xs font-semibold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
            />
          </div>
        </div>

        {/* Error / Success Feedback */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium">
            {errorMessage}
          </div>
        )}

        {saveSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Store name & tags updated successfully! Reflected live across the whole store.</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => {
              setBrandName('TAZE CLINING');
              setTagline('Pro Hygiene Solutions');
              setHeroTitle('Clinical Cleanliness.');
              setHeroSubtitle('Crafted for Homes & Industry.');
            }}
            className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Default</span>
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-emerald-600/20 flex items-center gap-2"
          >
            {isSaving ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>Save Store Name & Tags</span>
          </button>
        </div>
      </form>
    </div>
  );
};
