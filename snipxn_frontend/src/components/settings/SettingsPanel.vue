<template>
  <div class="settings-shell">
    <aside class="settings-nav">
      <div class="settings-nav-hero">
        <p class="settings-description">{{ t('settings.description') }}</p>
      </div>

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
        <span>{{ section.label }}</span>
      </button>
    </aside>

    <main class="settings-content">
      <ProfileForm
        v-if="activeSection === 'profile'"
        :profile="userStore.profile"
        :saving="userStore.savingProfile"
        @submit="handleProfileSave"
        @upload-avatar="handleAvatarUpload"
      />

      <PasswordForm
        v-else-if="activeSection === 'password'"
        :loading="userStore.changingPassword"
        @submit="handlePasswordSave"
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
        <div class="settings-card">
          <div>
            <h3 class="m-0">{{ t('settings.theme') }}</h3>
            <p class="m-0 settings-description">{{ t('theme.description') }}</p>
          </div>
          <ThemeToggle />
        </div>
      </section>

      <section v-else-if="activeSection === 'language'" class="settings-section">
        <div class="settings-card">
          <div>
            <h3 class="m-0">{{ t('language.title') }}</h3>
            <p class="m-0 settings-description">{{ t('language.description') }}</p>
          </div>
          <div class="language-actions">
            <Button
              :outlined="locale !== 'zh'"
              :label="t('language.zh')"
              @click="switchLanguage('zh')"
            />
            <Button
              :outlined="locale !== 'en'"
              :label="t('language.en')"
              @click="switchLanguage('en')"
            />
          </div>
        </div>
      </section>

      <StorageBar
        v-else
        :profile="userStore.profile"
        :loading="userStore.loadingProfile"
        :percent="userStore.storageUsagePercent"
      />
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
import { setAppLocale } from '../../i18n';
import { getDeviceId } from '../../composables/useDeviceId';
import { useUserStore } from '../../stores/user';
import ThemeToggle from '../common/ThemeToggle.vue';
import ProfileForm from './ProfileForm.vue';
import PasswordForm from './PasswordForm.vue';
import DeviceList from './DeviceList.vue';
import StorageBar from './StorageBar.vue';

const props = defineProps({
  initialSection: {
    type: String,
    default: 'profile',
  },
});

const { locale, t } = useI18n();
const toast = useToast();
const userStore = useUserStore();

const activeSection = ref(props.initialSection);
const currentDeviceId = getDeviceId();
const confirmDialogVisible = ref(false);
const confirmSubmitting = ref(false);
const confirmDialogMode = ref('');
const confirmDialogTarget = ref(null);

const sections = computed(() => ([
  { id: 'profile', label: t('settings.profile'), icon: 'pi pi-user' },
  { id: 'password', label: t('settings.password'), icon: 'pi pi-lock' },
  { id: 'devices', label: t('settings.devices'), icon: 'pi pi-desktop' },
  { id: 'theme', label: t('settings.theme'), icon: 'pi pi-palette' },
  { id: 'language', label: t('settings.language'), icon: 'pi pi-language' },
  { id: 'storage', label: t('settings.storage'), icon: 'pi pi-database' },
]));

const confirmTitle = computed(() => (
  confirmDialogMode.value === 'revoke-others'
    ? t('devices.revokeOthers')
    : t('devices.revoke')
));
const confirmActionLabel = computed(() => (
  confirmDialogMode.value === 'revoke-others'
    ? t('devices.revokeOthers')
    : t('devices.revoke')
));
const confirmMessage = computed(() => (
  confirmDialogMode.value === 'revoke-others'
    ? t('devices.revokeOthersConfirm')
    : t('devices.revokeConfirm')
));
const confirmIcon = computed(() => (
  confirmDialogMode.value === 'revoke-others'
    ? 'pi pi-shield'
    : 'pi pi-trash'
));

watch(
  () => props.initialSection,
  (section) => {
    activeSection.value = section || 'profile';
  },
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
    if (confirmDialogMode.value === 'revoke-others') {
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

function switchLanguage(nextLocale) {
  setAppLocale(nextLocale);
  toast.add({
    severity: 'success',
    summary: t('common.success'),
    detail: t('language.changed'),
    life: 2500,
  });
}
</script>

<style scoped>
.settings-shell {
  display: grid;
  grid-template-columns: minmax(15rem, 17rem) minmax(0, 1fr);
  gap: 1rem;
  min-height: 34rem;
}

.settings-nav,
.settings-content {
  border: 1px solid color-mix(in srgb, var(--surface-border) 85%, var(--primary-color));
  border-radius: 1.2rem;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--surface-card) 97%, transparent), color-mix(in srgb, var(--surface-card) 93%, transparent));
}

.settings-nav {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.settings-nav-hero {
  padding: 1rem;
  border-radius: 1rem;
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--primary-color) 12%, var(--surface-card)), color-mix(in srgb, var(--surface-card) 96%, transparent));
}

.settings-description {
  color: var(--text-color-secondary);
  font-size: 0.875rem;
  line-height: 1.7;
}

.settings-nav-item {
  border: 1px solid transparent;
  border-radius: 1rem;
  padding: 0.9rem 1rem;
  background: color-mix(in srgb, var(--surface-ground) 22%, transparent);
  color: inherit;
  font: inherit;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  cursor: pointer;
  transition: border-color 180ms ease, background-color 180ms ease, color 180ms ease, transform 180ms ease;
}

.settings-nav-icon {
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--primary-color) 9%, var(--surface-card));
}

.settings-nav-item:hover,
.settings-nav-item-active {
  border-color: color-mix(in srgb, var(--primary-color) 28%, var(--surface-border));
  background: color-mix(in srgb, var(--primary-color) 10%, var(--surface-card));
  color: var(--primary-color);
  transform: translateY(-1px);
}

.settings-content {
  padding: 1rem;
  min-width: 0;
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
  padding: 1.1rem;
  border: 1px solid color-mix(in srgb, var(--surface-border) 85%, var(--primary-color));
  border-radius: 1rem;
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--primary-color) 8%, var(--surface-card)), color-mix(in srgb, var(--surface-card) 96%, transparent));
}

.language-actions,
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

.settings-confirm-message {
  margin: 0;
  color: var(--text-color-secondary);
  line-height: 1.7;
}

.settings-confirm-actions {
  justify-content: flex-end;
  margin-top: 1.25rem;
}

@media (max-width: 960px) {
  .settings-shell {
    grid-template-columns: 1fr;
  }

  .settings-card {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
