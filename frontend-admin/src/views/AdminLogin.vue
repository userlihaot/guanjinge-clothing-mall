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
 * 处理登录
 * - 先进行表单验证
 * - 调用 store 的 login 方法
 * - 成功后跳转到目标页或dashboard
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
    const success = await adminStore.login(loginForm.username, loginForm.password)
    if (success) {
      ElMessage.success('登录成功，欢迎回来！')
      // 跳转：优先跳转到登录前的目标页，否则跳到仪表盘
      const redirect = route.query.redirect || '/dashboard'
      router.push(redirect)
    } else {
      ElMessage.error('用户名或密码错误')
    }
  } catch {
    // 错误已由 request.js 拦截器统一处理
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
  /* 渐变背景 */
  background: linear-gradient(135deg, #1d1e2c 0%, #2d3a4b 50%, #1d1e2c 100%);
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
  background: rgba(64, 158, 255, 0.08);
  top: -100px;
  right: -100px;
}

.login-page::after {
  content: '';
  position: absolute;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: rgba(64, 158, 255, 0.06);
  bottom: -80px;
  left: -80px;
}

/* ========== 登录卡片 ========== */
.login-card {
  width: 400px;
  background: #ffffff;
  border-radius: 12px;
  padding: 48px 40px 32px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
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
  color: #303133;
  margin: 8px 0 4px;
}

.logo-subtitle {
  font-size: 14px;
  color: #909399;
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
