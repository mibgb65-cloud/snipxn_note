import { ref, onMounted, onUnmounted } from 'vue'

export function useVirtualKeyboard() {
  const keyboardHeight = ref(0)
  const isKeyboardOpen = ref(false)

  let cleanup = null

  onMounted(() => {
    if (window.visualViewport) {
      const onResize = () => {
        const diff = window.innerHeight - window.visualViewport.height
        keyboardHeight.value = Math.max(0, diff)
        isKeyboardOpen.value = diff > 100
      }
      window.visualViewport.addEventListener('resize', onResize)
      cleanup = () => window.visualViewport.removeEventListener('resize', onResize)
    }
  })

  onUnmounted(() => {
    if (cleanup) cleanup()
  })

  return { keyboardHeight, isKeyboardOpen }
}
