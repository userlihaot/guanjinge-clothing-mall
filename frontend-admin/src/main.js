// src/main.js - 观锦阁管理后台 入口文件
import { createApp } from 'vue'
import { createPinia } from 'pinia'
// Pinia 持久化插件：自动将 store 数据保存到 localStorage
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
import router from './router'
// 全局样式 — 管理后台风格
import './assets/styles/global.css'
// ElMessage / ElMessageBox 属于 JS 服务（不是模板里的组件），
// unplugin-vue-components 的按需引入管不到它们的样式，必须手动引入，
// 否则提示框会以无样式 div 的形式堆在页面左下角。
import 'element-plus/theme-chalk/el-message.css'
import 'element-plus/theme-chalk/el-message-box.css'
import 'element-plus/theme-chalk/el-overlay.css'

// 创建 Vue 应用实例
const app = createApp(App)

// 创建 Pinia 实例并启用持久化插件
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

// 注册插件：不做全局引入 ElementPlus，所有 Element 组件按需加载
app.use(pinia)
app.use(router)

// 挂载到 #app
app.mount('#app')
