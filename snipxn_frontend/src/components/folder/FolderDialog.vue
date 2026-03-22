<template>
  <Dialog
    :visible="modelValue"
    modal
    :header="folder ? t('folders.editFolder') : t('folders.newFolder')"
    :style="{ width: 'min(42rem, calc(100vw - 2rem))' }"
    @update:visible="$emit('update:modelValue', $event)"
  >
    <form class="folder-dialog-form" @submit.prevent="submit">
      <div class="field">
        <label class="block font-medium mb-2" for="folder-name">{{ t('folders.name') }}</label>
        <InputText
          id="folder-name"
          v-model="form.name"
          class="w-full"
          :placeholder="t('folders.namePlaceholder')"
          required
        />
      </div>

      <div class="field folder-icon-field">
        <div class="folder-icon-header">
          <div>
            <label class="block font-medium mb-2" for="folder-icon">{{ t('folders.icon') }}</label>
            <p class="folder-icon-description">{{ t('folders.iconDescription') }}</p>
          </div>

          <div class="folder-icon-preview">
            <span class="folder-icon-preview-shell" aria-hidden="true">
              <i :class="selectedIcon" />
            </span>
            <div class="folder-icon-preview-copy">
              <span class="folder-icon-preview-label">{{ selectedIconLabel }}</span>
              <code>{{ selectedIcon }}</code>
            </div>
          </div>
        </div>

        <div class="folder-icon-grid" role="listbox" :aria-label="t('folders.iconRecommended')">
          <button
            v-for="option in iconOptions"
            :key="option.value"
            type="button"
            class="folder-icon-option"
            :class="{ 'folder-icon-option-active': option.value === selectedIcon }"
            :aria-pressed="option.value === selectedIcon"
            :title="option.label"
            @click="selectIcon(option.value)"
          >
            <span class="folder-icon-option-shell" aria-hidden="true">
              <i :class="option.value" />
            </span>
            <span class="folder-icon-option-label">{{ option.label }}</span>
          </button>
        </div>

        <div class="folder-icon-manual">
          <label class="block font-medium mb-2" for="folder-icon">{{ t('folders.iconCustom') }}</label>
          <InputText
            id="folder-icon"
            v-model="form.icon"
            class="w-full"
            :placeholder="t('folders.iconPlaceholder')"
          />
          <small class="folder-icon-manual-help">{{ t('folders.iconCustomHelp') }}</small>
        </div>
      </div>

      <div class="folder-dialog-actions">
        <Button
          type="button"
          severity="secondary"
          text
          :label="t('common.cancel')"
          @click="$emit('update:modelValue', false)"
        />
        <Button type="submit" :label="folder ? t('common.update') : t('common.create')" />
      </div>
    </form>
  </Dialog>
</template>

<script setup>
import { computed, reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';

const DEFAULT_FOLDER_ICON = 'pi pi-folder';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  folder: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['update:modelValue', 'submit']);

const { t } = useI18n();

const iconOptions = computed(() => ([
  { value: 'pi pi-folder', label: t('folders.iconDefaultChoice') },
  { value: 'pi pi-folder-open', label: t('folders.iconProjectChoice') },
  { value: 'pi pi-briefcase', label: t('folders.iconWorkChoice') },
  { value: 'pi pi-book', label: t('folders.iconStudyChoice') },
  { value: 'pi pi-code', label: t('folders.iconCodeChoice') },
  { value: 'pi pi-database', label: t('folders.iconDatabaseChoice') },
  { value: 'pi pi-cloud', label: t('folders.iconCloudChoice') },
  { value: 'pi pi-inbox', label: t('folders.iconInboxChoice') },
  { value: 'pi pi-bookmark', label: t('folders.iconBookmarkChoice') },
  { value: 'pi pi-images', label: t('folders.iconMediaChoice') },
  { value: 'pi pi-lock', label: t('folders.iconPrivateChoice') },
  { value: 'pi pi-box', label: t('folders.iconArchiveChoice') },
]));

const form = reactive({
  name: '',
  icon: DEFAULT_FOLDER_ICON,
});

const selectedIcon = computed(() => form.icon.trim() || DEFAULT_FOLDER_ICON);
const selectedIconLabel = computed(() => iconOptions.value.find((option) => option.value === selectedIcon.value)?.label || t('folders.iconCustomSelected'));

watch(
  () => [props.folder, props.modelValue],
  () => {
    form.name = props.folder?.name || '';
    form.icon = props.folder?.icon || DEFAULT_FOLDER_ICON;
  },
  { immediate: true },
);

function selectIcon(icon) {
  form.icon = icon;
}

function submit() {
  emit('submit', {
    name: form.name.trim(),
    icon: form.icon.trim() || DEFAULT_FOLDER_ICON,
  });
}
</script>

<style scoped>
.folder-dialog-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.folder-icon-field {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.folder-icon-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.folder-icon-description {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: 0.84rem;
  line-height: 1.5;
}

.folder-icon-preview {
  min-width: 12rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0.85rem;
  border: 1px solid color-mix(in srgb, var(--surface-border) 84%, transparent);
  background: color-mix(in srgb, var(--surface-ground) 72%, transparent);
}

.folder-icon-preview-shell,
.folder-icon-option-shell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.folder-icon-preview-shell {
  width: 2.8rem;
  height: 2.8rem;
  border: 1px solid color-mix(in srgb, var(--primary-color) 24%, var(--surface-border));
  background: color-mix(in srgb, var(--primary-color) 9%, var(--surface-card));
  color: var(--primary-color);
  font-size: 1.1rem;
}

.folder-icon-preview-copy {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.folder-icon-preview-label {
  font-weight: 700;
}

.folder-icon-preview-copy code {
  color: var(--text-color-secondary);
  font-size: 0.76rem;
  white-space: nowrap;
}

.folder-icon-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.7rem;
}

.folder-icon-option {
  border: 1px solid color-mix(in srgb, var(--surface-border) 84%, transparent);
  background: color-mix(in srgb, var(--surface-ground) 68%, transparent);
  color: inherit;
  padding: 0.8rem 0.7rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: border-color 160ms ease, background-color 160ms ease, transform 160ms ease;
}

.folder-icon-option:hover,
.folder-icon-option-active {
  border-color: color-mix(in srgb, var(--primary-color) 42%, var(--surface-border));
  background: color-mix(in srgb, var(--primary-color) 9%, transparent);
}

.folder-icon-option:hover {
  transform: translateY(-1px);
}

.folder-icon-option-shell {
  width: 2.4rem;
  height: 2.4rem;
  border: 1px solid color-mix(in srgb, var(--surface-border) 84%, transparent);
  background: color-mix(in srgb, var(--surface-card) 88%, transparent);
  color: var(--primary-color);
  font-size: 1rem;
}

.folder-icon-option-label {
  font-size: 0.78rem;
  color: var(--text-color-secondary);
  text-align: center;
  line-height: 1.35;
}

.folder-icon-manual {
  padding-top: 0.2rem;
}

.folder-icon-manual-help {
  display: inline-block;
  margin-top: 0.45rem;
  color: var(--text-color-secondary);
  line-height: 1.45;
}

.folder-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding-top: 0.1rem;
}

@media (max-width: 720px) {
  .folder-icon-header {
    flex-direction: column;
  }

  .folder-icon-preview {
    min-width: 0;
    width: 100%;
  }

  .folder-icon-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
