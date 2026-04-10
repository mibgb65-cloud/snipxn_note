<template>
  <Toast />
  <div class="app-router-shell" :class="{ 'app-has-bottom-nav': showBottomNav && !isKeyboardOpen }">
    <router-view v-slot="{ Component, route }">
      <Transition name="page-shell" mode="out-in" appear>
        <component :is="Component" :key="route.path" class="page-shell-view" />
      </Transition>
    </router-view>
  </div>
  <BottomNavBar v-if="showBottomNav" :visible="showBottomNav && !isKeyboardOpen" />
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useBreakpoints } from './composables/useBreakpoints'
import { useVirtualKeyboard } from './composables/useVirtualKeyboard'
import BottomNavBar from './components/mobile/BottomNavBar.vue'

const route = useRoute()
const { isPhone } = useBreakpoints()
const { isKeyboardOpen } = useVirtualKeyboard()

const appRoutes = ['/workspace', '/community', '/settings']
const showBottomNav = computed(() => {
  return isPhone.value && appRoutes.some(r => route.path === r || route.path.startsWith(r + '/'))
})
</script>

<style scoped>
.app-router-shell,
.page-shell-view {
  min-height: 100%;
}

.app-has-bottom-nav .page-shell-view {
  padding-bottom: calc(3.5rem + var(--safe-bottom, 0px));
}
</style>
