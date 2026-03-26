<template>
  <div class="folder-list">
    <div
      v-for="item in listItems"
      :key="`${item.kind}-${item.id}`"
      class="folder-item"
      :class="{
        'folder-item-active': isItemActive(item),
        'folder-item-danger': item.tone === 'danger',
        'folder-item-with-actions': !collapsed && item.kind === 'folder',
      }"
    >
      <button
        type="button"
        class="folder-trigger"
        :class="{ 'folder-trigger-collapsed': collapsed }"
        :title="item.name"
        @click="handleSelect(item)"
      >
        <span class="folder-main">
          <span class="folder-icon-shell" :class="{ 'folder-icon-shell-danger': item.tone === 'danger' }">
            <i :class="normalizeIcon(item.icon)" />
          </span>

          <span v-if="!collapsed" class="folder-copy">
            <span class="folder-row">
              <span class="folder-name">{{ item.name }}</span>
              <Tag v-if="item.isDefault" severity="secondary" :value="t('folders.defaultFolder')" />
            </span>
          </span>
        </span>

        <span v-if="!collapsed && item.noteCount != null" class="folder-count">{{ item.noteCount }}</span>
      </button>

      <div v-if="!collapsed && item.kind === 'folder'" class="folder-actions">
        <Button
          icon="pi pi-pencil"
          severity="secondary"
          outlined
          size="small"
          class="folder-action-btn"
          :aria-label="t('common.edit')"
          @click.stop="openEditPopover($event, item)"
        />
        <Button
          v-if="!item.isDefault"
          icon="pi pi-trash"
          severity="danger"
          outlined
          size="small"
          class="folder-action-btn"
          :aria-label="t('common.delete')"
          @click.stop="openDeletePopover($event, item)"
        />
      </div>
    </div>

    <Popover
      ref="editPopoverRef"
      class="folder-action-popover"
      @show="editPopoverVisible = true"
      @hide="handleEditPopoverHide"
    >
      <form v-if="activeEditFolder" class="folder-inline-editor" @submit.prevent="submitFolderUpdate">
        <div class="folder-inline-header">
          <div class="folder-inline-kicker">{{ t('folders.editFolder') }}</div>
          <Button
            type="button"
            icon="pi pi-times"
            severity="secondary"
            text
            rounded
            class="folder-inline-close"
            :aria-label="t('common.cancel')"
            @click="hideEditPopover"
          />
        </div>

        <div class="folder-inline-field">
          <label class="folder-inline-label" for="folder-inline-name">{{ t('folders.name') }}</label>
          <InputText
            id="folder-inline-name"
            v-model="editForm.name"
            class="w-full"
            :placeholder="t('folders.namePlaceholder')"
            autofocus
          />
        </div>

        <div class="folder-inline-field">
          <div class="folder-inline-preview">
            <span class="folder-inline-preview-shell" aria-hidden="true">
              <i :class="selectedIcon" />
            </span>
            <div class="folder-inline-preview-copy">
              <span class="folder-inline-preview-label">{{ selectedIconLabel }}</span>
              <code>{{ selectedIcon }}</code>
            </div>
          </div>

          <div class="folder-inline-icon-grid" role="listbox" :aria-label="t('folders.iconRecommended')">
            <button
              v-for="option in iconOptions"
              :key="option.value"
              type="button"
              class="folder-inline-icon-option"
              :class="{ 'folder-inline-icon-option-active': option.value === selectedIcon }"
              :aria-pressed="option.value === selectedIcon"
              :title="option.label"
              @click="selectIcon(option.value)"
            >
              <span class="folder-inline-icon-shell" aria-hidden="true">
                <i :class="option.value" />
              </span>
            </button>
          </div>

          <InputText
            v-model="editForm.icon"
            class="w-full"
            :placeholder="t('folders.iconPlaceholder')"
          />
        </div>

        <div class="folder-inline-actions">
          <Button
            type="button"
            severity="secondary"
            text
            :label="t('common.cancel')"
            @click="hideEditPopover"
          />
          <Button type="submit" :label="t('common.update')" />
        </div>
      </form>
    </Popover>

    <Popover
      ref="deletePopoverRef"
      class="folder-action-popover folder-delete-confirm-popover"
      @show="deletePopoverVisible = true"
      @hide="handleDeletePopoverHide"
    >
      <div v-if="activeDeleteFolder" class="folder-inline-confirm">
        <div class="folder-inline-kicker folder-inline-kicker-danger">{{ t('common.delete') }}</div>
        <p class="folder-inline-confirm-copy">{{ t('folders.deleteConfirm') }}</p>

        <div class="folder-inline-actions">
          <Button
            type="button"
            severity="secondary"
            text
            :label="t('common.cancel')"
            @click="hideDeletePopover"
          />
          <Button
            type="button"
            severity="danger"
            :label="t('common.delete')"
            @click="confirmDeleteFolder"
          />
        </div>
      </div>
    </Popover>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Popover from 'primevue/popover';
import Tag from 'primevue/tag';

const DEFAULT_FOLDER_ICON = 'pi pi-folder';

const props = defineProps({
  showHome: {
    type: Boolean,
    default: false,
  },
  homeActive: {
    type: Boolean,
    default: false,
  },
  folders: {
    type: Array,
    default: () => [],
  },
  activeFolderId: {
    type: [String, Number, null],
    default: null,
  },
  activeView: {
    type: String,
    default: 'folder',
  },
  specialViews: {
    type: Array,
    default: () => [],
  },
  collapsed: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['select-home', 'select', 'select-view', 'update-folder', 'delete']);

const { t } = useI18n();
const editPopoverRef = ref(null);
const deletePopoverRef = ref(null);
const editPopoverVisible = ref(false);
const deletePopoverVisible = ref(false);
const activeEditFolder = ref(null);
const activeDeleteFolder = ref(null);
const editForm = reactive({
  name: '',
  icon: DEFAULT_FOLDER_ICON,
});

const listItems = computed(() => ([
  ...(props.showHome ? [{
    id: 'home',
    name: t('sidebar.home'),
    icon: 'pi pi-home',
    kind: 'home',
  }] : []),
  ...(props.folders || []).map((folder) => ({
    ...folder,
    kind: 'folder',
  })),
  ...(props.specialViews || []).map((view) => ({
    ...view,
    kind: 'view',
  })),
]));
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
const selectedIcon = computed(() => editForm.icon.trim() || DEFAULT_FOLDER_ICON);
const selectedIconLabel = computed(() => (
  iconOptions.value.find((option) => option.value === selectedIcon.value)?.label || t('folders.iconCustomSelected')
));

function normalizeIcon(icon) {
  if (!icon) return DEFAULT_FOLDER_ICON;
  return icon.startsWith('pi ') ? icon : `pi pi-${icon}`;
}

function isItemActive(item) {
  if (item.kind === 'home') {
    return props.homeActive;
  }

  if (item.kind === 'view') {
    return props.activeView === item.id;
  }

  if (props.homeActive) {
    return false;
  }

  return props.activeView === 'folder' && item.id === props.activeFolderId;
}

function handleSelect(item) {
  if (item.kind === 'home') {
    emit('select-home');
    return;
  }

  if (item.kind === 'view') {
    emit('select-view', item.id);
    return;
  }

  emit('select', item.id);
}

function syncEditForm(item) {
  editForm.name = item?.name || '';
  editForm.icon = item?.icon || DEFAULT_FOLDER_ICON;
}

function hideEditPopover() {
  editPopoverRef.value?.hide?.();
}

function hideDeletePopover() {
  deletePopoverRef.value?.hide?.();
}

function handleEditPopoverHide() {
  editPopoverVisible.value = false;
  activeEditFolder.value = null;
}

function handleDeletePopoverHide() {
  deletePopoverVisible.value = false;
  activeDeleteFolder.value = null;
}

function openEditPopover(event, item) {
  hideDeletePopover();
  syncEditForm(item);

  if (editPopoverVisible.value && activeEditFolder.value?.id === item.id) {
    hideEditPopover();
    return;
  }

  activeEditFolder.value = item;
  editPopoverRef.value?.show?.(event);
}

function openDeletePopover(event, item) {
  hideEditPopover();

  if (deletePopoverVisible.value && activeDeleteFolder.value?.id === item.id) {
    hideDeletePopover();
    return;
  }

  activeDeleteFolder.value = item;
  deletePopoverRef.value?.show?.(event);
}

function selectIcon(icon) {
  editForm.icon = icon;
}

function submitFolderUpdate() {
  if (!activeEditFolder.value) {
    return;
  }

  emit('update-folder', {
    folder: activeEditFolder.value,
    payload: {
      name: editForm.name.trim(),
      icon: editForm.icon.trim() || DEFAULT_FOLDER_ICON,
    },
  });
  hideEditPopover();
}

function confirmDeleteFolder() {
  if (!activeDeleteFolder.value) {
    return;
  }

  emit('delete', activeDeleteFolder.value);
  hideDeletePopover();
}
</script>

<style scoped>
.folder-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.folder-item {
  position: relative;
  border-left: 2px solid transparent;
  border-bottom: 1px solid color-mix(in srgb, var(--surface-border) 75%, transparent);
  background: transparent;
  transition: background-color 180ms ease, border-color 180ms ease;
  overflow: visible;
}

.folder-item::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 0.25rem;
  background: color-mix(in srgb, var(--primary-color) 58%, transparent);
  opacity: 0;
  transition: opacity 180ms ease;
}

.folder-item:hover,
.folder-item-active {
  background: color-mix(in srgb, var(--primary-color) 8%, transparent);
  border-left-color: var(--primary-color);
}

.folder-item-danger:hover,
.folder-item-danger.folder-item-active {
  background: color-mix(in srgb, #dc2626 8%, transparent);
  border-left-color: #dc2626;
}

.folder-item:hover::before,
.folder-item-active::before {
  opacity: 1;
}

.folder-item-danger::before {
  background: color-mix(in srgb, #dc2626 52%, transparent);
}

.folder-trigger {
  position: relative;
  width: 100%;
  border: 0;
  background: transparent;
  color: inherit;
  padding: 0.85rem 0.9rem;
  border-radius: inherit;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.75rem;
  cursor: pointer;
  text-align: left;
}

.folder-trigger-collapsed {
  justify-content: center;
  padding: 0.65rem 0.35rem;
}

.folder-item-with-actions .folder-trigger {
  padding-right: 5.95rem;
}

.folder-main {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.folder-icon-shell {
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  background: color-mix(in srgb, var(--primary-color) 9%, var(--surface-card));
  color: var(--primary-color);
  flex-shrink: 0;
}

.folder-icon-shell-danger {
  background: color-mix(in srgb, #dc2626 10%, var(--surface-card));
  color: #dc2626;
}

.folder-copy {
  min-width: 0;
}

.folder-row {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
  flex-wrap: wrap;
}

.folder-actions {
  position: absolute;
  top: 50%;
  right: 0.65rem;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: translateY(-50%);
  transition: opacity 140ms ease, visibility 140ms ease;
}

.folder-item:hover .folder-actions,
.folder-item:focus-within .folder-actions {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: translateY(-50%);
}

.folder-action-btn {
  min-height: 2rem;
}

.folder-action-btn :deep(.p-button) {
  width: 2rem;
  min-width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  background: color-mix(in srgb, var(--app-panel-strong) 94%, transparent);
  box-shadow: 0 8px 18px -18px rgba(15, 23, 42, 0.55);
}

.folder-action-btn:hover :deep(.p-button),
.folder-action-btn:focus-visible :deep(.p-button) {
  background: color-mix(in srgb, var(--app-panel-strong) 99%, var(--primary-color) 4%);
}

.folder-action-btn :deep(.p-button-label) {
  display: none;
}

.folder-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.folder-count {
  position: absolute;
  top: 50%;
  right: 0.9rem;
  min-width: 2rem;
  padding: 0.35rem 0.55rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-family: var(--font-mono);
  color: var(--text-color-secondary);
  background: color-mix(in srgb, var(--surface-card) 88%, transparent);
  text-align: center;
  pointer-events: none;
  transform: translateY(-50%);
  transition: opacity 140ms ease, visibility 140ms ease;
}

.folder-item-with-actions:hover .folder-count,
.folder-item-with-actions:focus-within .folder-count {
  opacity: 0;
  visibility: hidden;
}

:deep(.folder-action-popover.p-popover) {
  border: 1px solid color-mix(in srgb, var(--app-border) 90%, transparent);
  background: color-mix(in srgb, var(--app-panel-strong) 99%, transparent);
  box-shadow: 0 22px 36px -30px rgba(15, 23, 42, 0.45);
}

:deep(.folder-action-popover .p-popover-content) {
  padding: 0.9rem;
}

:deep(.folder-action-popover .p-popover-arrow) {
  display: none;
}

.folder-inline-editor,
.folder-inline-confirm {
  width: min(22rem, calc(100vw - 3rem));
}

.folder-inline-editor {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.folder-inline-header,
.folder-inline-actions,
.folder-inline-preview {
  display: flex;
  align-items: center;
}

.folder-inline-header {
  justify-content: space-between;
  gap: 0.75rem;
}

.folder-inline-kicker,
.folder-inline-label {
  font-family: var(--font-mono);
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.folder-inline-kicker {
  color: var(--primary-color);
}

.folder-inline-kicker-danger {
  color: var(--danger-color, #dc2626);
}

.folder-inline-close {
  width: 1.9rem;
  height: 1.9rem;
}

.folder-inline-field {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.folder-inline-label {
  color: var(--text-color-secondary);
}

.folder-inline-preview {
  gap: 0.7rem;
  padding: 0.7rem 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid color-mix(in srgb, var(--app-border) 90%, transparent);
  background: color-mix(in srgb, var(--app-panel-subtle) 94%, transparent);
}

.folder-inline-preview-shell,
.folder-inline-icon-shell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.folder-inline-preview-shell {
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 0.7rem;
  background: color-mix(in srgb, var(--primary-color) 10%, var(--surface-card));
  color: var(--primary-color);
  flex-shrink: 0;
}

.folder-inline-preview-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.folder-inline-preview-label {
  font-weight: 700;
  color: var(--text-color);
}

.folder-inline-preview-copy code {
  color: var(--text-color-secondary);
  font-size: 0.74rem;
}

.folder-inline-icon-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.45rem;
}

.folder-inline-icon-option {
  border: 1px solid color-mix(in srgb, var(--app-border) 88%, transparent);
  border-radius: 0.65rem;
  background: color-mix(in srgb, var(--app-panel-subtle) 92%, transparent);
  color: inherit;
  padding: 0.45rem;
  cursor: pointer;
  transition: border-color 140ms ease, background-color 140ms ease, transform 140ms ease;
}

.folder-inline-icon-option:hover,
.folder-inline-icon-option-active {
  border-color: color-mix(in srgb, var(--primary-color) 38%, var(--app-border));
  background: color-mix(in srgb, var(--primary-color) 10%, transparent);
}

.folder-inline-icon-option:hover {
  transform: translateY(-1px);
}

.folder-inline-icon-shell {
  width: 1.4rem;
  height: 1.4rem;
  color: var(--primary-color);
}

.folder-inline-actions {
  justify-content: flex-end;
  gap: 0.45rem;
}

.folder-inline-confirm {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.folder-inline-confirm-copy {
  margin: 0;
  color: var(--text-color);
  line-height: 1.6;
}
</style>
