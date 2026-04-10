import { ref, computed, onMounted, onUnmounted } from 'vue'

export const BREAKPOINTS = {
  PHONE_SM: 375,
  PHONE: 480,
  TABLET_SM: 640,
  TABLET: 768,
  TABLET_LG: 1024,
  DESKTOP_SM: 1180,
  DESKTOP: 1280,
  DESKTOP_LG: 1440,
}

export function useBreakpoints() {
  const width = ref(typeof window !== 'undefined' ? window.innerWidth : 1280)

  let onResize
  onMounted(() => {
    onResize = () => { width.value = window.innerWidth }
    window.addEventListener('resize', onResize)
  })
  onUnmounted(() => {
    if (onResize) window.removeEventListener('resize', onResize)
  })

  return {
    width,
    isPhoneSm: computed(() => width.value < BREAKPOINTS.PHONE_SM),
    isPhone: computed(() => width.value < BREAKPOINTS.TABLET),
    isTablet: computed(() => width.value >= BREAKPOINTS.TABLET && width.value < BREAKPOINTS.DESKTOP_SM),
    isDesktop: computed(() => width.value >= BREAKPOINTS.DESKTOP_SM),
    isMobile: computed(() => width.value < BREAKPOINTS.DESKTOP_SM),
  }
}
