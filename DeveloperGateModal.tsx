import React, { useState } from 'react';
import { Lock, ArrowRight, AlertCircle, FileText, ShieldCheck, KeyRound } from 'lucide-react';
import { CCDLogo } from './CCDLogo';

export type AppAccessLevel = 'full' | 'cv-only';

interface DeveloperGateModalProps {
  onAuthorize: (level: AppAccessLevel) => void;
}

export const FULL_ACCESS_PASSCODE = '89056';
export const CV_ONLY_PASSCODE = '00000';

export const DeveloperGateModal: React.FC<DeveloperGateModalProps> = ({ onAuthorize }) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = passcode.trim();

    if (clean === FULL_ACCESS_PASSCODE) {
      localStorage.setItem('app_access_level_auth', 'full');
      localStorage.setItem('app_dev_authorized_89056', 'true');
      setError(false);
      onAuthorize('full');
    } else if (clean === CV_ONLY_PASSCODE) {
      localStorage.setItem('app_access_level_auth', 'cv-only');
      setError(false);
      onAuthorize('cv-only');
    } else {
      setError(true);
      setErrorMessage('ভুল পাসকোড! সঠিক পাসকোড দিন (Invalid Passcode).');
      setPasscode('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in select-none">
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#131724] to-[#0c0e17] border border-[#d4af37]/40 rounded-3xl p-6 sm:p-8 shadow-[0_25px_80px_rgba(0,0,0,0.9)] text-[#f3f4f6]">
        {/* Brand Crest & Logo */}
        <div className="flex flex-col items-center text-center pb-3">
          <div className="mb-3 transform hover:scale-105 transition-transform duration-300">
            <CCDLogo size={62} showSubtitle={false} />
          </div>

          <span className="text-[10px] uppercase font-bold tracking-widest text-[#ffd700] px-3 py-1 rounded-full bg-[#ffd700]/10 border border-[#d4af37]/30 mb-2">
            Secure Dual Access
          </span>

          <h2 className="font-['Montserrat'] font-bold text-xl sm:text-2xl text-white tracking-wide leading-snug">
            Security Authorization
          </h2>
          <p className="text-xs text-gray-400 mt-1 font-['Inter'] max-w-xs">
            Enter your designated access passcode to open the application workspace
          </p>
        </div>

        {/* Access Modes Info Card */}
        <div className="my-4 p-3.5 rounded-2xl bg-[#090b10]/80 border border-gray-800 text-xs space-y-2">
          <div className="flex items-center justify-between text-gray-300">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Full Application Suite:</span>
            </span>
            <span className="font-mono text-[#ffd700] bg-gray-800/80 px-2 py-0.5 rounded text-[11px]">
              Master Passcode
            </span>
          </div>

          <div className="flex items-center justify-between text-gray-300 pt-1.5 border-t border-gray-800/60">
            <span className="flex items-center gap-1.5 font-medium">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>CV-Only Workspace:</span>
            </span>
            <span className="font-mono text-sky-300 bg-sky-950/40 border border-sky-500/30 px-2 py-0.5 rounded text-[11px] font-bold">
              Passcode: 00000
            </span>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Passcode Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5 font-['Montserrat']">
              Enter Passcode
            </label>
            <div className="relative">
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                autoFocus
                required
                value={passcode}
                onChange={e => {
                  setPasscode(e.target.value);
                  if (error) setError(false);
                }}
                placeholder="• • • • •"
                className="w-full px-4 py-3.5 bg-[#07090e] border border-gray-800 rounded-2xl text-xl font-mono tracking-[0.4em] text-[#ffd700] placeholder-gray-700 focus:outline-none focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 text-center transition-all shadow-inner"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#ffd700] to-[#b38827] text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-950/40 hover:opacity-95 active:scale-[0.98] transition flex items-center justify-center gap-2"
          >
            <span>Unlock Workspace</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </form>

        {/* Direct quick hint footer */}
        <div className="mt-4 pt-3 text-center border-t border-gray-800/40">
          <p className="text-[11px] text-gray-500">
            For temporary CV-only access, enter <span className="font-mono text-sky-400 font-bold">00000</span>
          </p>
        </div>
      </div>
    </div>
  );
};
