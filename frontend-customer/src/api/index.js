import request from '@/utils/request'

// ============================================
// 统一 API 模块
// 包含所有后端接口调用，按模块划分
// ============================================

// ========== 用户模块 ==========
export const userApi = {
  /** 密码登录 → /api/user/login/password */
  login(data) {
    // 后端接收 {phone, password}，前端可能传 mobile，统一转
    const payload = { phone: data.phone || data.mobile, password: data.password }
    return request.post('/user/login/password', payload)
  },
  /** 短信验证码登录 → /api/user/login/sms */
  smsLogin(data) {
    const payload = { phone: data.phone || data.mobile, code: data.code }
    return request.post('/user/login/sms', payload)
  },
  /** 用户注册 → /api/user/register */
  register(data) {
    const payload = {
      username: data.username,
      password: data.password,
      phone: data.phone || data.mobile,
      nickname: data.nickname
    }
    return request.post('/user/register', payload)
  },
  /** 发送短信验证码 → /api/user/sms */
  sendSms(phone) {
    return request.post('/user/sms', { phone: typeof phone === 'string' ? phone : (phone.phone || phone.mobile) })
  },
  /** 获取用户信息 → /api/user/profile */
  getUserInfo() {
    return request.get('/user/profile')
  },
  /** 更新用户信息 → /api/user/profile */
  updateUserInfo(data) {
    return request.put('/user/profile', data)
  },
  /** 修改密码 → /api/user/password */
  changePassword(data) {
    return request.put('/user/password', data)
  },
}

// ========== 商品模块 ==========
export const productApi = {
  /** 获取商品列表（支持分页、筛选、排序） */
  getList(params) {
    return request.get('/product/list', { params })
  },
  /** 获取商品详情 */
  getDetail(id) {
    return request.get(`/product/${id}`)
  },
  /** 获取热销商品 */
  getHot(params) {
    return request.get('/product/hot', { params })
  },
  /** 获取新品商品 */
  getNew(params) {
    return request.get('/product/new', { params })
  },
  /** 搜索商品 */
  search(params) {
    return request.get('/product/search', { params })
  },
  /** 获取商品分类列表 */
  getCategories() {
    return request.get('/product/categories')
  },
  /** 获取商品 SKU 信息 */
  getSkus(productId) {
    return request.get(`/product/${productId}/skus`)
  },
}

// ========== 购物车模块 ==========
export const cartApi = {
  /** 获取购物车列表 */
  getList() {
    return request.get('/cart/list')
  },
  /** 添加商品到购物车 */
  add(data) {
    return request.post('/cart/add', data)
  },
  /** 更新购物车商品数量 */
  update(data) {
    return request.put('/cart/update', data)
  },
  /** 删除购物车单个商品 */
  remove(cartId) {
    return request.delete(`/cart/${cartId}`)
  },
  /** 批量删除购物车商品 */
  batchRemove(ids) {
    return request.delete('/cart/batch', { data: ids })
  },
  /** 清空购物车 */
  clear() {
    return request.delete('/cart/clear')
  },
  /** 获取购物车数量（用于徽标显示） */
  getCount() {
    return request.get('/cart/count')
  },
}

// ========== 收货地址模块 ==========
export const addressApi = {
  /** 获取地址列表 */
  getList() {
    return request.get('/address/list')
  },
  /** 获取地址详情 */
  getDetail(id) {
    return request.get(`/address/${id}`)
  },
  /** 新增地址 */
  add(data) {
    return request.post('/address/add', data)
  },
  /** 更新地址 */
  update(data) {
    return request.put('/address/update', data)
  },
  /** 删除地址 */
  remove(id) {
    return request.delete(`/address/${id}`)
  },
  /** 设置默认地址 */
  setDefault(id) {
    return request.put(`/address/${id}/default`)
  },
}

// ========== 订单模块 ==========
export const orderApi = {
  /** 创建订单（从购物车结算） */
  create(data) {
    return request.post('/order/create', data)
  },
  /** 获取订单列表 */
  getList(params) {
    return request.get('/order/list', { params })
  },
  /** 获取订单详情 */
  getDetail(orderNo) {
    return request.get(`/order/detail/${orderNo}`)
  },
  /** 取消订单 */
  cancel(orderNo) {
    return request.put(`/order/cancel/${orderNo}`)
  },
  /** 确认收货 */
  confirm(orderNo) {
    return request.put(`/order/confirm/${orderNo}`)
  },
  /** 删除订单 */
  remove(orderNo) {
    return request.delete(`/order/${orderNo}`)
  },
  /** 获取各状态订单数量 */
  getStatusCount() {
    return request.get('/order/status-count')
  },
}

// ========== 支付模块 ==========
export const payApi = {
  /** 发起支付 */
  pay(data) {
    return request.post('/pay/do-pay', data)
  },
  /** 查询支付状态 */
  queryStatus(orderNo) {
    return request.get(`/pay/status/${orderNo}`)
  },
  /** 查询支付结果（轮询用） */
  queryResult(orderNo) {
    return request.get(`/pay/result/${orderNo}`)
  },
}

// ========== 评价/评论模块 ==========
export const reviewApi = {
  /** 获取商品评价列表 */
  getList(productId, params) {
    return request.get(`/review/product/${productId}`, { params })
  },
  /** 提交评价 */
  add(data) {
    return request.post('/review/create', data)
  },
  /** 追加评价 */
  append(reviewId, data) {
    return request.post(`/review/append/${reviewId}`, data)
  },
  /** 删除评价 */
  remove(id) {
    return request.delete(`/review/${id}`)
  },
  /** 获取我的评价 */
  getMyReviews(params) {
    return request.get('/review/my', { params })
  },
}

// ========== 收藏模块 ==========
export const favoriteApi = {
  /** 获取收藏列表 */
  getList(params) {
    return request.get('/favorite/list', { params })
  },
  /** 切换收藏状态（后端自动判断添加/取消） */
  toggle(productId) {
    return request.post('/favorite/toggle', { productId })
  },
  /** 检查是否已收藏 */
  check(productId) {
    return request.get(`/favorite/check/${productId}`)
  },
}

// ========== 优惠券模块 ==========
export const couponApi = {
  /** 获取可用优惠券列表 */
  getAvailable(params) {
    return request.get('/coupon/available', { params })
  },
  /** 获取我的优惠券 */
  getMyCoupons(params) {
    return request.get('/coupon/my', { params })
  },
  /** 领取优惠券 */
  receive(couponId) {
    return request.post(`/coupon/receive/${couponId}`)
  },
  /** 获取订单可用的优惠券（按订单金额筛选） */
  getOrderAvailable(amount) {
    return request.get('/coupon/order-available', { params: { amount } })
  },
}

// ========== Banner 模块 ==========
export const bannerApi = {
  /** 获取所有 Banner */
  getList() {
    return request.get('/banner/list')
  },
}

// ========== 退款/售后模块 ==========
export const refundApi = {
  /** 申请退款 */
  apply(data) {
    return request.post('/refund/apply', data)
  },
  /** 获取退款列表 */
  getList(params) {
    return request.get('/refund/list', { params })
  },
  /** 获取退款详情 */
  getDetail(id) {
    return request.get(`/refund/${id}`)
  },
  /** 取消退款申请 */
  cancel(id) {
    return request.put(`/refund/cancel/${id}`)
  },
  /** 提交退货物流 */
  submitLogistics(data) {
    return request.put('/refund/return-logistics', data)
  },
}

// ========== 管理员模块 ==========
export const adminApi = {
  login(data) { return request.post('/admin/login', data) },
  getDashboard() { return request.get('/admin/dashboard') },
  // 商品
  getProducts(params) { return request.get('/admin/products', { params }) },
  getProductDetail(id) { return request.get('/admin/products/' + id) },
  createProduct(data) { return request.post('/admin/products', data) },
  updateProduct(id, data) { return request.put('/admin/products/' + id, data) },
  deleteProduct(id) { return request.delete('/admin/products/' + id) },
  shelve(id) { return request.put('/admin/products/' + id + '/shelve') },
  unshelve(id) { return request.put('/admin/products/' + id + '/unshelve') },
  toggleProductStatus(id, status) { return request.put('/admin/products/' + id, { status }) },
  // 订单
  getOrders(params) { return request.get('/admin/orders', { params }) },
  shipOrder(id, data) { return request.put('/admin/orders/' + id + '/deliver', data) },
  deliver: (orderNo, data) => request.put('/admin/orders/' + orderNo + '/deliver', data),
  // 用户
  getUsers(params) { return request.get('/admin/users', { params }) },
  toggleUserStatus(id) { return request.put('/admin/users/' + id + '/status') },
  // 优惠券
  getCoupons() { return request.get('/admin/coupons') },
  createCoupon(data) { return request.post('/admin/coupons', data) },
  deleteCoupon(id) { return request.delete('/admin/coupons/' + id) },
  // 轮播图
  getBanners() { return request.get('/admin/banners') },
  createBanner(data) { return request.post('/admin/banners', data) },
  updateBanner(id, data) { return request.put('/admin/banners/' + id, data) },
  deleteBanner(id) { return request.delete('/admin/banners/' + id) },
  // 评价
  getReviews(params) { return request.get('/admin/reviews', { params }) },
  auditReview(id, isAudited) { return request.put('/admin/reviews/' + id + '/audit', { isAudited }) },
  approveReview(id) { return request.put('/admin/reviews/' + id + '/audit', { isAudited: 1 }) },
  rejectReview(id) { return request.put('/admin/reviews/' + id + '/audit', { isAudited: 2 }) },
  replyReview(id, reply) { return request.put('/admin/reviews/' + id + '/reply', { reply }) },
  // 退款
  getRefunds(params) { return request.get('/admin/refunds', { params }) },
  handleRefund(id, data) { return request.put('/admin/refunds/' + id + '/handle', data) },
  approveRefund(id) { return request.put('/admin/refunds/' + id + '/handle', { status: 1 }) },
  rejectRefund(id, reason) { return request.put('/admin/refunds/' + id + '/handle', { status: 2, refuseReason: reason }) },
  // 分类管理
  getCategories() { return request.get('/admin/categories') },
  createCategory(data) { return request.post('/admin/categories', data) },
  updateCategory(id, data) { return request.put('/admin/categories/' + id, data) },
  deleteCategory(id) { return request.delete('/admin/categories/' + id) },
  // 设置
  getSettings() { return request.get('/admin/settings') },
  saveSettings(data) { return request.put('/admin/settings', data) },
  // 修改密码
  changePassword(data) { return request.put('/admin/change-password', data) },
}

// 默认导出所有 API 模块
export default {
  userApi,
  productApi,
  cartApi,
  addressApi,
  orderApi,
  payApi,
  reviewApi,
  favoriteApi,
  couponApi,
  bannerApi,
  refundApi,
  adminApi,
}
