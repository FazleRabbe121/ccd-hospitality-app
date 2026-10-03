import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Cloud,
  HardDrive,
  User,
  Shield,
  Smartphone,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  FileCode,
  DollarSign,
  Flame,
  Bell,
  LogOut,
  LogIn,
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { UserSettings, AppStateData } from '../types';
import {
  findDriveBackupFile,
  uploadBackupToDrive,
  downloadBackupFromDrive,
} from '../services/driveService';
import { exportBackupJSON, importBackupJSON } from '../services/localStore';
import { ThemeToggle, useTheme } from '../context/ThemeContext';
import { exportAllCVsAsJSON } from '../services/cvStorage';

interface SettingsViewProps {
  user: FirebaseUser | null;
  settings: UserSettings;
  fullAppState: AppStateData;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  onGoogleSignIn: () => void;
  onLogout: () => void;
  onRestoreState: (importedState: AppStateData) => void;
  onOpenAndroidExport: () => void;
  isCloudSynced: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  settings,
  fullAppState,
  onUpdateSettings,
  onGoogleSignIn,
  onLogout,
  onRestoreState,
  onOpenAndroidExport,
  isCloudSynced,
}) => {
  const [habitNameInput, setHabitNameInput] = useState(settings.habitName || 'Masturbation');
  const [currencyInput, setCurrencyInput] = useState(settings.currency || '$');
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveMessage, setDriveMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const currencies = [
    { symbol: '$', name: 'USD ($)' },
    { symbol: '€', name: 'EUR (€)' },
    { symbol: '£', name: 'GBP (£)' },
    { symbol: '৳', name: 'BDT (৳)' },
    { symbol: '₹', name: 'INR (₹)' },
    { symbol: '¥', name: 'JPY / CNY (¥)' },
    { symbol: '₱', name: 'PHP (₱)' },
    { symbol: 'C$', name: 'CAD (C$)' },
    { symbol: 'A$', name: 'AUD (A$)' },
  ];

  const handleSaveGeneral = async () => {
    try {
      await onUpdateSettings({
        habitName: habitNameInput.trim() || 'Habit',
        currency: currencyInput,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      console.error(err);
    }
  };

  // Google Drive Handlers
  const handleDriveBackupNow = async () => {
    setDriveLoading(true);
    setDriveMessage(null);
    try {
      const res = await uploadBackupToDrive(fullAppState);
      setDriveMessage({ text: `Backup successfully saved to Google Drive!` });
      await onUpdateSettings({
        lastBackupAt: new Date().toISOString(),
        googleDriveConnected: true,
      });
    } catch (err: any) {
      setDriveMessage({ text: err?.message || 'Google Drive backup failed.', isError: true });
    } finally {
      setDriveLoading(false);
    }
  };

  const handleDriveRestoreNow = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to restore data from Google Drive? This will merge and update your local records.'
    );
    if (!confirmed) return;

    setDriveLoading(true);
    setDriveMessage(null);
    try {
      const restored = await downloadBackupFromDrive();
      onRestoreState(restored);
      setDriveMessage({ text: 'Data successfully restored from Google Drive!' });
    } catch (err: any) {
      setDriveMessage({ text: err?.message || 'Failed to restore from Google Drive.', isError: true });
    } finally {
      setDriveLoading(false);
    }
  };

  // Local JSON File Export
  const handleDownloadLocalBackup = () => {
    const jsonStr = exportBackupJSON(fullAppState);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CCD_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Local JSON File Import
  const handleUploadLocalBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      const imported = importBackupJSON(content);
      if (imported) {
        onRestoreState(imported);
        setDriveMessage({ text: 'Local backup file successfully imported and restored!' });
      } else {
        setDriveMessage({ text: 'Invalid or corrupted backup file format.', isError: true });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="pb-4 border-b border-[#1f2434]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#ffd700] px-2.5 py-0.5 rounded-full bg-[#ffd700]/10 border border-[#d4af37]/30">
            System Preferences
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-['Cinzel'] text-[#fdf8f0] tracking-wide mt-1">
          Settings & Cloud Sync
        </h1>
        <p className="text-xs text-[#94a3b8] mt-0.5">
          Google authentication, Firestore multi-device sync, Drive backups & Android deployment
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>Preferences successfully updated and synchronized!</span>
        </div>
      )}

      {/* Theme Mode Selector Card */}
      <div className="p-6 rounded-3xl bg-[#12151e] border border-[#232838] shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1f2434]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#ffd700]/15 border border-[#d4af37]/40 flex items-center justify-center text-[#ffd700]">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">Application Theme Mode</h2>
              <p className="text-[11px] text-[#8c96ab]">
                Choose between Light Mode and Dark Mode for the application interface (CV print stays in A4 reference design)
              </p>
            </div>
          </div>

          <div>
            <ThemeToggle compact={false} />
          </div>
        </div>
      </div>

      {/* 1. Google Account & Multi-Device Sync Card */}
      <div className="p-6 rounded-3xl bg-[#12151e] border border-[#232838] shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1f2434]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#ffd700]/20 to-[#aa771c]/10 border border-[#d4af37]/40 flex items-center justify-center text-[#ffd700]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">Google Account & Cloud Identity</h2>
              <p className="text-[11px] text-[#8c96ab]">
                Sign in with the same Google Account on any phone to access all your cloud records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider border ${
                user && isCloudSynced
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
              }`}
            >
              {user && isCloudSynced ? 'Firestore Active' : 'Local Storage Mode'}
            </span>
          </div>
        </div>

        {user ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0b0d13] border border-[#1e2332]">
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-12 h-12 rounded-2xl object-cover ring-2 ring-[#d4af37]/50"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-[#d4af37]/20 text-[#ffd700] font-bold text-base flex items-center justify-center">
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <div>
                <div className="text-sm font-bold text-white">{user.displayName || 'Authenticated User'}</div>
                <div className="text-xs text-[#8c96ab] font-mono">{user.email}</div>
                <div className="text-[10px] text-[#64748b] font-mono mt-0.5">UID: {user.uid}</div>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="px-4 py-2 rounded-xl bg-[#1b202e] hover:bg-[#252c3f] border border-[#2f374c] text-rose-300 hover:text-rose-200 text-xs font-semibold tracking-wider uppercase transition flex items-center justify-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <div className="p-5 rounded-2xl bg-[#0b0d13] border border-[#1e2332] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-xs sm:text-sm font-bold text-white">Not Signed In</h3>
              <p className="text-xs text-[#8c96ab] max-w-md">
                Sign in with Google to enable permanent Firestore cloud synchronization across your phone, tablet, and desktop.
              </p>
            </div>
            <button
              onClick={onGoogleSignIn}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#ffd700] to-[#c5a059] text-[#0b0c10] font-bold text-xs tracking-wider uppercase shadow-md hover:opacity-95 transition flex items-center justify-center gap-2 shrink-0"
            >
              {/* Google G icon */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.8 7.3l3.7 2.9C6.4 7.2 8.9 5 12 5z" />
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                <path fill="#FBBC05" d="M5.5 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.8 7.3C.7 9.5 0 10.7 0 12s.7 2.5 1.8 4.7l3.7-1.9z" />
                <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.6-2.2-6.5-5.2L1.8 16c1.9 3.7 5.7 7 10.2 7z" />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Google Drive Backup & Restore */}
      <div className="p-6 rounded-3xl bg-[#12151e] border border-[#232838] shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1f2434]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">Google Drive Cloud Storage</h2>
              <p className="text-[11px] text-[#8c96ab]">
                Optional secondary export/backup layer using standard Google Drive file storage
              </p>
            </div>
          </div>
        </div>

        {driveMessage && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              driveMessage.isError
                ? 'bg-rose-950/40 border border-rose-500/40 text-rose-300'
                : 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300'
            }`}
          >
            {driveMessage.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
            <span>{driveMessage.text}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleDriveBackupNow}
            disabled={driveLoading}
            className="px-4 py-2.5 rounded-xl bg-[#1a2030] hover:bg-[#232b40] border border-sky-500/40 text-sky-300 text-xs font-semibold tracking-wider uppercase transition flex items-center gap-2 disabled:opacity-50"
          >
            {driveLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            <span>Backup to Google Drive</span>
          </button>

          <button
            onClick={handleDriveRestoreNow}
            disabled={driveLoading}
            className="px-4 py-2.5 rounded-xl bg-[#1a2030] hover:bg-[#232b40] border border-[#2f374c] text-[#cbd5e1] text-xs font-semibold tracking-wider uppercase transition flex items-center gap-2 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Restore from Google Drive</span>
          </button>
        </div>

        <div className="pt-2 text-[11px] text-[#64748b]">
          Last Drive Backup: {settings.lastBackupAt ? new Date(settings.lastBackupAt).toLocaleString() : 'Never'}
        </div>
      </div>

      {/* 3. Local JSON Backup & Restore */}
      <div className="p-6 rounded-3xl bg-[#12151e] border border-[#232838] shadow-lg space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-[#1f2434]">
          <div className="w-10 h-10 rounded-2xl bg-[#171b26] border border-[#2a3144] flex items-center justify-center text-[#ffd700]">
            <FileCode className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white">Direct JSON Data Export / Import</h2>
            <p className="text-[11px] text-[#8c96ab]">
              Download an unencrypted raw JSON file of your entire database or restore from a previous file
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleDownloadLocalBackup}
            className="px-4 py-2.5 rounded-xl bg-[#1b202e] hover:bg-[#252c3f] border border-[#2f374c] text-white text-xs font-semibold tracking-wider uppercase transition flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5 text-[#ffd700]" />
            <span>Export JSON File</span>
          </button>

          <label className="px-4 py-2.5 rounded-xl bg-[#1b202e] hover:bg-[#252c3f] border border-[#2f374c] text-[#cbd5e1] text-xs font-semibold tracking-wider uppercase transition flex items-center gap-2 cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Import JSON File</span>
            <input type="file" accept=".json" onChange={handleUploadLocalBackup} className="hidden" />
          </label>
        </div>
      </div>

      {/* 4. Habit & Currency Configuration */}
      <div className="p-6 rounded-3xl bg-[#12151e] border border-[#232838] shadow-lg space-y-4">
        <h2 className="text-sm sm:text-base font-bold text-white pb-3 border-b border-[#1f2434]">
          Core Habit & Ledger Settings
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-[#94a3b8] mb-1.5">
              Focus Habit Name
            </label>
            <div className="relative">
              <Flame className="w-4 h-4 absolute left-3 top-3 text-[#ffd700]" />
              <input
                type="text"
                value={habitNameInput}
                onChange={e => setHabitNameInput(e.target.value)}
                placeholder="E.g., Masturbation, Smoking, Social Media"
                className="w-full pl-9 pr-3 py-2.5 bg-[#0b0d13] border border-[#232838] rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-[#d4af37]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-[#94a3b8] mb-1.5">
              Preferred Currency
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 absolute left-3 top-3 text-[#ffd700]" />
              <select
                value={currencyInput}
                onChange={e => setCurrencyInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-[#0b0d13] border border-[#232838] rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-[#d4af37]"
              >
                {currencies.map(c => (
                  <option key={c.symbol} value={c.symbol} className="bg-[#12141c]">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleSaveGeneral}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#ffd700] to-[#c5a059] text-[#0b0c10] font-bold text-xs tracking-wider uppercase shadow hover:opacity-95 transition"
          >
            Save Preferences
          </button>
        </div>
      </div>

      {/* 5. GitHub & Android APK Building Center */}
      <div className="p-6 rounded-3xl bg-[#12151e] border border-emerald-500/30 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <Smartphone className="w-4 h-4" />
            <span>GitHub Sync & Android APK Build Station</span>
          </div>
          <h3 className="text-base font-bold text-white mt-1">Package: com.ccd.abetteryou</h3>
          <p className="text-xs text-[#8c96ab] mt-0.5">
            Download complete project (.zip), push to GitHub, and automatically build Android APK with GitHub Actions.
          </p>
        </div>

        <button
          onClick={onOpenAndroidExport}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white font-bold text-xs tracking-wider uppercase shadow-lg shadow-emerald-950/50 hover:opacity-95 transition flex items-center justify-center gap-2 shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>GitHub & APK Hub</span>
        </button>
      </div>

      {/* 6. About CCD & Privacy */}
      <div className="p-6 rounded-3xl bg-[#0b0d13] border border-[#1f2434] text-center space-y-2 text-xs text-[#64748b]">
        <div className="font-['Cinzel'] font-bold text-[#ffd700] text-sm tracking-widest">
          CCD — A Better You Every Day
        </div>
        <p>Version 1.0.0 • Production Build • Zero Third-Party Advertising • Strict ABAC Privacy</p>
        <p className="text-[11px] text-[#475569]">
          All habit records, finances, and culinary assets belong solely to your Firebase UID.
        </p>
      </div>
    </div>
  );
};
