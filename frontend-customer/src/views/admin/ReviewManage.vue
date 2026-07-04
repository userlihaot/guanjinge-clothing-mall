<!-- ReviewManage.vue - 评价审核页面 -->
<template>
  <div class="review-manage">
    <!-- ========== 筛选栏 ========== -->
    <div class="card-container">
      <div class="search-bar">
        <el-select v-model="filterStatus" placeholder="审核状态" clearable>
          <el-option label="全部" value="" />
          <el-option label="待审核" :value="0" />
          <el-option label="已通过" :value="1" />
          <el-option label="已驳回" :value="2" />
        </el-select>
        <el-button type="primary" :icon="Search" @click="handleSearch">筛选</el-button>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
      </div>
    </div>

    <!-- ========== 评价表格 ========== -->
    <div class="card-container">
      <el-table
        v-loading="loading"
        :data="reviewList"
        stripe
        border
        style="width: 100%"
        empty-text="暂无评价数据"
      >
        <!-- ID -->
        <el-table-column prop="id" label="ID" width="60" align="center" />

        <!-- 商品名 -->
        <el-table-column prop="product_name" label="商品名称" min-width="140" show-overflow-tooltip />

        <!-- 评价内容 -->
        <el-table-column prop="content" label="评价内容" min-width="200" show-overflow-tooltip />

        <!-- 星级评分 -->
        <el-table-column label="星级" width="120" align="center">
          <template #default="{ row }">
            <el-rate
              v-model="row.star"
              disabled
              show-score
              text-color="#ff9900"
              score-template="{value}分"
            />
          </template>
        </el-table-column>

        <!-- 状态 -->
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.is_audited)" size="small">
              {{ getStatusText(row.is_audited) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 审核回复 -->
        <el-table-column prop="seller_reply" label="回复内容" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.seller_reply || '暂无回复' }}
          </template>
        </el-table-column>

        <!-- 操作 -->
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <!-- 待审核状态：可以 通过 / 驳回 -->
            <template v-if="row.is_audited === 0">
              <el-button type="success" size="small" :icon="Select" @click="handleApprove(row)">
                通过
              </el-button>
              <el-button type="danger" size="small" :icon="CloseBold" @click="handleReject(row)">
                驳回
              </el-button>
            </template>
            <!-- 非待审核状态：回复功能 -->
            <el-button
              v-if="row.is_audited !== 0"
              type="primary"
              size="small"
              :icon="ChatDotRound"
              @click="handleReply(row)"
            >
              回复
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
          @size-change="fetchReviews"
          @current-change="fetchReviews"
        />
      </div>
    </div>

    <!-- ========== 驳回原因 Dialog ========== -->
    <el-dialog
      v-model="rejectDialogVisible"
      title="驳回评价"
      width="450px"
      :close-on-click-modal="false"
    >
      <el-form ref="rejectFormRef" :model="rejectForm" :rules="rejectFormRules" label-width="80px">
        <el-form-item label="驳回原因" prop="reason">
          <el-input
            v-model="rejectForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入驳回原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" :loading="rejectLoading" @click="handleRejectSubmit">
          确认驳回
        </el-button>
      </template>
    </el-dialog>

    <!-- ========== 回复 Dialog ========== -->
    <el-dialog
      v-model="replyDialogVisible"
      title="回复评价"
      width="450px"
      :close-on-click-modal="false"
    >
      <el-form ref="replyFormRef" :model="replyForm" :rules="replyFormRules" label-width="80px">
        <el-form-item label="回复内容" prop="reply">
          <el-input
            v-model="replyForm.reply"
            type="textarea"
            :rows="3"
            placeholder="请输入回复内容"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="replyDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="replyLoading" @click="handleReplySubmit">
          确认回复
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Select, CloseBold, ChatDotRound } from '@element-plus/icons-vue'
import { adminApi } from '@/api'

// ============ 筛选条件 ============
const filterStatus = ref('')

// ============ 评价列表 ============
const reviewList = ref([])
const loading = ref(false)

// ============ 分页 ============
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

// ============ 驳回 Dialog ============
const rejectDialogVisible = ref(false)
const rejectLoading = ref(false)
const rejectFormRef = ref(null)
const currentRejectReview = ref(null)
const rejectForm = reactive({ reason: '' })
const rejectFormRules = {
  reason: [{ required: true, message: '请输入驳回原因', trigger: 'blur' }]
}

// ============ 回复 Dialog ============
const replyDialogVisible = ref(false)
const replyLoading = ref(false)
const replyFormRef = ref(null)
const currentReplyReview = ref(null)
const replyForm = reactive({ reply: '' })
const replyFormRules = {
  reply: [{ required: true, message: '请输入回复内容', trigger: 'blur' }]
}

// ============ 状态映射 ============

function getStatusText(audit) {
  const map = { 0: '待审核', 1: '已通过', 2: '已驳回' }
  return map[audit] ?? '未知'
}

function getStatusTagType(audit) {
  const map = { 0: 'warning', 1: 'success', 2: 'danger' }
  return map[audit] || 'info'
}

// ============ 方法 ============

/**
 * 获取评价列表
 */
async function fetchReviews() {
  loading.value = true
  try {
    const res = await adminApi.getReviews({
      page: pagination.page,
      pageSize: pagination.pageSize,
      isAudited: filterStatus.value
    })
    if (res.code === 200) {
      reviewList.value = res.data.records || []
      pagination.total = res.data.total || 0
    }
  } catch {
    // 错误由拦截器处理
  } finally {
    loading.value = false
  }
}

/**
 * 筛选
 */
function handleSearch() {
  pagination.page = 1
  fetchReviews()
}

/**
 * 重置
 */
function handleReset() {
  filterStatus.value = ''
  pagination.page = 1
  fetchReviews()
}

/**
 * 审核通过
 */
async function handleApprove(row) {
  try {
    const res = await adminApi.approveReview(row.id)
    if (res.code === 200) {
      ElMessage.success('已通过该评价')
      row.is_audited = 1
      fetchReviews()
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } catch {
    // 错误由拦截器处理
  }
}

/**
 * 打开驳回 Dialog
 */
function handleReject(row) {
  currentRejectReview.value = row
  rejectForm.reason = ''
  rejectDialogVisible.value = true
}

/**
 * 提交驳回
 */
async function handleRejectSubmit() {
  const valid = await rejectFormRef.value?.validate().catch(() => false)
  if (!valid) return

  rejectLoading.value = true
  try {
    const res = await adminApi.rejectReview(currentRejectReview.value.id, rejectForm.reason)
    if (res.code === 200) {
      ElMessage.success('已驳回该评价')
      rejectDialogVisible.value = false
      currentRejectReview.value.is_audited = 2
      fetchReviews()
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } catch {
    // 错误由拦截器处理
  } finally {
    rejectLoading.value = false
  }
}

/**
 * 打开回复 Dialog
 */
function handleReply(row) {
  currentReplyReview.value = row
  replyForm.reply = row.seller_reply || ''
  replyDialogVisible.value = true
}

/**
 * 提交回复
 */
async function handleReplySubmit() {
  const valid = await replyFormRef.value?.validate().catch(() => false)
  if (!valid) return

  replyLoading.value = true
  try {
    const res = await adminApi.replyReview(currentReplyReview.value.id, replyForm.reply)
    if (res.code === 200) {
      ElMessage.success('回复成功')
      replyDialogVisible.value = false
      currentReplyReview.value.seller_reply = replyForm.reply
      fetchReviews()
    } else {
      ElMessage.error(res.message || '回复失败')
    }
  } catch {
    // 错误由拦截器处理
  } finally {
    replyLoading.value = false
  }
}

// ============ 页面加载 ============
onMounted(() => {
  fetchReviews()
})
</script>

<style scoped>
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
