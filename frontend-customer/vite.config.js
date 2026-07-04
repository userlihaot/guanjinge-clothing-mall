import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { fileURLToPath, URL } from 'node:url'

// Vite 构建配置 - 观锦阁古装服饰商城前端
export default defineConfig({
  plugins: [
    vue(),
    // 按需自动导入 Vue API（ref, reactive, computed 等）
    AutoImport({
      resolvers: [ElementPlusResolver()],
      imports: ['vue', 'vue-router', 'pinia'],
      dts: 'src/auto-imports.d.ts', // 类型声明文件输出路径
    }),
    // 按需自动注册 Element Plus 组件
    Components({
      resolvers: [ElementPlusResolver()],
      dts: 'src/components.d.ts', // 组件类型声明文件输出路径
    }),
  ],
  resolve: {
    alias: {
      // @ 符号映射到 src 目录，方便导入路径书写
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173, // 开发服务器端口号
    host: '0.0.0.0', // 允许局域网访问
    proxy: {
      // 所有 /api 请求转发到后端 Spring Boot 服务
      '/api': {
        target: 'http://localhost:8090',
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, ''), // 如果后端无 /api 前缀则启用
      },
      // 上传文件请求也转发到后端
      '/uploads': {
        target: 'http://localhost:8090',
        changeOrigin: true,
      },
      '/image': {
        target: 'http://localhost:8090',
        changeOrigin: true,
      },
    },
  },
})
