import axios from 'axios'
import { ElMessage } from 'element-plus'
import { getToken, getAdminToken, removeToken } from './auth'

// 创建 Axios 实例，配置统一的基础 URL 和超时时间
const request = axios.create({
  baseURL: '/api', // 所有请求以 /api 开头，由 Vite proxy 转发到后端 localhost:8090
  timeout: 15000, // 请求超时时间 15 秒
  headers: {
    'Content-Type': 'application/json;charset=UTF-8',
  },
})

// ============ 请求拦截器 ============
request.interceptors.request.use(
  (config) => {
    // 优先用户 token，其次管理员 token（管理员后台也需要鉴权）
    const token = getToken() || getAdminToken()
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    // 请求错误处理
    console.error('请求发送失败:', error)
    return Promise.reject(error)
  }
)

// ============ 响应拦截器 ============
request.interceptors.response.use(
  (response) => {
    // 提取后端返回的数据
    const res = response.data

    // 如果后端返回的是文件流（Blob），直接返回
    if (response.config.responseType === 'blob') {
      return response
    }

    // 统一处理业务状态码（假定后端返回格式为 { code, msg, data }）
    // code === 200 表示成功，直接返回 data
    // 其他情况由各业务模块自行处理
    return res
  },
  (error) => {
    // 处理 HTTP 响应错误
    if (error.response) {
      const { status, data } = error.response

      switch (status) {
        case 400:
          // 参数错误，显示后端返回的错误信息
          ElMessage.error(data?.msg || '请求参数有误')
          break
        case 401:
          // 未登录或 token 过期，清除本地 token 并跳转登录页
          removeToken()
          // 避免在登录页重复跳转
          if (window.location.hash !== '#/login') {
            ElMessage.warning('登录已过期，请重新登录')
            // 使用 setTimeout 确保消息提示先显示
            setTimeout(() => {
              window.location.hash = '#/login'
            }, 500)
          }
          break
        case 403:
          // 无权限访问
          ElMessage.error('无权执行此操作')
          break
        case 404:
          // 资源不存在
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          // 服务器内部错误
          ElMessage.error(data?.msg || '服务器繁忙，请稍后再试')
          break
        default:
          ElMessage.error(data?.msg || `请求异常 (${status})`)
      }
    } else if (error.code === 'ECONNABORTED') {
      // 请求超时
      ElMessage.error('请求超时，请检查网络连接')
    } else {
      // 网络错误
      ElMessage.error('网络连接失败，请检查网络')
    }

    return Promise.reject(error)
  }
)

export default request
