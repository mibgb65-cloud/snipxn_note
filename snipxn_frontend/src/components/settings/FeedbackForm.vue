<template>
  <section class="feedback-section">
    <div class="feedback-card">
      <div class="feedback-card-header">
        <span class="feedback-kicker">{{ t('feedback.kicker') }}</span>
        <h3 class="feedback-title">{{ t('feedback.title') }}</h3>
        <p class="feedback-description">{{ t('feedback.description') }}</p>
      </div>

      <div class="feedback-field">
        <label class="feedback-label" for="feedback-content">{{ t('feedback.content') }}</label>
        <Textarea
          id="feedback-content"
          v-model="form.content"
          class="feedback-input feedback-textarea"
          :rows="7"
          :maxlength="contentLimit"
          :placeholder="t('feedback.contentPlaceholder')"
          auto-resize
          @input="clearError"
        />
        <div class="feedback-field-meta">
          <span v-if="contentError" class="feedback-error">{{ contentError }}</span>
          <span class="feedback-count">{{ form.content.length }} / {{ contentLimit }}</span>
        </div>
      </div>

      <div class="feedback-field">
        <label class="feedback-label" for="feedback-contact">{{ t('feedback.contact') }}</label>
        <InputText
          id="feedback-contact"
          v-model="form.contact"
          class="feedback-input"
          :maxlength="100"
          :placeholder="t('feedback.contactPlaceholder')"
        />
      </div>
    </div>

    <div class="feedback-actions">
      <Button
        icon="pi pi-send"
        :label="t('feedback.submit')"
        :loading="submitting"
        :disabled="submitting"
        class="feedback-submit"
        @click="submit"
      />
    </div>
  </section>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';

defineProps({
  submitting: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['submit']);
const { t } = useI18n();
const contentLimit = 5000;

const form = reactive({
  content: '',
  contact: '',
});
const contentError = ref('');

function clearError() {
  contentError.value = '';
}

function reset() {
  form.content = '';
  form.contact = '';
  contentError.value = '';
}

function submit() {
  const content = form.content.trim();
  if (!content) {
    contentError.value = t('feedback.contentRequired');
    return;
  }

  emit('submit', {
    content,
    contact: form.contact.trim() || null,
    images: [],
    reset,
  });
}
</script>

<style scoped>
.feedback-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.feedback-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.15rem;
  border: 1px solid color-mix(in srgb, var(--surface-border) 85%, var(--primary-color));
  border-radius: 1rem;
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--primary-color) 8%, var(--surface-card)), color-mix(in srgb, var(--surface-card) 96%, transparent));
}

.feedback-card-header {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.feedback-kicker {
  color: var(--text-color-secondary);
  font-family: var(--font-mono);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.feedback-title {
  margin: 0;
  color: var(--text-color);
  font-size: 1.2rem;
  letter-spacing: -0.03em;
}

.feedback-description {
  margin: 0;
  color: var(--text-color-secondary);
  line-height: 1.65;
}

.feedback-field {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.feedback-label {
  color: var(--text-color);
  font-size: 0.92rem;
  font-weight: 600;
}

.feedback-input {
  width: 100%;
}

.feedback-textarea {
  min-height: 12rem;
}

.feedback-field-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  min-height: 1.25rem;
}

.feedback-error {
  color: var(--red-500);
  font-size: 0.82rem;
}

.feedback-count {
  margin-left: auto;
  color: var(--text-color-secondary);
  font-family: var(--font-mono);
  font-size: 0.76rem;
}

.feedback-actions {
  display: flex;
  justify-content: flex-end;
}

.feedback-submit {
  min-width: 8rem;
}

@media (max-width: 720px) {
  .feedback-actions,
  .feedback-submit {
    width: 100%;
  }
}
</style>
