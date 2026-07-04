// ============================================
// 认证工具模块 - JWT Token 和用户信息管理
// ============================================

// 本地存储的 key 名称常量
const TOKEN_KEY = 'guanjinge_token'
const USER_KEY = 'guanjinge_user'

/**
 * 获取存储的 JWT Token
 * @returns {string|null} token 字符串，不存在时返回 null
 */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * 保存 JWT Token 到本地存储
 * @param {string} token - JWT 令牌
 */
export function setToken(token) {
  // 防止存储 undefined / null / 'undefined' 等无效值
  if (!token || token === 'undefined' || token === 'null') {
    localStorage.removeItem(TOKEN_KEY)
    return
  }
  localStorage.setItem(TOKEN_KEY, token)
}

/**
 * 移除本地存储的 JWT Token
 */
export function removeToken() {
  localStorage.removeItem(TOKEN_KEY)
}

/**
 * 获取存储的用户信息
 * @returns {Object|null} 用户信息对象，不存在时返回 null
 */
export function getUser() {
  const userStr = localStorage.getItem(USER_KEY)
  if (!userStr) return null
  try {
    return JSON.parse(userStr)
  } catch (e) {
    // JSON 解析失败时清除无效数据
    localStorage.removeItem(USER_KEY)
    return null
  }
}

/**
 * 保存用户信息到本地存储
 * @param {Object} user - 用户信息对象
 */
export function setUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

/**
 * 移除本地存储的用户信息
 */
export function removeUser() {
  localStorage.removeItem(USER_KEY)
}

/**
 * 判断用户是否已登录（token 是否存在）
 * @returns {boolean} 已登录返回 true
 */
export function isLoggedIn() {
  const t = getToken()
  return !!(t && t !== 'undefined' && t !== 'null' && t.length > 10)
}

/**
 * 清除所有认证信息（用于退出登录）
 */
export function clearAuth() {
  removeToken()
  removeUser()
}

// ========== 管理员 Auth ==========
const ADMIN_TOKEN_KEY = 'guanjinge_admin_token'
const ADMIN_INFO_KEY = 'guanjinge_admin_info'

export function getAdminToken() { return localStorage.getItem(ADMIN_TOKEN_KEY) }
export function setAdminToken(token) {
  if (!token || token === 'undefined' || token === 'null') {
    localStorage.removeItem(ADMIN_TOKEN_KEY)
    return
  }
  localStorage.setItem(ADMIN_TOKEN_KEY, token)
}
export function removeAdminToken() { localStorage.removeItem(ADMIN_TOKEN_KEY) }
export function getAdminInfo() {
  try { return JSON.parse(localStorage.getItem(ADMIN_INFO_KEY)) } catch { return null }
}
export function setAdminInfo(info) { localStorage.setItem(ADMIN_INFO_KEY, JSON.stringify(info)) }
export function isAdminLoggedIn() {
  const t = getAdminToken()
  return !!(t && t !== 'undefined' && t !== 'null' && t.length > 10)
}
