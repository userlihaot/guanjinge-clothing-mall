import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { setToken, removeToken, setUser, removeUser } from '@/utils/auth'
import { userApi } from '@/api'

// ============================================
// 用户状态管理 Store
// 管理用户登录状态、Token、用户信息
// ============================================
export const useUserStore = defineStore(
  'user',
  () => {
    // ========== 状态 ==========
    // JWT 令牌
    const token = ref('')
    // 用户信息对象
    const userInfo = ref(null)

    // ========== 计算属性 ==========
    // 是否已登录
    const isLoggedIn = computed(() => !!token.value)
    // 用户昵称
    const nickname = computed(() => userInfo.value?.nickname || userInfo.value?.username || '用户')
    // 用户头像
    const avatar = computed(() => userInfo.value?.avatar || '')
    // 用户ID
    const userId = computed(() => userInfo.value?.id || null)

    // ========== 方法 ==========
    /**
     * 登录操作
     * @param {Object} loginData - 登录表单数据 { mobile, password }
     * @returns {Promise} API 返回的 data
     */
    async function login(loginData) {
      const res = await userApi.login(loginData)
      // 后端返回: { code:200, data:{ token, userId, nickname, avatar } }
      const data = (res && res.data) || res || {}
      if (res.code !== 200 && (!data || !data.token)) throw new Error(res.message || '登录失败')
      token.value = data.token
      userInfo.value = { id: data.userId, nickname: data.nickname, avatar: data.avatar }
      setToken(token.value)
      setUser(userInfo.value)
      return data
    }

    async function loginBySms(loginData) {
      const res = await userApi.smsLogin(loginData)
      const data = (res && res.data) || res || {}
      if (res.code !== 200 && (!data || !data.token)) throw new Error(res.message || '登录失败')
      token.value = data.token
      userInfo.value = { id: data.userId, nickname: data.nickname, avatar: data.avatar }
      setToken(token.value)
      setUser(userInfo.value)
      return data
    }

    async function register(registerData) {
      const res = await userApi.register(registerData)
      const data = (res && res.data) || res || {}
      if (res.code !== 200 && (!data || !data.token)) throw new Error(res.message || '注册失败')
      token.value = data.token
      userInfo.value = data.user || { id: data.userId, nickname: data.nickname, avatar: data.avatar }
      setToken(token.value)
      setUser(userInfo.value)
      return data
    }

    /**
     * 退出登录
     * 清除本地 token 和用户信息
     */
    function logout() {
      token.value = ''
      userInfo.value = null
      removeToken()
      removeUser()
    }

    /**
     * 刷新用户信息
     * 从后端获取最新的用户资料
     */
    async function fetchUserInfo() {
      try {
        const res = await userApi.getUserInfo()
        const data = res.data || res
        userInfo.value = data
        setUser(data)
      } catch (error) {
        console.error('获取用户信息失败:', error)
      }
    }

    /**
     * 更新用户信息
     * @param {Object} formData - 要更新的用户资料
     */
    async function updateUserInfo(formData) {
      const res = await userApi.updateUserInfo(formData)
      const data = res.data || res
      userInfo.value = { ...userInfo.value, ...data }
      setUser(userInfo.value)
    }

    /**
     * 修改密码
     * @param {Object} passwordData - { oldPassword, newPassword }
     */
    async function changePassword(passwordData) {
      const res = await userApi.changePassword(passwordData)
      return res.data || res
    }

    return {
      token,
      userInfo,
      isLoggedIn,
      nickname,
      avatar,
      userId,
      login,
      loginBySms,
      register,
      logout,
      fetchUserInfo,
      updateUserInfo,
      changePassword,
    }
  },
  {
    // 持久化配置：将 token 和 userInfo 保存到 localStorage
    persist: {
      key: 'guanjinge-user-store',
      storage: localStorage,
      pick: ['token', 'userInfo'], // 只持久化这两个字段
    },
  }
)
