// src/stores/admin.js - 管理员状态管理 (Pinia Store)
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getAdminToken, setAdminToken, removeAdminToken, getAdminInfo, setAdminInfo } from '@/utils/auth'
import { adminApi } from '@/api'
import { ElMessage } from 'element-plus'

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
        } else {
          ElMessage.error((res && res.message) || '登录失败')
          return false
        }
      } catch (err) {
        console.error('管理员登录异常:', err)
        return false
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
