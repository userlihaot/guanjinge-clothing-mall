<!-- BannerManage.vue - 轮播图管理页面 -->
<template>
  <div class="banner-manage">
    <!-- ========== 操作栏 ========== -->
    <div class="card-container">
      <el-button type="primary" :icon="Plus" @click="handleAdd">新增轮播图</el-button>
    </div>

    <!-- ========== 轮播图表格 ========== -->
    <div class="card-container">
      <el-table
        v-loading="loading"
        :data="bannerList"
        stripe
        border
        style="width: 100%"
        empty-text="暂无轮播图"
      >
        <!-- ID -->
        <el-table-column prop="id" label="ID" width="60" align="center" />

        <!-- 标题 -->
        <el-table-column prop="title" label="标题" min-width="140" show-overflow-tooltip />

        <!-- 图片预览 -->
        <el-table-column label="图片预览" width="120" align="center">
          <template #default="{ row }">
            <el-image
              v-if="row.image_url"
              :src="row.image_url"
              style="width: 80px; height: 45px; border-radius: 4px"
              fit="cover"
              :preview-src-list="[row.image_url]"
              preview-teleported
            />
            <span v-else class="no-image">无图</span>
          </template>
        </el-table-column>

        <!-- 链接 -->
        <el-table-column prop="link_url" label="跳转链接" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.link_url || '无' }}
          </template>
        </el-table-column>

        <!-- 排序 -->
        <el-table-column prop="sort_order" label="排序" width="70" align="center" />

        <!-- 状态 -->
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 操作 -->
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
          @size-change="fetchBanners"
          @current-change="fetchBanners"
        />
      </div>
    </div>

    <!-- ========== 新增/编辑 Dialog ========== -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingBanner.id ? '编辑轮播图' : '新增轮播图'"
      width="500px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="editingBanner"
        :rules="formRules"
        label-width="80px"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="editingBanner.title" placeholder="请输入轮播图标题" />
        </el-form-item>
        <el-form-item label="图片URL" prop="imageUrl">
          <el-input v-model="editingBanner.imageUrl" placeholder="请输入图片URL地址" />
        </el-form-item>
        <el-form-item label="跳转链接" prop="linkUrl">
          <el-input v-model="editingBanner.linkUrl" placeholder="点击轮播图跳转的链接（选填）" />
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number
            v-model="editingBanner.sortOrder"
            :min="0"
            :step="1"
            placeholder="数值越小越靠前"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch
            v-model="editingBanner.status"
            :active-value="1"
            :inactive-value="0"
            active-text="启用"
            inactive-text="禁用"
          />
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
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import { adminApi } from '@/api'

// ============ 轮播图列表 ============
const bannerList = ref([])
const loading = ref(false)

// ============ 分页 ============
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

// ============ 编辑 Dialog ============
const dialogVisible = ref(false)
const submitLoading = ref(false)
const formRef = ref(null)
const editingBanner = reactive({
  id: null,
  title: '',
  imageUrl: '',
  linkUrl: '',
  sortOrder: 0,
  status: 1
})

const formRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  imageUrl: [{ required: true, message: '请输入图片URL', trigger: 'blur' }],
  sortOrder: [{ required: true, message: '请输入排序', trigger: 'blur' }]
}

// ============ 方法 ============

/**
 * 获取轮播图列表
 */
async function fetchBanners() {
  loading.value = true
  try {
    const res = await adminApi.getBanners({
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    if (res.code === 200) {
      bannerList.value = res.data.records || []
      pagination.total = res.data.total || 0
    }
  } catch {
    // 错误由拦截器处理
  } finally {
    loading.value = false
  }
}

/**
 * 打开新增 Dialog
 */
function handleAdd() {
  editingBanner.id = null
  editingBanner.title = ''
  editingBanner.imageUrl = ''
  editingBanner.linkUrl = ''
  editingBanner.sortOrder = 0
  editingBanner.status = 1
  dialogVisible.value = true
}

/**
 * 打开编辑 Dialog
 */
function handleEdit(row) {
  Object.assign(editingBanner, {
    id: row.id,
    title: row.title || '',
    imageUrl: row.image_url || '',
    linkUrl: row.link_url || '',
    sortOrder: row.sort_order || 0,
    status: row.status ?? 1
  })
  dialogVisible.value = true
}

/**
 * 提交表单
 */
async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    const data = {
      title: editingBanner.title,
      imageUrl: editingBanner.imageUrl,
      linkUrl: editingBanner.linkUrl,
      sortOrder: editingBanner.sortOrder,
      status: editingBanner.status
    }

    let res
    if (editingBanner.id) {
      res = await adminApi.updateBanner(editingBanner.id, data)
    } else {
      res = await adminApi.createBanner(data)
    }

    if (res.code === 200) {
      ElMessage.success(editingBanner.id ? '更新成功' : '新增成功')
      dialogVisible.value = false
      fetchBanners()
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } catch {
    // 错误由拦截器处理
  } finally {
    submitLoading.value = false
  }
}

/**
 * 删除轮播图
 */
function handleDelete(row) {
  ElMessageBox.confirm(
    `确定要删除轮播图「${row.title}」吗？`,
    '删除确认',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
  ).then(async () => {
    try {
      const res = await adminApi.deleteBanner(row.id)
      if (res.code === 200) {
        ElMessage.success('删除成功')
        fetchBanners()
      } else {
        ElMessage.error(res.message || '删除失败')
      }
    } catch {
      // 错误由拦截器处理
    }
  }).catch(() => {
    // 用户取消
  })
}

// ============ 页面加载 ============
onMounted(() => {
  fetchBanners()
})
</script>

<style scoped>
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.no-image {
  color: #c0c4cc;
  font-size: 12px;
}
</style>
