import React, { useState } from 'react';
import { Heart, Calendar, User, FileText } from 'lucide-react';
import { FamilyMoneyRecord } from '../types';

interface FamilyMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Omit<FamilyMoneyRecord, 'id' | 'userId' | 'createdAt'>, existingId?: string) => Promise<void>;
  currency: string;
  initialRecord?: FamilyMoneyRecord | null;
}

export const FamilyMoneyModal: React.FC<FamilyMoneyModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currency,
  initialRecord,
}) => {
  if (!isOpen) return null;

  const [amount, setAmount] = useState<string>(initialRecord ? String(initialRecord.amount) : '');
  const [recipient, setRecipient] = useState<string>(initialRecord?.recipient || 'Parents');
  const [date, setDate] = useState<string>(
    initialRecord?.date || new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>(initialRecord?.notes || '');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const recipientOptions = ['Parents', 'Mother', 'Father', 'Siblings', 'Children', 'Spouse', 'Extended Family', 'Other'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please specify a positive amount sent to family.');
      return;
    }

    if (!date) {
      setError('Please provide the date.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(
        {
          amount: parseFloat(parsedAmount.toFixed(2)),
          recipient: recipient.trim(),
          date,
          notes: notes.trim(),
        },
        initialRecord?.id
      );
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to record family money');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#12141c] border border-[#d4af37]/30 rounded-3xl p-6 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.8)] text-[#f1f5f9]">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-[#242938]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-[#d4af37]/40 flex items-center justify-center text-[#ffd700]">
              <Heart className="w-6 h-6 fill-[#ffd700]/20 text-[#ffd700]" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-['Cinzel'] text-[#fdf8f0] tracking-wide">
                {initialRecord ? 'Edit Family Support' : 'Send Family Money'}
              </h2>
              <p className="text-xs text-[#94a3b8] mt-0.5">
                Honoring your family and tracking generosity with intention
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 my-5">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-[#94a3b8] mb-1.5">
              Amount Sent ({currency})
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 font-bold text-sm text-[#ffd700]">
                {currency}
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-3 py-2.5 bg-[#0b0d13] border border-[#232838] rounded-xl text-base font-semibold text-white placeholder-[#475569] focus:outline-none focus:border-[#d4af37]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-[#94a3b8] mb-1.5">
                Recipient / Member
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-[#64748b]" />
                <select
                  value={recipient}
                  onChange={e => setRecipient(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#0b0d13] border border-[#232838] rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-[#d4af37]"
                >
                  {recipientOptions.map(opt => (
                    <option key={opt} value={opt} className="bg-[#12141c]">
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-[#94a3b8] mb-1.5">
                Date Sent
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-3 text-[#64748b]" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#0b0d13] border border-[#232838] rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-[#94a3b8] mb-1.5">
              Purpose / Note (Optional)
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 absolute left-3 top-3 text-[#64748b]" />
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="E.g., Monthly home allowance, medical care, gift"
                maxLength={500}
                className="w-full pl-9 pr-3 py-2.5 bg-[#0b0d13] border border-[#232838] rounded-xl text-xs sm:text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#d4af37]"
              />
            </div>
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
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#ffd700] to-[#c5a059] hover:opacity-90 text-[#0b0c10] font-bold text-xs tracking-wider uppercase shadow-lg shadow-amber-950/40 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Recording...' : 'Record Support'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
