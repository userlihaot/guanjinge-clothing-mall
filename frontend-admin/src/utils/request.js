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
 * 响应拦截器：统一处理错误状态码
 */
request.interceptors.response.use(
  (response) => {
    // 2xx 状态码直接返回 data
    return response.data
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      switch (status) {
        case 401:
          // 未授权或 token 过期：清除登录态并跳转到登录页
          removeAdminToken()
          ElMessage.error('登录已过期，请重新登录')
          // 延迟跳转，让用户看到提示
          setTimeout(() => {
            window.location.href = '/login'
          }, 1500)
          break
        case 403:
          // 无权限
          ElMessage.error('没有操作权限')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          // 服务器内部错误，尝试从响应中提取错误信息
          ElMessage.error(data?.message || '服务器内部错误')
          break
        default:
          ElMessage.error(data?.message || `请求失败 (${status})`)
      }
    } else if (error.message.includes('timeout')) {
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
