import { computed, ref } from 'vue';

const THEME_KEY = 'themeMode';
const DEFAULT_THEME = 'dark';
const themeMode = ref(DEFAULT_THEME);

function resolveInitialTheme() {
  if (typeof window === 'undefined') {
    return DEFAULT_THEME;
  }

  const stored = window.localStorage.getItem(THEME_KEY);

  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(mode) {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.classList.toggle('app-dark', mode === 'dark');
  document.documentElement.setAttribute('data-theme', mode);
  document.documentElement.style.colorScheme = mode;
}

export function initializeTheme() {
  themeMode.value = resolveInitialTheme();
  applyTheme(themeMode.value);

  return themeMode.value;
}

export function setTheme(mode) {
  if (mode !== 'light' && mode !== 'dark') {
    return;
  }

  themeMode.value = mode;

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(THEME_KEY, mode);
  }

  applyTheme(mode);
}

export function toggleTheme() {
  setTheme(themeMode.value === 'dark' ? 'light' : 'dark');
}

export function useTheme() {
  return {
    themeMode,
    isDarkTheme: computed(() => themeMode.value === 'dark'),
    setTheme,
    toggleTheme,
  };
}
