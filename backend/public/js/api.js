/**
 * 观锦阁 - API 请求封装（CDN Axios）
 * 所有页面共用，省略了 import，直接在 HTML 中引入 axios
 */

// 创建 axios 实例
const http = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

// 请求拦截器：自动附带 JWT Token
http.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});

// 响应拦截器：统一错误处理
http.interceptors.response.use(
  res => res.data,
  err => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      if (!location.href.includes('login.html')) {
        location.href = '/login.html';
      }
    }
    return Promise.reject(err);
  }
);

// ========== 用户 API ==========
const userApi = {
  register: (data) => http.post('/user/register', data),
  loginByPassword: (data) => http.post('/user/login/password', data),
  loginBySms: (data) => http.post('/user/login/sms', data),
  sendSms: (phone) => http.post('/user/sms', { phone }),
  getProfile: () => http.get('/user/profile'),
  updateProfile: (data) => http.put('/user/profile', data),
  updatePassword: (data) => http.put('/user/password', data),
};

// ========== 商品 API ==========
const productApi = {
  getList: (params) => http.get('/product/list', { params }),
  getDetail: (id) => http.get('/product/' + id),
  getHot: () => http.get('/product/hot'),
  getNew: () => http.get('/product/new'),
  search: (keyword, params) => http.get('/product/search', { params: { keyword, ...params } }),
};

// ========== 购物车 API ==========
const cartApi = {
  getList: () => http.get('/cart/list'),
  add: (data) => http.post('/cart/add', data),
  updateQuantity: (data) => http.put('/cart/quantity', data),
  updateSelected: (data) => http.put('/cart/selected', data),
  remove: (ids) => http.delete('/cart/' + ids.join(',')),
};

// ========== 地址 API ==========
const addressApi = {
  getList: () => http.get('/address/list'),
  add: (data) => http.post('/address/add', data),
  update: (data) => http.put('/address/update', data),
  remove: (id) => http.delete('/address/' + id),
  setDefault: (id) => http.put('/address/' + id + '/default'),
};

// ========== 订单 API ==========
const orderApi = {
  create: (data) => http.post('/order/create', data),
  getList: (params) => http.get('/order/list', { params }),
  getDetail: (orderNo) => http.get('/order/detail/' + orderNo),
  cancel: (orderNo) => http.put('/order/cancel/' + orderNo),
  confirm: (orderNo) => http.put('/order/confirm/' + orderNo),
};

// ========== 支付 API ==========
const payApi = {
  doPay: (data) => http.post('/pay/do-pay', data),
  getResult: (orderNo) => http.get('/pay/result/' + orderNo),
};

// ========== 评价 API ==========
const reviewApi = {
  create: (data) => http.post('/review/create', data),
  getProductReviews: (productId, params) => http.get('/review/product/' + productId, { params }),
};

// ========== 收藏 API ==========
const favoriteApi = {
  toggle: (productId) => http.post('/favorite/toggle', { productId }),
  check: (productId) => http.get('/favorite/check/' + productId),
  getList: (params) => http.get('/favorite/list', { params }),
};

// ========== 优惠券 API ==========
const couponApi = {
  getAvailable: () => http.get('/coupon/available'),
  getMy: (status) => http.get('/coupon/my', { params: { status } }),
  receive: (couponId) => http.post('/coupon/receive/' + couponId),
  getOrderAvailable: (amount) => http.get('/coupon/order-available', { params: { amount } }),
};

// ========== 轮播图 API ==========
const bannerApi = {
  getActive: () => http.get('/banner/active'),
};

// ========== 退款 API ==========
const refundApi = {
  apply: (data) => http.post('/refund/apply', data),
  getList: (params) => http.get('/refund/list', { params }),
};

// ========== 管理员 API ==========
const adminApi = {
  login: (data) => http.post('/admin/login', data),
  getDashboard: () => http.get('/admin/dashboard'),
  getProducts: (params) => http.get('/admin/products', { params }),
  getProductDetail: (id) => http.get('/admin/products/' + id),
  updateProduct: (id, data) => http.put('/admin/products/' + id, data),
  shelve: (id) => http.put('/admin/products/' + id + '/shelve'),
  unshelve: (id) => http.put('/admin/products/' + id + '/unshelve'),
  getOrders: (params) => http.get('/admin/orders', { params }),
  deliver: (orderNo, data) => http.put('/admin/orders/' + orderNo + '/deliver', data),
  getUsers: (params) => http.get('/admin/users', { params }),
  toggleUserStatus: (id) => http.put('/admin/users/' + id + '/status'),
  getCoupons: () => http.get('/admin/coupons'),
  createCoupon: (data) => http.post('/admin/coupons', data),
  deleteCoupon: (id) => http.delete('/admin/coupons/' + id),
  getBanners: () => http.get('/admin/banners'),
  createBanner: (data) => http.post('/admin/banners', data),
  getReviews: (params) => http.get('/admin/reviews', { params }),
  auditReview: (id, isAudited) => http.put('/admin/reviews/' + id + '/audit', { isAudited }),
  replyReview: (id, reply) => http.put('/admin/reviews/' + id + '/reply', { reply }),
  getRefunds: (params) => http.get('/admin/refunds', { params }),
  handleRefund: (id, data) => http.put('/admin/refunds/' + id + '/handle', data),
  getSettings: () => http.get('/admin/settings'),
  saveSettings: (data) => http.put('/admin/settings', data),
};
