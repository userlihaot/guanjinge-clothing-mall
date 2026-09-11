<!-- AdminLayout.vue - 管理后台主布局：浅米白国风侧边栏 + 暖色内容区 -->
<template>
  <el-container class="admin-container">
    <!-- ========== 左侧国风侧边栏 ========== -->
    <el-aside :width="isCollapse ? '64px' : '220px'" class="admin-aside">
      <!-- Logo 区域 -->
      <div class="aside-logo" @click="goHome">
        <span class="logo-icon">🏮</span>
        <span v-show="!isCollapse" class="logo-text">观锦阁</span>
      </div>

      <!-- 导航菜单（配色由 CSS 变量控制，见下方 .admin-menu） -->
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :collapse-transition="false"
        router
        class="admin-menu"
      >
        <!-- 仪表盘 -->
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>数据统计</template>
        </el-menu-item>

        <!-- 商品管理 -->
        <el-menu-item index="/products">
          <el-icon><Goods /></el-icon>
          <template #title>商品管理</template>
        </el-menu-item>

        <!-- 分类管理 -->
        <el-menu-item index="/categories">
          <el-icon><Grid /></el-icon>
          <template #title>分类管理</template>
        </el-menu-item>

        <!-- 订单管理 -->
        <el-menu-item index="/orders">
          <el-icon><List /></el-icon>
          <template #title>订单管理</template>
        </el-menu-item>

        <!-- 用户管理 -->
        <el-menu-item index="/users">
          <el-icon><UserFilled /></el-icon>
          <template #title>用户管理</template>
        </el-menu-item>

        <!-- 优惠券 -->
        <el-menu-item index="/coupons">
          <el-icon><Ticket /></el-icon>
          <template #title>优惠券</template>
        </el-menu-item>

        <!-- 评价审核 -->
        <el-menu-item index="/reviews">
          <el-icon><StarFilled /></el-icon>
          <template #title>评价审核</template>
        </el-menu-item>

        <!-- 退款处理 -->
        <el-menu-item index="/refunds">
          <el-icon><Money /></el-icon>
          <template #title>退款处理</template>
        </el-menu-item>

        <!-- 系统设置 -->
        <el-menu-item index="/settings">
          <el-icon><Setting /></el-icon>
          <template #title>系统设置</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- ========== 右侧内容区 ========== -->
    <el-container class="admin-right">
      <!-- 顶部栏 -->
      <el-header class="admin-header">
        <div class="header-left">
          <!-- 折叠/展开按钮 -->
          <el-icon
            class="collapse-btn"
            :size="22"
            @click="toggleCollapse"
          >
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <!-- 面包屑当前页面标题 -->
          <span class="header-breadcrumb">{{ currentPageTitle }}</span>
        </div>

        <div class="header-right">
          <!-- 管理员头像下拉菜单 -->
          <el-dropdown trigger="click" @command="handleCommand">
            <span class="admin-dropdown-link">
              <el-avatar :size="32" :icon="UserFilled" />
              <span class="admin-name">{{ adminStore.username }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="settings">
                  <el-icon><Setting /></el-icon> 系统设置
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon> 退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 内容区域：渲染子路由页面 -->
      <el-main class="admin-main">
        <router-view />
      </el-main>
    </el-container>

    <!-- ========== 退出登录确认模态框 ========== -->
    <el-dialog
      v-model="logoutDialogVisible"
      title="退出确认"
      width="400px"
      :close-on-click-modal="false"
      center
      align-center
    >
      <div class="logout-dialog-content">
        <div class="logout-icon-wrap">
          <el-icon :size="48" color="#D4943A"><WarningFilled /></el-icon>
        </div>
        <p class="logout-text">确定要退出登录吗？</p>
        <p class="logout-sub-text">退出后需要重新登录才能访问管理后台</p>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="logoutDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="handleLogout">确认退出</el-button>
        </div>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  DataAnalysis, Goods, List, UserFilled,
  Ticket, StarFilled, Money,
  Setting, Fold, Expand, ArrowDown, SwitchButton,
  WarningFilled, Grid
} from '@element-plus/icons-vue'
import { useAdminStore } from '@/stores/admin'

// 路由实例
const route = useRoute()
const router = useRouter()

// 管理员 Store
const adminStore = useAdminStore()

// 侧边栏折叠状态 (从 localStorage 恢复)
const COLLAPSE_KEY = 'admin_sidebar_collapse'
const isCollapse = ref(localStorage.getItem(COLLAPSE_KEY) === 'true')

/**
 * 切换侧边栏折叠状态，并持久化到 localStorage
 */
function toggleCollapse() {
  isCollapse.value = !isCollapse.value
  localStorage.setItem(COLLAPSE_KEY, String(isCollapse.value))
}

/**
 * 计算当前激活的菜单项 (基于当前路由路径)
 */
const activeMenu = computed(() => {
  return route.path
})

/**
 * 计算当前页面标题 (用于顶部面包屑)
 */
const currentPageTitle = computed(() => {
  return route.meta?.title || '管理后台'
})

/**
 * 点击 Logo 回到首页仪表盘
 */
function goHome() {
  router.push('/dashboard')
}

// ============ 退出登录模态框 ============
const logoutDialogVisible = ref(false)

/**
 * 确认退出登录
 */
function handleLogout() {
  adminStore.logout()
  ElMessage.success('已退出登录')
  logoutDialogVisible.value = false
  router.push('/login')
}

/**
 * 处理管理员下拉菜单命令
 *
 * 说明：原先这里有「修改密码」，但后端并没有 PUT /api/admin/change-password，
 * 代码里是一句 `// TODO: 调用修改密码 API` 加一句假的成功提示，
 * 密码从未被修改。为避免误导，已把该入口与对应弹窗一并移除。
 */
function handleCommand(command) {
  switch (command) {
    case 'settings':
      router.push('/settings')
      break
    case 'logout':
      logoutDialogVisible.value = true
      break
  }
}
</script>

<style scoped>
/* ========== 整体布局 ========== */
.admin-container {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

/* ========== 左侧国风侧边栏 ========== */
.admin-aside {
  background-color: var(--sidebar-bg);
  border-right: 1px solid var(--color-border);
  transition: width 0.3s ease;
  overflow-x: hidden;
  overflow-y: auto;
}

.aside-logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-bottom: 1px solid var(--color-border);
  background: linear-gradient(135deg, #FFF8F0 0%, #F3ECE7 100%);
  user-select: none;
}

.logo-icon {
  font-size: 24px;
  margin-right: 8px;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-primary);
  font-family: var(--font-family-serif);
  letter-spacing: 1px;
  white-space: nowrap;
}

.admin-menu {
  border-right: none;
  /* Element Plus 菜单配色变量：浅底 + 棕字 + 淡金高亮 */
  --el-menu-bg-color: var(--sidebar-bg);
  --el-menu-text-color: var(--sidebar-text);
  --el-menu-hover-bg-color: var(--sidebar-hover);
  --el-menu-hover-text-color: var(--color-primary);
  --el-menu-active-color: var(--sidebar-active);
  --el-menu-item-height: 52px;
}

/* 选中项：淡金底 + 左侧棕色竖条 */
.admin-menu .el-menu-item.is-active {
  background-color: var(--el-color-primary-light-9);
  color: var(--color-primary) !important;
  font-weight: 600;
  border-right: 3px solid var(--color-primary);
}

.admin-menu .el-menu-item.is-active .el-icon {
  color: var(--color-primary);
}

.admin-menu:not(.el-menu--collapse) {
  width: 220px;
}

/* ========== 右侧区域 ========== */
.admin-right {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ========== 顶部栏 ========== */
.admin-header {
  height: 60px;
  background: var(--card-bg);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: var(--shadow-light);
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.collapse-btn {
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: color 0.2s;
}

.collapse-btn:hover {
  color: var(--color-primary);
}

.header-breadcrumb {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
  font-family: var(--font-family-serif);
}

.header-right {
  display: flex;
  align-items: center;
}

.admin-dropdown-link {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--radius-small);
  transition: background-color 0.2s;
}

.admin-dropdown-link:hover {
  background-color: var(--el-color-primary-light-9);
}

.admin-name {
  font-size: 14px;
  color: var(--color-text-primary);
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ========== 主内容区 ========== */
.admin-main {
  background-color: var(--content-bg);
  padding: 20px;
  overflow-y: auto;
  height: calc(100vh - 60px);
}

/* ========== 模态框通用 ========== */
.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 12px;
}

/* ========== 退出登录模态框 ========== */
.logout-dialog-content {
  text-align: center;
  padding: 20px 0;
}

.logout-icon-wrap {
  margin-bottom: 16px;
}

.logout-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 8px 0;
}

.logout-sub-text {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 0;
}
</style>
