/**
 * ChurchOS — src/context/ThemeContext.tsx
 *
 * Provides light / dark mode to the entire app.
 * Sets data-theme="dark" | "light" on <html> element.
 *
 * Usage anywhere in the app:
 *   const { theme, toggleTheme, isDark } = useTheme();
 */

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggleTheme: () => {},
  isDark: true,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // 1. Respect previously saved preference
    const saved = localStorage.getItem('churchos-theme') as Theme | null;
    if (saved === 'light' || saved === 'dark') return saved;
    // 2. Fall back to OS preference
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });

  useEffect(() => {
    localStorage.setItem('churchos-theme', theme);

    const syncAdminTheme = () => {
      const isAdminRoute = window.location.pathname.startsWith('/admin');

      if (!isAdminRoute) {
        document.documentElement.removeAttribute('data-theme');
        return;
      }

      document.documentElement.setAttribute('data-theme', theme);
    };

    syncAdminTheme();

    const handleLocationChange = () => syncAdminTheme();
    window.addEventListener('popstate', handleLocationChange);
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      const result = originalPushState.apply(this, args);
      window.dispatchEvent(new Event('app-location-change'));
      return result;
    };

    window.history.replaceState = function (...args) {
      const result = originalReplaceState.apply(this, args);
      window.dispatchEvent(new Event('app-location-change'));
      return result;
    };

    window.addEventListener('app-location-change', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('app-location-change', handleLocationChange);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}