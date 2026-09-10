// src/utils/request.js - Axios 实例封装（管理员端）
import axios from 'axios'
import { getAdminToken, removeAdminToken } from './auth'
import { ElMessage } from 'element-plus'

/**
 * 创建 Axios 实例
 * - baseURL 统一为 /api，由 Vite 开发服务器代理到后端
 * - timeout 设为 15 秒
 */
const request = axios.create({
  baseURL: '/api',
  timeout: 15000
})

// 避免并发请求同时 401/403 时重复弹提示、重复跳转
let handlingAuthFailure = false

/**
 * 登录态失效：清理管理员 token + Pinia 持久化数据，并跳回登录页。
 *
 * 只删 localStorage 是不够的：stores/admin.js 的 persist 会把 admin-store
 * 里的旧 token/昵称重新注水，导致"已登出却仍显示管理员信息"。
 * 用 router 跳转而不是 window.location.href，避免整页刷新丢掉当前状态。
 */
async function handleAuthFailure(message) {
  if (handlingAuthFailure) return
  handlingAuthFailure = true

  removeAdminToken()
  localStorage.removeItem('admin-store')
  if (message) ElMessage.error(message)

  try {
    const { useAdminStore } = await import('@/stores/admin')
    useAdminStore().logout()
    const { default: router } = await import('@/router')
    router.replace({ name: 'AdminLogin' })
  } catch (err) {
    console.error('处理登录失效失败，回退到直接跳转:', err)
    window.location.href = '/login'
  } finally {
    setTimeout(() => {
      handlingAuthFailure = false
    }, 1000)
  }
}

/**
 * 请求拦截器：自动在每个请求头中携带管理员 token
 */
request.interceptors.request.use(
  (config) => {
    // 获取存储的管理员 token
    const token = getAdminToken()
    if (token) {
      // 将 token 放入 Authorization 请求头 (Bearer 格式)
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    // 请求发出前出错
    return Promise.reject(error)
  }
)

/**
 * 响应拦截器：统一处理业务状态码与错误
 */
request.interceptors.response.use(
  (response) => {
    const res = response.data

    // 后端业务失败也是 HTTP 200 + { code: 400/500, message }，
    // 这里必须转成 reject，否则调用方不判断 code 时会"失败也提示成功"
    // （例如删除/发货失败仍弹成功提示，列表却不刷新）。
    if (res && typeof res === 'object' && !Array.isArray(res) && 'code' in res) {
      if (res.code === 200) {
        return res
      }
      // 后端错误文案字段是 message
      const message = res.message || '操作失败'
      ElMessage.error(message)
      const error = new Error(message)
      error.code = res.code
      error.response = response
      return Promise.reject(error)
    }

    // 非标准结构（例如后端直接返回数组）原样返回
    return res
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      switch (status) {
        case 401:
          // 未授权或 token 过期
          handleAuthFailure()
          break
        case 403:
          // 权限不足（例如拿用户 token 访问管理员接口），
          // 必须清掉登录态，否则会一直卡在后台页面反复报错
          handleAuthFailure(data?.message || '权限不足，请使用管理员账号重新登录')
          break
        case 404:
          ElMessage.error(data?.message || '请求的资源不存在')
          break
        case 500:
          // 服务器内部错误，尝试从响应中提取错误信息
          ElMessage.error(data?.message || '服务器内部错误')
          break
        default:
          ElMessage.error(data?.message || `请求失败 (${status})`)
      }
    } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      // 请求超时
      ElMessage.error('请求超时，请稍后重试')
    } else {
      // 网络错误（无法连接到服务器）
      ElMessage.error('网络错误，请检查网络连接')
    }
    return Promise.reject(error)
  }
)

export default request
