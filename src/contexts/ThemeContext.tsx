'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  accentHue: number;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setAccentHue: (hue: number) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [accentHue, setAccentHueState] = useState<number>(210); // Blue default
  const [mounted, setMounted] = useState(false);

  // Load theme and accent from localStorage on mount
  useEffect(() => {
    setMounted(true);

    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const savedAccentHue = localStorage.getItem('accentHue');

    if (savedTheme) {
      setThemeState(savedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setThemeState(prefersDark ? 'dark' : 'light');
    }

    if (savedAccentHue) {
      setAccentHueState(parseInt(savedAccentHue, 10));
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (!mounted) return;

    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme, mounted]);

  // Apply accent hue to document
  useEffect(() => {
    if (!mounted) return;

    document.documentElement.style.setProperty('--accent-h', accentHue.toString());
    localStorage.setItem('accentHue', accentHue.toString());
  }, [accentHue, mounted]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const setAccentHue = (hue: number) => {
    // Clamp hue between 0-360
    const clampedHue = Math.max(0, Math.min(360, hue));
    setAccentHueState(clampedHue);
  };

  const value = {
    theme,
    accentHue,
    toggleTheme,
    setTheme,
    setAccentHue,
  };

  // Prevent flash of unstyled content
  if (!mounted) {
    return null;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
