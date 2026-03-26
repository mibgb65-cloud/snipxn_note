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
          <p class="profile-hint">{{ t('profile.avatarHint') }}</p>
        </div>
      </div>

      <div class="profile-hero-actions">
        <Button
          icon="pi pi-upload"
          :label="t('profile.uploadAvatar')"
          outlined
          class="profile-upload-btn"
          @click="avatarInput?.click()"
        />
        <input ref="avatarInput" type="file" accept="image/*" class="hidden-input" @change="handleAvatarChange">
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
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Avatar from 'primevue/avatar';
import Button from 'primevue/button';
import Chips from 'primevue/chips';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
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
});

const emit = defineEmits(['submit', 'upload-avatar']);

const { t } = useI18n();

const avatarInput = ref(null);
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

function handleAvatarChange(event) {
  const [file] = event.target.files || [];

  if (file) {
    emit('upload-avatar', file);
  }

  event.target.value = '';
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
}

.profile-upload-btn {
  min-width: max-content;
}

.profile-form-card {
  padding: 1rem;
}

.profile-hint {
  margin: 0.15rem 0 0;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  max-width: 36rem;
  line-height: 1.65;
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
}

@media (max-width: 720px) {
  .profile-hero-card {
    align-items: flex-start;
    flex-direction: column;
  }

  .profile-hero-actions {
    width: 100%;
  }

  .profile-upload-btn {
    width: 100%;
  }
}

@media (max-width: 560px) {
  .profile-hero-main {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
