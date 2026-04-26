import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { View, useColorScheme, useWindowDimensions } from 'react-native';
import { Uniwind } from 'uniwind';

import {
  appPalettes,
  brandColors,
  createNavigationTheme,
  type AppPalette,
  withAlpha,
} from './colors';
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

function createUniwindThemeVariables(themeMode: ThemeMode) {
  const palette = appPalettes[themeMode];
  const accentForeground = themeMode === 'dark' ? '#081018' : brandColors.night;
  const surfaceShadow =
    themeMode === 'dark'
      ? '0 18px 42px 0 rgba(2, 8, 23, 0.42)'
      : '0 18px 40px 0 rgba(15, 23, 42, 0.08), 0 4px 12px 0 rgba(15, 23, 42, 0.04)';
  const overlayShadow =
    themeMode === 'dark'
      ? '0 20px 46px 0 rgba(2, 8, 23, 0.56), 0 0 0 1px rgba(34, 211, 238, 0.05) inset'
      : '0 20px 46px 0 rgba(15, 23, 42, 0.1), 0 0 0 1px rgba(34, 211, 238, 0.06) inset';
  const fieldShadow =
    themeMode === 'dark'
      ? '0 0 0 1px rgba(34, 211, 238, 0.03) inset'
      : '0 10px 24px 0 rgba(15, 23, 42, 0.05), 0 2px 6px 0 rgba(15, 23, 42, 0.03)';

  return {
    '--background': palette.background,
    '--foreground': palette.text,
    '--surface': palette.surface,
    '--surface-secondary': palette.surfaceAlt,
    '--surface-tertiary': palette.surfaceMuted,
    '--overlay': palette.panelStrong,
    '--overlay-foreground': palette.text,
    '--muted': palette.textSoft,
    '--default': palette.surfaceAlt,
    '--default-foreground': palette.text,
    '--accent': palette.cta,
    '--accent-foreground': accentForeground,
    '--field-background': themeMode === 'dark' ? palette.panelStrong : palette.elevated,
    '--field-foreground': palette.text,
    '--field-placeholder': palette.placeholder,
    '--field-border': withAlpha(palette.primary, themeMode === 'dark' ? 0.14 : 0.12),
    '--success': palette.success,
    '--success-foreground': accentForeground,
    '--warning': palette.warning,
    '--warning-foreground': accentForeground,
    '--danger': palette.danger,
    '--danger-foreground': '#FFF5F7',
    '--segment': themeMode === 'dark' ? palette.panelInset : palette.panelSubtle,
    '--segment-foreground': palette.text,
    '--border': palette.border,
    '--separator': withAlpha(palette.textSoft, themeMode === 'dark' ? 0.3 : 0.18),
    '--focus': palette.accent,
    '--link': palette.accent,
    '--surface-shadow': surfaceShadow,
    '--overlay-shadow': overlayShadow,
    '--field-shadow': fieldShadow,
    '--color-primary': palette.primary,
    '--color-primary-foreground': accentForeground,
    '--color-primary-soft': palette.primarySoft,
    '--color-star': brandColors.star,
    '--color-code-background': brandColors.codeBackground[themeMode],
    '--color-app-canvas': palette.canvas,
    '--color-app-surface': palette.surface,
    '--color-app-surface-alt': palette.surfaceAlt,
    '--color-app-border': palette.border,
    '--color-app-primary-soft': palette.primarySoft,
  };
}

async function persistThemePreference(preference: ThemePreference): Promise<void> {
  await AsyncStorage.setItem(THEME_STORAGE_KEY, preference);
}

export function ThemeProvider({ children }: React.PropsWithChildren) {
  const systemColorScheme = useColorScheme();
  const { width, height } = useWindowDimensions();
  const [themePreferenceState, setThemePreferenceState] = useState<ThemePreference | null>(null);

  const systemTheme: ThemeMode = systemColorScheme === 'dark' ? 'dark' : 'light';
  const resolvedThemePreference = themePreferenceState ?? 'system';
  const theme: ThemeMode =
    resolvedThemePreference === 'system' ? systemTheme : resolvedThemePreference;
  const isLandscape = width > height;
  // Keep portrait tablets on the same compact visual system as phones.
  const isTablet = Math.min(width, height) >= TABLET_BREAKPOINT && isLandscape;
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
        } else if (isMounted) {
          setThemePreferenceState('system');
        }
      } catch {
        if (isMounted) {
          setThemePreferenceState('system');
        }
      }
    };

    void loadThemePreference();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    Uniwind.updateCSSVariables('light', createUniwindThemeVariables('light'));
    Uniwind.updateCSSVariables('dark', createUniwindThemeVariables('dark'));
  }, []);

  useEffect(() => {
    if (themePreferenceState === null) {
      return;
    }

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

  if (themePreferenceState === null) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: appPalettes[systemTheme].canvas,
        }}
      />
    );
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themePreference: resolvedThemePreference,
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
