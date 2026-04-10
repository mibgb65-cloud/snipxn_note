<template>
  <Transition name="bottom-nav">
    <nav v-if="visible" class="bottom-nav">
      <router-link
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="bottom-nav-item"
        :class="{ 'bottom-nav-item-active': isActive(item.to) }"
      >
        <i :class="item.icon" />
        <span>{{ item.label }}</span>
      </router-link>
    </nav>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

const route = useRoute()
const { t } = useI18n()

defineProps({
  visible: { type: Boolean, default: true },
})

const navItems = computed(() => [
  { to: '/workspace', icon: 'pi pi-file-edit', label: t('workspace.title') || 'Notes' },
  { to: '/community', icon: 'pi pi-users', label: t('community.title') || 'Community' },
  { to: '/settings', icon: 'pi pi-cog', label: t('sidebar.settings') || 'Settings' },
])

function isActive(path) {
  return route.path === path || route.path.startsWith(path + '/')
}
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: calc(3.5rem + var(--safe-bottom, 0px));
  padding-bottom: var(--safe-bottom, 0px);
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: color-mix(in srgb, var(--app-panel-raised) 97%, transparent);
  border-top: 1px solid var(--app-border);
  backdrop-filter: blur(12px) saturate(1.4);
  -webkit-backdrop-filter: blur(12px) saturate(1.4);
  z-index: 900;
}

.bottom-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  flex: 1;
  height: 100%;
  padding: 0.35rem 0;
  text-decoration: none;
  color: var(--text-color-secondary);
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  transition: color 0.15s ease;
}

.bottom-nav-item i {
  font-size: 1.15rem;
  transition: transform 0.15s ease;
}

.bottom-nav-item-active {
  color: var(--primary-color);
}

.bottom-nav-item-active i {
  transform: scale(1.1);
}

.bottom-nav-item:active {
  color: var(--primary-color);
}

.bottom-nav-enter-active,
.bottom-nav-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.bottom-nav-enter-from,
.bottom-nav-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
