import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import './assets/common.css'
import './assets/main.scss'

import 'virtual:uno.css' // 放在最后 优先级高
const app = createApp(App)
app.use(createPinia())
app.use(router)

app.mount('#app')
