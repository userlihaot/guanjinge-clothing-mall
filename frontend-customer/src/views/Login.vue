<template>
  <div class="login-page">
    <div class="login-container">
      <!-- ==================== 左侧品牌展示区 ==================== -->
      <div class="login-left">
        <div class="brand-display">
          <div class="brand-logo">锦</div>
          <h1 class="brand-name">观锦阁</h1>
          <p class="brand-slogan">传承华夏之美，锦绣中华衣裳</p>
          <div class="brand-features">
            <div class="bf-item">
              <span class="bf-icon">&#xe600;</span>
              <span>手工刺绣工艺</span>
            </div>
            <div class="bf-item">
              <span class="bf-icon">&#xe601;</span>
              <span>真丝面料选材</span>
            </div>
            <div class="bf-item">
              <span class="bf-icon">&#xe602;</span>
              <span>量体定制服务</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== 右侧表单区域 ==================== -->
      <div class="login-right">
        <div class="form-container">
          <el-tabs v-model="activeTab" class="login-tabs" stretch>
            <!-- 密码登录 Tab -->
            <el-tab-pane label="密码登录" name="password">
              <el-form
                :model="loginForm"
                :rules="loginRules"
                ref="loginFormRef"
                size="default"
              >
                <el-form-item prop="mobile">
                  <el-input
                    v-model="loginForm.mobile"
                    placeholder="手机号或用户名"
                    :prefix-icon="Phone"
                    maxlength="30"
                  />
                </el-form-item>
                <el-form-item prop="password">
                  <el-input
                    v-model="loginForm.password"
                    type="password"
                    placeholder="请输入密码"
                    :prefix-icon="Lock"
                    show-password
                    @keyup.enter="handleLogin"
                  />
                </el-form-item>
                <el-form-item>
                  <el-button
                    type="primary"
                    size="large"
                    class="submit-btn"
                    :loading="loginLoading"
                    @click="handleLogin"
                  >
                    登录
                  </el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>

            <!-- 短信登录 Tab -->
            <el-tab-pane label="短信登录" name="sms">
              <el-form
                :model="smsForm"
                :rules="smsRules"
                ref="smsFormRef"
                size="default"
              >
                <el-form-item prop="mobile">
                  <el-input
                    v-model="smsForm.mobile"
                    placeholder="请输入手机号"
                    :prefix-icon="Phone"
                    maxlength="11"
                  />
                </el-form-item>
                <el-form-item prop="code">
                  <div class="sms-row">
                    <el-input
                      v-model="smsForm.code"
                      placeholder="请输入验证码"
                      :prefix-icon="Message"
                      maxlength="6"
                    />
                    <el-button
                      type="primary"
                      plain
                      :disabled="smsCountdown > 0"
                      @click="handleSendSms"
                      class="sms-btn"
                    >
                      {{ smsCountdown > 0 ? `${smsCountdown}s后重发` : '获取验证码' }}
                    </el-button>
                  </div>
                </el-form-item>
                <el-form-item>
                  <el-button
                    type="primary"
                    size="large"
                    class="submit-btn"
                    :loading="smsLoginLoading"
                    @click="handleSmsLogin"
                  >
                    登录
                  </el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>

            <!-- 注册 Tab -->
            <el-tab-pane label="注册" name="register">
              <el-form
                :model="registerForm"
                :rules="registerRules"
                ref="registerFormRef"
                size="default"
              >
                <el-form-item prop="username">
                  <el-input
                    v-model="registerForm.username"
                    placeholder="请输入用户名"
                    :prefix-icon="User"
                    maxlength="20"
                  />
                </el-form-item>
                <el-form-item prop="mobile">
                  <el-input
                    v-model="registerForm.mobile"
                    placeholder="请输入手机号"
                    :prefix-icon="Phone"
                    maxlength="11"
                  />
                </el-form-item>
                <el-form-item prop="password">
                  <el-input
                    v-model="registerForm.password"
                    type="password"
                    placeholder="请设置密码（6-20位）"
                    :prefix-icon="Lock"
                    show-password
                  />
                </el-form-item>
                <el-form-item prop="nickname">
                  <el-input
                    v-model="registerForm.nickname"
                    placeholder="请输入昵称（选填）"
                    :prefix-icon="UserFilled"
                    maxlength="20"
                  />
                </el-form-item>
                <el-form-item>
                  <el-button
                    type="primary"
                    size="large"
                    class="submit-btn"
                    :loading="registerLoading"
                    @click="handleRegister"
                  >
                    注册
                  </el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Phone, Lock, Message, User, UserFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { userApi } from '@/api'
import { setToken, setUser } from '@/utils/auth'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 当前激活的 Tab
const activeTab = ref('password')

// ========== 密码登录（同时支持用户和管理员） ==========
const loginFormRef = ref(null)
const loginLoading = ref(false)
const loginForm = reactive({ mobile: '', password: '' })

const loginRules = {
  mobile: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function handleLogin() {
  if (!loginForm.mobile || !loginForm.password) {
    ElMessage.warning('请填写账号和密码')
    return
  }

  loginLoading.value = true

  try {
    const res = await userApi.login({ mobile: loginForm.mobile, password: loginForm.password })
    loginLoading.value = false
    if (res && res.code === 200) {
      setToken(res.data.token)
      setUser({ id: res.data.userId, nickname: res.data.nickname, avatar: res.data.avatar })
      userStore.token = res.data.token
      userStore.userInfo = { id: res.data.userId, nickname: res.data.nickname, avatar: res.data.avatar }
      ElMessage.success('登录成功')
      router.push(route.query.redirect || '/')
      return
    }
    const msg = (res && res.message) || '用户名或密码错误'
    ElMessageBox.alert(msg, '登录失败', { confirmButtonText: '知道了', type: 'error', center: true })
  } catch (err) {
    loginLoading.value = false
    if (err && err.code === 'ERR_NETWORK') {
      ElMessageBox.alert('无法连接服务器，请确认后端服务已启动', '连接失败', { confirmButtonText: '知道了', type: 'error', center: true })
    } else {
      const msg = (err && err.message) || '登录失败，请重试'
      ElMessageBox.alert(msg, '登录失败', { confirmButtonText: '知道了', type: 'error', center: true })
    }
  }
}

// ========== 短信登录 ==========
const smsFormRef = ref(null)
const smsLoginLoading = ref(false)
const smsCountdown = ref(0) // 倒计时秒数
let countdownTimer = null
const smsForm = reactive({
  mobile: '',
  code: '',
})

const smsRules = {
  mobile: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1\d{10}$/, message: '手机号格式不正确', trigger: 'blur' },
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码为6位', trigger: 'blur' },
  ],
}

// 发送短信验证码
async function handleSendSms() {
  if (!smsForm.mobile || !/^1\d{10}$/.test(smsForm.mobile)) {
    ElMessage.warning('请输入正确的手机号')
    return
  }

  try {
    await userApi.sendSms(smsForm.mobile)
    ElMessage.success('验证码已发送至您的手机')
    // 启动60秒倒计时
    smsCountdown.value = 60
    countdownTimer = setInterval(() => {
      smsCountdown.value--
      if (smsCountdown.value <= 0) {
        clearInterval(countdownTimer)
        countdownTimer = null
      }
    }, 1000)
  } catch (error) {
    console.error('发送验证码失败:', error)
  }
}

// 短信验证码登录
async function handleSmsLogin() {
  const valid = await smsFormRef.value?.validate().catch(() => false)
  if (!valid) return

  smsLoginLoading.value = true
  try {
    await userStore.loginBySms({
      mobile: smsForm.mobile,
      code: smsForm.code,
    })
    ElMessage.success('登录成功')
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  } catch (error) {
    console.error('短信登录失败:', error)
  } finally {
    smsLoginLoading.value = false
  }
}

// ========== 注册 ==========
const registerFormRef = ref(null)
const registerLoading = ref(false)
const registerForm = reactive({
  username: '',
  mobile: '',
  password: '',
  nickname: '',
})

const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度为3-20位', trigger: 'blur' },
  ],
  mobile: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1\d{10}$/, message: '手机号格式不正确', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请设置密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度为6-20位', trigger: 'blur' },
  ],
}

// 注册处理
async function handleRegister() {
  const valid = await registerFormRef.value?.validate().catch(() => false)
  if (!valid) return

  registerLoading.value = true
  try {
    await userStore.register({
      username: registerForm.username,
      mobile: registerForm.mobile,
      password: registerForm.password,
      nickname: registerForm.nickname || registerForm.username,
    })
    ElMessage.success('注册成功，已自动登录')
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  } catch (error) {
    ElMessageBox.alert(error.message || '注册失败，请重试', '注册失败', { confirmButtonText: '知道了', type: 'error', center: true })
  } finally {
    registerLoading.value = false
  }
}
</script>

<style scoped>
/* ========== 整体布局 ========== */
.login-page {
  min-height: calc(100vh - 64px - 56px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #FFF8F0 0%, #FDF5ED 50%, #FFFDF9 100%);
  padding: var(--spacing-lg);
}

.login-container {
  display: flex;
  width: 900px;
  max-width: 100%;
  min-height: 520px;
  background: var(--color-bg-white);
  border-radius: var(--radius-large);
  overflow: hidden;
  box-shadow: var(--shadow-heavy);
}

/* ========== 左侧品牌展示 ========== */
.login-left {
  width: 42%;
  background: linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 50%, var(--color-accent-dark) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  padding: var(--spacing-xl);
}

.brand-display {
  text-align: center;
}

.brand-logo {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.15);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-family-serif);
  font-size: 36px;
  font-weight: bold;
  margin: 0 auto var(--spacing-lg);
  backdrop-filter: blur(4px);
}

.brand-name {
  font-family: var(--font-family-serif);
  font-size: 32px;
  margin-bottom: var(--spacing-sm);
  letter-spacing: 6px;
}

.brand-slogan {
  font-size: 14px;
  opacity: 0.85;
  margin-bottom: var(--spacing-xxl);
  letter-spacing: 2px;
}

.brand-features {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.bf-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 13px;
  opacity: 0.9;
}

.bf-icon {
  font-size: 18px;
}

/* ========== 右侧表单 ========== */
.login-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
}

.form-container {
  width: 100%;
  max-width: 340px;
}

.login-tabs :deep(.el-tabs__item) {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.login-tabs :deep(.el-tabs__item.is-active) {
  color: var(--color-primary);
  font-weight: 600;
}

/* 短信验证码行 */
.sms-row {
  display: flex;
  gap: var(--spacing-sm);
}

.sms-row .el-input {
  flex: 1;
}

.sms-btn {
  width: 130px;
  flex-shrink: 0;
  white-space: nowrap;
}

/* 提交按钮 */
.submit-btn {
  width: 100%;
  font-size: 16px;
  letter-spacing: 2px;
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .login-container {
    flex-direction: column;
    width: 100%;
  }

  .login-left {
    width: 100%;
    padding: var(--spacing-lg);
    min-height: auto;
  }

  .brand-logo {
    width: 56px;
    height: 56px;
    font-size: 28px;
    margin-bottom: var(--spacing-md);
  }

  .brand-name {
    font-size: 24px;
    margin-bottom: var(--spacing-xs);
  }

  .brand-features {
    display: none;
  }

  .login-right {
    padding: var(--spacing-lg);
  }
}
</style>
