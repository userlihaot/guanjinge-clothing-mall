import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
import router from './router'
// 全局样式 - 国风配色主题
import './assets/styles/global.css'
// ElMessageBox / ElMessage 是 JS 服务（非组件），按需加载插件不会自动引入其 CSS
// 必须手动导入，否则弹窗不会有样式（遮罩层不显示）
import 'element-plus/theme-chalk/el-message.css'
import 'element-plus/theme-chalk/el-message-box.css'
import 'element-plus/theme-chalk/el-overlay.css'

// 创建 Vue 应用实例
const app = createApp(App)

// 创建 Pinia 状态管理实例，并启用持久化插件
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

// 注册插件（Element Plus 由 unplugin-vue-components 按需自动引入，无需全局注册）
app.use(pinia)
app.use(router)

// 挂载应用到 DOM
app.mount('#app')
