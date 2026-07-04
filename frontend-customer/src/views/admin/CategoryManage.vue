<!-- CategoryManage.vue - 商品分类管理页面 -->
<template>
  <div class="category-manage">
    <!-- ========== 操作栏 ========== -->
    <div class="card-container">
      <el-button type="primary" :icon="Plus" @click="handleAdd">新增分类</el-button>
    </div>

    <!-- ========== 分类表格 ========== -->
    <div class="card-container">
      <el-table
        v-loading="loading"
        :data="categoryList"
        stripe
        border
        style="width: 100%"
        empty-text="暂无分类数据"
      >
        <el-table-column prop="id" label="ID" width="60" align="center" />
        <el-table-column prop="name" label="分类名称" min-width="150" />
        <el-table-column prop="icon" label="图标" width="100" align="center">
          <template #default="{ row }">
            <img v-if="isImageUrl(row.icon)" :src="row.icon" class="cat-icon-img" />
            <span v-else class="cat-icon-text">{{ row.icon || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="sort_order" label="排序" width="80" align="center" />
        <el-table-column label="操作" width="140" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" :icon="Edit" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" size="small" :icon="Delete" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- ========== 新增/编辑 Dialog ========== -->
    <el-dialog
      v-model="dialogVisible"
      :title="editing.id ? '编辑分类' : '新增分类'"
      width="450px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form ref="formRef" :model="editing" :rules="formRules" label-width="80px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="editing.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="图标" help="可输入图片URL或Emoji文字">
          <el-input v-model="editing.icon" placeholder="输入图片URL或Emoji（如🌸）" />
        </el-form-item>
        <el-form-item label="排序值" prop="sortOrder">
          <el-input-number v-model="editing.sortOrder" :min="0" :step="1" style="width:100%" />
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

const categoryList = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const submitLoading = ref(false)
const formRef = ref(null)

const editing = reactive({ id: null, name: '', icon: '', sortOrder: 0 })
const formRules = { name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }] }

function isImageUrl(val) {
  return val && /^https?:\/\//.test(val)
}

async function fetchCategories() {
  loading.value = true
  try {
    const res = await adminApi.getCategories()
    if (res.code === 200) {
      categoryList.value = res.data || []
    }
  } catch { /* 拦截器处理 */ } finally { loading.value = false }
}

function handleAdd() {
  editing.id = null; editing.name = ''; editing.icon = ''; editing.sortOrder = 0
  dialogVisible.value = true
}

function handleEdit(row) {
  editing.id = row.id; editing.name = row.name; editing.icon = row.icon || ''; editing.sortOrder = row.sort_order || 0
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    const data = { name: editing.name, icon: editing.icon, sortOrder: editing.sortOrder }
    let res
    if (editing.id) {
      res = await adminApi.updateCategory(editing.id, data)
    } else {
      res = await adminApi.createCategory(data)
    }
    if (res.code === 200) {
      ElMessage.success(editing.id ? '更新成功' : '创建成功')
      dialogVisible.value = false
      fetchCategories()
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } catch { /* 拦截器处理 */ } finally { submitLoading.value = false }
}

function handleDelete(row) {
  ElMessageBox.confirm(`确定要删除分类「${row.name}」吗？`, '删除确认', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
  }).then(async () => {
    try {
      const res = await adminApi.deleteCategory(row.id)
      if (res.code === 200) { ElMessage.success('删除成功'); fetchCategories() }
      else { ElMessage.error(res.message || '删除失败') }
    } catch { /* 拦截器处理 */ }
  }).catch(() => {})
}

onMounted(() => fetchCategories())
</script>
