<!-- RefundManage.vue - 退款处理页面 -->
<template>
  <div class="refund-manage">
    <!-- ========== 筛选栏 ========== -->
    <div class="card-container">
      <div class="search-bar">
        <el-select v-model="filterStatus" placeholder="退款状态" clearable>
          <el-option label="全部" value="" />
          <el-option label="待处理" :value="0" />
          <el-option label="已同意" :value="1" />
          <el-option label="已拒绝" :value="2" />
        </el-select>
        <el-button type="primary" :icon="Search" @click="handleSearch">筛选</el-button>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
      </div>
    </div>

    <!-- ========== 退款表格 ========== -->
    <div class="card-container">
      <el-table
        v-loading="loading"
        :data="refundList"
        stripe
        border
        style="width: 100%"
        empty-text="暂无退款申请"
      >
        <!-- 退款编号 -->
        <el-table-column prop="refund_no" label="退款编号" min-width="160" show-overflow-tooltip />

        <!-- 订单号 -->
        <el-table-column prop="order_no" label="订单号" min-width="160" show-overflow-tooltip />

        <!-- 退款金额 -->
        <el-table-column label="退款金额 (¥)" width="120" align="center">
          <template #default="{ row }">
            <span class="amount-text">¥{{ formatAmount(row.refund_amount) }}</span>
          </template>
        </el-table-column>

        <!-- 退款原因 -->
        <el-table-column prop="reason" label="退款原因" min-width="180" show-overflow-tooltip />

        <!-- 状态 -->
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 处理时间 -->
        <el-table-column prop="handle_time" label="处理时间" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.handle_time || '--' }}
          </template>
        </el-table-column>

        <!-- 操作 -->
        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 0">
              <el-button type="success" size="small" :icon="Select" @click="handleApprove(row)">
                同意
              </el-button>
              <el-button type="danger" size="small" :icon="CloseBold" @click="handleReject(row)">
                拒绝
              </el-button>
            </template>
            <span v-else class="handled-text">已处理</span>
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
          @size-change="fetchRefunds"
          @current-change="fetchRefunds"
        />
      </div>
    </div>

    <!-- ========== 拒绝退款 Dialog ========== -->
    <el-dialog
      v-model="rejectDialogVisible"
      title="拒绝退款"
      width="450px"
      :close-on-click-modal="false"
    >
      <el-form ref="rejectFormRef" :model="rejectForm" :rules="rejectFormRules" label-width="80px">
        <el-form-item label="拒绝原因" prop="reason">
          <el-input
            v-model="rejectForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入拒绝退款的原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" :loading="rejectLoading" @click="handleRejectSubmit">
          确认拒绝
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Select, CloseBold } from '@element-plus/icons-vue'
import { adminApi } from '@/api'

// ============ 筛选条件 ============
const filterStatus = ref('')

// ============ 退款列表 ============
const refundList = ref([])
const loading = ref(false)

// ============ 分页 ============
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

// ============ 拒绝 Dialog ============
const rejectDialogVisible = ref(false)
const rejectLoading = ref(false)
const rejectFormRef = ref(null)
const currentRejectRefund = ref(null)
const rejectForm = reactive({ reason: '' })
const rejectFormRules = {
  reason: [{ required: true, message: '请输入拒绝原因', trigger: 'blur' }]
}

// ============ 状态映射 ============

function getStatusText(status) {
  const map = { 0: '待处理', 1: '已同意', 2: '已拒绝' }
  return map[status] || '未知'
}

function getStatusTagType(status) {
  const map = { 0: 'warning', 1: 'success', 2: 'danger' }
  return map[status] || 'info'
}

function formatAmount(val) {
  if (val === null || val === undefined) return '--'
  return Number(val).toFixed(2)
}

// ============ 方法 ============

/**
 * 获取退款列表
 */
async function fetchRefunds() {
  loading.value = true
  try {
    const res = await adminApi.getRefunds({
      page: pagination.page,
      pageSize: pagination.pageSize,
      status: filterStatus.value
    })
    if (res.code === 200) {
      refundList.value = res.data.records || []
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
  fetchRefunds()
}

/**
 * 重置
 */
function handleReset() {
  filterStatus.value = ''
  pagination.page = 1
  fetchRefunds()
}

/**
 * 同意退款
 */
function handleApprove(row) {
  ElMessageBox.confirm(
    `确定同意退款 ¥${formatAmount(row.refund_amount)} 吗？`,
    '同意退款确认',
    { confirmButtonText: '确定同意', cancelButtonText: '取消', type: 'warning' }
  ).then(async () => {
    try {
      const res = await adminApi.approveRefund(row.id)
      if (res.code === 200) {
        ElMessage.success('已同意退款')
        row.status = 1
        fetchRefunds()
      } else {
        ElMessage.error(res.message || '操作失败')
      }
    } catch {
      // 错误由拦截器处理
    }
  }).catch(() => {
    // 用户取消
  })
}

/**
 * 打开拒绝 Dialog
 */
function handleReject(row) {
  currentRejectRefund.value = row
  rejectForm.reason = ''
  rejectDialogVisible.value = true
}

/**
 * 提交拒绝退款
 */
async function handleRejectSubmit() {
  const valid = await rejectFormRef.value?.validate().catch(() => false)
  if (!valid) return

  rejectLoading.value = true
  try {
    const res = await adminApi.rejectRefund(currentRejectRefund.value.id, rejectForm.reason)
    if (res.code === 200) {
      ElMessage.success('已拒绝退款')
      rejectDialogVisible.value = false
      currentRejectRefund.value.status = 2
      fetchRefunds()
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } catch {
    // 错误由拦截器处理
  } finally {
    rejectLoading.value = false
  }
}

// ============ 页面加载 ============
onMounted(() => {
  fetchRefunds()
})
</script>

<style scoped>
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.amount-text {
  font-weight: 600;
  color: #e6a23c;
}

.handled-text {
  color: #c0c4cc;
  font-size: 13px;
}
</style>
