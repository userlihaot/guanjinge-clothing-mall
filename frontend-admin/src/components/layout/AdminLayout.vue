<!-- AdminLayout.vue - 管理后台主布局：深色侧边栏 + 白色内容区 -->
<template>
  <el-container class="admin-container">
    <!-- ========== 左侧深色侧边栏 ========== -->
    <el-aside :width="isCollapse ? '64px' : '220px'" class="admin-aside">
      <!-- Logo 区域 -->
      <div class="aside-logo" @click="goHome">
        <span class="logo-icon">🏮</span>
        <span v-show="!isCollapse" class="logo-text">观锦阁</span>
      </div>

      <!-- 导航菜单 -->
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :collapse-transition="false"
        background-color="#1d1e2c"
        text-color="#bfcbd9"
        active-text-color="#ffffff"
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

        <!-- 轮播图 -->
        <el-menu-item index="/banners">
          <el-icon><PictureFilled /></el-icon>
          <template #title>轮播图</template>
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
                <el-dropdown-item command="password">
                  <el-icon><Lock /></el-icon> 修改密码
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

    <!-- ========== 修改密码模态框 ========== -->
    <el-dialog
      v-model="passwordDialogVisible"
      title="修改密码"
      width="440px"
      :close-on-click-modal="false"
      center
      align-center
    >
      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-width="80px"
        size="default"
      >
        <el-form-item label="原密码" prop="oldPassword">
          <el-input
            v-model="passwordForm.oldPassword"
            type="password"
            placeholder="请输入原密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="请输入6位以上新密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="passwordDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="passwordLoading" @click="handleChangePassword">
            确认修改
          </el-button>
        </div>
      </template>
    </el-dialog>

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
          <el-icon :size="48" color="#e6a23c"><WarningFilled /></el-icon>
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
import { ref, reactive, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  DataAnalysis, Goods, List, UserFilled,
  Ticket, PictureFilled, StarFilled, Money,
  Setting, Fold, Expand, ArrowDown, Lock, SwitchButton,
  WarningFilled
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

// ============ 修改密码模态框 ============
const passwordDialogVisible = ref(false)
const passwordLoading = ref(false)
const passwordFormRef = ref(null)

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

/**
 * 自定义验证：确认密码必须与新密码一致
 */
function validateConfirmPassword(rule, value, callback) {
  if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

/**
 * 提交修改密码
 */
async function handleChangePassword() {
  const valid = await passwordFormRef.value.validate().catch(() => false)
  if (!valid) return

  passwordLoading.value = true
  try {
    // TODO: 调用修改密码 API
    // await adminApi.changePassword(passwordForm)
    ElMessage.success('密码修改成功，请重新登录')
    passwordDialogVisible.value = false
    // 重置表单
    passwordFormRef.value.resetFields()
    adminStore.logout()
    router.push('/login')
  } catch {
    // handled by interceptor
  } finally {
    passwordLoading.value = false
  }
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
 */
function handleCommand(command) {
  switch (command) {
    case 'settings':
      router.push('/settings')
      break
    case 'password':
      passwordDialogVisible.value = true
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

/* ========== 左侧深色侧边栏 ========== */
.admin-aside {
  background-color: #1d1e2c;
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
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  user-select: none;
}

.logo-icon {
  font-size: 24px;
  margin-right: 8px;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  white-space: nowrap;
}

.admin-menu {
  border-right: none;
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
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.collapse-btn {
  cursor: pointer;
  color: #606266;
  transition: color 0.2s;
}

.collapse-btn:hover {
  color: #409eff;
}

.header-breadcrumb {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
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
  border-radius: 4px;
  transition: background-color 0.2s;
}

.admin-dropdown-link:hover {
  background-color: #f5f7fa;
}

.admin-name {
  font-size: 14px;
  color: #303133;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ========== 主内容区 ========== */
.admin-main {
  background-color: #f0f2f5;
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
  color: #303133;
  margin: 0 0 8px 0;
}

.logout-sub-text {
  font-size: 13px;
  color: #909399;
  margin: 0;
}
</style>
