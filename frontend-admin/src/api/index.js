// src/api/index.js - 管理后台所有 API 接口
import request from '@/utils/request'

export const adminApi = {
  // ==================== 认证 ====================
  login(username, password) {
    return request.post('/admin/login', { username, password })
  },
  getAdminInfo() {
    return request.get('/admin/info')
  },

  // ==================== 仪表盘 ====================
  getDashboard() {
    return request.get('/admin/dashboard')
  },

  // ==================== 商品管理 ====================
  getProducts(params = {}) {
    return request.get('/admin/products', { params })
  },
  getProductById(id) {
    return request.get(`/admin/products/${id}`)
  },
  createProduct(data) {
    return request.post('/admin/products', data)
  },
  updateProduct(id, data) {
    return request.put(`/admin/products/${id}`, data)
  },
  deleteProduct(id) {
    return request.delete(`/admin/products/${id}`)
  },
  shelveProduct(id) {
    return request.put(`/admin/products/${id}/shelve`)
  },
  unshelveProduct(id) {
    return request.put(`/admin/products/${id}/unshelve`)
  },
  toggleProductStatus(id, status) {
    return request.put(`/admin/products/${id}`, { status })
  },

  // ==================== 订单管理 ====================
  getOrders(params = {}) {
    return request.get('/admin/orders', { params })
  },
  getOrderDetail(orderNo) {
    return request.get(`/admin/orders/${orderNo}`)
  },
  deliverOrder(orderNo, data) {
    return request.put(`/admin/orders/${orderNo}/deliver`, data)
  },
  deleteOrder(orderNo) {
    return request.delete(`/admin/orders/${orderNo}`)
  },

  // ==================== 用户管理 ====================
  getUsers(params = {}) {
    return request.get('/admin/users', { params })
  },
  getUserDetail(id) {
    return request.get(`/admin/users/${id}`)
  },
  toggleUserStatus(id) {
    return request.put(`/admin/users/${id}/status`)
  },

  // ==================== 优惠券管理 ====================
  getCoupons() {
    return request.get('/admin/coupons')
  },
  createCoupon(data) {
    return request.post('/admin/coupons', data)
  },
  deleteCoupon(id) {
    return request.delete(`/admin/coupons/${id}`)
  },

  // ==================== 轮播图管理 ====================
  getBanners() {
    return request.get('/admin/banners')
  },
  createBanner(data) {
    return request.post('/admin/banners', data)
  },
  updateBanner(id, data) {
    return request.put(`/admin/banners/${id}`, data)
  },
  deleteBanner(id) {
    return request.delete(`/admin/banners/${id}`)
  },

  // ==================== 评价审核 ====================
  getReviews(params = {}) {
    return request.get('/admin/reviews', { params })
  },
  auditReview(id, isAudited) {
    return request.put(`/admin/reviews/${id}/audit`, { isAudited })
  },
  replyReview(id, reply) {
    return request.put(`/admin/reviews/${id}/reply`, { reply })
  },

  // ==================== 退款处理 ====================
  getRefunds(params = {}) {
    return request.get('/admin/refunds', { params })
  },
  handleRefund(id, data) {
    return request.put(`/admin/refunds/${id}/handle`, data)
  },
  deleteRefund(id) {
    return request.delete(`/admin/refunds/${id}`)
  },

  // ==================== 分类管理 ====================
  getCategories() {
    return request.get('/admin/categories')
  },
  createCategory(data) {
    return request.post('/admin/categories', data)
  },
  updateCategory(id, data) {
    return request.put(`/admin/categories/${id}`, data)
  },
  deleteCategory(id) {
    return request.delete(`/admin/categories/${id}`)
  },

  // ==================== 系统设置 ====================
  getSettings() {
    return request.get('/admin/settings')
  },
  saveSettings(data) {
    return request.put('/admin/settings', data)
  }
}
