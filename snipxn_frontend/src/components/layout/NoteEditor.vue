<template>
  <section class="panel editor-panel" :aria-busy="loading">
    <div v-if="loading && !note" class="editor-loading">
      <Skeleton height="8rem" border-radius="1rem" />
      <Skeleton height="24rem" border-radius="1rem" />
    </div>

    <div v-else-if="note" class="editor-content">
      <NoteToolbar
        :note="note"
        :saving="saving"
        :is-trash-view="isTrashView"
        @update:title="$emit('update:title', $event)"
        @update:language="$emit('update:language', $event)"
        @toggle-star="$emit('toggle-star')"
        @delete="$emit('delete')"
        @restore="$emit('restore')"
        @purge="$emit('purge')"
        @upload-image="fileInput?.click()"
        @insert-markdown="handleMarkdownInsert"
        @share-note="openShareDialog"
      />

      <div class="editor-workbench">
        <div class="editor-main-stack">
          <div class="editor-grid">
            <div class="editor-pane">
              <div class="pane-header">
                <div class="pane-header-main">
                  <span class="pane-chrome" aria-hidden="true">
                    <span class="pane-dot pane-dot-close" />
                    <span class="pane-dot pane-dot-min" />
                    <span class="pane-dot pane-dot-max" />
                  </span>
                  <span class="pane-title">{{ t('notes.editor') }}</span>
                </div>
                <small>{{ t('notes.editorStats', { lines: lineCount, characters: characterCount }) }}</small>
              </div>

              <div class="markdown-editor-shell" :class="{ 'markdown-editor-shell-readonly': isTrashView }">
                <textarea
                  ref="markdownTextareaRef"
                  class="markdown-textarea"
                  :value="markdownContent"
                  :readonly="isTrashView"
                  :placeholder="t('notes.contentPlaceholder')"
                  @input="handleMarkdownInput"
                  @click="syncSelectionFromEvent"
                  @keyup="syncSelectionFromEvent"
                  @select="syncSelectionFromEvent"
                  @focus="syncSelectionFromEvent"
                  @dragover.prevent
                  @drop.prevent="handleTextareaDrop"
                  @paste="handleTextareaPaste"
                />
              </div>
            </div>

            <div class="preview-pane">
              <div class="pane-header">
                <div class="pane-header-main">
                  <span class="pane-chrome" aria-hidden="true">
                    <span class="pane-dot pane-dot-close" />
                    <span class="pane-dot pane-dot-min" />
                    <span class="pane-dot pane-dot-max" />
                  </span>
                  <span class="pane-title">{{ t('notes.preview') }}</span>
                </div>
                <small>{{ note.primaryLanguage || 'Markdown' }}</small>
              </div>
              <div class="markdown-preview" v-html="previewHtml" />
            </div>
          </div>
        </div>

        <CodeRunnerSidebar
          :expanded="codePanelExpanded"
          :active-code-block="activeCodeBlock"
          :theme="monacoTheme"
          :read-only="isTrashView"
          :running="runningCode"
          :result="codeRunResult"
          :stdin="codeRunnerStdin"
          @toggle="handleToggleCodePanel"
          @insert-code="handleInsertCodeFromRunner"
          @update:code="handleCodeBlockUpdate"
          @update:stdin="handleCodeRunnerStdinUpdate"
          @run="handleRunActiveCode"
        />
      </div>

      <div v-if="!isTrashView" class="editor-footer">
        <div class="editor-footer-copy">
          <span>{{ t('notes.saveHint') }}</span>
        </div>
        <Button
          icon="pi pi-save"
          :label="t('common.save')"
          :loading="saving"
          @click="$emit('save')"
        />
      </div>

      <Dialog
        v-model:visible="shareDialogVisible"
        modal
        :draggable="false"
        :header="t('notes.shareNote')"
        :style="{ width: 'min(42rem, 94vw)' }"
      >
        <div class="share-note-form">
          <div class="share-note-current">
            <span class="share-note-current-icon" aria-hidden="true">
              <i class="pi pi-file-edit" />
            </span>
            <div class="share-note-current-copy">
              <span class="share-note-current-label">{{ t('notes.shareCurrentNote') }}</span>
              <strong class="share-note-current-title">{{ resolvedShareTitle }}</strong>
              <span class="share-note-current-meta">{{ shareCurrentMeta }}</span>
            </div>
          </div>

          <div class="share-note-control-stack">
            <div class="share-note-field">
              <label class="toolbar-label">{{ t('notes.shareTarget') }}</label>
              <div class="share-note-toggle">
                <button
                  v-for="option in shareTargetOptions"
                  :key="option.value"
                  type="button"
                  class="share-note-toggle-btn"
                  :class="{ 'share-note-toggle-btn-active': shareTarget === option.value }"
                  @click="shareTarget = option.value"
                >
                  <i class="pi share-note-toggle-icon" :class="option.icon" aria-hidden="true" />
                  <span>{{ option.label }}</span>
                </button>
              </div>
            </div>

            <div v-if="shareTarget === 'external'" class="share-note-field">
              <label class="toolbar-label">{{ t('notes.shareFormat') }}</label>
              <div class="share-note-toggle">
                <button
                  v-for="option in shareFormatOptions"
                  :key="option.value"
                  type="button"
                  class="share-note-toggle-btn"
                  :class="{ 'share-note-toggle-btn-active': shareFormat === option.value }"
                  @click="shareFormat = option.value"
                >
                  <i class="pi share-note-toggle-icon" :class="option.icon" aria-hidden="true" />
                  <span>{{ option.label }}</span>
                </button>
              </div>
            </div>
          </div>

          <div v-if="shareTarget === 'community'" class="share-note-hint">
            <i class="pi pi-send" aria-hidden="true" />
            <span>{{ t('notes.shareCommunityHint') }}</span>
          </div>

          <div class="share-note-actions">
            <Button
              type="button"
              text
              severity="secondary"
              :label="t('common.cancel')"
              @click="shareDialogVisible = false"
            />
            <Button
              v-if="shareTarget === 'community'"
              type="button"
              icon="pi pi-send"
              :label="t('notes.publishToCommunity')"
              :loading="shareSubmitting"
              @click="handleCommunityShare"
            />
            <Button
              v-else
              type="button"
              :icon="effectiveShareFormat === 'link' ? 'pi pi-copy' : 'pi pi-download'"
              :label="effectiveShareFormat === 'link' ? t('notes.copyLink') : t('notes.saveLocalShare')"
              :loading="shareSubmitting"
              @click="handleExternalShare"
            />
          </div>
        </div>
      </Dialog>

      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="hidden-file-input"
        @change="handleFileSelection"
      >
    </div>

    <div v-else class="editor-empty">
      <i class="pi pi-file-edit editor-empty-icon" />
      <h3 class="mb-2">{{ t('notes.noSelection') }}</h3>
      <p class="m-0">{{ isTrashView ? t('notes.noSelectionReadonlyDescription') : t('notes.noSelectionDescription') }}</p>
      <Button v-if="!isTrashView" class="mt-4" icon="pi pi-plus" :label="t('notes.newNote')" @click="$emit('create-note')" />
    </div>

    <div v-if="loading && note" class="editor-loading-overlay" aria-hidden="true">
      <span class="editor-loading-spinner" />
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Skeleton from 'primevue/skeleton';
import { runCode } from '../../api/sandbox';
import { uploadFile } from '../../api/file';
import { renderMarkdown } from '../../utils/markdown';
import { buildNoteShareFileStem, createNoteShareImageBlob, summarizeNoteShareContent } from '../../utils/noteShare';
import { useTheme } from '../../composables/useTheme';
import { useCommunityStore } from '../../stores/community';
import NoteToolbar from '../note/NoteToolbar.vue';
import CodeRunnerSidebar from '../note/CodeRunnerSidebar.vue';

const BROWSER_RUN_LANGUAGES = new Set(['javascript', 'js', 'typescript', 'ts']);
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

const props = defineProps({
  note: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  saving: {
    type: Boolean,
    default: false,
  },
  isTrashView: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  'create-note',
  'update:title',
  'update:language',
  'update:content',
  'save',
  'toggle-star',
  'delete',
  'restore',
  'purge',
]);

const router = useRouter();
const { locale, t } = useI18n();
const toast = useToast();
const { isDarkTheme } = useTheme();
const communityStore = useCommunityStore();

const markdownTextareaRef = ref(null);
const fileInput = ref(null);
const selectionStart = ref(0);
const selectionEnd = ref(0);
const pendingSelection = ref(null);
const shareDialogVisible = ref(false);
const shareSubmitting = ref(false);
const shareTarget = ref('community');
const shareFormat = ref('markdown');
const codePanelExpanded = ref(false);
const runningCode = ref(false);
const codeRunnerStdin = ref('');
const codeRunResult = ref(null);

const monacoTheme = computed(() => (isDarkTheme.value ? 'vs-dark' : 'vs'));
const markdownContent = computed(() => props.note?.content || '');
const shareSourceTitle = computed(() => String(props.note?.title || '').trim());
const shareSourceContent = computed(() => String(props.note?.content || ''));
const shareSourceLanguage = computed(() => String(props.note?.primaryLanguage || '').trim());
const shareSourceTags = computed(() => Array.isArray(props.note?.tagIds) ? props.note.tagIds : []);
const fallbackCodeLanguage = computed(() => {
  const rawLanguage = String(props.note?.primaryLanguage || '').trim().toLowerCase();
  return !rawLanguage || rawLanguage === 'markdown' ? 'plaintext' : rawLanguage;
});
const previewHtml = computed(() => renderMarkdown(markdownContent.value));
const lineCount = computed(() => markdownContent.value.split(/\r?\n/).length);
const characterCount = computed(() => markdownContent.value.length);
const activeCodeBlock = computed(() => {
  const block = findActiveCodeBlock(markdownContent.value, selectionStart.value, selectionEnd.value);

  if (!block) {
    return null;
  }

  return {
    ...block,
    code: extractCodeBlockBody(markdownContent.value, block),
    editorLanguage: block.language || fallbackCodeLanguage.value,
  };
});
const shareTargetOptions = computed(() => ([
  { value: 'community', label: t('notes.shareTargetCommunity'), icon: 'pi-users' },
  { value: 'external', label: t('notes.shareTargetExternal'), icon: 'pi-folder-open' },
]));
const shareFormatOptions = computed(() => ([
  { value: 'markdown', label: t('notes.shareFormatMarkdown'), icon: 'pi-file-edit' },
  { value: 'link', label: t('notes.shareFormatLink'), icon: 'pi-link' },
  { value: 'image', label: t('notes.shareFormatImage'), icon: 'pi-image' },
]));
const effectiveShareFormat = computed(() => (
  shareTarget.value === 'community' ? 'markdown' : shareFormat.value
));
const resolvedShareTitle = computed(() => shareSourceTitle.value || t('notes.untitled'));
const formattedUpdatedAt = computed(() => {
  const source = props.note?.updatedAt;

  if (!source) {
    return '';
  }

  const date = new Date(source);

  if (Number.isNaN(date.getTime())) {
    return source;
  }

  return new Intl.DateTimeFormat(locale.value === 'zh' ? 'zh-CN' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
});
const shareLink = computed(() => {
  if (!props.note?.id) {
    return '';
  }

  const resolvedRoute = router.resolve({
    name: 'workspace',
    query: {
      noteId: props.note.id,
      folderId: props.note.folderId || undefined,
    },
  });
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  return origin ? `${origin}${resolvedRoute.href}` : resolvedRoute.href;
});
const shareCurrentMeta = computed(() => {
  const parts = [];

  if (shareSourceLanguage.value) {
    parts.push(shareSourceLanguage.value);
  } else {
    parts.push(t('notes.shareLanguageFallback'));
  }

  if (formattedUpdatedAt.value) {
    parts.push(t('notes.updatedAtListValue', { time: formattedUpdatedAt.value }));
  }

  return parts.join(' · ');
});
const shareImageSummary = computed(() => (
  summarizeNoteShareContent(shareSourceContent.value || markdownContent.value)
));
const shareFileStem = computed(() => buildNoteShareFileStem(resolvedShareTitle.value));

watch(
  () => props.note?.id,
  () => {
    selectionStart.value = 0;
    selectionEnd.value = 0;
    pendingSelection.value = null;
    shareDialogVisible.value = false;
    shareSubmitting.value = false;
    shareTarget.value = 'community';
    shareFormat.value = 'markdown';
    codeRunnerStdin.value = '';
    codeRunResult.value = null;
  },
);

watch(
  () => `${activeCodeBlock.value?.fenceStart ?? 'none'}:${activeCodeBlock.value?.fenceEnd ?? 'none'}`,
  () => {
    codeRunResult.value = null;
  },
);

watch(
  () => props.note?.content,
  async () => {
    if (!pendingSelection.value) {
      return;
    }

    await nextTick();

    const textarea = markdownTextareaRef.value;

    if (!textarea) {
      pendingSelection.value = null;
      return;
    }

    const start = Math.min(pendingSelection.value.start, textarea.value.length);
    const end = Math.min(pendingSelection.value.end, textarea.value.length);

    textarea.focus();
    textarea.setSelectionRange(start, end);
    selectionStart.value = start;
    selectionEnd.value = end;
    pendingSelection.value = null;
  },
);

function syncSelectionFromElement() {
  const textarea = markdownTextareaRef.value;

  if (!textarea) {
    return;
  }

  selectionStart.value = textarea.selectionStart ?? 0;
  selectionEnd.value = textarea.selectionEnd ?? selectionStart.value;
}

function syncSelectionFromEvent(event) {
  selectionStart.value = event.target.selectionStart ?? 0;
  selectionEnd.value = event.target.selectionEnd ?? selectionStart.value;
}

function emitContent(nextContent, nextSelection = null, focusTextarea = true) {
  emit('update:content', nextContent);

  if (!nextSelection) {
    return;
  }

  selectionStart.value = nextSelection.start;
  selectionEnd.value = nextSelection.end;

  if (focusTextarea) {
    pendingSelection.value = nextSelection;
  }
}

function handleMarkdownInput(event) {
  syncSelectionFromEvent(event);
  emit('update:content', event.target.value);
}

function getSelectedLineRange(content, start, end) {
  const lineStart = content.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
  let lineEnd = content.indexOf('\n', end);

  if (lineEnd === -1) {
    lineEnd = content.length;
  }

  return {
    lineStart,
    lineEnd,
  };
}

function replaceSelection({ text, start = selectionStart.value, end = selectionEnd.value, nextStart, nextEnd, focusTextarea = true }) {
  const nextContent = `${markdownContent.value.slice(0, start)}${text}${markdownContent.value.slice(end)}`;
  const selection = {
    start: nextStart ?? start + text.length,
    end: nextEnd ?? start + text.length,
  };

  emitContent(nextContent, selection, focusTextarea);
}

function resolveFenceLanguage() {
  return fallbackCodeLanguage.value === 'plaintext' ? '' : fallbackCodeLanguage.value;
}

function insertHeading() {
  const { lineStart, lineEnd } = getSelectedLineRange(markdownContent.value, selectionStart.value, selectionEnd.value);
  const selectedBlock = markdownContent.value.slice(lineStart, lineEnd) || '';
  const headingText = selectedBlock
    .split(/\r?\n/)
    .map((line) => (line.trim() ? `## ${line.replace(/^#{1,6}\s+/, '')}` : '## '))
    .join('\n');

  replaceSelection({
    start: lineStart,
    end: lineEnd,
    text: headingText,
    nextStart: lineStart,
    nextEnd: lineStart + headingText.length,
  });
}

function insertBold() {
  const selectedText = markdownContent.value.slice(selectionStart.value, selectionEnd.value);
  const wrappedText = `**${selectedText}**`;

  replaceSelection({
    text: wrappedText,
    nextStart: selectionStart.value + 2,
    nextEnd: selectionStart.value + 2 + selectedText.length,
  });
}

function insertList() {
  const { lineStart, lineEnd } = getSelectedLineRange(markdownContent.value, selectionStart.value, selectionEnd.value);
  const selectedBlock = markdownContent.value.slice(lineStart, lineEnd) || '';
  const listText = selectedBlock
    .split(/\r?\n/)
    .map((line) => (line.trim() ? `- ${line.replace(/^[-*]\s+/, '')}` : '- '))
    .join('\n');

  replaceSelection({
    start: lineStart,
    end: lineEnd,
    text: listText,
    nextStart: lineStart,
    nextEnd: lineStart + listText.length,
  });
}

function insertLink() {
  const selectedText = markdownContent.value.slice(selectionStart.value, selectionEnd.value);
  const insertedText = `[${selectedText}](https://)`;
  const labelCursorStart = selectionStart.value + 1;
  const urlCursorStart = selectionStart.value + insertedText.indexOf('https://');

  replaceSelection({
    text: insertedText,
    nextStart: selectedText ? urlCursorStart : labelCursorStart,
    nextEnd: selectedText ? urlCursorStart + 'https://'.length : labelCursorStart,
  });
}

function insertCodeBlock() {
  const selectedText = markdownContent.value.slice(selectionStart.value, selectionEnd.value);
  const fenceLanguage = resolveFenceLanguage();
  const codeBody = selectedText ? `${selectedText}${selectedText.endsWith('\n') ? '' : '\n'}` : '';
  const leadingBreak = selectionStart.value > 0 && !markdownContent.value.slice(0, selectionStart.value).endsWith('\n')
    ? '\n'
    : '';
  const trailingBreak = selectionEnd.value < markdownContent.value.length
    && !markdownContent.value.slice(selectionEnd.value).startsWith('\n')
    ? '\n'
    : '';
  const insertedText = `${leadingBreak}\`\`\`${fenceLanguage}\n${codeBody}\`\`\`${trailingBreak}`;
  const codeStart = selectionStart.value + leadingBreak.length + 4 + fenceLanguage.length;
  const cursorStart = codeStart + 1;
  const cursorEnd = cursorStart + selectedText.length;

  replaceSelection({
    text: insertedText,
    nextStart: cursorStart,
    nextEnd: selectedText ? cursorEnd : cursorStart,
  });
}

function handleMarkdownInsert(action) {
  if (props.isTrashView) {
    return;
  }

  syncSelectionFromElement();

  if (action === 'heading') {
    insertHeading();
    return;
  }

  if (action === 'bold') {
    insertBold();
    return;
  }

  if (action === 'list') {
    insertList();
    return;
  }

  if (action === 'link') {
    insertLink();
    return;
  }

  if (action === 'code') {
    insertCodeBlock();
  }
}

function handleInsertCodeFromRunner() {
  codePanelExpanded.value = true;
  handleMarkdownInsert('code');
}

function handleToggleCodePanel() {
  codePanelExpanded.value = !codePanelExpanded.value;
}

function handleCodeRunnerStdinUpdate(value) {
  codeRunnerStdin.value = value;
}

function resolveUploadedFileUrl(fileData) {
  return fileData?.url || (fileData?.fileId ? `/api/v1/files/${fileData.fileId}` : '');
}

function insertImageMarkdown(file, fileData) {
  const url = resolveUploadedFileUrl(fileData);

  if (!url || !props.note) {
    return;
  }

  const imageMarkdown = `![${file.name || 'image'}](${url})`;
  syncSelectionFromElement();
  replaceSelection({ text: imageMarkdown });
}

async function handleUpload(file) {
  if (!file || !props.note) {
    return;
  }

  try {
    const res = await uploadFile(file);
    insertImageMarkdown(file, res.data);
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('notes.imageUploaded'),
      life: 2500,
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: error?.message || t('notes.imageUploadFailed'),
      life: 3000,
    });
  }
}

function handleTextareaPaste(event) {
  const imageItem = Array.from(event.clipboardData?.items || []).find((item) =>
    item.type.startsWith('image/'),
  );

  if (!imageItem) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  handleUpload(imageItem.getAsFile());
}

function handleTextareaDrop(event) {
  const imageFile = Array.from(event.dataTransfer?.files || []).find((file) =>
    file.type.startsWith('image/'),
  );

  if (imageFile) {
    handleUpload(imageFile);
  }
}

function handleFileSelection(event) {
  const [file] = event.target.files || [];

  if (file) {
    handleUpload(file);
  }

  event.target.value = '';
}

function collectCodeBlocks(content = '') {
  const blocks = [];
  const lineRegex = /.*?(?:\r?\n|$)/g;
  let openBlock = null;
  let match;

  while ((match = lineRegex.exec(content)) && match[0] !== '') {
    const rawLine = match[0];
    const start = match.index;
    const end = start + rawLine.length;
    const lineText = rawLine.replace(/\r?\n$/, '');

    if (!lineText.startsWith('```')) {
      continue;
    }

    if (!openBlock) {
      openBlock = {
        fenceStart: start,
        bodyStart: end,
        language: lineText.slice(3).trim(),
      };
      continue;
    }

    blocks.push({
      ...openBlock,
      bodyEnd: start,
      fenceEnd: end,
    });
    openBlock = null;
  }

  return blocks;
}

function findActiveCodeBlock(content, start, end) {
  return collectCodeBlocks(content).find((block) => (
    start >= block.fenceStart && end <= block.fenceEnd
  )) || null;
}

function extractCodeBlockBody(content, block) {
  return content.slice(block.bodyStart, block.bodyEnd).replace(/\r?\n$/, '');
}

function handleCodeBlockUpdate(nextCode) {
  if (!activeCodeBlock.value || props.isTrashView) {
    return;
  }

  const block = activeCodeBlock.value;
  const normalizedCode = nextCode.replace(/\r\n/g, '\n');
  const nextBody = normalizedCode
    ? `${normalizedCode}${normalizedCode.endsWith('\n') ? '' : '\n'}`
    : '';
  const nextContent = `${markdownContent.value.slice(0, block.bodyStart)}${nextBody}${markdownContent.value.slice(block.bodyEnd)}`;
  const nextCursor = Math.min(block.bodyStart + nextBody.length, nextContent.length);

  emitContent(nextContent, { start: nextCursor, end: nextCursor }, false);
}

function normalizeRunnerLanguage(language) {
  return String(language || '').trim().toLowerCase();
}

function canRunInBrowser(language) {
  return BROWSER_RUN_LANGUAGES.has(normalizeRunnerLanguage(language));
}

function formatRunnerValue(value) {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'undefined') {
    return '';
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function normalizeSandboxResult(payload = {}) {
  const status = String(payload.status || '').toLowerCase();
  const hasError = Boolean(payload.stderr);

  return {
    status: hasError || ['error', 'failed', 'runtime_error'].includes(status) ? 'error' : 'success',
    stdout: String(payload.stdout || ''),
    stderr: String(payload.stderr || ''),
    time: payload.time ?? null,
    memory: payload.memory ?? null,
    source: 'sandbox',
  };
}

async function runCodeInBrowser({ sourceCode, stdin }) {
  const stdout = [];
  const stderr = [];
  const inputLines = String(stdin || '').split(/\r?\n/);
  let inputIndex = 0;
  const input = () => inputLines[inputIndex++] ?? '';
  const consoleProxy = {
    log: (...args) => stdout.push(args.map(formatRunnerValue).join(' ')),
    info: (...args) => stdout.push(args.map(formatRunnerValue).join(' ')),
    warn: (...args) => stderr.push(args.map(formatRunnerValue).join(' ')),
    error: (...args) => stderr.push(args.map(formatRunnerValue).join(' ')),
  };
  const startedAt = performance.now();

  try {
    const runner = new AsyncFunction('console', 'stdin', 'input', `"use strict";\n${sourceCode}`);
    const returned = await runner(consoleProxy, String(stdin || ''), input);

    if (typeof returned !== 'undefined') {
      stdout.push(formatRunnerValue(returned));
    }

    return {
      status: stderr.length ? 'error' : 'success',
      stdout: stdout.join('\n'),
      stderr: stderr.join('\n'),
      time: Math.round(performance.now() - startedAt),
      memory: null,
      source: 'browser',
    };
  } catch (error) {
    stderr.push(error?.stack || error?.message || String(error));

    return {
      status: 'error',
      stdout: stdout.join('\n'),
      stderr: stderr.join('\n'),
      time: Math.round(performance.now() - startedAt),
      memory: null,
      source: 'browser',
    };
  }
}

function buildUnavailableRunResult(language, error) {
  const detail = error?.response?.status === 404
    ? t('notes.codeRunnerUnavailable')
    : error?.message || t('notes.codeRunFailed');

  return {
    status: 'error',
    stdout: '',
    stderr: canRunInBrowser(language)
      ? detail
      : t('notes.codeRunUnsupportedLanguage', { language: language || 'text' }),
    time: null,
    memory: null,
    source: 'sandbox',
  };
}

async function handleRunActiveCode() {
  if (!activeCodeBlock.value) {
    return;
  }

  runningCode.value = true;
  codePanelExpanded.value = true;

  const language = activeCodeBlock.value.editorLanguage || activeCodeBlock.value.language || fallbackCodeLanguage.value;
  const sourceCode = activeCodeBlock.value.code || '';

  try {
    if (canRunInBrowser(language)) {
      codeRunResult.value = await runCodeInBrowser({
        sourceCode,
        stdin: codeRunnerStdin.value,
      });
      return;
    }

    const res = await runCode({
      language,
      sourceCode,
      stdin: codeRunnerStdin.value,
    });

    codeRunResult.value = normalizeSandboxResult(res.data || {});
  } catch (error) {
    codeRunResult.value = buildUnavailableRunResult(language, error);
  } finally {
    runningCode.value = false;
  }
}

function openShareDialog() {
  if (!props.note || props.isTrashView) {
    return;
  }

  shareTarget.value = 'community';
  shareFormat.value = 'markdown';
  shareDialogVisible.value = true;
}

function validateShareDraft() {
  if (shareTarget.value === 'community' && !shareSourceContent.value.trim()) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('community.contentRequired'),
      life: 3000,
    });
    return false;
  }

  if (effectiveShareFormat.value === 'link' && !shareLink.value) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('notes.shareLinkUnavailable'),
      life: 3000,
    });
    return false;
  }

  return true;
}

async function copyTextToClipboard(value) {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', 'readonly');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

function downloadBlob(blob, filename) {
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1200);
}

function downloadTextFile(content, filename, type = 'text/plain;charset=utf-8') {
  downloadBlob(new Blob([content], { type }), filename);
}

async function buildShareImageAsset() {
  const blob = await createNoteShareImageBlob({
    title: resolvedShareTitle.value,
    language: shareSourceLanguage.value || t('notes.shareLanguageFallback'),
    updatedAt: formattedUpdatedAt.value,
    summary: shareImageSummary.value,
    brand: 'Snipxn',
  });

  return {
    blob,
    file: new File([blob], `${shareFileStem.value}.png`, { type: 'image/png' }),
  };
}

function showShareSuccess(detail) {
  toast.add({
    severity: 'success',
    summary: t('common.success'),
    detail,
    life: 2600,
  });
}

function showShareError(error, fallbackMessage) {
  toast.add({
    severity: 'error',
    summary: t('common.error'),
    detail: error?.message || fallbackMessage,
    life: 3200,
  });
}

async function handleCommunityShare() {
  if (!props.note || !validateShareDraft()) {
    return;
  }

  shareSubmitting.value = true;

  try {
    const res = await communityStore.createPost({
      title: resolvedShareTitle.value,
      content: shareSourceContent.value,
      language: shareSourceLanguage.value || undefined,
      tags: shareSourceTags.value,
      originNoteId: props.note?.id || undefined,
    });

    shareDialogVisible.value = false;
    showShareSuccess(t('community.publishSuccess'));

    if (res?.data?.id) {
      await router.push(`/community/${res.data.id}`);
    } else {
      await router.push('/community');
    }
  } catch (error) {
    showShareError(error, t('community.publishFailed'));
  } finally {
    shareSubmitting.value = false;
  }
}

async function handleExternalShare() {
  if (!props.note || !validateShareDraft()) {
    return;
  }

  shareSubmitting.value = true;

  try {
    if (effectiveShareFormat.value === 'link') {
      await copyTextToClipboard(shareLink.value);
      showShareSuccess(t('notes.shareCopySuccess'));
      return;
    }

    if (effectiveShareFormat.value === 'markdown') {
      downloadTextFile(shareSourceContent.value, `${shareFileStem.value}.md`, 'text/markdown;charset=utf-8');
    } else {
      const { blob } = await buildShareImageAsset();
      downloadBlob(blob, `${shareFileStem.value}.png`);
    }

    showShareSuccess(t('notes.shareDownloadSuccess'));
  } catch (error) {
    showShareError(error, t(effectiveShareFormat.value === 'link' ? 'notes.shareCopyFailed' : 'notes.shareDownloadFailed'));
  } finally {
    shareSubmitting.value = false;
  }
}

</script>

<style scoped>
.panel {
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  overflow: hidden;
}

.editor-panel {
  position: relative;
  height: 100%;
  min-height: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-content,
.editor-loading,
.editor-main-stack {
  display: flex;
  flex-direction: column;
}

.editor-content,
.editor-loading {
  gap: 0;
  height: 100%;
  min-height: 0;
}

.editor-workbench {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: stretch;
}

.editor-main-stack {
  flex: 1;
  min-width: 0;
  min-height: 0;
}

.editor-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(0, 0.92fr);
  gap: 0;
  min-height: 0;
  flex: 1;
}

.editor-pane,
.preview-pane {
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 0;
  background: var(--editor-pane-surface, color-mix(in srgb, var(--surface-card) 30%, transparent));
  overflow: hidden;
  box-shadow: none;
}

.preview-pane {
  background: var(--preview-pane-surface, color-mix(in srgb, var(--surface-card) 15%, transparent));
  border-left: 1px solid var(--panel-section-border, rgba(255, 255, 255, 0.08));
}

.pane-header {
  padding: 0.85rem 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid var(--panel-section-border, rgba(255, 255, 255, 0.08));
  font-weight: 700;
  background: var(--editor-pane-header-surface, color-mix(in srgb, var(--surface-card) 40%, transparent));
}

.pane-header-main {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.pane-chrome {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
}

.pane-dot {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 0.375rem;
  display: inline-block;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.pane-dot-close {
  background: #ff5f56;
}

.pane-dot-min {
  background: #ffbd2e;
}

.pane-dot-max {
  background: #27c93f;
}

.pane-title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--font-sans);
  font-size: 0.92rem;
}

.pane-header small {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  font-weight: 500;
  color: var(--text-color-secondary);
}

.markdown-editor-shell {
  flex: 1;
  min-height: 0;
  padding: 0.95rem 1rem 0.5rem;
}

.markdown-editor-shell-readonly {
  opacity: 0.78;
}

.markdown-textarea {
  width: 100%;
  height: 100%;
  min-height: 18rem;
  resize: none;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text-color);
  font: inherit;
  font-family: var(--font-sans);
  line-height: 1.8;
  tab-size: 2;
}

.markdown-textarea::placeholder {
  color: color-mix(in srgb, var(--text-color-secondary) 86%, transparent);
}

.share-note-actions,
.share-note-meta-grid {
  display: flex;
}

.toolbar-label {
  font-size: 0.78rem;
  font-family: var(--font-mono);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-color-secondary);
}

.markdown-preview {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 1.25rem;
  line-height: 1.75;
}

.markdown-preview :deep(a) {
  color: var(--primary-color);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.markdown-preview :deep(h1),
.markdown-preview :deep(h2),
.markdown-preview :deep(h3),
.markdown-preview :deep(h4) {
  margin-top: 0;
  letter-spacing: -0.02em;
  font-family: var(--font-sans);
  font-weight: 700;
}

.markdown-preview :deep(blockquote) {
  margin: 1rem 0;
  padding: 0.75rem 1.25rem;
  border-left: 4px solid var(--primary-color);
  border-radius: 0 0.5rem 0.5rem 0;
  background: var(--panel-section-strong, var(--surface-hover));
}

.markdown-preview :deep(pre) {
  margin: 1rem 0;
  padding: 1.25rem;
  border-radius: 0.375rem;
  border: 1px solid var(--panel-section-border, var(--surface-border));
  background: var(--panel-section-strong, var(--surface-card));
  overflow-x: auto;
}

.markdown-preview :deep(code) {
  font-family: var(--font-mono);
  font-size: 0.9em;
  background: var(--panel-section-strong, var(--surface-hover));
  padding: 0.2em 0.4em;
  border-radius: 0.25rem;
}

.markdown-preview :deep(pre code) {
  background: transparent;
  padding: 0;
}

.markdown-preview :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
}

.markdown-preview :deep(th),
.markdown-preview :deep(td) {
  border: 1px solid var(--surface-border);
  padding: 0.75rem 1rem;
  text-align: left;
}

.markdown-preview :deep(img) {
  max-width: 100%;
  border-radius: 0.5rem;
  border: 1px solid var(--surface-border);
}

.markdown-preview :deep(hr) {
  border: 0;
  border-top: 1px solid var(--surface-border);
  margin: 2rem 0;
}

.editor-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 1rem;
  border-top: 1px solid var(--panel-section-border, rgba(255, 255, 255, 0.08));
  background: color-mix(in srgb, var(--panel-section-strong, var(--surface-card)) 94%, transparent);
}

.editor-footer-copy {
  color: var(--text-color-secondary);
  font-size: 0.82rem;
  font-family: var(--font-mono);
}

.editor-empty {
  min-height: 18rem;
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
  padding: 2rem 1.5rem;
  border: 2px dashed var(--panel-section-border, var(--surface-border));
  border-radius: 0.375rem;
  color: var(--text-color-secondary);
  background: var(--panel-empty-surface, var(--surface-ground));
}

.editor-empty-icon {
  font-size: 2.5rem;
  color: var(--text-color-secondary);
  margin-bottom: 0.5rem;
}

.editor-loading-overlay {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.85rem 1rem;
  background: linear-gradient(180deg, color-mix(in srgb, var(--app-panel-strong) 28%, transparent), transparent 70%);
  pointer-events: none;
}

.editor-loading-spinner {
  width: 1.1rem;
  height: 1.1rem;
  border: 2px solid color-mix(in srgb, var(--primary-color) 18%, transparent);
  border-top-color: var(--primary-color);
  border-radius: 999px;
  animation: editor-spin 0.7s linear infinite;
}

@keyframes editor-spin {
  to {
    transform: rotate(360deg);
  }
}

.hidden-file-input {
  display: none;
}

.share-note-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.share-note-control-stack {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.share-note-field {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.share-note-current {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 1rem 1.05rem;
  border: 1px solid color-mix(in srgb, var(--panel-section-border, var(--surface-border)) 88%, transparent);
  background: color-mix(in srgb, var(--panel-section-surface, var(--surface-ground)) 96%, transparent);
}

.share-note-current-icon {
  width: 2.5rem;
  height: 2.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--primary-color) 10%, var(--surface-card));
  color: var(--primary-color);
  flex-shrink: 0;
}

.share-note-current-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
}

.share-note-current-label,
.share-note-current-meta {
  color: var(--text-color-secondary);
  font-size: 0.76rem;
  font-family: var(--font-mono);
  letter-spacing: 0.05em;
}

.share-note-current-title {
  color: var(--text-color);
  font-size: 1rem;
  line-height: 1.45;
  font-weight: 700;
}

.share-note-toggle {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
  gap: 0.45rem;
}

.share-note-toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: 1px solid color-mix(in srgb, var(--panel-section-border, var(--surface-border)) 88%, transparent);
  background: color-mix(in srgb, var(--panel-section-surface, var(--surface-ground)) 96%, transparent);
  color: var(--text-color-secondary);
  min-height: 2.8rem;
  padding: 0.65rem 0.85rem;
  font: inherit;
  cursor: pointer;
  transition: border-color 180ms ease, background-color 180ms ease, color 180ms ease;
}

.share-note-toggle-icon {
  font-size: 0.95rem;
}

.share-note-hint {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.8rem 0.9rem;
  border: 1px dashed color-mix(in srgb, var(--panel-section-border, var(--surface-border)) 82%, transparent);
  background: color-mix(in srgb, var(--panel-section-surface, var(--surface-ground)) 94%, transparent);
  color: var(--text-color-secondary);
  font-size: 0.82rem;
}

.share-note-toggle-btn-active {
  border-color: color-mix(in srgb, var(--primary-color) 55%, var(--surface-border));
  background: color-mix(in srgb, var(--primary-color) 12%, var(--panel-section-surface, var(--surface-ground)));
  color: var(--primary-color);
}

.share-note-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.55rem;
}

@media (max-width: 1180px) {
  .editor-workbench {
    flex-direction: column;
  }
}

@media (max-width: 960px) {
  .editor-grid {
    grid-template-columns: 1fr;
  }

  .preview-pane {
    border-left: 0;
    border-top: 1px solid var(--panel-section-border, rgba(255, 255, 255, 0.08));
  }

  .pane-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .editor-footer {
    align-items: stretch;
  }
}
</style>
