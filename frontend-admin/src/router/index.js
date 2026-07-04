// src/router/index.js - 观锦阁管理后台路由配置
import { createRouter, createWebHistory } from 'vue-router'
import { isAdminLoggedIn } from '@/utils/auth'

/**
 * 路由定义：
 * /login         管理员登录页
 * /              管理后台布局 (AdminLayout) → 子路由分发各功能页面
 */
const routes = [
  {
    // 管理员登录页 — 独立于管理后台布局
    path: '/login',
    name: 'AdminLogin',
    component: () => import('@/views/AdminLogin.vue'),
    meta: { title: '管理员登录', requiresAuth: false }
  },
  {
    // 管理后台主布局
    path: '/',
    name: 'AdminLayout',
    component: () => import('@/components/layout/AdminLayout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        // 仪表盘 / 数据概览
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '仪表盘', icon: 'DataAnalysis' }
      },
      {
        // 商品管理
        path: 'products',
        name: 'ProductManage',
        component: () => import('@/views/ProductManage.vue'),
        meta: { title: '商品管理', icon: 'Goods' }
      },
      {
        // 订单管理
        path: 'orders',
        name: 'OrderManage',
        component: () => import('@/views/OrderManage.vue'),
        meta: { title: '订单管理', icon: 'List' }
      },
      {
        // 用户管理
        path: 'users',
        name: 'UserManage',
        component: () => import('@/views/UserManage.vue'),
        meta: { title: '用户管理', icon: 'UserFilled' }
      },
      {
        // 优惠券管理
        path: 'coupons',
        name: 'CouponManage',
        component: () => import('@/views/CouponManage.vue'),
        meta: { title: '优惠券管理', icon: 'Ticket' }
      },
      {
        // 轮播图管理
        path: 'banners',
        name: 'BannerManage',
        component: () => import('@/views/BannerManage.vue'),
        meta: { title: '轮播图管理', icon: 'PictureFilled' }
      },
      {
        // 评价审核
        path: 'reviews',
        name: 'ReviewManage',
        component: () => import('@/views/ReviewManage.vue'),
        meta: { title: '评价审核', icon: 'StarFilled' }
      },
      {
        // 退款处理
        path: 'refunds',
        name: 'RefundManage',
        component: () => import('@/views/RefundManage.vue'),
        meta: { title: '退款处理', icon: 'Money' }
      },
      {
        // 系统设置
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/Settings.vue'),
        meta: { title: '系统设置', icon: 'Setting' }
      }
    ]
  },
  {
    // 未匹配路径重定向到仪表盘（如果已登录）或登录页
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
]

// 创建路由实例 (HTML5 History 模式)
const router = createRouter({
  history: createWebHistory(),
  routes
})

/**
 * 全局路由守卫：检查管理员登录状态
 * - 访问需要认证的页面但未登录 → 跳转到 /login
 * - 已登录状态下访问 /login → 跳转到 /
 */
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta?.title) {
    document.title = `${to.meta.title} - 观锦阁管理后台`
  }

  // 检查该路由是否需要管理员认证
  if (to.meta?.requiresAuth) {
    // 需要认证：检查是否已登录
    if (isAdminLoggedIn()) {
      next()
    } else {
      // 未登录，跳转到登录页
      next({ name: 'AdminLogin', query: { redirect: to.fullPath } })
    }
  } else if (to.name === 'AdminLogin' && isAdminLoggedIn()) {
    // 已登录状态下访问登录页 → 直接跳转到仪表盘
    next({ name: 'Dashboard' })
  } else {
    next()
  }
})

export default router
