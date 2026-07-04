<template>
  <div class="product-list-page page-container">
    <h1 class="page-title">商品列表</h1>

    <div class="list-layout">
      <!-- ==================== 左侧筛选区 ==================== -->
      <aside class="filter-sidebar">
        <!-- 分类筛选 - 单选按钮组 -->
        <div class="filter-block">
          <h3 class="filter-title">商品分类</h3>
          <el-radio-group
            v-model="filters.categoryId"
            size="default"
            @change="handleFilterChange"
          >
            <el-radio-button value="">全部</el-radio-button>
            <el-radio-button
              v-for="cat in categoryList"
              :key="cat.key"
              :value="cat.key"
            >
              {{ cat.name }}
            </el-radio-button>
          </el-radio-group>
        </div>

        <!-- 价格范围筛选 - 滑块 -->
        <div class="filter-block">
          <h3 class="filter-title">价格范围</h3>
          <el-slider
            v-model="priceRange"
            range
            :min="0"
            :max="5000"
            :step="50"
            :format-tooltip="formatPrice"
            @change="handlePriceChange"
          />
          <div class="price-labels">
            <span>&yen;{{ priceRange[0] }}</span>
            <span>&yen;{{ priceRange[1] }}</span>
          </div>
        </div>

        <!-- 朝代/风格筛选 -->
        <div class="filter-block">
          <h3 class="filter-title">风格朝代</h3>
          <el-radio-group
            v-model="filters.dynasty"
            size="small"
            @change="handleFilterChange"
          >
            <el-radio-button value="">不限</el-radio-button>
            <el-radio-button value="汉">汉</el-radio-button>
            <el-radio-button value="唐">唐</el-radio-button>
            <el-radio-button value="宋">宋</el-radio-button>
            <el-radio-button value="明">明</el-radio-button>
            <el-radio-button value="清">清</el-radio-button>
          </el-radio-group>
        </div>

        <!-- 排序方式 -->
        <div class="filter-block">
          <h3 class="filter-title">排序方式</h3>
          <el-radio-group
            v-model="filters.sort"
            size="default"
            @change="handleFilterChange"
          >
            <el-radio-button value="">综合</el-radio-button>
            <el-radio-button value="sales">销量</el-radio-button>
            <el-radio-button value="price_asc">价格↑</el-radio-button>
            <el-radio-button value="price_desc">价格↓</el-radio-button>
            <el-radio-button value="new">最新</el-radio-button>
          </el-radio-group>
        </div>

        <!-- 重置按钮 -->
        <el-button class="reset-btn" @click="resetFilters" plain>重置筛选</el-button>
      </aside>

      <!-- ==================== 右侧商品区域 ==================== -->
      <div class="product-main">
        <!-- 加载中状态 -->
        <div v-if="loading" class="loading-area">
          <el-skeleton :rows="3" animated />
          <div class="product-grid">
            <div v-for="i in 8" :key="i" class="product-card">
              <el-skeleton animated>
                <template #template>
                  <div class="skeleton-img"></div>
                  <div style="padding: 14px">
                    <el-skeleton-item variant="text" style="width: 80%" />
                    <el-skeleton-item variant="text" style="width: 50%" />
                  </div>
                </template>
              </el-skeleton>
            </div>
          </div>
        </div>

        <!-- 商品网格 -->
        <template v-else>
          <!-- 无数据提示 -->
          <div v-if="productList.length === 0" class="empty-area">
            <el-empty description="暂无符合条件的商品">
              <el-button type="primary" @click="resetFilters">重置筛选</el-button>
            </el-empty>
          </div>

          <!-- 商品网格 4 列 -->
          <div v-else class="product-grid">
            <div
              v-for="product in productList"
              :key="product.id"
              class="product-card"
              @click="goToDetail(product.id)"
            >
              <div class="product-image">
                <img :src="product.cover_image || defaultImg" :alt="product.name" />
                <span v-if="product.tag === 'hot'" class="tag-hot">热销</span>
                <span v-else-if="product.tag === 'new'" class="tag-new">新品</span>
              </div>
              <div class="product-info">
                <h3 class="product-name">{{ product.name }}</h3>
                <p class="product-dynasty" v-if="product.dynasty">
                  <span class="tag-dynasty">{{ product.dynasty }}</span>
                  <span class="tag-dynasty" v-if="product.fabric">{{ product.fabric }}</span>
                </p>
                <div class="product-price-row">
                  <span class="price-current">
                    <span class="symbol">&yen;</span>{{ product.promotion_price || product.price }}
                  </span>
                  <span class="price-original" v-if="product.promotion_price">
                    &yen;{{ product.price }}
                  </span>
                </div>
                <p class="product-meta">
                  <span v-if="product.sales_count">已售{{ product.sales_count }}件</span>
                </p>
              </div>
            </div>
          </div>

          <!-- 分页器 -->
          <div class="pagination-area" v-if="total > 0">
            <el-pagination
              v-model:current-page="pagination.page"
              :page-size="pagination.size"
              :total="total"
              :page-sizes="[8, 16, 24, 32]"
              layout="total, sizes, prev, pager, next, jumper"
              background
              @current-change="handlePageChange"
              @size-change="handleSizeChange"
            />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { productApi } from '@/api'

const router = useRouter()
const route = useRoute()

// 默认占位图片
const defaultImg = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI0ZERjVFRCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2VyaWYiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiNEOEE1NzQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7op4Lpm4zplos8L3RleHQ+PC9zdmc+'

// 分类列表（key对应数据库category表的id）
const categoryList = [
  { key: 1, name: '唐制汉服' },
  { key: 2, name: '宋制汉服' },
  { key: 3, name: '明制汉服' },
  { key: 4, name: '古风婚服' },
  { key: 5, name: '古风配饰' },
  { key: 6, name: '改良古装' },
  { key: 7, name: '古风演出服' },
]

// 筛选条件
const filters = reactive({
  categoryId: '',
  dynasty: '',
  sort: '',
})

// 价格范围（滑块双值）
const priceRange = ref([0, 5000])

// 分页参数
const pagination = reactive({
  page: 1,
  size: 8,
})

// 商品列表数据
const productList = ref([])
// 总条数
const total = ref(0)
// 加载状态
const loading = ref(false)

// 格式化价格滑块提示
function formatPrice(value) {
  return `¥${value}`
}

// 构建筛选参数对象
function buildParams() {
  const params = {
    page: pagination.page,
    size: pagination.size,
  }
  if (filters.categoryId) params.categoryId = filters.categoryId
  if (filters.dynasty) params.dynasty = filters.dynasty
  if (filters.sort) {
    if (filters.sort === 'sales') params.sortBy = 'sales'
    else if (filters.sort === 'price_asc') params.sortBy = 'price_asc'
    else if (filters.sort === 'price_desc') params.sortBy = 'price_desc'
    else if (filters.sort === 'newest') params.sortBy = 'newest'
  }
  if (priceRange.value[0] > 0) params.minPrice = priceRange.value[0]
  if (priceRange.value[1] < 5000) params.maxPrice = priceRange.value[1]
  return params
}

// 获取商品列表数据
async function fetchProducts() {
  loading.value = true
  try {
    const params = buildParams()
    const res = await productApi.getList(params)
    // 兼容不同后端返回格式
    const data = res.data || res
    if (data.records || data.list) {
      productList.value = data.records || data.list
      total.value = data.total || 0
    } else if (Array.isArray(data)) {
      productList.value = data
      total.value = data.length
    } else {
      productList.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('获取商品列表失败:', error)
    productList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 筛选条件变更时重新加载（重置到第一页）
function handleFilterChange() {
  pagination.page = 1
  // 同步筛选参数到 URL query
  updateUrlQuery()
  fetchProducts()
}

// 价格滑块变更
function handlePriceChange() {
  handleFilterChange()
}

// 分页切换
function handlePageChange(page) {
  pagination.page = page
  fetchProducts()
  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 每页条数切换
function handleSizeChange(size) {
  pagination.size = size
  pagination.page = 1
  fetchProducts()
}

// 重置所有筛选条件
function resetFilters() {
  filters.categoryId = ''
  filters.dynasty = ''
  filters.sort = ''
  priceRange.value = [0, 5000]
  pagination.page = 1
  router.replace({ path: '/products' })
  fetchProducts()
}

// 跳转到商品详情页
function goToDetail(id) {
  router.push(`/product/${id}`)
}

// 同步筛选参数到 URL query
function updateUrlQuery() {
  const query = {}
  if (filters.categoryId) query.categoryId = filters.categoryId
  if (filters.sort) query.sort = filters.sort
  router.replace({ path: '/products', query })
}

// 从 URL query 读取初始筛选条件
function initFromQuery() {
  const query = route.query
  if (query.categoryId) filters.categoryId = query.categoryId
  if (query.sort) filters.sort = query.sort
  if (query.dynasty) filters.dynasty = query.dynasty
  if (query.minPrice) priceRange.value[0] = Number(query.minPrice)
  if (query.maxPrice) priceRange.value[1] = Number(query.maxPrice)
  if (query.page) pagination.page = Number(query.page)
}

// 监听路由变化，当 query 参数变化时重新加载
watch(
  () => route.query,
  () => {
    initFromQuery()
    fetchProducts()
  },
  { deep: true }
)

// 页面加载
onMounted(() => {
  initFromQuery()
  fetchProducts()
})
</script>

<style scoped>
/* ========== 整体布局 ========== */
.list-layout {
  display: flex;
  gap: var(--spacing-lg);
  align-items: flex-start;
}

/* ========== 左侧筛选区 ========== */
.filter-sidebar {
  width: 220px;
  flex-shrink: 0;
  background: var(--color-bg-white);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-base);
  padding: var(--spacing-lg);
  position: sticky;
  top: 80px;
}

.filter-block {
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border-light);
}

.filter-block:last-of-type {
  border-bottom: none;
}

.filter-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
}

/* 分类单选按钮组 */
.filter-block :deep(.el-radio-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.filter-block :deep(.el-radio-button__inner) {
  border-radius: var(--radius-small);
  padding: 6px 12px;
  font-size: 13px;
  border-color: var(--color-border-light);
}

/* 价格标签 */
.price-labels {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-top: var(--spacing-xs);
}

/* 重置按钮 */
.reset-btn {
  width: 100%;
  margin-top: var(--spacing-sm);
}

/* ========== 右侧商品主区域 ========== */
.product-main {
  flex: 1;
  min-width: 0;
}

/* 加载状态 */
.loading-area {
  background: var(--color-bg-white);
  border-radius: var(--radius-base);
  padding: var(--spacing-lg);
}

.skeleton-img {
  width: 100%;
  aspect-ratio: 3 / 4;
  background: #FDF5ED;
  border-radius: var(--radius-base) var(--radius-base) 0 0;
}

/* 空状态 */
.empty-area {
  background: var(--color-bg-white);
  border-radius: var(--radius-base);
  padding: var(--spacing-xxl);
}

/* 商品网格 */
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
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-dynasty {
  margin-bottom: var(--spacing-xs);
  display: flex;
  gap: 4px;
}

.product-price-row {
  display: flex;
  align-items: baseline;
  margin-bottom: var(--spacing-xs);
}

.product-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--color-text-placeholder);
}

/* 分页 */
.pagination-area {
  display: flex;
  justify-content: center;
  padding: var(--spacing-xl) 0;
}

/* ========== 响应式 ========== */
@media (max-width: 1024px) {
  .list-layout {
    flex-direction: column;
  }

  .filter-sidebar {
    width: 100%;
    position: static;
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
  }

  .filter-block {
    flex: 1 1 auto;
    min-width: 140px;
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }

  .product-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-sm);
  }
}
</style>
