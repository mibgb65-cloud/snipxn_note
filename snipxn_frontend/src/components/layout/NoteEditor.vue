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
        :has-public-share="noteHasPublicShare"
        @update:title="$emit('update:title', $event)"
        @update:language="$emit('update:language', $event)"
        @update:tag-ids="handleTagIdsUpdate"
        @toggle-star="$emit('toggle-star')"
        @delete="$emit('delete')"
        @restore="$emit('restore')"
        @purge="$emit('purge')"
        @upload-image="fileInput?.click()"
        @insert-markdown="handleMarkdownInsert"
        @share-link="handleShareLink"
        @share-markdown="handleShareMarkdown"
        @share-image="handleShareImage"
        @share-community="handleShareCommunity"
        @cancel-share="handleCancelShare"
        @ai-generate="openAiGenerateDialog"
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
                  :style="markdownTextareaStyle"
                  :value="markdownContent"
                  :readonly="isTrashView"
                  :placeholder="t('notes.contentPlaceholder')"
                  @input="handleMarkdownInput"
                  @click="syncSelectionFromEvent"
                  @keyup="syncSelectionFromEvent"
                  @select="syncSelectionFromEvent"
                  @focus="syncSelectionFromEvent"
                  @keydown="handleTextareaKeydown"
                  @scroll="handleTextareaScroll"
                  @dragover.prevent
                  @drop.prevent="handleTextareaDrop"
                  @paste="handleTextareaPaste"
                />
                <transition name="ai-hint-fade">
                  <div
                    v-if="showAiSlashHint"
                    class="ai-slash-hint"
                    :style="{ top: aiHintPos.top + 'px', left: aiHintPos.left + 'px' }"
                  >
                    <i class="pi pi-sparkles" />
                    <span>{{ t('notes.aiSlashPlaceholder') }}</span>
                    <kbd>Enter</kbd>
                  </div>
                </transition>
                <transition name="ai-hint-fade">
                  <div
                    v-if="aiSlashGenerating"
                    class="ai-generating-indicator"
                    :style="{ top: aiGeneratingPos.top + 'px', left: aiGeneratingPos.left + 'px' }"
                  >
                    <i class="pi pi-sparkles" />
                    <span class="ai-generating-dots">
                      <span class="ai-dot" />
                      <span class="ai-dot" />
                      <span class="ai-dot" />
                    </span>
                    <span>{{ t('notes.aiSlashLoading') }}</span>
                  </div>
                </transition>
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
              <div ref="markdownPreviewRef" class="markdown-preview" v-html="previewHtml" @scroll="handlePreviewScroll" />
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
          :reviewing="reviewingCode"
          :review-result="aiReviewResult"
          @toggle="handleToggleCodePanel"
          @insert-code="handleInsertCodeFromRunner"
          @update:code="handleCodeBlockUpdate"
          @update:language="handleCodeBlockLanguageUpdate"
          @update:stdin="handleCodeRunnerStdinUpdate"
          @run="handleRunActiveCode"
          @ai-review="handleAiReview"
        />
      </div>

      <Dialog
        v-model:visible="aiGenerateDialogVisible"
        modal
        :draggable="false"
        :header="t('notes.aiGenerateCode')"
        :style="{ width: 'min(38rem, 94vw)' }"
      >
        <div class="ai-generate-form">
          <div class="ai-generate-field">
            <label class="toolbar-label">{{ t('notes.aiGeneratePrompt') }}</label>
            <textarea
              v-model="aiPrompt"
              class="ai-generate-textarea"
              :style="aiGenerateTextareaStyle"
              :placeholder="t('notes.aiGeneratePromptPlaceholder')"
              rows="3"
            />
          </div>

          <div v-if="aiGenerateResult" class="ai-generate-result">
            <div class="ai-generate-result-head">{{ t('notes.aiGenerateResult') }}</div>
            <div class="ai-generate-result-body" v-html="aiGenerateResult" />
          </div>

          <div class="ai-generate-actions">
            <Button
              type="button"
              text
              severity="secondary"
              :label="t('common.cancel')"
              @click="aiGenerateDialogVisible = false"
            />
            <Button
              v-if="aiGenerateResult"
              type="button"
              icon="pi pi-arrow-down-left"
              :label="t('notes.aiInsertCode')"
              @click="handleInsertAiResult"
            />
            <Button
              type="button"
              icon="pi pi-sparkles"
              severity="help"
              :label="generatingCode ? t('notes.aiGenerating') : t('notes.aiGenerateCode')"
              :loading="generatingCode"
              :disabled="!aiPrompt.trim()"
              @click="handleAiGenerate"
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
      <Button v-if="!isTrashView" class="mt-4" icon="pi pi-plus" :label="t('notes.newNoteAction')" @click="$emit('create-note')" />
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
import { reviewCode as apiReviewCode, generateCode as apiGenerateCode } from '../../api/ai';
import { shareNote as apiShareNote, cancelShare as apiCancelShare, checkShare as apiCheckShare } from '../../api/note';
import { uploadFile } from '../../api/file';
import { renderMarkdown } from '../../utils/markdown';
import { buildNoteShareFileStem, createNoteShareImageBlob, summarizeNoteShareContent } from '../../utils/noteShare';
import { useTheme } from '../../composables/useTheme';
import { useCommunityStore } from '../../stores/community';
import { useNoteStore } from '../../stores/note';
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
const noteStore = useNoteStore();

const markdownTextareaRef = ref(null);
const markdownPreviewRef = ref(null);
const fileInput = ref(null);
let scrollSyncSource = null;
const selectionStart = ref(0);
const selectionEnd = ref(0);
const pendingSelection = ref(null);
const noteHasPublicShare = ref(false);
const codePanelExpanded = ref(false);
const runningCode = ref(false);
const codeRunnerStdin = ref('');
const codeRunResult = ref(null);
const reviewingCode = ref(false);
const aiReviewResult = ref('');
const generatingCode = ref(false);
const aiGenerateResult = ref('');
const aiGenerateRawContent = ref('');
const aiPrompt = ref('');
const aiGenerateDialogVisible = ref(false);
const showAiSlashHint = ref(false);
const aiHintPos = ref({ top: 0, left: 0 });
const aiHintCharPos = ref(0);
const aiSlashGenerating = ref(false);
const aiGeneratingPos = ref({ top: 0, left: 0 });
const aiGeneratingCharPos = ref(0);

const monacoTheme = computed(() => (isDarkTheme.value ? 'vs-dark' : 'vs'));
const markdownTextareaStyle = computed(() => (
  isDarkTheme.value
    ? {
        color: '#e6f0fa',
        WebkitTextFillColor: '#e6f0fa',
        caretColor: '#5eead4',
      }
    : {}
));
const aiGenerateTextareaStyle = computed(() => (
  isDarkTheme.value
    ? {
        color: '#e6f0fa',
        WebkitTextFillColor: '#e6f0fa',
        caretColor: '#5eead4',
      }
    : {}
));
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
const shareImageSummary = computed(() => (
  summarizeNoteShareContent(shareSourceContent.value || markdownContent.value)
));
const shareFileStem = computed(() => buildNoteShareFileStem(resolvedShareTitle.value));

watch(
  () => props.note?.id,
  async (noteId) => {
    selectionStart.value = 0;
    selectionEnd.value = 0;
    pendingSelection.value = null;
    codeRunnerStdin.value = '';
    codeRunResult.value = null;
    aiReviewResult.value = '';
    aiGenerateResult.value = '';
    aiGenerateRawContent.value = '';
    aiPrompt.value = '';
    aiGenerateDialogVisible.value = false;
    noteHasPublicShare.value = false;

    if (noteId) {
      try {
        const res = await apiCheckShare(noteId);
        noteHasPublicShare.value = !!(res?.data?.shareToken);
      } catch {
        noteHasPublicShare.value = false;
      }
    }
  },
  { immediate: true },
);

watch(
  () => `${activeCodeBlock.value?.fenceStart ?? 'none'}:${activeCodeBlock.value?.fenceEnd ?? 'none'}`,
  () => {
    codeRunResult.value = null;
    aiReviewResult.value = '';
    aiGenerateResult.value = '';
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

  // Dismiss AI slash hint when cursor moves away from /ai line
  if (showAiSlashHint.value) {
    const ta = event.target;
    const pos = ta.selectionStart;
    const val = ta.value;
    const lnStart = val.lastIndexOf('\n', Math.max(0, pos - 1)) + 1;
    const lineText = val.slice(lnStart, pos);
    if (lineText !== '/ai' && lineText !== '/ai ') {
      showAiSlashHint.value = false;
    }
  }
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

async function handleTagIdsUpdate(newTagIds) {
  if (!props.note?.id || props.isTrashView) {
    return;
  }

  const nextTagIds = Array.isArray(newTagIds)
    ? newTagIds.map((tagId) => String(tagId))
    : [];
  const previousTagIds = Array.isArray(props.note?.tagIds)
    ? props.note.tagIds.map((tagId) => String(tagId))
    : [];

  if (JSON.stringify(nextTagIds) === JSON.stringify(previousTagIds)) {
    return;
  }

  if (noteStore.currentNote?.id === props.note.id) {
    noteStore.currentNote = {
      ...noteStore.currentNote,
      tagIds: nextTagIds,
    };
  }

  const noteIndex = noteStore.notes.findIndex((item) => item.id === props.note.id);

  if (noteIndex !== -1) {
    noteStore.notes[noteIndex] = {
      ...noteStore.notes[noteIndex],
      tagIds: nextTagIds,
    };
  }

  try {
    await noteStore.saveCurrentNote({ tagIds: nextTagIds });
  } catch (error) {
    if (noteStore.currentNote?.id === props.note.id) {
      noteStore.currentNote = {
        ...noteStore.currentNote,
        tagIds: previousTagIds,
      };
    }

    if (noteIndex !== -1) {
      noteStore.notes[noteIndex] = {
        ...noteStore.notes[noteIndex],
        tagIds: previousTagIds,
      };
    }

    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: error?.message || t('notes.saveFailed'),
      life: 3000,
    });
  }
}

function getCaretCoordinates(ta, position) {
  const mirror = document.createElement('div');
  const style = getComputedStyle(ta);
  const props = [
    'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing',
    'wordSpacing', 'textIndent', 'whiteSpace', 'wordWrap', 'overflowWrap',
    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
    'boxSizing',
  ];
  mirror.style.position = 'absolute';
  mirror.style.visibility = 'hidden';
  mirror.style.overflow = 'hidden';
  mirror.style.width = `${ta.offsetWidth}px`;
  for (const p of props) mirror.style[p] = style[p];

  const text = ta.value.substring(0, position);
  mirror.textContent = text;

  const span = document.createElement('span');
  span.textContent = ta.value.substring(position) || '.';
  mirror.appendChild(span);
  document.body.appendChild(mirror);

  const top = span.offsetTop - ta.scrollTop;
  const left = span.offsetLeft;
  document.body.removeChild(mirror);
  return { top, left };
}

function updateAiGeneratingPosition() {
  const ta = markdownTextareaRef.value;
  if (!ta) return;
  const coords = getCaretCoordinates(ta, aiGeneratingCharPos.value);
  const lineHeight = parseFloat(getComputedStyle(ta).lineHeight) || 20;
  aiGeneratingPos.value = { top: coords.top + lineHeight + 4, left: coords.left };
}

function handleTextareaScroll() {
  if (aiSlashGenerating.value) {
    updateAiGeneratingPosition();
  }
  if (showAiSlashHint.value) {
    const ta = markdownTextareaRef.value;
    if (!ta) return;
    const coords = getCaretCoordinates(ta, aiHintCharPos.value);
    const lineHeight = parseFloat(getComputedStyle(ta).lineHeight) || 20;
    aiHintPos.value = { top: coords.top + lineHeight + 4, left: coords.left };
  }

  // Sync scroll to preview
  if (scrollSyncSource === 'preview') return;
  scrollSyncSource = 'editor';
  const ta = markdownTextareaRef.value;
  const pv = markdownPreviewRef.value;
  if (ta && pv) {
    const maxScroll = ta.scrollHeight - ta.clientHeight;
    const ratio = maxScroll > 0 ? ta.scrollTop / maxScroll : 0;
    pv.scrollTop = ratio * (pv.scrollHeight - pv.clientHeight);
  }
  requestAnimationFrame(() => { scrollSyncSource = null; });
}

function handlePreviewScroll() {
  if (scrollSyncSource === 'editor') return;
  scrollSyncSource = 'preview';
  const ta = markdownTextareaRef.value;
  const pv = markdownPreviewRef.value;
  if (ta && pv) {
    const maxScroll = pv.scrollHeight - pv.clientHeight;
    const ratio = maxScroll > 0 ? pv.scrollTop / maxScroll : 0;
    ta.scrollTop = ratio * (ta.scrollHeight - ta.clientHeight);
  }
  requestAnimationFrame(() => { scrollSyncSource = null; });
}

function handleMarkdownInput(event) {
  syncSelectionFromEvent(event);
  emit('update:content', event.target.value);

  const ta = event.target;
  const pos = ta.selectionStart;
  const val = ta.value;
  const lnStart = val.lastIndexOf('\n', Math.max(0, pos - 1)) + 1;
  const lineText = val.slice(lnStart, pos);

  const isAiSlash = lineText === '/ai' || lineText === '/ai ';
  showAiSlashHint.value = isAiSlash;

  if (isAiSlash) {
    aiHintCharPos.value = pos;
    const coords = getCaretCoordinates(ta, pos);
    const lineHeight = parseFloat(getComputedStyle(ta).lineHeight) || 20;
    aiHintPos.value = { top: coords.top + lineHeight + 4, left: coords.left };
  }
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

function sanitizeFenceLanguage(language) {
  return String(language ?? '')
    .replace(/[`]/g, '')
    .replace(/\r?\n/g, '')
    .trim();
}

function handleCodeBlockUpdate(nextCode) {
  if (!activeCodeBlock.value || props.isTrashView) {
    return;
  }

  const block = activeCodeBlock.value;
  const normalizedCode = nextCode.replace(/\r\n/g, '\n');
  const nextBody = normalizedCode ? `${normalizedCode}\n` : '';
  const nextContent = `${markdownContent.value.slice(0, block.bodyStart)}${nextBody}${markdownContent.value.slice(block.bodyEnd)}`;
  const nextCursor = Math.min(block.bodyStart + nextBody.length, nextContent.length);

  codeRunResult.value = null;
  emitContent(nextContent, { start: nextCursor, end: nextCursor }, false);
}

function handleCodeBlockLanguageUpdate(nextLanguage) {
  if (!activeCodeBlock.value || props.isTrashView) {
    return;
  }

  const block = activeCodeBlock.value;
  const normalizedLanguage = sanitizeFenceLanguage(nextLanguage);
  const openingFence = markdownContent.value.slice(block.fenceStart, block.bodyStart);
  const lineBreak = openingFence.endsWith('\r\n') ? '\r\n' : '\n';
  const nextOpeningFence = `\`\`\`${normalizedLanguage}${lineBreak}`;

  if (openingFence === nextOpeningFence) {
    return;
  }

  const nextContent = `${markdownContent.value.slice(0, block.fenceStart)}${nextOpeningFence}${markdownContent.value.slice(block.bodyStart)}`;
  const delta = nextOpeningFence.length - openingFence.length;
  const nextFenceTextEnd = block.fenceStart + nextOpeningFence.length - lineBreak.length;
  const shiftSelectionPosition = (position) => {
    if (position <= block.fenceStart) {
      return position;
    }

    if (position < block.bodyStart) {
      return Math.min(block.fenceStart + (position - block.fenceStart), nextFenceTextEnd);
    }

    return Math.min(position + delta, nextContent.length);
  };

  codeRunResult.value = null;
  emitContent(nextContent, {
    start: shiftSelectionPosition(selectionStart.value),
    end: shiftSelectionPosition(selectionEnd.value),
  }, false);
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

async function handleAiReview() {
  if (!activeCodeBlock.value || !codeRunResult.value?.stderr) {
    return;
  }

  reviewingCode.value = true;

  try {
    const res = await apiReviewCode({
      code: activeCodeBlock.value.code || '',
      errorMessage: codeRunResult.value.stderr,
      language: activeCodeBlock.value.language || activeCodeBlock.value.editorLanguage || '',
    });

    aiReviewResult.value = renderMarkdown(res.data?.content || '');
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: error?.message || 'AI review failed',
      life: 3000,
    });
  } finally {
    reviewingCode.value = false;
  }
}

function openAiGenerateDialog() {
  if (props.isTrashView) {
    return;
  }

  aiGenerateResult.value = '';
  aiGenerateRawContent.value = '';
  aiGenerateDialogVisible.value = true;
}

async function handleAiGenerate() {
  if (!aiPrompt.value.trim()) {
    return;
  }

  generatingCode.value = true;

  try {
    const language = activeCodeBlock.value?.language
      || activeCodeBlock.value?.editorLanguage
      || String(props.note?.primaryLanguage || '').trim()
      || '';

    const res = await apiGenerateCode({
      description: aiPrompt.value.trim(),
      language,
    });

    const raw = res.data?.content || '';
    aiGenerateRawContent.value = raw;
    aiGenerateResult.value = renderMarkdown(raw);
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: error?.message || 'AI generation failed',
      life: 3000,
    });
  } finally {
    generatingCode.value = false;
  }
}

function handleInsertAiResult() {
  if (!aiGenerateRawContent.value) {
    return;
  }

  syncSelectionFromElement();
  replaceSelection({ text: aiGenerateRawContent.value });
  aiGenerateDialogVisible.value = false;

  toast.add({
    severity: 'success',
    summary: t('common.success'),
    detail: t('notes.aiInsertSuccess'),
    life: 2500,
  });
}

async function handleTextareaKeydown(event) {
  if (event.key !== 'Enter' || props.isTrashView) return;

  const ta = event.target;
  const pos = ta.selectionStart;
  const content = markdownContent.value;

  const lineStart = content.lastIndexOf('\n', Math.max(0, pos - 1)) + 1;
  let lineEnd = content.indexOf('\n', pos);
  if (lineEnd === -1) lineEnd = content.length;

  const lineText = content.slice(lineStart, lineEnd);
  const match = lineText.match(/^\/ai\s+(.+)/);
  if (!match) return;

  const prompt = match[1].trim();
  if (!prompt) return;

  event.preventDefault();
  showAiSlashHint.value = false;
  const language = activeCodeBlock.value?.language
    || activeCodeBlock.value?.editorLanguage
    || String(props.note?.primaryLanguage || '').trim()
    || '';

  // Remove the /ai ... line
  const insertPos = lineStart;
  replaceSelection({
    start: lineStart,
    end: lineEnd,
    text: '',
    nextStart: insertPos,
    nextEnd: insertPos,
  });

  // Show loading animation, calculate position after DOM updates
  aiGeneratingCharPos.value = insertPos;
  aiSlashGenerating.value = true;
  await nextTick();
  updateAiGeneratingPosition();

  try {
    const res = await apiGenerateCode({ description: prompt, language });
    const raw = res.data?.content || '';

    // Hide loading animation
    aiSlashGenerating.value = false;

    // Typewriter effect: insert characters incrementally
    if (raw) {
      const charsPerTick = 4;
      const tickInterval = 18;
      let charIndex = 0;

      await new Promise((resolve) => {
        const timer = setInterval(() => {
          const end = Math.min(charIndex + charsPerTick, raw.length);
          const chunk = raw.slice(charIndex, end);
          charIndex = end;

          const currentPos = insertPos + charIndex - chunk.length;
          replaceSelection({
            start: currentPos,
            end: currentPos,
            text: chunk,
            nextStart: currentPos + chunk.length,
            nextEnd: currentPos + chunk.length,
          });

          if (charIndex >= raw.length) {
            clearInterval(timer);
            resolve();
          }
        }, tickInterval);
      });
    }
  } catch (error) {
    aiSlashGenerating.value = false;
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: error?.message || 'AI generation failed',
      life: 3000,
    });
  }
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
  toast.add({ severity: 'success', summary: t('common.success'), detail, life: 2600 });
}

function showShareError(error, fallbackMessage) {
  toast.add({ severity: 'error', summary: t('common.error'), detail: error?.message || fallbackMessage, life: 3200 });
}

async function handleShareLink() {
  if (!props.note?.id) return;
  try {
    const res = await apiShareNote(props.note.id);
    const token = res.data?.shareToken;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    await copyTextToClipboard(`${origin}/share/${token}`);
    noteHasPublicShare.value = true;
    showShareSuccess(t('notes.shareCopySuccess'));
  } catch (error) {
    showShareError(error, t('notes.shareCopyFailed'));
  }
}

async function handleShareMarkdown() {
  if (!props.note) return;
  try {
    downloadTextFile(shareSourceContent.value, `${shareFileStem.value}.md`, 'text/markdown;charset=utf-8');
    showShareSuccess(t('notes.shareDownloadSuccess'));
  } catch (error) {
    showShareError(error, t('notes.shareDownloadFailed'));
  }
}

async function handleShareImage() {
  if (!props.note) return;
  try {
    const { blob } = await buildShareImageAsset();
    downloadBlob(blob, `${shareFileStem.value}.png`);
    showShareSuccess(t('notes.shareDownloadSuccess'));
  } catch (error) {
    showShareError(error, t('notes.shareDownloadFailed'));
  }
}

async function handleShareCommunity() {
  if (!props.note) return;
  if (!shareSourceContent.value.trim()) {
    toast.add({ severity: 'error', summary: t('common.error'), detail: t('community.contentRequired'), life: 3000 });
    return;
  }
  try {
    const res = await communityStore.createPost({
      title: resolvedShareTitle.value,
      content: shareSourceContent.value,
      language: shareSourceLanguage.value || undefined,
      tags: shareSourceTags.value,
      originNoteId: props.note?.id || undefined,
    });
    showShareSuccess(t('community.publishSuccess'));
    if (res?.data?.id) {
      await router.push(`/community/${res.data.id}`);
    } else {
      await router.push('/community');
    }
  } catch (error) {
    showShareError(error, t('community.publishFailed'));
  }
}

async function handleCancelShare() {
  if (!props.note?.id) return;
  try {
    await apiCancelShare(props.note.id);
    noteHasPublicShare.value = false;
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('notes.shareCancelSuccess'),
      life: 3000,
    });
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: err?.message || t('common.error'),
      life: 3000,
    });
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
  color: var(--text-color);
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
  border: 1px solid var(--app-border);
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
  position: relative;
  flex: 1;
  min-height: 0;
  padding: 0.95rem 1rem 0.5rem;
  color: var(--text-color);
}

.ai-slash-hint {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 1rem;
  background: color-mix(in srgb, var(--app-panel-raised) 98%, transparent);
  border: 1px solid var(--app-border);
  border-radius: 0.5rem;
  color: var(--text-color-secondary);
  font-size: 0.82rem;
  box-shadow: var(--app-shadow-soft);
  pointer-events: none;
  white-space: nowrap;
  z-index: 5;
}

.ai-slash-hint .pi {
  color: var(--primary-color);
  font-size: 0.9rem;
}

.ai-slash-hint kbd {
  padding: 0.1rem 0.4rem;
  background: color-mix(in srgb, var(--app-panel-inset) 96%, transparent);
  border: 1px solid var(--app-border);
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-family: inherit;
  color: var(--text-color-secondary);
}

.ai-hint-fade-enter-active,
.ai-hint-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.ai-hint-fade-enter-from,
.ai-hint-fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

.ai-generating-indicator {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 1rem;
  background: color-mix(in srgb, var(--app-panel-raised) 98%, transparent);
  border: 1px solid var(--app-border);
  border-radius: 0.5rem;
  color: var(--text-color-secondary);
  font-size: 0.82rem;
  box-shadow: var(--app-shadow-soft);
  pointer-events: none;
  white-space: nowrap;
  z-index: 5;
}

.ai-generating-indicator .pi {
  color: var(--primary-color);
  font-size: 0.9rem;
  animation: ai-sparkle-pulse 1.5s ease-in-out infinite;
}

.ai-generating-dots {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
}

.ai-dot {
  display: inline-block;
  width: 0.38rem;
  height: 0.38rem;
  border-radius: 50%;
  background: var(--primary-color);
  animation: ai-dot-bounce 1.2s ease-in-out infinite;
}

.ai-dot:nth-child(2) {
  animation-delay: 0.15s;
}

.ai-dot:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes ai-dot-bounce {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-0.35rem);
    opacity: 1;
  }
}

@keyframes ai-sparkle-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.markdown-editor-shell-readonly {
  opacity: 0.78;
}

.markdown-textarea {
  width: 100%;
  height: 100%;
  min-height: 18rem;
  resize: none;
  appearance: none;
  -webkit-appearance: none;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text-color) !important;
  -webkit-text-fill-color: currentColor;
  caret-color: var(--primary-color);
  font: inherit;
  font-family: var(--font-sans);
  line-height: 1.8;
  tab-size: 2;
}

.markdown-textarea::placeholder {
  color: color-mix(in srgb, var(--text-color-secondary) 86%, transparent);
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
  color: var(--text-color);
  line-height: 1.75;
}

.markdown-preview :deep(p),
.markdown-preview :deep(li),
.markdown-preview :deep(ol),
.markdown-preview :deep(ul),
.markdown-preview :deep(strong),
.markdown-preview :deep(em),
.markdown-preview :deep(span),
.markdown-preview :deep(td),
.markdown-preview :deep(th) {
  color: inherit;
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

}

.ai-generate-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.ai-generate-field {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.ai-generate-textarea {
  min-height: 5rem;
  padding: 0.8rem 0.9rem;
  border: 1px solid color-mix(in srgb, var(--panel-section-border, var(--surface-border)) 86%, transparent);
  background: color-mix(in srgb, var(--panel-section-strong, var(--surface-card)) 96%, transparent);
  resize: vertical;
  font: inherit;
  line-height: 1.6;
  color: var(--text-color);
  -webkit-text-fill-color: currentColor;
  caret-color: var(--primary-color);
  border-radius: 0.5rem;
}

:global(html.app-dark) .markdown-textarea,
:global(html.app-dark) .ai-generate-textarea,
:global(html.app-dark) .markdown-editor-shell,
:global(html.app-dark) .editor-pane,
:global(html.app-dark) .preview-pane,
:global(html.app-dark) .markdown-preview {
  color: #e6f0fa !important;
  -webkit-text-fill-color: #e6f0fa !important;
}

:global(html.app-dark) .markdown-editor-shell .markdown-textarea {
  color: #e6f0fa !important;
  -webkit-text-fill-color: #e6f0fa !important;
  caret-color: #5eead4 !important;
  text-shadow: 0 0 0 #e6f0fa;
}

.ai-generate-result {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.ai-generate-result-head {
  font-size: 0.72rem;
  font-family: var(--font-mono);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-color-secondary);
}

.ai-generate-result-body {
  padding: 0.85rem 0.9rem;
  border: 1px solid color-mix(in srgb, var(--panel-section-border, var(--surface-border)) 86%, transparent);
  background: color-mix(in srgb, var(--panel-section-strong, var(--surface-card)) 96%, transparent);
  border-radius: 0.5rem;
  font-size: 0.84rem;
  line-height: 1.7;
  color: var(--text-color);
  overflow: auto;
  max-height: 20rem;
}

.ai-generate-result-body :deep(pre) {
  margin: 0.5rem 0;
  padding: 0.65rem 0.8rem;
  border-radius: 0.4rem;
  background: color-mix(in srgb, var(--panel-section-surface, var(--surface-ground)) 96%, transparent);
  font-family: var(--font-mono);
  font-size: 0.8rem;
  line-height: 1.6;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

.ai-generate-result-body :deep(code) {
  font-family: var(--font-mono);
  font-size: 0.82rem;
}

.ai-generate-result-body :deep(p) {
  margin: 0.35rem 0;
}

.ai-generate-result-body :deep(ol),
.ai-generate-result-body :deep(ul) {
  padding-left: 1.4rem;
  margin: 0.35rem 0;
}

.ai-generate-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.55rem;
}
</style>
