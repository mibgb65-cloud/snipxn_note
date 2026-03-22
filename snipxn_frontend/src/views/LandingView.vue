<template>
  <div class="landing-page animate-fade-in">
    <header class="landing-topbar animate-fade-in-up delay-100">
      <div class="landing-brand-wrap">
        <div class="landing-brand-icon">
          <img :src="logoUrl" :alt="t('app.logoAlt')" width="36" height="36">
        </div>
        <div class="landing-brand-copy">
          <div class="landing-brand-name">{{ t('app.name') }}</div>
          <div class="landing-brand-subtitle">{{ t('app.subtitle') }}</div>
        </div>
      </div>

      <div class="landing-topbar-status">
        <span class="app-pill">
          <i class="pi pi-sparkles" aria-hidden="true" />
          {{ t('landing.kicker') }}
        </span>
      </div>

      <div class="landing-topbar-actions">
        <div class="landing-control-group">
          <ThemeToggle />
          <LangToggle />
        </div>
        <Button
          icon="pi pi-arrow-right"
          icon-pos="right"
          :label="topbarEnterLabel"
          :aria-label="enterLabel"
          :title="enterLabel"
          class="accent-cta"
          @click="handleEnter"
        />
      </div>
    </header>

    <main class="landing-main">
      <section class="hero-section animate-fade-in-up delay-150">
        <div class="hero-copy-panel">
          <div class="hero-copy-head">
            <span class="hero-kicker">{{ t('landing.badge') }}</span>
            <span class="hero-status">{{ hasToken ? t('landing.enterWorkspaceCompact') : t('landing.enterAppCompact') }}</span>
          </div>

          <h1 class="hero-title">{{ t('landing.title') }}</h1>
          <p class="hero-subtitle">{{ t('landing.subtitle') }}</p>

          <div class="hero-actions">
            <Button
              size="large"
              icon="pi pi-bolt"
              :label="enterLabel"
              class="accent-cta hero-cta"
              @click="handleEnter"
            />
            <Button
              size="large"
              text
              icon="pi pi-arrow-down"
              :label="t('landing.featureTitle')"
              @click="scrollToCapabilities"
            />
          </div>

          <div class="hero-proof-list">
            <article v-for="pill in heroHighlights" :key="pill.title" class="hero-proof-card">
              <div class="hero-proof-title">{{ pill.title }}</div>
              <p class="hero-proof-body">{{ pill.body }}</p>
            </article>
          </div>
        </div>

        <div class="hero-preview-panel">
          <div class="hero-command-bar">
            <i class="pi pi-search" aria-hidden="true" />
            <span>{{ t('sidebar.searchPlaceholder') }}</span>
            <kbd>Ctrl</kbd>
            <kbd>K</kbd>
          </div>

          <div class="hero-metric-grid">
            <article v-for="metric in heroMetrics" :key="metric.id" class="hero-metric-card">
              <div class="hero-metric-value">{{ metric.value }}</div>
              <div class="hero-metric-label">{{ metric.label }}</div>
            </article>
          </div>

          <div class="workspace-preview">
            <div class="workspace-preview-topbar">
              <span class="workspace-preview-brand">{{ t('app.name') }}</span>
              <span class="workspace-preview-sync">{{ t('auth.featureSync') }}</span>
            </div>

            <div class="workspace-preview-grid">
              <section class="preview-column preview-sidebar">
                <div class="preview-column-label">{{ t('landing.previewSidebar') }}</div>
                <div class="preview-folder">{{ t('landing.previewFolderInbox') }}</div>
                <div class="preview-folder preview-folder-active">{{ t('landing.previewFolderWork') }}</div>
                <div class="preview-folder">{{ t('landing.previewFolderPersonal') }}</div>
                <div class="preview-tag-row">
                  <span class="preview-tag">#API</span>
                  <span class="preview-tag">#Markdown</span>
                </div>
              </section>

              <section class="preview-column preview-list">
                <div class="preview-column-label">{{ t('landing.previewList') }}</div>
                <article class="preview-note preview-note-active">
                  <div class="preview-note-title">{{ t('landing.previewNoteTitle') }}</div>
                  <div class="preview-note-body">{{ t('landing.previewNoteBody') }}</div>
                  <span class="preview-note-tag">{{ t('landing.previewLangMarkdown') }}</span>
                </article>
                <article class="preview-note">
                  <div class="preview-note-title">{{ t('landing.previewSnippetTitle') }}</div>
                  <div class="preview-note-body">{{ t('landing.previewSnippetBody') }}</div>
                  <span class="preview-note-tag">{{ t('landing.previewLangJavascript') }}</span>
                </article>
              </section>

              <section class="preview-column preview-editor">
                <div class="preview-column-label">{{ t('landing.previewEditor') }}</div>
                <div class="preview-editor-title">{{ t('landing.previewNoteTitle') }}</div>
                <div class="preview-code-block">
                  <div class="preview-code-line preview-code-line-strong">{{ t('landing.previewCodeLine1') }}</div>
                  <div class="preview-code-line">{{ t('landing.previewCodeLine2') }}</div>
                  <div class="preview-code-line">{{ t('landing.previewCodeLine3') }}</div>
                  <div class="preview-code-line">{{ t('landing.previewCodeLine4') }}</div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>

      <section class="story-section animate-fade-in-up delay-200">
        <div class="section-copy">
          <div class="section-kicker">{{ t('landing.storyEyebrow') }}</div>
          <h2 class="section-title">{{ t('landing.storyTitle') }}</h2>
          <p class="section-body">{{ t('landing.storyBody') }}</p>
        </div>

        <div class="story-grid">
          <article v-for="story in storyCards" :key="story.id" class="story-card">
            <div class="story-index">{{ story.index }}</div>
            <h3 class="story-card-title">{{ story.title }}</h3>
            <p class="story-card-body">{{ story.body }}</p>
          </article>
        </div>
      </section>

      <section id="capabilities" class="workflow-section animate-fade-in-up delay-300">
        <div class="workflow-shell">
          <div class="section-copy workflow-copy">
            <div class="section-kicker">{{ t('landing.workflowEyebrow') }}</div>
            <h2 class="section-title">{{ t('landing.workflowTitle') }}</h2>
            <p class="section-body">{{ t('landing.workflowBody') }}</p>
            <blockquote class="workflow-quote">{{ t('landing.quote') }}</blockquote>
          </div>

          <div class="workflow-grid">
            <article v-for="workflow in workflowCards" :key="workflow.id" class="workflow-card">
              <div class="workflow-step">{{ workflow.index }}</div>
              <h3 class="workflow-card-title">{{ workflow.title }}</h3>
              <p class="workflow-card-body">{{ workflow.body }}</p>
            </article>
          </div>
        </div>
      </section>

      <section class="stack-section animate-fade-in-up delay-400">
        <div class="section-copy">
          <div class="section-kicker">{{ t('landing.stackEyebrow') }}</div>
          <h2 class="section-title">{{ t('landing.stackTitle') }}</h2>
          <p class="section-body">{{ t('landing.stackBody') }}</p>
        </div>

        <div class="stack-grid">
          <article v-for="item in stackCards" :key="item.id" class="stack-card">
            <div class="stack-card-icon">
              <i :class="item.icon" aria-hidden="true" />
            </div>
            <h3 class="stack-card-title">{{ item.title }}</h3>
            <p class="stack-card-body">{{ item.body }}</p>
          </article>
        </div>
      </section>

      <section class="final-cta-section animate-fade-in-up delay-500">
        <div class="final-cta-card">
          <div class="final-cta-copy">
            <div class="section-kicker">{{ t('landing.ctaEyebrow') }}</div>
            <h2 class="final-cta-title">{{ t('landing.ctaTitle') }}</h2>
            <p class="final-cta-body">{{ t('landing.ctaBody') }}</p>
          </div>

          <div class="final-cta-actions">
            <Button
              size="large"
              icon="pi pi-arrow-right"
              icon-pos="right"
              :label="enterLabel"
              class="accent-cta"
              @click="handleEnter"
            />
            <div class="final-cta-tags">
              <span v-for="pill in proofPills" :key="pill" class="final-cta-tag">{{ pill }}</span>
            </div>
          </div>
        </div>
      </section>
    </main>

    <footer class="landing-footer animate-fade-in delay-600">
      <div class="footer-content">
        <div class="footer-brand">
          <img :src="logoUrl" :alt="t('app.logoAlt')" width="20" height="20">
          <span>{{ t('app.name') }}</span>
        </div>

        <div class="footer-links">
          <a href="#capabilities">{{ t('landing.featureEyebrow') }}</a>
          <a href="/login">{{ t('landing.enterAppCompact') }}</a>
          <a href="/workspace">{{ t('landing.enterWorkspaceCompact') }}</a>
        </div>

        <div class="footer-note">
          {{ t('landing.kicker') }}
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Button from 'primevue/button';
import ThemeToggle from '../components/common/ThemeToggle.vue';
import LangToggle from '../components/common/LangToggle.vue';
import logoUrl from '../assets/logo.svg';

const router = useRouter();
const { t } = useI18n();

const hasToken = computed(() => Boolean(localStorage.getItem('accessToken')));
const enterLabel = computed(() => (
  hasToken.value ? t('landing.enterWorkspace') : t('landing.enterApp')
));
const topbarEnterLabel = computed(() => (
  hasToken.value ? t('landing.enterWorkspaceCompact') : t('landing.enterAppCompact')
));

const heroMetrics = computed(() => ([
  { id: 'editor', value: t('landing.metricEditorValue'), label: t('landing.metricEditor') },
  { id: 'sync', value: t('landing.metricSyncValue'), label: t('landing.metricSync') },
  { id: 'offline', value: t('landing.metricOfflineValue'), label: t('landing.metricOffline') },
]));

const heroHighlights = computed(() => ([
  { title: t('landing.featureNotesTitle'), body: t('landing.featureNotesBody') },
  { title: t('landing.featureFoldersTitle'), body: t('landing.featureFoldersBody') },
  { title: t('landing.featureSessionTitle'), body: t('landing.featureSessionBody') },
]));

const storyCards = computed(() => ([
  { id: 'problem', index: '01', title: t('landing.storyProblemTitle'), body: t('landing.storyProblemBody') },
  { id: 'flow', index: '02', title: t('landing.storyFlowTitle'), body: t('landing.storyFlowBody') },
  { id: 'ship', index: '03', title: t('landing.storyShipTitle'), body: t('landing.storyShipBody') },
]));

const workflowCards = computed(() => ([
  { id: 'capture', index: '01', title: t('landing.workflowCaptureTitle'), body: t('landing.workflowCaptureBody') },
  { id: 'organize', index: '02', title: t('landing.workflowOrganizeTitle'), body: t('landing.workflowOrganizeBody') },
  { id: 'continue', index: '03', title: t('landing.workflowContinueTitle'), body: t('landing.workflowContinueBody') },
]));

const stackCards = computed(() => ([
  { id: 'api', icon: 'pi pi-server', title: t('landing.stackItemApiTitle'), body: t('landing.stackItemApiBody') },
  { id: 'session', icon: 'pi pi-shield', title: t('landing.stackItemSessionTitle'), body: t('landing.stackItemSessionBody') },
  { id: 'editor', icon: 'pi pi-file-edit', title: t('landing.stackItemEditorTitle'), body: t('landing.stackItemEditorBody') },
  { id: 'showcase', icon: 'pi pi-desktop', title: t('landing.stackItemShowcaseTitle'), body: t('landing.stackItemShowcaseBody') },
]));

const proofPills = computed(() => ([
  t('auth.featureEditor'),
  t('auth.featureSync'),
  t('auth.featureOffline'),
]));

function handleEnter() {
  router.push(hasToken.value ? '/workspace' : '/login');
}

function scrollToCapabilities() {
  document.getElementById('capabilities')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
</script>

<style scoped>
.landing-page {
  min-height: 100vh;
  color: var(--text-color);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 0 1rem;
}

.landing-topbar,
.landing-main,
.footer-content {
  width: min(1320px, calc(100% - 2rem));
}

.landing-topbar {
  margin-top: 0;
  padding: 0.9rem 1rem;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 1rem;
  border-bottom: 1px solid var(--app-border);
  background: transparent;
}

.landing-brand-wrap,
.landing-topbar-actions,
.landing-control-group {
  display: flex;
  align-items: center;
}

.landing-brand-wrap {
  gap: 0.9rem;
}

.landing-brand-icon {
  width: 3rem;
  height: 3rem;
  padding: 0.35rem;
  border-radius: 0.375rem;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-subtle) 94%, transparent);
}

.landing-brand-copy {
  min-width: 0;
}

.landing-brand-name {
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.landing-brand-subtitle {
  font-size: 0.88rem;
  color: var(--text-color-secondary);
}

.landing-topbar-status {
  display: flex;
  justify-content: center;
}

.landing-topbar-actions {
  justify-content: flex-end;
  gap: 0.75rem;
}

.landing-control-group {
  gap: 0.35rem;
  padding: 0.3rem;
  border-radius: 0.375rem;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-subtle) 92%, transparent);
}

.landing-main {
  padding-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.hero-section {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 0.98fr);
  gap: 1rem;
  padding: 1rem 0 2rem;
  border-bottom: 1px solid var(--app-border);
}

.hero-copy-panel,
.hero-preview-panel,
.story-section,
.workflow-shell,
.stack-section,
.final-cta-card {
  border: 0;
  background: transparent;
  box-shadow: none;
}

.hero-copy-panel,
.hero-preview-panel,
.story-section,
.stack-section {
  padding: 0;
}

.hero-copy-panel {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1.4rem;
}

.hero-copy-head,
.hero-actions,
.hero-proof-list,
.hero-metric-grid,
.workspace-preview-topbar,
.preview-tag-row,
.story-grid,
.workflow-grid,
.stack-grid,
.final-cta-actions,
.final-cta-tags,
.footer-content,
.footer-brand,
.footer-links {
  display: flex;
}

.hero-copy-head {
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.hero-kicker,
.hero-status,
.section-kicker,
.story-index,
.workflow-step,
.preview-column-label,
.preview-note-tag {
  font-family: var(--font-mono);
}

.hero-kicker,
.hero-status {
  border-radius: 0.375rem;
  padding: 0.45rem 0.8rem;
  font-size: 0.76rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-kicker {
  background: color-mix(in srgb, var(--primary-color) 10%, transparent);
  color: var(--primary-color);
}

.hero-status {
  background: var(--app-cta-soft);
  color: var(--app-cta-strong);
}

.hero-title,
.section-title,
.final-cta-title {
  margin: 0;
  font-family: var(--font-display);
  letter-spacing: -0.05em;
  line-height: 0.96;
}

.hero-title {
  font-size: clamp(3.2rem, 7vw, 5.6rem);
}

.hero-subtitle,
.section-body,
.story-card-body,
.workflow-card-body,
.stack-card-body,
.final-cta-body,
.hero-proof-body,
.preview-note-body {
  color: var(--text-color-secondary);
  line-height: 1.72;
}

.hero-subtitle {
  margin: 0;
  max-width: 44rem;
  font-size: 1.06rem;
}

.hero-actions {
  gap: 0.75rem;
  flex-wrap: wrap;
}

.hero-cta {
  min-width: 13rem;
}

.hero-proof-list {
  flex-direction: column;
  gap: 0.85rem;
}

.hero-proof-card {
  padding: 1rem 1.1rem;
  border-radius: 0.5rem;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-subtle) 94%, transparent);
}

.hero-proof-title {
  font-size: 0.98rem;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.hero-proof-body {
  margin: 0.4rem 0 0;
  font-size: 0.92rem;
}

.hero-preview-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-left: 1.5rem;
  border-left: 1px solid var(--app-border);
}

.hero-command-bar {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-height: 3.25rem;
  padding: 0.9rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-subtle) 95%, transparent);
  color: var(--text-color-secondary);
}

.hero-command-bar span {
  flex: 1;
}

.hero-command-bar kbd {
  padding: 0.15rem 0.42rem;
  border-radius: 0.45rem;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-strong) 96%, transparent);
  font-family: var(--font-mono);
  font-size: 0.72rem;
}

.hero-metric-grid {
  gap: 0.75rem;
}

.hero-metric-card {
  flex: 1;
  min-width: 0;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-subtle) 95%, transparent);
}

.hero-metric-value {
  font-family: var(--font-display);
  font-size: 1.4rem;
  letter-spacing: -0.04em;
}

.hero-metric-label {
  margin-top: 0.35rem;
  font-size: 0.84rem;
  color: var(--text-color-secondary);
}

.workspace-preview {
  border-radius: 0.5rem;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-subtle) 95%, transparent);
  overflow: hidden;
}

.workspace-preview-topbar {
  align-items: center;
  justify-content: space-between;
  padding: 0.9rem 1rem;
  border-bottom: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-strong) 96%, transparent);
}

.workspace-preview-brand {
  font-weight: 800;
  letter-spacing: -0.03em;
}

.workspace-preview-sync {
  padding: 0.3rem 0.65rem;
  border-radius: 0.375rem;
  background: color-mix(in srgb, var(--primary-color) 10%, transparent);
  color: var(--primary-color);
  font-size: 0.76rem;
  font-family: var(--font-mono);
}

.workspace-preview-grid {
  display: grid;
  grid-template-columns: 200px 240px minmax(0, 1fr);
  gap: 0.75rem;
  padding: 0.75rem;
}

.preview-column {
  min-width: 0;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-strong) 94%, transparent);
}

.preview-column-label {
  margin-bottom: 0.8rem;
  font-size: 0.76rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-color-secondary);
}

.preview-folder,
.preview-note,
.preview-code-block {
  border-radius: 0.375rem;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-subtle) 96%, transparent);
}

.preview-folder {
  padding: 0.8rem 0.9rem;
  font-weight: 600;
}

.preview-folder + .preview-folder,
.preview-note + .preview-note {
  margin-top: 0.65rem;
}

.preview-folder-active {
  background: color-mix(in srgb, var(--primary-color) 14%, transparent);
  color: var(--primary-color);
}

.preview-tag-row {
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.85rem;
}

.preview-tag,
.final-cta-tag {
  padding: 0.32rem 0.65rem;
  border-radius: 0.375rem;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-strong) 96%, transparent);
  font-size: 0.76rem;
  font-family: var(--font-mono);
  color: var(--text-color-secondary);
}

.preview-note {
  padding: 0.9rem;
}

.preview-note-active {
  border-color: color-mix(in srgb, var(--primary-color) 24%, var(--app-border));
  background: color-mix(in srgb, var(--primary-color) 8%, var(--app-panel-strong));
}

.preview-note-title,
.preview-editor-title,
.story-card-title,
.workflow-card-title,
.stack-card-title {
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.preview-note-body {
  margin-top: 0.35rem;
  font-size: 0.88rem;
}

.preview-note-tag {
  display: inline-flex;
  margin-top: 0.7rem;
  padding: 0.26rem 0.55rem;
  border-radius: 0.375rem;
  background: color-mix(in srgb, var(--app-cta) 10%, transparent);
  color: var(--app-cta-strong);
  font-size: 0.72rem;
}

.preview-editor-title {
  margin-bottom: 0.8rem;
}

.preview-code-block {
  padding: 0.9rem;
}

.preview-code-line {
  font-family: var(--font-mono);
  font-size: 0.82rem;
  line-height: 1.65;
  color: var(--text-color-secondary);
}

.preview-code-line-strong {
  color: var(--primary-color);
  font-weight: 600;
}

.section-copy {
  max-width: 52rem;
}

.section-kicker {
  color: var(--primary-color);
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.section-title {
  margin-top: 0.55rem;
  font-size: clamp(2rem, 4vw, 3.25rem);
}

.section-body {
  margin: 0.85rem 0 0;
  font-size: 1rem;
}

.story-section,
.stack-section {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 2rem 0;
  border-bottom: 1px solid var(--app-border);
}

.story-grid,
.workflow-grid,
.stack-grid,
.final-cta-tags {
  gap: 0.85rem;
}

.story-grid,
.workflow-grid {
  align-items: stretch;
}

.story-grid {
  justify-content: space-between;
}

.story-card,
.workflow-card,
.stack-card {
  flex: 1;
  min-width: 0;
  padding: 1.1rem 1.15rem;
  border-radius: 0.5rem;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-subtle) 95%, transparent);
}

.story-index,
.workflow-step {
  display: inline-flex;
  border-radius: 0.375rem;
  padding: 0.24rem 0.5rem;
  background: color-mix(in srgb, var(--primary-color) 10%, transparent);
  color: var(--primary-color);
  font-size: 0.73rem;
  font-weight: 600;
}

.story-card-title,
.workflow-card-title,
.stack-card-title {
  margin: 0.85rem 0 0;
}

.story-card-body,
.workflow-card-body,
.stack-card-body {
  margin: 0.55rem 0 0;
  font-size: 0.93rem;
}

.workflow-shell {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 1rem;
  padding: 2rem 0;
  border-bottom: 1px solid var(--app-border);
}

.workflow-copy {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.workflow-grid {
  flex-direction: column;
}

.workflow-quote {
  margin: 1.4rem 0 0;
  padding: 1rem 1.1rem;
  border-left: 4px solid var(--app-cta);
  border-radius: 0 1rem 1rem 0;
  background: color-mix(in srgb, var(--app-cta) 8%, transparent);
  font-size: 1rem;
  line-height: 1.7;
}

.stack-grid {
  flex-wrap: wrap;
}

.stack-card {
  min-width: calc(50% - 0.425rem);
}

.stack-card-icon {
  width: 2.75rem;
  height: 2.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  background: color-mix(in srgb, var(--primary-color) 10%, transparent);
  color: var(--primary-color);
  font-size: 1.1rem;
}

.final-cta-section {
  padding-bottom: 1rem;
}

.final-cta-card {
  padding: 2rem 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 1rem;
  border-bottom: 1px solid var(--app-border);
}

.final-cta-title {
  margin-top: 0.4rem;
  font-size: clamp(2rem, 4vw, 3.2rem);
}

.final-cta-body {
  margin: 0.8rem 0 0;
}

.final-cta-actions {
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
}

.final-cta-tags {
  flex-wrap: wrap;
  justify-content: flex-end;
}

.landing-footer {
  width: 100%;
  padding-top: 1rem;
}

.footer-content {
  margin: 0 auto;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1.4rem 0 0;
  border-top: 1px solid var(--app-border);
}

.footer-brand {
  gap: 0.55rem;
  align-items: center;
  font-weight: 700;
}

.footer-links {
  gap: 1rem;
  flex-wrap: wrap;
}

.footer-links a,
.footer-note {
  color: var(--text-color-secondary);
  text-decoration: none;
  font-size: 0.88rem;
}

.footer-links a:hover {
  color: var(--primary-color);
}

@media (max-width: 1160px) {
  .landing-topbar {
    grid-template-columns: 1fr;
    justify-items: flex-start;
  }

  .landing-topbar-status {
    justify-content: flex-start;
  }

  .hero-section,
  .workflow-shell,
  .final-cta-card {
    grid-template-columns: 1fr;
  }

  .workspace-preview-grid {
    grid-template-columns: 180px 220px minmax(0, 1fr);
  }

  .hero-preview-panel {
    padding-left: 0;
    border-left: 0;
    border-top: 1px solid var(--app-border);
    padding-top: 1.5rem;
  }
}

@media (max-width: 920px) {
  .hero-metric-grid,
  .story-grid,
  .stack-grid {
    flex-direction: column;
  }

  .stack-card {
    min-width: 100%;
  }

  .workspace-preview-grid {
    grid-template-columns: 1fr;
  }

  .preview-sidebar {
    display: none;
  }

  .footer-content {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 640px) {
  .landing-topbar,
  .landing-main,
  .footer-content {
    width: min(1320px, calc(100% - 1rem));
  }

  .landing-topbar-actions,
  .hero-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .landing-topbar-actions :deep(.p-button),
  .hero-actions :deep(.p-button),
  .final-cta-actions :deep(.p-button) {
    width: 100%;
  }

  .hero-title {
    font-size: clamp(2.6rem, 14vw, 4rem);
  }
}
</style>
