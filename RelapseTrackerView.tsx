import React, { useState, useEffect } from 'react';
import {
  Flame,
  ShieldAlert,
  Calendar,
  Clock,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Info,
  CheckCircle2,
  Trash2,
  Edit2,
} from 'lucide-react';
import { RelapseRecord, UserSettings } from '../types';

interface RelapseTrackerViewProps {
  settings: UserSettings;
  relapses: RelapseRecord[];
  onOpenRelapseModal: () => void;
  onOpenUrgeGuide: () => void;
  onDeleteRelapse: (id: string) => Promise<void>;
  onUpdateHabitName: (name: string) => Promise<void>;
}

export const RelapseTrackerView: React.FC<RelapseTrackerViewProps> = ({
  settings,
  relapses,
  onOpenRelapseModal,
  onOpenUrgeGuide,
  onDeleteRelapse,
  onUpdateHabitName,
}) => {
  const [editingHabit, setEditingHabit] = useState(false);
  const [habitNameInput, setHabitNameInput] = useState(settings.habitName || 'Masturbation');
  const [now, setNow] = useState(Date.now());

  // Live timer tick every second for real-time streak precision
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const lastRelapse = relapses.length > 0 ? relapses[0] : null;
  const streakStartTime = lastRelapse
    ? lastRelapse.timestamp
    : new Date(settings.habitStartDate || Date.now()).getTime();

  const diffMs = Math.max(0, now - streakStartTime);
  const days = Math.floor(diffMs / 86400000);
  const hours = Math.floor((diffMs % 86400000) / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);
  const seconds = Math.floor((diffMs % 60000) / 1000);

  // Computations
  const totalRelapses = relapses.length;

  // Longest streak
  let longestStreakDays = days;
  for (let i = 0; i < relapses.length; i++) {
    if (relapses[i].streakDaysLost > longestStreakDays) {
      longestStreakDays = relapses[i].streakDaysLost;
    }
  }

  // Current Month & Year metrics
  const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM
  const currentYearStr = new Date().getFullYear().toString(); // YYYY

  const thisMonthRelapses = relapses.filter(r => r.relapseDate.startsWith(currentMonthStr)).length;
  const thisYearRelapses = relapses.filter(r => r.relapseDate.startsWith(currentYearStr)).length;

  // Average Interval
  let averageIntervalDays = 0;
  if (relapses.length > 1) {
    const oldestTimestamp = relapses[relapses.length - 1].timestamp;
    const daysSpan = Math.max(1, (now - oldestTimestamp) / 86400000);
    averageIntervalDays = Math.round((daysSpan / relapses.length) * 10) / 10;
  } else if (relapses.length === 1) {
    averageIntervalDays = Math.round(days * 10) / 10;
  }

  const handleSaveHabitName = async () => {
    if (habitNameInput.trim()) {
      await onUpdateHabitName(habitNameInput.trim());
      setEditingHabit(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-16">
      {/* Header & Habit Name Config */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1f2434]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#ffd700] px-2.5 py-0.5 rounded-full bg-[#ffd700]/10 border border-[#d4af37]/30">
              Habit Integrity Vault
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            {!editingHabit ? (
              <>
                <h1 className="text-2xl sm:text-3xl font-extrabold font-['Cinzel'] text-[#fdf8f0] tracking-wide">
                  {settings.habitName} Tracker
                </h1>
                <button
                  onClick={() => setEditingHabit(true)}
                  className="p-1.5 text-[#94a3b8] hover:text-[#ffd700] rounded-lg hover:bg-[#1a1f2e] transition"
                  title="Rename Habit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={habitNameInput}
                  onChange={e => setHabitNameInput(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-[#0b0d13] border border-[#d4af37] text-sm text-white focus:outline-none"
                  placeholder="E.g., Masturbation, Alcohol, Gaming"
                />
                <button
                  onClick={handleSaveHabitName}
                  className="px-3 py-1.5 rounded-xl bg-[#d4af37] text-[#0b0c10] text-xs font-bold uppercase"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingHabit(false)}
                  className="px-2 py-1.5 text-xs text-[#94a3b8] hover:text-white"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenUrgeGuide}
            className="px-4 py-2.5 rounded-2xl bg-[#1b202e] hover:bg-[#252c3f] border border-rose-500/40 text-rose-300 text-xs font-semibold tracking-wider uppercase transition flex items-center gap-2"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Emergency Urge Protocol</span>
          </button>
        </div>
      </div>

      {/* Main Luxury Streak Counter Card */}
      <div className="relative rounded-3xl bg-gradient-to-b from-[#181d2a] via-[#10131d] to-[#090b10] border border-[#d4af37]/30 p-6 sm:p-10 text-center shadow-2xl overflow-hidden">
        {/* Ambient Gold Radial Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#ffd700]/5 blur-3xl pointer-events-none rounded-full" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-amber-500/20 via-[#ffd700]/10 to-rose-500/20 border border-[#d4af37]/40 flex items-center justify-center text-[#ffd700] mb-4 shadow-[0_0_30px_rgba(212,175,55,0.2)]">
            <Flame className="w-8 h-8 sm:w-10 sm:h-10 fill-[#ffd700]/30 animate-pulse" />
          </div>

          <span className="text-xs uppercase font-bold tracking-[0.2em] text-[#94a3b8]">
            Current Standing Streak
          </span>

          {/* Days Display */}
          <div className="my-3 flex items-baseline justify-center gap-2">
            <span className="text-6xl sm:text-8xl font-black font-mono tracking-tight bg-gradient-to-r from-[#fdf8f0] via-[#ffd700] to-[#c5a059] bg-clip-text text-transparent">
              {days}
            </span>
            <span className="text-xl sm:text-2xl font-bold font-['Cinzel'] text-[#ffd700]">
              {days === 1 ? 'DAY' : 'DAYS'}
            </span>
          </div>

          {/* Real-Time Precision Chronometer */}
          <div className="flex items-center gap-3 sm:gap-6 py-2 px-4 sm:px-6 rounded-2xl bg-[#0b0d13]/80 border border-[#232838] font-mono text-xs sm:text-sm text-[#cbd5e1] mb-6">
            <div className="flex flex-col items-center">
              <span className="font-bold text-[#ffd700]">{hours.toString().padStart(2, '0')}</span>
              <span className="text-[9px] uppercase tracking-wider text-[#64748b]">Hours</span>
            </div>
            <span className="text-[#475569] font-bold">:</span>
            <div className="flex flex-col items-center">
              <span className="font-bold text-[#ffd700]">{minutes.toString().padStart(2, '0')}</span>
              <span className="text-[9px] uppercase tracking-wider text-[#64748b]">Minutes</span>
            </div>
            <span className="text-[#475569] font-bold">:</span>
            <div className="flex flex-col items-center">
              <span className="font-bold text-[#ffd700]">{seconds.toString().padStart(2, '0')}</span>
              <span className="text-[9px] uppercase tracking-wider text-[#64748b]">Seconds</span>
            </div>
          </div>

          {/* Prominent "I Relapsed" Button */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onOpenRelapseModal}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#831843] via-[#9f1239] to-[#4a1525] hover:opacity-95 text-white font-bold text-xs sm:text-sm tracking-wider uppercase shadow-xl shadow-rose-950/60 transition flex items-center gap-2.5 active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>I Relapsed</span>
            </button>
          </div>
        </div>
      </div>

      {/* Comprehensive Statistical Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Longest Streak */}
        <div className="p-4 rounded-2xl bg-[#12151e] border border-[#232838] flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#8c96ab]">
            Longest Streak
          </span>
          <div className="text-2xl font-black font-mono text-[#ffd700] my-1">
            {longestStreakDays} <span className="text-xs font-normal text-[#8c96ab]">days</span>
          </div>
          <span className="text-[10px] text-[#64748b]">All-time peak</span>
        </div>

        {/* Total Relapses */}
        <div className="p-4 rounded-2xl bg-[#12151e] border border-[#232838] flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#8c96ab]">
            Total Relapses
          </span>
          <div className="text-2xl font-black font-mono text-rose-400 my-1">
            {totalRelapses}
          </div>
          <span className="text-[10px] text-[#64748b]">Logged incidents</span>
        </div>

        {/* This Month */}
        <div className="p-4 rounded-2xl bg-[#12151e] border border-[#232838] flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#8c96ab]">
            This Month
          </span>
          <div className="text-2xl font-black font-mono text-amber-300 my-1">
            {thisMonthRelapses}
          </div>
          <span className="text-[10px] text-[#64748b]">{currentMonthStr}</span>
        </div>

        {/* This Year */}
        <div className="p-4 rounded-2xl bg-[#12151e] border border-[#232838] flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#8c96ab]">
            This Year
          </span>
          <div className="text-2xl font-black font-mono text-amber-300 my-1">
            {thisYearRelapses}
          </div>
          <span className="text-[10px] text-[#64748b]">Calendar {currentYearStr}</span>
        </div>

        {/* Average Interval */}
        <div className="p-4 rounded-2xl bg-[#12151e] border border-[#232838] flex flex-col justify-between col-span-2 sm:col-span-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#8c96ab]">
            Avg Interval
          </span>
          <div className="text-2xl font-black font-mono text-emerald-400 my-1">
            {averageIntervalDays} <span className="text-xs font-normal text-[#8c96ab]">days</span>
          </div>
          <span className="text-[10px] text-[#64748b]">Between resets</span>
        </div>
      </div>

      {/* Relapse History Table & Log */}
      <div className="rounded-3xl bg-[#12151e] border border-[#232838] p-5 sm:p-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#1f2434]">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#f1f5f9] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#ffd700]" />
            <span>Relapse History & Triggers</span>
          </h2>
          <span className="text-xs text-[#94a3b8]">{relapses.length} records</span>
        </div>

        <div className="mt-4 space-y-3">
          {relapses.map(r => (
            <div
              key={r.id}
              className="p-4 rounded-2xl bg-[#0b0d13] border border-[#1e2332] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-950/50 border border-rose-500/30 text-rose-300 font-mono text-xs font-bold">
                    {r.relapseDate} at {r.relapseTime}
                  </span>
                  <span className="text-xs font-semibold text-white">
                    Trigger: {r.trigger || 'Unspecified'}
                  </span>
                </div>
                {r.notes && (
                  <p className="text-xs text-[#94a3b8] italic">"{r.notes}"</p>
                )}
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#1a1f2c]">
                <span className="text-xs font-mono text-[#ffd700] font-bold">
                  {r.streakDaysLost} day(s) clean lost
                </span>
                <button
                  onClick={() => onDeleteRelapse(r.id)}
                  className="p-1.5 text-[#64748b] hover:text-rose-400 rounded-lg hover:bg-[#1a1f2e] transition"
                  title="Delete Entry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {relapses.length === 0 && (
            <div className="text-center py-10">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
              <h3 className="text-sm font-bold text-white">Zero Relapses on Record</h3>
              <p className="text-xs text-[#8c96ab] max-w-sm mx-auto mt-1">
                Your discipline is immaculate. Keep showing up each day with steadfast resolve.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
