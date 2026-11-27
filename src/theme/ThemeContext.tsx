/**
 * Theme Context and Night Observation Mode Provider (F12)
 *
 * Provides application-wide semantic theme state:
 * - Default Editorial theme ('editorial'): classic ivory/forest palette.
 * - Night Observation Mode ('night'): opt-in dark red/charcoal palette for dark sky preservation.
 * - Persists preference per-account in SQLite.
 * - Resets to default on sign out.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAppSelector } from '../store';
import {
  editorialColors,
  getThemeColors,
  ThemeColors,
  ThemeMode,
} from './tokens';
import {
  getReaderPreferences,
  setThemePreference,
} from '../database/repositories/preferencesRepository';

interface ThemeContextValue {
  theme: ThemeMode;
  isNight: boolean;
  colors: ThemeColors;
  toggleTheme: () => Promise<void>;
  setTheme: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'editorial',
  isNight: false,
  colors: editorialColors,
  toggleTheme: async () => {},
  setTheme: async () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const accountId = useAppSelector(state =>
    typeof state?.auth?.user?.id === 'number' && state.auth.user.id > 0
      ? state.auth.user.id
      : undefined
  );
  const [theme, setThemeState] = useState<ThemeMode>('editorial');

  // Load persisted theme when account changes
  useEffect(() => {
    let active = true;
    if (!accountId) {
      void Promise.resolve().then(() => {
        if (active) {
          setThemeState('editorial');
        }
      });
      return () => {
        active = false;
      };
    }
    void getReaderPreferences(accountId).then(prefs => {
      if (active) {
        setThemeState(prefs.theme);
      }
    });
    return () => {
      active = false;
    };
  }, [accountId]);

  const setTheme = useCallback(
    async (mode: ThemeMode) => {
      setThemeState(mode);
      if (accountId) {
        await setThemePreference(accountId, mode);
      }
    },
    [accountId]
  );

  const toggleTheme = useCallback(async () => {
    const nextMode: ThemeMode = theme === 'night' ? 'editorial' : 'night';
    await setTheme(nextMode);
  }, [theme, setTheme]);

  const themeColors = getThemeColors(theme);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isNight: theme === 'night',
        colors: themeColors,
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
