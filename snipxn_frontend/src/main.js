import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import i18n from './i18n'

import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import Toast from 'primevue/toast'
import { initializeTheme } from './composables/useTheme'
import SnipxnPreset from './theme/preset'

import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'
import './assets/main.css'

initializeTheme()

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)

app.use(PrimeVue, {
    theme: {
        preset: SnipxnPreset,
        options: {
            darkModeSelector: '.app-dark'
        }
    }
})
app.use(ToastService)
app.component('Toast', Toast)

app.mount('#app')
