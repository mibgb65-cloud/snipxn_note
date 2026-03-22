<template>
  <div class="folder-list">
    <div
      v-for="item in listItems"
      :key="`${item.kind}-${item.id}`"
      class="folder-item"
      :class="{
        'folder-item-active': isItemActive(item),
        'folder-item-danger': item.tone === 'danger',
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
            <i :class="item.icon || 'pi pi-folder'" />
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
          text
          rounded
          size="small"
          :aria-label="t('common.edit')"
          @click.stop="$emit('edit', item)"
        />
        <Button
          v-if="!item.isDefault"
          icon="pi pi-trash"
          text
          rounded
          severity="danger"
          size="small"
          :aria-label="t('common.delete')"
          @click.stop="$emit('delete', item)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import Button from 'primevue/button';
import Tag from 'primevue/tag';

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

const emit = defineEmits(['select-home', 'select', 'select-view', 'edit', 'delete']);

const { t } = useI18n();

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

function isItemActive(item) {
  if (item.kind === 'home') {
    return props.homeActive;
  }

  if (item.kind === 'view') {
    return props.activeView === item.id;
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
</script>

<style scoped>
.folder-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.folder-item {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.35rem;
  align-items: center;
  border-left: 2px solid transparent;
  border-bottom: 1px solid color-mix(in srgb, var(--surface-border) 75%, transparent);
  background: transparent;
  transition: background-color 180ms ease, border-color 180ms ease;
  overflow: hidden;
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
  width: 100%;
  border: 0;
  background: transparent;
  color: inherit;
  padding: 0.85rem 0.9rem;
  border-radius: inherit;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  cursor: pointer;
  text-align: left;
}

.folder-trigger-collapsed {
  justify-content: center;
  padding: 0.65rem 0.35rem;
}

.folder-main {
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
  display: flex;
  align-items: center;
  padding-right: 0.35rem;
  opacity: 0.72;
  transition: opacity 180ms ease;
}

.folder-item:hover .folder-actions,
.folder-item-active .folder-actions {
  opacity: 1;
}

.folder-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.folder-count {
  min-width: 2rem;
  padding: 0.35rem 0.55rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-family: var(--font-mono);
  color: var(--text-color-secondary);
  background: color-mix(in srgb, var(--surface-card) 88%, transparent);
  text-align: center;
}
</style>
