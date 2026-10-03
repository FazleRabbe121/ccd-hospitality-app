import React, { useState, useMemo } from 'react';
import { Heart, Plus, Calendar, User, Trash2, Edit2, TrendingUp, Sparkles } from 'lucide-react';
import { FamilyMoneyRecord } from '../types';

interface FamilyMoneyViewProps {
  familyMoney: FamilyMoneyRecord[];
  currency: string;
  onOpenAddModal: () => void;
  onEditRecord: (record: FamilyMoneyRecord) => void;
  onDeleteRecord: (id: string) => Promise<void>;
}

export const FamilyMoneyView: React.FC<FamilyMoneyViewProps> = ({
  familyMoney,
  currency,
  onOpenAddModal,
  onEditRecord,
  onDeleteRecord,
}) => {
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const currentYearStr = new Date().getFullYear().toString();

  // Calculations
  const thisMonthTotal = useMemo(() => {
    return familyMoney
      .filter(f => f.date.startsWith(currentMonthStr))
      .reduce((sum, f) => sum + f.amount, 0);
  }, [familyMoney, currentMonthStr]);

  const thisYearTotal = useMemo(() => {
    return familyMoney
      .filter(f => f.date.startsWith(currentYearStr))
      .reduce((sum, f) => sum + f.amount, 0);
  }, [familyMoney, currentYearStr]);

  const allTimeTotal = useMemo(() => {
    return familyMoney.reduce((sum, f) => sum + f.amount, 0);
  }, [familyMoney]);

  // Recipient breakdown
  const recipientTotals = useMemo(() => {
    const map: Record<string, number> = {};
    familyMoney.forEach(f => {
      const recipient = f.recipient || 'Parents';
      map[recipient] = (map[recipient] || 0) + f.amount;
    });
    return map;
  }, [familyMoney]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1f2434]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#ffd700] px-2.5 py-0.5 rounded-full bg-[#ffd700]/10 border border-[#d4af37]/30">
              Family Devotion & Support
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-['Cinzel'] text-[#fdf8f0] tracking-wide mt-1">
            Family Money Tracker
          </h1>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            Recording every act of filial care and generosity
          </p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#ffd700] to-[#c5a059] text-[#0b0c10] font-bold text-xs tracking-wider uppercase shadow-lg shadow-amber-950/40 hover:opacity-95 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Send Family Money</span>
        </button>
      </div>

      {/* Triad Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {/* This Month */}
        <div className="p-6 rounded-3xl bg-[#12151e] border border-[#d4af37]/30 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#94a3b8] uppercase tracking-wider font-semibold">
            <span>This Month ({currentMonthStr})</span>
            <Heart className="w-4 h-4 text-[#ffd700] fill-[#ffd700]/20" />
          </div>
          <div className="my-3 text-3xl sm:text-4xl font-black font-mono text-[#ffd700]">
            {currency}{thisMonthTotal.toFixed(2)}
          </div>
          <span className="text-xs text-[#717b8f]">
            {familyMoney.filter(f => f.date.startsWith(currentMonthStr)).length} transfer(s)
          </span>
        </div>

        {/* This Year */}
        <div className="p-6 rounded-3xl bg-[#12151e] border border-[#242b3d] shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#94a3b8] uppercase tracking-wider font-semibold">
            <span>This Year ({currentYearStr})</span>
            <Calendar className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-3 text-3xl sm:text-4xl font-black font-mono text-emerald-300">
            {currency}{thisYearTotal.toFixed(2)}
          </div>
          <span className="text-xs text-[#717b8f]">
            {familyMoney.filter(f => f.date.startsWith(currentYearStr)).length} annual contribution(s)
          </span>
        </div>

        {/* All Time */}
        <div className="p-6 rounded-3xl bg-[#12151e] border border-[#242b3d] shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#94a3b8] uppercase tracking-wider font-semibold">
            <span>All Time Cumulative</span>
            <TrendingUp className="w-4 h-4 text-[#cbd5e1]" />
          </div>
          <div className="my-3 text-3xl sm:text-4xl font-black font-mono text-white">
            {currency}{allTimeTotal.toFixed(2)}
          </div>
          <span className="text-xs text-[#717b8f]">
            Total {familyMoney.length} records across your journey
          </span>
        </div>
      </div>

      {/* Recipient Distribution */}
      {Object.keys(recipientTotals).length > 0 && (
        <div className="p-5 rounded-3xl bg-[#12151e] border border-[#202534]">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-[#ffd700]" />
            <span>Family Allocation by Member</span>
          </h2>
          <div className="space-y-2">
            {Object.entries(recipientTotals).map(([rec, amt]) => {
              const pct = allTimeTotal > 0 ? (amt / allTimeTotal) * 100 : 0;
              return (
                <div key={rec} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white font-medium">{rec}</span>
                    <span className="text-[#ffd700] font-mono font-semibold">
                      {currency}{amt.toFixed(2)} ({pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#0b0d13] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#ffd700] to-[#c5a059]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Ledger History Table */}
      <div className="rounded-3xl bg-[#12151e] border border-[#232838] p-5 sm:p-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#1f2434]">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#f1f5f9] flex items-center gap-2">
            <Heart className="w-4 h-4 text-[#ffd700]" />
            <span>Contributions Log</span>
          </h2>
          <span className="text-xs text-[#94a3b8]">{familyMoney.length} total</span>
        </div>

        <div className="mt-4 space-y-3">
          {familyMoney.map(f => (
            <div
              key={f.id}
              className="p-4 rounded-2xl bg-[#0b0d13] border border-[#1e2332] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-950/40 border border-[#d4af37]/30 text-[#ffd700] font-mono text-xs font-semibold">
                    {f.date}
                  </span>
                  <span className="text-xs font-bold text-white">
                    {f.recipient || 'Parents'}
                  </span>
                </div>
                {f.notes && (
                  <p className="text-xs text-[#94a3b8] italic">"{f.notes}"</p>
                )}
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#1a1f2c]">
                <span className="text-base font-mono font-bold text-[#ffd700]">
                  {currency}{f.amount.toFixed(2)}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEditRecord(f)}
                    className="p-1.5 text-[#94a3b8] hover:text-[#ffd700] rounded-lg hover:bg-[#1a1f2e] transition"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteRecord(f.id)}
                    className="p-1.5 text-[#94a3b8] hover:text-rose-400 rounded-lg hover:bg-[#1a1f2e] transition"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {familyMoney.length === 0 && (
            <div className="text-center py-10 text-xs text-[#64748b]">
              No family contributions logged yet. Tap "Send Family Money" to record your support.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
