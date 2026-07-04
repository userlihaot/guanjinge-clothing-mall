// vite.config.js - 观锦阁管理后台 Vite 配置
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    vue(),
    // 自动导入 Vue 组合式 API (ref, reactive, watch 等)
    AutoImport({
      resolvers: [ElementPlusResolver()]
    }),
    // 按需自动导入 Element Plus 组件
    Components({
      resolvers: [ElementPlusResolver()]
    })
  ],
  resolve: {
    alias: {
      // @ 指向 src 目录
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    // 开发服务器端口
    port: 5174,
    // 代理 /api 到后端服务
    proxy: {
      '/api': {
        target: 'http://localhost:8090',
        changeOrigin: true
      },
      '/image': {
        target: 'http://localhost:8090',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:8090',
        changeOrigin: true
      }
    }
  }
})
