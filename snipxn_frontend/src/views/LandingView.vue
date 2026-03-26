<template>
  <div class="landing-page">
    <!-- ── Topbar ── -->
    <header class="landing-topbar">
      <div class="topbar-brand">
        <div class="topbar-brand-icon">
          <img :src="logoUrl" :alt="t('app.logoAlt')" width="28" height="28">
        </div>
        <span class="topbar-brand-name">{{ t('app.name') }}</span>
        <span class="topbar-brand-divider" />
        <span class="topbar-brand-tagline">{{ t('landing.kicker') }}</span>
      </div>

      <nav class="topbar-nav">
        <a href="#features" class="topbar-nav-link">{{ t('landing.featureEyebrow') }}</a>
        <a href="#workflow" class="topbar-nav-link">{{ t('landing.workflowEyebrow') }}</a>
        <a href="#capabilities" class="topbar-nav-link">{{ t('landing.stackEyebrow') }}</a>
      </nav>

      <div class="topbar-actions">
        <div class="topbar-controls">
          <ThemeToggle />
          <LangToggle />
        </div>
        <template v-if="hasToken">
          <Button
            icon="pi pi-arrow-right"
            icon-pos="right"
            :label="t('landing.enterWorkspaceCompact')"
            class="accent-cta topbar-cta"
            @click="router.push('/workspace')"
          />
        </template>
        <template v-else>
          <Button
            :label="t('auth.loginOrRegister')"
            class="accent-cta topbar-cta"
            @click="openAuth()"
          />
        </template>
      </div>
    </header>

    <main class="landing-main">
      <!-- ── Hero ── -->
      <section class="hero-section">
        <div class="hero-glow hero-glow-1" />
        <div class="hero-glow hero-glow-2" />

        <div class="hero-inner animate-fade-in-up">
          <div class="hero-badges">
            <span class="hero-badge hero-badge-primary">
              <i class="pi pi-sparkles" />
              {{ t('landing.kicker') }}
            </span>
            <span class="hero-badge hero-badge-accent">
              {{ hasToken ? t('landing.enterWorkspaceCompact') : t('landing.enterAppCompact') }}
            </span>
          </div>

          <h1 class="hero-title">{{ t('landing.title') }}</h1>
          <p class="hero-subtitle">{{ t('landing.subtitle') }}</p>

          <div class="hero-actions">
            <Button
              size="large"
              icon="pi pi-bolt"
              :label="enterLabel"
              class="accent-cta hero-cta-primary"
              @click="handleEnter"
            />
            <Button
              size="large"
              text
              icon="pi pi-arrow-down"
              :label="t('landing.featureTitle')"
              class="hero-cta-secondary"
              @click="scrollToFeatures"
            />
          </div>

          <div class="hero-metrics">
            <article v-for="metric in heroMetrics" :key="metric.id" class="hero-metric">
              <div class="hero-metric-value">{{ metric.value }}</div>
              <div class="hero-metric-label">{{ metric.label }}</div>
            </article>
          </div>
        </div>

        <!-- Workspace Preview -->
        <div class="hero-preview animate-fade-in-up delay-200">
          <div class="preview-shell">
            <div class="preview-topbar">
              <div class="preview-dots">
                <span class="preview-dot preview-dot-red" />
                <span class="preview-dot preview-dot-yellow" />
                <span class="preview-dot preview-dot-green" />
              </div>
              <span class="preview-topbar-title">{{ t('app.name') }} — {{ t('workspace.title') }}</span>
              <span class="preview-topbar-badge">{{ t('auth.featureSync') }}</span>
            </div>

            <div class="preview-body">
              <section class="preview-col preview-sidebar-col">
                <div class="preview-col-label">{{ t('landing.previewSidebar') }}</div>
                <div class="preview-folder">
                  <i class="pi pi-inbox" />
                  {{ t('landing.previewFolderInbox') }}
                </div>
                <div class="preview-folder preview-folder-active">
                  <i class="pi pi-briefcase" />
                  {{ t('landing.previewFolderWork') }}
                </div>
                <div class="preview-folder">
                  <i class="pi pi-user" />
                  {{ t('landing.previewFolderPersonal') }}
                </div>
                <div class="preview-tags">
                  <span class="preview-tag">#API</span>
                  <span class="preview-tag">#Markdown</span>
                </div>
              </section>

              <section class="preview-col preview-list-col">
                <div class="preview-col-label">{{ t('landing.previewList') }}</div>
                <article class="preview-note preview-note-active">
                  <div class="preview-note-title">{{ t('landing.previewNoteTitle') }}</div>
                  <div class="preview-note-body">{{ t('landing.previewNoteBody') }}</div>
                  <span class="preview-note-lang">{{ t('landing.previewLangMarkdown') }}</span>
                </article>
                <article class="preview-note">
                  <div class="preview-note-title">{{ t('landing.previewSnippetTitle') }}</div>
                  <div class="preview-note-body">{{ t('landing.previewSnippetBody') }}</div>
                  <span class="preview-note-lang">{{ t('landing.previewLangJavascript') }}</span>
                </article>
              </section>

              <section class="preview-col preview-editor-col">
                <div class="preview-col-label">{{ t('landing.previewEditor') }}</div>
                <div class="preview-editor-title">{{ t('landing.previewNoteTitle') }}</div>
                <div class="preview-code">
                  <div class="preview-code-line">
                    <span class="preview-line-num">1</span>
                    <span class="preview-code-heading">{{ t('landing.previewCodeLine1') }}</span>
                  </div>
                  <div class="preview-code-line">
                    <span class="preview-line-num">2</span>
                    <span class="preview-code-text">{{ t('landing.previewCodeLine2') }}</span>
                  </div>
                  <div class="preview-code-line">
                    <span class="preview-line-num">3</span>
                    <span class="preview-code-text">{{ t('landing.previewCodeLine3') }}</span>
                  </div>
                  <div class="preview-code-line">
                    <span class="preview-line-num">4</span>
                    <span class="preview-code-text">{{ t('landing.previewCodeLine4') }}</span>
                  </div>
                  <div class="preview-cursor" />
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Features ── -->
      <section id="features" class="features-section">
        <div class="section-header animate-fade-in-up">
          <span class="section-kicker">{{ t('landing.featureEyebrow') }}</span>
          <h2 class="section-title">{{ t('landing.featureTitle') }}</h2>
          <p class="section-body">{{ t('landing.featureBody') }}</p>
        </div>

        <div class="features-grid">
          <article v-for="(feat, i) in featureCards" :key="feat.id" class="feature-card animate-fade-in-up" :class="`delay-${(i + 1) * 100}`">
            <div class="feature-card-icon" :style="{ background: feat.iconBg }">
              <i :class="feat.icon" />
            </div>
            <h3 class="feature-card-title">{{ feat.title }}</h3>
            <p class="feature-card-body">{{ feat.body }}</p>
          </article>
        </div>
      </section>

      <!-- ── Story ── -->
      <section class="story-section">
        <div class="section-header animate-fade-in-up">
          <span class="section-kicker">{{ t('landing.storyEyebrow') }}</span>
          <h2 class="section-title">{{ t('landing.storyTitle') }}</h2>
          <p class="section-body">{{ t('landing.storyBody') }}</p>
        </div>

        <div class="story-grid">
          <article v-for="story in storyCards" :key="story.id" class="story-card animate-fade-in-up">
            <div class="story-step">{{ story.index }}</div>
            <h3 class="card-title">{{ story.title }}</h3>
            <p class="card-body">{{ story.body }}</p>
          </article>
        </div>
      </section>

      <!-- ── Workflow ── -->
      <section id="workflow" class="workflow-section">
        <div class="workflow-layout">
          <div class="workflow-copy animate-fade-in-up">
            <span class="section-kicker">{{ t('landing.workflowEyebrow') }}</span>
            <h2 class="section-title">{{ t('landing.workflowTitle') }}</h2>
            <p class="section-body">{{ t('landing.workflowBody') }}</p>
            <blockquote class="workflow-quote">
              <i class="pi pi-quote-left workflow-quote-icon" />
              {{ t('landing.quote') }}
            </blockquote>
          </div>

          <div class="workflow-cards">
            <article v-for="w in workflowCards" :key="w.id" class="workflow-card animate-fade-in-up">
              <div class="story-step">{{ w.index }}</div>
              <h3 class="card-title">{{ w.title }}</h3>
              <p class="card-body">{{ w.body }}</p>
            </article>
          </div>
        </div>
      </section>

      <!-- ── Stack ── -->
      <section id="capabilities" class="stack-section">
        <div class="section-header animate-fade-in-up">
          <span class="section-kicker">{{ t('landing.stackEyebrow') }}</span>
          <h2 class="section-title">{{ t('landing.stackTitle') }}</h2>
          <p class="section-body">{{ t('landing.stackBody') }}</p>
        </div>

        <div class="stack-grid">
          <article v-for="(item, i) in stackCards" :key="item.id" class="stack-card animate-fade-in-up" :class="`delay-${(i + 1) * 100}`">
            <div class="stack-card-icon">
              <i :class="item.icon" />
            </div>
            <h3 class="card-title">{{ item.title }}</h3>
            <p class="card-body">{{ item.body }}</p>
          </article>
        </div>
      </section>

      <!-- ── Final CTA ── -->
      <section class="cta-section">
        <div class="cta-glow" />
        <div class="cta-card animate-fade-in-up">
          <div class="cta-copy">
            <span class="section-kicker">{{ t('landing.ctaEyebrow') }}</span>
            <h2 class="cta-title">{{ t('landing.ctaTitle') }}</h2>
            <p class="cta-body">{{ t('landing.ctaBody') }}</p>
          </div>

          <div class="cta-actions">
            <Button
              size="large"
              icon="pi pi-arrow-right"
              icon-pos="right"
              :label="enterLabel"
              class="accent-cta cta-main-btn"
              @click="handleEnter"
            />
            <div class="cta-pills">
              <span v-for="pill in proofPills" :key="pill" class="cta-pill">{{ pill }}</span>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- ── Footer ── -->
    <footer class="landing-footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <img :src="logoUrl" :alt="t('app.logoAlt')" width="18" height="18">
          <span class="footer-brand-name">{{ t('app.name') }}</span>
        </div>
        <nav class="footer-links">
          <a href="#features">{{ t('landing.featureEyebrow') }}</a>
          <a href="#" @click.prevent="openAuth()">{{ t('landing.enterAppCompact') }}</a>
          <a href="/workspace">{{ t('landing.enterWorkspaceCompact') }}</a>
        </nav>
        <span class="footer-note">{{ t('landing.kicker') }}</span>
      </div>
    </footer>

    <!-- Auth Modal -->
    <AuthModal
      v-model="authModalVisible"
      :redirect="authRedirect"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Button from 'primevue/button';
import ThemeToggle from '../components/common/ThemeToggle.vue';
import LangToggle from '../components/common/LangToggle.vue';
import AuthModal from '../components/auth/AuthModal.vue';
import logoUrl from '../assets/logo.svg';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const hasToken = computed(() => Boolean(localStorage.getItem('accessToken')));
const enterLabel = computed(() => (
  hasToken.value ? t('landing.enterWorkspace') : t('landing.enterApp')
));

// Auth modal state
const authModalVisible = ref(false);
const authRedirect = ref(null);

// Watch query param to drive modal
watch(() => route.query.auth, (val) => {
  if (val === 'true') {
    authRedirect.value = route.query.redirect || null;
    authModalVisible.value = true;
  } else {
    authModalVisible.value = false;
  }
}, { immediate: true });

// Clear query when modal is closed
watch(authModalVisible, (visible) => {
  if (!visible && route.query.auth) {
    router.replace({ query: {} });
  }
});

function openAuth() {
  router.push({ query: { auth: 'true' } });
}

const heroMetrics = computed(() => ([
  { id: 'editor', value: t('landing.metricEditorValue'), label: t('landing.metricEditor') },
  { id: 'sync', value: t('landing.metricSyncValue'), label: t('landing.metricSync') },
  { id: 'offline', value: t('landing.metricOfflineValue'), label: t('landing.metricOffline') },
]));

const featureCards = computed(() => ([
  {
    id: 'notes',
    icon: 'pi pi-file-edit',
    iconBg: 'color-mix(in srgb, var(--primary-color) 12%, transparent)',
    title: t('landing.featureNotesTitle'),
    body: t('landing.featureNotesBody'),
  },
  {
    id: 'folders',
    icon: 'pi pi-folder',
    iconBg: 'color-mix(in srgb, var(--app-cta, #f97316) 12%, transparent)',
    title: t('landing.featureFoldersTitle'),
    body: t('landing.featureFoldersBody'),
  },
  {
    id: 'session',
    icon: 'pi pi-shield',
    iconBg: 'color-mix(in srgb, #8b5cf6 12%, transparent)',
    title: t('landing.featureSessionTitle'),
    body: t('landing.featureSessionBody'),
  },
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
  if (hasToken.value) {
    router.push('/workspace');
  } else {
    openAuth();
  }
}

function scrollToFeatures() {
  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
</script>

<style scoped>
/* ═══════════════════════════════════════════════
   Page Shell
   ═══════════════════════════════════════════════ */
.landing-page {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--text-color);
  overflow-x: hidden;
}

/* ═══════════════════════════════════════════════
   Topbar
   ═══════════════════════════════════════════════ */
.landing-topbar {
  position: sticky;
  top: 1rem;
  z-index: 40;
  width: min(1280px, calc(100% - 3rem));
  margin: 1rem auto 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.72rem 1rem;
  border: 1px solid color-mix(in srgb, var(--app-border) 84%, transparent);
  border-radius: 1rem;
  background: color-mix(in srgb, var(--app-panel-raised, var(--surface-card)) 78%, transparent);
  backdrop-filter: blur(20px) saturate(1.6);
  -webkit-backdrop-filter: blur(20px) saturate(1.6);
  box-shadow: var(--app-shadow-soft);
}

.topbar-brand {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.topbar-brand-icon {
  width: 2.25rem;
  height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-subtle, var(--surface-hover)) 94%, transparent);
  overflow: hidden;
}

.topbar-brand-name {
  font-weight: 800;
  font-size: 1.05rem;
  letter-spacing: -0.03em;
}

.topbar-brand-divider {
  width: 1px;
  height: 1rem;
  background: var(--app-border);
}

.topbar-brand-tagline {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-color-secondary);
}

.topbar-nav {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.topbar-nav-link {
  padding: 0.4rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--text-color-secondary);
  text-decoration: none;
  transition: color 180ms, background 180ms;
}

.topbar-nav-link:hover {
  color: var(--text-color);
  background: color-mix(in srgb, var(--primary-color) 8%, transparent);
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.topbar-controls {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem;
  border-radius: 0.375rem;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-inset, var(--surface-hover)) 92%, transparent);
}

.topbar-cta {
  font-size: 0.82rem;
}

/* ═══════════════════════════════════════════════
   Layout
   ═══════════════════════════════════════════════ */
.landing-main {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.landing-main > section {
  width: min(1280px, calc(100% - 3rem));
  margin: 0 auto;
}

/* ═══════════════════════════════════════════════
   Section Shared
   ═══════════════════════════════════════════════ */
.section-header {
  max-width: 48rem;
  margin-bottom: 2.5rem;
}

.section-kicker {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: 0.76rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--primary-color);
}

.section-title {
  margin: 0.5rem 0 0;
  font-family: var(--font-display, var(--font-sans));
  font-size: clamp(1.8rem, 4vw, 2.8rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.08;
}

.section-body {
  margin: 0.75rem 0 0;
  font-size: 1rem;
  line-height: 1.72;
  color: var(--text-color-secondary);
}

.card-title {
  margin: 0.75rem 0 0;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.card-body {
  margin: 0.4rem 0 0;
  font-size: 0.9rem;
  line-height: 1.65;
  color: var(--text-color-secondary);
}

/* ═══════════════════════════════════════════════
   Hero
   ═══════════════════════════════════════════════ */
.hero-section {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 3rem;
  padding: 4.75rem 0 3rem;
}

.hero-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.18;
  pointer-events: none;
}

.hero-glow-1 {
  width: 420px;
  height: 420px;
  top: -80px;
  left: -120px;
  background: color-mix(in srgb, var(--app-support) 60%, var(--primary-color));
}

.hero-glow-2 {
  width: 320px;
  height: 320px;
  bottom: 60px;
  right: -60px;
  background: color-mix(in srgb, var(--app-cta, #f97316) 82%, var(--primary-color));
  opacity: 0.12;
}

.hero-inner {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 52rem;
}

.hero-badges {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.75rem;
  border-radius: 2rem;
  font-family: var(--font-mono);
  font-size: 0.74rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.hero-badge-primary {
  background: color-mix(in srgb, var(--primary-color) 12%, transparent);
  color: var(--primary-color);
  border: 1px solid color-mix(in srgb, var(--primary-color) 20%, transparent);
}

.hero-badge-accent {
  background: color-mix(in srgb, var(--app-cta, #f97316) 10%, transparent);
  color: var(--app-cta-strong, #ea580c);
  border: 1px solid color-mix(in srgb, var(--app-cta, #f97316) 18%, transparent);
}

.hero-title {
  margin: 0;
  font-family: var(--font-display, var(--font-sans));
  font-size: clamp(2.8rem, 6.5vw, 4.8rem);
  font-weight: 800;
  letter-spacing: -0.05em;
  line-height: 1;
  background: linear-gradient(
    135deg,
    var(--text-color) 18%,
    color-mix(in srgb, var(--text-color) 70%, var(--app-support)) 58%,
    var(--primary-color) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  margin: 0;
  max-width: 42rem;
  font-size: 1.1rem;
  line-height: 1.7;
  color: var(--text-color-secondary);
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.hero-cta-primary {
  min-width: 13rem;
}

.hero-cta-secondary {
  color: var(--text-color-secondary) !important;
}

.hero-metrics {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.hero-metric {
  padding: 0.85rem 1.1rem;
  border-radius: 0.5rem;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-raised, var(--surface-card)) 94%, transparent);
  backdrop-filter: blur(8px);
  box-shadow: var(--app-shadow-soft);
  min-width: 8.5rem;
}

.hero-metric-value {
  font-family: var(--font-display, var(--font-sans));
  font-size: 1.3rem;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.hero-metric-label {
  margin-top: 0.2rem;
  font-size: 0.78rem;
  color: var(--text-color-secondary);
}

/* ── Preview ── */
.hero-preview {
  position: relative;
}

.preview-shell {
  border-radius: 1rem;
  border: 1px solid color-mix(in srgb, var(--primary-color) 12%, var(--app-border));
  background: color-mix(in srgb, var(--app-panel-raised, var(--surface-card)) 96%, transparent);
  overflow: hidden;
  box-shadow: var(--app-shadow);
}

.preview-topbar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 1rem;
  border-bottom: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-raised, var(--surface-card)) 98%, transparent);
}

.preview-dots {
  display: flex;
  gap: 0.35rem;
}

.preview-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.preview-dot-red { background: #ef4444; }
.preview-dot-yellow { background: #f59e0b; }
.preview-dot-green { background: #22c55e; }

.preview-topbar-title {
  flex: 1;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-color-secondary);
  text-align: center;
}

.preview-topbar-badge {
  padding: 0.22rem 0.55rem;
  border-radius: 0.3rem;
  background: color-mix(in srgb, var(--app-support) 12%, transparent);
  color: color-mix(in srgb, var(--app-support) 82%, var(--primary-color));
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 600;
}

.preview-body {
  display: grid;
  grid-template-columns: 180px 220px minmax(0, 1fr);
  gap: 0.6rem;
  padding: 0.6rem;
}

.preview-col {
  padding: 0.85rem;
  border-radius: 0.5rem;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-inset, var(--surface-hover)) 94%, transparent);
}

.preview-col-label {
  margin-bottom: 0.65rem;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-color-secondary);
  opacity: 0.7;
}

.preview-folder {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 0.65rem;
  border-radius: 0.375rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-color-secondary);
  transition: background 180ms;
}

.preview-folder .pi {
  font-size: 0.78rem;
  opacity: 0.6;
}

.preview-folder + .preview-folder {
  margin-top: 0.3rem;
}

.preview-folder-active {
  background: color-mix(in srgb, var(--primary-color) 14%, transparent);
  color: var(--primary-color);
}

.preview-folder-active .pi {
  opacity: 1;
}

.preview-tags {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
  margin-top: 0.75rem;
}

.preview-tag {
  padding: 0.2rem 0.45rem;
  border-radius: 0.25rem;
  border: 1px solid var(--app-border);
  font-family: var(--font-mono);
  font-size: 0.68rem;
  color: var(--text-color-secondary);
}

.preview-note {
  padding: 0.65rem 0.75rem;
  border-radius: 0.375rem;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-raised, var(--surface-card)) 94%, transparent);
  transition: border-color 180ms, background 180ms;
}

.preview-note + .preview-note {
  margin-top: 0.45rem;
}

.preview-note-active {
  border-color: color-mix(in srgb, var(--primary-color) 30%, var(--app-border));
  background: color-mix(in srgb, var(--primary-color) 6%, var(--app-panel-strong, var(--surface-card)));
}

.preview-note-title {
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.preview-note-body {
  margin-top: 0.2rem;
  font-size: 0.76rem;
  color: var(--text-color-secondary);
  line-height: 1.5;
}

.preview-note-lang {
  display: inline-flex;
  margin-top: 0.45rem;
  padding: 0.18rem 0.4rem;
  border-radius: 0.25rem;
  background: color-mix(in srgb, var(--app-cta, #f97316) 10%, transparent);
  color: var(--app-cta-strong, #ea580c);
  font-family: var(--font-mono);
  font-size: 0.66rem;
  font-weight: 600;
}

.preview-editor-title {
  font-size: 0.85rem;
  font-weight: 700;
  margin-bottom: 0.65rem;
}

.preview-code {
  padding: 0.7rem 0.85rem;
  border-radius: 0.375rem;
  border: 1px solid var(--app-code-border);
  background: var(--app-code-bg);
  position: relative;
}

.preview-code-line {
  display: flex;
  gap: 0.75rem;
  line-height: 1.7;
}

.preview-line-num {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--text-color-secondary);
  opacity: 0.4;
  min-width: 1rem;
  text-align: right;
  user-select: none;
}

.preview-code-heading {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--primary-color);
  font-weight: 600;
}

.preview-code-text {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--text-color-secondary);
}

.preview-cursor {
  position: absolute;
  bottom: 0.7rem;
  left: 2.8rem;
  width: 2px;
  height: 1rem;
  background: var(--primary-color);
  border-radius: 1px;
  animation: blink 1.1s step-end infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* ═══════════════════════════════════════════════
   Features
   ═══════════════════════════════════════════════ */
.features-section {
  padding: 4rem 0;
  border-top: 1px solid var(--app-border);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.feature-card {
  padding: 1.5rem;
  border-radius: 0.75rem;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-raised, var(--surface-hover)) 92%, transparent);
  box-shadow: var(--app-shadow-soft);
  transition:
    transform var(--motion-duration-sm, 220ms) var(--motion-ease-standard, ease),
    box-shadow var(--motion-duration-sm, 220ms) var(--motion-ease-standard, ease),
    border-color var(--motion-duration-sm, 220ms);
}

.feature-card:hover {
  transform: translateY(-3px);
  border-color: color-mix(in srgb, var(--primary-color) 25%, var(--app-border));
  box-shadow: 0 24px 42px -34px color-mix(in srgb, var(--primary-color) 28%, #020617);
}

.feature-card-icon {
  width: 2.75rem;
  height: 2.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  color: var(--primary-color);
  font-size: 1.1rem;
}

.feature-card-title {
  margin: 0.85rem 0 0;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.feature-card-body {
  margin: 0.45rem 0 0;
  font-size: 0.9rem;
  line-height: 1.65;
  color: var(--text-color-secondary);
}

/* ═══════════════════════════════════════════════
   Story
   ═══════════════════════════════════════════════ */
.story-section {
  padding: 4rem 0;
  border-top: 1px solid var(--app-border);
}

.story-grid {
  display: flex;
  gap: 1rem;
}

.story-card,
.workflow-card {
  flex: 1;
  min-width: 0;
  padding: 1.25rem;
  border-radius: 0.5rem;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-raised, var(--surface-hover)) 92%, transparent);
  box-shadow: var(--app-shadow-soft);
  transition:
    transform var(--motion-duration-sm, 220ms) var(--motion-ease-standard, ease),
    border-color var(--motion-duration-sm, 220ms);
}

.story-card:hover,
.workflow-card:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--primary-color) 20%, var(--app-border));
}

.story-step {
  display: inline-flex;
  padding: 0.22rem 0.5rem;
  border-radius: 0.3rem;
  background: color-mix(in srgb, var(--primary-color) 12%, transparent);
  color: var(--primary-color);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 700;
}

/* ═══════════════════════════════════════════════
   Workflow
   ═══════════════════════════════════════════════ */
.workflow-section {
  padding: 4rem 0;
  border-top: 1px solid var(--app-border);
}

.workflow-layout {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 2rem;
  align-items: start;
}

.workflow-copy {
  position: sticky;
  top: 5rem;
}

.workflow-quote {
  margin: 1.5rem 0 0;
  padding: 1rem 1.25rem;
  border-left: 4px solid var(--app-cta, #f97316);
  border-radius: 0 0.75rem 0.75rem 0;
  background: color-mix(in srgb, var(--app-cta, #f97316) 6%, transparent);
  font-size: 0.95rem;
  line-height: 1.7;
  position: relative;
}

.workflow-quote-icon {
  color: var(--app-cta, #f97316);
  opacity: 0.3;
  font-size: 0.9rem;
  margin-right: 0.35rem;
}

.workflow-cards {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

/* ═══════════════════════════════════════════════
   Stack
   ═══════════════════════════════════════════════ */
.stack-section {
  padding: 4rem 0;
  border-top: 1px solid var(--app-border);
}

.stack-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.stack-card {
  padding: 1.25rem;
  border-radius: 0.5rem;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-raised, var(--surface-hover)) 92%, transparent);
  box-shadow: var(--app-shadow-soft);
  transition:
    transform var(--motion-duration-sm, 220ms) var(--motion-ease-standard, ease),
    border-color var(--motion-duration-sm, 220ms);
}

.stack-card:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--primary-color) 20%, var(--app-border));
}

.stack-card-icon {
  width: 2.5rem;
  height: 2.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  background: color-mix(in srgb, var(--primary-color) 12%, transparent);
  color: var(--primary-color);
  font-size: 1rem;
}

/* ═══════════════════════════════════════════════
   CTA
   ═══════════════════════════════════════════════ */
.cta-section {
  position: relative;
  padding: 4rem 0 2rem;
  border-top: 1px solid var(--app-border);
}

.cta-glow {
  position: absolute;
  width: 500px;
  height: 300px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: color-mix(in srgb, var(--app-support) 40%, var(--primary-color));
  filter: blur(120px);
  opacity: 0.08;
  pointer-events: none;
}

.cta-card {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 2rem;
  align-items: center;
  padding: 2.5rem;
  border-radius: 1rem;
  border: 1px solid color-mix(in srgb, var(--primary-color) 20%, var(--app-border));
  background: linear-gradient(
    160deg,
    color-mix(in srgb, var(--app-panel-raised) 94%, transparent),
    color-mix(in srgb, var(--primary-color) 6%, var(--app-panel-subtle, var(--surface-hover)))
  );
  box-shadow: var(--app-shadow);
}

.cta-title {
  margin: 0.5rem 0 0;
  font-family: var(--font-display, var(--font-sans));
  font-size: clamp(1.6rem, 3.5vw, 2.4rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.1;
}

.cta-body {
  margin: 0.65rem 0 0;
  font-size: 0.95rem;
  line-height: 1.65;
  color: var(--text-color-secondary);
}

.cta-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.85rem;
}

.cta-main-btn {
  min-width: 14rem;
}

.cta-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  justify-content: flex-end;
}

.cta-pill {
  padding: 0.25rem 0.6rem;
  border-radius: 0.3rem;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-raised, var(--surface-card)) 94%, transparent);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--text-color-secondary);
}

/* ═══════════════════════════════════════════════
   Footer
   ═══════════════════════════════════════════════ */
.landing-footer {
  width: 100%;
  padding: 0 1.5rem;
}

.footer-inner {
  width: min(1280px, 100%);
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 0;
  border-top: 1px solid var(--app-border);
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.footer-brand-name {
  font-weight: 700;
  font-size: 0.9rem;
}

.footer-links {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.footer-links a {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
  text-decoration: none;
  transition: color 180ms;
}

.footer-links a:hover {
  color: var(--primary-color);
}

.footer-note {
  font-size: 0.78rem;
  color: var(--text-color-secondary);
  opacity: 0.5;
}

/* ═══════════════════════════════════════════════
   Animations
   ═══════════════════════════════════════════════ */
.animate-fade-in-up {
  animation: fade-in-up var(--motion-duration-lg, 560ms) var(--motion-ease-emphasized, cubic-bezier(0.16, 1, 0.3, 1)) both;
}

@keyframes fade-in-up {
  0% { opacity: 0; transform: translateY(var(--motion-distance-md, 18px)); }
  100% { opacity: 1; transform: translateY(0); }
}

.delay-100 { animation-delay: 100ms; }
.delay-200 { animation-delay: 200ms; }
.delay-300 { animation-delay: 300ms; }
.delay-400 { animation-delay: 400ms; }

/* ═══════════════════════════════════════════════
   Responsive
   ═══════════════════════════════════════════════ */
@media (max-width: 1100px) {
  .topbar-nav { display: none; }

  .preview-body {
    grid-template-columns: 160px 200px minmax(0, 1fr);
  }

  .workflow-layout,
  .cta-card {
    grid-template-columns: 1fr;
  }

  .workflow-copy {
    position: static;
  }

  .cta-actions {
    align-items: flex-start;
  }

  .cta-pills {
    justify-content: flex-start;
  }
}

@media (max-width: 920px) {
  .features-grid {
    grid-template-columns: 1fr;
  }

  .story-grid {
    flex-direction: column;
  }

  .stack-grid {
    grid-template-columns: 1fr;
  }

  .hero-metrics {
    flex-direction: column;
  }

  .preview-body {
    grid-template-columns: 1fr;
  }

  .preview-sidebar-col {
    display: none;
  }
}

@media (max-width: 640px) {
  .landing-main > section {
    width: calc(100% - 1.5rem);
  }

  .landing-topbar {
    top: 0.5rem;
    width: calc(100% - 1.5rem);
    margin-top: 0.5rem;
    padding: 0.5rem 0.75rem;
  }

  .topbar-brand-tagline,
  .topbar-brand-divider {
    display: none;
  }

  .hero-section {
    padding: 2.5rem 0 2rem;
  }

  .hero-title {
    font-size: clamp(2.2rem, 12vw, 3.5rem);
  }

  .hero-actions {
    width: 100%;
  }

  .hero-actions :deep(.p-button) {
    width: 100%;
  }

  .cta-card {
    padding: 1.5rem;
  }

  .footer-inner {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
