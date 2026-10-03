import React from 'react';
import {
  Download,
  Printer,
  Save,
  LogIn,
  LogOut,
  UserCheck,
  FileText,
  Eye,
  Edit3,
  CheckCircle,
} from 'lucide-react';
import { CVUserAccount } from '../types/cv';
import { CCDLogo } from './CCDLogo';

interface TopHeaderProps {
  user: CVUserAccount | null;
  onOpenAuth: (mode?: 'login' | 'signup') => void;
  onLogout: () => void;
  onDownloadPDF: () => void;
  onPrint: () => void;
  onSave: () => void;
  isSaving?: boolean;
  saveMessage?: string;
  isMobilePreview: boolean;
  onToggleMobilePreview: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  user,
  onOpenAuth,
  onLogout,
  onDownloadPDF,
  onPrint,
  onSave,
  isSaving = false,
  saveMessage = '',
  isMobilePreview,
  onToggleMobilePreview,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0d0f15]/95 backdrop-blur-md border-b border-gray-800 px-4 sm:px-6 py-3 no-print">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Subtitle */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-3">
            <CCDLogo size={42} showSubtitle={false} className="shrink-0" />
            <div>
              <h1 className="font-['Montserrat'] font-bold text-base sm:text-lg text-white tracking-wide flex items-center gap-2">
                <span>Dynamic CV Builder</span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#ffd700] text-[10px] font-semibold">
                  Hospitality Standard
                </span>
              </h1>
              <p className="text-[11px] text-gray-400 font-['Inter']">
                A4 Content-Driven Spacing · Dual-Column Timeline · 5-Star Luxury Reference
              </p>
            </div>
          </div>

          {/* Mobile Preview/Editor Switcher */}
          <div className="flex items-center md:hidden gap-2">
            <button
              onClick={onToggleMobilePreview}
              className="px-3 py-1.5 rounded-xl bg-gray-800 border border-gray-700 text-xs font-semibold text-white flex items-center gap-1.5"
            >
              {isMobilePreview ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{isMobilePreview ? 'Edit' : 'Preview'}</span>
            </button>
          </div>
        </div>

        {/* Action Controls & User Account */}
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 w-full md:w-auto">
          {saveMessage && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium mr-1 animate-fade-in">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{saveMessage}</span>
            </span>
          )}

          {/* Save Button */}
          <button
            onClick={onSave}
            disabled={isSaving}
            className="px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs font-semibold text-gray-200 hover:text-white transition flex items-center gap-1.5"
            title="Save changes to local & cloud storage"
          >
            <Save className="w-3.5 h-3.5 text-[#ffd700]" />
            <span>Save CV</span>
          </button>

          {/* Print / Save as PDF */}
          <button
            onClick={onPrint}
            className="px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs font-semibold text-gray-200 hover:text-white transition flex items-center gap-1.5"
            title="Print or Save via browser"
          >
            <Printer className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Print / Save PDF</span>
            <span className="sm:hidden">Print</span>
          </button>

          {/* Download Real PDF */}
          <button
            onClick={onDownloadPDF}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#ffd700] to-[#c5a059] text-[#0b0c10] font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-950/40 hover:opacity-95 transition flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>

          {/* User Account Login / Signup Status */}
          <div className="pl-2 border-l border-gray-800 flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-800/80 border border-gray-700 text-xs" title={user.email}>
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <div className="flex flex-col text-left">
                    <span className="font-semibold text-white max-w-[100px] truncate leading-tight">{user.name}</span>
                    <span className="text-[9px] text-[#ffd700] max-w-[100px] truncate leading-tight">{user.email}</span>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 rounded-xl text-gray-400 hover:text-rose-400 hover:bg-white/5 transition"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs font-semibold text-white transition flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5 text-[#ffd700]" />
                  <span>লগইন (Login)</span>
                </button>
                <button
                  onClick={() => onOpenAuth('signup')}
                  className="px-3 py-1.5 rounded-xl bg-[#d4af37]/20 hover:bg-[#d4af37]/30 border border-[#d4af37]/40 text-xs font-semibold text-[#ffd700] transition"
                >
                  <span>সাইন আপ (Sign Up)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
