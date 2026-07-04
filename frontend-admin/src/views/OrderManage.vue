<!-- OrderManage.vue - 订单管理页面 -->
<template>
  <div class="order-manage">
    <!-- ========== 筛选栏 ========== -->
    <div class="card-container">
      <div class="search-bar">
        <el-input
          v-model="filterOrderNo"
          placeholder="输入订单号搜索"
          clearable
          @keyup.enter="handleSearch"
        />
        <el-select v-model="filterStatus" placeholder="订单状态" clearable>
          <el-option label="全部" value="" />
          <el-option label="待付款" :value="0" />
          <el-option label="待发货" :value="1" />
          <el-option label="已发货" :value="2" />
          <el-option label="已完成" :value="3" />
          <el-option label="待评价" :value="7" />
          <el-option label="已取消" :value="4" />
          <el-option label="退款中" :value="5" />
          <el-option label="已退款" :value="6" />
        </el-select>
        <el-button type="primary" :icon="Search" @click="handleSearch">筛选</el-button>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
      </div>
    </div>

    <!-- ========== 订单表格 ========== -->
    <div class="card-container">
      <el-table v-loading="loading" :data="orderList" stripe border style="width:100%" empty-text="暂无订单数据">
        <el-table-column prop="order_no" label="订单号" min-width="180" show-overflow-tooltip />
        <el-table-column label="金额 (¥)" width="120" align="center">
          <template #default="{ row }"><span class="amount-text">¥{{ formatAmount(row.real_amount) }}</span></template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="receiver_name" label="收货人" width="100" />
        <el-table-column prop="create_time" label="下单时间" min-width="160" show-overflow-tooltip />
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 1" type="primary" size="small" :icon="Van" @click="handleShip(row)">发货</el-button>
            <el-button type="info" size="small" :icon="View" link @click="handleViewDetail(row)">详情</el-button>
            <el-button
              v-if="row.status === 3 || row.status === 4 || row.status === 5 || row.status === 6 || row.status === 7"
              type="danger" size="small" :icon="Delete" link
              @click="openDeleteConfirm(row)"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize"
          :total="pagination.total" :page-sizes="[10,20,50,100]"
          layout="total,sizes,prev,pager,next,jumper"
          @size-change="fetchOrders" @current-change="fetchOrders"
        />
      </div>
    </div>

    <!-- ========== 订单详情 Dialog ========== -->
    <el-dialog v-model="detailVisible" title="订单详情" width="750px" destroy-on-close>
      <template v-if="detailOrder">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="订单号">{{ detailOrder.order_no }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(detailOrder.status)" size="small">{{ getStatusText(detailOrder.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="收货人">{{ detailOrder.receiver_name }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ detailOrder.receiver_phone }}</el-descriptions-item>
          <el-descriptions-item label="收货地址" :span="2">{{ detailOrder.receiver_address }}</el-descriptions-item>
          <el-descriptions-item label="商品总额">¥{{ formatAmount(detailOrder.total_amount) }}</el-descriptions-item>
          <el-descriptions-item label="运费">¥{{ formatAmount(detailOrder.freight) }}</el-descriptions-item>
          <el-descriptions-item label="优惠券抵扣" v-if="detailOrder.coupon_discount>0">-¥{{ formatAmount(detailOrder.coupon_discount) }}</el-descriptions-item>
          <el-descriptions-item label="实付金额"><b style="color:#C0392B">¥{{ formatAmount(detailOrder.real_amount) }}</b></el-descriptions-item>
          <el-descriptions-item label="下单时间">{{ detailOrder.create_time }}</el-descriptions-item>
          <el-descriptions-item v-if="detailOrder.pay_time" label="付款时间">{{ detailOrder.pay_time }}</el-descriptions-item>
          <el-descriptions-item v-if="detailOrder.logistics_company" label="快递公司">{{ detailOrder.logistics_company }}</el-descriptions-item>
          <el-descriptions-item v-if="detailOrder.logistics_no" label="快递单号">{{ detailOrder.logistics_no }}</el-descriptions-item>
          <el-descriptions-item v-if="detailOrder.buyer_message" label="买家留言" :span="2">{{ detailOrder.buyer_message }}</el-descriptions-item>
        </el-descriptions>

        <h4 style="margin:16px 0 8px">商品明细</h4>
        <el-table :data="detailOrder.itemList || []" size="small" border>
          <el-table-column label="商品" min-width="260">
            <template #default="{ row: item }">
              <div style="display:flex;align-items:center;gap:10px">
                <img :src="item.product_image || ''" style="width:50px;height:62px;border-radius:4px;object-fit:cover;background:#FDF5ED" @error="e=>e.target.style.display='none'" />
                <div>
                  <p>{{ item.product_name }}</p>
                  <p v-if="item.sku_name" style="font-size:12px;color:#999">{{ item.sku_name }}</p>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="单价" width="100" align="center">
            <template #default="{ row: item }">¥{{ Number(item.price).toFixed(2) }}</template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" width="80" align="center" />
          <el-table-column label="小计" width="100" align="center">
            <template #default="{ row: item }"><span style="color:#C0392B;font-weight:600">¥{{ (item.price*item.quantity).toFixed(2) }}</span></template>
          </el-table-column>
        </el-table>
      </template>
    </el-dialog>

    <!-- ========== 删除确认 Dialog ========== -->
    <el-dialog v-model="deleteDialogVisible" width="440px" :close-on-click-modal="false" destroy-on-close>
      <template #header>
        <div style="display:flex;align-items:center;gap:8px;font-size:18px;font-weight:600">
          <el-icon :size="22" color="#E74C3C"><WarningFilled /></el-icon>
          <span>确认删除订单</span>
        </div>
      </template>
      <div v-if="deleteTargetOrder" class="delete-confirm-body">
        <p class="delete-tip">确定要删除以下订单吗？<em>删除后不可恢复。</em></p>
        <div class="delete-order-info">
          <div class="doi-row"><span>订单号</span><span class="doi-mono">{{ deleteTargetOrder.order_no }}</span></div>
          <div class="doi-row"><span>状态</span><el-tag :type="getStatusType(deleteTargetOrder.status)" size="small">{{ getStatusText(deleteTargetOrder.status) }}</el-tag></div>
          <div class="doi-row"><span>金额</span><b style="color:#C0392B">¥{{ formatAmount(deleteTargetOrder.real_amount) }}</b></div>
          <div class="doi-row"><span>收货人</span><span>{{ deleteTargetOrder.receiver_name }}</span></div>
        </div>
      </div>
      <template #footer>
        <el-button @click="deleteDialogVisible=false">取消</el-button>
        <el-button type="danger" :loading="deleteLoading" @click="handleConfirmDelete">确认删除</el-button>
      </template>
    </el-dialog>

    <!-- ========== 发货 Dialog ========== -->
    <el-dialog v-model="shipDialogVisible" title="订单发货" width="450px" :close-on-click-modal="false" destroy-on-close>
      <el-form ref="shipFormRef" :model="shipForm" :rules="shipFormRules" label-width="90px">
        <el-form-item label="快递公司" prop="expressCompany">
          <el-select v-model="shipForm.expressCompany" placeholder="请选择快递公司" style="width:100%">
            <el-option v-for="c in expressCompanies" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="快递单号" prop="expressNo">
          <el-input v-model="shipForm.expressNo" placeholder="请输入快递单号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="shipDialogVisible=false">取消</el-button>
        <el-button type="primary" :loading="shipLoading" @click="handleShipSubmit">确认发货</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Van, View, Delete, WarningFilled } from '@element-plus/icons-vue'
import { adminApi } from '@/api'

const expressCompanies = ['顺丰速运','中通快递','圆通速递','韵达快递','申通快递','京东物流','邮政EMS']

const filterOrderNo = ref('')
const filterStatus = ref('')
const orderList = ref([])
const loading = ref(false)
const pagination = reactive({ page:1, pageSize:10, total:0 })

// 发货
const shipDialogVisible = ref(false)
const shipLoading = ref(false)
const shipFormRef = ref(null)
const currentShipOrder = ref(null)
const shipForm = reactive({ expressCompany:'', expressNo:'' })
const shipFormRules = {
  expressCompany: [{ required:true, message:'请选择快递公司', trigger:'change' }],
  expressNo: [{ required:true, message:'请输入快递单号', trigger:'blur' }]
}

// 订单详情
const detailVisible = ref(false)
const detailOrder = ref(null)

function getStatusText(s) { const m={0:'待付款',1:'待发货',2:'已发货',3:'已完成',4:'已取消',5:'退款中',6:'已退款',7:'待评价'}; return m[s]||'未知' }
function getStatusType(s) { const m={0:'warning',1:'info',2:'',3:'success',4:'danger',5:'warning',6:'info',7:'warning'}; return m[s]||'info' }
function formatAmount(v) { return v===null||v===undefined?'--':Number(v).toFixed(2) }

async function fetchOrders() {
  loading.value = true
  try {
    const res = await adminApi.getOrders({ page:pagination.page, pageSize:pagination.pageSize, orderNo:filterOrderNo.value, status:filterStatus.value })
    if(res.code===200){ orderList.value = res.data.records||[]; pagination.total = res.data.total||0 }
  } catch {} finally { loading.value = false }
}

function handleSearch() { pagination.page=1; fetchOrders() }
function handleReset() { filterOrderNo.value=''; filterStatus.value=''; pagination.page=1; fetchOrders() }

// 发货
function handleShip(row) { currentShipOrder.value=row; shipForm.expressCompany=''; shipForm.expressNo=''; shipDialogVisible.value=true }
async function handleShipSubmit() {
  const valid = await shipFormRef.value?.validate().catch(()=>false); if(!valid) return
  shipLoading.value=true
  try {
    const res = await adminApi.deliverOrder(currentShipOrder.value.order_no, { company:shipForm.expressCompany, logisticsNo:shipForm.expressNo })
    if(res.code===200){ ElMessage.success('发货成功'); shipDialogVisible.value=false; fetchOrders() }
    else ElMessage.error(res.message||'发货失败')
  } catch {} finally { shipLoading.value=false }
}

// 订单详情
async function handleViewDetail(row) {
  try {
    const res = await adminApi.getOrderDetail(row.order_no)
    if(res.code===200){ detailOrder.value = res.data; detailVisible.value = true }
    else ElMessage.error(res.message||'获取失败')
  } catch {}
}

// ============ 删除确认弹窗 ============
const deleteDialogVisible = ref(false)
const deleteTargetOrder = ref(null)
const deleteLoading = ref(false)

function openDeleteConfirm(row) {
  deleteTargetOrder.value = row
  deleteDialogVisible.value = true
}

async function handleConfirmDelete() {
  deleteLoading.value = true
  try {
    const res = await adminApi.deleteOrder(deleteTargetOrder.value.order_no)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      deleteDialogVisible.value = false
      fetchOrders()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch {} finally { deleteLoading.value = false }
}

onMounted(()=>fetchOrders())
</script>

<style scoped>
.pagination-wrap { display:flex; justify-content:flex-end; margin-top:16px; padding-top:16px; border-top:1px solid #ebeef5 }
.amount-text { font-weight:600; color:#e6a23c }

/* 删除确认弹窗 */
.delete-tip { font-size:14px; color:#606266; margin-bottom:16px; line-height:1.6 }
.delete-tip em { color:#E74C3C; font-weight:600; font-style:normal }
.delete-order-info { background:#f5f7fa; border-radius:8px; padding:14px 16px }
.doi-row { display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px dashed #e4e7ed; font-size:14px; color:#606266 }
.doi-row:last-child { border-bottom:none }
.doi-mono { font-family:monospace; font-size:13px; color:#303133 }
</style>
