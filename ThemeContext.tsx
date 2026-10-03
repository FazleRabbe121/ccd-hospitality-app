import React, { createContext, useContext, useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export type ThemeMode = 'dark' | 'light';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const stored = localStorage.getItem('fazle_app_theme_mode');
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
    } catch (e) {
      console.warn('Could not read theme from localStorage:', e);
    }
    return 'dark';
  });

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('fazle_app_theme_mode', newTheme);
    } catch (e) {
      console.warn('Could not write theme to localStorage:', e);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

/**
 * Clearly visible TWO-button Theme Selector Component
 * ☀ LIGHT MODE & 🌙 DARK MODE
 */
export const ThemeToggle: React.FC<{ className?: string; compact?: boolean }> = ({
  className = '',
  compact = false,
}) => {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className={`inline-flex items-center p-1 rounded-xl transition-colors ${
        theme === 'dark'
          ? 'bg-[#141824] border border-[#273046]'
          : 'bg-slate-200 border border-slate-300'
      } ${className}`}
      role="group"
      aria-label="Theme mode switcher"
    >
      {/* Light Mode Button */}
      <button
        type="button"
        onClick={() => setTheme('light')}
        aria-pressed={theme === 'light'}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
          theme === 'light'
            ? 'bg-amber-400 text-slate-950 shadow-md font-bold'
            : theme === 'dark'
            ? 'text-gray-400 hover:text-amber-300 hover:bg-white/5'
            : 'text-slate-600 hover:text-slate-900'
        }`}
        title="Switch to Light Mode"
      >
        <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
        {!compact && <span>☀ LIGHT MODE</span>}
        {compact && <span className="sr-only sm:not-sr-only text-[10px]">LIGHT</span>}
      </button>

      {/* Dark Mode Button */}
      <button
        type="button"
        onClick={() => setTheme('dark')}
        aria-pressed={theme === 'dark'}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
          theme === 'dark'
            ? 'bg-[#22293d] text-[#ffd700] border border-[#d4af37]/50 shadow-md font-bold'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/60'
        }`}
        title="Switch to Dark Mode"
      >
        <Moon className="w-3.5 h-3.5 text-[#ffd700] fill-[#ffd700]/30" />
        {!compact && <span>🌙 DARK MODE</span>}
        {compact && <span className="sr-only sm:not-sr-only text-[10px]">DARK</span>}
      </button>
    </div>
  );
};
