import React from 'react';
import { Text, Pressable } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, useTheme } from '../src/theme/ThemeContext';
import { editorialColors, nightColors } from '../src/theme/tokens';
import * as prefsRepo from '../src/database/repositories/preferencesRepository';

jest.mock('../src/database/repositories/preferencesRepository');

function createMockStore(user: { id: number; username: string } | null = { id: 42, username: 'astronomer' }) {
  return configureStore({
    reducer: {
      auth: () => ({ user, isAuthenticated: Boolean(user), isInitialSessionLoading: false }),
    },
  });
}

function TestConsumer() {
  const { theme, isNight, colors, toggleTheme, setTheme } = useTheme();
  return (
    <>
      <Text testID="theme-mode">{theme}</Text>
      <Text testID="is-night">{isNight ? 'true' : 'false'}</Text>
      <Text testID="bg-color">{colors.background}</Text>
      <Text testID="text-color">{colors.textPrimary}</Text>
      <Pressable testID="toggle-btn" onPress={() => void toggleTheme()} />
      <Pressable testID="set-night-btn" onPress={() => void setTheme('night')} />
      <Pressable testID="set-editorial-btn" onPress={() => void setTheme('editorial')} />
    </>
  );
}

describe('ThemeContext & Night Observation Mode (F12)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prefsRepo.getReaderPreferences as jest.Mock).mockResolvedValue({
      accountId: 42,
      theme: 'editorial',
      speechRate: 1.0,
      voiceId: null,
      updatedAt: '2026-11-27T00:00:00Z',
    });
    (prefsRepo.setThemePreference as jest.Mock).mockResolvedValue(undefined);
  });

  it('renders default editorial theme on initial load', async () => {
    const store = createMockStore();
    const { getByTestId } = await render(
      <Provider store={store}>
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      </Provider>
    );

    expect(getByTestId('theme-mode').props.children).toBe('editorial');
    expect(getByTestId('is-night').props.children).toBe('false');
    expect(getByTestId('bg-color').props.children).toBe(editorialColors.background);
  });

  it('loads persisted night theme preference when available', async () => {
    (prefsRepo.getReaderPreferences as jest.Mock).mockResolvedValueOnce({
      accountId: 42,
      theme: 'night',
      speechRate: 1.0,
      voiceId: null,
      updatedAt: '2026-11-27T00:00:00Z',
    });

    const store = createMockStore();
    const { getByTestId } = await render(
      <Provider store={store}>
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      </Provider>
    );

    await waitFor(() => {
      expect(getByTestId('theme-mode').props.children).toBe('night');
      expect(getByTestId('is-night').props.children).toBe('true');
      expect(getByTestId('bg-color').props.children).toBe(nightColors.background);
    });
  });

  it('toggles theme between editorial and night and persists to SQLite', async () => {
    const store = createMockStore();
    const { getByTestId } = await render(
      <Provider store={store}>
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      </Provider>
    );

    fireEvent.press(getByTestId('toggle-btn'));

    await waitFor(() => {
      expect(getByTestId('theme-mode').props.children).toBe('night');
      expect(getByTestId('is-night').props.children).toBe('true');
      expect(prefsRepo.setThemePreference).toHaveBeenCalledWith(42, 'night');
    });

    fireEvent.press(getByTestId('toggle-btn'));

    await waitFor(() => {
      expect(getByTestId('theme-mode').props.children).toBe('editorial');
      expect(getByTestId('is-night').props.children).toBe('false');
      expect(prefsRepo.setThemePreference).toHaveBeenCalledWith(42, 'editorial');
    });
  });

  it('resets to editorial theme when user logs out', async () => {
    const loggedOutStore = createMockStore(null);
    const { getByTestId } = await render(
      <Provider store={loggedOutStore}>
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      </Provider>
    );

    expect(getByTestId('theme-mode').props.children).toBe('editorial');
    expect(getByTestId('is-night').props.children).toBe('false');
  });

  it('verifies contrast-tested night theme tokens against WCAG thresholds', () => {
    function hexToLuminance(hex: string): number {
      const rgb = [0, 2, 4].map(idx => parseInt(hex.slice(idx + 1, idx + 3), 16) / 255).map(c => {
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
    }

    function contrastRatio(hex1: string, hex2: string): number {
      const l1 = hexToLuminance(hex1);
      const l2 = hexToLuminance(hex2);
      const lighter = Math.max(l1, l2);
      const darker = Math.min(l1, l2);
      return (lighter + 0.05) / (darker + 0.05);
    }

    // High contrast ink on dark background: WCAG AAA requires >= 7.0:1
    const bodyContrast = contrastRatio(nightColors.ink, nightColors.background);
    expect(bodyContrast).toBeGreaterThan(10.0);

    // Primary red accent on dark background: WCAG AA for UI / large text >= 4.5:1
    const headingContrast = contrastRatio(nightColors.forest, nightColors.background);
    expect(headingContrast).toBeGreaterThan(4.5);

    // Amber brass accent on dark background
    const brassContrast = contrastRatio(nightColors.brass, nightColors.background);
    expect(brassContrast).toBeGreaterThan(7.0);
  });
});
