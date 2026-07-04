<template>
  <div class="refund-manage">
    <div class="card-container">
      <div class="search-bar">
        <el-select v-model="filterStatus" placeholder="退款状态" clearable>
          <el-option label="全部" value="" />
          <el-option label="待处理" :value="0" />
          <el-option label="已同意" :value="3" />
          <el-option label="已拒绝" :value="2" />
        </el-select>
        <el-button type="primary" :icon="Search" @click="handleSearch">筛选</el-button>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
      </div>
    </div>

    <div class="card-container">
      <el-table v-loading="loading" :data="refundList" stripe border style="width:100%" empty-text="暂无退款申请">
        <el-table-column prop="refund_no" label="退款编号" min-width="160" show-overflow-tooltip />
        <el-table-column prop="order_no" label="订单号" min-width="160" show-overflow-tooltip />
        <el-table-column label="退款金额" width="120" align="center">
          <template #default="{ row }"><span class="amount-text">¥{{ fmt(row.refund_amount) }}</span></template>
        </el-table-column>
        <el-table-column prop="reason" label="退款原因" min-width="160" show-overflow-tooltip />
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="处理时间" min-width="150">
          <template #default="{ row }">{{ row.handle_time || '--' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="140" align="center" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 0">
              <el-button type="success" size="small" plain @click="openApprove(row)">同意</el-button>
              <el-button type="danger" size="small" plain @click="openReject(row)">拒绝</el-button>
            </template>
            <template v-else-if="row.status === 1 || row.status === 2 || row.status === 3">
              <el-button type="danger" size="small" link @click="openDelete(row)">删除</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="page" v-model:page-size="pageSize" :total="total"
          :page-sizes="[10,20,50,100]" layout="total,sizes,prev,pager,next,jumper"
          @size-change="fetch" @current-change="fetch"
        />
      </div>
    </div>

    <!-- ========== 同意确认 Dialog ========== -->
    <el-dialog v-model="approveVisible" width="420px" :close-on-click-modal="false" destroy-on-close>
      <template #header>
        <div style="display:flex;align-items:center;gap:8px;font-size:18px;font-weight:600">
          <el-icon :size="22" color="#67C23A"><CircleCheckFilled /></el-icon>
          <span>确认同意退款</span>
        </div>
      </template>
      <div v-if="currentItem" class="confirm-body">
        <p class="confirm-tip">确定同意该退款申请吗？</p>
        <div class="confirm-box">
          <div class="cb-row"><span>退款编号</span><span class="cb-mono">{{ currentItem.refund_no }}</span></div>
          <div class="cb-row"><span>订单号</span><span class="cb-mono">{{ currentItem.order_no }}</span></div>
          <div class="cb-row"><span>退款金额</span><b style="color:#C0392B">¥{{ fmt(currentItem.refund_amount) }}</b></div>
        </div>
      </div>
      <template #footer>
        <el-button @click="approveVisible=false">取消</el-button>
        <el-button type="success" :loading="actionLoading" @click="doApprove">确认同意</el-button>
      </template>
    </el-dialog>

    <!-- ========== 拒绝 Dialog ========== -->
    <el-dialog v-model="rejectVisible" title="拒绝退款" width="450px" :close-on-click-modal="false" destroy-on-close>
      <el-form ref="rejectFormRef" :model="rejectForm" :rules="{reason:[{required:true,message:'请输入拒绝原因',trigger:'blur'}]}" label-width="80px">
        <el-form-item label="拒绝原因" prop="reason">
          <el-input v-model="rejectForm.reason" type="textarea" :rows="3" placeholder="请输入拒绝退款的原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectVisible=false">取消</el-button>
        <el-button type="danger" :loading="actionLoading" @click="doReject">确认拒绝</el-button>
      </template>
    </el-dialog>

    <!-- ========== 删除确认 Dialog ========== -->
    <el-dialog v-model="deleteVisible" width="420px" :close-on-click-modal="false" destroy-on-close>
      <template #header>
        <div style="display:flex;align-items:center;gap:8px;font-size:18px;font-weight:600">
          <el-icon :size="22" color="#E74C3C"><WarningFilled /></el-icon>
          <span>确认删除退款记录</span>
        </div>
      </template>
      <div v-if="currentItem" class="confirm-body">
        <p class="confirm-tip">确定要删除该退款记录吗？<em>删除后不可恢复。</em></p>
        <div class="confirm-box">
          <div class="cb-row"><span>退款编号</span><span class="cb-mono">{{ currentItem.refund_no }}</span></div>
          <div class="cb-row"><span>状态</span><el-tag :type="statusTag(currentItem.status)" size="small">{{ statusText(currentItem.status) }}</el-tag></div>
        </div>
      </div>
      <template #footer>
        <el-button @click="deleteVisible=false">取消</el-button>
        <el-button type="danger" :loading="actionLoading" @click="doDelete">确认删除</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh, WarningFilled, CircleCheckFilled } from '@element-plus/icons-vue'
import { adminApi } from '@/api'

const filterStatus = ref('')
const refundList = ref([])
const loading = ref(false)
const page = ref(1); const pageSize = ref(10); const total = ref(0)

// 通用状态
const currentItem = ref(null)
const actionLoading = ref(false)

// 同意
const approveVisible = ref(false)
// 拒绝
const rejectVisible = ref(false)
const rejectFormRef = ref(null)
const rejectForm = reactive({ reason: '' })
// 删除
const deleteVisible = ref(false)

function statusText(s) { const m={0:'待处理',1:'已同意',2:'已拒绝',3:'已同意'}; return m[s]||'未知' }
function statusTag(s) { const m={0:'warning',1:'success',2:'danger',3:'success'}; return m[s]||'info' }
function fmt(v) { return v===null||v===undefined?'--':Number(v).toFixed(2) }

async function fetch() {
  loading.value = true
  try {
    const res = await adminApi.getRefunds({ page:page.value, pageSize:pageSize.value, status:filterStatus.value })
    if(res.code===200){ refundList.value=res.data.records||[]; total.value=res.data.total||0 }
  } catch {} finally { loading.value = false }
}
function handleSearch() { page.value=1; fetch() }
function handleReset() { filterStatus.value=''; page.value=1; fetch() }

// 同意
function openApprove(row) { currentItem.value=row; approveVisible.value=true }
async function doApprove() {
  actionLoading.value=true
  try {
    const res = await adminApi.handleRefund(currentItem.value.id, { status:1 })
    if(res.code===200){ ElMessage.success('已同意退款'); approveVisible.value=false; currentItem.value.status=1; fetch() }
    else ElMessage.error(res.message||'操作失败')
  } catch {} finally { actionLoading.value=false }
}

// 拒绝
function openReject(row) { currentItem.value=row; rejectForm.reason=''; rejectVisible.value=true }
async function doReject() {
  const valid = await rejectFormRef.value?.validate().catch(()=>false); if(!valid) return
  actionLoading.value=true
  try {
    const res = await adminApi.handleRefund(currentItem.value.id, { status:2, refuseReason:rejectForm.reason })
    if(res.code===200){ ElMessage.success('已拒绝退款'); rejectVisible.value=false; currentItem.value.status=2; fetch() }
    else ElMessage.error(res.message||'操作失败')
  } catch {} finally { actionLoading.value=false }
}

// 删除
function openDelete(row) { currentItem.value=row; deleteVisible.value=true }
async function doDelete() {
  actionLoading.value=true
  try {
    const res = await adminApi.deleteRefund(currentItem.value.id)
    if(res.code===200){ ElMessage.success('删除成功'); deleteVisible.value=false; fetch() }
    else ElMessage.error(res.message||'删除失败')
  } catch {} finally { actionLoading.value=false }
}

onMounted(()=>fetch())
</script>

<style scoped>
.pagination-wrap { display:flex; justify-content:flex-end; margin-top:16px; padding-top:16px; border-top:1px solid #ebeef5 }
.amount-text { font-weight:600; color:#e6a23c }
.confirm-tip { font-size:14px; color:#606266; margin-bottom:14px; line-height:1.6 }
.confirm-tip em { color:#E74C3C; font-weight:600; font-style:normal }
.confirm-box { background:#f5f7fa; border-radius:8px; padding:12px 16px }
.cb-row { display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px dashed #e4e7ed; font-size:14px; color:#606266 }
.cb-row:last-child { border-bottom:none }
.cb-mono { font-family:monospace; font-size:13px; color:#303133 }
</style>
