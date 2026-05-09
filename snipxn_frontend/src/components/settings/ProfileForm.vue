<template>
  <section class="settings-section">
    <div class="profile-hero-card">
      <div class="profile-hero-main">
        <Avatar
          v-if="profile?.avatar"
          :image="profile.avatar"
          shape="circle"
          size="xlarge"
          class="profile-avatar"
        />
        <Avatar
          v-else
          :label="avatarInitial"
          shape="circle"
          size="xlarge"
          class="profile-avatar"
        />

        <div class="profile-hero-copy">
          <span class="profile-kicker">{{ t('profile.avatar') }}</span>
          <strong class="profile-hero-name">{{ profileDisplayName }}</strong>
          <span v-if="profileDisplaySecondary" class="profile-hero-secondary">{{ profileDisplaySecondary }}</span>
        </div>
      </div>

      <div class="profile-hero-actions">
        <Button
          icon="pi pi-upload"
          :label="t('profile.uploadAvatar')"
          :loading="avatarUploading"
          :disabled="avatarUploading"
          outlined
          class="profile-upload-btn"
          @click="openAvatarDialog"
        />
      </div>
    </div>

    <div class="profile-form-card">
      <div class="profile-form-grid">
        <div class="profile-field">
          <label class="profile-label" for="profile-nickname">{{ t('profile.nickname') }}</label>
          <InputText
            id="profile-nickname"
            v-model="form.nickname"
            class="profile-input"
            :placeholder="t('profile.nicknamePlaceholder')"
          />
        </div>

        <div class="profile-field">
          <label class="profile-label" for="profile-birthday">{{ t('profile.birthday') }}</label>
          <InputText id="profile-birthday" v-model="form.birthday" type="date" class="profile-input" />
        </div>

        <div class="profile-field">
          <label class="profile-label" for="profile-gender">{{ t('profile.gender') }}</label>
          <select id="profile-gender" v-model="form.gender" class="settings-select">
            <option :value="0">{{ t('profile.genderUnknown') }}</option>
            <option :value="1">{{ t('profile.genderMale') }}</option>
            <option :value="2">{{ t('profile.genderFemale') }}</option>
          </select>
        </div>

        <!-- 个人网站 -->
        <div class="profile-field">
          <label class="profile-label" for="profile-website">{{ t('profile.website') }}</label>
          <InputText
            id="profile-website"
            v-model="form.website"
            class="profile-input"
            :placeholder="t('profile.websitePlaceholder')"
          />
        </div>

        <!-- GitHub -->
        <div class="profile-field">
          <label class="profile-label" for="profile-github">{{ t('profile.github') }}</label>
          <InputText
            id="profile-github"
            v-model="form.github"
            class="profile-input"
            :placeholder="t('profile.githubPlaceholder')"
          />
        </div>

        <!-- 所在地 -->
        <div class="profile-field">
          <label class="profile-label" for="profile-location">{{ t('profile.location') }}</label>
          <InputText
            id="profile-location"
            v-model="form.location"
            class="profile-input"
            :placeholder="t('profile.locationPlaceholder')"
          />
        </div>

        <!-- 公司/学校 -->
        <div class="profile-field">
          <label class="profile-label" for="profile-company">{{ t('profile.company') }}</label>
          <InputText
            id="profile-company"
            v-model="form.company"
            class="profile-input"
            :placeholder="t('profile.companyPlaceholder')"
          />
        </div>

        <!-- 技术栈 -->
        <div class="profile-field profile-field-wide">
          <label class="profile-label" for="profile-techstack">{{ t('profile.techStack') }}</label>
          <Chips
            id="profile-techstack"
            v-model="form.techStack"
            class="profile-input"
            :placeholder="t('profile.techStackPlaceholder')"
          />
        </div>

        <div class="profile-field profile-field-wide">
          <label class="profile-label" for="profile-bio">{{ t('profile.bio') }}</label>
          <Textarea
            id="profile-bio"
            v-model="form.bio"
            class="profile-input profile-textarea"
            :rows="5"
            :placeholder="t('profile.bioPlaceholder')"
          />
        </div>
      </div>
    </div>

    <div class="profile-actions">
      <Button :label="t('profile.save')" :loading="saving" class="profile-save-btn" @click="submit" />
    </div>

    <Dialog
      v-model:visible="avatarDialogVisible"
      modal
      :draggable="false"
      :closable="!avatarBusy"
      :close-on-escape="!avatarBusy"
      :header="t('profile.avatarUploadTitle')"
      :class="['profile-avatar-upload-dialog', { 'profile-avatar-upload-dialog-dark': isDarkTheme }]"
      :style="{ width: 'min(48rem, calc(100vw - 1.5rem))' }"
      @hide="handleAvatarDialogHide"
    >
      <div class="profile-avatar-dialog">
        <div v-if="avatarPreviewUrl" class="profile-avatar-workspace">
          <div class="profile-avatar-original-panel">
            <span class="profile-avatar-preview-kicker">{{ t('profile.avatarOriginal') }}</span>
            <button
              type="button"
              class="profile-avatar-original-frame"
              :disabled="avatarBusy"
              @click="avatarInput?.click()"
            >
              <img
                :src="avatarPreviewUrl"
                :alt="t('profile.avatarOriginal')"
                class="profile-avatar-original-image"
              >
            </button>
          </div>

          <div class="profile-avatar-crop-panel">
            <span class="profile-avatar-preview-kicker">{{ t('profile.avatarCrop') }}</span>
            <div
              class="profile-avatar-crop-stage"
              :class="{ 'is-dragging': avatarCropDragging }"
              @pointerdown="startAvatarCropDrag"
              @pointermove="moveAvatarCropDrag"
              @pointerup="stopAvatarCropDrag"
              @pointercancel="stopAvatarCropDrag"
              @pointerleave="stopAvatarCropDrag"
            >
              <canvas
                ref="avatarCropCanvas"
                class="profile-avatar-crop-canvas"
                width="512"
                height="512"
              />
              <span class="profile-avatar-crop-vignette" aria-hidden="true" />
              <span class="profile-avatar-crop-ring" aria-hidden="true" />
            </div>

            <div class="profile-avatar-crop-controls">
              <label class="profile-avatar-crop-control">
                <span>{{ t('profile.avatarCropZoom') }}</span>
                <input
                  v-model.number="avatarCropScale"
                  type="range"
                  min="1"
                  max="4"
                  step="0.01"
                  :disabled="avatarBusy"
                >
              </label>
              <label class="profile-avatar-crop-control">
                <span>{{ t('profile.avatarCropHorizontal') }}</span>
                <input
                  v-model.number="avatarCropOffsetX"
                  type="range"
                  :min="-avatarCropOffsetLimit"
                  :max="avatarCropOffsetLimit"
                  step="1"
                  :disabled="avatarBusy"
                >
              </label>
              <label class="profile-avatar-crop-control">
                <span>{{ t('profile.avatarCropVertical') }}</span>
                <input
                  v-model.number="avatarCropOffsetY"
                  type="range"
                  :min="-avatarCropOffsetLimit"
                  :max="avatarCropOffsetLimit"
                  step="1"
                  :disabled="avatarBusy"
                >
              </label>
            </div>
          </div>
        </div>

        <button
          v-else
          type="button"
          class="profile-avatar-dropzone"
          :disabled="avatarBusy"
          @click="avatarInput?.click()"
        >
          <span class="profile-avatar-dialog-empty">
            <i class="pi pi-image" aria-hidden="true" />
            <span>{{ t('profile.avatarNoPreview') }}</span>
          </span>
        </button>

        <input ref="avatarInput" type="file" accept="image/*" class="hidden-input" @change="handleAvatarChange">

        <div v-if="avatarPreviewUrl" class="profile-avatar-preview-copy">
          <span class="profile-avatar-preview-kicker">{{ t('profile.avatarPreview') }}</span>
          <strong class="profile-avatar-preview-name">{{ avatarPreviewName }}</strong>
          <span class="profile-avatar-preview-meta">
            {{ avatarPreviewSize }}
            <span aria-hidden="true">·</span>
            {{ avatarBusy ? t('profile.avatarUploading') : t('profile.avatarPreviewReady') }}
          </span>
        </div>

        <p v-if="avatarError" class="profile-avatar-error">{{ avatarError }}</p>
      </div>

      <template #footer>
        <div class="profile-avatar-dialog-actions">
          <Button
            type="button"
            severity="secondary"
            text
            :label="t('common.cancel')"
            :disabled="avatarBusy"
            @click="closeAvatarDialog"
          />
          <Button
            type="button"
            icon="pi pi-image"
            severity="secondary"
            outlined
            :label="avatarPreviewUrl ? t('profile.avatarChangeImage') : t('profile.avatarSelectImage')"
            :disabled="avatarBusy"
            @click="avatarInput?.click()"
          />
          <Button
            type="button"
            icon="pi pi-upload"
            :label="t('profile.avatarConfirmUpload')"
            :loading="avatarBusy"
            :disabled="!selectedAvatarFile || !avatarImageLoaded || avatarBusy"
            @click="handleAvatarUploadConfirm"
          />
        </div>
      </template>
    </Dialog>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Avatar from 'primevue/avatar';
import Button from 'primevue/button';
import Chips from 'primevue/chips';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import { useTheme } from '../../composables/useTheme';
import { getAvatarLabel } from '../../utils/avatar';

const props = defineProps({
  profile: {
    type: Object,
    default: null,
  },
  saving: {
    type: Boolean,
    default: false,
  },
  avatarUploading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['submit', 'upload-avatar']);

const { t } = useI18n();
const { isDarkTheme } = useTheme();

const avatarInput = ref(null);
const avatarCropCanvas = ref(null);
const avatarPreviewUrl = ref('');
const avatarPreviewName = ref('');
const avatarPreviewBytes = ref(0);
const avatarError = ref('');
const avatarDialogVisible = ref(false);
const selectedAvatarFile = ref(null);
const avatarUploadRequested = ref(false);
const avatarImage = ref(null);
const avatarImageLoaded = ref(false);
const avatarProcessing = ref(false);
const avatarCropDragging = ref(false);
const avatarCropScale = ref(1);
const avatarCropOffsetX = ref(0);
const avatarCropOffsetY = ref(0);
const avatarCropPointer = reactive({
  x: 0,
  y: 0,
});
const maxAvatarSize = 5 * 1024 * 1024;
const avatarCropSize = 512;
const avatarCropOffsetLimit = 192;
const form = reactive({
  nickname: '',
  bio: '',
  gender: 0,
  birthday: '',
  website: '',
  github: '',
  location: '',
  company: '',
  techStack: [],
});

watch(
  () => props.profile,
  (profile) => {
    form.nickname = profile?.nickname || '';
    form.bio = profile?.bio || '';
    form.gender = Number.isInteger(profile?.gender) ? profile.gender : 0;
    form.birthday = profile?.birthday || '';
    form.website = profile?.website || '';
    form.github = profile?.github || '';
    form.location = profile?.location || '';
    form.company = profile?.company || '';
    form.techStack = (profile?.techStack || '').split(',').filter(Boolean);
  },
  { immediate: true },
);

const avatarInitial = computed(() => {
  const source = props.profile?.nickname || props.profile?.email || '?';
  return getAvatarLabel(source);
});

const profileDisplayName = computed(() => (
  form.nickname.trim()
  || props.profile?.nickname
  || props.profile?.email
  || t('app.name')
));

const profileDisplaySecondary = computed(() => {
  const email = String(props.profile?.email || '').trim();
  return email && email !== profileDisplayName.value ? email : '';
});

const avatarPreviewSize = computed(() => formatBytes(avatarPreviewBytes.value));
const avatarBusy = computed(() => props.avatarUploading || avatarProcessing.value);

onBeforeUnmount(() => {
  revokeAvatarPreviewUrl();
});

watch([avatarCropScale, avatarCropOffsetX, avatarCropOffsetY], () => {
  drawAvatarCropCanvas();
});

watch(avatarDialogVisible, async (visible) => {
  if (visible) {
    await nextTick();
    drawAvatarCropCanvas();
  }
});

watch(
  () => props.avatarUploading,
  (uploading, previousUploading) => {
    if (!uploading && previousUploading && avatarUploadRequested.value) {
      avatarUploadRequested.value = false;
      avatarDialogVisible.value = false;
      clearSelectedAvatar();
    }
  },
);

function openAvatarDialog() {
  avatarError.value = '';
  avatarDialogVisible.value = true;
}

function closeAvatarDialog() {
  if (avatarBusy.value) {
    return;
  }

  avatarDialogVisible.value = false;
}

function handleAvatarDialogHide() {
  if (avatarBusy.value) {
    return;
  }

  avatarError.value = '';
  avatarUploadRequested.value = false;
  clearSelectedAvatar();
}

function handleAvatarChange(event) {
  const [file] = event.target.files || [];

  if (file) {
    if (file.size > maxAvatarSize) {
      avatarError.value = t('profile.avatarTooLarge');
      clearSelectedAvatar();
      event.target.value = '';
      return;
    }

    avatarError.value = '';
    setAvatarPreview(file);
  }

  event.target.value = '';
}

async function handleAvatarUploadConfirm() {
  if (!selectedAvatarFile.value || !avatarImageLoaded.value) {
    avatarError.value = t('profile.avatarRequired');
    return;
  }

  avatarError.value = '';
  avatarProcessing.value = true;

  try {
    const croppedAvatar = await createCroppedAvatarFile();
    avatarUploadRequested.value = true;
    emit('upload-avatar', croppedAvatar);
  } catch {
    avatarUploadRequested.value = false;
    avatarError.value = t('profile.avatarCropFailed');
  } finally {
    avatarProcessing.value = false;
  }
}

function setAvatarPreview(file) {
  revokeAvatarPreviewUrl();
  resetAvatarCrop();

  const url = URL.createObjectURL(file);

  selectedAvatarFile.value = file;
  avatarPreviewUrl.value = url;
  avatarPreviewName.value = file.name || t('profile.avatarPreviewFile');
  avatarPreviewBytes.value = file.size || 0;

  const image = new Image();
  image.onload = async () => {
    if (avatarPreviewUrl.value !== url) {
      return;
    }

    avatarImage.value = image;
    avatarImageLoaded.value = true;
    await nextTick();
    drawAvatarCropCanvas();
  };
  image.onerror = () => {
    if (avatarPreviewUrl.value === url) {
      avatarError.value = t('profile.avatarCropFailed');
      clearSelectedAvatar();
    }
  };
  image.src = url;
}

function clearSelectedAvatar() {
  selectedAvatarFile.value = null;
  avatarPreviewName.value = '';
  avatarPreviewBytes.value = 0;
  avatarImage.value = null;
  avatarImageLoaded.value = false;
  avatarCropDragging.value = false;
  resetAvatarCrop();
  clearAvatarCropCanvas();
  revokeAvatarPreviewUrl();
}

function revokeAvatarPreviewUrl() {
  if (avatarPreviewUrl.value) {
    URL.revokeObjectURL(avatarPreviewUrl.value);
    avatarPreviewUrl.value = '';
  }
}

function resetAvatarCrop() {
  avatarCropScale.value = 1;
  avatarCropOffsetX.value = 0;
  avatarCropOffsetY.value = 0;
}

function clearAvatarCropCanvas() {
  const canvas = avatarCropCanvas.value;
  const context = canvas?.getContext('2d');

  if (context) {
    context.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function drawAvatarCropCanvas() {
  const canvas = avatarCropCanvas.value;
  const image = avatarImage.value;

  if (!canvas || !image || !avatarImageLoaded.value) {
    return;
  }

  const context = canvas.getContext('2d');

  if (!context) {
    return;
  }

  if (canvas.width !== avatarCropSize) {
    canvas.width = avatarCropSize;
  }

  if (canvas.height !== avatarCropSize) {
    canvas.height = avatarCropSize;
  }

  const imageWidth = image.naturalWidth || image.width;
  const imageHeight = image.naturalHeight || image.height;

  if (!imageWidth || !imageHeight) {
    return;
  }

  const imageAspect = imageWidth / imageHeight;
  const baseWidth = imageAspect >= 1 ? avatarCropSize : avatarCropSize * imageAspect;
  const baseHeight = imageAspect >= 1 ? avatarCropSize / imageAspect : avatarCropSize;
  const drawWidth = baseWidth * avatarCropScale.value;
  const drawHeight = baseHeight * avatarCropScale.value;
  const drawX = (avatarCropSize - drawWidth) / 2 + Number(avatarCropOffsetX.value || 0);
  const drawY = (avatarCropSize - drawHeight) / 2 + Number(avatarCropOffsetY.value || 0);

  context.clearRect(0, 0, avatarCropSize, avatarCropSize);
  context.save();
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  context.restore();
}

function startAvatarCropDrag(event) {
  if (avatarBusy.value || !avatarImageLoaded.value) {
    return;
  }

  avatarCropDragging.value = true;
  avatarCropPointer.x = event.clientX;
  avatarCropPointer.y = event.clientY;
  event.currentTarget?.setPointerCapture?.(event.pointerId);
}

function moveAvatarCropDrag(event) {
  if (!avatarCropDragging.value) {
    return;
  }

  const canvas = avatarCropCanvas.value;
  const rect = canvas?.getBoundingClientRect();
  const displayWidth = rect?.width || avatarCropSize;
  const displayHeight = rect?.height || avatarCropSize;
  const deltaX = (event.clientX - avatarCropPointer.x) * (avatarCropSize / displayWidth);
  const deltaY = (event.clientY - avatarCropPointer.y) * (avatarCropSize / displayHeight);

  avatarCropOffsetX.value = clampAvatarCropOffset(avatarCropOffsetX.value + deltaX);
  avatarCropOffsetY.value = clampAvatarCropOffset(avatarCropOffsetY.value + deltaY);
  avatarCropPointer.x = event.clientX;
  avatarCropPointer.y = event.clientY;
}

function stopAvatarCropDrag(event) {
  if (!avatarCropDragging.value) {
    return;
  }

  avatarCropDragging.value = false;
  event?.currentTarget?.releasePointerCapture?.(event.pointerId);
}

function clampAvatarCropOffset(value) {
  const numericValue = Number(value || 0);
  return Math.min(avatarCropOffsetLimit, Math.max(-avatarCropOffsetLimit, numericValue));
}

function createCroppedAvatarFile() {
  drawAvatarCropCanvas();

  return new Promise((resolve, reject) => {
    const canvas = avatarCropCanvas.value;

    if (!canvas) {
      reject(new Error('Avatar crop canvas is not ready'));
      return;
    }

    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Avatar crop failed'));
        return;
      }

      const name = selectedAvatarFile.value?.name || 'avatar.png';
      const stem = name.replace(/\.[^.]+$/, '') || 'avatar';
      const file = new File([blob], `${stem}-cropped.png`, { type: 'image/png' });

      if (file.size > maxAvatarSize) {
        reject(new Error('Avatar crop output is too large'));
        return;
      }

      resolve(file);
    }, 'image/png');
  });
}

function formatBytes(value) {
  const numericValue = Number(value || 0);

  if (!numericValue) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  let size = numericValue;
  let index = 0;

  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }

  return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function submit() {
  emit('submit', {
    nickname: form.nickname.trim(),
    bio: form.bio.trim(),
    gender: Number(form.gender),
    birthday: form.birthday || null,
    website: form.website.trim(),
    github: form.github.trim(),
    location: form.location.trim(),
    company: form.company.trim(),
    techStack: form.techStack.join(','),
  });
}
</script>

<style scoped>
.settings-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.profile-hero-card,
.profile-form-card {
  border: 1px solid color-mix(in srgb, var(--surface-border) 85%, var(--primary-color));
  border-radius: 1rem;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--surface-card) 97%, transparent), color-mix(in srgb, var(--surface-card) 93%, transparent));
}

.profile-hero-card,
.profile-hero-main,
.profile-hero-actions,
.profile-actions {
  display: flex;
}

.profile-hero-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  padding: 1.1rem;
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--primary-color) 9%, var(--surface-card)), color-mix(in srgb, var(--surface-card) 93%, transparent));
}

.profile-hero-main {
  min-width: 0;
  flex: 1;
  align-items: center;
  gap: 1rem;
}

.profile-avatar {
  flex-shrink: 0;
}

.profile-avatar:deep(.p-avatar) {
  width: 5rem;
  height: 5rem;
  min-width: 5rem;
  min-height: 5rem;
  aspect-ratio: 1 / 1;
  border-radius: 999px;
  overflow: hidden;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--primary-color) 18%, var(--surface-border));
}

.profile-avatar:deep(.p-avatar img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-hero-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.profile-kicker {
  color: var(--text-color-secondary);
  font-family: var(--font-mono);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.profile-hero-name {
  color: var(--text-color);
  font-size: clamp(1.2rem, 2vw, 1.6rem);
  line-height: 1.08;
  letter-spacing: -0.04em;
}

.profile-hero-secondary {
  color: var(--text-color-secondary);
  font-size: 0.92rem;
  line-height: 1.45;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.profile-hero-actions {
  flex-shrink: 0;
  align-items: center;
  flex-direction: column;
  gap: 0.45rem;
}

.profile-upload-btn {
  min-width: max-content;
}

.profile-avatar-error {
  width: 100%;
  margin: 0;
  color: var(--red-500);
  font-size: 0.78rem;
  line-height: 1.45;
  text-align: left;
}

.profile-form-card {
  padding: 1rem;
}

.profile-avatar-dialog {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.profile-avatar-upload-dialog :deep(.p-dialog-content) {
  max-height: min(72dvh, 44rem);
  overflow-y: auto;
}

.profile-avatar-dropzone {
  width: 100%;
  min-height: 18rem;
  padding: 0;
  border: 1px dashed color-mix(in srgb, var(--primary-color) 28%, var(--surface-border));
  border-radius: 0.9rem;
  background: color-mix(in srgb, var(--app-panel-subtle) 92%, transparent);
  color: inherit;
  display: grid;
  place-items: center;
  overflow: hidden;
  cursor: pointer;
}

.profile-avatar-dropzone:disabled {
  cursor: progress;
  opacity: 0.78;
}

.profile-avatar-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1.12fr) minmax(17rem, 0.88fr);
  gap: 1rem;
  align-items: start;
}

.profile-avatar-original-panel,
.profile-avatar-crop-panel {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.profile-avatar-original-frame {
  width: 100%;
  min-height: 22rem;
  padding: 0.75rem;
  border: 1px solid color-mix(in srgb, var(--surface-border) 85%, var(--primary-color));
  border-radius: 0.9rem;
  background:
    linear-gradient(45deg, color-mix(in srgb, var(--surface-border) 28%, transparent) 25%, transparent 25%),
    linear-gradient(-45deg, color-mix(in srgb, var(--surface-border) 28%, transparent) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, color-mix(in srgb, var(--surface-border) 28%, transparent) 75%),
    linear-gradient(-45deg, transparent 75%, color-mix(in srgb, var(--surface-border) 28%, transparent) 75%);
  background-color: color-mix(in srgb, var(--surface-card) 96%, transparent);
  background-position: 0 0, 0 0.5rem, 0.5rem -0.5rem, -0.5rem 0;
  background-size: 1rem 1rem;
  cursor: pointer;
  display: grid;
  place-items: center;
  overflow: hidden;
}

.profile-avatar-original-frame:disabled {
  cursor: progress;
  opacity: 0.78;
}

.profile-avatar-original-image {
  width: 100%;
  height: 20.5rem;
  object-fit: contain;
}

.profile-avatar-crop-stage {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  min-height: 17rem;
  border: 1px solid color-mix(in srgb, var(--surface-border) 85%, var(--primary-color));
  border-radius: 0.9rem;
  background: color-mix(in srgb, var(--app-panel-subtle) 92%, transparent);
  cursor: grab;
  overflow: hidden;
  touch-action: none;
}

.profile-avatar-crop-stage.is-dragging {
  cursor: grabbing;
}

.profile-avatar-crop-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.profile-avatar-crop-vignette,
.profile-avatar-crop-ring {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.profile-avatar-crop-vignette {
  background: radial-gradient(circle, transparent 0 48%, rgba(15, 23, 42, 0.44) 49% 100%);
}

.profile-avatar-crop-ring {
  border: 2px solid rgba(255, 255, 255, 0.92);
  border-radius: 999px;
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--primary-color) 44%, transparent),
    inset 0 0 0 1px rgba(15, 23, 42, 0.16);
}

.profile-avatar-crop-controls {
  display: grid;
  gap: 0.55rem;
}

.profile-avatar-crop-control {
  display: grid;
  grid-template-columns: 3.25rem minmax(0, 1fr);
  align-items: center;
  gap: 0.75rem;
  color: var(--text-color-secondary);
  font-size: 0.82rem;
}

.profile-avatar-crop-control input {
  width: 100%;
  accent-color: var(--primary-color);
}

.profile-avatar-dialog-empty {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  color: var(--text-color-secondary);
  font-size: 0.92rem;
}

.profile-avatar-dialog-empty i {
  color: var(--primary-color);
  font-size: 1.1rem;
}

.profile-avatar-preview-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.profile-avatar-preview-kicker,
.profile-avatar-preview-meta {
  color: var(--text-color-secondary);
  font-size: 0.78rem;
}

.profile-avatar-preview-kicker {
  font-family: var(--font-mono);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.profile-avatar-preview-name {
  color: var(--text-color);
  font-size: 0.96rem;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-avatar-preview-meta {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.profile-avatar-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.65rem;
  flex-wrap: wrap;
}

:global(.profile-avatar-upload-dialog-dark) {
  border: 1px solid rgba(148, 163, 184, 0.18) !important;
  background: #0d1b2a !important;
  color: #e6eef7 !important;
  box-shadow: 0 28px 72px -38px rgba(0, 0, 0, 0.88) !important;
}

:global(.profile-avatar-upload-dialog-dark .p-dialog-header),
:global(.profile-avatar-upload-dialog-dark .p-dialog-content),
:global(.profile-avatar-upload-dialog-dark .p-dialog-footer) {
  border-color: rgba(148, 163, 184, 0.14) !important;
  background: #0d1b2a !important;
  color: #e6eef7 !important;
}

:global(.profile-avatar-upload-dialog-dark .p-dialog-header) {
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
}

:global(.profile-avatar-upload-dialog-dark .p-dialog-footer) {
  border-top: 1px solid rgba(148, 163, 184, 0.14);
}

:global(.profile-avatar-upload-dialog-dark .p-dialog-title) {
  color: #f3f7fb !important;
}

:global(.profile-avatar-upload-dialog-dark .p-dialog-close-button) {
  color: #a9bbcc !important;
}

:global(.profile-avatar-upload-dialog-dark .profile-avatar-dropzone),
:global(.profile-avatar-upload-dialog-dark .profile-avatar-original-frame),
:global(.profile-avatar-upload-dialog-dark .profile-avatar-crop-stage) {
  border-color: rgba(148, 163, 184, 0.22) !important;
  background: #081421 !important;
  color: #b7c6d6 !important;
}

:global(.profile-avatar-upload-dialog-dark .profile-avatar-original-frame) {
  background:
    linear-gradient(45deg, rgba(148, 163, 184, 0.08) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(148, 163, 184, 0.08) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgba(148, 163, 184, 0.08) 75%),
    linear-gradient(-45deg, transparent 75%, rgba(148, 163, 184, 0.08) 75%),
    #081421 !important;
  background-position: 0 0, 0 0.5rem, 0.5rem -0.5rem, -0.5rem 0 !important;
  background-size: 1rem 1rem !important;
}

:global(.profile-avatar-upload-dialog-dark .profile-avatar-preview-kicker),
:global(.profile-avatar-upload-dialog-dark .profile-avatar-preview-meta),
:global(.profile-avatar-upload-dialog-dark .profile-avatar-crop-control),
:global(.profile-avatar-upload-dialog-dark .profile-avatar-dialog-empty) {
  color: #a9bbcc !important;
}

:global(.profile-avatar-upload-dialog-dark .profile-avatar-preview-name) {
  color: #f3f7fb !important;
}

:global(.profile-avatar-upload-dialog-dark .profile-avatar-crop-vignette) {
  background: radial-gradient(circle, transparent 0 48%, rgba(2, 8, 23, 0.64) 49% 100%) !important;
}

:global(.profile-avatar-upload-dialog-dark .profile-avatar-crop-ring) {
  border-color: rgba(241, 245, 249, 0.9) !important;
  box-shadow:
    0 0 0 1px rgba(45, 212, 191, 0.38),
    inset 0 0 0 1px rgba(2, 8, 23, 0.52) !important;
}

:global(.profile-avatar-upload-dialog-dark input[type='range']) {
  accent-color: #2dd4bf;
}

:global(.profile-avatar-upload-dialog-dark .p-button.p-button-secondary.p-button-outlined) {
  border-color: rgba(148, 163, 184, 0.32) !important;
  background: rgba(11, 22, 34, 0.72) !important;
  color: #dbeafe !important;
}

:global(.profile-avatar-upload-dialog-dark .p-button.p-button-secondary.p-button-text) {
  color: #a7c7e8 !important;
}

.profile-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.profile-field {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  min-width: 0;
}

.profile-field-wide {
  grid-column: 1 / -1;
}

.profile-label {
  color: var(--text-color);
  font-size: 0.92rem;
  font-weight: 600;
}

.profile-input {
  width: 100%;
}

.profile-textarea {
  min-height: 9rem;
}

.settings-select {
  width: 100%;
  min-height: 2.875rem;
  border: 1px solid color-mix(in srgb, var(--surface-border) 86%, var(--primary-color));
  border-radius: 0.85rem;
  background: color-mix(in srgb, var(--surface-card) 94%, transparent);
  color: inherit;
  padding: 0 0.95rem;
}

.profile-actions {
  justify-content: flex-end;
  padding-top: 0.15rem;
}

.profile-save-btn {
  min-width: 7rem;
}

.hidden-input {
  display: none;
}

@media (max-width: 820px) {
  .profile-form-grid {
    grid-template-columns: 1fr;
  }

  .profile-avatar-workspace {
    grid-template-columns: 1fr;
  }

  .profile-avatar-original-frame {
    min-height: 16rem;
  }

  .profile-avatar-original-image {
    height: 14.5rem;
  }
}

@media (max-width: 720px) {
  .profile-hero-card {
    align-items: flex-start;
    flex-direction: column;
  }

  .profile-hero-actions {
    width: 100%;
    align-items: stretch;
  }

  .profile-upload-btn {
    width: 100%;
  }

  .profile-avatar-error {
    text-align: left;
  }

  .profile-avatar-dialog-actions {
    flex-direction: column-reverse;
  }

  .profile-avatar-dialog-actions :deep(.p-button) {
    width: 100%;
  }

  .profile-avatar-crop-control {
    grid-template-columns: 2.75rem minmax(0, 1fr);
  }
}

@media (max-width: 560px) {
  .profile-hero-main {
    align-items: flex-start;
    flex-direction: column;
  }

  .profile-avatar-dropzone,
  .profile-avatar-crop-stage {
    min-height: 14rem;
  }
}
</style>
