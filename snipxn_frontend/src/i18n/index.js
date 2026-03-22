import { createI18n } from 'vue-i18n';
import zh from '../locales/zh.json';
import en from '../locales/en.json';

// define structured locales for the dropdown UI
export const SUPPORTED_LOCALES = [
  { code: 'zh', label: '简体中文', short: '中' },
  { code: 'en', label: 'English', short: 'EN' }
];

const LOCALE_KEY = 'locale';
const supportedLocaleCodes = SUPPORTED_LOCALES.map(l => l.code);
const browserLocale = typeof navigator !== 'undefined' ? navigator.language.split('-')[0] : 'zh';
const savedLocale = typeof localStorage !== 'undefined' ? localStorage.getItem(LOCALE_KEY) : null;
const locale = supportedLocaleCodes.includes(savedLocale) ? savedLocale : (supportedLocaleCodes.includes(browserLocale) ? browserLocale : 'zh');

const i18n = createI18n({
  legacy: false,
  locale,
  fallbackLocale: 'en',
  messages: {
    zh,
    en
  }
});

export function setAppLocale(nextLocale) {
  if (!supportedLocaleCodes.includes(nextLocale)) {
    return;
  }

  localStorage.setItem(LOCALE_KEY, nextLocale);
  i18n.global.locale.value = nextLocale;
}

export default i18n;
