<template>
  <div class="search-page page-container">
    <h1 class="page-title">搜索结果</h1>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-input
        v-model="keyword"
        placeholder="搜索古装服饰..."
        size="large"
        :prefix-icon="Search"
        class="search-input-lg"
        @keyup.enter="handleSearch"
        clearable
      />
      <el-button type="primary" size="large" @click="handleSearch">
        <el-icon><Search /></el-icon>搜索
      </el-button>
    </div>

    <!-- 搜索提示 -->
    <div class="search-hint" v-if="searchedKeyword">
      搜索 "<em>{{ searchedKeyword }}</em>" ，共找到 <em>{{ total }}</em> 件商品
    </div>

    <!-- 排序 Tab -->
    <div class="sort-bar" v-if="productList.length > 0">
      <div class="sort-tabs">
        <span
          v-for="sort in sorts"
          :key="sort.value"
          class="sort-tab"
          :class="{ active: currentSort === sort.value }"
          @click="handleSortChange(sort.value)"
        >
          {{ sort.label }}
        </span>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="loading-section">
      <el-skeleton :rows="4" animated />
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

    <!-- 搜索结果 -->
    <template v-else>
      <!-- 无结果 -->
      <div v-if="productList.length === 0 && searchedKeyword" class="empty-section">
        <el-empty description="未找到相关商品，换个关键词试试吧">
          <template #default>
            <p class="empty-tips">建议：</p>
            <ul class="empty-suggestions">
              <li>检查关键词拼写是否正确</li>
              <li>尝试使用更简短的搜索词</li>
              <li>尝试搜索品类词如"汉服""旗袍""唐装"</li>
            </ul>
            <el-button type="primary" @click="$router.push('/products')">浏览全部商品</el-button>
          </template>
        </el-empty>
      </div>

      <!-- 商品网格 -->
      <div v-else class="product-grid">
        <div
          v-for="product in productList"
          :key="product.id"
          class="product-card"
          @click="$router.push(`/product/${product.id}`)"
        >
          <div class="product-image">
            <img :src="product.cover_image || product.image || defaultImg" :alt="product.name" />
            <span v-if="product.is_hot" class="tag-hot">热销</span>
            <span v-else-if="product.is_new" class="tag-new">新品</span>
          </div>
          <div class="product-info">
            <h3 class="product-name" v-html="highlightKeyword(product.name)"></h3>
            <p class="product-dynasty" v-if="product.dynasty || product.fabric">
              <span class="tag-dynasty" v-if="product.dynasty">{{ product.dynasty }}</span>
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

      <!-- 分页 -->
      <div class="pagination-area" v-if="total > pageSize">
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          background
          @current-change="fetchSearchResults"
        />
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { productApi } from '@/api'

const route = useRoute()
const router = useRouter()

const defaultImg = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI0ZERjVFRCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2VyaWYiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiNEOEE1NzQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7op4Lpm4zplos8L3RleHQ+PC9zdmc+'

// 搜索关键词
const keyword = ref('')
// 实际搜索的关键词（用于显示）
const searchedKeyword = ref('')
// 当前排序
const currentSort = ref('')

// 排序选项
const sorts = [
  { label: '综合', value: '' },
  { label: '销量', value: 'sales' },
  { label: '价格↑', value: 'price_asc' },
  { label: '价格↓', value: 'price_desc' },
  { label: '最新', value: 'new' },
]

// 商品数据
const productList = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(12)
const total = ref(0)

// 高亮搜索关键词
function highlightKeyword(text) {
  if (!text || !searchedKeyword.value) return text
  const regex = new RegExp(`(${escapeRegex(searchedKeyword.value)})`, 'gi')
  return text.replace(regex, '<span class="highlight">$1</span>')
}

// 转义正则特殊字符
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// 获取搜索结果
async function fetchSearchResults() {
  if (!keyword.value.trim()) {
    productList.value = []
    total.value = 0
    return
  }

  loading.value = true
  searchedKeyword.value = keyword.value.trim()

  try {
    const params = {
      keyword: searchedKeyword.value,
      page: page.value,
      size: pageSize.value,
    }
    if (currentSort.value) params.sortBy = currentSort.value

    const res = await productApi.search(params)
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
    console.error('搜索失败:', error)
    productList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 处理搜索
function handleSearch() {
  if (!keyword.value.trim()) return
  page.value = 1
  // 同步关键词到 URL
  router.replace({ path: '/search', query: { q: keyword.value.trim() } })
  fetchSearchResults()
}

// 排序切换
function handleSortChange(sort) {
  currentSort.value = sort
  page.value = 1
  fetchSearchResults()
}

// 从 URL 读取初始关键词
function initFromQuery() {
  const q = route.query.q
  if (q) {
    keyword.value = q
    searchedKeyword.value = q
    fetchSearchResults()
  }
}

// 监听路由变化
watch(
  () => route.query.q,
  (newQ) => {
    if (newQ) {
      keyword.value = newQ
      searchedKeyword.value = newQ
      page.value = 1
      fetchSearchResults()
    }
  }
)

onMounted(() => {
  initFromQuery()
})
</script>

<style scoped>
/* 搜索栏 */
.search-bar {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.search-input-lg {
  flex: 1;
}

.search-input-lg :deep(.el-input__wrapper) {
  border-radius: var(--radius-round);
  box-shadow: 0 2px 12px rgba(139, 69, 19, 0.08);
}

/* 搜索提示 */
.search-hint {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-md);
}

.search-hint em {
  font-style: normal;
  color: var(--color-primary);
  font-weight: 600;
}

/* 排序条 */
.sort-bar {
  display: flex;
  align-items: center;
  background: var(--color-bg-white);
  border-radius: var(--radius-base);
  padding: var(--spacing-sm) var(--spacing-lg);
  margin-bottom: var(--spacing-md);
  border: 1px solid var(--color-border-light);
}

.sort-tabs {
  display: flex;
  gap: 4px;
}

.sort-tab {
  padding: 6px 16px;
  font-size: 14px;
  color: var(--color-text-secondary);
  border-radius: var(--radius-round);
  cursor: pointer;
  transition: all 0.3s;
}

.sort-tab:hover {
  color: var(--color-primary);
  background: rgba(139, 69, 19, 0.05);
}

.sort-tab.active {
  color: #fff;
  background: var(--color-primary);
}

/* 加载 / 空状态 */
.loading-section,
.empty-section {
  background: var(--color-bg-white);
  border-radius: var(--radius-base);
  padding: var(--spacing-xl);
}

.skeleton-img {
  width: 100%;
  aspect-ratio: 3 / 4;
  background: #FDF5ED;
  border-radius: var(--radius-base) var(--radius-base) 0 0;
}

.empty-tips {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-sm);
}

.empty-suggestions {
  text-align: left;
  font-size: 13px;
  color: var(--color-text-placeholder);
  margin-bottom: var(--spacing-md);
}

.empty-suggestions li {
  margin-bottom: 4px;
  list-style: disc;
  margin-left: 20px;
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
  transition: transform 0.4s;
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

.product-name :deep(.highlight) {
  color: #C0392B;
  font-weight: 600;
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
  font-size: 12px;
  color: var(--color-text-placeholder);
}

/* 分页 */
.pagination-area {
  display: flex;
  justify-content: center;
  padding: var(--spacing-xl) 0;
}

@media (max-width: 1024px) {
  .product-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
