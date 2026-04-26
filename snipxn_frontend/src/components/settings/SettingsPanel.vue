<template>
  <div class="settings-shell">
    <aside class="settings-nav">
      <div class="settings-nav-hero">
        <span class="settings-nav-kicker">{{ t('settings.heroKicker') }}</span>
        <h2 class="settings-nav-title">{{ t('settings.title') }}</h2>
      </div>

      <div class="settings-nav-list">
        <button
          v-for="section in sections"
          :key="section.id"
          type="button"
          class="settings-nav-item"
          :class="{ 'settings-nav-item-active': activeSection === section.id }"
          @click="activeSection = section.id"
        >
          <span class="settings-nav-icon">
            <i :class="section.icon" />
          </span>

          <span class="settings-nav-copy">
            <strong>{{ section.label }}</strong>
            <span>{{ section.description }}</span>
          </span>
        </button>
      </div>
    </aside>

    <main class="settings-content">
      <header class="settings-content-header">
        <div class="settings-content-heading">
          <span class="settings-content-kicker">{{ t('settings.title') }}</span>
          <h3 class="settings-content-title">{{ activeSectionMeta.label }}</h3>
          <p class="settings-content-description">{{ activeSectionMeta.description }}</p>
        </div>
      </header>

      <div class="settings-content-body">
        <ProfileForm
          v-if="activeSection === 'profile'"
          :profile="userStore.profile"
          :saving="userStore.savingProfile"
          :avatar-uploading="uploadingAvatar"
          @submit="handleProfileSave"
          @upload-avatar="handleAvatarUpload"
        />

        <AccountSecurityForm
          v-else-if="activeSection === 'security'"
          :linked-accounts="userStore.linkedAccounts"
          :loading-linked-accounts="userStore.loadingLinkedAccounts"
          :password-loading="userStore.changingPassword"
          @submit-password="handlePasswordSave"
          @unbind="handleUnbind"
        />

        <DeviceList
          v-else-if="activeSection === 'devices'"
          :devices="userStore.devices"
          :loading="userStore.loadingDevices"
          :current-device-id="currentDeviceId"
          @revoke="handleRevokeDevice"
          @revoke-others="handleRevokeOthers"
        />

        <section v-else-if="activeSection === 'theme'" class="settings-section">
          <ThemeSelector />
        </section>

        <section v-else-if="activeSection === 'font'" class="settings-section">
          <FontSelector />
        </section>

        <section v-else-if="activeSection === 'language'" class="settings-section">
          <LanguageSelector />
        </section>

        <StorageBar
          v-else-if="activeSection === 'storage'"
          :breakdown="userStore.storageBreakdown"
          :loading="userStore.loadingStorageBreakdown"
        />

        <FeedbackForm
          v-else-if="activeSection === 'feedback'"
          :submitting="submittingFeedback"
          @submit="handleFeedbackSubmit"
        />
      </div>
    </main>

    <Dialog
      v-model:visible="confirmDialogVisible"
      modal
      :draggable="false"
      :header="confirmTitle"
      :style="{ width: 'min(28rem, calc(100vw - 2rem))' }"
    >
      <div class="settings-confirm-dialog">
        <div class="settings-confirm-icon">
          <i :class="confirmIcon" aria-hidden="true" />
        </div>
        <p class="settings-confirm-message">{{ confirmMessage }}</p>
      </div>

      <div class="settings-confirm-actions">
        <Button
          type="button"
          severity="secondary"
          text
          :label="t('common.cancel')"
          :disabled="confirmSubmitting"
          @click="closeConfirmDialog()"
        />
        <Button
          type="button"
          severity="danger"
          :label="confirmActionLabel"
          :loading="confirmSubmitting"
          @click="handleConfirmDialogAction"
        />
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import { getDeviceId } from '../../composables/useDeviceId';
import { useUserStore } from '../../stores/user';
import { buildSettingsSections } from './settingsSections';
import ThemeSelector from './ThemeSelector.vue';
import FontSelector from './FontSelector.vue';
import LanguageSelector from './LanguageSelector.vue';
import ProfileForm from './ProfileForm.vue';
import AccountSecurityForm from './AccountSecurityForm.vue';
import DeviceList from './DeviceList.vue';
import StorageBar from './StorageBar.vue';
import FeedbackForm from './FeedbackForm.vue';
import { submitFeedback } from '../../api/feedback';

const props = defineProps({
  initialSection: {
    type: String,
    default: 'profile',
  },
});

const emit = defineEmits(['section-change']);
const { t } = useI18n();
const toast = useToast();
const userStore = useUserStore();

const activeSection = ref(props.initialSection || 'profile');
const currentDeviceId = getDeviceId();
const confirmDialogVisible = ref(false);
const confirmSubmitting = ref(false);
const confirmDialogMode = ref('');
const confirmDialogTarget = ref(null);
const submittingFeedback = ref(false);
const uploadingAvatar = ref(false);

const sections = computed(() => buildSettingsSections(t));
const activeSectionMeta = computed(() => (
  sections.value.find((section) => section.id === activeSection.value) || sections.value[0]
));
const confirmTitle = computed(() => {
  if (confirmDialogMode.value === 'revoke-others') return t('devices.revokeOthers');
  if (confirmDialogMode.value === 'unbind') return t('security.unbind');
  return t('devices.revoke');
});
const confirmActionLabel = computed(() => {
  if (confirmDialogMode.value === 'revoke-others') return t('devices.revokeOthers');
  if (confirmDialogMode.value === 'unbind') return t('security.unbind');
  return t('devices.revoke');
});
const confirmMessage = computed(() => {
  if (confirmDialogMode.value === 'revoke-others') return t('devices.revokeOthersConfirm');
  if (confirmDialogMode.value === 'unbind') return t('security.unbindConfirm');
  return t('devices.revokeConfirm');
});
const confirmIcon = computed(() => {
  if (confirmDialogMode.value === 'revoke-others') return 'pi pi-shield';
  if (confirmDialogMode.value === 'unbind') return 'pi pi-link';
  return 'pi pi-trash';
});

watch(
  () => props.initialSection,
  (section) => {
    const nextSection = section || 'profile';

    if (sections.value.some((item) => item.id === nextSection)) {
      activeSection.value = nextSection;
    }
  },
);

watch(
  activeSection,
  (section) => {
    emit('section-change', section);
  },
  { immediate: true },
);

watch(
  sections,
  (nextSections) => {
    if (!nextSections.some((section) => section.id === activeSection.value)) {
      activeSection.value = nextSections[0]?.id || 'profile';
    }
  },
  { immediate: true },
);

onMounted(async () => {
  activeSection.value = props.initialSection || 'profile';
  await loadSettingsData();
});

function showError(error) {
  toast.add({
    severity: 'error',
    summary: t('common.error'),
    detail: error?.message || t('workspace.loadFailed'),
    life: 3500,
  });
}

async function loadSettingsData() {
  await Promise.allSettled([
    userStore.fetchProfile(),
    userStore.fetchDevices(),
    userStore.fetchLinkedAccounts(),
    userStore.fetchStorageBreakdown(),
  ]);
}

async function handleProfileSave(payload) {
  try {
    await userStore.updateProfile(payload);
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('profile.saveSuccess'),
      life: 2500,
    });
  } catch (error) {
    showError(error);
  }
}

async function handleAvatarUpload(file) {
  uploadingAvatar.value = true;

  try {
    await userStore.uploadAvatar(file);
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('profile.avatarUploaded'),
      life: 2500,
    });
  } catch (error) {
    showError(error);
  } finally {
    uploadingAvatar.value = false;
  }
}

async function handlePasswordSave(payload) {
  try {
    await userStore.updatePassword(payload);
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('password.success'),
      life: 2500,
    });
    await userStore.fetchDevices();
  } catch (error) {
    showError(error);
  }
}

async function handleFeedbackSubmit(payload) {
  submittingFeedback.value = true;

  try {
    const { reset, ...requestPayload } = payload;
    const response = await submitFeedback(requestPayload);
    reset?.();
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: response?.data?.confirmationEmailQueued
        ? t('feedback.submitSuccessWithEmail')
        : t('feedback.submitSuccess'),
      life: 2500,
    });
  } catch (error) {
    showError(error);
  } finally {
    submittingFeedback.value = false;
  }
}

function handleUnbind(identityType) {
  confirmDialogMode.value = 'unbind';
  confirmDialogTarget.value = identityType;
  confirmDialogVisible.value = true;
}

function handleRevokeDevice(deviceId) {
  confirmDialogMode.value = 'revoke-device';
  confirmDialogTarget.value = deviceId;
  confirmDialogVisible.value = true;
}

function handleRevokeOthers() {
  confirmDialogMode.value = 'revoke-others';
  confirmDialogTarget.value = null;
  confirmDialogVisible.value = true;
}

function closeConfirmDialog(force = false) {
  if (confirmSubmitting.value && !force) {
    return;
  }

  confirmDialogVisible.value = false;
  confirmDialogMode.value = '';
  confirmDialogTarget.value = null;
}

async function handleConfirmDialogAction() {
  if (!confirmDialogMode.value) {
    return;
  }

  confirmSubmitting.value = true;

  try {
    if (confirmDialogMode.value === 'unbind') {
      await userStore.unbindOAuth(confirmDialogTarget.value);
      toast.add({
        severity: 'success',
        summary: t('common.success'),
        detail: t('security.unbindSuccess'),
        life: 2500,
      });
    } else if (confirmDialogMode.value === 'revoke-others') {
      await userStore.deleteOtherDevices();
      toast.add({
        severity: 'success',
        summary: t('common.success'),
        detail: t('devices.revokeOthersSuccess'),
        life: 2500,
      });
    } else {
      await userStore.deleteDevice(confirmDialogTarget.value);
      toast.add({
        severity: 'success',
        summary: t('common.success'),
        detail: t('devices.revokeSuccess'),
        life: 2500,
      });
    }

    closeConfirmDialog(true);
  } catch (error) {
    showError(error);
  } finally {
    confirmSubmitting.value = false;
  }
}

</script>

<style scoped>
.settings-shell {
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(17rem, 19rem) minmax(0, 1fr);
  gap: 0;
}

.settings-nav,
.settings-content {
  min-height: 0;
}

.settings-nav {
  border-right: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-subtle) 92%, transparent);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
}

.settings-nav-hero {
  flex-shrink: 0;
  padding: 1rem;
  border: 1px solid var(--app-border);
  border-radius: 1rem;
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--primary-color) 9%, var(--app-panel-strong)), color-mix(in srgb, var(--app-panel-strong) 97%, transparent));
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.settings-nav-kicker,
.settings-content-kicker,
.settings-nav-copy span {
  color: var(--text-color-secondary);
  font-family: var(--font-mono);
  font-size: 0.76rem;
}

.settings-nav-kicker,
.settings-content-kicker {
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.settings-nav-title,
.settings-content-title,
.settings-card-title {
  margin: 0;
  color: var(--text-color);
  letter-spacing: -0.04em;
}

.settings-nav-title {
  font-size: 1.2rem;
}

.settings-content-description,
.settings-confirm-message {
  margin: 0;
  color: var(--text-color-secondary);
  line-height: 1.65;
}

.settings-nav-list {
  min-height: 0;
  display: grid;
  gap: 0.75rem;
}

.settings-nav-item {
  width: 100%;
  padding: 0.95rem 1rem;
  border: 1px solid var(--app-border);
  border-radius: 1rem;
  background: color-mix(in srgb, var(--app-panel-strong) 96%, transparent);
  color: inherit;
  font: inherit;
  text-align: left;
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  cursor: pointer;
  transition: border-color 180ms ease, background-color 180ms ease, transform 180ms ease;
}

.settings-nav-item:hover,
.settings-nav-item-active {
  border-color: color-mix(in srgb, var(--primary-color) 28%, var(--app-border));
  background: color-mix(in srgb, var(--primary-color) 8%, var(--app-panel-subtle));
  transform: translateY(-1px);
}

.settings-nav-item-active .settings-nav-icon {
  color: var(--primary-color);
  border-color: color-mix(in srgb, var(--primary-color) 24%, var(--app-border));
}

.settings-nav-icon {
  width: 2.35rem;
  height: 2.35rem;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-subtle) 92%, transparent);
}

.settings-nav-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.settings-nav-copy strong {
  color: var(--text-color);
  font-size: 0.96rem;
  line-height: 1.25;
}

.settings-nav-copy span {
  line-height: 1.55;
}

.settings-content {
  display: flex;
  flex-direction: column;
  background: color-mix(in srgb, var(--app-panel-strong) 98%, transparent);
}

.settings-content-header {
  padding: 1.1rem 1.2rem 1rem;
  border-bottom: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-subtle) 94%, transparent);
}

.settings-content-heading {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.settings-content-title {
  font-size: clamp(1.35rem, 1.8vw, 1.8rem);
}

.settings-content-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 1rem;
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.settings-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--app-border);
  border-radius: 1rem;
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--primary-color) 8%, var(--app-panel-strong)), color-mix(in srgb, var(--app-panel-strong) 97%, transparent));
}

.settings-card-title {
  font-size: 1.05rem;
}

.settings-confirm-actions {
  display: flex;
  gap: 0.75rem;
}

.settings-confirm-dialog {
  display: flex;
  align-items: flex-start;
  gap: 0.9rem;
}

.settings-confirm-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.9rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--red-500) 12%, var(--surface-card));
  color: var(--red-500);
  flex-shrink: 0;
}

.settings-confirm-actions {
  justify-content: flex-end;
  margin-top: 1.25rem;
}

.settings-empty-state {
  min-height: 14rem;
  padding: 1.2rem;
  border: 1px dashed color-mix(in srgb, var(--primary-color) 18%, var(--app-border));
  border-radius: 1rem;
  background: color-mix(in srgb, var(--app-panel-subtle) 72%, transparent);
  display: grid;
  place-items: center;
  gap: 0.6rem;
  text-align: center;
}

.settings-empty-state-subtle {
  min-height: 8rem;
  background: color-mix(in srgb, var(--app-panel-strong) 96%, transparent);
}

.settings-empty-icon {
  font-size: 1.15rem;
  color: var(--primary-color);
}

.settings-empty-copy {
  margin: 0;
  color: var(--text-color-secondary);
  line-height: 1.65;
}

@media (max-width: 1080px) {
  .settings-shell {
    grid-template-columns: 1fr;
  }

  .settings-nav {
    border-right: 0;
    border-bottom: 1px solid var(--app-border);
    max-height: min(22rem, 42dvh);
  }

  .settings-nav-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .settings-nav {
    max-height: none;
    overflow-y: visible;
    overscroll-behavior: auto;
  }
}

@media (max-width: 720px) {
  .settings-content-header,
  .settings-content-body,
  .settings-nav {
    padding: 0.9rem;
  }

  .settings-nav-list {
    grid-template-columns: 1fr;
  }

  .settings-card {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
