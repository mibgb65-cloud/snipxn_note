<template>
  <section class="settings-section">
    <div class="profile-header">
      <div class="flex align-items-center gap-3">
        <Avatar
          v-if="profile?.avatar"
          :image="profile.avatar"
          shape="circle"
          size="xlarge"
        />
        <Avatar
          v-else
          :label="avatarInitial"
          shape="circle"
          size="xlarge"
        />

        <div>
          <div class="font-semibold mb-1">{{ t('profile.avatar') }}</div>
          <p class="m-0 profile-hint">{{ t('profile.avatarHint') }}</p>
        </div>
      </div>

      <Button icon="pi pi-upload" :label="t('profile.uploadAvatar')" outlined @click="avatarInput?.click()" />
      <input ref="avatarInput" type="file" accept="image/*" class="hidden-input" @change="handleAvatarChange">
    </div>

    <div class="profile-form-card">
      <div class="grid form-grid">
        <div class="col-12 md:col-6">
          <label class="block font-medium mb-2" for="profile-nickname">{{ t('profile.nickname') }}</label>
          <InputText
            id="profile-nickname"
            v-model="form.nickname"
            class="w-full"
            :placeholder="t('profile.nicknamePlaceholder')"
          />
        </div>

        <div class="col-12 md:col-6">
          <label class="block font-medium mb-2" for="profile-birthday">{{ t('profile.birthday') }}</label>
          <InputText id="profile-birthday" v-model="form.birthday" type="date" class="w-full" />
        </div>

        <div class="col-12 md:col-6">
          <label class="block font-medium mb-2" for="profile-gender">{{ t('profile.gender') }}</label>
          <select id="profile-gender" v-model="form.gender" class="settings-select">
            <option :value="0">{{ t('profile.genderUnknown') }}</option>
            <option :value="1">{{ t('profile.genderMale') }}</option>
            <option :value="2">{{ t('profile.genderFemale') }}</option>
          </select>
        </div>

        <div class="col-12">
          <label class="block font-medium mb-2" for="profile-bio">{{ t('profile.bio') }}</label>
          <Textarea
            id="profile-bio"
            v-model="form.bio"
            class="w-full"
            :rows="5"
            :placeholder="t('profile.bioPlaceholder')"
          />
        </div>
      </div>
    </div>

    <div class="flex justify-content-end pt-2">
      <Button :label="t('profile.save')" :loading="saving" @click="submit" />
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Avatar from 'primevue/avatar';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';

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
});

watch(
  () => props.profile,
  (profile) => {
    form.nickname = profile?.nickname || '';
    form.bio = profile?.bio || '';
    form.gender = Number.isInteger(profile?.gender) ? profile.gender : 0;
    form.birthday = profile?.birthday || '';
  },
  { immediate: true },
);

const avatarInitial = computed(() => {
  const source = props.profile?.nickname || props.profile?.email || '?';
  return String(source).slice(0, 1).toUpperCase();
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
  });
}
</script>

<style scoped>
.settings-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.profile-header,
.profile-form-card {
  border: 1px solid color-mix(in srgb, var(--surface-border) 85%, var(--primary-color));
  border-radius: 1rem;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--surface-card) 97%, transparent), color-mix(in srgb, var(--surface-card) 93%, transparent));
}

.profile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
}

.profile-form-card {
  padding: 0.5rem;
}

.profile-hint {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  max-width: 34rem;
  line-height: 1.7;
}

.form-grid {
  margin: 0;
}

.settings-select {
  width: 100%;
  min-height: 3rem;
  border: 1px solid color-mix(in srgb, var(--surface-border) 82%, var(--primary-color));
  border-radius: 1rem;
  background: color-mix(in srgb, var(--surface-card) 94%, transparent);
  color: inherit;
  padding: 0 0.95rem;
}

.hidden-input {
  display: none;
}

@media (max-width: 720px) {
  .profile-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
