<!-- App.vue - 根组件，提供 Element Plus 中文语言环境 -->
<template>
  <el-config-provider :locale="zhCn">
    <router-view />
  </el-config-provider>
</template>

<script setup>
// 导入 Element Plus 中文语言包（使用 ES Module 版本）
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
</script>
