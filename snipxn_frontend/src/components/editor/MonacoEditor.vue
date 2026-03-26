<template>
  <div ref="containerRef" class="monaco-editor-container" @dragover.prevent @drop.prevent="handleDrop" />
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch, shallowRef } from 'vue';
import '@/editor/monaco-setup';
import * as monaco from 'monaco-editor';
import { useFont } from '../../composables/useFont';
import { getCodeFontById } from '../../theme/fonts';

const LANGUAGE_MAP = {
  c: 'c',
  'c++': 'cpp',
  cpp: 'cpp',
  'c#': 'csharp',
  csharp: 'csharp',
  css: 'css',
  go: 'go',
  golang: 'go',
  html: 'html',
  java: 'java',
  javascript: 'javascript',
  js: 'javascript',
  json: 'json',
  jsx: 'javascript',
  kotlin: 'kotlin',
  less: 'less',
  lua: 'lua',
  markdown: 'markdown',
  md: 'markdown',
  mysql: 'mysql',
  'objective-c': 'objective-c',
  perl: 'perl',
  php: 'php',
  plaintext: 'plaintext',
  python: 'python',
  py: 'python',
  r: 'r',
  ruby: 'ruby',
  rust: 'rust',
  sass: 'scss',
  scala: 'scala',
  scss: 'scss',
  shell: 'shell',
  bash: 'shell',
  sql: 'sql',
  swift: 'swift',
  text: 'plaintext',
  tsx: 'typescript',
  typescript: 'typescript',
  ts: 'typescript',
  xml: 'xml',
  yaml: 'yaml',
  yml: 'yaml',
};

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  language: {
    type: String,
    default: 'markdown',
  },
  theme: {
    type: String,
    default: 'vs-dark',
  },
  readOnly: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue', 'paste-image', 'drop-image']);

const { codeFontId } = useFont();
const resolvedCodeFontFamily = computed(() => {
  const font = getCodeFontById(codeFontId.value);
  return font && font.fontFamily
    ? font.fontFamily
    : "'JetBrains Mono', 'Cascadia Code', 'Fira Code', Consolas, monospace";
});

const containerRef = ref(null);
const editorInstance = shallowRef(null);
let resizeObserver = null;
let isUpdatingFromProp = false;

function resolveLanguage(lang) {
  if (!lang) return 'markdown';
  const key = lang.toLowerCase().trim();
  return LANGUAGE_MAP[key] || key;
}

onMounted(() => {
  const editor = monaco.editor.create(containerRef.value, {
    value: props.modelValue,
    language: resolveLanguage(props.language),
    theme: props.theme,
    readOnly: props.readOnly,
    automaticLayout: false,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 14,
    fontFamily: resolvedCodeFontFamily.value,
    lineNumbers: 'on',
    renderLineHighlight: 'line',
    tabSize: 2,
    wordWrap: 'on',
    padding: { top: 12, bottom: 12 },
    scrollbar: {
      verticalScrollbarSize: 8,
      horizontalScrollbarSize: 8,
    },
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    overviewRulerBorder: false,
    contextmenu: true,
    suggest: { showWords: false },
  });

  editor.onDidChangeModelContent(() => {
    if (isUpdatingFromProp) return;
    emit('update:modelValue', editor.getValue());
  });

  editor.onDidPaste((e) => {
    // Image paste is handled at DOM level
  });

  editorInstance.value = editor;

  resizeObserver = new ResizeObserver(() => {
    editor.layout();
  });
  resizeObserver.observe(containerRef.value);

  // Handle image paste at the DOM level
  containerRef.value.addEventListener('paste', handlePaste, true);
});

onBeforeUnmount(() => {
  if (containerRef.value) {
    containerRef.value.removeEventListener('paste', handlePaste, true);
  }
  resizeObserver?.disconnect();
  editorInstance.value?.dispose();
});

// Sync modelValue prop → editor
watch(
  () => props.modelValue,
  (newVal) => {
    const editor = editorInstance.value;
    if (!editor) return;
    if (editor.getValue() === newVal) return;
    isUpdatingFromProp = true;
    editor.setValue(newVal || '');
    isUpdatingFromProp = false;
  },
);

// Sync language prop
watch(
  () => props.language,
  (newLang) => {
    const editor = editorInstance.value;
    if (!editor) return;
    const model = editor.getModel();
    if (model) {
      monaco.editor.setModelLanguage(model, resolveLanguage(newLang));
    }
  },
);

// Sync theme prop
watch(
  () => props.theme,
  (newTheme) => {
    monaco.editor.setTheme(newTheme);
  },
);

// Sync readOnly prop
watch(
  () => props.readOnly,
  (val) => {
    editorInstance.value?.updateOptions({ readOnly: val });
  },
);

// Sync code font
watch(resolvedCodeFontFamily, (fontFamily) => {
  editorInstance.value?.updateOptions({ fontFamily });
});

function handlePaste(event) {
  const imageItem = Array.from(event.clipboardData?.items || []).find((item) =>
    item.type.startsWith('image/'),
  );
  if (!imageItem) return;
  event.preventDefault();
  event.stopPropagation();
  emit('paste-image', imageItem.getAsFile());
}

function handleDrop(event) {
  const imageFile = Array.from(event.dataTransfer?.files || []).find((file) =>
    file.type.startsWith('image/'),
  );
  if (imageFile) {
    emit('drop-image', imageFile);
  }
}

function getLineCount() {
  return editorInstance.value?.getModel()?.getLineCount() ?? 1;
}

function getCharacterCount() {
  return editorInstance.value?.getValue()?.length ?? 0;
}

function insertText(text) {
  const editor = editorInstance.value;
  if (!editor) return;

  const selection = editor.getSelection();
  editor.executeEdits('insert-image', [
    {
      range: selection,
      text,
      forceMoveMarkers: true,
    },
  ]);
  editor.focus();
}

defineExpose({
  getLineCount,
  getCharacterCount,
  insertText,
});
</script>

<style scoped>
.monaco-editor-container {
  width: 100%;
  height: 100%;
  min-height: 0;
  flex: 1;
  overflow: hidden;
}
</style>
