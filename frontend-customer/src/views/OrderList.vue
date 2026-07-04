<template>
  <div class="order-list-page page-container">
    <div class="page-title-row">
      <h1 class="page-title">我的订单</h1>
      <el-button type="warning" size="small" plain @click="goToRefunds">退款记录</el-button>
    </div>

    <!-- 订单状态 Tab -->
    <el-tabs v-model="activeTab" @tab-change="handleTabChange" class="order-tabs">
      <el-tab-pane label="全部" name="" />
      <el-tab-pane label="待付款" name="0" />
      <el-tab-pane label="待发货" name="1" />
      <el-tab-pane label="待收货" name="2" />
      <el-tab-pane label="待评价" name="7" />
      <el-tab-pane label="已完成" name="3" />
    </el-tabs>

    <!-- 加载中 -->
    <div v-if="loading" class="loading-section">
      <el-skeleton :rows="6" animated />
    </div>

    <!-- 订单列表 -->
    <template v-else>
      <div v-if="orderList.length === 0" class="empty-section">
        <el-empty description="暂无订单">
          <el-button type="primary" @click="$router.push('/products')">去购物</el-button>
        </el-empty>
      </div>

      <div v-else class="order-list">
        <!-- 订单卡片 -->
        <div v-for="order in orderList" :key="order.order_no" class="order-card">
          <!-- 订单头部 -->
          <div class="order-header">
            <div class="oh-left">
              <span class="oh-no">订单号：{{ order.order_no }}</span>
              <span class="oh-time">{{ order.create_time }}</span>
            </div>
            <div class="oh-right">
              <span class="oh-status" :class="statusClass(order.status)">
                {{ statusText(order.status) }}
              </span>
            </div>
          </div>

          <!-- 订单商品 -->
          <div class="order-items">
            <div
              v-for="item in order.itemList"
              :key="item.id"
              class="order-item"
              @click="handleViewDetail(order)"
            >
              <div class="oi-img">
                <img :src="item.product_image || defaultImg" :alt="item.product_name" />
              </div>
              <div class="oi-info">
                <p class="oi-name">{{ item.product_name }}</p>
                <p class="oi-sku" v-if="item.sku_name">
                  {{ item.sku_name }}
                </p>
              </div>
              <div class="oi-price">
                <span>&yen;{{ item.price }} x {{ item.quantity }}</span>
              </div>
            </div>
          </div>

          <!-- 订单底部 - 金额和操作 -->
          <div class="order-footer">
            <div class="of-amount">
              共 {{ orderItemCount(order) }} 件商品，
              实付：<span class="of-total">&yen;{{ Number(order.real_amount).toFixed(2) }}</span>
            </div>
            <div class="of-actions">
              <!-- 待付款 (status=0) -->
              <template v-if="order.status === 0">
                <el-button size="small" @click="handleCancel(order)">取消订单</el-button>
                <el-button type="primary" size="small" @click="handlePay(order)">去支付</el-button>
              </template>
              <!-- 待发货 (status=1) -->
              <template v-if="order.status === 1">
                <el-button size="small" @click="handleViewDetail(order)">查看详情</el-button>
                <el-button size="small" type="warning" @click="handleRefund(order)">申请退款</el-button>
              </template>
              <!-- 待收货 (status=2) -->
              <template v-if="order.status === 2">
                <el-button size="small" @click="handleViewDetail(order)">查看详情</el-button>
                <el-button size="small" type="warning" @click="handleRefund(order)">申请退款</el-button>
                <el-button type="primary" size="small" @click="handleConfirm(order)">确认收货</el-button>
              </template>
              <!-- 已完成 (status=3) -->
              <template v-if="order.status === 3">
                <el-button size="small" @click="handleViewDetail(order)">查看详情</el-button>
                <el-button size="small" type="warning" @click="handleRefund(order)">申请退款</el-button>
                <el-button type="primary" size="small" @click="handleReview(order)">去评价</el-button>
              </template>
              <!-- 待评价 (status=7) -->
              <template v-if="order.status === 7">
                <el-button size="small" @click="handleViewDetail(order)">查看详情</el-button>
                <el-button type="primary" size="small" @click="handleReview(order)">去评价</el-button>
              </template>
              <!-- 已取消/已退款 (status=4,5,6) -->
              <template v-if="order.status === 4 || order.status === 5 || order.status === 6">
                <el-button size="small" @click="handleViewDetail(order)">查看详情</el-button>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination-area" v-if="total > pageSize">
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          background
          @current-change="fetchOrders"
        />
      </div>
    </template>

    <!-- ==================== 申请退款弹窗 ==================== -->
    <el-dialog
      v-model="refundDialogVisible"
      title="申请退款"
      width="520px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form ref="refundFormRef" :model="refundForm" :rules="refundRules" label-width="90px">
        <el-form-item label="关联订单">
          <span class="refund-order-no">{{ currentRefundOrder?.order_no }}</span>
        </el-form-item>
        <el-form-item label="退款类型" prop="type">
          <el-radio-group v-model="refundForm.type">
            <el-radio :value="1">仅退款</el-radio>
            <el-radio :value="2">退货退款</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="退款金额" prop="refundAmount">
          <el-input-number
            v-model="refundForm.refundAmount"
            :min="0.01"
            :max="currentRefundOrder ? Number(currentRefundOrder.real_amount) : 0"
            :precision="2"
            style="width:100%"
          />
          <span class="refund-amount-hint">
            实付 &yen;{{ currentRefundOrder ? Number(currentRefundOrder.real_amount).toFixed(2) : '0.00' }}
          </span>
        </el-form-item>
        <el-form-item label="退款原因" prop="reason">
          <el-input
            v-model="refundForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请详细描述退款原因（必填）"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="refundDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="refundSubmitting" @click="handleRefundSubmit">
          提交申请
        </el-button>
      </template>
    </el-dialog>

    <!-- ==================== 发表评价弹窗 ==================== -->
    <el-dialog
      v-model="reviewDialogVisible"
      title="发表评价"
      width="520px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <template v-if="currentReviewOrder">
        <!-- 订单中的商品列表 -->
        <div class="review-products">
          <div
            v-for="item in currentReviewOrder.itemList"
            :key="item.id"
            class="review-product-item"
          >
            <div class="rp-img">
              <img :src="item.product_image || defaultImg" :alt="item.product_name" />
            </div>
            <div class="rp-info">
              <p class="rp-name">{{ item.product_name }}</p>
              <p class="rp-sku" v-if="item.sku_name">{{ item.sku_name }}</p>
            </div>
          </div>
        </div>
        <el-form ref="reviewFormRef" :model="reviewForm" :rules="reviewRules" label-width="80px" style="margin-top:16px">
          <el-form-item label="评分" prop="star">
            <el-rate v-model="reviewForm.star" :max="5" show-score />
          </el-form-item>
          <el-form-item label="评价内容" prop="content">
            <el-input
              v-model="reviewForm.content"
              type="textarea"
              :rows="4"
              placeholder="分享您的穿着体验吧～"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
          <el-form-item label="匿名评价">
            <el-switch v-model="reviewForm.isAnonymous" />
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button @click="reviewDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="reviewSubmitting" @click="handleReviewSubmit">
          提交评价
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { orderApi, refundApi, reviewApi } from '@/api'

const router = useRouter()

const defaultImg = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI0ZERjVFRCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2VyaWYiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiNEOEE1NzQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7op4Lpm4zplos8L3RleHQ+PC9zdmc+'

const activeTab = ref('')
const orderList = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

// ========== 状态映射（后端 status 字段为数字 0~6） ==========
// 0-待付款 1-待发货 2-待收货 3-已完成 4-已取消 5-退款中 6-已退款
function statusText(status) {
  const map = { 0: '待付款', 1: '待发货', 2: '待收货', 3: '已完成', 4: '已取消', 5: '退款中', 6: '已退款', 7: '待评价' }
  return map[status] ?? '未知'
}

function statusClass(status) {
  const map = { 0: 'status-pay', 1: 'status-ship', 2: 'status-receipt', 3: 'status-done', 4: 'status-default', 5: 'status-default', 6: 'status-default', 7: 'status-review' }
  return map[status] || 'status-default'
}

// 计算订单商品总件数
function orderItemCount(order) {
  const items = order.itemList || []
  return items.reduce((sum, item) => sum + (item.quantity || 1), 0)
}

// ========== 获取订单列表 ==========
async function fetchOrders() {
  loading.value = true
  try {
    const params = { page: page.value, size: pageSize.value }
    if (activeTab.value !== '') params.status = activeTab.value
    const res = await orderApi.getList(params)
    const data = res.data || res
    orderList.value = data.records || data.list || (Array.isArray(data) ? data : [])
    total.value = data.total || 0
  } catch (error) {
    console.error('获取订单列表失败:', error)
    orderList.value = []
  } finally {
    loading.value = false
  }
}

// Tab 切换
function handleTabChange() {
  page.value = 1
  fetchOrders()
}

// 取消订单
function handleCancel(order) {
  ElMessageBox.confirm('确定要取消该订单吗？', '取消订单', {
    confirmButtonText: '确定', cancelButtonText: '返回', type: 'warning',
  }).then(async () => {
    try {
      await orderApi.cancel(order.order_no)
      ElMessage.success('订单已取消')
      fetchOrders()
    } catch (error) {
      console.error('取消订单失败:', error)
    }
  }).catch(() => {})
}

// 去支付
function handlePay(order) {
  router.push({ path: '/pay', query: { orderNo: order.order_no } })
}

// 确认收货
function handleConfirm(order) {
  ElMessageBox.confirm('确认已收到商品吗？', '确认收货', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'info',
  }).then(async () => {
    try {
      await orderApi.confirm(order.order_no)
      ElMessage.success('已确认收货')
      fetchOrders()
    } catch (error) {
      console.error('确认收货失败:', error)
    }
  }).catch(() => {})
}

// 查看详情
function handleViewDetail(order) {
  router.push(`/order/${order.order_no}`)
}

// ========== 退款申请弹窗 ==========
const refundDialogVisible = ref(false)
const refundSubmitting = ref(false)
const refundFormRef = ref(null)
const currentRefundOrder = ref(null)
const refundForm = reactive({
  type: 1,
  refundAmount: 0,
  reason: '',
})
const refundRules = {
  type: [{ required: true, message: '请选择退款类型', trigger: 'change' }],
  refundAmount: [{ required: true, message: '请输入退款金额', trigger: 'blur' }],
  reason: [{ required: true, message: '请输入退款原因', trigger: 'blur' }],
}

// 打开退款申请弹窗
function handleRefund(order) {
  currentRefundOrder.value = order
  refundForm.type = 1
  refundForm.refundAmount = Number(order.real_amount) || 0
  refundForm.reason = ''
  refundDialogVisible.value = true
}

// 提交退款申请
async function handleRefundSubmit() {
  const valid = await refundFormRef.value?.validate().catch(() => false)
  if (!valid) return
  refundSubmitting.value = true
  try {
    await refundApi.apply({
      orderNo: currentRefundOrder.value.order_no,
      type: refundForm.type,
      refundAmount: refundForm.refundAmount,
      reason: refundForm.reason,
    })
    ElMessage.success('退款申请已提交')
    refundDialogVisible.value = false
    fetchOrders()
  } catch { /* handled */ } finally {
    refundSubmitting.value = false
  }
}

// 查看退款记录
function goToRefunds() {
  router.push('/refunds')
}

// ========== 评价弹窗 ==========
const reviewDialogVisible = ref(false)
const reviewSubmitting = ref(false)
const reviewFormRef = ref(null)
const currentReviewOrder = ref(null)
const reviewForm = reactive({
  star: 5,
  content: '',
  isAnonymous: false,
})
const reviewRules = {
  star: [{ required: true, message: '请给出评分', trigger: 'change' }],
  content: [{ required: true, message: '请输入评价内容', trigger: 'blur' }],
}

// 打开评价弹窗
function handleReview(order) {
  currentReviewOrder.value = order
  reviewForm.star = 5
  reviewForm.content = ''
  reviewForm.isAnonymous = false
  reviewDialogVisible.value = true
}

// 提交评价
async function handleReviewSubmit() {
  const valid = await reviewFormRef.value?.validate().catch(() => false)
  if (!valid) return
  reviewSubmitting.value = true
  try {
    const order = currentReviewOrder.value
    // 对订单中的每个商品分别提交评价
    const items = order.itemList || []
    let hasError = false
    for (const item of items) {
      const res = await reviewApi.add({
        orderId: order.id,
        productId: item.product_id,
        skuName: item.sku_name || '',
        star: reviewForm.star,
        content: reviewForm.content,
        isAnonymous: reviewForm.isAnonymous,
      })
      if (res.code !== 200) {
        ElMessage.error(res.message || '评价失败')
        hasError = true
        break
      }
    }
    if (!hasError) {
      ElMessage.success('评价发表成功')
      reviewDialogVisible.value = false
      fetchOrders()
    }
  } catch {
    // handled by interceptor
  } finally {
    reviewSubmitting.value = false
  }
}

onMounted(() => {
  fetchOrders()
})
</script>

<style scoped>
.order-tabs {
  background: var(--color-bg-white);
  border-radius: var(--radius-base) var(--radius-base) 0 0;
  padding: 0 var(--spacing-lg);
  margin-bottom: 0;
}

.loading-section,
.empty-section {
  background: var(--color-bg-white);
  border-radius: var(--radius-base);
  padding: var(--spacing-xl);
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

/* 订单卡片 */
.order-card {
  background: var(--color-bg-white);
  border-radius: var(--radius-base);
  overflow: hidden;
  border: 1px solid var(--color-border-light);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  background: #FDF5ED;
  border-bottom: 1px solid var(--color-border-light);
}

.oh-left {
  display: flex;
  gap: var(--spacing-lg);
  font-size: 13px;
  color: var(--color-text-secondary);
}

.oh-no { font-family: monospace; }

.oh-status {
  font-size: 14px;
  font-weight: 600;
}

.status-pay { color: #E67E22; }
.status-ship { color: #8E44AD; }
.status-receipt { color: #2980B9; }
.status-done { color: #27AE60; }
.status-default { color: var(--color-text-secondary); }

/* 订单商品 */
.order-items {
  padding: var(--spacing-sm) var(--spacing-lg);
}

.order-item {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
  padding: var(--spacing-sm) 0;
  border-bottom: 1px dashed var(--color-border-light);
  cursor: pointer;
}

.order-item:last-child { border-bottom: none; }

.oi-img {
  width: 60px;
  height: 75px;
  border-radius: var(--radius-small);
  overflow: hidden;
  flex-shrink: 0;
  background: #FDF5ED;
}

.oi-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.oi-info { flex: 1; }

.oi-name {
  font-size: 14px;
  color: var(--color-text-primary);
}

.oi-sku {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.oi-price {
  font-size: 13px;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

/* 订单底部 */
.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  border-top: 1px solid var(--color-border-light);
}

.of-amount {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.of-total {
  color: #C0392B;
  font-weight: 700;
  font-size: 18px;
}

.of-actions {
  display: flex;
  gap: var(--spacing-sm);
}

/* 分页 */
.pagination-area {
  display: flex;
  justify-content: center;
  padding: var(--spacing-xl) 0;
}

.page-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.page-title-row .page-title {
  margin-bottom: 0;
}

.refund-order-no {
  font-family: monospace;
  font-size: 14px;
  color: var(--color-text-primary);
}

.refund-amount-hint {
  display: block;
  font-size: 12px;
  color: var(--color-text-placeholder);
  margin-top: 4px;
}

/* ========== 评价弹窗 ========== */
.review-products {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.review-product-item {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 10px;
  background: #fafafa;
  border-radius: 8px;
}

.rp-img {
  width: 56px;
  height: 70px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
  background: #FDF5ED;
}

.rp-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.rp-name {
  font-size: 14px;
  color: #303133;
}

.rp-sku {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.status-review { color: #E67E22; }

@media (max-width: 768px) {
  .order-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  .order-footer {
    flex-direction: column;
    gap: var(--spacing-sm);
    align-items: flex-end;
  }
}
</style>
