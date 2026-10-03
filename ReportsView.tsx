import React, { useState } from 'react';
import {
  FileBarChart,
  Sparkles,
  Calendar,
  CheckCircle,
  Clock,
  Trash2,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { MonthlyReportRecord, MonthlyStatsPayload } from '../types';

interface ReportsViewProps {
  reports: MonthlyReportRecord[];
  onOpenReportModal: () => void;
  onDeleteReport: (id: string) => Promise<void>;
  currency: string;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  reports,
  onOpenReportModal,
  onDeleteReport,
  currency,
}) => {
  const [selectedReport, setSelectedReport] = useState<MonthlyReportRecord | null>(
    reports.length > 0 ? reports[0] : null
  );

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1f2434]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#ffd700] px-2.5 py-0.5 rounded-full bg-[#ffd700]/10 border border-[#d4af37]/30">
              Executive Governance
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-['Cinzel'] text-[#fdf8f0] tracking-wide mt-1">
            Monthly Performance Reports
          </h1>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            AI-synthesized audits grounded 100% in your authenticated ledger & habit data
          </p>
        </div>

        <button
          onClick={onOpenReportModal}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#ffd700] to-[#c5a059] text-[#0b0c10] font-bold text-xs tracking-wider uppercase shadow-lg shadow-amber-950/40 hover:opacity-95 transition flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Generate New Report</span>
        </button>
      </div>

      {/* Reports Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Historical Reports List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#94a3b8] px-1 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-[#ffd700]" />
            <span>Archived Reports ({reports.length})</span>
          </h3>

          <div className="space-y-2.5">
            {reports.map(r => {
              const isSelected = selectedReport?.id === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedReport(r)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#181d2a] border-[#d4af37]/60 shadow-lg'
                      : 'bg-[#12151e] border-[#202534] hover:border-[#2f374c]'
                  }`}
                >
                  <div>
                    <div className="text-sm font-bold font-['Cinzel'] text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#ffd700]" />
                      <span>{r.month} Report</span>
                    </div>
                    <div className="text-[11px] text-[#8c96ab] mt-1">
                      Logged {new Date(r.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onDeleteReport(r.id);
                        if (selectedReport?.id === r.id) {
                          setSelectedReport(null);
                        }
                      }}
                      className="p-1.5 text-[#64748b] hover:text-rose-400 rounded-lg hover:bg-[#1a1f2e] transition"
                      title="Delete Report"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ChevronRight
                      className={`w-4 h-4 text-[#94a3b8] transition-transform ${
                        isSelected ? 'rotate-90 text-[#ffd700]' : ''
                      }`}
                    />
                  </div>
                </div>
              );
            })}

            {reports.length === 0 && (
              <div className="p-6 rounded-2xl bg-[#12151e] border border-[#202534] text-center text-xs text-[#717b8f]">
                No reports saved yet. Click "Generate New Report" to create your first monthly analysis.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Selected Report Viewer */}
        <div className="lg:col-span-2">
          {selectedReport ? (
            <div className="rounded-3xl bg-[#12151e] border border-[#d4af37]/30 p-6 sm:p-8 shadow-xl space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#232838] gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#ffd700] px-2.5 py-0.5 rounded-full bg-[#ffd700]/10 border border-[#d4af37]/30">
                    Verified Analysis
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold font-['Cinzel'] text-[#fdf8f0] mt-1.5">
                    {selectedReport.month} Executive Review
                  </h2>
                </div>

                <div className="text-xs text-[#8c96ab]">
                  Created {new Date(selectedReport.createdAt).toLocaleString()}
                </div>
              </div>

              {/* Data Snapshot Verification Bar */}
              {selectedReport.dataSnapshot && (
                <div className="p-4 rounded-2xl bg-[#0b0d13] border border-[#232838] space-y-2">
                  <div className="text-[10px] uppercase tracking-wider text-[#94a3b8] font-bold flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Underlying Verified Data Snapshot</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2 rounded-xl bg-[#151824]">
                      <span className="text-[10px] text-[#8c96ab] block">Income</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {currency}{selectedReport.dataSnapshot.income?.total?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-[#151824]">
                      <span className="text-[10px] text-[#8c96ab] block">Expenses</span>
                      <span className="font-mono font-bold text-rose-400">
                        {currency}{selectedReport.dataSnapshot.expenses?.total?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-[#151824]">
                      <span className="text-[10px] text-[#8c96ab] block">Family Money</span>
                      <span className="font-mono font-bold text-[#ffd700]">
                        {currency}{selectedReport.dataSnapshot.familyMoney?.total?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-[#151824]">
                      <span className="text-[10px] text-[#8c96ab] block">Relapses</span>
                      <span className="font-mono font-bold text-amber-300">
                        {selectedReport.dataSnapshot.habit?.relapses ?? 0}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Report Full Text */}
              <div className="p-6 rounded-2xl bg-[#0b0d13] border border-[#202534] text-xs sm:text-sm text-[#e2e8f0] leading-relaxed whitespace-pre-wrap font-sans max-h-[60vh] overflow-y-auto">
                {selectedReport.reportContent}
              </div>
            </div>
          ) : (
            <div className="rounded-3xl bg-[#12151e] border border-[#202534] p-12 text-center text-xs text-[#717b8f]">
              Select a report from the archive on the left to inspect detailed performance observations.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
