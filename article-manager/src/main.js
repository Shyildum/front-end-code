import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// 导入Vditor样式
import 'vditor/dist/index.css'

const app = createApp(App)
app.use(router)
app.mount('#app')