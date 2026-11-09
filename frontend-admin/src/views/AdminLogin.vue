<!-- AdminLogin.vue - 管理员登录页：居中卡片式 -->
<template>
  <div class="login-page">
    <!-- 登录卡片 -->
    <div class="login-card">
      <!-- Logo 标题区 -->
      <div class="login-logo">
        <span class="logo-icon">🏮</span>
        <h1 class="logo-title">观锦阁</h1>
        <p class="logo-subtitle">管理后台</p>
      </div>

      <!-- 登录表单 -->
      <el-form
        ref="formRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        size="large"
        @keyup.enter="handleLogin"
      >
        <!-- 用户名 -->
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入管理员用户名"
            :prefix-icon="User"
            clearable
          />
        </el-form-item>

        <!-- 密码 -->
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <!-- 登录按钮 -->
        <el-form-item>
          <el-button
            type="primary"
            class="login-btn"
            :loading="loading"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登 录' }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 底部版权 -->
    <p class="login-footer">Copyright &copy; 2024 观锦阁 All Rights Reserved</p>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useAdminStore } from '@/stores/admin'

// 路由实例
const router = useRouter()
const route = useRoute()

// 管理员 Store
const adminStore = useAdminStore()

// 表单引用（用于表单验证）
const formRef = ref(null)

// 登录 loading 状态
const loading = ref(false)

// 登录表单数据
const loginForm = reactive({
  username: '',
  password: ''
})

// 表单验证规则
const loginRules = {
  username: [
    { required: true, message: '请输入管理员用户名', trigger: 'blur' },
    { min: 2, max: 30, message: '用户名长度为 2 到 30 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 30, message: '密码长度至少为 6 位', trigger: 'blur' }
  ]
}

/**
 * 登录页的错误提示：水平居中，显示在登录卡片上方的空白处。
 * Element Plus 的 ElMessage 默认只支持顶部/四角定位，所以用 customClass
 * 覆盖它的定位（样式见文件底部非 scoped 的 .login-msg-center）。
 *
 * 注意：ElMessage.error(msg, appContext) 的第二个参数是 appContext，不是配置项，
 * 想传配置必须写成 ElMessage({ message, type, ... }) 这一种形式。
 */
function showCenterError(message) {
  ElMessage({
    message,
    type: 'error',
    customClass: 'login-msg-center',
    duration: 2500,
    grouping: true // 连点登录按钮时同一条文案合并，不会叠一摞提示框
  })
}

/**
 * 处理登录
 * - 先进行表单验证
 * - 调用 store 的 login 方法
 * - 成功后跳转到目标页或dashboard
 * - 失败时由本页弹一个居中的错误提示（请求带 silent，拦截器不再重复弹）
 */
async function handleLogin() {
  // 防御：防止重复提交
  if (loading.value) return

  // 表单验证
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  // 开始登录
  loading.value = true
  try {
    await adminStore.login(loginForm.username, loginForm.password)
    ElMessage.success('登录成功，欢迎回来！')
    // 跳转：优先跳转到登录前的目标页，否则跳到仪表盘
    const redirect = route.query.redirect || '/dashboard'
    router.push(redirect)
  } catch (err) {
    // 后端文案（密码错误 / 管理员不存在 / 账号已被禁用）优先，网络类错误用兜底文案
    showCenterError(err?.userMessage || err?.response?.data?.message || '登录失败，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* ========== 登录页背景 ========== */
.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #3D2B1F 0%, #6B3410 50%, #3D2B1F 100%);
  position: relative;
  overflow: hidden;
}

/* 背景装饰圆 */
.login-page::before {
  content: '';
  position: absolute;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: rgba(212, 165, 116, 0.10);
  top: -100px;
  right: -100px;
}

.login-page::after {
  content: '';
  position: absolute;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: rgba(212, 165, 116, 0.08);
  bottom: -80px;
  left: -80px;
}

/* ========== 登录卡片 ========== */
.login-card {
  width: 400px;
  background: #ffffff;
  border-radius: var(--radius-large);
  padding: 48px 40px 32px;
  box-shadow: 0 20px 60px rgba(61, 43, 31, 0.35);
  z-index: 1;
}

/* Logo 区域 */
.login-logo {
  text-align: center;
  margin-bottom: 32px;
}

.logo-icon {
  font-size: 48px;
}

.logo-title {
  font-size: 26px;
  font-weight: 700;
  color: var(--color-primary);
  font-family: var(--font-family-serif);
  letter-spacing: 2px;
  margin: 8px 0 4px;
}

.logo-subtitle {
  font-size: 14px;
  color: var(--color-text-secondary);
}

/* 表单 */
.login-form {
  margin-top: 8px;
}

.login-btn {
  width: 100%;
  font-size: 16px;
  letter-spacing: 4px;
}

/* 底部版权 */
.login-footer {
  position: absolute;
  bottom: 24px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
  z-index: 1;
}
</style>

<!--
  非 scoped：ElMessage 是运行时插到 document.body 上的元素，
  scoped 样式（带 data-v-xxx 属性选择器）选不中它，必须写成全局样式。
  这里只选中登录页专属的 .login-msg-center，不影响后台其它页面的提示框。
-->
<style>
.el-message.login-msg-center {
  /* 组件内部把 top 写成内联样式（默认 16px），只能用 !important 覆盖。
     登录卡片本身是垂直居中的（高约 432px），这里再往上抬 276px，
     让提示框落在卡片上方的空白处：水平居中、不遮挡任何输入框。 */
  top: calc(50% - 276px) !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  margin: 0;
  min-width: 220px;
  justify-content: center;
}
</style>
