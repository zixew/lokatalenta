import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark';

const THEME_KEY = 'ruanglatih_theme_v1';

function applyThemeClass(theme: ThemeMode) {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }
}

interface ThemeState {
  theme: ThemeMode;
  initTheme: () => void;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',

  initTheme: () => {
    const saved = localStorage.getItem(THEME_KEY) as ThemeMode | null;
    const initial: ThemeMode = saved === 'dark' ? 'dark' : 'light';
    applyThemeClass(initial);
    set({ theme: initial });
  },

  toggleTheme: () => {
    const next: ThemeMode = get().theme === 'light' ? 'dark' : 'light';
    localStorage.setItem(THEME_KEY, next);
    applyThemeClass(next);
    set({ theme: next });
  },

  setTheme: (theme) => {
    localStorage.setItem(THEME_KEY, theme);
    applyThemeClass(theme);
    set({ theme });
  },
}));
