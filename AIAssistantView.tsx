import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  ShieldAlert,
  Wallet,
  UtensilsCrossed,
  RefreshCw,
  Flame,
} from 'lucide-react';
import { askAIAssistant, ChatMessage } from '../services/aiService';
import { UserSettings, RelapseRecord, FinanceRecord, FamilyMoneyRecord } from '../types';

interface AIAssistantViewProps {
  settings: UserSettings;
  relapses: RelapseRecord[];
  finances: FinanceRecord[];
  familyMoney: FamilyMoneyRecord[];
  currency: string;
  onOpenUrgeGuide: () => void;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({
  settings,
  relapses,
  finances,
  familyMoney,
  currency,
  onOpenUrgeGuide,
}) => {
  const currentMonthStr = new Date().toISOString().slice(0, 7);

  // Compute live context stats to pass safely to server proxy
  const lastRelapse = relapses.length > 0 ? relapses[0] : null;
  const streakStartTime = lastRelapse
    ? lastRelapse.timestamp
    : new Date(settings.habitStartDate || Date.now()).getTime();
  const currentStreakDays = Math.floor(Math.max(0, Date.now() - streakStartTime) / 86400000);

  const monthlyFinances = finances.filter(f => f.date.startsWith(currentMonthStr));
  const monthlyIncome = monthlyFinances
    .filter(f => f.type === 'income')
    .reduce((sum, f) => sum + f.amount, 0);
  const monthlyExpenses = monthlyFinances
    .filter(f => f.type === 'expense')
    .reduce((sum, f) => sum + f.amount, 0);
  const monthlySavings = monthlyIncome - monthlyExpenses;
  const familyMoneyTotal = familyMoney
    .filter(f => f.date.startsWith(currentMonthStr))
    .reduce((sum, f) => sum + f.amount, 0);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Welcome to your Executive Life Console. I am your CCD Growth Coach. Your current ${settings.habitName} streak is ${currentStreakDays} days clean, and your monthly net savings stand at ${currency}${monthlySavings.toFixed(2)}. How can I empower your focus today?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const promptSuggestions = [
    {
      label: 'Urge Emergency',
      icon: ShieldAlert,
      prompt: "I am experiencing an intense craving right now. Walk me through physiological urge surfing step-by-step.",
    },
    {
      label: 'Financial Wisdom',
      icon: Wallet,
      prompt: `Given my current income (${currency}${monthlyIncome.toFixed(0)}) and expenses (${currency}${monthlyExpenses.toFixed(0)}), what is an optimal budget structure for this month?`,
    },
    {
      label: 'Evening Mocktail Craft',
      icon: UtensilsCrossed,
      prompt: "Recommend a soothing, sophisticated non-alcoholic evening ritual drink that curbs late-night boredom.",
    },
    {
      label: 'Streak Mindset',
      icon: Flame,
      prompt: `How do I prevent relapse complacency after hitting ${currentStreakDays} days clean?`,
    },
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMessage: ChatMessage = { role: 'user', content: query };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const reply = await askAIAssistant(updatedMessages, {
        currentStreakDays,
        habitName: settings.habitName,
        monthlyIncome,
        monthlyExpenses,
        monthlySavings,
        familyMoneyTotal,
        currency,
      });

      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'I am here. Take a steady breath. Every challenge is a stepping stone for your neural rewiring. Focus on the next 60 minutes.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1f2434]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#ffd700] px-2.5 py-0.5 rounded-full bg-[#ffd700]/10 border border-[#d4af37]/30">
              Secure Cloud Intelligence
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-['Cinzel'] text-[#fdf8f0] tracking-wide mt-1">
            CCD AI Coach
          </h1>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            Zero API keys stored in client • Powered by server-side Gemini intelligence
          </p>
        </div>

        <button
          onClick={onOpenUrgeGuide}
          className="px-4 py-2 rounded-2xl bg-[#1b202e] hover:bg-[#252c3f] border border-rose-500/30 text-rose-300 text-xs font-semibold tracking-wider uppercase transition flex items-center gap-2"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Urge Guide</span>
        </button>
      </div>

      {/* Suggested Prompts Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {promptSuggestions.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={() => handleSend(item.prompt)}
              className="px-3 py-1.5 rounded-xl bg-[#12151e] border border-[#232838] hover:border-[#d4af37]/60 text-[#cbd5e1] hover:text-[#ffd700] text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 shrink-0 shadow-sm"
            >
              <Icon className="w-3.5 h-3.5 text-[#ffd700]" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Chat Messages Container */}
      <div className="rounded-3xl bg-[#10131c] border border-[#202534] p-4 sm:p-6 h-[55vh] sm:h-[60vh] overflow-y-auto space-y-4 shadow-inner flex flex-col">
        {messages.map((m, idx) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={idx}
              className={`flex items-start gap-3 max-w-[85%] sm:max-w-[75%] ${
                isUser ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                  isUser
                    ? 'bg-[#1b202e] border-[#2f374c] text-white'
                    : 'bg-gradient-to-br from-[#ffd700]/20 to-[#aa771c]/10 border-[#d4af37]/40 text-[#ffd700]'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line shadow ${
                  isUser
                    ? 'bg-gradient-to-r from-[#d4af37] to-[#b38628] text-[#0b0c10] font-medium rounded-tr-none'
                    : 'bg-[#161a26] border border-[#252c3e] text-[#f1f5f9] rounded-tl-none font-sans'
                }`}
              >
                {m.content}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#ffd700]/20 border border-[#d4af37]/40 text-[#ffd700] flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-[#161a26] border border-[#252c3e] text-xs text-[#94a3b8] flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#ffd700]" />
              <span>Analyzing context & formulating strategy...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSend();
        }}
        className="relative flex items-center"
      >
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask for advice on urges, cashflow, recipes, or personal discipline..."
          className="w-full pl-4 pr-12 py-3.5 bg-[#12151e] border border-[#242938] rounded-2xl text-xs sm:text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#d4af37] shadow-lg"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="absolute right-2 p-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa771c] text-[#0b0c10] hover:opacity-90 disabled:opacity-30 transition"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
