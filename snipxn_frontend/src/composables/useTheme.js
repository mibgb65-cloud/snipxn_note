import { computed, ref } from 'vue';
import { SCHEMES, getSchemeById, isDefaultScheme, getDefaultSchemeForMode } from '../theme/schemes';

const SCHEME_KEY = 'themeScheme';
const LEGACY_THEME_KEY = 'themeMode';
const DARK_MODE_QUERY = '(prefers-color-scheme: dark)';
const FALLBACK_SCHEME_ID = getDefaultSchemeForMode('dark');

const schemeId = ref(FALLBACK_SCHEME_ID);
const appliedBaseMode = ref('dark');

let lastAppliedScheme = null;
let systemThemeMediaQuery = null;
let systemThemeListenerAttached = false;

function getSystemThemeMediaQuery() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return null;
  }

  if (!systemThemeMediaQuery) {
    systemThemeMediaQuery = window.matchMedia(DARK_MODE_QUERY);
  }

  return systemThemeMediaQuery;
}

function getSystemThemeMode() {
  return getSystemThemeMediaQuery()?.matches ? 'dark' : 'light';
}

function isValidSchemeId(id) {
  return id === 'auto' || Boolean(getSchemeById(id));
}

function readLegacyThemeMode() {
  if (typeof window === 'undefined') {
    return null;
  }

  const legacyMode = window.localStorage.getItem(LEGACY_THEME_KEY);
  return legacyMode === 'light' || legacyMode === 'dark' ? legacyMode : null;
}

function migrateLegacyThemeMode() {
  if (typeof window === 'undefined') {
    return;
  }

  const legacyMode = readLegacyThemeMode();

  if (!legacyMode) {
    return;
  }

  const storedScheme = window.localStorage.getItem(SCHEME_KEY);

  if (!isValidSchemeId(storedScheme)) {
    window.localStorage.setItem(SCHEME_KEY, getDefaultSchemeForMode(legacyMode));
  }

  window.localStorage.removeItem(LEGACY_THEME_KEY);
}

function resolveInitialScheme() {
  if (typeof window === 'undefined') {
    return FALLBACK_SCHEME_ID;
  }

  const storedScheme = window.localStorage.getItem(SCHEME_KEY);

  if (storedScheme === 'auto') {
    return 'auto';
  }

  if (getSchemeById(storedScheme)) {
    return storedScheme;
  }

  const legacyMode = readLegacyThemeMode();

  if (legacyMode) {
    return getDefaultSchemeForMode(legacyMode);
  }

  return getDefaultSchemeForMode(getSystemThemeMode());
}

function resolveAppliedSchemeId(id) {
  if (id === 'auto') {
    return getDefaultSchemeForMode(getSystemThemeMode());
  }

  return getSchemeById(id) ? id : FALLBACK_SCHEME_ID;
}

function clearSchemeVariables(root, scheme) {
  if (!scheme) {
    return;
  }

  const keys = [...Object.keys(scheme.appVars || {}), ...Object.keys(scheme.primeVars || {})];

  for (const key of keys) {
    root.style.removeProperty(key);
  }
}

function applyScheme(id) {
  if (typeof document === 'undefined') {
    return;
  }

  const resolvedId = resolveAppliedSchemeId(id);
  const scheme = getSchemeById(resolvedId);

  if (!scheme) {
    return;
  }

  const root = document.documentElement;

  root.classList.toggle('app-dark', scheme.baseMode === 'dark');
  root.setAttribute('data-theme', isDefaultScheme(resolvedId) ? scheme.baseMode : resolvedId);
  root.style.colorScheme = scheme.baseMode;

  clearSchemeVariables(root, lastAppliedScheme);

  if (!isDefaultScheme(resolvedId)) {
    for (const [key, value] of Object.entries(scheme.appVars || {})) {
      root.style.setProperty(key, value);
    }

    for (const [key, value] of Object.entries(scheme.primeVars || {})) {
      root.style.setProperty(key, value);
    }
  }

  lastAppliedScheme = scheme;
  appliedBaseMode.value = scheme.baseMode;
}

function onSystemThemeChange() {
  if (schemeId.value === 'auto') {
    applyScheme('auto');
  }
}

function attachSystemThemeListener() {
  const mediaQuery = getSystemThemeMediaQuery();

  if (!mediaQuery || systemThemeListenerAttached) {
    return;
  }

  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', onSystemThemeChange);
  } else if (typeof mediaQuery.addListener === 'function') {
    mediaQuery.addListener(onSystemThemeChange);
  }

  systemThemeListenerAttached = true;
}

function detachSystemThemeListener() {
  const mediaQuery = getSystemThemeMediaQuery();

  if (!mediaQuery || !systemThemeListenerAttached) {
    return;
  }

  if (typeof mediaQuery.removeEventListener === 'function') {
    mediaQuery.removeEventListener('change', onSystemThemeChange);
  } else if (typeof mediaQuery.removeListener === 'function') {
    mediaQuery.removeListener(onSystemThemeChange);
  }

  systemThemeListenerAttached = false;
}

function getCurrentBaseMode() {
  if (schemeId.value === 'auto') {
    return appliedBaseMode.value;
  }

  const scheme = getSchemeById(schemeId.value);
  return scheme ? scheme.baseMode : appliedBaseMode.value;
}

function initializeTheme() {
  migrateLegacyThemeMode();

  schemeId.value = resolveInitialScheme();
  applyScheme(schemeId.value);

  if (schemeId.value === 'auto') {
    attachSystemThemeListener();
  } else {
    detachSystemThemeListener();
  }

  return schemeId.value;
}

function setScheme(id) {
  if (!isValidSchemeId(id)) {
    return;
  }

  schemeId.value = id;

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(SCHEME_KEY, id);
  }

  if (id === 'auto') {
    attachSystemThemeListener();
  } else {
    detachSystemThemeListener();
  }

  applyScheme(id);
}

function setTheme(mode) {
  if (mode !== 'light' && mode !== 'dark') {
    return;
  }

  setScheme(mode === 'light' ? 'default-light' : 'default-dark');
}

function toggleTheme() {
  const currentMode = getCurrentBaseMode();
  setScheme(currentMode === 'dark' ? 'default-light' : 'default-dark');
}

function useTheme() {
  const themeMode = computed(() => getCurrentBaseMode());
  const isDarkTheme = computed(() => themeMode.value === 'dark');

  return {
    schemeId,
    themeMode,
    isDarkTheme,
    setScheme,
    setTheme,
    toggleTheme,
  };
}

export { initializeTheme, setScheme, setTheme, toggleTheme, useTheme, SCHEMES };
