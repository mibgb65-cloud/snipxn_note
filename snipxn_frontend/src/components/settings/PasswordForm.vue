<template>
  <section class="settings-section">
    <div class="grid form-grid">
      <div class="col-12 md:col-6">
        <label class="block font-medium mb-2" for="password-old">{{ t('password.oldPassword') }}</label>
        <Password
          id="password-old"
          v-model="form.oldPassword"
          class="w-full"
          input-class="w-full"
          toggle-mask
          :feedback="false"
        />
      </div>

      <div class="col-12 md:col-6">
        <label class="block font-medium mb-2" for="password-new">{{ t('password.newPassword') }}</label>
        <Password
          id="password-new"
          v-model="form.newPassword"
          class="w-full"
          input-class="w-full"
          toggle-mask
        />
      </div>
    </div>

    <div class="flex justify-content-end">
      <Button :label="t('password.submit')" :loading="loading" @click="submit" />
    </div>
  </section>
</template>

<script setup>
import { reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import Button from 'primevue/button';
import Password from 'primevue/password';

defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['submit']);

const { t } = useI18n();

const form = reactive({
  oldPassword: '',
  newPassword: '',
});

function submit() {
  emit('submit', {
    oldPassword: form.oldPassword,
    newPassword: form.newPassword,
  });

  form.oldPassword = '';
  form.newPassword = '';
}
</script>

<style scoped>
.settings-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-grid {
  margin: 0;
}
</style>
