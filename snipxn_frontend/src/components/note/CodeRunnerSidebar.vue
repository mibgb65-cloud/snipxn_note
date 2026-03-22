<template>
  <aside
    ref="shellRef"
    class="code-runner-shell"
    :class="{ 'code-runner-shell-expanded': expanded }"
    :aria-expanded="expanded"
    :style="shellStyle"
  >
    <button
      type="button"
      class="code-runner-rail"
      :class="{ 'code-runner-rail-active': expanded }"
      :aria-label="expanded ? t('notes.codePanelClose') : t('notes.codePanelOpen')"
      :title="expanded ? t('notes.codePanelClose') : t('notes.codePanelOpen')"
      @click="$emit('toggle')"
    >
      <i class="pi code-runner-rail-icon" :class="expanded ? 'pi-angle-double-right' : 'pi-code'" />
      <span v-if="!expanded" class="code-runner-rail-label">{{ t('notes.codeRunner') }}</span>
    </button>

    <div
      v-if="expanded && isDesktopResizable"
      class="code-runner-resizer"
      :class="{ 'code-runner-resizer-active': isResizing }"
      role="separator"
      aria-orientation="vertical"
      :aria-label="t('notes.codeRunner')"
      @pointerdown="startResize"
    />

    <div class="code-runner-panel">
      <div class="code-runner-header">
        <div class="code-runner-header-copy">
          <div class="code-runner-title">{{ t('notes.codeRunner') }}</div>
          <p class="code-runner-description">
            {{ t('notes.codeRunnerDescription') }}
          </p>
        </div>

        <Button
          icon="pi pi-plus"
          text
          rounded
          size="small"
          :disabled="readOnly"
          :aria-label="t('notes.insertCodeBlock')"
          :title="t('notes.insertCodeBlock')"
          @click="$emit('insert-code')"
        />
      </div>

      <div class="code-runner-meta">
        <span class="code-runner-chip">
          {{ activeCodeBlock?.editorLanguage || t('notes.codeRunnerInactive') }}
        </span>
        <span class="code-runner-chip code-runner-chip-muted">{{ t('notes.codeRunnerScope') }}</span>
      </div>

      <div class="code-runner-editor-section">
        <div class="code-runner-section-head">
          <span>{{ t('notes.codeBlockEditor') }}</span>
        </div>

        <div v-if="activeCodeBlock" class="code-runner-editor-shell">
          <MonacoEditor
            :key="`${activeCodeBlock.fenceStart}-${activeCodeBlock.fenceEnd}`"
            :model-value="activeCodeBlock.code"
            :language="activeCodeBlock.editorLanguage"
            :theme="theme"
            :read-only="readOnly"
            class="code-runner-editor"
            @update:model-value="$emit('update:code', $event)"
          />
        </div>

        <div v-else class="code-runner-empty">
          <i class="pi pi-code" aria-hidden="true" />
          <span>{{ t('notes.codeRunnerEmpty') }}</span>
        </div>
      </div>

      <div class="code-runner-stdin">
        <label class="code-runner-label" for="code-runner-stdin">{{ t('notes.stdin') }}</label>
        <textarea
          id="code-runner-stdin"
          class="code-runner-stdin-input"
          :value="stdin"
          :placeholder="t('notes.stdinPlaceholder')"
          @input="$emit('update:stdin', $event.target.value)"
        />
      </div>

      <div class="code-runner-actions">
        <Button
          icon="pi pi-play"
          :label="running ? t('notes.runningCode') : t('notes.runCode')"
          :loading="running"
          :disabled="!activeCodeBlock"
          @click="$emit('run')"
        />
      </div>

      <div class="code-runner-output">
        <div class="code-runner-section-head">
          <span>{{ t('notes.runResult') }}</span>
          <span v-if="statusLabel" class="code-runner-status">{{ statusLabel }}</span>
        </div>

        <div v-if="result" class="code-runner-output-body">
          <div class="code-runner-output-block">
            <span class="code-runner-label">{{ t('notes.stdout') }}</span>
            <pre>{{ result.stdout || t('notes.runNoOutput') }}</pre>
          </div>

          <div v-if="result.stderr" class="code-runner-output-block code-runner-output-block-error">
            <span class="code-runner-label">{{ t('notes.stderr') }}</span>
            <pre>{{ result.stderr }}</pre>
          </div>

          <div class="code-runner-metrics">
            <span v-if="result.time != null">{{ t('notes.runTimeValue', { time: result.time }) }}</span>
            <span v-if="result.memory != null">{{ t('notes.runMemoryValue', { memory: result.memory }) }}</span>
            <span>{{ result.source === 'sandbox' ? t('notes.runSourceSandbox') : t('notes.runSourceBrowser') }}</span>
          </div>
        </div>

        <div v-else class="code-runner-output-empty">
          {{ t('notes.runIdleDescription') }}
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Button from 'primevue/button';
import MonacoEditor from '../editor/MonacoEditor.vue';

const DESKTOP_BREAKPOINT = 1180;
const DEFAULT_PANEL_WIDTH = 520;
const MIN_PANEL_WIDTH = 420;
const MAX_PANEL_WIDTH = 760;

const props = defineProps({
  expanded: {
    type: Boolean,
    default: false,
  },
  activeCodeBlock: {
    type: Object,
    default: null,
  },
  theme: {
    type: String,
    default: 'vs',
  },
  readOnly: {
    type: Boolean,
    default: false,
  },
  running: {
    type: Boolean,
    default: false,
  },
  result: {
    type: Object,
    default: null,
  },
  stdin: {
    type: String,
    default: '',
  },
});

defineEmits(['toggle', 'insert-code', 'update:code', 'update:stdin', 'run']);

const { t } = useI18n();
const shellRef = ref(null);
const viewportWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1440);
const panelWidth = ref(DEFAULT_PANEL_WIDTH);
const isResizing = ref(false);
const hasCustomWidth = ref(false);

const resizeState = {
  startX: 0,
  startWidth: DEFAULT_PANEL_WIDTH,
};

const isDesktopResizable = computed(() => viewportWidth.value > DESKTOP_BREAKPOINT);
const statusLabel = computed(() => {
  if (props.running) {
    return t('notes.runningCode');
  }

  if (!props.result) {
    return '';
  }

  return props.result.status === 'success'
    ? t('notes.runStatusSuccess')
    : t('notes.runStatusError');
});
const shellStyle = computed(() => {
  if (!props.expanded || !isDesktopResizable.value) {
    return null;
  }

  const width = clampPanelWidth(panelWidth.value);

  return {
    flexBasis: `${width}px`,
    width: `${width}px`,
    minWidth: `${width}px`,
    maxWidth: `${width}px`,
  };
});

function getPanelBounds() {
  const parentWidth = shellRef.value?.parentElement?.getBoundingClientRect().width || viewportWidth.value || 1440;
  const maxWidth = Math.max(
    MIN_PANEL_WIDTH,
    Math.min(MAX_PANEL_WIDTH, Math.floor(parentWidth * 0.62)),
  );
  const defaultWidth = Math.min(
    maxWidth,
    Math.max(MIN_PANEL_WIDTH, Math.floor(parentWidth * 0.5)),
  );

  return {
    maxWidth,
    defaultWidth,
  };
}

function clampPanelWidth(width) {
  const { maxWidth } = getPanelBounds();
  return Math.min(maxWidth, Math.max(MIN_PANEL_WIDTH, Math.round(width)));
}

function syncPanelWidth(forceDefault = false) {
  if (!isDesktopResizable.value) {
    return;
  }

  const { defaultWidth } = getPanelBounds();
  panelWidth.value = clampPanelWidth(forceDefault || !hasCustomWidth.value ? defaultWidth : panelWidth.value);
}

function handleViewportResize() {
  if (typeof window === 'undefined') {
    return;
  }

  viewportWidth.value = window.innerWidth;
  syncPanelWidth(false);
}

function handleResizeMove(event) {
  if (!isResizing.value) {
    return;
  }

  const delta = resizeState.startX - event.clientX;
  panelWidth.value = clampPanelWidth(resizeState.startWidth + delta);
}

function stopResize() {
  if (!isResizing.value || typeof window === 'undefined') {
    return;
  }

  isResizing.value = false;
  window.removeEventListener('pointermove', handleResizeMove);
  window.removeEventListener('pointerup', stopResize);
  window.removeEventListener('pointercancel', stopResize);
}

function startResize(event) {
  if (!props.expanded || !isDesktopResizable.value || typeof window === 'undefined') {
    return;
  }

  hasCustomWidth.value = true;
  isResizing.value = true;
  resizeState.startX = event.clientX;
  resizeState.startWidth = panelWidth.value;
  window.addEventListener('pointermove', handleResizeMove);
  window.addEventListener('pointerup', stopResize);
  window.addEventListener('pointercancel', stopResize);
  event.preventDefault();
}

watch(() => props.expanded, (expanded) => {
  if (!expanded) {
    stopResize();
    return;
  }

  syncPanelWidth(!hasCustomWidth.value);
}, { immediate: true });

onMounted(() => {
  if (typeof window === 'undefined') {
    return;
  }

  syncPanelWidth(true);
  window.addEventListener('resize', handleViewportResize);
});

onBeforeUnmount(() => {
  if (typeof window === 'undefined') {
    return;
  }

  stopResize();
  window.removeEventListener('resize', handleViewportResize);
});
</script>

<style scoped>
.code-runner-shell {
  position: relative;
  display: flex;
  flex: 0 0 3.5rem;
  width: 3.5rem;
  min-width: 3.5rem;
  max-width: 3.5rem;
  min-height: 0;
  border-left: 1px solid var(--panel-section-border, var(--surface-border));
  background: color-mix(in srgb, var(--panel-section-surface, var(--surface-ground)) 94%, transparent);
  overflow: hidden;
  transition: flex-basis 220ms ease, width 220ms ease, min-width 220ms ease, max-width 220ms ease;
}

.code-runner-shell-expanded {
  flex-basis: 32rem;
  width: 32rem;
  min-width: 32rem;
  max-width: 32rem;
}

.code-runner-rail {
  width: 3.5rem;
  min-width: 3.5rem;
  border: 0;
  border-right: 1px solid var(--panel-section-border, var(--surface-border));
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--primary-color) 14%, var(--panel-section-strong, var(--surface-card))) 0%,
      color-mix(in srgb, var(--primary-color) 6%, var(--panel-section-strong, var(--surface-card))) 100%
    );
  color: color-mix(in srgb, var(--primary-color) 48%, var(--text-color));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
  cursor: pointer;
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--primary-color) 18%, var(--panel-section-border, var(--surface-border))),
    inset 3px 0 0 color-mix(in srgb, var(--primary-color) 34%, transparent);
  transition: background-color 180ms ease, color 180ms ease, box-shadow 180ms ease, transform 180ms ease;
}

.code-runner-rail:hover,
.code-runner-rail:focus-visible,
.code-runner-rail-active {
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--primary-color) 22%, var(--panel-section-strong, var(--surface-card))) 0%,
      color-mix(in srgb, var(--primary-color) 12%, var(--panel-section-strong, var(--surface-card))) 100%
    );
  color: color-mix(in srgb, var(--primary-color) 84%, var(--text-color));
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--primary-color) 36%, var(--panel-section-border, var(--surface-border))),
    inset 4px 0 0 color-mix(in srgb, var(--primary-color) 58%, transparent);
  transform: translateX(-1px);
}

.code-runner-rail-icon {
  font-size: 1rem;
}

.code-runner-rail-label {
  writing-mode: vertical-rl;
  text-orientation: upright;
  font-size: 0.74rem;
  font-family: var(--font-mono);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.code-runner-resizer {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 0.9rem;
  cursor: col-resize;
  z-index: 3;
  touch-action: none;
}

.code-runner-resizer::before {
  content: '';
  position: absolute;
  top: 1rem;
  bottom: 1rem;
  left: 50%;
  width: 2px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--panel-section-border, var(--surface-border)) 92%, transparent);
  transform: translateX(-50%);
  transition: background-color 180ms ease, width 180ms ease;
}

.code-runner-shell-expanded:hover .code-runner-resizer::before,
.code-runner-resizer-active::before {
  width: 3px;
  background: color-mix(in srgb, var(--primary-color) 42%, var(--panel-section-border, var(--surface-border)));
}

.code-runner-panel {
  flex: 1;
  min-width: 0;
  min-height: 0;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  opacity: 0;
  pointer-events: none;
  transform: translateX(0.75rem);
  transition: opacity 180ms ease, transform 180ms ease;
}

.code-runner-shell-expanded .code-runner-panel {
  opacity: 1;
  pointer-events: auto;
  transform: none;
}

.code-runner-header,
.code-runner-section-head,
.code-runner-actions,
.code-runner-metrics,
.code-runner-meta {
  display: flex;
  align-items: center;
}

.code-runner-header,
.code-runner-section-head,
.code-runner-actions {
  justify-content: space-between;
}

.code-runner-header {
  gap: 0.75rem;
}

.code-runner-header-copy {
  min-width: 0;
}

.code-runner-title,
.code-runner-label,
.code-runner-section-head {
  font-family: var(--font-mono);
}

.code-runner-title {
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--primary-color);
}

.code-runner-description {
  margin: 0.35rem 0 0;
  color: var(--text-color-secondary);
  font-size: 0.82rem;
  line-height: 1.5;
}

.code-runner-meta,
.code-runner-metrics {
  gap: 0.45rem;
  flex-wrap: wrap;
}

.code-runner-chip {
  padding: 0.3rem 0.55rem;
  border-radius: 0.375rem;
  border: 1px solid color-mix(in srgb, var(--panel-section-border, var(--surface-border)) 82%, transparent);
  background: color-mix(in srgb, var(--panel-section-surface, var(--surface-ground)) 96%, transparent);
  color: var(--text-color-secondary);
  font-size: 0.74rem;
  font-family: var(--font-mono);
  font-weight: 600;
}

.code-runner-chip-muted {
  color: var(--text-color);
}

.code-runner-editor-section,
.code-runner-output {
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.code-runner-editor-section {
  flex: 1;
}

.code-runner-section-head {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-color-secondary);
}

.code-runner-status {
  font-size: 0.72rem;
  font-family: var(--font-mono);
  color: var(--primary-color);
}

.code-runner-editor-shell,
.code-runner-empty,
.code-runner-stdin-input,
.code-runner-output-body,
.code-runner-output-empty {
  border: 1px solid color-mix(in srgb, var(--panel-section-border, var(--surface-border)) 86%, transparent);
  background: color-mix(in srgb, var(--panel-section-strong, var(--surface-card)) 96%, transparent);
}

.code-runner-editor-shell {
  flex: 1;
  min-height: 14rem;
  overflow: hidden;
}

.code-runner-editor {
  height: 100%;
}

.code-runner-empty,
.code-runner-output-empty {
  color: var(--text-color-secondary);
  font-size: 0.86rem;
}

.code-runner-empty {
  flex: 1;
  min-height: 14rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  padding: 1rem;
  text-align: center;
}

.code-runner-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-color-secondary);
}

.code-runner-stdin {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.code-runner-stdin-input {
  min-height: 5rem;
  padding: 0.8rem 0.9rem;
  resize: vertical;
  font: inherit;
  line-height: 1.6;
  color: var(--text-color);
}

.code-runner-output {
  flex: 0 0 13rem;
}

.code-runner-output-body,
.code-runner-output-empty {
  flex: 1;
  min-height: 0;
  padding: 0.85rem 0.9rem;
  overflow: auto;
}

.code-runner-output-body {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.code-runner-output-block {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.code-runner-output-block pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: var(--font-mono);
  font-size: 0.82rem;
  line-height: 1.6;
  color: var(--text-color);
}

.code-runner-output-block-error pre {
  color: #dc2626;
}

.code-runner-metrics {
  padding-top: 0.2rem;
  border-top: 1px solid color-mix(in srgb, var(--panel-section-border, var(--surface-border)) 82%, transparent);
  font-size: 0.74rem;
  font-family: var(--font-mono);
  color: var(--text-color-secondary);
}

@media (max-width: 1280px) {
  .code-runner-shell-expanded {
    flex-basis: 28rem;
    width: 28rem;
    min-width: 28rem;
    max-width: 28rem;
  }
}

@media (max-width: 1180px) {
  .code-runner-shell {
    flex-basis: 100%;
    width: 100%;
    min-width: 100%;
    max-width: none;
    min-height: 3.5rem;
    border-left: 0;
    border-top: 1px solid var(--panel-section-border, var(--surface-border));
  }

  .code-runner-shell-expanded {
    min-height: 30rem;
  }

  .code-runner-rail {
    width: 100%;
    min-width: 100%;
    min-height: 3.5rem;
    border-right: 0;
    border-bottom: 1px solid var(--panel-section-border, var(--surface-border));
    flex-direction: row;
  }

  .code-runner-rail-label {
    writing-mode: initial;
    text-orientation: initial;
  }

  .code-runner-resizer {
    display: none;
  }
}
</style>
