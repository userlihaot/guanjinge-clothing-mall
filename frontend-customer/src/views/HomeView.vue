<template>
  <div class="home-page">
    <!-- ==================== 轮播 Banner 区域 ==================== -->
    <section class="banner-section">
      <el-carousel
        :interval="5000"
        arrow="hover"
        indicator-position="none"
        height="420px"
        class="home-carousel"
      >
        <!-- Banner 1 -->
        <el-carousel-item>
          <div class="banner-slide banner-1">
            <div class="banner-content">
              <h2 class="banner-title">锦绣华裳 古韵流芳</h2>
              <p class="banner-desc">精选丝绸面料，手工刺绣工艺，传承千年华夏之美</p>
              <router-link to="/products?sort=newest">
                <el-button type="primary" size="large" round class="banner-btn">
                  探索新品
                </el-button>
              </router-link>
            </div>
          </div>
        </el-carousel-item>
        <!-- Banner 2 -->
        <el-carousel-item>
          <div class="banner-slide banner-2">
            <div class="banner-content">
              <h2 class="banner-title">汉家衣裳 世代风尚</h2>
              <p class="banner-desc">从汉服到旗袍，每一件都是东方美学的完美表达</p>
              <router-link to="/products?categoryId=1">
                <el-button type="primary" size="large" round class="banner-btn">
                  选购汉服
                </el-button>
              </router-link>
            </div>
          </div>
        </el-carousel-item>
        <!-- Banner 3 -->
        <el-carousel-item>
          <div class="banner-slide banner-3">
            <div class="banner-content">
              <h2 class="banner-title">夏日清韵 薄纱轻罗</h2>
              <p class="banner-desc">夏季新品上市，清凉面料搭配古典设计，优雅一夏</p>
              <router-link to="/products">
                <el-button type="primary" size="large" round class="banner-btn">
                  立即选购
                </el-button>
              </router-link>
            </div>
          </div>
        </el-carousel-item>
      </el-carousel>
    </section>

    <!-- ==================== 分类导航卡片区域 ==================== -->
    <section class="category-section page-container">
      <h2 class="page-title">商品分类</h2>
      <div class="category-grid">
        <div
          v-for="cat in categories"
          :key="cat.key"
          class="category-card"
          @click="goToCategory(cat.key)"
        >
          <span class="category-emoji">{{ cat.emoji }}</span>
          <span class="category-name">{{ cat.name }}</span>
        </div>
      </div>
    </section>

    <!-- ==================== 热销商品区域 ==================== -->
    <section class="hot-section page-container">
      <div class="section-header">
        <h2 class="page-title">热销推荐</h2>
        <router-link to="/products?sort=sales" class="section-more">
          查看更多 <el-icon><ArrowRight /></el-icon>
        </router-link>
      </div>
      <div class="product-grid">
        <div
          v-for="product in hotProducts"
          :key="product.id"
          class="product-card"
          @click="goToDetail(product.id)"
        >
          <div class="product-image">
            <img :src="product.cover_image || defaultImg" :alt="product.name" />
            <span class="tag-hot">热销</span>
          </div>
          <div class="product-info">
            <h3 class="product-name">{{ product.name }}</h3>
            <p class="product-dynasty" v-if="product.dynasty">
              <span class="tag-dynasty">{{ product.dynasty }}</span>
            </p>
            <div class="product-price-row">
              <span class="price-current">
                <span class="symbol">&yen;</span>{{ product.promotion_price || product.price }}
              </span>
              <span class="price-original" v-if="product.promotion_price">
                &yen;{{ product.price }}
              </span>
            </div>
            <p class="product-sales">已售 {{ product.sales_count || 0 }} 件</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== 新品上市区域 ==================== -->
    <section class="new-section page-container">
      <div class="section-header">
        <h2 class="page-title">新品上市</h2>
        <router-link to="/products?sort=newest" class="section-more">
          查看更多 <el-icon><ArrowRight /></el-icon>
        </router-link>
      </div>
      <div class="product-grid">
        <div
          v-for="product in newProducts"
          :key="product.id"
          class="product-card"
          @click="goToDetail(product.id)"
        >
          <div class="product-image">
            <img :src="product.cover_image || defaultImg" :alt="product.name" />
            <span class="tag-new">新品</span>
          </div>
          <div class="product-info">
            <h3 class="product-name">{{ product.name }}</h3>
            <p class="product-dynasty" v-if="product.dynasty">
              <span class="tag-dynasty">{{ product.dynasty }}</span>
            </p>
            <div class="product-price-row">
              <span class="price-current">
                <span class="symbol">&yen;</span>{{ product.price }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== 品牌介绍区域 ==================== -->
    <section class="brand-section">
      <div class="page-container">
        <div class="brand-content">
          <div class="brand-text">
            <h2 class="brand-title">观锦阁</h2>
            <p class="brand-slogan">传承华夏之美，锦绣中华衣裳</p>
            <p class="brand-desc">
              观锦阁成立于2015年，专注于中国传统服饰的设计与制作。我们秉承"以古为根，以今为用"的理念，
              融合传统工艺与现代审美，为每一位热爱中华文化的顾客打造独一无二的古装服饰。
              从汉服的飘逸到旗袍的优雅，从唐装的大气到宋制的清雅，
              每一件作品都承载着匠人的心血与对传统文化的敬意。
            </p>
            <div class="brand-features">
              <div class="feature-item">
                <span class="feature-icon">&#xe600;</span>
                <span class="feature-label">手工刺绣</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">&#xe601;</span>
                <span class="feature-label">真丝面料</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">&#xe602;</span>
                <span class="feature-label">量体定制</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">&#xe603;</span>
                <span class="feature-label">7天无理由</span>
              </div>
            </div>
          </div>
          <div class="brand-image">
            <div class="brand-img-placeholder">
              <span>观锦阁</span>
              <small>品牌形象展示</small>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight } from '@element-plus/icons-vue'
import { productApi } from '@/api'

const router = useRouter()

// 默认占位图片
const defaultImg = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI0ZERjVFRCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2VyaWYiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiNEOEE1NzQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7op4Lpm4zplos8L3RleHQ+PC9zdmc+'

// 分类数据（key对应数据库category表的id）
const categories = [
  { key: 1, name: '唐制汉服', emoji: '👘' },
  { key: 2, name: '宋制汉服', emoji: '🎋' },
  { key: 3, name: '明制汉服', emoji: '🏮' },
  { key: 4, name: '古风婚服', emoji: '💒' },
  { key: 5, name: '古风配饰', emoji: '💎' },
  { key: 6, name: '改良古装', emoji: '✨' },
  { key: 7, name: '古风演出服', emoji: '🎭' },
]

// 热销商品列表
const hotProducts = ref([])
// 新品商品列表
const newProducts = ref([])
// 加载状态
const loading = ref(false)

// 获取热销商品
async function fetchHotProducts() {
  try {
    const res = await productApi.getHot()
    console.log('热销商品接口返回:', JSON.stringify(res, null, 2))
    // 后端返回 { code:200, data:[...] }，拦截器提取后 res 就是整个对象
    const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.records) ? res.data.records : []))
    hotProducts.value = list.slice(0, 4)
  } catch (error) {
    console.error('获取热销商品失败:', error)
    hotProducts.value = []
  }
}

// 获取新品商品
async function fetchNewProducts() {
  try {
    const res = await productApi.getNew()
    console.log('新品商品接口返回:', JSON.stringify(res, null, 2))
    const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.records) ? res.data.records : []))
    newProducts.value = list.slice(0, 4)
  } catch (error) {
    console.error('获取新品商品失败:', error)
    newProducts.value = []
  }
}

// 跳转到分类商品列表（传数字categoryId匹配数据库）
function goToCategory(key) {
  router.push({ path: '/products', query: { categoryId: key } })
}

// 跳转到商品详情页
function goToDetail(id) {
  router.push(`/product/${id}`)
}

// 页面加载时获取数据
onMounted(() => {
  fetchHotProducts()
  fetchNewProducts()
})
</script>

<style scoped>
/* ========== Banner 轮播区域 ========== */
.home-carousel {
  border-radius: 0 0 var(--radius-large) var(--radius-large);
  overflow: hidden;
}

.banner-slide {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

/* 三个不同渐变背景的 Banner */
.banner-1 {
  background: linear-gradient(135deg, #8B4513 0%, #A0522D 30%, #D4A574 70%, #FFF8F0 100%);
}

.banner-2 {
  background: linear-gradient(135deg, #6B3410 0%, #8B4513 40%, #E8C9A0 80%, #FFFAF5 100%);
}

.banner-3 {
  background: linear-gradient(135deg, #A0522D 0%, #D4A574 50%, #F5E6D3 80%, #FFFDF9 100%);
}

.banner-content {
  text-align: center;
  color: #fff;
  max-width: 600px;
  padding: 0 var(--spacing-lg);
}

.banner-title {
  font-family: var(--font-family-serif);
  font-size: 42px;
  font-weight: 700;
  margin-bottom: var(--spacing-md);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  letter-spacing: 4px;
}

.banner-desc {
  font-size: 18px;
  margin-bottom: var(--spacing-xl);
  opacity: 0.95;
  line-height: 1.8;
}

.banner-btn {
  padding: 12px 40px;
  font-size: 16px;
}

/* ========== 分类导航 ========== */
.category-section {
  margin-top: var(--spacing-xxl);
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
}

.category-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg) var(--spacing-md);
  background: var(--color-bg-white);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-base);
  cursor: pointer;
  transition: all 0.3s ease;
}

.category-card:hover {
  border-color: var(--color-accent);
  box-shadow: var(--shadow-medium);
  transform: translateY(-4px);
}

.category-emoji {
  font-size: 36px;
}

.category-name {
  font-size: 15px;
  color: var(--color-text-regular);
  font-weight: 500;
}

/* ========== 商品网格（热销/新品共用） ========== */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-lg);
}

.section-header .page-title {
  margin-bottom: 0;
}

.section-more {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: var(--color-text-secondary);
  transition: color 0.3s ease;
}

.section-more:hover {
  color: var(--color-primary);
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-md);
}

.product-card {
  background: var(--color-bg-white);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-base);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.product-card:hover {
  box-shadow: var(--shadow-medium);
  transform: translateY(-4px);
  border-color: var(--color-accent);
}

.product-image {
  position: relative;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  background-color: #FDF5ED;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.product-card:hover .product-image img {
  transform: scale(1.05);
}

.product-image .tag-hot,
.product-image .tag-new {
  position: absolute;
  top: 10px;
  left: 10px;
}

.product-info {
  padding: var(--spacing-md);
}

.product-name {
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
  /* 单行溢出省略 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-dynasty {
  margin-bottom: var(--spacing-xs);
}

.product-price-row {
  display: flex;
  align-items: baseline;
  margin-bottom: var(--spacing-xs);
}

.product-sales {
  font-size: 12px;
  color: var(--color-text-placeholder);
}

/* ========== 品牌介绍区域 ========== */
.brand-section {
  background: linear-gradient(180deg, var(--color-bg-white) 0%, var(--color-bg-primary) 100%);
  padding: var(--spacing-xxl) 0;
  margin-top: var(--spacing-xxl);
}

.brand-content {
  display: flex;
  gap: var(--spacing-xxl);
  align-items: center;
}

.brand-text {
  flex: 1;
}

.brand-title {
  font-family: var(--font-family-serif);
  font-size: 36px;
  color: var(--color-primary);
  margin-bottom: var(--spacing-sm);
}

.brand-slogan {
  font-family: var(--font-family-serif);
  font-size: 18px;
  color: var(--color-accent);
  margin-bottom: var(--spacing-lg);
}

.brand-desc {
  font-size: 15px;
  line-height: 1.9;
  color: var(--color-text-regular);
  margin-bottom: var(--spacing-xl);
  text-align: justify;
}

.brand-features {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-md);
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-md);
  background: var(--color-bg-white);
  border-radius: var(--radius-base);
  border: 1px solid var(--color-border-light);
}

.feature-icon {
  font-size: 28px;
  color: var(--color-primary);
}

.feature-label {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.brand-image {
  flex: 1;
  max-width: 450px;
}

.brand-img-placeholder {
  aspect-ratio: 4 / 3;
  background: linear-gradient(135deg, #FDF5ED, #F5E6D3);
  border-radius: var(--radius-large);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px dashed var(--color-accent);
}

.brand-img-placeholder span {
  font-family: var(--font-family-serif);
  font-size: 36px;
  color: var(--color-accent);
  margin-bottom: var(--spacing-sm);
}

.brand-img-placeholder small {
  font-size: 14px;
  color: var(--color-text-placeholder);
}

/* ========== 响应式 ========== */
@media (max-width: 1024px) {
  .category-grid {
    grid-template-columns: repeat(4, 1fr);
  }

  .product-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .brand-content {
    flex-direction: column;
  }

  .brand-image {
    max-width: 100%;
    width: 100%;
  }
}

@media (max-width: 768px) {
  .banner-title {
    font-size: 28px;
  }

  .banner-desc {
    font-size: 15px;
  }

  .category-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .product-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .brand-features {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .category-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .category-card {
    padding: var(--spacing-md);
  }

  .category-emoji {
    font-size: 28px;
  }
}
</style>
