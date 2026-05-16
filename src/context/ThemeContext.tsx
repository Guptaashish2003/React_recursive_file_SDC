import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// ── Types ────────────────────────────────────────────
export type Theme = 'light' | 'dark';

export interface ThemeContextType {
  theme: Theme;
  toggle: () => void;
}

// ✅ Properly typed context with default undefined
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ── Provider ─────────────────────────────────────────
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Safe SSR check
    if (typeof window === 'undefined') return 'light';
    
    const stored = localStorage.getItem('sb-theme') as Theme | null;
    if (stored === 'light' || stored === 'dark') return stored;
    
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('sb-theme', theme);
    }
  }, [theme]);

  const toggle = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}