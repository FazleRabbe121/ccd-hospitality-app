import React, { useState } from 'react';
import {
  User,
  Mail,
  Lock,
  Phone,
  Code2,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';
import {
  signUpUserWithPasscode,
  loginUserWithPasscode,
  REQUIRED_DEVELOPER_CODE,
} from '../services/cvStorage';
import { CVData, CVUserAccount } from '../types/cv';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (account: CVUserAccount, cvData?: CVData) => void;
  initialMode?: 'login' | 'signup';
  canClose?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'login',
  canClose = true,
}) => {
  const [tab, setTab] = useState<'login' | 'signup'>(initialMode);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [passcode, setPasscode] = useState('');
  const [phone, setPhone] = useState('');
  const [developerCode, setDeveloperCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (tab === 'signup') {
        const result = await signUpUserWithPasscode(
          name,
          email,
          passcode,
          phone,
          developerCode
        );

        if (result.success && result.account) {
          setSuccessMessage('সাইন আপ সফল হয়েছে! আপনার ডেটা লোড হচ্ছে...');
          setTimeout(() => {
            onAuthSuccess(result.account!, result.cvData);
            onClose();
          }, 800);
        } else {
          setErrorMessage(result.error || 'সাইন আপ ব্যর্থ হয়েছে');
        }
      } else {
        const result = await loginUserWithPasscode(email, passcode);
        if (result.success && result.account) {
          setSuccessMessage('লগইন সফল হয়েছে! স্বাগতম...');
          setTimeout(() => {
            onAuthSuccess(result.account!, result.cvData);
            onClose();
          }, 800);
        } else {
          setErrorMessage(result.error || 'লগইন ব্যর্থ হয়েছে');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-md bg-[#161a24] border border-[#d4af37]/50 rounded-3xl p-6 sm:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.85)] text-[#f3f4f6] my-6">
        {/* Optional Close Button if user can close */}
        {canClose && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Brand Crest Header */}
        <div className="text-center pb-5 border-b border-gray-800">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-[#d4af37]/30 to-[#aa771c]/10 border border-[#d4af37]/60 text-[#ffd700] mb-3 shadow">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="font-['Montserrat'] font-bold text-xl text-white tracking-wide">
            {tab === 'login' ? 'লগইন করুন (Log In)' : 'নতুন অ্যাকাউন্ট তৈরি করুন (Sign Up)'}
          </h2>
          <p className="text-xs text-[#94a3b8] mt-1 font-['Inter']">
            {tab === 'login'
              ? 'শুধুমাত্র আপনার জিমেইল ও ৫ ডিজিটের পাসকোড দিন'
              : `সাইন আপ করতে ডেভলপার কোড ${REQUIRED_DEVELOPER_CODE} আবশ্যক`}
          </p>
        </div>

        {/* Tab Toggle Buttons */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-[#0d1017] rounded-2xl my-5 border border-gray-800">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setErrorMessage('');
            }}
            className={`py-2 text-xs font-semibold rounded-xl transition ${
              tab === 'login'
                ? 'bg-gradient-to-r from-[#d4af37] to-[#aa771c] text-[#0b0c10] shadow font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            লগইন (Log In)
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('signup');
              setErrorMessage('');
            }}
            className={`py-2 text-xs font-semibold rounded-xl transition ${
              tab === 'signup'
                ? 'bg-gradient-to-r from-[#d4af37] to-[#aa771c] text-[#0b0c10] shadow font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            সাইন আপ (Sign Up)
          </button>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Sign Up Only: Full Name */}
          {tab === 'signup' && (
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1 font-['Montserrat']">
                পূর্ণ নাম (Full Name) *
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="যেমন: Fazle Rabbi"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0d1017] border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#d4af37]"
                />
              </div>
            </div>
          )}

          {/* Email / Gmail Field (Required for both) */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1 font-['Montserrat']">
              জিমেইল / ইমেইল (Gmail / Email) *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-500" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="যেমন: Fazlerabbe905@gmail.com"
                className="w-full pl-10 pr-4 py-2.5 bg-[#0d1017] border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#d4af37]"
              />
            </div>
          </div>

          {/* 5-Digit Passcode Field (Required for both) */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#ffd700] mb-1 font-['Montserrat'] flex items-center justify-between">
              <span>পাসকোড (৫ ডিজিট Passcode) *</span>
              <span className="text-[10px] text-gray-400 font-normal">ঠিক ৫টি সংখ্যা (যেমন: 12345)</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-[#ffd700]" />
              <input
                type="password"
                required
                maxLength={5}
                pattern="\d{5}"
                value={passcode}
                onChange={e => setPasscode(e.target.value.replace(/\D/g, ''))}
                placeholder="৫ ডিজিট পাসকোড লিখুন"
                className="w-full pl-10 pr-4 py-2.5 bg-[#0d1017] border border-[#d4af37]/60 rounded-xl text-sm font-mono tracking-widest text-[#ffd700] placeholder-gray-600 focus:outline-none focus:border-[#ffd700]"
              />
            </div>
          </div>

          {/* Sign Up Only: Extra Phone Number */}
          {tab === 'signup' && (
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1 font-['Montserrat']">
                ফোন নাম্বার (Phone Number) *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-500" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="যেমন: +357 95502363"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0d1017] border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#d4af37]"
                />
              </div>
            </div>
          )}

          {/* Sign Up Only: Developer Permission Code */}
          {tab === 'signup' && (
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-emerald-400 mb-1 font-['Montserrat'] flex items-center justify-between">
                <span>ডেভলপার পারমিশন কোড (Developer Permission Code) *</span>
                <span className="text-[10px] text-gray-400 font-mono">{REQUIRED_DEVELOPER_CODE}</span>
              </label>
              <div className="relative">
                <Code2 className="w-4 h-4 absolute left-3.5 top-3.5 text-emerald-400" />
                <input
                  type="text"
                  required
                  value={developerCode}
                  onChange={e => setDeveloperCode(e.target.value)}
                  placeholder={`এখানে ${REQUIRED_DEVELOPER_CODE} লিখুন`}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0d1017] border border-emerald-500/60 rounded-xl text-sm font-mono text-emerald-300 placeholder-gray-600 focus:outline-none focus:border-emerald-400"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1 italic">
                * ডেভলপার পারমিশন কোড {REQUIRED_DEVELOPER_CODE} না দিলে সাইন আপ হবে না।
              </p>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#ffd700] to-[#c5a059] text-[#0b0c10] font-bold text-xs sm:text-sm tracking-wider uppercase shadow-lg shadow-amber-950/40 hover:opacity-95 transition disabled:opacity-50"
            >
              {loading
                ? 'যাচাই করা হচ্ছে...'
                : tab === 'login'
                ? 'লগইন করুন (Log In)'
                : 'সাইন আপ সম্পন্ন করুন (Sign Up)'}
            </button>
          </div>
        </form>

        {/* Guest fallback if enabled */}
        {canClose && (
          <div className="mt-4 pt-3 border-t border-gray-800 text-center">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-gray-400 hover:text-white underline underline-offset-4"
            >
              গেস্ট হিসেবে সরাসরি এডিট করুন (Continue as Guest)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
