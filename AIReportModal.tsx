import React, { useState } from 'react';
import { Sparkles, FileText, CheckCircle, Copy, Download, RefreshCw, Calendar } from 'lucide-react';
import confetti from 'canvas-confetti';
import { MonthlyStatsPayload } from '../types';
import { generateMonthlyReport } from '../services/aiService';

interface AIReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  statsPayload: MonthlyStatsPayload;
  currency: string;
  onSaveReport: (month: string, stats: MonthlyStatsPayload, reportContent: string) => Promise<void>;
}

export const AIReportModal: React.FC<AIReportModalProps> = ({
  isOpen,
  onClose,
  statsPayload,
  currency,
  onSaveReport,
}) => {
  if (!isOpen) return null;

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string>('');

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const generated = await generateMonthlyReport(statsPayload, currency);
      setReport(generated);
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ffd700', '#d4af37', '#ffffff', '#10b981'],
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToCloud = async () => {
    if (!report) return;
    try {
      await onSaveReport(statsPayload.month, statsPayload, report);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to save to cloud archive');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#12141c] border border-[#d4af37]/30 rounded-3xl p-6 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.8)] text-[#f1f5f9] my-6 max-h-[90vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-5 border-b border-[#242938]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ffd700]/20 to-[#aa771c]/10 border border-[#d4af37]/40 flex items-center justify-center text-[#ffd700]">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-['Cinzel'] text-[#fdf8f0] tracking-wide flex items-center gap-2">
                Executive AI Monthly Report
              </h2>
              <p className="text-xs text-[#94a3b8] mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#ffd700]" /> Month: {statsPayload.month} • Verified Data Analysis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#94a3b8] hover:text-[#fdf8f0] p-1.5 rounded-xl hover:bg-[#1c2130] transition"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="my-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Input Facts Preview Card */}
        <div className="my-5 p-4 rounded-2xl bg-[#0b0d13] border border-[#232838]">
          <div className="text-[11px] uppercase tracking-wider text-[#94a3b8] font-bold mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Strict Verified Statistics (Fed to Intelligence Engine)</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-[#161a26] border border-[#232838]">
              <span className="text-[#8c96ab] block text-[10px] uppercase">Total Income</span>
              <span className="text-sm font-bold font-mono text-emerald-400">
                {currency}{statsPayload.income.total.toFixed(2)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#161a26] border border-[#232838]">
              <span className="text-[#8c96ab] block text-[10px] uppercase">Expenses</span>
              <span className="text-sm font-bold font-mono text-rose-400">
                {currency}{statsPayload.expenses.total.toFixed(2)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#161a26] border border-[#232838]">
              <span className="text-[#8c96ab] block text-[10px] uppercase">Family Money</span>
              <span className="text-sm font-bold font-mono text-[#ffd700]">
                {currency}{statsPayload.familyMoney.total.toFixed(2)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#161a26] border border-[#232838]">
              <span className="text-[#8c96ab] block text-[10px] uppercase">Monthly Relapses</span>
              <span className="text-sm font-bold font-mono text-amber-300">
                {statsPayload.habit.relapses} incident(s)
              </span>
            </div>
          </div>
        </div>

        {/* Report Output / Generate Trigger */}
        {!report ? (
          <div className="text-center py-8 px-4 rounded-3xl bg-gradient-to-b from-[#131622] to-[#0c0e14] border border-[#232838]">
            <Sparkles className="w-12 h-12 mx-auto text-[#d4af37] mb-3 animate-pulse" />
            <h3 className="text-lg font-bold text-white mb-2">Ready to Synthesize Your Performance</h3>
            <p className="text-xs sm:text-sm text-[#94a3b8] max-w-md mx-auto mb-6">
              Our secure AI will analyze your spending habits, relapse discipline, and family contributions without inventing facts.
            </p>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#ffd700] to-[#c5a059] text-[#0b0c10] font-bold text-sm tracking-wider uppercase shadow-xl hover:opacity-90 transition disabled:opacity-50 inline-flex items-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Analyzing Performance...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Generate Monthly Report
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-5 sm:p-6 rounded-2xl bg-[#0b0d13] border border-[#d4af37]/30 text-xs sm:text-sm text-[#e2e8f0] leading-relaxed max-h-[50vh] overflow-y-auto font-sans whitespace-pre-wrap">
              {report}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="px-3.5 py-2 rounded-xl bg-[#1b202e] border border-[#2f374c] text-xs font-semibold text-[#cbd5e1] hover:text-white inline-flex items-center gap-1.5 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Regenerate
                </button>
                <button
                  onClick={handleCopy}
                  className="px-3.5 py-2 rounded-xl bg-[#1b202e] border border-[#2f374c] text-xs font-semibold text-[#cbd5e1] hover:text-white inline-flex items-center gap-1.5 transition"
                >
                  <Copy className="w-3.5 h-3.5" /> {copied ? 'Copied!' : 'Copy Text'}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveToCloud}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-800 text-white text-xs font-bold uppercase tracking-wider shadow hover:opacity-90 inline-flex items-center gap-1.5 transition"
                >
                  <CheckCircle className="w-4 h-4" /> {saved ? 'Saved to Archive!' : 'Save Report to Firestore'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
