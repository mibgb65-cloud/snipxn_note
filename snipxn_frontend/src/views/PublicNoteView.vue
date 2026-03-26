<template>
  <div class="share-page">
    <!-- ── Topbar ── -->
    <header class="share-topbar">
      <div class="share-topbar-brand">
        <router-link to="/" class="share-brand-link">
          <span class="share-brand-logo">Snipxn</span>
          <span class="share-brand-divider" />
          <span class="share-brand-label">{{ t('publicNote.title') }}</span>
        </router-link>
      </div>

      <div v-if="note" class="share-topbar-banner">
        <span class="share-topbar-title">{{ note.title || t('notes.untitled') }}</span>
      </div>

      <div class="share-topbar-actions">
        <router-link to="/?auth=true" class="share-action-btn share-action-btn-primary">
          <i class="pi pi-sign-in" />
          <span class="share-action-label">{{ t('publicNote.openInApp') }}</span>
        </router-link>
      </div>
    </header>

    <!-- ── Loading State ── -->
    <div v-if="loading" class="share-state-center">
      <div class="share-loading-pulse">
        <span class="share-loading-dot" />
        <span class="share-loading-dot" />
        <span class="share-loading-dot" />
      </div>
    </div>

    <!-- ── Error State ── -->
    <div v-else-if="error" class="share-state-center">
      <div class="share-empty animate-fade-in-up">
        <div class="share-empty-icon">
          <i class="pi pi-link" />
        </div>
        <h2 class="share-empty-title">{{ t('publicNote.notFound') }}</h2>
        <p class="share-empty-body">{{ t('publicNote.notFoundDescription') }}</p>
        <router-link to="/" class="share-action-btn share-action-btn-primary">
          <i class="pi pi-home" />
          <span>{{ t('publicNote.backToHome') }}</span>
        </router-link>
      </div>
    </div>

    <!-- ── Content ── -->
    <div v-else-if="note" class="share-body">
      <div class="share-grid">
        <!-- Article Column -->
        <article class="share-article animate-fade-in-up">
          <!-- Meta Row -->
          <div class="share-article-hero">
            <div class="share-meta-row">
              <span v-if="note.primaryLanguage" class="share-lang-badge">
                <i class="pi pi-code" />
                {{ note.primaryLanguage }}
              </span>
              <span class="share-meta-sep" />
              <span class="share-meta-item">
                <i class="pi pi-clock" />
                {{ formattedDate }}
              </span>
              <span v-if="charCount" class="share-meta-item">
                <i class="pi pi-align-left" />
                {{ t('notes.characterCountValue', { count: charCount }) }}
              </span>
            </div>
            <h1 class="share-article-title">{{ note.title || t('notes.untitled') }}</h1>
          </div>

          <!-- Content -->
          <div class="share-article-content markdown-preview" v-html="renderedContent" />
        </article>

        <!-- Sidebar Column -->
        <aside class="share-sidebar animate-fade-in-up delay-150">
          <!-- Info Card -->
          <div class="share-sidebar-card">
            <h3 class="share-sidebar-heading">
              <i class="pi pi-info-circle" />
              {{ t('publicNote.noteInfo') }}
            </h3>
            <div class="share-info-grid">
              <div class="share-info-item">
                <span class="share-info-label">{{ t('notes.language') }}</span>
                <span class="share-info-value">{{ note.primaryLanguage || '—' }}</span>
              </div>
              <div class="share-info-item">
                <span class="share-info-label">{{ t('publicNote.createdAt') }}</span>
                <span class="share-info-value">{{ formattedCreatedAt }}</span>
              </div>
              <div class="share-info-item">
                <span class="share-info-label">{{ t('publicNote.updatedAt') }}</span>
                <span class="share-info-value">{{ formattedDate }}</span>
              </div>
              <div v-if="charCount" class="share-info-item">
                <span class="share-info-label">{{ t('publicNote.charCount') }}</span>
                <span class="share-info-value">{{ charCount }}</span>
              </div>
            </div>
          </div>

          <!-- Outline Card -->
          <div v-if="headings.length" class="share-sidebar-card">
            <h3 class="share-sidebar-heading">
              <i class="pi pi-list" />
              {{ t('publicNote.outline') }}
            </h3>
            <nav class="share-outline">
              <a
                v-for="(h, i) in headings"
                :key="i"
                class="share-outline-item"
                :class="`share-outline-h${h.level}`"
                :href="`#heading-${i}`"
                @click.prevent="scrollToHeading(i)"
              >
                {{ h.text }}
              </a>
            </nav>
          </div>

          <!-- CTA Card -->
          <div class="share-sidebar-card share-sidebar-cta">
            <div class="share-cta-icon">
              <i class="pi pi-sparkles" />
            </div>
            <p class="share-cta-copy">{{ t('publicNote.ctaCopy') }}</p>
            <router-link to="/?auth=true" class="share-action-btn share-action-btn-cta">
              <i class="pi pi-arrow-right" />
              <span>{{ t('publicNote.openInApp') }}</span>
            </router-link>
          </div>
        </aside>
      </div>
    </div>

    <!-- ── Footer ── -->
    <footer class="share-footer">
      <span class="share-footer-text">{{ t('publicNote.poweredBy') }}</span>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { getPublicNote } from '../api/note';
import { renderMarkdown } from '../utils/markdown';

const route = useRoute();
const { t } = useI18n();

const note = ref(null);
const loading = ref(true);
const error = ref(false);

const renderedContent = computed(() => {
  if (!note.value?.content) return '';
  let html = renderMarkdown(note.value.content);
  let idx = 0;
  html = html.replace(/<h([1-4])>/g, (_, level) => `<h${level} id="heading-${idx++}">`);
  return html;
});

const headings = computed(() => {
  if (!note.value?.content) return [];
  const result = [];
  const lines = note.value.content.split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^(#{1,4})\s+(.+)/);
    if (m) {
      result.push({ level: m[1].length, text: m[2].trim() });
    }
  }
  return result;
});

const charCount = computed(() => {
  const content = note.value?.content || '';
  if (!content) return 0;
  return [...content].filter(ch => !/\s/.test(ch)).length;
});

function formatDate(raw) {
  if (!raw) return '—';
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(raw));
}

const formattedDate = computed(() => formatDate(note.value?.updatedAt || note.value?.createdAt));
const formattedCreatedAt = computed(() => formatDate(note.value?.createdAt));

function scrollToHeading(index) {
  const el = document.getElementById(`heading-${index}`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

onMounted(async () => {
  try {
    const res = await getPublicNote(route.params.shareToken);
    note.value = res.data;
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
/* ── Page Shell ── */
.share-page {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--app-bg, var(--surface-ground));
  color: var(--text-color);
  font-family: var(--font-sans);
}

/* ── Topbar ── */
.share-topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: grid;
  grid-template-columns: minmax(0, 220px) minmax(200px, 1fr) minmax(0, auto);
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.85rem;
  border-bottom: 1px solid var(--app-border, var(--surface-border));
  background: color-mix(in srgb, var(--app-panel-strong, var(--surface-card)) 98%, transparent);
  backdrop-filter: blur(20px) saturate(1.6);
  -webkit-backdrop-filter: blur(20px) saturate(1.6);
}

.share-topbar-brand {
  display: flex;
  align-items: center;
  min-width: 0;
}

.share-brand-link {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  text-decoration: none;
  color: inherit;
}

.share-brand-logo {
  font-family: var(--font-display, var(--font-sans));
  font-weight: 800;
  font-size: 1.1rem;
  letter-spacing: -0.04em;
  color: var(--primary-color);
  white-space: nowrap;
}

.share-brand-divider {
  width: 1px;
  height: 1.1rem;
  background: var(--app-border, var(--surface-border));
  flex-shrink: 0;
}

.share-brand-label {
  font-size: 0.76rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-color-secondary);
  white-space: nowrap;
}

.share-topbar-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
}

.share-topbar-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.share-topbar-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
}

/* ── Action Buttons ── */
.share-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.82rem;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  border: none;
  transition:
    transform var(--motion-duration-xs, 160ms) var(--motion-ease-standard, ease),
    box-shadow var(--motion-duration-xs, 160ms) var(--motion-ease-standard, ease),
    opacity var(--motion-duration-xs, 160ms);
}

.share-action-btn:hover {
  transform: translateY(-1px);
}

.share-action-btn-primary {
  background: var(--primary-color);
  color: var(--primary-color-text, #fff);
  box-shadow: 0 2px 8px -2px color-mix(in srgb, var(--primary-color) 40%, transparent);
}

.share-action-btn-primary:hover {
  box-shadow: 0 4px 14px -3px color-mix(in srgb, var(--primary-color) 50%, transparent);
}

.share-action-btn-cta {
  width: 100%;
  justify-content: center;
  padding: 0.6rem 1rem;
  background: var(--app-cta, #f97316);
  color: #fff;
  box-shadow: 0 2px 8px -2px color-mix(in srgb, var(--app-cta, #f97316) 40%, transparent);
}

.share-action-btn-cta:hover {
  box-shadow: 0 4px 14px -3px color-mix(in srgb, var(--app-cta, #f97316) 50%, transparent);
}

/* ── Loading ── */
.share-state-center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem 1.5rem;
}

.share-loading-pulse {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.share-loading-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary-color);
  opacity: 0.4;
  animation: pulse-dot 1.2s ease-in-out infinite;
}

.share-loading-dot:nth-child(2) { animation-delay: 0.15s; }
.share-loading-dot:nth-child(3) { animation-delay: 0.3s; }

@keyframes pulse-dot {
  0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1.1); }
}

/* ── Empty / Error ── */
.share-empty {
  text-align: center;
  max-width: 28rem;
}

.share-empty-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--primary-color) 12%, transparent);
  color: var(--primary-color);
  font-size: 1.5rem;
  margin-bottom: 1.25rem;
}

.share-empty-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
  color: var(--text-color);
}

.share-empty-body {
  font-size: 0.9rem;
  color: var(--text-color-secondary);
  margin: 0 0 1.5rem;
  line-height: 1.6;
}

/* ── Content Body ── */
.share-body {
  flex: 1;
  width: 100%;
  max-width: min(1320px, calc(100% - 2rem));
  margin: 0 auto;
  padding: 1.5rem 0;
}

.share-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 1.25rem;
  align-items: start;
}

/* ── Article ── */
.share-article {
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1px solid var(--app-border, var(--surface-border));
  border-radius: 0.5rem;
  background: color-mix(in srgb, var(--app-panel-strong, var(--surface-card)) 98%, transparent);
  overflow: hidden;
}

.share-article-hero {
  padding: 2rem 2rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.share-meta-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  font-size: 0.8rem;
  color: var(--text-color-secondary);
}

.share-lang-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.22rem 0.55rem;
  border-radius: 0.3rem;
  background: color-mix(in srgb, var(--primary-color) 14%, transparent);
  color: var(--primary-color);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.share-lang-badge .pi {
  font-size: 0.68rem;
}

.share-meta-sep {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--text-color-secondary);
  opacity: 0.4;
  flex-shrink: 0;
}

.share-meta-item {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}

.share-meta-item .pi {
  font-size: 0.72rem;
  opacity: 0.6;
}

.share-article-title {
  font-family: var(--font-display, var(--font-sans));
  font-size: clamp(1.6rem, 3.5vw, 2.4rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.2;
  margin: 0;
  color: var(--text-color);
}

.share-article-content {
  padding: 1.5rem 2rem 2rem;
  line-height: 1.8;
  font-size: 1rem;
}

/* ── Sidebar ── */
.share-sidebar {
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1px solid var(--app-border, var(--surface-border));
  border-radius: 0.5rem;
  background: color-mix(in srgb, var(--app-panel-strong, var(--surface-card)) 98%, transparent);
  overflow: hidden;
  position: sticky;
  top: 3.5rem;
}

.share-sidebar-card {
  padding: 1rem 1.1rem;
}

.share-sidebar-card + .share-sidebar-card {
  border-top: 1px solid var(--app-border, var(--surface-border));
}

.share-sidebar-heading {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-color-secondary);
  margin: 0 0 0.75rem;
}

.share-sidebar-heading .pi {
  font-size: 0.8rem;
  opacity: 0.7;
}

/* Info Grid */
.share-info-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.share-info-item {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.55rem 0.65rem;
  border-radius: 0.375rem;
  background: color-mix(in srgb, var(--app-panel-subtle, var(--surface-hover)) 70%, transparent);
  border: 1px solid color-mix(in srgb, var(--app-border, var(--surface-border)) 60%, transparent);
}

.share-info-label {
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-color-secondary);
  opacity: 0.7;
}

.share-info-value {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-color);
}

/* Outline */
.share-outline {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  max-height: 16rem;
  overflow-y: auto;
}

.share-outline-item {
  display: block;
  padding: 0.3rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.78rem;
  color: var(--text-color-secondary);
  text-decoration: none;
  transition: background var(--motion-duration-xs, 160ms), color var(--motion-duration-xs, 160ms);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.share-outline-item:hover {
  background: color-mix(in srgb, var(--primary-color) 10%, transparent);
  color: var(--primary-color);
}

.share-outline-h2 { padding-left: 1rem; }
.share-outline-h3 { padding-left: 1.5rem; }
.share-outline-h4 { padding-left: 2rem; }

/* CTA Card */
.share-sidebar-cta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  text-align: center;
}

.share-cta-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.5rem;
  background: color-mix(in srgb, var(--app-cta, #f97316) 14%, transparent);
  color: var(--app-cta, #f97316);
  font-size: 1rem;
}

.share-cta-copy {
  font-size: 0.78rem;
  color: var(--text-color-secondary);
  margin: 0;
  line-height: 1.5;
}

/* ── Markdown Preview (scoped) ── */
.markdown-preview :deep(a) {
  color: var(--primary-color);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.markdown-preview :deep(h1),
.markdown-preview :deep(h2),
.markdown-preview :deep(h3),
.markdown-preview :deep(h4) {
  margin: 1.6em 0 0.6em;
  letter-spacing: -0.02em;
  font-family: var(--font-sans);
  font-weight: 700;
  scroll-margin-top: 4rem;
}

.markdown-preview :deep(h1:first-child),
.markdown-preview :deep(h2:first-child),
.markdown-preview :deep(h3:first-child) {
  margin-top: 0;
}

.markdown-preview :deep(p),
.markdown-preview :deep(ul),
.markdown-preview :deep(ol) {
  margin: 0 0 1rem;
}

.markdown-preview :deep(blockquote) {
  margin: 1rem 0;
  padding: 0.75rem 1.25rem;
  border-left: 4px solid var(--primary-color);
  border-radius: 0 0.5rem 0.5rem 0;
  background: color-mix(in srgb, var(--primary-color) 5%, transparent);
}

.markdown-preview :deep(pre) {
  margin: 1rem 0;
  padding: 1.25rem;
  border-radius: 0.5rem;
  border: 1px solid var(--app-border, var(--surface-border));
  background: color-mix(in srgb, var(--app-panel-subtle, var(--surface-card)) 95%, transparent);
  overflow-x: auto;
  line-height: 1.6;
}

.markdown-preview :deep(code) {
  font-family: var(--font-mono);
  font-size: 0.88em;
  background: color-mix(in srgb, var(--primary-color) 8%, transparent);
  padding: 0.15rem 0.4rem;
  border-radius: 0.25rem;
}

.markdown-preview :deep(pre code) {
  background: transparent;
  padding: 0;
  font-size: 0.85em;
}

.markdown-preview :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
}

.markdown-preview :deep(th),
.markdown-preview :deep(td) {
  border: 1px solid var(--app-border, var(--surface-border));
  padding: 0.65rem 0.85rem;
  text-align: left;
  font-size: 0.9em;
}

.markdown-preview :deep(th) {
  background: color-mix(in srgb, var(--primary-color) 6%, transparent);
  font-weight: 600;
}

.markdown-preview :deep(img) {
  max-width: 100%;
  border-radius: 0.5rem;
  border: 1px solid var(--app-border, var(--surface-border));
}

.markdown-preview :deep(hr) {
  border: 0;
  border-top: 1px solid var(--app-border, var(--surface-border));
  margin: 2rem 0;
}

.markdown-preview :deep(li) {
  margin-bottom: 0.25rem;
}

/* ── Footer ── */
.share-footer {
  padding: 1.25rem;
  text-align: center;
  border-top: 1px solid var(--app-border, var(--surface-border));
}

.share-footer-text {
  font-size: 0.72rem;
  color: var(--text-color-secondary);
  opacity: 0.5;
  letter-spacing: 0.02em;
}

/* ── Animations ── */
.animate-fade-in-up {
  animation: fade-in-up var(--motion-duration-lg, 560ms) var(--motion-ease-emphasized, cubic-bezier(0.16, 1, 0.3, 1)) both;
}

@keyframes fade-in-up {
  0% { opacity: 0; transform: translateY(var(--motion-distance-md, 18px)); }
  100% { opacity: 1; transform: translateY(0); }
}

.delay-150 { animation-delay: 150ms; }

/* ── Responsive ── */
@media (max-width: 920px) {
  .share-grid {
    grid-template-columns: 1fr;
  }

  .share-sidebar {
    position: static;
  }
}

@media (max-width: 720px) {
  .share-topbar {
    grid-template-columns: minmax(0, 1fr) minmax(0, auto);
  }

  .share-topbar-banner {
    display: none;
  }

  .share-action-label {
    display: none;
  }

  .share-action-btn {
    padding: 0.5rem;
  }

  .share-article-hero {
    padding: 1.25rem 1.25rem 0;
  }

  .share-article-content {
    padding: 1rem 1.25rem 1.5rem;
  }

  .share-body {
    padding: 1rem 0;
    max-width: calc(100% - 1rem);
  }
}

@media (max-width: 480px) {
  .share-article-title {
    font-size: 1.35rem;
  }
}
</style>
