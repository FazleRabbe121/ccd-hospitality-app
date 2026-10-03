import React from 'react';
import { Cloud, CloudOff, LogOut, ShieldAlert, Sparkles, Smartphone, Check, FileText, Lock, Mail } from 'lucide-react';
import { User } from 'firebase/auth';
import { CCDLogo } from './CCDLogo';
import { ThemeToggle, useTheme } from '../context/ThemeContext';

interface NavbarProps {
  user: User | null;
  isOnline: boolean;
  isCloudSynced: boolean;
  onGoogleSignIn: () => void;
  onLogout: () => void;
  onOpenRelapseModal: () => void;
  onOpenUrgeGuide: () => void;
  onOpenAndroidExport: () => void;
  onOpenCVBuilder?: () => void;
  onOpenApplyByEmail?: () => void;
  onLockApp?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  isOnline,
  isCloudSynced,
  onGoogleSignIn,
  onLogout,
  onOpenRelapseModal,
  onOpenUrgeGuide,
  onOpenAndroidExport,
  onOpenCVBuilder,
  onOpenApplyByEmail,
  onLockApp,
}) => {
  const { theme } = useTheme();

  return (
    <header
      className={`sticky top-0 z-40 w-full backdrop-blur-md px-4 sm:px-6 py-2.5 transition-colors border-b ${
        theme === 'dark'
          ? 'bg-[#0b0c10]/95 border-[#1f2433] text-white'
          : 'bg-white/95 border-slate-200 text-slate-900 shadow-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <CCDLogo size={42} showSubtitle={true} />
        </div>

        {/* Action Controls & User Account */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Clearly Visible Light / Dark Mode Toggle */}
          <ThemeToggle compact={true} />

          {/* Cloud Sync Status */}
          <div
            className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium border ${
              isCloudSynced && isOnline
                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-950/30 border-amber-500/30 text-amber-400'
            }`}
            title={isCloudSynced ? 'Connected & Synced with Firebase Cloud' : 'Offline / Local Persistence Active'}
          >
            {isCloudSynced && isOnline ? (
              <>
                <Cloud className="w-3.5 h-3.5" />
                <span>Cloud Synced</span>
              </>
            ) : (
              <>
                <CloudOff className="w-3.5 h-3.5" />
                <span>Local Mode</span>
              </>
            )}
          </div>

          {/* Emergency Urge Guide Quick Button */}
          <button
            onClick={onOpenUrgeGuide}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-950/60 to-[#4a1525]/60 hover:from-rose-900/60 hover:to-[#5e182f]/60 text-rose-300 border border-rose-500/40 text-xs font-semibold tracking-wide flex items-center gap-1.5 transition shadow-sm"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Urge Protocol</span>
            <span className="sm:hidden">Urge</span>
          </button>

          {/* CV Builder Shortcut Button */}
          {onOpenCVBuilder && (
            <button
              onClick={onOpenCVBuilder}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#ffd700] to-[#b38827] text-slate-950 text-xs font-bold transition shadow-md hover:opacity-95"
              title="Open Dynamic CV Builder & Multiple CV Library"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CV Library</span>
              <span className="sm:hidden">CVs</span>
            </button>
          )}

          {/* Apply by Email Quick Button */}
          {onOpenApplyByEmail && (
            <button
              onClick={onOpenApplyByEmail}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-md shadow-blue-500/20"
              title="Apply by Email with attached CV"
            >
              <Mail className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Apply by Email</span>
              <span className="sm:hidden">Apply</span>
            </button>
          )}

          {/* Android APK & GitHub Center Shortcut */}
          <button
            onClick={onOpenAndroidExport}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
              theme === 'dark'
                ? 'bg-[#141824] hover:bg-[#1d2335] border-[#2b3348] text-[#cbd5e1] hover:text-[#ffd700]'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700 hover:text-amber-600'
            }`}
            title="Download Project ZIP, Push to GitHub & Build Android APK"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">APK & GitHub</span>
            <span className="sm:hidden">APK</span>
          </button>

          {/* Google Sign-In or User Profile */}
          {user ? (
            <div
              className={`flex items-center gap-2 pl-1 border-l ${
                theme === 'dark' ? 'border-[#232838]' : 'border-slate-300'
              }`}
            >
              <div className="relative group">
                <div
                  className={`flex items-center gap-2 p-1 rounded-xl border cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-[#141824] border-[#262c3e]'
                      : 'bg-slate-100 border-slate-300'
                  }`}
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-7 h-7 rounded-lg object-cover ring-1 ring-[#d4af37]/50"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-[#d4af37]/20 text-[#ffd700] font-bold text-xs flex items-center justify-center">
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <span
                    className={`text-xs font-medium hidden md:inline max-w-[100px] truncate ${
                      theme === 'dark' ? 'text-[#cbd5e1]' : 'text-slate-800'
                    }`}
                  >
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                </div>
              </div>

              <button
                onClick={onLogout}
                title="Sign Out"
                className={`p-2 rounded-xl transition ${
                  theme === 'dark'
                    ? 'text-[#94a3b8] hover:text-rose-400 hover:bg-white/5'
                    : 'text-slate-500 hover:text-rose-600 hover:bg-slate-200'
                }`}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onGoogleSignIn}
              className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold shadow flex items-center gap-2 transition ${
                theme === 'dark'
                  ? 'bg-gradient-to-r from-[#1e2333] to-[#121622] hover:from-[#2a3045] hover:to-[#1a1f30] border-[#d4af37]/40 text-white'
                  : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800'
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.8 7.3l3.7 2.9C6.4 7.2 8.9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.5 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.8 7.3C.7 9.5 0 10.7 0 12s.7 2.5 1.8 4.7l3.7-1.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.6-2.2-6.5-5.2L1.8 16c1.9 3.7 5.7 7 10.2 7z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          )}

          {/* Quick Lock Application Button */}
          {onLockApp && (
            <button
              onClick={onLockApp}
              className={`p-2 rounded-xl transition border ${
                theme === 'dark'
                  ? 'border-gray-800 text-gray-400 hover:text-[#ffd700] hover:bg-white/5'
                  : 'border-slate-200 text-slate-500 hover:text-amber-600 hover:bg-slate-100'
              }`}
              title="Lock Application / Switch Passcode"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
