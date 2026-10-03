import React, { useState, useMemo } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  PieChart,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { FinanceRecord, FinanceType } from '../types';

interface FinanceTrackerViewProps {
  finances: FinanceRecord[];
  currency: string;
  onOpenAddModal: (type?: FinanceType) => void;
  onEditRecord: (record: FinanceRecord) => void;
  onDeleteRecord: (id: string) => Promise<void>;
}

export const FinanceTrackerView: React.FC<FinanceTrackerViewProps> = ({
  finances,
  currency,
  onOpenAddModal,
  onEditRecord,
  onDeleteRecord,
}) => {
  const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM
  const currentYearStr = new Date().getFullYear().toString(); // YYYY

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filtered dataset for currently selected month
  const monthlyRecords = useMemo(() => {
    return finances.filter(f => f.date.startsWith(selectedMonth));
  }, [finances, selectedMonth]);

  // Compute Monthly Ledger Totals
  const monthlySalary = useMemo(() => {
    return monthlyRecords
      .filter(f => f.type === 'income' && f.category === 'Salary')
      .reduce((sum, f) => sum + f.amount, 0);
  }, [monthlyRecords]);

  const monthlyTips = useMemo(() => {
    return monthlyRecords
      .filter(f => f.type === 'income' && f.category === 'Tips')
      .reduce((sum, f) => sum + f.amount, 0);
  }, [monthlyRecords]);

  const monthlyOtherIncome = useMemo(() => {
    return monthlyRecords
      .filter(f => f.type === 'income' && f.category === 'Other Income')
      .reduce((sum, f) => sum + f.amount, 0);
  }, [monthlyRecords]);

  const totalMonthlyIncome = monthlySalary + monthlyTips + monthlyOtherIncome;

  const totalMonthlyExpenses = useMemo(() => {
    return monthlyRecords
      .filter(f => f.type === 'expense')
      .reduce((sum, f) => sum + f.amount, 0);
  }, [monthlyRecords]);

  const remainingBalance = totalMonthlyIncome - totalMonthlyExpenses;
  const monthlySavings = remainingBalance;
  const savingsRate = totalMonthlyIncome > 0 ? ((monthlySavings / totalMonthlyIncome) * 100).toFixed(1) : '0.0';

  // Compute Yearly Ledger Totals
  const yearlyRecords = useMemo(() => {
    return finances.filter(f => f.date.startsWith(currentYearStr));
  }, [finances, currentYearStr]);

  const yearlyIncome = useMemo(() => {
    return yearlyRecords
      .filter(f => f.type === 'income')
      .reduce((sum, f) => sum + f.amount, 0);
  }, [yearlyRecords]);

  const yearlyExpenses = useMemo(() => {
    return yearlyRecords
      .filter(f => f.type === 'expense')
      .reduce((sum, f) => sum + f.amount, 0);
  }, [yearlyRecords]);

  const yearlySavings = yearlyIncome - yearlyExpenses;

  // Expense breakdown by category for charts
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    monthlyRecords
      .filter(f => f.type === 'expense')
      .forEach(f => {
        map[f.category] = (map[f.category] || 0) + f.amount;
      });
    return map;
  }, [monthlyRecords]);

  // Filtered displayed records based on search and filters
  const displayedRecords = useMemo(() => {
    return monthlyRecords.filter(f => {
      const matchType = filterType === 'all' || f.type === filterType;
      const matchCat = selectedCategory === 'all' || f.category === selectedCategory;
      const matchSearch =
        searchQuery === '' ||
        f.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.notes && f.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
        f.date.includes(searchQuery);
      return matchType && matchCat && matchSearch;
    });
  }, [monthlyRecords, filterType, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-16">
      {/* View Header & Quick Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1f2434]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 px-2.5 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-500/30">
              Excel-Grade Ledger
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-['Cinzel'] text-[#fdf8f0] tracking-wide mt-1">
            Finance & Cashflow
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3 top-3 text-[#ffd700]" />
            <input
              type="month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="pl-9 pr-3 py-2 bg-[#0b0d13] border border-[#232838] rounded-2xl text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          <button
            onClick={() => onOpenAddModal('income')}
            className="px-3.5 py-2 rounded-2xl bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold tracking-wider uppercase transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add</span> Income
          </button>

          <button
            onClick={() => onOpenAddModal('expense')}
            className="px-3.5 py-2 rounded-2xl bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 text-xs font-semibold tracking-wider uppercase transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add</span> Expense
          </button>
        </div>
      </div>

      {/* Monthly Executive Balances */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Monthly Income */}
        <div className="p-4 sm:p-5 rounded-3xl bg-[#12151e] border border-emerald-500/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#94a3b8] uppercase tracking-wider font-semibold">
            <span>Total Income</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-2 text-2xl sm:text-3xl font-black font-mono text-emerald-300">
            {currency}{totalMonthlyIncome.toFixed(2)}
          </div>
          <div className="text-[11px] text-[#717b8f] space-y-0.5">
            <div>Salary: {currency}{monthlySalary.toFixed(0)}</div>
            <div>Tips: {currency}{monthlyTips.toFixed(0)} • Other: {currency}{monthlyOtherIncome.toFixed(0)}</div>
          </div>
        </div>

        {/* Total Monthly Expenses */}
        <div className="p-4 sm:p-5 rounded-3xl bg-[#12151e] border border-rose-500/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#94a3b8] uppercase tracking-wider font-semibold">
            <span>Total Expenses</span>
            <ArrowDownRight className="w-4 h-4 text-rose-400" />
          </div>
          <div className="my-2 text-2xl sm:text-3xl font-black font-mono text-rose-400">
            {currency}{totalMonthlyExpenses.toFixed(2)}
          </div>
          <div className="text-[11px] text-[#717b8f]">
            {monthlyRecords.filter(f => f.type === 'expense').length} expense item(s)
          </div>
        </div>

        {/* Net Savings / Balance */}
        <div className="p-4 sm:p-5 rounded-3xl bg-[#12151e] border border-[#d4af37]/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#94a3b8] uppercase tracking-wider font-semibold">
            <span>Net Balance</span>
            <Wallet className="w-4 h-4 text-[#ffd700]" />
          </div>
          <div className="my-2 text-2xl sm:text-3xl font-black font-mono text-[#ffd700]">
            {currency}{monthlySavings.toFixed(2)}
          </div>
          <div className="text-[11px] text-[#717b8f]">
            Savings Rate: <strong className="text-white">{savingsRate}%</strong>
          </div>
        </div>

        {/* Yearly Overview */}
        <div className="p-4 sm:p-5 rounded-3xl bg-[#12151e] border border-[#232838] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#94a3b8] uppercase tracking-wider font-semibold">
            <span>Yearly {currentYearStr}</span>
            <TrendingUp className="w-4 h-4 text-[#cbd5e1]" />
          </div>
          <div className="my-2 text-2xl sm:text-3xl font-black font-mono text-white">
            {currency}{yearlySavings.toFixed(2)}
          </div>
          <div className="text-[11px] text-[#717b8f]">
            Inc: {currency}{yearlyIncome.toFixed(0)} • Exp: {currency}{yearlyExpenses.toFixed(0)}
          </div>
        </div>
      </div>

      {/* Expense Category Breakdown Bars */}
      {Object.keys(categoryBreakdown).length > 0 && (
        <div className="p-5 rounded-3xl bg-[#12151e] border border-[#202534]">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-3 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-[#ffd700]" />
            <span>Monthly Spending Distribution</span>
          </h2>
          <div className="space-y-2">
            {Object.entries(categoryBreakdown).map(([cat, amt]) => {
              const pct = totalMonthlyExpenses > 0 ? (amt / totalMonthlyExpenses) * 100 : 0;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white font-medium">{cat}</span>
                    <span className="text-[#94a3b8] font-mono">
                      {currency}{amt.toFixed(2)} ({pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#0b0d13] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#d4af37] to-[#aa771c]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search, Filter Bar & Ledger Table */}
      <div className="rounded-3xl bg-[#12151e] border border-[#232838] p-5 sm:p-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pb-5 border-b border-[#1f2434]">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#64748b]" />
            <input
              type="text"
              placeholder="Search category, notes, or date..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#0b0d13] border border-[#232838] rounded-xl text-xs sm:text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[#0b0d13] p-1 rounded-xl border border-[#232838] text-xs">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 rounded-lg transition ${
                  filterType === 'all' ? 'bg-[#1e2332] text-white font-semibold' : 'text-[#8c96ab]'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('income')}
                className={`px-3 py-1 rounded-lg transition ${
                  filterType === 'income' ? 'bg-emerald-950/60 text-emerald-300 font-semibold' : 'text-[#8c96ab]'
                }`}
              >
                Income
              </button>
              <button
                onClick={() => setFilterType('expense')}
                className={`px-3 py-1 rounded-lg transition ${
                  filterType === 'expense' ? 'bg-rose-950/60 text-rose-300 font-semibold' : 'text-[#8c96ab]'
                }`}
              >
                Expenses
              </button>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[#1f2434] text-[#8c96ab] uppercase text-[10px] tracking-wider">
                <th className="pb-3 pl-2">Date</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Notes</th>
                <th className="pb-3 text-right">Amount</th>
                <th className="pb-3 text-right pr-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1f2c]">
              {displayedRecords.map(r => (
                <tr key={r.id} className="hover:bg-[#161a25]/60 transition">
                  <td className="py-3 pl-2 font-mono text-white text-xs">{r.date}</td>
                  <td className="py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        r.type === 'income'
                          ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-950/50 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {r.type === 'income' ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      {r.type}
                    </span>
                  </td>
                  <td className="py-3 font-semibold text-[#f1f5f9]">{r.category}</td>
                  <td className="py-3 text-[#94a3b8] max-w-xs truncate">{r.notes || '—'}</td>
                  <td
                    className={`py-3 text-right font-mono font-bold ${
                      r.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {r.type === 'income' ? '+' : '-'}
                    {currency}
                    {r.amount.toFixed(2)}
                  </td>
                  <td className="py-3 text-right pr-2">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEditRecord(r)}
                        className="p-1.5 text-[#94a3b8] hover:text-[#ffd700] rounded-lg hover:bg-[#1a1f2e] transition"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteRecord(r.id)}
                        className="p-1.5 text-[#94a3b8] hover:text-rose-400 rounded-lg hover:bg-[#1a1f2e] transition"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {displayedRecords.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-xs text-[#64748b]">
                    No transactions matching your criteria for {selectedMonth}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
