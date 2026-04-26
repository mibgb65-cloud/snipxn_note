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
        <a href="#download" class="topbar-nav-link">{{ t('landing.downloadEyebrow') }}</a>
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
        <div class="hero-visual-scene" aria-hidden="true">
          <div class="hero-scene-grid" />

          <div class="hero-preview hero-preview-main">
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

          <div class="hero-phone-preview">
            <div class="hero-phone-notch" />
            <div class="hero-phone-screen">
              <img :src="logoUrl" alt="" width="30" height="30" class="hero-phone-logo">
              <span class="hero-phone-name">{{ t('app.name') }}</span>
              <div class="hero-phone-status">
                <span>{{ t('landing.downloadVersion') }}</span>
                <i class="pi pi-check-circle" />
              </div>
              <div class="hero-phone-list">
                <span>{{ t('landing.downloadFeature1') }}</span>
                <span>{{ t('landing.downloadFeature2') }}</span>
                <span>{{ t('landing.downloadFeature3') }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="hero-content animate-fade-in-up">
          <div class="hero-badges">
            <span class="hero-badge hero-badge-primary">
              <i class="pi pi-code" />
              {{ t('landing.kicker') }}
            </span>
            <span class="hero-badge hero-badge-accent">
              {{ t('landing.downloadVersion') }}
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
          <article
            v-for="(feat, i) in featureCards"
            :key="feat.id"
            class="feature-card animate-fade-in-up"
            :class="`delay-${(i + 1) * 100}`"
            :style="{ '--feature-accent': feat.accent, '--feature-bg': feat.iconBg }"
          >
            <div class="feature-card-icon">
              <i :class="feat.icon" />
            </div>
            <h3 class="feature-card-title">{{ feat.title }}</h3>
            <p class="feature-card-body">{{ feat.body }}</p>
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

      <!-- ── Download App ── -->
      <section id="download" class="download-section">
        <div class="download-layout animate-fade-in-up">
          <div class="download-copy">
            <span class="section-kicker">{{ t('landing.downloadEyebrow') }}</span>
            <h2 class="section-title">{{ t('landing.downloadTitle') }}</h2>
            <p class="section-body">{{ t('landing.downloadBody') }}</p>

            <div class="download-features">
              <div class="download-feature">
                <i class="pi pi-cloud-download" />
                <span>{{ t('landing.downloadFeature1') }}</span>
              </div>
              <div class="download-feature">
                <i class="pi pi-sync" />
                <span>{{ t('landing.downloadFeature2') }}</span>
              </div>
              <div class="download-feature">
                <i class="pi pi-file-edit" />
                <span>{{ t('landing.downloadFeature3') }}</span>
              </div>
            </div>

            <div class="download-actions">
              <a :href="apkDownloadUrl" download class="download-btn">
                <i class="pi pi-android" />
                <div class="download-btn-text">
                  <span class="download-btn-label">{{ t('landing.downloadAndroid') }}</span>
                  <span class="download-btn-meta">{{ t('landing.downloadVersion') }} · {{ t('landing.downloadApkSize') }}</span>
                </div>
              </a>
              <span class="download-requirement">{{ t('landing.downloadRequirement') }}</span>
            </div>
          </div>

          <div class="download-qr-area animate-fade-in-up delay-200">
            <div class="download-phone-frame">
              <div class="download-phone-notch" />
              <div class="download-phone-screen">
                <img :src="logoUrl" alt="Snipxn" width="32" height="32" class="download-phone-logo">
                <span class="download-phone-name">{{ t('app.name') }}</span>
                <canvas ref="qrCanvas" class="download-qr-code" />
                <span class="download-qr-label">{{ t('landing.downloadQrHint') }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Final CTA ── -->
      <section class="cta-section">
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
          <a href="#download">{{ t('landing.downloadEyebrow') }}</a>
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
import { computed, ref, watch, onMounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import QRCode from 'qrcode';
import Button from 'primevue/button';
import ThemeToggle from '../components/common/ThemeToggle.vue';
import LangToggle from '../components/common/LangToggle.vue';
import AuthModal from '../components/auth/AuthModal.vue';
import { useLogoUrl } from '../composables/useLogoUrl';

const { logoUrl } = useLogoUrl();

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

const featureCards = computed(() => ([
  {
    id: 'notes',
    icon: 'pi pi-file-edit',
    iconBg: 'color-mix(in srgb, var(--primary-color) 12%, transparent)',
    accent: 'var(--primary-color)',
    title: t('landing.featureNotesTitle'),
    body: t('landing.featureNotesBody'),
  },
  {
    id: 'folders',
    icon: 'pi pi-folder',
    iconBg: 'color-mix(in srgb, var(--app-cta, #f97316) 12%, transparent)',
    accent: 'var(--app-cta-strong, #ea580c)',
    title: t('landing.featureFoldersTitle'),
    body: t('landing.featureFoldersBody'),
  },
  {
    id: 'session',
    icon: 'pi pi-shield',
    iconBg: 'color-mix(in srgb, #8b5cf6 12%, transparent)',
    accent: '#8b5cf6',
    title: t('landing.featureSessionTitle'),
    body: t('landing.featureSessionBody'),
  },
]));

const workflowCards = computed(() => ([
  { id: 'capture', index: '01', title: t('landing.workflowCaptureTitle'), body: t('landing.workflowCaptureBody') },
  { id: 'organize', index: '02', title: t('landing.workflowOrganizeTitle'), body: t('landing.workflowOrganizeBody') },
  { id: 'continue', index: '03', title: t('landing.workflowContinueTitle'), body: t('landing.workflowContinueBody') },
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

// ── Download & QR ──
const apkDownloadUrl = '/downloads/snipxn-v1.3.0.apk';
const qrCanvas = ref(null);

onMounted(async () => {
  await nextTick();
  if (qrCanvas.value) {
    const downloadUrl = `${window.location.origin}${apkDownloadUrl}`;
    QRCode.toCanvas(qrCanvas.value, downloadUrl, {
      width: 160,
      margin: 2,
      color: { dark: '#1e293b', light: '#ffffff' },
    });
  }
});
</script>

<style scoped>
/* ═══════════════════════════════════════════════
   Page Shell
   ═══════════════════════════════════════════════ */
.landing-page {
  --landing-heading-color: color-mix(in srgb, var(--text-color) 78%, var(--primary-color) 22%);
  --landing-title-color: color-mix(in srgb, var(--text-color) 72%, var(--primary-color) 28%);
  --landing-copy-color: color-mix(in srgb, var(--text-color-secondary) 82%, var(--app-support) 18%);
  --landing-muted-color: color-mix(in srgb, var(--text-color-secondary) 76%, var(--primary-color) 24%);
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--text-color);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--app-panel-inset, var(--surface-ground)) 82%, transparent) 0%, transparent 34rem),
    var(--surface-ground);
  overflow-x: hidden;
}

/* ═══════════════════════════════════════════════
   Topbar
   ═══════════════════════════════════════════════ */
.landing-topbar {
  position: sticky;
  top: 1rem;
  z-index: 40;
  width: min(1440px, calc(100% - 2rem));
  margin: 1rem auto 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(1rem, 2vw, 2.25rem);
  padding: 0.72rem clamp(1rem, 1.7vw, 1.5rem);
  border: 1px solid color-mix(in srgb, var(--app-border) 84%, transparent);
  border-radius: 1rem;
  background: color-mix(in srgb, var(--app-panel-raised, var(--surface-card)) 78%, transparent);
  backdrop-filter: blur(20px) saturate(1.6);
  -webkit-backdrop-filter: blur(20px) saturate(1.6);
  box-shadow: var(--app-shadow-soft);
}

.topbar-brand {
  flex: 1 1 0;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  min-width: 0;
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
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 0.45rem;
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
  flex: 1 1 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.6rem;
  min-width: 0;
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
  width: 100%;
  margin: 0 auto;
  padding-inline: max(1.5rem, calc((100% - 1280px) / 2));
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
  font-size: 0.74rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--primary-color);
  opacity: 0.85;
}

.section-title {
  margin: 0.6rem 0 0;
  font-family: var(--font-display, var(--font-sans));
  font-size: clamp(1.7rem, 3.8vw, 2.5rem);
  font-weight: 750;
  letter-spacing: -0.035em;
  line-height: 1.15;
  color: var(--landing-heading-color);
}

.section-body {
  margin: 0.85rem 0 0;
  font-size: 0.95rem;
  line-height: 1.75;
  color: var(--landing-copy-color);
  font-weight: 400;
  opacity: 0.9;
}

.card-title {
  margin: 0.75rem 0 0;
  font-size: 0.95rem;
  font-weight: 650;
  letter-spacing: -0.015em;
  color: var(--landing-title-color);
}

.card-body {
  margin: 0.4rem 0 0;
  font-size: 0.85rem;
  line-height: 1.7;
  color: var(--landing-muted-color);
  font-weight: 400;
  opacity: 0.82;
}

/* ═══════════════════════════════════════════════
   Hero
   ═══════════════════════════════════════════════ */
.hero-section {
  position: relative;
  min-height: clamp(640px, 78svh, 800px);
  padding-block: clamp(3.75rem, 9vh, 6.5rem) 4rem;
  padding-inline: 0;
  overflow: hidden;
  isolation: isolate;
}

.hero-section::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
  background:
    linear-gradient(90deg, var(--surface-ground) 0%, color-mix(in srgb, var(--surface-ground) 98%, transparent) 40%, color-mix(in srgb, var(--surface-ground) 86%, transparent) 58%, transparent 82%),
    linear-gradient(180deg, transparent 72%, var(--surface-ground) 100%);
  pointer-events: none;
}

.hero-visual-scene {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.hero-scene-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(color-mix(in srgb, var(--primary-color) 10%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in srgb, var(--app-cta, #f97316) 8%, transparent) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: linear-gradient(90deg, transparent 0%, #000 38%, #000 90%, transparent 100%);
  opacity: 0.36;
}

.hero-content {
  position: relative;
  z-index: 2;
  width: min(1280px, calc(100% - 3rem));
  min-height: clamp(520px, 62svh, 650px);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1.45rem;
  max-width: 42rem;
  margin-left: max(1.5rem, calc((100% - 1280px) / 2));
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
  max-width: 42rem;
  font-size: clamp(2.85rem, 5.2vw, 4.85rem);
  font-weight: 800;
  letter-spacing: -0.035em;
  line-height: 1.04;
  color: var(--text-color);
}

.hero-subtitle {
  margin: 0;
  max-width: 41rem;
  font-size: clamp(1rem, 1.4vw, 1.16rem);
  line-height: 1.75;
  color: var(--text-color-secondary);
  font-weight: 400;
  opacity: 0.86;
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

/* ── Preview ── */
.hero-preview {
  position: relative;
}

.hero-preview-main {
  position: absolute;
  top: clamp(6.5rem, 13vh, 9rem);
  right: max(-4rem, calc((100% - 1280px) / 2 - 8rem));
  width: min(820px, 66vw);
  transform: perspective(1200px) rotateX(1deg) rotateY(-4deg) rotateZ(0.5deg);
  transform-origin: right center;
  opacity: 0.86;
}

.preview-shell {
  border-radius: 1.1rem;
  border: 1px solid color-mix(in srgb, var(--primary-color) 12%, var(--app-border));
  background: color-mix(in srgb, var(--app-panel-raised, var(--surface-card)) 96%, transparent);
  overflow: hidden;
  box-shadow:
    0 36px 120px -58px color-mix(in srgb, var(--primary-color) 38%, #020617),
    0 18px 56px -34px color-mix(in srgb, var(--app-cta, #f97316) 36%, #020617),
    var(--app-shadow);
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
  color: var(--app-code-muted, #94a3b8);
  opacity: 0.5;
  min-width: 1rem;
  text-align: right;
  user-select: none;
}

.preview-code-heading {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--app-code-text, #dbeafe);
  font-weight: 600;
}

.preview-code-text {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--app-code-muted, #94a3b8);
}

.preview-cursor {
  position: absolute;
  bottom: 0.7rem;
  left: 2.8rem;
  width: 2px;
  height: 1rem;
  background: var(--app-code-text, #dbeafe);
  border-radius: 1px;
  animation: blink 1.1s step-end infinite;
}

.hero-phone-preview {
  position: absolute;
  display: none;
  right: max(2rem, calc((100% - 1280px) / 2 + 1.5rem));
  bottom: 4.8rem;
  width: 218px;
  padding: 0.8rem;
  border-radius: 1.8rem;
  border: 1px solid color-mix(in srgb, var(--app-cta, #f97316) 28%, var(--app-border));
  background: color-mix(in srgb, var(--app-panel-raised, var(--surface-card)) 96%, transparent);
  box-shadow: 0 32px 90px -44px color-mix(in srgb, var(--app-cta, #f97316) 50%, #020617);
  transform: rotate(2deg);
}

.hero-phone-notch {
  width: 72px;
  height: 6px;
  margin: 0 auto 0.75rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--app-border) 78%, transparent);
}

.hero-phone-screen {
  display: flex;
  min-height: 260px;
  flex-direction: column;
  align-items: center;
  gap: 0.58rem;
  padding: 1rem 0.75rem 0.85rem;
  border-radius: 1.2rem;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--primary-color) 10%, var(--app-panel-inset, var(--surface-hover))), var(--app-panel-raised, var(--surface-card)));
}

.hero-phone-logo {
  filter: drop-shadow(0 8px 18px color-mix(in srgb, var(--primary-color) 22%, transparent));
}

.hero-phone-name {
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: -0.025em;
}

.hero-phone-status {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.55rem;
  border-radius: 999px;
  color: var(--app-cta-strong, #ea580c);
  background: color-mix(in srgb, var(--app-cta, #f97316) 12%, transparent);
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 700;
}

.hero-phone-list {
  width: 100%;
  display: grid;
  gap: 0.5rem;
  margin-top: 0.35rem;
}

.hero-phone-list span {
  display: block;
  padding: 0.62rem 0.72rem;
  border-radius: 0.65rem;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-raised, var(--surface-card)) 88%, transparent);
  color: var(--text-color-secondary);
  font-size: 0.76rem;
  font-weight: 650;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* ═══════════════════════════════════════════════
   Features
   ═══════════════════════════════════════════════ */
.features-section {
  padding-block: 6rem;
  border-top: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-inset, var(--surface-hover)) 38%, transparent);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.1rem;
}

.feature-card {
  position: relative;
  min-height: 14rem;
  padding: 1.6rem;
  border-radius: 0.5rem;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-raised, var(--surface-hover)) 92%, transparent);
  box-shadow: var(--app-shadow-soft);
  overflow: hidden;
  transition:
    transform var(--motion-duration-sm, 220ms) var(--motion-ease-standard, ease),
    box-shadow var(--motion-duration-sm, 220ms) var(--motion-ease-standard, ease),
    border-color var(--motion-duration-sm, 220ms);
}

.feature-card::before {
  content: "";
  position: absolute;
  inset: 0 0 auto;
  height: 3px;
  background: var(--feature-accent, var(--primary-color));
  opacity: 0.85;
}

.feature-card:hover {
  transform: translateY(-3px);
  border-color: color-mix(in srgb, var(--feature-accent, var(--primary-color)) 28%, var(--app-border));
  box-shadow: 0 24px 42px -34px color-mix(in srgb, var(--feature-accent, var(--primary-color)) 34%, #020617);
}

.feature-card-icon {
  width: 2.75rem;
  height: 2.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  background: var(--feature-bg, color-mix(in srgb, var(--primary-color) 12%, transparent));
  color: var(--feature-accent, var(--primary-color));
  font-size: 1.1rem;
}

.feature-card-title {
  margin: 0.85rem 0 0;
  font-size: 0.98rem;
  font-weight: 650;
  letter-spacing: -0.015em;
  color: color-mix(in srgb, var(--landing-title-color) 86%, var(--feature-accent, var(--primary-color)) 14%);
}

.feature-card-body {
  margin: 0.45rem 0 0;
  font-size: 0.85rem;
  line-height: 1.7;
  color: var(--landing-muted-color);
  font-weight: 400;
  opacity: 0.82;
}

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
  padding-block: 6rem;
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

.workflow-cards {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

/* ═══════════════════════════════════════════════
   Download
   ═══════════════════════════════════════════════ */
.download-section {
  padding-block: 6rem;
  border-top: 1px solid var(--app-border);
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--primary-color) 7%, transparent), color-mix(in srgb, var(--app-cta, #f97316) 6%, transparent)),
    color-mix(in srgb, var(--app-panel-inset, var(--surface-hover)) 28%, transparent);
}

.download-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
  gap: 3rem;
  align-items: center;
}

.download-copy {
  display: flex;
  flex-direction: column;
}

.download-features {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  margin-top: 1.5rem;
}

.download-feature {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  font-size: 0.9rem;
  color: var(--landing-muted-color);
}

.download-feature span {
  font-weight: 450;
  opacity: 0.86;
}

.download-feature .pi {
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  background: color-mix(in srgb, var(--primary-color) 10%, transparent);
  color: var(--primary-color);
  font-size: 0.82rem;
  opacity: 0.85;
}

.download-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 1.75rem;
  flex-wrap: wrap;
}

.download-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1.5rem;
  border-radius: 0.75rem;
  border: 1px solid color-mix(in srgb, var(--primary-color) 20%, var(--app-border));
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--primary-color) 14%, var(--app-panel-raised, var(--surface-card))),
    color-mix(in srgb, var(--app-support) 8%, var(--app-panel-raised, var(--surface-card)))
  );
  color: var(--landing-heading-color);
  text-decoration: none;
  font-weight: 600;
  transition:
    transform var(--motion-duration-sm, 220ms) var(--motion-ease-standard, ease),
    box-shadow var(--motion-duration-sm, 220ms),
    border-color var(--motion-duration-sm, 220ms);
  box-shadow: var(--app-shadow-soft);
}

.download-btn:hover {
  transform: translateY(-2px);
  border-color: var(--primary-color);
  box-shadow: 0 12px 32px -12px color-mix(in srgb, var(--primary-color) 30%, #020617);
}

.download-btn .pi {
  font-size: 1.4rem;
  color: var(--primary-color);
}

.download-btn-text {
  display: flex;
  flex-direction: column;
}

.download-btn-label {
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.download-btn-meta {
  font-size: 0.72rem;
  color: var(--landing-muted-color);
  font-weight: 500;
}

.download-requirement {
  font-size: 0.78rem;
  color: var(--landing-muted-color);
  opacity: 0.78;
}

.download-qr-area {
  display: flex;
  justify-content: center;
}

.download-phone-frame {
  position: relative;
  width: 240px;
  padding: 1rem;
  border-radius: 2rem;
  border: 3px solid color-mix(in srgb, var(--primary-color) 20%, var(--app-border));
  background: color-mix(in srgb, var(--app-panel-raised, var(--surface-card)) 96%, transparent);
  box-shadow:
    var(--app-shadow),
    inset 0 1px 0 color-mix(in srgb, #fff 6%, transparent);
  overflow: hidden;
}

.download-phone-notch {
  width: 80px;
  height: 6px;
  margin: 0 auto 1rem;
  border-radius: 3px;
  background: color-mix(in srgb, var(--app-border) 80%, transparent);
}

.download-phone-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.65rem;
  padding: 1rem 0 0.5rem;
}

.download-phone-logo {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.download-phone-name {
  font-weight: 800;
  font-size: 1rem;
  letter-spacing: -0.03em;
  color: var(--landing-title-color);
}

.download-qr-code {
  width: 160px !important;
  height: 160px !important;
  border-radius: 0.5rem;
  border: 1px solid var(--app-border);
}

.download-qr-label {
  font-size: 0.76rem;
  font-weight: 600;
  color: var(--landing-muted-color);
  letter-spacing: 0.04em;
}

/* ═══════════════════════════════════════════════
   CTA
   ═══════════════════════════════════════════════ */
.cta-section {
  position: relative;
  padding-block: 5.5rem 3.5rem;
  border-top: 1px solid var(--app-border);
}

.cta-card {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 2rem;
  align-items: center;
  padding: 2.5rem;
  border-radius: 0.5rem;
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
  font-size: clamp(1.5rem, 3.2vw, 2.1rem);
  font-weight: 750;
  letter-spacing: -0.035em;
  line-height: 1.15;
  color: var(--landing-heading-color);
}

.cta-body {
  margin: 0.65rem 0 0;
  font-size: 0.9rem;
  line-height: 1.7;
  color: var(--landing-copy-color);
  font-weight: 400;
  opacity: 0.9;
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
  color: var(--landing-muted-color);
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
  font-size: 0.82rem;
  font-weight: 450;
  color: var(--text-color-secondary);
  text-decoration: none;
  opacity: 0.72;
  transition: color 180ms, opacity 180ms;
}

.footer-links a:hover {
  opacity: 1;
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

  .hero-content {
    max-width: 43rem;
  }

  .hero-preview-main {
    top: 8rem;
    right: -8rem;
    width: 760px;
    opacity: 0.68;
  }

  .hero-phone-preview {
    display: none;
  }

  .preview-body {
    grid-template-columns: 160px 200px minmax(0, 1fr);
  }

  .workflow-layout,
  .cta-card,
  .download-layout {
    grid-template-columns: 1fr;
  }

  .download-qr-area {
    justify-content: flex-start;
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

  .hero-section {
    min-height: 760px;
  }

  .hero-section::before {
    background:
      linear-gradient(180deg, var(--surface-ground) 0%, color-mix(in srgb, var(--surface-ground) 92%, transparent) 52%, var(--surface-ground) 100%),
      linear-gradient(90deg, var(--surface-ground) 0%, color-mix(in srgb, var(--surface-ground) 70%, transparent) 100%);
  }

  .hero-content {
    width: calc(100% - 3rem);
    min-height: 560px;
    margin-inline: 1.5rem;
  }

  .hero-preview-main {
    top: 24rem;
    right: -18rem;
    width: 720px;
    opacity: 0.34;
    transform: perspective(1200px) rotateX(0deg) rotateY(-5deg);
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
    padding-inline: 0.75rem;
  }

  .landing-main > .hero-section {
    padding-inline: 0;
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
    min-height: 740px;
    padding-block: 2.5rem 2rem;
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

@media (prefers-reduced-motion: reduce) {
  .animate-fade-in-up,
  .preview-cursor {
    animation: none;
  }

  .feature-card,
  .workflow-card,
  .download-btn,
  .topbar-nav-link,
  .footer-links a {
    transition: none;
  }
}
</style>
