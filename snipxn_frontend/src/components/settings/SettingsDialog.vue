<template>
  <Dialog
    :visible="modelValue"
    modal
    :header="t('settings.title')"
    :style="{ width: 'min(72rem, calc(100vw - 2rem))' }"
    @update:visible="$emit('update:modelValue', $event)"
  >
    <SettingsPanel v-if="modelValue" />
  </Dialog>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import Dialog from 'primevue/dialog';
import SettingsPanel from './SettingsPanel.vue';

defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['update:modelValue']);

const { t } = useI18n();
</script>
