<template>
  <!-- 观锦阁顶部导航栏 - 国风设计 -->
  <header class="app-header">
    <div class="header-container">
      <!-- Logo 区域 -->
      <router-link to="/" class="logo-section">
        <div class="logo-icon">锦</div>
        <div class="logo-text">
          <span class="logo-title">观锦阁</span>
          <span class="logo-subtitle">古装服饰</span>
        </div>
      </router-link>

      <!-- 导航链接 -->
      <nav class="nav-links">
        <router-link to="/" class="nav-item" active-class="nav-active">首页</router-link>
        <router-link to="/products" class="nav-item" active-class="nav-active">全部商品</router-link>
        <router-link to="/products?categoryId=1" class="nav-item" active-class="nav-active">唐制汉服</router-link>
        <router-link to="/products?categoryId=2" class="nav-item" active-class="nav-active">宋制汉服</router-link>
        <router-link to="/products?categoryId=3" class="nav-item" active-class="nav-active">明制汉服</router-link>
        <router-link to="/products?categoryId=4" class="nav-item" active-class="nav-active">古风婚服</router-link>
        <router-link to="/products?categoryId=5" class="nav-item" active-class="nav-active">古风配饰</router-link>
      </nav>

      <!-- 右侧操作区 -->
      <div class="header-actions">
        <!-- 搜索框 -->
        <div class="search-box">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索古装服饰..."
            size="default"
            :prefix-icon="Search"
            class="search-input"
            @keyup.enter="handleSearch"
            clearable
          />
        </div>

        <!-- 用户菜单 -->
        <template v-if="userStore.isLoggedIn">
          <el-dropdown trigger="hover" class="user-dropdown">
            <span class="user-info">
              <el-avatar :size="32" class="user-avatar">
                {{ userStore.nickname.charAt(0) }}
              </el-avatar>
              <span class="user-name">{{ userStore.nickname }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>
                  <router-link to="/profile" class="dropdown-link">
                    <el-icon><User /></el-icon>个人中心
                  </router-link>
                </el-dropdown-item>
                <el-dropdown-item>
                  <router-link to="/orders" class="dropdown-link">
                    <el-icon><Document /></el-icon>我的订单
                  </router-link>
                </el-dropdown-item>
                <el-dropdown-item>
                  <router-link to="/refunds" class="dropdown-link">
                    <el-icon><Wallet /></el-icon>退款记录
                  </router-link>
                </el-dropdown-item>
                <el-dropdown-item v-if="isAdmin">
                  <router-link to="/admin" class="dropdown-link">
                    <el-icon><Setting /></el-icon>管理后台
                  </router-link>
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <template v-else>
          <router-link to="/login" class="login-btn">
            <el-button type="primary" size="small" round>登录 / 注册</el-button>
          </router-link>
        </template>

        <!-- 购物车图标 -->
        <router-link to="/cart" class="cart-icon">
          <el-badge :value="cartStore.totalItems" :hidden="cartStore.totalItems === 0" :max="99">
            <el-icon :size="24"><ShoppingCart /></el-icon>
          </el-badge>
        </router-link>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Search, ArrowDown, User, Document,
  ShoppingCart, SwitchButton, Setting, Wallet,
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const cartStore = useCartStore()

// 检查是否为管理员（localStorage 中有 adminToken）
const isAdmin = computed(() => !!localStorage.getItem('adminToken'))

// 搜索关键词（双向绑定）
const searchKeyword = ref('')

// 处理搜索 - 回车触发
function handleSearch() {
  const keyword = searchKeyword.value.trim()
  if (!keyword) {
    ElMessage.info('请输入搜索关键词')
    return
  }
  router.push({ path: '/search', query: { q: keyword } })
  searchKeyword.value = ''
}

// 退出登录
function handleLogout() {
  userStore.logout()
  cartStore.clearCart()
  ElMessage.success('已退出登录')
  router.push('/')
}

// 页面加载时获取购物车数据
onMounted(() => {
  if (userStore.isLoggedIn) {
    cartStore.fetchCart()
  }
})
</script>

<style scoped>
/* ========== 顶部导航整体 ========== */
.app-header {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: linear-gradient(135deg, #FFF8F0 0%, #FFFDF9 100%);
  border-bottom: 2px solid var(--color-accent);
  box-shadow: var(--shadow-light);
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-lg);
  height: 64px;
  gap: var(--spacing-md);
}

/* ========== Logo 区域 ========== */
.logo-section {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  flex-shrink: 0;
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: #fff;
  font-family: var(--font-family-serif);
  font-size: 22px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.logo-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.logo-title {
  font-family: var(--font-family-serif);
  font-size: 20px;
  font-weight: 700;
  color: var(--color-primary);
}

.logo-subtitle {
  font-size: 10px;
  color: var(--color-accent);
  letter-spacing: 2px;
}

/* ========== 导航链接 ========== */
.nav-links {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 88px;
  height: 36px;
  padding: 0;
  font-size: 14px;
  letter-spacing: 2px;
  color: var(--color-text-regular);
  border-radius: 6px;
  transition: all 0.3s ease;
  text-align: center;
}

.nav-item:hover {
  color: var(--color-primary);
  background-color: rgba(139, 69, 19, 0.06);
}

.nav-active {
  color: var(--color-primary);
  font-weight: 600;
  background-color: rgba(139, 69, 19, 0.08);
}

/* ========== 右侧操作区 ========== */
.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.search-box {
  width: 220px;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: var(--radius-round);
  background-color: rgba(212, 165, 116, 0.08);
  border-color: transparent;
  transition: all 0.3s ease;
}

.search-input :deep(.el-input__wrapper:hover),
.search-input :deep(.el-input__wrapper.is-focus) {
  background-color: #fff;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 1px var(--color-accent) inset;
}

/* ========== 用户区域 ========== */
.user-info {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: var(--color-text-regular);
  font-size: 14px;
  white-space: nowrap;
}

.user-avatar {
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  color: #fff;
}

.login-btn {
  flex-shrink: 0;
}

/* ========== 购物车图标 ========== */
.cart-icon {
  color: var(--color-text-regular);
  font-size: 24px;
  padding: 4px;
  transition: color 0.3s ease;
}

.cart-icon:hover {
  color: var(--color-primary);
}

/* ========== 下拉菜单链接 ========== */
.dropdown-link {
  display: flex;
  align-items: center;
  gap: 8px;
  color: inherit;
  text-decoration: none;
  width: 100%;
}

/* ========== 响应式 ========== */
@media (max-width: 1024px) {
  .nav-links {
    display: none;
  }

  .search-box {
    width: 160px;
  }
}

@media (max-width: 768px) {
  .header-container {
    padding: 0 var(--spacing-sm);
  }

  .search-box {
    display: none;
  }

  .logo-subtitle {
    display: none;
  }
}
</style>
