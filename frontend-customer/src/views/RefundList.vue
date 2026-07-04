<template>
  <div class="refund-list-page page-container">
    <h1 class="page-title">我的退款</h1>

    <!-- 加载中 -->
    <div v-if="loading" class="loading-section">
      <el-skeleton :rows="5" animated />
    </div>

    <!-- 空状态 -->
    <div v-else-if="refundList.length === 0" class="empty-section">
      <el-empty description="暂无退款记录">
        <el-button type="primary" @click="$router.push('/orders')">查看订单</el-button>
      </el-empty>
    </div>

    <!-- 退款列表 -->
    <div v-else class="refund-list">
      <div v-for="item in refundList" :key="item.id" class="refund-card">
        <div class="refund-header">
          <div class="rh-left">
            <span class="rh-label">退款编号：</span>
            <span class="rh-no">{{ item.refund_no }}</span>
            <span class="rh-divider">|</span>
            <span>关联订单：{{ item.order_no }}</span>
          </div>
          <div class="rh-right">
            <el-tag :type="statusTagType(item.status)" size="small">
              {{ statusText(item.status) }}
            </el-tag>
          </div>
        </div>

        <div class="refund-body">
          <div class="rb-info">
            <div class="rb-item">
              <span class="rb-label">退款类型：</span>
              <span>{{ item.type === 2 ? '退货退款' : '仅退款' }}</span>
            </div>
            <div class="rb-item">
              <span class="rb-label">退款金额：</span>
              <span class="rb-amount">&yen;{{ Number(item.refund_amount).toFixed(2) }}</span>
            </div>
            <div class="rb-item">
              <span class="rb-label">申请时间：</span>
              <span>{{ item.create_time }}</span>
            </div>
            <div class="rb-item" v-if="item.handle_time">
              <span class="rb-label">处理时间：</span>
              <span>{{ item.handle_time }}</span>
            </div>
          </div>
          <div class="rb-reason">
            <span class="rb-label">退款原因：</span>
            <span>{{ item.reason }}</span>
          </div>
          <!-- 拒绝原因 -->
          <div v-if="item.status === 2 && item.refuse_reason" class="rb-refuse">
            <span class="rb-label">拒绝原因：</span>
            <span>{{ item.refuse_reason }}</span>
          </div>
          <!-- 退货物流信息 -->
          <div v-if="item.return_logistics_company" class="rb-logistics">
            <span class="rb-label">退货物流：</span>
            <span>{{ item.return_logistics_company }}（{{ item.return_logistics_no }}）</span>
          </div>
        </div>

        <div class="refund-footer">
          <!-- 待审核：取消申请 -->
          <template v-if="item.status === 0">
            <el-button size="small" @click="handleCancel(item)">取消申请</el-button>
          </template>
          <!-- 已同意 + 退货退款 + 未填物流：提交退货物流 -->
          <template v-if="item.status === 1 && item.type === 2 && !item.return_logistics_company">
            <el-button type="primary" size="small" @click="openLogisticsDialog(item)">
              提交退货物流
            </el-button>
          </template>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination-wrap" v-if="total > pageSize">
      <el-pagination
        v-model:current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        background
        @current-change="fetchRefunds"
      />
    </div>

    <!-- 退货物流弹窗 -->
    <el-dialog
      v-model="logisticsDialogVisible"
      title="提交退货物流"
      width="450px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form ref="logisticsFormRef" :model="logisticsForm" :rules="logisticsRules" label-width="90px">
        <el-form-item label="快递公司" prop="company">
          <el-select v-model="logisticsForm.company" placeholder="请选择快递公司" style="width:100%">
            <el-option label="顺丰速运" value="顺丰速运" />
            <el-option label="中通快递" value="中通快递" />
            <el-option label="圆通速递" value="圆通速递" />
            <el-option label="韵达快递" value="韵达快递" />
            <el-option label="申通快递" value="申通快递" />
            <el-option label="京东物流" value="京东物流" />
            <el-option label="邮政EMS" value="邮政EMS" />
          </el-select>
        </el-form-item>
        <el-form-item label="快递单号" prop="logisticsNo">
          <el-input v-model="logisticsForm.logisticsNo" placeholder="请输入快递单号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="logisticsDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="logisticsLoading" @click="handleSubmitLogistics">
          确认提交
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { refundApi } from '@/api'

const refundList = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 状态映射
function statusText(status) {
  const map = { 0: '待审核', 1: '已同意', 2: '已拒绝', 3: '已完成' }
  return map[status] ?? '未知'
}
function statusTagType(status) {
  const map = { 0: 'warning', 1: 'success', 2: 'danger', 3: 'info' }
  return map[status] || 'info'
}

// 获取退款列表
async function fetchRefunds() {
  loading.value = true
  try {
    const res = await refundApi.getList({ page: page.value, size: pageSize.value })
    const data = res.data || res
    refundList.value = data.records || data.list || (Array.isArray(data) ? data : [])
    total.value = data.total || 0
  } catch {
    refundList.value = []
  } finally { loading.value = false }
}

// 取消退款申请
function handleCancel(item) {
  ElMessageBox.confirm('确定要取消该退款申请吗？', '取消申请', {
    confirmButtonText: '确定', cancelButtonText: '返回', type: 'warning',
  }).then(async () => {
    try {
      await refundApi.cancel(item.id)
      ElMessage.success('退款申请已取消')
      fetchRefunds()
    } catch { /* handled */ }
  }).catch(() => {})
}

// 退货物流
const logisticsDialogVisible = ref(false)
const logisticsLoading = ref(false)
const logisticsFormRef = ref(null)
const currentRefund = ref(null)
const logisticsForm = reactive({ company: '', logisticsNo: '' })
const logisticsRules = {
  company: [{ required: true, message: '请选择快递公司', trigger: 'change' }],
  logisticsNo: [{ required: true, message: '请输入快递单号', trigger: 'blur' }],
}

function openLogisticsDialog(item) {
  currentRefund.value = item
  logisticsForm.company = ''
  logisticsForm.logisticsNo = ''
  logisticsDialogVisible.value = true
}

async function handleSubmitLogistics() {
  const valid = await logisticsFormRef.value?.validate().catch(() => false)
  if (!valid) return
  logisticsLoading.value = true
  try {
    await refundApi.submitLogistics({
      refundId: currentRefund.value.id,
      company: logisticsForm.company,
      logisticsNo: logisticsForm.logisticsNo,
    })
    ElMessage.success('退货物流已提交')
    logisticsDialogVisible.value = false
    fetchRefunds()
  } catch { /* handled */ } finally { logisticsLoading.value = false }
}

onMounted(() => fetchRefunds())
</script>

<style scoped>
.loading-section,
.empty-section {
  background: var(--color-bg-white);
  border-radius: var(--radius-base);
  padding: var(--spacing-xl);
}

.refund-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.refund-card {
  background: var(--color-bg-white);
  border-radius: var(--radius-base);
  border: 1px solid var(--color-border-light);
  overflow: hidden;
}

.refund-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  background: #FDF5ED;
  border-bottom: 1px solid var(--color-border-light);
  font-size: 13px;
  color: var(--color-text-secondary);
}

.rh-no { font-family: monospace; color: var(--color-text-primary); }
.rh-divider { margin: 0 8px; color: var(--color-border-light); }

.refund-body {
  padding: var(--spacing-md) var(--spacing-lg);
}

.rb-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: var(--spacing-sm);
}

.rb-item { font-size: 14px; color: var(--color-text-regular); }
.rb-label { color: var(--color-text-secondary); }
.rb-amount { color: #C0392B; font-weight: 600; }

.rb-reason {
  font-size: 14px;
  color: var(--color-text-regular);
  padding-top: var(--spacing-sm);
  border-top: 1px dashed var(--color-border-light);
}

.rb-refuse {
  font-size: 14px;
  color: #E74C3C;
  padding-top: var(--spacing-sm);
  background: #FFF5F5;
  padding: var(--spacing-sm);
  border-radius: var(--radius-small);
  margin-top: var(--spacing-sm);
}

.rb-logistics {
  font-size: 14px;
  color: #2980B9;
  padding-top: var(--spacing-sm);
}

.refund-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  border-top: 1px solid var(--color-border-light);
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  padding: var(--spacing-xl) 0;
}
</style>
