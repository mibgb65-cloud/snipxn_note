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
  cyan: '#22D3EE',
  cyanDeep: '#0891B2',
  cyanSoft: '#67E8F9',
  mint: '#22C55E',
  mintSoft: '#86EFAC',
  night: '#0B1120',
  nightSoft: '#141B2D',
  rose: '#F43F5E',
  amber: '#F59E0B',
  codeBackground: {
    light: '#0C1626',
    dark: '#07111D',
  },
};

export const appPalettes: Record<AppColorMode, AppPalette> = {
  light: {
    canvas: '#F7FBFC',
    background: '#F3FAFC',
    backgroundAlt: '#FFFFFF',
    surface: 'rgba(255, 255, 255, 0.88)',
    surfaceAlt: 'rgba(246, 251, 252, 0.94)',
    surfaceMuted: 'rgba(235, 244, 247, 0.8)',
    elevated: 'rgba(255, 255, 255, 0.98)',
    panel: 'rgba(255, 255, 255, 0.88)',
    panelStrong: 'rgba(255, 255, 255, 0.96)',
    panelSubtle: 'rgba(247, 251, 252, 0.94)',
    panelMuted: 'rgba(235, 244, 247, 0.8)',
    panelRaised: 'rgba(255, 255, 255, 0.98)',
    panelInset: 'rgba(242, 248, 250, 0.94)',
    heroStart: 'rgba(34, 211, 238, 0.1)',
    heroEnd: 'rgba(34, 197, 94, 0.06)',
    overlay: 'rgba(4, 11, 24, 0.44)',
    border: '#D8E6EA',
    borderStrong: 'rgba(11, 17, 32, 0.14)',
    text: '#0F172A',
    textMuted: '#334155',
    textSoft: '#64748B',
    placeholder: '#94A3B8',
    primary: '#0891B2',
    primaryStrong: '#0E7490',
    primarySoft: 'rgba(8, 145, 178, 0.12)',
    accent: '#22D3EE',
    accentSoft: 'rgba(34, 211, 238, 0.12)',
    support: '#22C55E',
    cta: '#0891B2',
    ctaStrong: '#0E7490',
    success: '#16A34A',
    warning: '#F59E0B',
    danger: '#EF4444',
    backdropPrimary: 'rgba(34, 211, 238, 0.12)',
    backdropSecondary: 'rgba(103, 232, 249, 0.08)',
    backdropTertiary: 'rgba(34, 197, 94, 0.06)',
    atmospherePrimary: 'rgba(34, 211, 238, 0.08)',
    atmosphereSecondary: 'rgba(34, 197, 94, 0.06)',
    focusRing: 'rgba(34, 211, 238, 0.22)',
    controlHighlight: 'rgba(255, 255, 255, 0.62)',
    shadow: 'rgba(15, 23, 42, 0.12)',
    shadowSoft: 'rgba(15, 23, 42, 0.06)',
    codeBackground: brandColors.codeBackground.light,
    codeBorder: 'rgba(34, 211, 238, 0.18)',
    codeText: '#D6F4FF',
    codeMuted: '#93A9BD',
  },
  dark: {
    canvas: '#050B14',
    background: '#0B1120',
    backgroundAlt: '#111A2B',
    surface: 'rgba(10, 17, 32, 0.84)',
    surfaceAlt: 'rgba(16, 25, 43, 0.88)',
    surfaceMuted: 'rgba(19, 31, 50, 0.76)',
    elevated: 'rgba(15, 24, 40, 0.96)',
    panel: 'rgba(10, 17, 32, 0.84)',
    panelStrong: 'rgba(16, 25, 43, 0.96)',
    panelSubtle: 'rgba(18, 28, 46, 0.9)',
    panelMuted: 'rgba(19, 31, 50, 0.76)',
    panelRaised: 'rgba(15, 24, 40, 0.96)',
    panelInset: 'rgba(7, 13, 24, 0.9)',
    heroStart: 'rgba(34, 211, 238, 0.16)',
    heroEnd: 'rgba(34, 197, 94, 0.1)',
    overlay: 'rgba(2, 6, 15, 0.62)',
    border: 'rgba(128, 146, 168, 0.18)',
    borderStrong: 'rgba(163, 184, 204, 0.26)',
    text: '#E2E8F0',
    textMuted: '#B6C5D4',
    textSoft: '#8DA0B3',
    placeholder: '#73879A',
    primary: '#22D3EE',
    primaryStrong: '#0891B2',
    primarySoft: 'rgba(34, 211, 238, 0.16)',
    accent: '#67E8F9',
    accentSoft: 'rgba(103, 232, 249, 0.16)',
    support: '#74EEA5',
    cta: '#22D3EE',
    ctaStrong: '#0891B2',
    success: '#4ADE80',
    warning: '#FBBF24',
    danger: '#FB7185',
    backdropPrimary: 'rgba(34, 211, 238, 0.14)',
    backdropSecondary: 'rgba(103, 232, 249, 0.1)',
    backdropTertiary: 'rgba(34, 197, 94, 0.08)',
    atmospherePrimary: 'rgba(34, 211, 238, 0.08)',
    atmosphereSecondary: 'rgba(34, 197, 94, 0.06)',
    focusRing: 'rgba(103, 232, 249, 0.24)',
    controlHighlight: 'rgba(255, 255, 255, 0.08)',
    shadow: 'rgba(2, 8, 23, 0.92)',
    shadowSoft: 'rgba(2, 8, 23, 0.8)',
    codeBackground: brandColors.codeBackground.dark,
    codeBorder: 'rgba(34, 211, 238, 0.2)',
    codeText: '#D6F4FF',
    codeMuted: '#93A9BD',
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
