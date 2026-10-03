import React from 'react';
import {
  Flame,
  Wallet,
  Heart,
  UtensilsCrossed,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  ShieldAlert,
  ChevronRight,
  Clock,
  TrendingUp,
  FileBarChart,
  FileText,
} from 'lucide-react';
import {
  UserProfile,
  UserSettings,
  RelapseRecord,
  FinanceRecord,
  FamilyMoneyRecord,
  RecipeRecord,
} from '../types';
import { NavTab } from '../components/BottomNav';

interface DashboardViewProps {
  profile: UserProfile | null;
  settings: UserSettings;
  relapses: RelapseRecord[];
  finances: FinanceRecord[];
  familyMoney: FamilyMoneyRecord[];
  recipes: RecipeRecord[];
  onNavigate: (tab: NavTab) => void;
  onOpenRelapseModal: () => void;
  onOpenFinanceModal: (type?: 'income' | 'expense') => void;
  onOpenFamilyModal: () => void;
  onOpenRecipeModal: () => void;
  onOpenReportModal: () => void;
  onOpenUrgeGuide: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  settings,
  relapses,
  finances,
  familyMoney,
  recipes,
  onNavigate,
  onOpenRelapseModal,
  onOpenFinanceModal,
  onOpenFamilyModal,
  onOpenRecipeModal,
  onOpenReportModal,
  onOpenUrgeGuide,
}) => {
  // Current month string (YYYY-MM)
  const currentMonth = new Date().toISOString().slice(0, 7);

  // Compute Streak Stats
  const lastRelapse = relapses.length > 0 ? relapses[0] : null;
  const streakStartTime = lastRelapse
    ? lastRelapse.timestamp
    : new Date(settings.habitStartDate || Date.now()).getTime();

  const now = Date.now();
  const diffMs = Math.max(0, now - streakStartTime);
  const currentStreakDays = Math.floor(diffMs / 86400000);
  const currentStreakHours = Math.floor((diffMs % 86400000) / 3600000);

  // Compute Longest Streak
  let longestStreak = currentStreakDays;
  for (let i = 0; i < relapses.length; i++) {
    if (relapses[i].streakDaysLost > longestStreak) {
      longestStreak = relapses[i].streakDaysLost;
    }
  }

  // Monthly Finances
  const monthlyFinances = finances.filter(f => f.date.startsWith(currentMonth));
  const monthlySalary = monthlyFinances
    .filter(f => f.type === 'income' && f.category === 'Salary')
    .reduce((sum, f) => sum + f.amount, 0);
  const monthlyTips = monthlyFinances
    .filter(f => f.type === 'income' && f.category === 'Tips')
    .reduce((sum, f) => sum + f.amount, 0);
  const monthlyOtherIncome = monthlyFinances
    .filter(f => f.type === 'income' && f.category === 'Other Income')
    .reduce((sum, f) => sum + f.amount, 0);
  const totalIncome = monthlySalary + monthlyTips + monthlyOtherIncome;
  const totalExpenses = monthlyFinances
    .filter(f => f.type === 'expense')
    .reduce((sum, f) => sum + f.amount, 0);
  const monthlySavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.round((monthlySavings / totalIncome) * 100) : 0;

  // Monthly Family Money
  const monthlyFamilyTotal = familyMoney
    .filter(fm => fm.date.startsWith(currentMonth))
    .reduce((sum, fm) => sum + fm.amount, 0);

  const currency = settings.currency || '$';

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-16">
      {/* Hero Welcome & Motto */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#161a25] via-[#0f1219] to-[#07080c] border border-[#d4af37]/25 p-6 sm:p-8 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#d4af37]/10 via-[#831843]/10 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#ffd700] text-xs font-semibold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Flagship Life Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold font-['Cinzel'] text-[#fdf8f0] tracking-wide">
              {profile?.displayName ? `Greetings, ${profile.displayName.split(' ')[0]}` : 'A Better You Every Day'}
            </h1>
            <p className="text-xs sm:text-sm text-[#94a3b8] max-w-xl leading-relaxed">
              Discipline in your habits. Mastery over your capital. Reverence for your family.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('cv')}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#d4af37]/20 via-[#ffd700]/15 to-[#aa771c]/20 hover:from-[#d4af37]/30 hover:to-[#aa771c]/30 border border-[#d4af37]/50 text-[#ffd700] font-bold text-xs tracking-wider uppercase transition flex items-center gap-2 shadow-sm"
            >
              <FileText className="w-4 h-4 text-[#ffd700]" />
              <span>CV Builder</span>
            </button>
            <button
              onClick={onOpenReportModal}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#ffd700] to-[#c5a059] text-[#0b0c10] font-bold text-xs tracking-wider uppercase shadow-lg shadow-amber-950/40 hover:opacity-95 transition flex items-center gap-2"
            >
              <FileBarChart className="w-4 h-4" />
              <span>Generate AI Report</span>
            </button>
            <button
              onClick={onOpenUrgeGuide}
              className="px-4 py-2.5 rounded-2xl bg-[#1b202e] hover:bg-[#252c3f] border border-rose-500/30 text-rose-300 text-xs font-semibold tracking-wider uppercase transition flex items-center gap-2"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Urge Protocol</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Streak Metric */}
        <div
          onClick={() => onNavigate('relapse')}
          className="group relative rounded-3xl bg-[#12151e] border border-[#d4af37]/25 hover:border-[#d4af37]/60 p-5 sm:p-6 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-[0_4px_24px_rgba(212,175,55,0.15)] flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 border border-[#d4af37]/30 flex items-center justify-center text-[#ffd700]">
              <Flame className="w-6 h-6 fill-[#ffd700]/30" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#94a3b8] px-2.5 py-1 rounded-full bg-[#0b0c10] border border-[#232838]">
              {settings.habitName}
            </span>
          </div>

          <div className="my-4">
            <div className="text-3xl sm:text-4xl font-extrabold font-mono text-[#fdf8f0] tracking-tight">
              {currentStreakDays} <span className="text-sm font-normal text-[#94a3b8]">days</span>
            </div>
            <div className="text-xs text-[#a0aab8] mt-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#ffd700]" />
              <span>+ {currentStreakHours} hours clean • Peak: {longestStreak}d</span>
            </div>
          </div>

          <div className="pt-3 border-t border-[#232838] flex items-center justify-between text-xs text-[#d4af37] font-semibold group-hover:text-[#ffd700]">
            <span>Habit Tracker</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Financial Balance & Savings */}
        <div
          onClick={() => onNavigate('finance')}
          className="group relative rounded-3xl bg-[#12151e] border border-emerald-500/25 hover:border-emerald-500/50 p-5 sm:p-6 transition-all duration-300 cursor-pointer shadow-lg flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Wallet className="w-6 h-6" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30">
              {savingsRate}% Saved
            </span>
          </div>

          <div className="my-4">
            <div className="text-3xl sm:text-4xl font-extrabold font-mono text-emerald-300 tracking-tight">
              {currency}{monthlySavings.toFixed(2)}
            </div>
            <div className="text-xs text-[#94a3b8] mt-1">
              Income: {currency}{totalIncome.toFixed(0)} • Exp: {currency}{totalExpenses.toFixed(0)}
            </div>
          </div>

          <div className="pt-3 border-t border-[#232838] flex items-center justify-between text-xs text-emerald-400 font-semibold group-hover:text-emerald-300">
            <span>Finance Ledger</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Family Support */}
        <div
          onClick={() => onNavigate('family')}
          className="group relative rounded-3xl bg-[#12151e] border border-[#d4af37]/25 hover:border-[#d4af37]/60 p-5 sm:p-6 transition-all duration-300 cursor-pointer shadow-lg flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-[#d4af37]/40 flex items-center justify-center text-[#ffd700]">
              <Heart className="w-6 h-6 fill-[#ffd700]/20" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#a0aab8] px-2.5 py-1 rounded-full bg-[#0b0c10] border border-[#232838]">
              This Month
            </span>
          </div>

          <div className="my-4">
            <div className="text-3xl sm:text-4xl font-extrabold font-mono text-[#ffd700] tracking-tight">
              {currency}{monthlyFamilyTotal.toFixed(2)}
            </div>
            <div className="text-xs text-[#94a3b8] mt-1">
              Sent to parents & relatives this period
            </div>
          </div>

          <div className="pt-3 border-t border-[#232838] flex items-center justify-between text-xs text-[#d4af37] font-semibold group-hover:text-[#ffd700]">
            <span>Family Money</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Recipe Library */}
        <div
          onClick={() => onNavigate('recipes')}
          className="group relative rounded-3xl bg-[#12151e] border border-[#262c3e] hover:border-[#d4af37]/50 p-5 sm:p-6 transition-all duration-300 cursor-pointer shadow-lg flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-[#1b202e] border border-[#2d364c] flex items-center justify-center text-[#e2e8f0]">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#a0aab8] px-2.5 py-1 rounded-full bg-[#0b0c10] border border-[#232838]">
              Crafts
            </span>
          </div>

          <div className="my-4">
            <div className="text-3xl sm:text-4xl font-extrabold font-mono text-[#fdf8f0] tracking-tight">
              {recipes.length} <span className="text-sm font-normal text-[#94a3b8]">recipes</span>
            </div>
            <div className="text-xs text-[#94a3b8] mt-1">
              Mocktails, tonics, coffees & healthy meals
            </div>
          </div>

          <div className="pt-3 border-t border-[#232838] flex items-center justify-between text-xs text-[#cbd5e1] font-semibold group-hover:text-white">
            <span>Recipe Vault</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Quick Action Hub */}
      <div className="rounded-3xl bg-[#10131a] border border-[#202534] p-5 sm:p-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-4 flex items-center gap-2">
          <span>Executive Actions</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={onOpenRelapseModal}
            className="p-3.5 rounded-2xl bg-[#171a24] hover:bg-[#202535] border border-rose-500/20 hover:border-rose-500/40 text-left transition flex flex-col justify-between h-24"
          >
            <div className="w-8 h-8 rounded-xl bg-rose-950/40 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <Flame className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-rose-300">I Relapsed</span>
          </button>

          <button
            onClick={() => onOpenFinanceModal('income')}
            className="p-3.5 rounded-2xl bg-[#171a24] hover:bg-[#202535] border border-emerald-500/20 hover:border-emerald-500/40 text-left transition flex flex-col justify-between h-24"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-950/40 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-emerald-300">Add Income</span>
          </button>

          <button
            onClick={() => onOpenFinanceModal('expense')}
            className="p-3.5 rounded-2xl bg-[#171a24] hover:bg-[#202535] border border-[#2a3044] hover:border-rose-500/40 text-left transition flex flex-col justify-between h-24"
          >
            <div className="w-8 h-8 rounded-xl bg-rose-950/20 text-rose-300 flex items-center justify-center border border-rose-500/20">
              <ArrowDownRight className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-[#e2e8f0]">Add Expense</span>
          </button>

          <button
            onClick={onOpenFamilyModal}
            className="p-3.5 rounded-2xl bg-[#171a24] hover:bg-[#202535] border border-amber-500/20 hover:border-amber-500/40 text-left transition flex flex-col justify-between h-24"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-950/40 text-[#ffd700] flex items-center justify-center border border-[#d4af37]/30">
              <Heart className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-[#ffd700]">Family Money</span>
          </button>

          <button
            onClick={onOpenRecipeModal}
            className="p-3.5 rounded-2xl bg-[#171a24] hover:bg-[#202535] border border-[#2a3044] hover:border-[#d4af37]/40 text-left transition flex flex-col justify-between h-24"
          >
            <div className="w-8 h-8 rounded-xl bg-[#232838] text-white flex items-center justify-center border border-[#2f374c]">
              <Plus className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-[#cbd5e1]">Add Recipe</span>
          </button>

          <button
            onClick={() => onNavigate('ai')}
            className="p-3.5 rounded-2xl bg-[#171a24] hover:bg-[#202535] border border-[#d4af37]/30 hover:border-[#d4af37]/60 text-left transition flex flex-col justify-between h-24"
          >
            <div className="w-8 h-8 rounded-xl bg-[#d4af37]/20 text-[#ffd700] flex items-center justify-center border border-[#d4af37]/40">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-[#f9e498]">Ask AI Coach</span>
          </button>
        </div>
      </div>

      {/* Two Column Section: Recent Finances & Recent Relapses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Financial Transactions */}
        <div className="rounded-3xl bg-[#12151e] border border-[#202534] p-5 sm:p-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#232838]">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#e2e8f0] flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span>Recent Transactions</span>
            </h3>
            <button
              onClick={() => onNavigate('finance')}
              className="text-xs text-[#d4af37] hover:underline"
            >
              View All &rarr;
            </button>
          </div>

          <div className="mt-4 space-y-2.5">
            {finances.slice(0, 4).map(f => (
              <div
                key={f.id}
                className="p-3 rounded-2xl bg-[#0b0d13] border border-[#1e2332] flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-semibold text-white">{f.category}</div>
                  <div className="text-[10px] text-[#717b8f]">
                    {f.date} {f.notes ? `• ${f.notes}` : ''}
                  </div>
                </div>
                <div
                  className={`text-xs font-bold font-mono ${
                    f.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {f.type === 'income' ? '+' : '-'}
                  {currency}
                  {f.amount.toFixed(2)}
                </div>
              </div>
            ))}

            {finances.length === 0 && (
              <div className="text-center py-6 text-xs text-[#717b8f]">
                No transactions recorded yet. Tap "Add Income" or "Add Expense".
              </div>
            )}
          </div>
        </div>

        {/* Habit History & Motivation */}
        <div className="rounded-3xl bg-[#12151e] border border-[#202534] p-5 sm:p-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#232838]">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#e2e8f0] flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-400" />
              <span>Habit Integrity ({settings.habitName})</span>
            </h3>
            <button
              onClick={() => onNavigate('relapse')}
              className="text-xs text-[#d4af37] hover:underline"
            >
              History &rarr;
            </button>
          </div>

          <div className="mt-4 space-y-2.5">
            {relapses.slice(0, 3).map(r => (
              <div
                key={r.id}
                className="p-3 rounded-2xl bg-[#0b0d13] border border-[#241a22] flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-semibold text-[#f1f5f9]">
                    Trigger: {r.trigger || 'Unspecified'}
                  </div>
                  <div className="text-[10px] text-[#8c96ab]">
                    {r.relapseDate} at {r.relapseTime}
                  </div>
                </div>
                <div className="text-xs font-mono text-rose-400 font-bold">
                  {r.streakDaysLost}d lost
                </div>
              </div>
            ))}

            {relapses.length === 0 && (
              <div className="p-4 rounded-2xl bg-[#0d1612] border border-emerald-500/30 text-center">
                <span className="text-emerald-400 font-bold text-xs block mb-1">
                  Clean & Untarnished Record
                </span>
                <p className="text-[11px] text-[#94a3b8]">
                  No relapses on record. Continue holding your standard with dignity.
                </p>
              </div>
            )}
          </div>

          {/* Stoic Reflection Quote */}
          <div className="mt-5 p-4 rounded-2xl bg-[#0e111a] border border-[#232838] text-xs text-[#94a3b8] italic">
            "No man is free who is not master of himself." — Epictetus
          </div>
        </div>
      </div>
    </div>
  );
};
