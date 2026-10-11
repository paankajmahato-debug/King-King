import React, { useState, useEffect } from 'react';
import type { CustomerProfile } from '../types/index';
import { api } from '../services/api';
import {
  ShieldCheck,
  Phone,
  User,
  ArrowRight,
  KeyRound,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Lock,
  X,
  LogIn,
  UserPlus
} from 'lucide-react';

interface CustomerVerificationModalProps {
  isOpen: boolean;
  onVerified: (profile: CustomerProfile) => void;
  onClose?: () => void;
  brandName?: string;
  referralSource?: string;
  isEmbedded?: boolean;
}

export const CustomerVerificationModal: React.FC<CustomerVerificationModalProps> = ({
  isOpen,
  onVerified,
  onClose,
  brandName = 'TAZE CLINING',
  referralSource = '',
  isEmbedded = false
}) => {
  // Mode: 'register' (Name + Phone) | 'login' (Phone Direct) | 'otp' (Phone + OTP)
  const [mode, setMode] = useState<'register' | 'login' | 'otp'>('register');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval: any = null;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  if (!isOpen) return null;

  // 1. CREATE PROFILE (Name + Phone) - No password lock
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    if (!cleanName) {
      setError('Please enter your full name');
      return;
    }
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      const res = await api.registerCustomer(cleanName, cleanPhone, undefined, referralSource);
      onVerified(res.customer);
    } catch (err: any) {
      setError(err.message || 'Failed to create customer profile');
    } finally {
      setLoading(false);
    }
  };

  // 2. SIGN IN (Phone) - Direct access without password lock
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.replace(/[^0-9]/g, '');

    if (cleanPhone.length < 10) {
      setError('Please enter your 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      const res = await api.loginCustomer(cleanPhone);
      onVerified(res.customer);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials or create a profile.');
    } finally {
      setLoading(false);
    }
  };

  // 3. OTP FLOW (Send & Verify OTP)
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      await api.sendCustomerOtp(name.trim() || 'Customer', cleanPhone, referralSource);
      setMode('otp');
      setResendTimer(60);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanOtp = otp.trim();
    if (!cleanOtp) {
      setError('Please enter the 6-digit OTP code');
      return;
    }

    setLoading(true);
    try {
      const res = await api.verifyCustomerOtp(phone, cleanOtp, name, referralSource);
      onVerified(res.customer);
    } catch (err: any) {
      setError(err.message || 'Invalid OTP code. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const cardContent = (
    <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden relative">
      {/* Close button */}
      {!isEmbedded && onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 text-white flex items-center justify-center transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Brand Header */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 p-6 text-white text-center relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner mb-3">
          <ShieldCheck className="w-6 h-6 text-emerald-300" />
        </div>

        <h2 className="text-xl font-extrabold font-display tracking-tight text-white">
          Customer Portal
        </h2>
        <p className="text-xs text-emerald-100/90 mt-1 max-w-xs mx-auto">
          Create your profile once to order products and track delivery updates in real-time.
        </p>

        {referralSource && (
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-[11px] font-semibold text-emerald-200">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Ref: {referralSource}</span>
          </div>
        )}
      </div>

      {/* Tabs: Create Profile vs Sign In */}
      <div className="flex border-b border-slate-200 bg-slate-50">
        <button
          type="button"
          onClick={() => {
            setMode('register');
            setError(null);
          }}
          className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-all border-b-2 ${
            mode === 'register'
              ? 'border-emerald-600 text-emerald-700 bg-white font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Create Profile</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('login');
            setError(null);
          }}
          className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-all border-b-2 ${
            mode === 'login' || mode === 'otp'
              ? 'border-emerald-600 text-emerald-700 bg-white font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <LogIn className="w-4 h-4" />
          <span>Sign In</span>
        </button>
      </div>

      {/* Form Body */}
      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. REGISTER: NAME + PHONE + PASSWORD */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Ramesh Patel"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-bold text-slate-500 pr-2 border-r border-slate-200">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>+91</span>
                </div>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="9876543210"
                  className="w-full pl-20 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-mono font-medium tracking-wide"
                />
              </div>
            </div>

            <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl text-emerald-800 text-[11px] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Instant profile activation. No password required.</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Creating Profile...</span>
                </>
              ) : (
                <>
                  <span>Create Profile & Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* 2. SIGN IN: PHONE - NO PASSWORD LOCK */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Registered Mobile Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-bold text-slate-500 pr-2 border-r border-slate-200">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>+91</span>
                </div>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="9876543210"
                  className="w-full pl-20 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-mono font-medium tracking-wide"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1">
              <span className="text-slate-500">Direct mobile sign in</span>
              <button
                type="button"
                onClick={handleSendOtp}
                className="text-emerald-600 hover:text-emerald-700 font-semibold"
              >
                Sign in with OTP instead
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* 3. SIGN IN WITH OTP */}
        {mode === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
              <div>
                <span className="font-semibold block">OTP sent to:</span>
                <span className="font-mono font-bold">+91 {phone}</span>
              </div>
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-emerald-700 text-xs font-bold hover:underline"
              >
                Change
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                6-Digit Verification Code <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="123456"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-mono font-bold tracking-widest text-center"
                />
              </div>
              <p className="text-[11px] text-slate-400 text-center mt-1">
                Demo code: <span className="font-mono font-bold text-slate-600">123456</span>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 4}
              className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify OTP & Sign In</span>
                </>
              )}
            </button>

            <div className="text-center pt-1">
              {resendTimer > 0 ? (
                <span className="text-[11px] text-slate-400">
                  Resend code in {resendTimer}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold"
                >
                  Resend Code
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );

  if (isEmbedded) {
    return cardContent;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      {cardContent}
    </div>
  );
};
