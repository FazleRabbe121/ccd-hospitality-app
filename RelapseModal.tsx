import React, { useState } from 'react';
import { AlertTriangle, Clock, Calendar, BookmarkCheck, HeartHandshake, ShieldQuestion } from 'lucide-react';
import { RelapseRecord } from '../types';

interface RelapseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmRelapse: (record: Omit<RelapseRecord, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  habitName: string;
  currentStreakDays: number;
  onOpenGuide: () => void;
}

export const RelapseModal: React.FC<RelapseModalProps> = ({
  isOpen,
  onClose,
  onConfirmRelapse,
  habitName,
  currentStreakDays,
  onOpenGuide,
}) => {
  if (!isOpen) return null;

  const now = new Date();
  const defaultDate = now.toISOString().split('T')[0];
  const defaultTime = now.toTimeString().split(' ')[0].slice(0, 5);

  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(defaultTime);
  const [trigger, setTrigger] = useState('Stress / Overwhelm');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const triggersList = [
    'Stress / Overwhelm',
    'Fatigue / Lack of Sleep',
    'Late Night Screen Time',
    'Boredom / Lack of Purpose',
    'Loneliness / Isolation',
    'Anxiety or Fear',
    'Alcohol / Substances',
    'Other Trigger',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const combinedDateTime = new Date(`${date}T${time}:00`);
      const timestamp = !isNaN(combinedDateTime.getTime()) ? combinedDateTime.getTime() : Date.now();

      await onConfirmRelapse({
        habitName,
        relapseDate: date,
        relapseTime: time,
        timestamp,
        streakDaysLost: currentStreakDays,
        trigger,
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {
      console.error('Failed to log relapse:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#12141c] border border-[#4a1525] rounded-3xl p-6 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.8)] text-[#f1f5f9]">
        {/* Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-[#831843] to-transparent blur-[1px]" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-5 border-b border-[#242938]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#4a1525]/30 border border-[#831843]/60 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-['Cinzel'] text-[#fdf8f0] tracking-wide">
                Log Relapse
              </h2>
              <p className="text-xs text-[#94a3b8] mt-0.5">
                Focus on honesty, self-compassion, and immediate recovery
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

        {/* Compassionate Coaching Box */}
        <div className="my-5 p-4 rounded-2xl bg-[#1a1520] border border-rose-900/40 text-xs sm:text-sm text-[#e2e8f0] leading-relaxed">
          <div className="flex items-center gap-2 text-rose-400 font-semibold mb-1">
            <HeartHandshake className="w-4 h-4 shrink-0" />
            <span>Honesty is Strength</span>
          </div>
          <p className="text-[#a6adbb]">
            Logging this relapse is not a defeat—it is a conscious calibration. Your brain learned and grew during your{' '}
            <strong className="text-[#ffd700]">{currentStreakDays} day(s)</strong> clean. Resetting the counter allows you to recommit right now without self-shame.
          </p>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenGuide();
            }}
            className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-[#ffd700] hover:text-[#f9e498] underline underline-offset-4"
          >
            <ShieldQuestion className="w-3.5 h-3.5" />
            Urge still active? Read the Urge Protocol first &rarr;
          </button>
        </div>

        {/* Relapse Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-[#94a3b8] mb-1.5">
                Exact Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-3 text-[#64748b]" />
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-[#0b0d13] border border-[#232838] rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-[#94a3b8] mb-1.5">
                Exact Time
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 absolute left-3 top-3 text-[#64748b]" />
                <input
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-[#0b0d13] border border-[#232838] rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-[#94a3b8] mb-1.5">
              Primary Trigger
            </label>
            <select
              value={trigger}
              onChange={e => setTrigger(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#0b0d13] border border-[#232838] rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-[#d4af37]"
            >
              {triggersList.map(t => (
                <option key={t} value={t} className="bg-[#12141c]">
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-[#94a3b8] mb-1.5">
              Reflections & Lesson Learned
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="What context enabled this? What barrier can you place next time?"
              rows={3}
              className="w-full p-3 bg-[#0b0d13] border border-[#232838] rounded-xl text-xs sm:text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#d4af37] resize-none"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-[#232838] text-xs font-semibold text-[#94a3b8] hover:text-white hover:bg-[#1b202e] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#831843] to-[#4a1525] hover:from-[#9f1239] hover:to-[#5c132c] text-white font-semibold text-xs tracking-wider uppercase shadow-lg shadow-rose-950/50 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Logging...' : 'Confirm & Recommit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
