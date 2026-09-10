<template>
  <el-config-provider :locale="zhCn">
    <!-- 商城前台：顶部导航 + 内容 + 页脚 -->
    <AppHeader />
    <main class="main-container">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <AppFooter />
  </el-config-provider>
</template>

<script setup>
// 观锦阁商城前台根组件
//
// 说明：这里原先还内联了一整套管理后台布局（侧边栏 + 顶栏 + 修改密码弹窗 +
// 退出确认弹窗，约 400 行模板/逻辑 + 550 行样式），用来承载
// src/views/admin/ 下的重复后台副本。
// 那套副本与独立的 frontend-admin 应用重复且已经分叉，现已移除；
// 管理端请使用独立的 frontend-admin 应用（端口 5174）。
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import AppHeader from '@/components/common/AppHeader.vue'
import AppFooter from '@/components/common/AppFooter.vue'
</script>

<style>
/* 页面过渡动画 .fade-* 定义在 assets/styles/global.css 中，此处不再重复 */
.main-container {
  min-height: calc(100vh - 140px);
  background: var(--color-bg-primary, #FFF8F0);
}
</style>
