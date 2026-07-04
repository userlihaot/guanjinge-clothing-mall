<template>
  <div class="product-detail-page page-container">
    <!-- 加载中 -->
    <div v-if="loading" class="loading-section">
      <el-skeleton :rows="10" animated />
    </div>

    <!-- 商品详情主体 -->
    <template v-else-if="product">
      <!-- ==================== 左上图 + 右信息区 ==================== -->
      <div class="detail-top">
        <!-- 左侧图片：只展示封面图 -->
        <div class="gallery-section">
          <div class="main-image">
            <img :src="product.cover_image" :alt="product.name" />
          </div>
        </div>

        <!-- 右侧信息区域 -->
        <div class="info-section">
          <!-- 商品名称 -->
          <h1 class="product-title">{{ product.name }}</h1>
          <p class="product-subtitle" v-if="product.subtitle">{{ product.subtitle }}</p>

          <!-- 标签 -->
          <div class="tag-row" v-if="product.dynasty || product.fabric">
            <span class="tag-dynasty" v-if="product.dynasty">{{ product.dynasty }}</span>
            <span class="tag-dynasty" v-if="product.fabric">{{ product.fabric }}</span>
          </div>

          <!-- 价格区域 -->
          <div class="price-section">
            <span class="price-current">
              <span class="symbol">&yen;</span>{{ product.promotion_price || product.price }}
            </span>
            <span class="price-original" v-if="product.promotion_price">
              &yen;{{ product.price }}
            </span>
          </div>

          <!-- 促销标签 -->
          <div class="promo-tag" v-if="product.promotionTag">
            <span class="promo-badge">{{ product.promotionTag }}</span>
          </div>

          <!-- 库存提示 -->
          <div class="stock-info">
            <span v-if="product.stock > 10" class="stock-in">有货（库存 {{ product.stock }} 件）</span>
            <span v-else-if="product.stock > 0" class="stock-low">仅剩 {{ product.stock }} 件</span>
            <span v-else class="stock-out">暂时缺货</span>
          </div>

          <!-- 数量选择 -->
          <div class="quantity-section">
            <label class="sku-label">数量：</label>
            <el-input-number
              v-model="quantity"
              :min="1"
              :max="Math.min(product.stock || 99, 99)"
              :disabled="!product.stock"
              size="default"
            />
            <span class="quantity-tip">（库存 {{ product.stock || 0 }} 件）</span>
          </div>

          <!-- 操作按钮 -->
          <div class="action-buttons">
            <el-button
              type="primary"
              size="large"
              :disabled="!product.stock"
              @click="handleAddToCart"
            >
              <el-icon><ShoppingCart /></el-icon>加入购物车
            </el-button>
            <el-button
              type="danger"
              size="large"
              :disabled="!product.stock"
              @click="handleBuyNow"
            >
              立即购买
            </el-button>
            <el-button
              :type="isFavorited ? 'warning' : 'default'"
              size="large"
              @click="handleToggleFavorite"
            >
              <el-icon><StarFilled v-if="isFavorited" /><Star v-else /></el-icon>
              {{ isFavorited ? '已收藏' : '收藏' }}
            </el-button>
          </div>
        </div>
      </div>

      <!-- ==================== 详情和评价 Tabs ==================== -->
      <div class="detail-tabs">
        <el-tabs v-model="activeTab" type="border-card">
          <!-- 商品详情 Tab - 支持 HTML -->
          <el-tab-pane label="商品详情" name="detail">
            <div class="tab-content">
              <div v-if="product.description" v-html="product.description" class="detail-html"></div>
              <div v-else class="detail-empty">
                <el-empty description="暂无详细描述" />
              </div>
            </div>
          </el-tab-pane>

          <!-- 买家评价 Tab -->
          <el-tab-pane :label="`买家评价 (${reviewTotal})`" name="reviews">
            <div class="tab-content">
              <!-- 评价列表 -->
              <div v-if="reviews.length > 0" class="review-list">
                <div v-for="review in reviews" :key="review.id" class="review-item">
                  <div class="review-header">
                    <div class="review-user">
                      <el-avatar :size="36" class="review-avatar">
                        {{ (review.nickname || review.username || '匿').charAt(0) }}
                      </el-avatar>
                      <div>
                        <span class="review-nickname">{{ review.nickname || review.username || '匿名用户' }}</span>
                        <div class="review-stars">
                          <el-rate
                            :model-value="review.star || 5"
                            disabled
                            size="small"
                            disabled-void-color="#E8D5C0"
                          />
                        </div>
                      </div>
                    </div>
                    <span class="review-time">{{ review.create_time || '' }}</span>
                  </div>
                  <div class="review-content">{{ review.content }}</div>
                  <div class="review-images" v-if="review.images && review.images.length">
                    <img
                      v-for="(img, idx) in review.images"
                      :key="idx"
                      :src="img"
                      class="review-img"
                      @click="previewImage(img)"
                    />
                  </div>
                  <!-- 商家回复 -->
                  <div class="review-reply" v-if="review.seller_reply || review.reply">
                    <span class="reply-label">商家回复：</span>
                    <span>{{ review.seller_reply || review.reply }}</span>
                  </div>
                </div>

                <!-- 评价分页 -->
                <div class="review-pagination" v-if="reviewTotal > reviewPageSize">
                  <el-pagination
                    v-model:current-page="reviewPage"
                    :page-size="reviewPageSize"
                    :total="reviewTotal"
                    layout="prev, pager, next"
                    @current-change="fetchReviews"
                  />
                </div>
              </div>
              <div v-else>
                <el-empty description="暂无评价，快来抢沙发吧~" />
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </template>

    <!-- 商品不存在 -->
    <div v-else class="not-found">
      <el-result icon="error" title="商品不存在" sub-title="该商品已被下架或删除">
        <template #extra>
          <el-button type="primary" @click="$router.push('/products')">浏览其他商品</el-button>
        </template>
      </el-result>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ShoppingCart, Star, StarFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { productApi, reviewApi, favoriteApi } from '@/api'
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'
import { isLoggedIn } from '@/utils/auth'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const cartStore = useCartStore()

// ========== 商品数据 ==========
const product = ref(null)       // 商品详情
const loading = ref(true)       // 加载状态
const quantity = ref(1)         // 购买数量
const isFavorited = ref(false)  // 是否已收藏

// ========== 评价数据 ==========
const activeTab = ref('detail')
const reviews = ref([])        // 评价列表
const reviewPage = ref(1)      // 评价页码
const reviewTotal = ref(0)     // 评价总数

// ========== 获取商品详情 ==========
async function fetchProductDetail() {
  loading.value = true
  try {
    const id = route.params.id
    const res = await productApi.getDetail(id)
    const data = res.data || res
    product.value = data

    if (product.value && isLoggedIn()) {
      checkFavorite()
    }
  } catch (error) {
    console.error('获取商品详情失败:', error)
    product.value = null
  } finally {
    loading.value = false
  }
}

// ========== 获取评价列表 ==========
async function fetchReviews() {
  if (!product.value) return
  try {
    const res = await reviewApi.getList(product.value.id, {
      page: reviewPage.value,
      size: 10,
    })
    const data = res.data || res
    if (data.records || data.list) {
      reviews.value = data.records || data.list
      reviewTotal.value = data.total || 0
    } else if (Array.isArray(data)) {
      reviews.value = data
      reviewTotal.value = data.length
    }
  } catch (error) {
    console.error('获取评价失败:', error)
    reviews.value = []
  }
}

// ========== 检查收藏状态 ==========
async function checkFavorite() {
  if (!product.value || !isLoggedIn()) return
  try {
    const res = await favoriteApi.check(product.value.id)
    const data = (res.data || res)
    // 后端返回 { favorited: true/false }
    isFavorited.value = data?.favorited === true
  } catch {
    isFavorited.value = false
  }
}

// ========== 加入购物车 ==========
async function handleAddToCart() {
  if (!isLoggedIn()) {
    ElMessageBox.confirm('请先登录后再进行操作', '提示', {
      confirmButtonText: '去登录', cancelButtonText: '取消', type: 'info',
    }).then(() => { router.push({ path: '/login', query: { redirect: route.fullPath } }) }).catch(() => {})
    return
  }
  if (!product.value) return
  try {
    await cartStore.addToCart({ productId: product.value.id, quantity: quantity.value })
    ElMessage.success('已添加到购物车')
  } catch (error) { console.error(error) }
}

// ========== 立即购买 ==========
async function handleBuyNow() {
  if (!isLoggedIn()) {
    ElMessageBox.confirm('请先登录后再进行操作', '提示', {
      confirmButtonText: '去登录', cancelButtonText: '取消', type: 'info',
    }).then(() => { router.push({ path: '/login', query: { redirect: route.fullPath } }) }).catch(() => {})
    return
  }
  if (!product.value) return
  try {
    await cartStore.addToCart({ productId: product.value.id, quantity: quantity.value })
    router.push('/cart')
  } catch (error) {
    console.error('立即购买失败:', error)
  }
}

// ========== 收藏 / 取消收藏 ==========
async function handleToggleFavorite() {
  if (!isLoggedIn()) {
    ElMessageBox.confirm('请先登录后再进行操作', '提示', {
      confirmButtonText: '去登录',
      cancelButtonText: '取消',
      type: 'info',
    }).then(() => {
      router.push({ path: '/login', query: { redirect: route.fullPath } })
    }).catch(() => {})
    return
  }

  try {
    const res = await favoriteApi.toggle(product.value.id)
    const data = (res.data || res)
    // toggle 端点返回 { favorited: true/false }
    isFavorited.value = data?.favorited === true
    ElMessage.success(isFavorited.value ? '已添加收藏' : '已取消收藏')
  } catch (error) {
    console.error('收藏操作失败:', error)
  }
}

// ========== 预览图片 ==========
function previewImage(imgUrl) {
  // 简单的图片预览，使用浏览器新窗口打开
  window.open(imgUrl, '_blank')
}

// 监听 Tab 切换，切换到评价时加载评价数据
watch(activeTab, (newTab) => {
  if (newTab === 'reviews' && reviews.value.length === 0) {
    fetchReviews()
  }
})

// 监听路由参数变化（从商品列表点击不同商品）
watch(
  () => route.params.id,
  (newId) => {
    if (newId) {
      fetchProductDetail()
    }
  }
)

// 页面加载
onMounted(() => {
  fetchProductDetail()
})
</script>

<style scoped>
/* ========== 加载 / 空状态 ========== */
.loading-section {
  background: var(--color-bg-white);
  border-radius: var(--radius-base);
  padding: var(--spacing-xl);
}

.not-found {
  background: var(--color-bg-white);
  border-radius: var(--radius-base);
  padding: var(--spacing-xxl);
}

/* ========== 详情顶部区域 ========== */
.detail-top {
  display: flex;
  gap: var(--spacing-xl);
  background: var(--color-bg-white);
  border-radius: var(--radius-base);
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-lg);
}

/* ----- 左侧图区 ----- */
.gallery-section {
  width: 450px;
  flex-shrink: 0;
}

.main-image {
  aspect-ratio: 3 / 4;
  border-radius: var(--radius-base);
  overflow: hidden;
  background-color: #FDF5ED;
  border: 1px solid var(--color-border-light);
}

.main-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-list {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
}

.thumbnail-item {
  width: 72px;
  height: 72px;
  border-radius: var(--radius-small);
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color 0.3s ease;
}

.thumbnail-item.active {
  border-color: var(--color-primary);
}

.thumbnail-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* ----- 右侧信息区 ----- */
.info-section {
  flex: 1;
  min-width: 0;
}

.product-title {
  font-family: var(--font-family-serif);
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.product-subtitle {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-md);
}

.tag-row {
  display: flex;
  gap: 6px;
  margin-bottom: var(--spacing-md);
}

/* 价格 */
.price-section {
  background: linear-gradient(135deg, #FFF8F0, #FFFAF5);
  padding: var(--spacing-md);
  border-radius: var(--radius-base);
  margin-bottom: var(--spacing-md);
  display: flex;
  align-items: baseline;
  gap: var(--spacing-sm);
}

.price-current {
  font-size: 32px;
  font-weight: 700;
  color: #C0392B;
}

.price-original {
  font-size: 16px;
  color: var(--color-text-placeholder);
  text-decoration: line-through;
}

.price-tag {
  display: inline-block;
  background: #C0392B;
  color: #fff;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 3px;
  margin-left: 4px;
}

.promo-tag {
  margin-bottom: var(--spacing-md);
}

.promo-badge {
  display: inline-block;
  background: linear-gradient(135deg, var(--color-accent), var(--color-accent-dark));
  color: #fff;
  font-size: 12px;
  padding: 4px 12px;
  border-radius: var(--radius-round);
}

/* 库存 */
.stock-info {
  margin-bottom: var(--spacing-md);
  font-size: 14px;
}

.stock-in {
  color: var(--color-success);
}

.stock-low {
  color: var(--color-warning);
}

.stock-out {
  color: var(--color-danger);
}

/* SKU 区域 */
.sku-section {
  margin-bottom: var(--spacing-md);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.sku-label {
  font-size: 14px;
  color: var(--color-text-secondary);
  min-width: 56px;
}

/* 数量 */
.quantity-section {
  margin-bottom: var(--spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.quantity-tip {
  font-size: 13px;
  color: var(--color-text-placeholder);
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

/* ========== Tabs 区域 ========== */
.detail-tabs {
  background: var(--color-bg-white);
  border-radius: var(--radius-base);
  overflow: hidden;
}

.tab-content {
  padding: var(--spacing-lg);
  min-height: 200px;
}

.detail-html {
  max-width: 100%;
  overflow-x: auto;
  line-height: 1.8;
  color: var(--color-text-regular);
}

.detail-html :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-base);
}

.detail-empty {
  padding: var(--spacing-xl) 0;
}

/* ========== 评价列表 ========== */
.review-list {
  display: flex;
  flex-direction: column;
}

.review-item {
  padding: var(--spacing-md) 0;
  border-bottom: 1px solid var(--color-border-light);
}

.review-item:last-child {
  border-bottom: none;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.review-user {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.review-avatar {
  background: var(--color-accent);
  color: #fff;
}

.review-nickname {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.review-time {
  font-size: 13px;
  color: var(--color-text-placeholder);
}

.review-content {
  font-size: 14px;
  line-height: 1.8;
  color: var(--color-text-regular);
  margin-bottom: var(--spacing-sm);
}

.review-images {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.review-img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: var(--radius-small);
  cursor: pointer;
  border: 1px solid var(--color-border-light);
}

.review-reply {
  background: var(--color-bg-primary);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-small);
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-top: var(--spacing-sm);
}

.reply-label {
  color: var(--color-primary);
  font-weight: 500;
}

.review-pagination {
  display: flex;
  justify-content: center;
  padding-top: var(--spacing-lg);
}

/* ========== 响应式 ========== */
@media (max-width: 1024px) {
  .detail-top {
    flex-direction: column;
  }

  .gallery-section {
    width: 100%;
  }

  .main-image {
    aspect-ratio: 3 / 4;
    max-height: 500px;
  }
}

@media (max-width: 768px) {
  .product-title {
    font-size: 20px;
  }

  .price-current {
    font-size: 26px;
  }

  .action-buttons {
    flex-wrap: wrap;
  }
}
</style>
