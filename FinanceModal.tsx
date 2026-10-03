import React, { useState } from 'react';
import { DollarSign, Calendar, Tag, FileText, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { FinanceRecord, FinanceType, IncomeCategory, ExpenseCategory } from '../types';

interface FinanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Omit<FinanceRecord, 'id' | 'userId' | 'createdAt'>, existingId?: string) => Promise<void>;
  currency: string;
  initialRecord?: FinanceRecord | null;
}

export const FinanceModal: React.FC<FinanceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currency,
  initialRecord,
}) => {
  if (!isOpen) return null;

  const [type, setType] = useState<FinanceType>(initialRecord?.type || 'expense');
  const [category, setCategory] = useState<string>(
    initialRecord?.category || (type === 'income' ? 'Salary' : 'Food')
  );
  const [amount, setAmount] = useState<string>(initialRecord ? String(initialRecord.amount) : '');
  const [date, setDate] = useState<string>(
    initialRecord?.date || new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>(initialRecord?.notes || '');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const incomeCategories: IncomeCategory[] = ['Salary', 'Tips', 'Other Income'];
  const expenseCategories: ExpenseCategory[] = [
    'Food',
    'Shopping',
    'Internet',
    'Transport',
    'Rent',
    'Personal',
    'Family',
    'Other',
  ];

  const handleTypeChange = (newType: FinanceType) => {
    setType(newType);
    setCategory(newType === 'income' ? 'Salary' : 'Food');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    if (!date) {
      setError('Please select a valid transaction date.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(
        {
          type,
          category,
          amount: parseFloat(parsedAmount.toFixed(2)),
          date,
          notes: notes.trim(),
        },
        initialRecord?.id
      );
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save transaction');
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
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                type === 'income'
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400'
                  : 'bg-rose-950/40 border-rose-500/50 text-rose-400'
              }`}
            >
              {type === 'income' ? (
                <ArrowUpRight className="w-6 h-6" />
              ) : (
                <ArrowDownRight className="w-6 h-6" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold font-['Cinzel'] text-[#fdf8f0] tracking-wide">
                {initialRecord ? 'Edit Entry' : 'Record Transaction'}
              </h2>
              <p className="text-xs text-[#94a3b8] mt-0.5">
                Maintain strict financial clarity and discipline
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

        {/* Type Toggle */}
        <div className="grid grid-cols-2 gap-2 p-1.5 my-5 bg-[#0b0d13] border border-[#232838] rounded-2xl">
          <button
            type="button"
            onClick={() => handleTypeChange('income')}
            className={`py-2 text-xs font-semibold uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 ${
              type === 'income'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" /> Income
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('expense')}
            className={`py-2 text-xs font-semibold uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 ${
              type === 'expense'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            <ArrowDownRight className="w-3.5 h-3.5" /> Expense
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Transaction Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-[#94a3b8] mb-1.5">
              Amount ({currency})
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
                Category
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 absolute left-3 top-3 text-[#64748b]" />
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#0b0d13] border border-[#232838] rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-[#d4af37]"
                >
                  {(type === 'income' ? incomeCategories : expenseCategories).map(cat => (
                    <option key={cat} value={cat} className="bg-[#12141c]">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-[#94a3b8] mb-1.5">
                Date
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
              Notes / Description (Optional)
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 absolute left-3 top-3 text-[#64748b]" />
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="E.g., Bi-weekly paycheck, groceries, client tip"
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
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#aa771c] hover:opacity-90 text-[#0b0c10] font-bold text-xs tracking-wider uppercase shadow-lg shadow-amber-950/40 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : initialRecord ? 'Update Transaction' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
