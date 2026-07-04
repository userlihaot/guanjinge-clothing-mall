<!-- ProductManage.vue - 商品管理页面 -->
<template>
  <div class="product-manage">
    <!-- ========== 操作栏 ========== -->
    <div class="card-container">
      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索商品名称"
          clearable
          @keyup.enter="handleSearch"
        />
        <el-select v-model="searchCategory" placeholder="商品分类" clearable>
          <el-option label="全部" value="" />
          <el-option label="唐制汉服" value="1" />
          <el-option label="宋制汉服" value="2" />
          <el-option label="明制汉服" value="3" />
          <el-option label="古风婚服" value="4" />
          <el-option label="古风配饰" value="5" />
          <el-option label="改良古装" value="6" />
          <el-option label="古风演出服" value="7" />
        </el-select>
        <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        <el-button type="success" :icon="Plus" @click="handleEdit(null)">新增商品</el-button>
      </div>
    </div>

    <!-- ========== 商品表格 ========== -->
    <div class="card-container">
      <el-table
        v-loading="loading"
        :data="productList"
        stripe
        border
        style="width: 100%"
        empty-text="暂无商品数据"
      >
        <!-- ID -->
        <el-table-column prop="id" label="ID" width="60" align="center" />

        <!-- 封面缩略图 -->
        <el-table-column label="封面" width="80" align="center">
          <template #default="{ row }">
            <el-image
              v-if="row.cover_image"
              :src="row.cover_image"
              style="width: 50px; height: 50px; border-radius: 4px"
              fit="cover"
              :preview-src-list="[row.cover_image]"
              preview-teleported
            />
            <span v-else class="no-image">无图</span>
          </template>
        </el-table-column>

        <!-- 商品名称 -->
        <el-table-column prop="name" label="商品名称" min-width="160" show-overflow-tooltip />

        <!-- 分类 -->
        <el-table-column prop="category" label="分类" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.category_name || '未分类' }}</el-tag>
          </template>
        </el-table-column>

        <!-- 价格 -->
        <el-table-column label="价格 (¥)" width="130" align="center">
          <template #default="{ row }">
            <div class="price-cell">
              <span class="price-current">&yen;{{ formatPrice(row.promotion_price || row.price) }}</span>
            </div>
          </template>
        </el-table-column>

        <!-- 库存 -->
        <el-table-column prop="stock" label="库存" width="80" align="center" />

        <!-- 销量 -->
        <el-table-column prop="sales_count" label="销量" width="80" align="center" />

        <!-- 状态 Switch -->
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              active-text="上架"
              inactive-text="下架"
              inline-prompt
              size="small"
              @change="handleToggleStatus(row)"
            />
          </template>
        </el-table-column>

        <!-- 操作按钮 -->
        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" :icon="Edit" link @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="danger" size="small" :icon="Delete" link @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchProducts"
          @current-change="fetchProducts"
        />
      </div>
    </div>

    <!-- ========== 编辑商品 Dialog ========== -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingProduct.id ? '编辑商品' : '新增商品'"
      width="500px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="editingProduct"
        :rules="formRules"
        label-width="80px"
      >
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="editingProduct.name" placeholder="请输入商品名称" />
        </el-form-item>
        <el-form-item label="商品价格" prop="price">
          <el-input-number
            v-model="editingProduct.price"
            :min="0.01"
            :precision="2"
            :step="1"
            placeholder="请输入价格"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="商品库存" prop="stock">
          <el-input-number
            v-model="editingProduct.stock"
            :min="0"
            :step="1"
            placeholder="请输入库存"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="封面图URL" prop="coverImage">
          <el-input v-model="editingProduct.coverImage" placeholder="请输入封面图URL地址" />
        </el-form-item>
        <el-form-item label="商品分类" prop="categoryId">
          <el-select v-model="editingProduct.categoryId" placeholder="请选择分类" style="width: 100%">
            <el-option label="唐制汉服" :value="1" />
            <el-option label="宋制汉服" :value="2" />
            <el-option label="明制汉服" :value="3" />
            <el-option label="古风婚服" :value="4" />
            <el-option label="古风配饰" :value="5" />
            <el-option label="改良古装" :value="6" />
            <el-option label="古风演出服" :value="7" />
          </el-select>
        </el-form-item>
        <el-form-item label="促销价格">
          <el-input-number v-model="editingProduct.promotionPrice" :min="0" :precision="2" placeholder="选填" style="width:100%" />
        </el-form-item>
        <el-form-item label="朝代风格">
          <el-input v-model="editingProduct.dynasty" placeholder="如：唐、宋、明" />
        </el-form-item>
        <el-form-item label="面料材质">
          <el-input v-model="editingProduct.fabric" placeholder="如：真丝、棉麻、雪纺" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Edit, Delete, Plus } from '@element-plus/icons-vue'
import { adminApi } from '@/api'

// ============ 搜索条件 ============
const searchKeyword = ref('')
const searchCategory = ref('')

// ============ 商品列表 ============
const productList = ref([])
const loading = ref(false)

// ============ 分页信息 ============
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

// ============ 编辑 Dialog ============
const dialogVisible = ref(false)
const submitLoading = ref(false)
const formRef = ref(null)
const editingProduct = reactive({
  id: null,
  name: '',
  price: 0,
  stock: 0,
  coverImage: '',
  categoryId: null,
  promotionPrice: 0,
  dynasty: '',
  fabric: ''
})

// 编辑表单验证规则
const formRules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }],
  stock: [{ required: true, message: '请输入库存', trigger: 'blur' }],
  coverImage: [{ required: true, message: '请输入封面图URL', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }]
}

// ============ 方法 ============

/**
 * 获取商品列表（带分页和搜索）
 */
async function fetchProducts() {
  loading.value = true
  try {
    const res = await adminApi.getProducts({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchKeyword.value,
      categoryId: searchCategory.value
    })
    if (res.code === 200) {
      productList.value = res.data.records || []
      pagination.total = res.data.total || 0
    }
  } catch {
    // 错误由请求拦截器处理
  } finally {
    loading.value = false
  }
}

/**
 * 搜索按钮点击
 */
function handleSearch() {
  pagination.page = 1
  fetchProducts()
}

/**
 * 重置搜索条件
 */
function handleReset() {
  searchKeyword.value = ''
  searchCategory.value = ''
  pagination.page = 1
  fetchProducts()
}

/**
 * 格式化价格
 */
function formatPrice(price) {
  if (price === null || price === undefined) return '--'
  return Number(price).toFixed(2)
}

/**
 * 切换商品上下架状态
 */
async function handleToggleStatus(row) {
  try {
    const res = await adminApi.toggleProductStatus(row.id, row.status)
    if (res.code === 200) {
      ElMessage.success(row.status === 1 ? '已上架' : '已下架')
    } else {
      // 切换失败则回退状态
      row.status = row.status === 1 ? 0 : 1
      ElMessage.error(res.message || '操作失败')
    }
  } catch {
    // 异常时回退状态
    row.status = row.status === 1 ? 0 : 1
  }
}

/**
 * 打开编辑 Dialog（新增或编辑）
 */
function handleEdit(row) {
  if (row) {
    Object.assign(editingProduct, {
      id: row.id,
      name: row.name || '',
      price: Number(row.price) || 0,
      stock: row.stock || 0,
      coverImage: row.cover_image || '',
      categoryId: row.category_id || null,
      promotionPrice: Number(row.promotion_price) || 0,
      dynasty: row.dynasty || '',
      fabric: row.fabric || ''
    })
  } else {
    editingProduct.id = null
    editingProduct.name = ''
    editingProduct.price = 0
    editingProduct.stock = 0
    editingProduct.coverImage = ''
    editingProduct.categoryId = null
    editingProduct.promotionPrice = 0
    editingProduct.dynasty = ''
    editingProduct.fabric = ''
  }
  dialogVisible.value = true
}

/**
 * 提交编辑表单
 */
async function handleSubmit() {
  // 表单验证
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    const data = {
      name: editingProduct.name,
      price: editingProduct.price,
      stock: editingProduct.stock,
      coverImage: editingProduct.coverImage,
      categoryId: editingProduct.categoryId,
      promotionPrice: editingProduct.promotionPrice,
      dynasty: editingProduct.dynasty,
      fabric: editingProduct.fabric
    }

    let res
    if (editingProduct.id) {
      // 编辑
      res = await adminApi.updateProduct(editingProduct.id, data)
    } else {
      // 新增
      res = await adminApi.createProduct(data)
    }

    if (res.code === 200) {
      ElMessage.success(editingProduct.id ? '更新成功' : '新增成功')
      dialogVisible.value = false
      fetchProducts()
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } catch {
    // 异常由请求拦截器处理
  } finally {
    submitLoading.value = false
  }
}

/**
 * 删除商品
 */
function handleDelete(row) {
  ElMessageBox.confirm(
    `确定要删除商品「${row.name}」吗？此操作不可恢复。`,
    '删除确认',
    { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' }
  ).then(async () => {
    try {
      const res = await adminApi.deleteProduct(row.id)
      if (res.code === 200) {
        ElMessage.success('删除成功')
        fetchProducts()
      } else {
        ElMessage.error(res.message || '删除失败')
      }
    } catch {
      // 异常已由拦截器处理
    }
  }).catch(() => {
    // 用户取消删除
  })
}

// ============ 页面加载 ============
onMounted(() => {
  fetchProducts()
})
</script>

<style scoped>
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.price-text {
  font-weight: 600;
  color: #e6a23c;
}

.no-image {
  color: #c0c4cc;
  font-size: 12px;
}

.price-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.price-current {
  font-weight: 600;
  color: #C0392B;
}

.price-original {
  font-size: 12px;
  color: #999;
  text-decoration: line-through;
}
</style>
