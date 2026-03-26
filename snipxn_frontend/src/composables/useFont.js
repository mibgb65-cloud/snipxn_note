import { ref } from 'vue';
import { getUiFontById, getCodeFontById } from '../theme/fonts';

const UI_FONT_KEY = 'fontUi';
const CODE_FONT_KEY = 'fontCode';
const DEFAULT_UI_FONT = 'system';
const DEFAULT_CODE_FONT = 'system-mono';

const uiFontId = ref(DEFAULT_UI_FONT);
const codeFontId = ref(DEFAULT_CODE_FONT);

function applyFont() {
  if (typeof document === 'undefined') return;

  const root = document.documentElement.style;
  const uiFont = getUiFontById(uiFontId.value);
  const codeFont = getCodeFontById(codeFontId.value);

  if (uiFont && uiFont.fontFamily) {
    root.setProperty('--font-sans', uiFont.fontFamily);
    root.setProperty('--font-display', uiFont.fontFamily);
  } else {
    root.removeProperty('--font-sans');
    root.removeProperty('--font-display');
  }

  if (codeFont && codeFont.fontFamily) {
    root.setProperty('--font-mono', codeFont.fontFamily);
  } else {
    root.removeProperty('--font-mono');
  }
}

function initializeFont() {
  if (typeof window === 'undefined') return;

  const storedUi = window.localStorage.getItem(UI_FONT_KEY);
  const storedCode = window.localStorage.getItem(CODE_FONT_KEY);

  if (storedUi && getUiFontById(storedUi)) {
    uiFontId.value = storedUi;
  }

  if (storedCode && getCodeFontById(storedCode)) {
    codeFontId.value = storedCode;
  }

  applyFont();
}

function setUiFont(id) {
  if (!getUiFontById(id)) return;

  uiFontId.value = id;

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(UI_FONT_KEY, id);
  }

  applyFont();
}

function setCodeFont(id) {
  if (!getCodeFontById(id)) return;

  codeFontId.value = id;

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(CODE_FONT_KEY, id);
  }

  applyFont();
}

function useFont() {
  return {
    uiFontId,
    codeFontId,
    setUiFont,
    setCodeFont,
  };
}

export { initializeFont, useFont };
