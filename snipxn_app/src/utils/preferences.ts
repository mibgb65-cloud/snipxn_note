import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppLanguage = 'zh-CN' | 'en-US';

export const DEFAULT_APP_LANGUAGE: AppLanguage = 'zh-CN';
export const CODE_FONT_SIZE_OPTIONS = [13, 15, 17] as const;
export const DEFAULT_CODE_FONT_SIZE = CODE_FONT_SIZE_OPTIONS[1];

const LANGUAGE_STORAGE_KEY = '@snipxn/settings/language';
const CODE_FONT_SIZE_STORAGE_KEY = '@snipxn/settings/code-font-size';

function isAppLanguage(value: string | null): value is AppLanguage {
  return value === 'zh-CN' || value === 'en-US';
}

function normalizeCodeFontSize(value: number): number {
  const minimum = CODE_FONT_SIZE_OPTIONS[0];
  const maximum = CODE_FONT_SIZE_OPTIONS[CODE_FONT_SIZE_OPTIONS.length - 1];

  if (!Number.isFinite(value)) {
    return DEFAULT_CODE_FONT_SIZE;
  }

  return Math.min(Math.max(Math.round(value), minimum), maximum);
}

export async function getStoredAppLanguage(): Promise<AppLanguage> {
  try {
    const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);

    if (isAppLanguage(storedLanguage)) {
      return storedLanguage;
    }
  } catch {
    // Ignore storage failures and fall back to the default language.
  }

  return DEFAULT_APP_LANGUAGE;
}

export async function setStoredAppLanguage(language: AppLanguage): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
}

export async function getStoredCodeFontSize(): Promise<number> {
  try {
    const storedValue = await AsyncStorage.getItem(CODE_FONT_SIZE_STORAGE_KEY);

    if (storedValue !== null) {
      return normalizeCodeFontSize(Number(storedValue));
    }
  } catch {
    // Ignore storage failures and fall back to the default font size.
  }

  return DEFAULT_CODE_FONT_SIZE;
}

export async function setStoredCodeFontSize(fontSize: number): Promise<void> {
  await AsyncStorage.setItem(
    CODE_FONT_SIZE_STORAGE_KEY,
    String(normalizeCodeFontSize(fontSize)),
  );
}
