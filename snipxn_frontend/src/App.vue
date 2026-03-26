<template>
  <Toast />
  <div class="app-router-shell">
    <router-view v-slot="{ Component, route }">
      <Transition name="page-shell" mode="out-in" appear>
        <component :is="Component" :key="route.path" class="page-shell-view" />
      </Transition>
    </router-view>
  </div>
</template>

<script setup>
</script>

<style scoped>
.app-router-shell,
.page-shell-view {
  min-height: 100%;
}
</style>
