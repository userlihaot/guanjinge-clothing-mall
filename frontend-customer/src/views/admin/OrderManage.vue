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
      <el-table
        v-loading="loading"
        :data="orderList"
        stripe
        border
        style="width: 100%"
        empty-text="暂无订单数据"
      >
        <!-- 订单号 -->
        <el-table-column prop="order_no" label="订单号" min-width="180" show-overflow-tooltip />

        <!-- 订单金额 -->
        <el-table-column label="金额 (¥)" width="120" align="center">
          <template #default="{ row }">
            <span class="amount-text">¥{{ formatAmount(row.real_amount) }}</span>
          </template>
        </el-table-column>

        <!-- 订单状态（彩色Tag） -->
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 收货人 -->
        <el-table-column prop="receiver_name" label="收货人" width="100" />

        <!-- 下单时间 -->
        <el-table-column prop="create_time" label="下单时间" min-width="160" show-overflow-tooltip />

        <!-- 操作 -->
        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 1"
              type="primary"
              size="small"
              :icon="Van"
              @click="handleShip(row)"
            >
              发货
            </el-button>
            <el-button
              type="info"
              size="small"
              :icon="View"
              link
              @click="handleViewDetail(row)"
            >
              详情
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
          @size-change="fetchOrders"
          @current-change="fetchOrders"
        />
      </div>
    </div>

    <!-- ========== 订单详情 Dialog ========== -->
    <el-dialog v-model="detailDialogVisible" title="订单详情" width="700px" destroy-on-close>
      <template v-if="detailOrder">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="订单号">{{ detailOrder.order_no }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(detailOrder.status)" size="small">{{ getStatusText(detailOrder.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="收货人">{{ detailOrder.receiver_name }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ detailOrder.receiver_phone }}</el-descriptions-item>
          <el-descriptions-item label="收货地址" :span="2">{{ detailOrder.receiver_address }}</el-descriptions-item>
          <el-descriptions-item label="实付金额">¥{{ formatAmount(detailOrder.real_amount) }}</el-descriptions-item>
          <el-descriptions-item label="下单时间">{{ detailOrder.create_time }}</el-descriptions-item>
          <el-descriptions-item label="物流公司" v-if="detailOrder.logistics_company">{{ detailOrder.logistics_company }}</el-descriptions-item>
          <el-descriptions-item label="快递单号" v-if="detailOrder.logistics_no">{{ detailOrder.logistics_no }}</el-descriptions-item>
          <el-descriptions-item label="买家留言" :span="2">{{ detailOrder.buyer_message || '无' }}</el-descriptions-item>
          <el-descriptions-item v-if="detailOrder.admin_note" label="管理员备注" :span="2">{{ detailOrder.admin_note }}</el-descriptions-item>
        </el-descriptions>
        <h4 style="margin-top:16px;margin-bottom:8px">商品明细</h4>
        <el-table :data="detailOrder.itemList || []" size="small" border>
          <el-table-column prop="product_name" label="商品名称" />
          <el-table-column prop="price" label="单价" width="100" />
          <el-table-column prop="quantity" label="数量" width="80" />
          <el-table-column label="小计" width="100">
            <template #default="{row}">¥{{ (row.price * row.quantity).toFixed(2) }}</template>
          </el-table-column>
        </el-table>
      </template>
    </el-dialog>

    <!-- ========== 发货 Dialog ========== -->
    <el-dialog
      v-model="shipDialogVisible"
      title="订单发货"
      width="450px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form ref="shipFormRef" :model="shipForm" :rules="shipFormRules" label-width="90px">
        <el-form-item label="快递公司" prop="expressCompany">
          <el-select v-model="shipForm.expressCompany" placeholder="请选择快递公司" style="width: 100%">
            <el-option label="顺丰速运" value="顺丰速运" />
            <el-option label="中通快递" value="中通快递" />
            <el-option label="圆通速递" value="圆通速递" />
            <el-option label="韵达快递" value="韵达快递" />
            <el-option label="申通快递" value="申通快递" />
            <el-option label="京东物流" value="京东物流" />
            <el-option label="邮政EMS" value="邮政EMS" />
          </el-select>
        </el-form-item>
        <el-form-item label="快递单号" prop="expressNo">
          <el-input v-model="shipForm.expressNo" placeholder="请输入快递单号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="shipDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="shipLoading" @click="handleShipSubmit">确认发货</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Van, View } from '@element-plus/icons-vue'
import { adminApi } from '@/api'

// ============ 筛选条件 ============
const filterOrderNo = ref('')
const filterStatus = ref('')

// ============ 订单列表 ============
const orderList = ref([])
const loading = ref(false)

// ============ 分页 ============
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

// ============ 发货 Dialog ============
const shipDialogVisible = ref(false)
const shipLoading = ref(false)
const shipFormRef = ref(null)
const currentShipOrder = ref(null)

const shipForm = reactive({
  expressCompany: '',
  expressNo: ''
})

const shipFormRules = {
  expressCompany: [{ required: true, message: '请选择快递公司', trigger: 'change' }],
  expressNo: [{ required: true, message: '请输入快递单号', trigger: 'blur' }]
}

// ============ 状态映射 ============

/**
 * 获取订单状态文字
 */
function getStatusText(status) {
  const map = {
    0: '待付款',
    1: '待发货',
    2: '已发货',
    3: '已完成',
    4: '已取消',
    5: '退款中',
    6: '已退款'
  }
  return map[status] || '未知'
}

/**
 * 获取订单状态对应的 Tag 类型（颜色）
 */
function getStatusType(status) {
  const map = {
    0: 'warning',   // 待付款 — 橙色
    1: 'info',      // 待发货 — 蓝色
    2: '',          // 已发货 — 默认灰色
    3: 'success',   // 已完成 — 绿色
    4: 'danger',    // 已取消 — 红色
    5: 'warning',   // 退款中 — 橙色
    6: 'info'       // 已退款 — 蓝色
  }
  return map[status] || 'info'
}

/**
 * 格式化金额
 */
function formatAmount(val) {
  if (val === null || val === undefined) return '--'
  return Number(val).toFixed(2)
}

// ============ 方法 ============

/**
 * 获取订单列表
 */
async function fetchOrders() {
  loading.value = true
  try {
    const res = await adminApi.getOrders({
      page: pagination.page,
      pageSize: pagination.pageSize,
      orderNo: filterOrderNo.value,
      status: filterStatus.value
    })
    if (res.code === 200) {
      orderList.value = res.data.records || []
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
  fetchOrders()
}

/**
 * 重置筛选条件
 */
function handleReset() {
  filterOrderNo.value = ''
  filterStatus.value = ''
  pagination.page = 1
  fetchOrders()
}

/**
 * 打开发货 Dialog
 */
function handleShip(row) {
  currentShipOrder.value = row
  shipForm.expressCompany = ''
  shipForm.expressNo = ''
  shipDialogVisible.value = true
}

/**
 * 提交发货
 */
async function handleShipSubmit() {
  const valid = await shipFormRef.value?.validate().catch(() => false)
  if (!valid) return

  shipLoading.value = true
  try {
    const res = await adminApi.deliver(currentShipOrder.value.order_no, {
      company: shipForm.expressCompany,
      logisticsNo: shipForm.expressNo
    })
    if (res.code === 200) {
      ElMessage.success('发货成功')
      shipDialogVisible.value = false
      fetchOrders()
    } else {
      ElMessage.error(res.message || '发货失败')
    }
  } catch {
    // 错误由拦截器处理
  } finally {
    shipLoading.value = false
  }
}

// ========== 订单详情 Dialog ==========
const detailDialogVisible = ref(false)
const detailOrder = ref(null)

function handleViewDetail(row) {
  detailOrder.value = { ...row, itemList: row.itemList || [] }
  detailDialogVisible.value = true
}

// ============ 页面加载 ============
onMounted(() => {
  fetchOrders()
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
</style>
