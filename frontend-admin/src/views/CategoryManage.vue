<!-- CategoryManage.vue - 商品分类管理页面 -->
<!-- 说明：此页面原先只存在于 frontend-customer/src/views/admin/ 下的重复后台副本中，
     frontend-admin 一直缺少分类管理入口（后端 /api/admin/categories 的 4 个接口早就存在）。
     合并重复后台时把它移到这里，接口契约与后端 admin.js:363-388 一致：{ name, icon, sortOrder }。 -->
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
            <!--
              先立即显示默认图标（emoji/文字），不等图片请求。
              图片只在真正加载成功（@load）后才替换上去；加载失败就一直保留默认图标。
              这样即使 icon 是失效的外链，也不会出现几秒空白 —— 之前是等图片超时才回退的。
            -->
            <span class="cat-icon-cell">
              <span v-if="!loadedIcons[row.id]" class="cat-icon-text">{{ iconText(row) }}</span>
              <img
                v-if="isImageIcon(row.icon)"
                :src="row.icon"
                class="cat-icon-img"
                :class="{ 'is-loaded': loadedIcons[row.id] }"
                :alt="row.name"
                @load="loadedIcons[row.id] = true"
              />
            </span>
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
        <el-form-item label="图标" help="推荐直接用 Emoji（如 👘），不依赖外部图床；也可填写图片地址">
          <el-input v-model="editing.icon" placeholder="Emoji（如 👘）或图片地址" />
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

// 记录哪些行的图片已经确认加载成功，成功后把默认图标替换成图片
const loadedIcons = reactive({})

/**
 * 判断 icon 字段是否是一个图片地址。
 * 除了 http(s) 绝对地址，也要支持相对路径（如 /image/xxx.jpg）和 data URI，
 * 因为本项目商品图用的就是相对路径（/image/商品名.jpg），分类图标同理。
 */
function isImageIcon(val) {
  if (!val) return false
  const s = String(val).trim()
  return /^(https?:\/\/|\/|\.\/|data:image\/)/i.test(s)
}

/**
 * 分类默认图标。
 * 与商城前台 HomeView.vue 的 categories 保持一致，
 * 用于 icon 为空、或 icon 是图片地址但加载失败时的兜底显示。
 * 这样即使数据库里存的是失效的外链，列表也不会出现空白/破图。
 */
const DEFAULT_CATEGORY_ICONS = {
  '唐制汉服': '👘',
  '宋制汉服': '🎋',
  '明制汉服': '🏮',
  '古风婚服': '💒',
  '古风配饰': '💎',
  '改良古装': '✨',
  '古风演出服': '🎭',
}
const FALLBACK_ICON = '🏷️'

/**
 * 单元格里显示的图标内容：
 * - Emoji / 普通文字：原样显示
 * - 图片地址但加载失败，或 icon 为空：回退到默认图标（不显示原始 URL，也不留空）
 */
function iconText(row) {
  const s = String(row.icon || '').trim()
  if (s && !isImageIcon(s)) return s
  return DEFAULT_CATEGORY_ICONS[String(row.name || '').trim()] || FALLBACK_ICON
}

async function fetchCategories() {
  loading.value = true
  try {
    const res = await adminApi.getCategories()
    if (res.code === 200) {
      // 后端返回扁平数组（无分页）
      const data = res.data
      categoryList.value = Array.isArray(data) ? data : (data?.records || data?.list || [])
    }
  } catch {
    // 错误由拦截器处理
  } finally {
    loading.value = false
  }
}

function handleAdd() {
  editing.id = null; editing.name = ''; editing.icon = ''; editing.sortOrder = 0
  dialogVisible.value = true
}

function handleEdit(row) {
  editing.id = row.id
  editing.name = row.name
  editing.icon = row.icon || ''
  editing.sortOrder = row.sort_order || 0
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    const data = { name: editing.name, icon: editing.icon, sortOrder: editing.sortOrder }
    const res = editing.id
      ? await adminApi.updateCategory(editing.id, data)
      : await adminApi.createCategory(data)
    if (res && res.code === 200) {
      ElMessage.success(editing.id ? '更新成功' : '创建成功')
      dialogVisible.value = false
      fetchCategories()
    }
  } catch {
    // 错误由拦截器处理
  } finally {
    submitLoading.value = false
  }
}

function handleDelete(row) {
  ElMessageBox.confirm(`确定要删除分类「${row.name}」吗？`, '删除确认', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
  }).then(async () => {
    try {
      const res = await adminApi.deleteCategory(row.id)
      if (res && res.code === 200) {
        ElMessage.success('删除成功')
        fetchCategories()
      }
    } catch {
      // 错误由拦截器处理
    }
  }).catch(() => {})
}

onMounted(() => fetchCategories())
</script>

<style scoped>
/* 图标单元格：给绝对定位的图片一个稳定的占位尺寸，避免加载前后行高跳动 */
.cat-icon-cell {
  position: relative;
  display: inline-block;
  width: 28px;
  height: 28px;
  line-height: 28px;
  vertical-align: middle;
}

.cat-icon-img {
  width: 28px;
  height: 28px;
  object-fit: contain;
  border-radius: var(--radius-small);
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  /* 未确认加载成功前不可见；用 visibility 而不是 display，
     因为 display:none 在部分浏览器下可能不触发图片请求 */
  visibility: hidden;
}

.cat-icon-img.is-loaded {
  visibility: visible;
}

.cat-icon-text {
  font-size: 20px;
  line-height: 28px;
  display: inline-block;
  color: var(--color-text-secondary);
}
</style>
