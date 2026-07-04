// src/stores/admin.js - 管理员状态管理 (Pinia Store)
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getAdminToken, setAdminToken, removeAdminToken, getAdminInfo, setAdminInfo } from '@/utils/auth'
import { adminApi } from '@/api'

/**
 * 管理员 Store
 * 使用 Composition API 风格 (Setup Store)
 * 持久化：token 和 info 通过 auth.js 手动管理 localStorage
 */
export const useAdminStore = defineStore(
  'admin',
  () => {
    // ============ 状态 ============

    // 管理员 token
    const token = ref(getAdminToken() || '')

    // 管理员信息 (用户名、头像等)
    const adminInfo = ref(getAdminInfo() || { username: '管理员', avatar: '' })

    // ============ 计算属性 ============

    // 是否已登录
    const isLoggedIn = computed(() => !!token.value)

    // 管理员用户名
    const username = computed(() => adminInfo.value?.username || '管理员')

    // 管理员头像
    const avatar = computed(() => adminInfo.value?.avatar || '')

    // ============ 方法 ============

    /**
     * 管理员登录
     * @param {string} username - 用户名
     * @param {string} password - 密码
     * @returns {Promise<boolean>} 登录是否成功
     */
    async function login(username, password) {
      const res = await adminApi.login({ username, password })
      if (res.code === 200 && res.data && res.data.token) {
        token.value = res.data.token
        setAdminToken(res.data.token)
        adminInfo.value = {
          username: res.data.nickname || '管理员',
          nickname: res.data.nickname || '管理员',
          role: res.data.role || 'admin'
        }
        setAdminInfo(adminInfo.value)
        return true
      } else {
        throw new Error((res && res.message) || '登录失败，请检查账号密码')
      }
    }

    /**
     * 退出登录
     */
    function logout() {
      // 清除状态
      token.value = ''
      adminInfo.value = { username: '', avatar: '' }
      // 清除本地存储
      removeAdminToken()
    }

    /**
     * 获取当前管理员信息（从后端刷新）
     * @returns {Promise<object|null>}
     */
    async function fetchAdminInfo() {
      try {
        const res = await adminApi.getAdminInfo()
        if (res.code === 200) {
          adminInfo.value = res.data
          setAdminInfo(res.data)
          return res.data
        }
        return null
      } catch {
        return null
      }
    }

    return {
      // 状态
      token,
      adminInfo,
      // 计算属性
      isLoggedIn,
      username,
      avatar,
      // 方法
      login,
      logout,
      fetchAdminInfo
    }
  },
  {
    // Pinia 持久化插件：自动将 store 数据存储到 localStorage
    persist: {
      key: 'admin-store',
      // 指定要持久化的字段
      pick: ['token', 'adminInfo']
    }
  }
)
