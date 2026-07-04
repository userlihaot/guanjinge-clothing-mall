<template>
  <el-config-provider :locale="zhCn">
    <!-- 管理员页面：侧边栏 + 顶栏布局 -->
    <div v-if="isAdminRoute" class="admin-shell">
      <!-- 侧边栏 -->
      <aside class="admin-side">
        <div class="admin-logo" @click="$router.push('/')">观锦阁<span>管理</span></div>
        <nav class="admin-nav">
          <router-link to="/admin" class="amenu" :class="{on:$route.path==='/admin'}">📊 数据统计</router-link>
          <router-link to="/admin/categories" class="amenu" :class="{on:$route.path==='/admin/categories'}">📂 分类管理</router-link>
          <router-link to="/admin/products" class="amenu" :class="{on:$route.path==='/admin/products'}">🛍️ 商品管理</router-link>
          <router-link to="/admin/orders" class="amenu" :class="{on:$route.path==='/admin/orders'}">📋 订单管理</router-link>
          <router-link to="/admin/users" class="amenu" :class="{on:$route.path==='/admin/users'}">👥 用户管理</router-link>
          <router-link to="/admin/coupons" class="amenu" :class="{on:$route.path==='/admin/coupons'}">🎫 优惠券</router-link>
          <router-link to="/admin/banners" class="amenu" :class="{on:$route.path==='/admin/banners'}">🖼️ 轮播图</router-link>
          <router-link to="/admin/reviews" class="amenu" :class="{on:$route.path==='/admin/reviews'}">⭐ 评价审核</router-link>
          <router-link to="/admin/refunds" class="amenu" :class="{on:$route.path==='/admin/refunds'}">💰 退款处理</router-link>
          <router-link to="/admin/settings" class="amenu" :class="{on:$route.path==='/admin/settings'}">⚙️ 系统设置</router-link>
        </nav>
        <div class="admin-side-bottom">
          <a href="/" class="back-to-shop">🏠 返回商城</a>
        </div>
      </aside>

      <!-- 右侧区域：顶栏 + 内容 -->
      <div class="admin-right">
        <!-- 管理员顶栏 -->
        <header class="admin-topbar">
          <div class="admin-topbar-left">
            <span class="topbar-breadcrumb">{{ pageTitle }}</span>
          </div>
          <div class="admin-topbar-right">
            <!-- 管理员下拉菜单 -->
            <el-dropdown
              trigger="click"
              popper-class="admin-dropdown-popper"
              @command="handleAdminCommand"
              @visible-change="onDropVisibleChange"
            >
              <span class="admin-user-trigger" :class="{ 'is-open': dropOpen }">
                <el-avatar :size="34" class="admin-avatar-circle">
                  {{ adminDisplayName.charAt(0) }}
                </el-avatar>
                <span class="admin-display-name">{{ adminDisplayName }}</span>
                <el-icon class="admin-dropdown-arrow" :class="{ 'is-rotated': dropOpen }">
                  <ArrowDown />
                </el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu class="admin-drop-menu">
                  <el-dropdown-item command="changePwd" class="admin-drop-item">
                    <div class="drop-item-inner">
                      <span class="drop-item-icon drop-item-icon--pwd">
                        <el-icon><Lock /></el-icon>
                      </span>
                      <div class="drop-item-text">
                        <span class="drop-item-title">修改密码</span>
                        <span class="drop-item-desc">更新管理员登录密码</span>
                      </div>
                    </div>
                  </el-dropdown-item>
                  <el-dropdown-item command="logout" divided class="admin-drop-item">
                    <div class="drop-item-inner">
                      <span class="drop-item-icon drop-item-icon--logout">
                        <el-icon><SwitchButton /></el-icon>
                      </span>
                      <div class="drop-item-text">
                        <span class="drop-item-title">退出登入</span>
                        <span class="drop-item-desc">安全退出管理后台</span>
                      </div>
                    </div>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </header>

        <!-- 主内容区 -->
        <main class="admin-main">
          <router-view />
        </main>
      </div>
    </div>

    <!-- 用户端页面：顶部导航 + 内容 + 页脚 -->
    <template v-else>
      <AppHeader />
      <main class="main-container">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
      <AppFooter />
    </template>

    <!-- ========== 修改密码弹窗 ========== -->
    <el-dialog
      v-model="showChangePwdDialog"
      width="480px"
      :close-on-click-modal="false"
      :show-close="true"
      destroy-on-close
      class="styled-dialog pwd-dialog"
      align-center
    >
      <!-- 自定义标题栏 -->
      <template #header>
        <div class="dialog-custom-header">
          <span class="dialog-header-icon">🔐</span>
          <span class="dialog-header-title">修改管理员密码</span>
        </div>
        <p class="dialog-header-sub">为保障账户安全，请定期更换密码</p>
      </template>

      <el-form
        ref="pwdFormRef"
        :model="pwdForm"
        :rules="pwdFormRules"
        label-position="top"
        size="default"
        class="pwd-form"
      >
        <el-form-item label="原密码" prop="oldPassword">
          <el-input
            v-model="pwdForm.oldPassword"
            type="password"
            placeholder="请输入当前使用的密码"
            show-password
            :prefix-icon="Lock"
            class="styled-input"
          />
        </el-form-item>

        <div class="form-divider">
          <span class="divider-line"></span>
          <span class="divider-text">设置新密码</span>
          <span class="divider-line"></span>
        </div>

        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="pwdForm.newPassword"
            type="password"
            placeholder="6-20位字母、数字或符号"
            show-password
            :prefix-icon="Lock"
            class="styled-input"
            @input="checkPwdStrength"
          />
          <!-- 密码强度指示 -->
          <div v-if="pwdForm.newPassword" class="pwd-strength">
            <div class="strength-bars">
              <span
                v-for="i in 3"
                :key="i"
                class="strength-bar"
                :class="strengthBarClass(i)"
              ></span>
            </div>
            <span class="strength-text" :class="strengthTextClass">{{ strengthLabel }}</span>
          </div>
        </el-form-item>

        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input
            v-model="pwdForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
            :prefix-icon="Lock"
            class="styled-input"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button
            class="btn-cancel"
            @click="showChangePwdDialog = false"
            round
          >取 消</el-button>
          <el-button
            type="primary"
            class="btn-confirm"
            :loading="pwdChanging"
            @click="handleChangePwdSubmit"
            round
          >
            <span v-if="!pwdChanging">确认修改</span>
            <span v-else>修改中...</span>
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ========== 退出登入确认弹窗 ========== -->
    <el-dialog
      v-model="showLogoutDialog"
      width="420px"
      :close-on-click-modal="false"
      :show-close="true"
      class="styled-dialog logout-dialog"
      align-center
    >
      <div class="logout-body">
        <!-- 警告图标 -->
        <div class="logout-icon-wrap">
          <div class="logout-icon-inner">
            <span class="logout-icon">!</span>
          </div>
        </div>

        <!-- 标题 -->
        <h3 class="logout-title">确认退出管理后台？</h3>

        <!-- 描述 -->
        <p class="logout-desc">
          退出后需要重新输入账号密码才能登录，<br />
          确定要结束当前管理会话吗？
        </p>
      </div>

      <template #footer>
        <div class="dialog-footer logout-footer">
          <el-button
            class="btn-cancel"
            @click="showLogoutDialog = false"
            round
          >暂不退出</el-button>
          <el-button
            type="danger"
            class="btn-danger-confirm"
            :loading="logoutPending"
            @click="confirmLogout"
            round
          >
            确认退出
          </el-button>
        </div>
      </template>
    </el-dialog>
  </el-config-provider>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Lock, ArrowDown, SwitchButton } from '@element-plus/icons-vue'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import AppHeader from '@/components/common/AppHeader.vue'
import AppFooter from '@/components/common/AppFooter.vue'
import { getAdminInfo } from '@/utils/auth'
import { adminApi } from '@/api'

const route = useRoute()
const router = useRouter()
const isAdminRoute = computed(() => route.path.startsWith('/admin') && route.path !== '/admin/login')

// ============ 管理员名称 ============
const adminDisplayName = computed(() => {
  const info = getAdminInfo()
  return (info && (info.nickname || info.username)) || '管理员'
})

// ============ 页面标题 ============
const pageTitle = computed(() => {
  const titleMap = {
    '/admin': '📊 数据统计概览',
    '/admin/categories': '📂 分类管理',
    '/admin/products': '🛍️ 商品管理',
    '/admin/orders': '📋 订单管理',
    '/admin/users': '👥 用户管理',
    '/admin/coupons': '🎫 优惠券管理',
    '/admin/banners': '🖼️ 轮播图管理',
    '/admin/reviews': '⭐ 评价审核',
    '/admin/refunds': '💰 退款处理',
    '/admin/settings': '⚙️ 系统设置',
  }
  return titleMap[route.path] || '管理后台'
})

// ============ 管理员下拉菜单 ============
const dropOpen = ref(false)

function onDropVisibleChange(visible) {
  dropOpen.value = visible
}

function handleAdminCommand(command) {
  if (command === 'changePwd') {
    openChangePwdDialog()
  } else if (command === 'logout') {
    showLogoutDialog.value = true
  }
}

// ============ 退出登入 ============
const showLogoutDialog = ref(false)
const logoutPending = ref(false)

function confirmLogout() {
  logoutPending.value = true
  // 短暂延迟让用户看到 loading 状态
  setTimeout(() => {
    adminLogout()
    logoutPending.value = false
  }, 400)
}

function adminLogout() {
  localStorage.removeItem('guanjinge_admin_token')
  localStorage.removeItem('guanjinge_admin_info')
  localStorage.removeItem('admin-store')
  localStorage.removeItem('admin_token')
  localStorage.removeItem('admin_info')
  ElMessage.success('已退出管理后台')
  router.push('/admin/login')
}

// ============ 修改密码弹窗 ============
const showChangePwdDialog = ref(false)
const pwdChanging = ref(false)
const pwdFormRef = ref(null)

const pwdForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

// 密码强度
const pwdStrength = ref(0) // 0:无, 1:弱, 2:中, 3:强

function checkPwdStrength() {
  const val = pwdForm.newPassword
  if (!val) { pwdStrength.value = 0; return }
  let score = 0
  if (val.length >= 6) score++
  if (/[a-zA-Z]/.test(val) && /[0-9]/.test(val)) score++
  if (/[^a-zA-Z0-9一-龥]/.test(val)) score++
  pwdStrength.value = score
}

const strengthLabel = computed(() => {
  const map = { 0: '', 1: '强度：弱', 2: '强度：中等', 3: '强度：强' }
  return map[pwdStrength.value] || ''
})

const strengthTextClass = computed(() => ({
  'text-weak': pwdStrength.value === 1,
  'text-medium': pwdStrength.value === 2,
  'text-strong': pwdStrength.value === 3,
}))

function strengthBarClass(i) {
  if (pwdStrength.value === 0) return ''
  if (i <= pwdStrength.value) {
    return pwdStrength.value === 1 ? 'bar-weak' : pwdStrength.value === 2 ? 'bar-medium' : 'bar-strong'
  }
  return ''
}

// 自定义验证：确认密码一致
const validateConfirmPwd = (_rule, value, callback) => {
  if (!value) {
    callback(new Error('请再次输入新密码'))
  } else if (value !== pwdForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const pwdFormRules = {
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' },
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度为 6 到 20 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirmPwd, trigger: 'blur' },
  ],
}

function openChangePwdDialog() {
  pwdForm.oldPassword = ''
  pwdForm.newPassword = ''
  pwdForm.confirmPassword = ''
  // 清除表单验证状态
  setTimeout(() => {
    pwdFormRef.value?.clearValidate()
  }, 0)
  showChangePwdDialog.value = true
}

async function handleChangePwdSubmit() {
  const valid = await pwdFormRef.value?.validate().catch(() => false)
  if (!valid) return

  pwdChanging.value = true
  try {
    const res = await adminApi.changePassword({
      oldPassword: pwdForm.oldPassword,
      newPassword: pwdForm.newPassword,
    })
    if (res && res.code === 200) {
      ElMessage.success('密码修改成功，请重新登录')
      showChangePwdDialog.value = false
      // 修改成功后自动退出，让管理员重新登录
      setTimeout(() => {
        adminLogout()
      }, 1000)
    } else {
      ElMessage.error((res && res.message) || '密码修改失败')
    }
  } catch (err) {
    ElMessage.error(err?.response?.data?.message || err?.message || '密码修改失败，请稍后再试')
  } finally {
    pwdChanging.value = false
  }
}
</script>

<style>
.main-container { min-height: calc(100vh - 140px); background: var(--color-bg-primary, #FFF8F0) }

/* ============================================
   管理后台整体布局
   ============================================ */
.admin-shell {
  display: flex;
  min-height: 100vh;
  background: #f5f0eb;
}

/* ========== 侧边栏 ========== */
.admin-side {
  width: 180px;
  background: linear-gradient(180deg, #3C2415, #5D4037);
  color: #fff;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.admin-logo {
  padding: 18px 16px;
  font-size: 18px;
  color: #D4A574;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, .1);
  letter-spacing: 2px;
  flex-shrink: 0;
}

.admin-logo span {
  font-size: 11px;
  color: #999;
  margin-left: 4px;
}

.admin-nav {
  flex: 1;
  overflow-y: auto;
}

.amenu {
  display: block;
  padding: 12px 16px;
  color: #ccc;
  font-size: 14px;
  text-decoration: none;
  transition: .2s;
}

.amenu:hover,
.amenu.on {
  background: rgba(212, 165, 116, .15);
  color: #D4A574;
}

.admin-side-bottom {
  padding: 14px 16px;
  border-top: 1px solid rgba(255, 255, 255, .1);
  flex-shrink: 0;
}

.back-to-shop {
  display: block;
  color: #aaa;
  font-size: 13px;
  text-decoration: none;
  padding: 6px 0;
  transition: color .2s;
}

.back-to-shop:hover {
  color: #D4A574;
}

/* ========== 右侧区域 ========== */
.admin-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* ========== 管理员顶栏 ========== */
.admin-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  padding: 0 20px;
  background: #fff;
  border-bottom: 1px solid #f0e8dc;
  box-shadow: 0 1px 6px rgba(139, 69, 19, 0.06);
  flex-shrink: 0;
}

.admin-topbar-left {
  display: flex;
  align-items: center;
}

.topbar-breadcrumb {
  font-size: 14px;
  color: #5C4033;
  font-weight: 500;
}

.admin-topbar-right {
  display: flex;
  align-items: center;
}

/* 管理员下拉触发器 */
.admin-user-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background .2s;
  user-select: none;
}

.admin-user-trigger:hover {
  background: rgba(139, 69, 19, 0.06);
}

/* 下拉菜单展开时触发器高亮 */
.admin-user-trigger.is-open {
  background: rgba(139, 69, 19, 0.08);
}

.admin-avatar-circle {
  background: linear-gradient(135deg, #8B4513, #D4A574);
  color: #fff;
  font-weight: 600;
  font-size: 15px;
  flex-shrink: 0;
}

.admin-display-name {
  font-size: 14px;
  color: #3C2415;
  font-weight: 500;
}

.admin-dropdown-arrow {
  color: #999;
  font-size: 12px;
  transition: transform .25s ease;
}

.admin-dropdown-arrow.is-rotated {
  transform: rotate(180deg);
  color: #8B4513;
}

/* ========== 主内容区 ========== */
.admin-main {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: #f5f0eb;
}

/* ============================================
   下拉菜单面板 (全局 — popper 挂载在 body)
   ============================================ */
.admin-dropdown-popper {
  margin-top: 6px !important;
}

.admin-dropdown-popper .el-dropdown-menu {
  padding: 6px;
  border-radius: 12px;
  border: 1px solid #F0E8DC;
  box-shadow: 0 8px 32px rgba(60, 36, 21, 0.12);
  background: #fff;
  min-width: 200px;
}

.admin-dropdown-popper .el-dropdown-menu__item {
  padding: 0;
  border-radius: 8px;
  margin: 2px 0;
  transition: background .2s;
}

.admin-dropdown-popper .el-dropdown-menu__item:hover {
  background: #FDF5ED;
}

/* 下拉项内布局 */
.drop-item-inner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  width: 100%;
}

/* 图标容器 */
.drop-item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  font-size: 16px;
  flex-shrink: 0;
}

.drop-item-icon--pwd {
  background: rgba(139, 69, 19, 0.08);
  color: #8B4513;
}

.drop-item-icon--logout {
  background: rgba(192, 57, 43, 0.08);
  color: #C0392B;
}

/* 文字区域 */
.drop-item-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.drop-item-title {
  font-size: 14px;
  font-weight: 500;
  color: #3C2415;
  line-height: 1.3;
}

.drop-item-desc {
  font-size: 11px;
  color: #BFA98A;
  line-height: 1.2;
}

/* ============================================
   通用弹窗样式 (修改密码 / 退出登入)
   ============================================ */

/* --- 弹窗容器基础 --- */
.styled-dialog :deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 12px 48px rgba(60, 36, 21, 0.18);
}

/* --- 统一弹窗头部 --- */
.styled-dialog :deep(.el-dialog__header) {
  padding: 0;
  margin: 0;
  border-bottom: none;
  position: relative;
}

.styled-dialog :deep(.el-dialog__headerbtn) {
  top: 18px;
  right: 18px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  transition: background .2s;
}

.styled-dialog :deep(.el-dialog__headerbtn:hover) {
  background: rgba(139, 69, 19, 0.08);
}

.styled-dialog :deep(.el-dialog__headerbtn .el-dialog__close) {
  color: #8B7355;
  font-size: 16px;
}

.styled-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.styled-dialog :deep(.el-dialog__footer) {
  padding: 0;
}

/* --- 自定义标题 --- */
.dialog-custom-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 28px 28px 6px 28px;
}

.dialog-header-icon {
  font-size: 24px;
  line-height: 1;
}

.dialog-header-title {
  font-size: 18px;
  font-weight: 700;
  color: #3C2415;
  letter-spacing: 1px;
}

.dialog-header-sub {
  margin: 6px 0 0 28px;
  padding-right: 28px;
  font-size: 13px;
  color: #BFA98A;
  line-height: 1.6;
  padding-bottom: 18px;
  border-bottom: 1px solid #F0E8DC;
}

/* ========== 修改密码弹窗 ========== */
.pwd-form {
  padding: 20px 28px 0;
}

.pwd-form :deep(.el-form-item) {
  margin-bottom: 16px;
}

.pwd-form :deep(.el-form-item__label) {
  color: #5C4033;
  font-weight: 500;
  font-size: 13px;
  padding-bottom: 4px;
}

/* 输入框统一样式 */
.styled-input :deep(.el-input__wrapper) {
  border-radius: 10px;
  background: #FFFDF9;
  border: 1px solid #E8D5C0;
  box-shadow: none;
  transition: all .3s;
  padding: 0 12px;
}

.styled-input :deep(.el-input__wrapper:hover) {
  border-color: #D4A574;
  background: #fff;
}

.styled-input :deep(.el-input__wrapper.is-focus) {
  border-color: #8B4513;
  box-shadow: 0 0 0 3px rgba(139, 69, 19, 0.06);
  background: #fff;
}

.styled-input :deep(.el-input__inner) {
  color: #3C2415;
  font-size: 14px;
}

.styled-input :deep(.el-input__inner::placeholder) {
  color: #C4B49A;
}

.styled-input :deep(.el-input__prefix-inner) {
  color: #BFA98A;
}

/* --- 表单分隔线 --- */
.form-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 4px 0 16px;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: #F0E8DC;
}

.divider-text {
  font-size: 12px;
  color: #BFA98A;
  letter-spacing: 1px;
  white-space: nowrap;
}

/* --- 密码强度指示 --- */
.pwd-strength {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}

.strength-bars {
  display: flex;
  gap: 5px;
}

.strength-bar {
  width: 40px;
  height: 4px;
  border-radius: 2px;
  background: #F0E8DC;
  transition: background .3s;
}

.strength-bar.bar-weak { background: #E6A23C; }
.strength-bar.bar-medium { background: #D4A574; }
.strength-bar.bar-strong { background: #6B8E23; }

.strength-text {
  font-size: 12px;
  font-weight: 500;
}

.strength-text.text-weak { color: #E6A23C; }
.strength-text.text-medium { color: #D4A574; }
.strength-text.text-strong { color: #6B8E23; }

/* ========== 退出登入弹窗 ========== */
.logout-body {
  text-align: center;
  padding: 32px 28px 4px;
}

/* 警告图标容器 */
.logout-icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(230, 162, 60, 0.1);
  margin-bottom: 20px;
}

.logout-icon-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, #E6A23C, #F0C06A);
  box-shadow: 0 4px 16px rgba(230, 162, 60, 0.3);
}

.logout-icon {
  font-size: 28px;
  font-weight: 800;
  color: #fff;
  line-height: 1;
  font-family: var(--font-family-serif, serif);
}

.logout-title {
  font-size: 18px;
  font-weight: 700;
  color: #3C2415;
  margin: 0 0 10px;
  letter-spacing: 1px;
}

.logout-desc {
  font-size: 14px;
  color: #8B7355;
  line-height: 1.8;
  margin: 0;
}

/* ========== 弹窗底部按钮 ========== */
.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 24px 28px 28px;
}

.logout-footer {
  padding-top: 8px;
}

/* 取消按钮 */
.btn-cancel {
  min-width: 110px;
  height: 40px;
  font-size: 14px;
  color: #8B7355;
  background: #FDF5ED;
  border: 1px solid #E8D5C0;
  letter-spacing: 1px;
  transition: all .3s;
}

.btn-cancel:hover {
  color: #5C4033;
  background: #F5E8D8;
  border-color: #D4A574;
}

/* 确认按钮 */
.btn-confirm {
  min-width: 130px;
  height: 40px;
  font-size: 14px;
  letter-spacing: 1px;
}

/* 危险确认按钮 (退出) */
.btn-danger-confirm {
  min-width: 130px;
  height: 40px;
  font-size: 14px;
  letter-spacing: 1px;
  background: linear-gradient(135deg, #C0392B, #D4756B);
  border: none;
}

.btn-danger-confirm:hover {
  background: linear-gradient(135deg, #A93226, #C0392B);
}

/* ========== 过渡动画 ========== */
.fade-enter-active,
.fade-leave-active {
  transition: opacity .2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .admin-side {
    width: 60px;
  }

  .admin-logo {
    font-size: 14px;
    padding: 14px 8px;
    text-align: center;
  }

  .admin-logo span {
    display: none;
  }

  .amenu {
    padding: 12px 8px;
    font-size: 18px;
    text-align: center;
  }

  .amenu::after {
    content: '';
  }

  .back-to-shop {
    text-align: center;
    font-size: 16px;
  }
}
</style>
