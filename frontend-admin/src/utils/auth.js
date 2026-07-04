// src/utils/auth.js - 管理员 Token 管理工具

// 本地存储中管理员 token 的 key 名称
const ADMIN_TOKEN_KEY = 'admin_token'
const ADMIN_INFO_KEY = 'admin_info'

/**
 * 获取管理员 token
 * @returns {string|null} 管理员 token 或 null
 */
export function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY)
}

/**
 * 保存管理员 token 到本地存储
 * @param {string} token - 登录成功后获取的 token
 */
export function setAdminToken(token) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token)
}

/**
 * 删除管理员 token（退出登录时使用）
 */
export function removeAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY)
  localStorage.removeItem(ADMIN_INFO_KEY)
}

/**
 * 获取管理员信息
 * @returns {object|null} 解析后的管理员信息对象
 */
export function getAdminInfo() {
  const info = localStorage.getItem(ADMIN_INFO_KEY)
  if (info) {
    try {
      return JSON.parse(info)
    } catch {
      return null
    }
  }
  return null
}

/**
 * 保存管理员信息
 * @param {object} info - 管理员信息对象 (包含用户名、头像等)
 */
export function setAdminInfo(info) {
  localStorage.setItem(ADMIN_INFO_KEY, JSON.stringify(info))
}

/**
 * 检查管理员是否已登录（基于是否有存储的 token）
 * @returns {boolean}
 */
export function isAdminLoggedIn() {
  return !!getAdminToken()
}
