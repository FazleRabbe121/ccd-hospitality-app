import React from 'react';
import {
  LayoutDashboard,
  Flame,
  Wallet,
  Heart,
  UtensilsCrossed,
  Sparkles,
  FileBarChart,
  TrendingUp,
  Settings,
  FileText,
  Mail,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export type NavTab =
  | 'dashboard'
  | 'relapse'
  | 'finance'
  | 'family'
  | 'recipes'
  | 'ai'
  | 'reports'
  | 'stats'
  | 'settings'
  | 'cv'
  | 'apply-email';

interface BottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const { theme } = useTheme();

  const tabs = [
    { id: 'dashboard' as NavTab, label: 'Home', icon: LayoutDashboard },
    { id: 'relapse' as NavTab, label: 'Habit', icon: Flame },
    { id: 'finance' as NavTab, label: 'Finance', icon: Wallet },
    { id: 'family' as NavTab, label: 'Family', icon: Heart },
    { id: 'recipes' as NavTab, label: 'Recipes', icon: UtensilsCrossed },
    { id: 'ai' as NavTab, label: 'AI Coach', icon: Sparkles },
    { id: 'reports' as NavTab, label: 'Reports', icon: FileBarChart },
    { id: 'stats' as NavTab, label: 'Progress', icon: TrendingUp },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings },
    { id: 'cv' as NavTab, label: 'CV Library', icon: FileText },
    { id: 'apply-email' as NavTab, label: 'Apply', icon: Mail },
  ];

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-40 backdrop-blur-lg border-t pb-safe pt-1 px-1 sm:px-4 transition-colors ${
        theme === 'dark'
          ? 'bg-[#090a0e]/95 border-[#1a1f2c]'
          : 'bg-white/95 border-slate-200 shadow-lg'
      }`}
    >
      <div className="max-w-4xl mx-auto flex items-center justify-around overflow-x-auto no-scrollbar py-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-2.5 sm:px-3 rounded-2xl transition-all duration-200 shrink-0 ${
                isActive
                  ? theme === 'dark'
                    ? 'text-[#ffd700]'
                    : 'text-amber-800'
                  : theme === 'dark'
                  ? 'text-[#848d9f] hover:text-[#e2e8f0]'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {/* Active Gold Indicator Pill */}
              {isActive && (
                <div className="absolute -top-1 w-6 h-0.5 rounded-full bg-gradient-to-r from-transparent via-[#ffd700] to-transparent shadow-[0_0_8px_#ffd700]" />
              )}

              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-[#ffd700]/20 text-[#ffd700] scale-105'
                    : theme === 'dark'
                    ? 'hover:bg-[#1a1f2c]'
                    : 'hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>

              <span
                className={`text-[9px] sm:text-[10px] tracking-wide mt-0.5 font-medium ${
                  isActive
                    ? theme === 'dark'
                      ? 'text-[#fdf8f0] font-semibold'
                      : 'text-slate-900 font-bold'
                    : theme === 'dark'
                    ? 'text-[#7e8798]'
                    : 'text-slate-500'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
