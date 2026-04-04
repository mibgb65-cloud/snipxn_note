import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme, useWindowDimensions } from 'react-native';
import { Uniwind } from 'uniwind';

import { appPalettes, brandColors, createNavigationTheme, type AppPalette } from './colors';
import { createTypography } from './typography';

export type ThemeMode = 'light' | 'dark';
export type ThemePreference = ThemeMode | 'system';

type ThemeContextValue = {
  theme: ThemeMode;
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
  toggleTheme: () => void;
  isTablet: boolean;
  typography: ReturnType<typeof createTypography>;
  palette: AppPalette;
  navigationTheme: ReturnType<typeof createNavigationTheme>;
};

const THEME_STORAGE_KEY = '@snipxn/theme';
const TABLET_BREAKPOINT = 600;

const ThemeContext = createContext<ThemeContextValue | null>(null);

const isThemePreference = (value: string | null): value is ThemePreference =>
  value === 'light' || value === 'dark' || value === 'system';

async function persistThemePreference(preference: ThemePreference): Promise<void> {
  await AsyncStorage.setItem(THEME_STORAGE_KEY, preference);
}

export function ThemeProvider({ children }: React.PropsWithChildren) {
  const systemColorScheme = useColorScheme();
  const { width, height } = useWindowDimensions();
  const [themePreferenceState, setThemePreferenceState] = useState<ThemePreference>('system');

  const systemTheme: ThemeMode = systemColorScheme === 'dark' ? 'dark' : 'light';
  const theme: ThemeMode =
    themePreferenceState === 'system' ? systemTheme : themePreferenceState;
  const isTablet = Math.min(width, height) >= TABLET_BREAKPOINT;
  const typography = createTypography(isTablet);
  const palette = appPalettes[theme];
  const navigationTheme = createNavigationTheme(theme);

  useEffect(() => {
    let isMounted = true;

    const loadThemePreference = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);

        if (isMounted && isThemePreference(storedTheme)) {
          setThemePreferenceState(storedTheme);
        }
      } catch {
        // Ignore storage failures and fall back to system theme.
      }
    };

    void loadThemePreference();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    Uniwind.updateCSSVariables('light', {
      '--color-star': brandColors.star,
      '--color-code-background': brandColors.codeBackground.light,
      '--color-app-canvas': appPalettes.light.canvas,
      '--color-app-surface': appPalettes.light.surface,
      '--color-app-surface-alt': appPalettes.light.surfaceAlt,
      '--color-app-border': appPalettes.light.border,
      '--color-app-primary-soft': appPalettes.light.primarySoft,
    });
    Uniwind.updateCSSVariables('dark', {
      '--color-star': brandColors.star,
      '--color-code-background': brandColors.codeBackground.dark,
      '--color-app-canvas': appPalettes.dark.canvas,
      '--color-app-surface': appPalettes.dark.surface,
      '--color-app-surface-alt': appPalettes.dark.surfaceAlt,
      '--color-app-border': appPalettes.dark.border,
      '--color-app-primary-soft': appPalettes.dark.primarySoft,
    });
  }, []);

  useEffect(() => {
    Uniwind.setTheme(themePreferenceState === 'system' ? 'system' : theme);
  }, [theme, themePreferenceState]);

  const setThemePreference = (preference: ThemePreference) => {
    setThemePreferenceState(preference);
    void persistThemePreference(preference).catch(() => {
      // Ignore storage failures and keep the in-memory theme preference.
    });
  };

  const toggleTheme = () => {
    const nextTheme: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    setThemePreference(nextTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themePreference: themePreferenceState,
        setThemePreference,
        toggleTheme,
        isTablet,
        typography,
        palette,
        navigationTheme,
      }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);

  if (context === null) {
    throw new Error('useAppTheme must be used within ThemeProvider');
  }

  return context;
}
