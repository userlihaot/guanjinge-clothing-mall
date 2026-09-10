import axios from 'axios'
import { ElMessage } from 'element-plus'
import { getToken, removeToken, removeUser } from './auth'

// 创建 Axios 实例，配置统一的基础 URL 和超时时间
const request = axios.create({
  baseURL: '/api', // 所有请求以 /api 开头，由 Vite proxy 转发到后端 localhost:8090
  timeout: 15000, // 请求超时时间 15 秒
  headers: {
    'Content-Type': 'application/json;charset=UTF-8',
  },
})

// ============ 登录态失效处理 ============

// 避免并发请求同时 401 时重复弹提示 / 重复跳转
let handlingUnauthorized = false

/**
 * 清理登录态并跳转到登录页，同时带上 redirect 以便登录后跳回原页面。
 *
 * 这里必须同时清掉 Pinia 持久化在 localStorage 里的 store：
 * 只删 token 的话，顶栏仍会显示"已登录"的头像和昵称。
 */
async function handleUnauthorized() {
  if (handlingUnauthorized) return
  handlingUnauthorized = true

  const currentPath = (window.location.hash || '').replace(/^#/, '') || '/'

  removeToken()
  removeUser()
  try {
    localStorage.removeItem('guanjinge-user-store')
  } catch { /* 忽略隐私模式下的异常 */ }

  try {
    const { useUserStore } = await import('@/stores/user')
    useUserStore().logout()
    if (currentPath !== '/login') {
      const { default: router } = await import('@/router')
      router.replace({ path: '/login', query: { redirect: currentPath } })
    }
  } catch (err) {
    // 兜底：动态 import 失败时退回 hash 跳转
    console.error('处理登录失效失败，回退到直接跳转:', err)
    window.location.hash = `#/login?redirect=${encodeURIComponent(currentPath)}`
  } finally {
    setTimeout(() => {
      handlingUnauthorized = false
    }, 1000)
  }
}

// ============ 请求拦截器 ============
request.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error('请求发送失败:', error)
    return Promise.reject(error)
  }
)

// ============ 响应拦截器 ============
request.interceptors.response.use(
  (response) => {
    // 如果后端返回的是文件流（Blob），直接返回
    if (response.config.responseType === 'blob') {
      return response
    }

    const res = response.data

    // 关键：后端所有业务失败都是 HTTP 200 + { code: 400/500, message, data }。
    // axios 会把它们当成成功响应，所以这里必须手动转成 reject，
    // 否则 `await api.x()` 在失败时也会 resolve —— 调用方稍不留意就会
    // "操作失败却提示成功"（例如下单失败仍提示订单提交成功）。
    if (res && typeof res === 'object' && !Array.isArray(res) && 'code' in res && res.code !== 200) {
      // 注意后端字段是 message（不是 msg）
      const message = res.message || '操作失败'
      ElMessage.error(message)
      const error = new Error(message)
      error.code = res.code
      error.response = response
      return Promise.reject(error)
    }

    // code === 200 或非标准结构，直接返回数据
    return res
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response

      switch (status) {
        case 400:
          ElMessage.error(data?.message || '请求参数有误')
          break
        case 401:
          // 未登录或 token 过期：清理登录态并跳转登录页（保留 redirect）
          handleUnauthorized()
          break
        case 403:
          ElMessage.error(data?.message || '无权执行此操作')
          break
        case 404:
          ElMessage.error(data?.message || '请求的资源不存在')
          break
        case 500:
          ElMessage.error(data?.message || '服务器繁忙，请稍后再试')
          break
        default:
          ElMessage.error(data?.message || `请求异常 (${status})`)
      }
    } else if (error.code === 'ECONNABORTED') {
      ElMessage.error('请求超时，请检查网络连接')
    } else {
      ElMessage.error('网络连接失败，请检查网络')
    }

    return Promise.reject(error)
  }
)

export default request
