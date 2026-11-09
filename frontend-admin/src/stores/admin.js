// src/stores/admin.js - 管理员状态管理 (Pinia Store)
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getAdminToken, setAdminToken, removeAdminToken, getAdminInfo, setAdminInfo } from '@/utils/auth'
import { adminApi } from '@/api'

export const useAdminStore = defineStore(
  'admin',
  () => {
    const token = ref(getAdminToken() || '')
    const adminInfo = ref(getAdminInfo() || { username: '管理员', avatar: '' })

    const isLoggedIn = computed(() => !!token.value)
    const username = computed(() => adminInfo.value?.username || '管理员')
    const avatar = computed(() => adminInfo.value?.avatar || '')

    async function login(username, password) {
      try {
        const res = await adminApi.login(username, password)
        if (res.code === 200 && res.data && res.data.token) {
          token.value = res.data.token
          setAdminToken(res.data.token)
          adminInfo.value = {
            username: res.data.nickname || username,
            nickname: res.data.nickname || '管理员',
            role: res.data.role || 'admin'
          }
          setAdminInfo(adminInfo.value)
          return true
        }
        // 兜底：业务失败但拦截器没 reject 的情况
        const error = new Error((res && res.message) || '登录失败')
        error.userMessage = error.message
        throw error
      } catch (err) {
        // 抛给登录页：由页面统一弹一个居中的提示框，避免同一处失败弹两个框
        console.error('管理员登录异常:', err)
        throw err
      }
    }

    function logout() {
      token.value = ''
      adminInfo.value = { username: '', avatar: '' }
      removeAdminToken()
    }

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

    return { token, adminInfo, isLoggedIn, username, avatar, login, logout, fetchAdminInfo }
  },
  {
    persist: {
      key: 'admin-store',
      pick: ['token', 'adminInfo']
    }
  }
)
