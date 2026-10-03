import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  BarChart2,
  Calendar,
  Wallet,
  Flame,
  Heart,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { FinanceRecord, RelapseRecord, FamilyMoneyRecord, UserSettings } from '../types';

interface ProgressStatsViewProps {
  finances: FinanceRecord[];
  relapses: RelapseRecord[];
  familyMoney: FamilyMoneyRecord[];
  settings: UserSettings;
  currency: string;
}

type TimeRange = '7D' | '30D' | '3M' | '6M' | '1Y';

export const ProgressStatsView: React.FC<ProgressStatsViewProps> = ({
  finances,
  relapses,
  familyMoney,
  settings,
  currency,
}) => {
  const [range, setRange] = useState<TimeRange>('30D');

  const rangeDays = useMemo(() => {
    switch (range) {
      case '7D':
        return 7;
      case '30D':
        return 30;
      case '3M':
        return 90;
      case '6M':
        return 180;
      case '1Y':
        return 365;
    }
  }, [range]);

  const cutoffTimestamp = useMemo(() => {
    return Date.now() - rangeDays * 86400000;
  }, [rangeDays]);

  const cutoffDateStr = useMemo(() => {
    return new Date(cutoffTimestamp).toISOString().split('T')[0];
  }, [cutoffTimestamp]);

  // Filtered data in range
  const rangeFinances = useMemo(() => {
    return finances.filter(f => f.date >= cutoffDateStr);
  }, [finances, cutoffDateStr]);

  const rangeRelapses = useMemo(() => {
    return relapses.filter(r => r.timestamp >= cutoffTimestamp);
  }, [relapses, cutoffTimestamp]);

  const rangeFamilyMoney = useMemo(() => {
    return familyMoney.filter(f => f.date >= cutoffDateStr);
  }, [familyMoney, cutoffDateStr]);

  // Aggregate financial metrics
  const totalIncome = rangeFinances
    .filter(f => f.type === 'income')
    .reduce((sum, f) => sum + f.amount, 0);

  const totalExpenses = rangeFinances
    .filter(f => f.type === 'expense')
    .reduce((sum, f) => sum + f.amount, 0);

  const totalSavings = totalIncome - totalExpenses;
  const totalFamily = rangeFamilyMoney.reduce((sum, f) => sum + f.amount, 0);

  // Group by intervals (e.g. 7 buckets for charting)
  const buckets = useMemo(() => {
    const bucketCount = range === '7D' ? 7 : range === '30D' ? 6 : 6;
    const bucketDurationMs = (rangeDays * 86400000) / bucketCount;

    const list: {
      label: string;
      income: number;
      expenses: number;
      family: number;
      relapses: number;
    }[] = [];

    for (let i = 0; i < bucketCount; i++) {
      const bStart = cutoffTimestamp + i * bucketDurationMs;
      const bEnd = bStart + bucketDurationMs;
      const dStart = new Date(bStart).toISOString().split('T')[0];
      const dEnd = new Date(bEnd).toISOString().split('T')[0];

      const bIncome = finances
        .filter(f => f.type === 'income' && f.date >= dStart && f.date <= dEnd)
        .reduce((sum, f) => sum + f.amount, 0);

      const bExpense = finances
        .filter(f => f.type === 'expense' && f.date >= dStart && f.date <= dEnd)
        .reduce((sum, f) => sum + f.amount, 0);

      const bFam = familyMoney
        .filter(f => f.date >= dStart && f.date <= dEnd)
        .reduce((sum, f) => sum + f.amount, 0);

      const bRelapse = relapses.filter(r => r.timestamp >= bStart && r.timestamp <= bEnd).length;

      const dateLabel = range === '7D'
        ? new Date(bStart).toLocaleDateString(undefined, { weekday: 'short' })
        : new Date(bStart).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

      list.push({
        label: dateLabel,
        income: bIncome,
        expenses: bExpense,
        family: bFam,
        relapses: bRelapse,
      });
    }

    return list;
  }, [range, rangeDays, cutoffTimestamp, finances, familyMoney, relapses]);

  const maxFinancialVal = Math.max(
    100,
    ...buckets.map(b => Math.max(b.income, b.expenses))
  );

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-16">
      {/* Header & Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1f2434]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#ffd700] px-2.5 py-0.5 rounded-full bg-[#ffd700]/10 border border-[#d4af37]/30">
              Longitudinal Intelligence
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-['Cinzel'] text-[#fdf8f0] tracking-wide mt-1">
            Progress & Statistics
          </h1>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            Holistic trends spanning cashflow, habit sovereignty, and family support
          </p>
        </div>

        {/* Range Buttons */}
        <div className="flex items-center bg-[#0b0d13] p-1.5 rounded-2xl border border-[#232838] text-xs font-semibold">
          {(['7D', '30D', '3M', '6M', '1Y'] as TimeRange[]).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-xl transition ${
                range === r
                  ? 'bg-[#d4af37] text-[#0b0c10] font-bold shadow'
                  : 'text-[#8c96ab] hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Aggregate Cards for Chosen Range */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-[#12151e] border border-emerald-500/30">
          <span className="text-[10px] uppercase tracking-wider text-[#94a3b8] font-semibold block">
            Income ({range})
          </span>
          <div className="text-2xl font-black font-mono text-emerald-300 mt-1">
            {currency}{totalIncome.toFixed(0)}
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#12151e] border border-rose-500/30">
          <span className="text-[10px] uppercase tracking-wider text-[#94a3b8] font-semibold block">
            Expenses ({range})
          </span>
          <div className="text-2xl font-black font-mono text-rose-400 mt-1">
            {currency}{totalExpenses.toFixed(0)}
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#12151e] border border-[#d4af37]/30">
          <span className="text-[10px] uppercase tracking-wider text-[#94a3b8] font-semibold block">
            Net Savings ({range})
          </span>
          <div className="text-2xl font-black font-mono text-[#ffd700] mt-1">
            {currency}{totalSavings.toFixed(0)}
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#12151e] border border-amber-950/40">
          <span className="text-[10px] uppercase tracking-wider text-[#94a3b8] font-semibold block">
            Relapses Logged
          </span>
          <div className="text-2xl font-black font-mono text-amber-300 mt-1">
            {rangeRelapses.length}
          </div>
        </div>
      </div>

      {/* Cashflow Bar Chart (Income vs Expense) */}
      <div className="p-6 rounded-3xl bg-[#12151e] border border-[#232838] shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#1f2434] mb-6">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-[#ffd700]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Income vs Expenses Distribution ({range})
            </h3>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" /> Income
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" /> Expense
            </span>
          </div>
        </div>

        {/* CSS Bar Chart */}
        <div className="h-56 flex items-end justify-between gap-3 sm:gap-6 pt-6">
          {buckets.map((b, idx) => {
            const incHeight = Math.min(100, Math.max(8, (b.income / maxFinancialVal) * 100));
            const expHeight = Math.min(100, Math.max(8, (b.expenses / maxFinancialVal) * 100));

            return (
              <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-44">
                  {/* Income bar */}
                  <div
                    className="w-1/2 rounded-t-lg bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-300 group-hover:opacity-90 relative"
                    style={{ height: `${incHeight}%` }}
                    title={`Income: ${currency}${b.income}`}
                  />
                  {/* Expense bar */}
                  <div
                    className="w-1/2 rounded-t-lg bg-gradient-to-t from-rose-700 to-rose-400 transition-all duration-300 group-hover:opacity-90 relative"
                    style={{ height: `${expHeight}%` }}
                    title={`Expenses: ${currency}${b.expenses}`}
                  />
                </div>
                <span className="text-[10px] sm:text-xs text-[#8c96ab] font-mono mt-3 truncate">
                  {b.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Relapses & Habit Discipline Trend */}
      <div className="p-6 rounded-3xl bg-[#12151e] border border-[#232838] shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#1f2434] mb-4">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Habit Integrity ({settings.habitName})
            </h3>
          </div>
          <span className="text-xs text-[#94a3b8] font-mono">
            {rangeRelapses.length} incidents in {range}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          {buckets.map((b, idx) => (
            <div key={idx} className="p-3 rounded-2xl bg-[#0b0d13] border border-[#1e2332] text-center">
              <span className="text-[10px] text-[#8c96ab] block">{b.label}</span>
              <div
                className={`text-lg font-black font-mono my-1 ${
                  b.relapses > 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {b.relapses}
              </div>
              <span className="text-[9px] uppercase font-bold text-[#64748b]">
                {b.relapses === 0 ? 'Clean' : 'Reset'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
