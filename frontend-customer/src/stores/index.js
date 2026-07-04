import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

// 创建 Pinia 实例并注册持久化插件
// 持久化插件让指定的 store 状态自动保存到 localStorage/sessionStorage
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

export default pinia
