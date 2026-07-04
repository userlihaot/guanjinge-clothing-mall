import { createRouter, createWebHashHistory } from 'vue-router'
import { isLoggedIn, isAdminLoggedIn } from '@/utils/auth'
import { ElMessage } from 'element-plus'

// ============================================
// 路由配置 - Hash 模式
// 观锦阁古装服饰商城前端路由
// ============================================

// 页面组件懒加载，优化首屏加载速度
const HomeView = () => import('@/views/HomeView.vue')
const ProductList = () => import('@/views/ProductList.vue')
const ProductDetail = () => import('@/views/ProductDetail.vue')
const Cart = () => import('@/views/Cart.vue')
const Login = () => import('@/views/Login.vue')
const OrderCreate = () => import('@/views/OrderCreate.vue')
const OrderList = () => import('@/views/OrderList.vue')
const OrderDetail = () => import('@/views/OrderDetail.vue')
const Pay = () => import('@/views/Pay.vue')
const UserProfile = () => import('@/views/UserProfile.vue')
const SearchResult = () => import('@/views/SearchResult.vue')
const RefundList = () => import('@/views/RefundList.vue')

// 路由配置表
const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView,
    meta: { title: '观锦阁 - 古装服饰商城' },
  },
  {
    path: '/products',
    name: 'ProductList',
    component: ProductList,
    meta: { title: '商品列表 - 观锦阁' },
  },
  {
    path: '/product/:id',
    name: 'ProductDetail',
    component: ProductDetail,
    meta: { title: '商品详情 - 观锦阁' },
  },
  {
    path: '/cart',
    name: 'Cart',
    component: Cart,
    meta: { title: '购物车 - 观锦阁', requiresAuth: true }, // 需要登录
  },
  {
    path: '/order/create',
    name: 'OrderCreate',
    component: OrderCreate,
    meta: { title: '确认订单 - 观锦阁', requiresAuth: true }, // 需要登录
  },
  {
    path: '/orders',
    name: 'OrderList',
    component: OrderList,
    meta: { title: '我的订单 - 观锦阁', requiresAuth: true }, // 需要登录
  },
  {
    path: '/order/:orderNo',
    name: 'OrderDetail',
    component: OrderDetail,
    meta: { title: '订单详情 - 观锦阁', requiresAuth: true }, // 需要登录
  },
  {
    path: '/pay',
    name: 'Pay',
    component: Pay,
    meta: { title: '支付订单 - 观锦阁', requiresAuth: true }, // 需要登录
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { title: '登录注册 - 观锦阁' },
  },
  {
    path: '/profile',
    name: 'UserProfile',
    component: UserProfile,
    meta: { title: '个人中心 - 观锦阁', requiresAuth: true }, // 需要登录
  },
  {
    path: '/search',
    name: 'SearchResult',
    component: SearchResult,
    meta: { title: '搜索结果 - 观锦阁' },
  },
  {
    path: '/refunds',
    name: 'RefundList',
    component: RefundList,
    meta: { title: '我的退款 - 观锦阁', requiresAuth: true },
  },
  // ========== 管理后台路由（管理员独立登录页） ==========
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: () => import('@/views/admin/AdminLogin.vue'),
    meta: { title: '管理员登录 - 观锦阁' },
  },
  { path: '/admin', name: 'Dashboard', component: () => import('@/views/admin/Dashboard.vue'), meta: { title: '数据统计', requiresAdmin: true } },
  { path: '/admin/categories', name: 'AdminCategories', component: () => import('@/views/admin/CategoryManage.vue'), meta: { title: '分类管理', requiresAdmin: true } },
  { path: '/admin/products', name: 'AdminProducts', component: () => import('@/views/admin/ProductManage.vue'), meta: { title: '商品管理', requiresAdmin: true } },
  { path: '/admin/orders', name: 'AdminOrders', component: () => import('@/views/admin/OrderManage.vue'), meta: { title: '订单管理', requiresAdmin: true } },
  { path: '/admin/users', name: 'AdminUsers', component: () => import('@/views/admin/UserManage.vue'), meta: { title: '用户管理', requiresAdmin: true } },
  { path: '/admin/coupons', name: 'AdminCoupons', component: () => import('@/views/admin/CouponManage.vue'), meta: { title: '优惠券管理', requiresAdmin: true } },
  { path: '/admin/banners', name: 'AdminBanners', component: () => import('@/views/admin/BannerManage.vue'), meta: { title: '轮播图管理', requiresAdmin: true } },
  { path: '/admin/reviews', name: 'AdminReviews', component: () => import('@/views/admin/ReviewManage.vue'), meta: { title: '评价管理', requiresAdmin: true } },
  { path: '/admin/refunds', name: 'AdminRefunds', component: () => import('@/views/admin/RefundManage.vue'), meta: { title: '退款处理', requiresAdmin: true } },
  { path: '/admin/settings', name: 'AdminSettings', component: () => import('@/views/admin/Settings.vue'), meta: { title: '系统设置', requiresAdmin: true } },
  // 404 页面重定向到首页
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: '/',
  },
]

// 创建路由实例
const router = createRouter({
  history: createWebHashHistory(), // Hash 模式，兼容性好无需服务端配置
  routes,
  // 页面切换后滚动到顶部
  scrollBehavior() {
    return { top: 0, behavior: 'smooth' }
  },
})

// ========== 全局路由守卫 ==========
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title
  }

  // 检查目标路由是否需要登录权限
  if (to.meta.requiresAuth) {
    // 未登录时拦截，跳转到登录页
    if (!isLoggedIn()) {
      ElMessage.warning('请先登录后再访问')
      // 记录目标路径，登录成功后跳回
      next({
        path: '/login',
        query: { redirect: to.fullPath },
      })
      return
    }
  }

  // 管理员路由：检查 admin token
  if (to.meta.requiresAdmin) {
    if (!isAdminLoggedIn()) {
      ElMessage.warning('请先登录管理员账号')
      next('/admin/login')
      return
    }
  }

  // 如果已登录但访问登录页，直接跳转首页
  if (to.path === '/login' && isLoggedIn()) {
    next('/')
    return
  }

  // 如果管理员已登录但访问管理员登录页，直接跳转后台首页
  if (to.path === '/admin/login' && isAdminLoggedIn()) {
    next('/admin')
    return
  }

  next()
})

export default router
