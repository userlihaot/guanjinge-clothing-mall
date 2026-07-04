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
import { adminApi } from '@/api'
import { setAdminToken, setAdminInfo } from '@/utils/auth'

// 路由实例
const router = useRouter()
const route = useRoute()

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
 * 处理登录 - 直接调用 API 绕过 store，便于排查问题
 */
async function handleLogin() {
  if (loading.value) return

  // 手动校验
  if (!loginForm.username) { ElMessage.warning('请输入管理员用户名'); return }
  if (!loginForm.password) { ElMessage.warning('请输入密码'); return }

  loading.value = true
  try {
    console.log('正在登录管理员:', loginForm.username)
    const res = await adminApi.login({ username: loginForm.username, password: loginForm.password })
    console.log('管理员登录 API 返回:', JSON.stringify(res))
    if (res && res.code === 200 && res.data && res.data.token) {
      setAdminToken(res.data.token)
      setAdminInfo({ username: res.data.nickname || '管理员', nickname: res.data.nickname || '管理员', role: res.data.role })
      ElMessage.success('登录成功，欢迎回来！')
      router.push('/admin')
    } else {
      const msg = (res && res.message) || '登录失败'
      console.error('登录失败:', msg, res)
      ElMessage.error(msg)
    }
  } catch (err) {
    console.error('管理员登录异常:', err)
    console.error('异常详情:', err?.response?.status, err?.response?.data)
    ElMessage.error(err?.response?.data?.message || err?.message || '登录失败，请检查账号密码')
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
