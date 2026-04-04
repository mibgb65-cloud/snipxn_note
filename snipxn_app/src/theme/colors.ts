import type { Theme as NavigationTheme } from '@react-navigation/native';

export type AppColorMode = 'light' | 'dark';

export interface AppPalette {
  canvas: string;
  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceAlt: string;
  surfaceMuted: string;
  elevated: string;
  panel: string;
  panelStrong: string;
  panelSubtle: string;
  panelMuted: string;
  panelRaised: string;
  panelInset: string;
  heroStart: string;
  heroEnd: string;
  overlay: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textSoft: string;
  placeholder: string;
  primary: string;
  primaryStrong: string;
  primarySoft: string;
  accent: string;
  accentSoft: string;
  support: string;
  cta: string;
  ctaStrong: string;
  success: string;
  warning: string;
  danger: string;
  backdropPrimary: string;
  backdropSecondary: string;
  backdropTertiary: string;
  atmospherePrimary: string;
  atmosphereSecondary: string;
  focusRing: string;
  controlHighlight: string;
  shadow: string;
  shadowSoft: string;
  codeBackground: string;
  codeBorder: string;
  codeText: string;
  codeMuted: string;
}

export const brandColors = {
  star: '#F59E0B',
  emerald: '#22C55E',
  emeraldDeep: '#16A34A',
  slate: '#0F172A',
  sky: '#60A5FA',
  rose: '#F43F5E',
  amber: '#F59E0B',
  codeBackground: {
    light: '#0F172A',
    dark: '#050B14',
  },
};

export const appPalettes: Record<AppColorMode, AppPalette> = {
  light: {
    canvas: '#F3FBF8',
    background: '#EBF7F3',
    backgroundAlt: '#F8FCFB',
    surface: 'rgba(255, 255, 255, 0.84)',
    surfaceAlt: 'rgba(239, 247, 244, 0.88)',
    surfaceMuted: 'rgba(227, 241, 236, 0.7)',
    elevated: 'rgba(255, 255, 255, 0.98)',
    panel: 'rgba(255, 255, 255, 0.84)',
    panelStrong: 'rgba(255, 255, 255, 0.96)',
    panelSubtle: 'rgba(244, 250, 248, 0.92)',
    panelMuted: 'rgba(227, 241, 236, 0.7)',
    panelRaised: 'rgba(255, 255, 255, 0.98)',
    panelInset: 'rgba(239, 247, 244, 0.88)',
    heroStart: 'rgba(20, 184, 166, 0.14)',
    heroEnd: 'rgba(96, 165, 250, 0.08)',
    overlay: 'rgba(3, 7, 18, 0.42)',
    border: '#D8E3F0',
    borderStrong: 'rgba(15, 23, 42, 0.14)',
    text: '#24343A',
    textMuted: '#425861',
    textSoft: '#5F7680',
    placeholder: '#78909B',
    primary: '#0D9488',
    primaryStrong: '#0F766E',
    primarySoft: 'rgba(13, 148, 136, 0.12)',
    accent: '#60A5FA',
    accentSoft: 'rgba(96, 165, 250, 0.12)',
    support: '#60A5FA',
    cta: '#F97316',
    ctaStrong: '#EA580C',
    success: '#22C55E',
    warning: '#F59E0B',
    danger: '#EF4444',
    backdropPrimary: 'rgba(20, 184, 166, 0.14)',
    backdropSecondary: 'rgba(96, 165, 250, 0.08)',
    backdropTertiary: 'rgba(249, 115, 22, 0.08)',
    atmospherePrimary: 'rgba(20, 184, 166, 0.12)',
    atmosphereSecondary: 'rgba(96, 165, 250, 0.08)',
    focusRing: 'rgba(20, 184, 166, 0.24)',
    controlHighlight: 'rgba(255, 255, 255, 0.58)',
    shadow: 'rgba(19, 78, 74, 0.24)',
    shadowSoft: 'rgba(19, 78, 74, 0.16)',
    codeBackground: brandColors.codeBackground.light,
    codeBorder: 'rgba(15, 23, 42, 0.18)',
    codeText: '#DBEAFE',
    codeMuted: '#94A3B8',
  },
  dark: {
    canvas: '#050C14',
    background: '#0B1421',
    backgroundAlt: '#122131',
    surface: 'rgba(9, 18, 29, 0.8)',
    surfaceAlt: 'rgba(8, 15, 24, 0.82)',
    surfaceMuted: 'rgba(15, 27, 40, 0.72)',
    elevated: 'rgba(21, 36, 52, 0.94)',
    panel: 'rgba(9, 18, 29, 0.8)',
    panelStrong: 'rgba(12, 24, 37, 0.94)',
    panelSubtle: 'rgba(17, 30, 45, 0.84)',
    panelMuted: 'rgba(15, 27, 40, 0.72)',
    panelRaised: 'rgba(21, 36, 52, 0.94)',
    panelInset: 'rgba(8, 15, 24, 0.82)',
    heroStart: 'rgba(20, 184, 166, 0.16)',
    heroEnd: 'rgba(96, 165, 250, 0.14)',
    overlay: 'rgba(3, 7, 18, 0.58)',
    border: 'rgba(148, 163, 184, 0.14)',
    borderStrong: 'rgba(148, 163, 184, 0.24)',
    text: '#D0DFE9',
    textMuted: '#B7CAD6',
    textSoft: '#90A5B3',
    placeholder: '#7B919E',
    primary: '#2DD4BF',
    primaryStrong: '#14B8A6',
    primarySoft: 'rgba(45, 212, 191, 0.14)',
    accent: '#60A5FA',
    accentSoft: 'rgba(96, 165, 250, 0.16)',
    support: '#93C5FD',
    cta: '#F97316',
    ctaStrong: '#EA580C',
    success: '#4ADE80',
    warning: '#FBBF24',
    danger: '#FB7185',
    backdropPrimary: 'rgba(20, 184, 166, 0.16)',
    backdropSecondary: 'rgba(96, 165, 250, 0.14)',
    backdropTertiary: 'rgba(249, 115, 22, 0.08)',
    atmospherePrimary: 'rgba(20, 184, 166, 0.1)',
    atmosphereSecondary: 'rgba(96, 165, 250, 0.1)',
    focusRing: 'rgba(45, 212, 191, 0.28)',
    controlHighlight: 'rgba(255, 255, 255, 0.08)',
    shadow: 'rgba(2, 8, 23, 0.92)',
    shadowSoft: 'rgba(2, 8, 23, 0.82)',
    codeBackground: brandColors.codeBackground.dark,
    codeBorder: 'rgba(56, 189, 248, 0.18)',
    codeText: '#DBEAFE',
    codeMuted: '#94A3B8',
  },
};

export function withAlpha(hexColor: string, alpha: number): string {
  const normalized = hexColor.replace('#', '');

  if (![3, 6].includes(normalized.length)) {
    return hexColor;
  }

  const fullHex =
    normalized.length === 3
      ? normalized
          .split('')
          .map(value => value + value)
          .join('')
      : normalized;

  const red = Number.parseInt(fullHex.slice(0, 2), 16);
  const green = Number.parseInt(fullHex.slice(2, 4), 16);
  const blue = Number.parseInt(fullHex.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${Math.max(0, Math.min(alpha, 1))})`;
}

export function createNavigationTheme(mode: AppColorMode): NavigationTheme {
  const palette = appPalettes[mode];

  return {
    dark: mode === 'dark',
    colors: {
      primary: palette.primary,
      background: palette.canvas,
      card: palette.surface,
      text: palette.text,
      border: palette.border,
      notification: palette.accent,
    },
    fonts: {
      regular: {
        fontFamily: 'System',
        fontWeight: '400',
      },
      medium: {
        fontFamily: 'System',
        fontWeight: '500',
      },
      bold: {
        fontFamily: 'System',
        fontWeight: '700',
      },
      heavy: {
        fontFamily: 'System',
        fontWeight: '800',
      },
    },
  };
}
