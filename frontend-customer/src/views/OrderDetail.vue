<template>
  <div class="order-detail-page page-container">
    <h1 class="page-title">订单详情</h1>

    <!-- 加载中 -->
    <div v-if="loading" class="loading-section">
      <el-skeleton :rows="8" animated />
    </div>

    <!-- 订单不存在 -->
    <div v-else-if="!order" class="empty-section">
      <el-result icon="error" title="订单不存在" sub-title="订单号可能有误或订单已被删除">
        <template #extra>
          <el-button type="primary" @click="$router.push('/orders')">返回订单列表</el-button>
        </template>
      </el-result>
    </div>

    <!-- 订单详情 -->
    <template v-else>
      <!-- 订单状态提示 -->
      <div class="status-bar" :class="statusClass(order.status)">
        <div class="status-main">
          <el-icon :size="28">
            <Clock v-if="order.status === 0" />
            <Van v-else-if="order.status === 1" />
            <Box v-else-if="order.status === 2" />
            <CircleCheckFilled v-else-if="order.status === 3" />
            <StarFilled v-else-if="order.status === 7" />
            <CircleClose v-else />
          </el-icon>
          <div>
            <p class="status-text">{{ statusText(order.status) }}</p>
            <p class="status-desc">{{ statusDesc(order.status) }}</p>
          </div>
        </div>
      </div>

      <!-- 收货信息 -->
      <div class="detail-card">
        <h3 class="card-title">收货信息</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">收货人：</span>
            <span>{{ order.receiver_name || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">手机号：</span>
            <span>{{ order.receiver_phone || '-' }}</span>
          </div>
          <div class="info-item" style="grid-column:1/-1">
            <span class="info-label">收货地址：</span>
            <span>{{ order.receiver_address || '-' }}</span>
          </div>
        </div>
      </div>

      <!-- 订单信息 -->
      <div class="detail-card">
        <h3 class="card-title">订单信息</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">订单编号：</span>
            <span class="order-no-mono">{{ order.order_no }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">创建时间：</span>
            <span>{{ order.create_time || '-' }}</span>
          </div>
          <div class="info-item" v-if="order.pay_time">
            <span class="info-label">付款时间：</span>
            <span>{{ order.pay_time }}</span>
          </div>
          <div class="info-item" v-if="order.ship_time">
            <span class="info-label">发货时间：</span>
            <span>{{ order.ship_time }}</span>
          </div>
          <div class="info-item" v-if="order.finish_time">
            <span class="info-label">完成时间：</span>
            <span>{{ order.finish_time }}</span>
          </div>
          <div class="info-item" v-if="order.logistics_company">
            <span class="info-label">快递公司：</span>
            <span>{{ order.logistics_company }}</span>
          </div>
          <div class="info-item" v-if="order.logistics_no">
            <span class="info-label">快递单号：</span>
            <span>{{ order.logistics_no }}</span>
          </div>
          <div class="info-item" v-if="order.buyer_message" style="grid-column:1/-1">
            <span class="info-label">订单留言：</span>
            <span>{{ order.buyer_message }}</span>
          </div>
        </div>
      </div>

      <!-- 商品清单 -->
      <div class="detail-card">
        <h3 class="card-title">商品清单</h3>
        <el-table :data="order.itemList || []" style="width: 100%" border>
          <el-table-column label="商品" min-width="320">
            <template #default="{ row }">
              <div class="table-product">
                <div class="tp-img">
                  <img :src="row.product_image || defaultImg" :alt="row.product_name" />
                </div>
                <div>
                  <p class="tp-name">{{ row.product_name }}</p>
                  <p class="tp-sku" v-if="row.sku_name">{{ row.sku_name }}</p>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="单价" width="100" align="center">
            <template #default="{ row }">&yen;{{ Number(row.price).toFixed(2) }}</template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" width="80" align="center" />
          <el-table-column label="小计" width="120" align="center">
            <template #default="{ row }">
              <span class="subtotal">&yen;{{ (Number(row.price) * row.quantity).toFixed(2) }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 价格明细 -->
      <div class="detail-card">
        <h3 class="card-title">价格明细</h3>
        <div class="price-summary">
          <div class="ps-row">
            <span>商品总额</span>
            <span>&yen;{{ Number(order.total_amount).toFixed(2) }}</span>
          </div>
          <div class="ps-row" v-if="order.coupon_discount > 0">
            <span>优惠券抵扣</span>
            <span class="discount-text">-&yen;{{ Number(order.coupon_discount).toFixed(2) }}</span>
          </div>
          <div class="ps-row">
            <span>运费</span>
            <span v-if="Number(order.freight) === 0" class="free-text">免运费</span>
            <span v-else>&yen;{{ Number(order.freight).toFixed(2) }}</span>
          </div>
          <div class="ps-row total">
            <span>实付金额</span>
            <span class="ps-total">&yen;{{ Number(order.real_amount).toFixed(2) }}</span>
          </div>
        </div>
      </div>

      <!-- 底部操作 -->
      <div class="detail-actions">
        <el-button @click="$router.push('/orders')">返回订单列表</el-button>
        <!-- 待付款 -->
        <template v-if="order.status === 0">
          <el-button type="danger" @click="handleCancel">取消订单</el-button>
          <el-button type="primary" @click="handlePay">去支付</el-button>
        </template>
        <!-- 待发货 -->
        <template v-if="order.status === 1">
          <el-button type="warning" @click="handleRefund">申请退款</el-button>
        </template>
        <!-- 待收货 -->
        <template v-if="order.status === 2">
          <el-button type="warning" @click="handleRefund">申请退款</el-button>
          <el-button type="primary" @click="handleConfirm">确认收货</el-button>
        </template>
        <!-- 已完成 -->
        <template v-if="order.status === 3">
          <el-button type="warning" @click="handleRefund">申请退款</el-button>
          <el-button type="primary" @click="handleReview">去评价</el-button>
        </template>
        <!-- 待评价 -->
        <template v-if="order.status === 7">
          <el-button type="primary" @click="handleReview">去评价</el-button>
        </template>
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
          <span class="refund-order-no">{{ order?.order_no }}</span>
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
            :max="order ? Number(order.real_amount) : 0"
            :precision="2"
            style="width:100%"
          />
          <span class="refund-amount-hint">
            实付 &yen;{{ order ? Number(order.real_amount).toFixed(2) : '0.00' }}
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
      <template v-if="order">
        <div class="review-products">
          <div
            v-for="item in order.itemList"
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
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Clock, Van, Box, CircleCheckFilled, CircleClose, StarFilled } from '@element-plus/icons-vue'
import { orderApi, refundApi, reviewApi } from '@/api'

const route = useRoute()
const router = useRouter()

const defaultImg = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI0ZERjVFRCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2VyaWYiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiNEOEE1NzQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7op4Lpm4zplos8L3RleHQ+PC9zdmc+'

const order = ref(null)
const loading = ref(true)

// ========== 状态映射（后端 status 为数字 0~6） ==========
function statusText(status) {
  const map = { 0: '待付款', 1: '待发货', 2: '待收货', 3: '已完成', 4: '已取消', 5: '退款中', 6: '已退款', 7: '待评价' }
  return map[status] ?? '未知'
}

function statusDesc(status) {
  const map = {
    0: '请尽快完成支付，超时订单将自动取消',
    1: '商家正在备货中，请耐心等待',
    2: '商品正在运送途中，收到后请确认收货',
    3: '交易已完成，感谢您的购买',
    4: '该订单已取消',
    5: '退款申请处理中',
    6: '退款已完成',
    7: '商品已签收，快来分享您的穿着体验吧',
  }
  return map[status] || ''
}

function statusClass(status) {
  const map = { 0: 'status-pay', 1: 'status-ship', 2: 'status-receipt', 3: 'status-done', 7: 'status-review' }
  return map[status] || 'status-default'
}

// ========== 获取订单详情 ==========
async function fetchOrderDetail() {
  loading.value = true
  try {
    const orderNo = route.params.orderNo
    const res = await orderApi.getDetail(orderNo)
    order.value = res.data || res
  } catch (error) {
    console.error('获取订单详情失败:', error)
    order.value = null
  } finally {
    loading.value = false
  }
}

// 取消订单
function handleCancel() {
  ElMessageBox.confirm('确定要取消该订单吗？', '取消订单', {
    confirmButtonText: '确定', cancelButtonText: '返回', type: 'warning',
  }).then(async () => {
    await orderApi.cancel(order.value.order_no)
    ElMessage.success('订单已取消')
    fetchOrderDetail()
  }).catch(() => {})
}

// 去支付
function handlePay() {
  router.push({ path: '/pay', query: { orderNo: order.value.order_no } })
}

// 确认收货
function handleConfirm() {
  ElMessageBox.confirm('确认已收到商品吗？', '确认收货', {
    confirmButtonText: '确定', cancelButtonText: '取消',
  }).then(async () => {
    await orderApi.confirm(order.value.order_no)
    ElMessage.success('已确认收货')
    fetchOrderDetail()
  }).catch(() => {})
}

// ========== 退款申请 ==========
const refundDialogVisible = ref(false)
const refundSubmitting = ref(false)
const refundFormRef = ref(null)
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

function handleRefund() {
  refundForm.type = 1
  refundForm.refundAmount = order.value ? Number(order.value.real_amount) : 0
  refundForm.reason = ''
  refundDialogVisible.value = true
}

async function handleRefundSubmit() {
  const valid = await refundFormRef.value?.validate().catch(() => false)
  if (!valid) return
  refundSubmitting.value = true
  try {
    await refundApi.apply({
      orderNo: order.value.order_no,
      type: refundForm.type,
      refundAmount: refundForm.refundAmount,
      reason: refundForm.reason,
    })
    ElMessage.success('退款申请已提交')
    refundDialogVisible.value = false
    fetchOrderDetail()
  } catch { /* handled */ } finally {
    refundSubmitting.value = false
  }
}

// ========== 评价弹窗 ==========
const reviewDialogVisible = ref(false)
const reviewSubmitting = ref(false)
const reviewFormRef = ref(null)
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
function handleReview() {
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
    const o = order.value
    const items = o.itemList || []
    let hasError = false
    for (const item of items) {
      const res = await reviewApi.add({
        orderId: o.id,
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
      fetchOrderDetail()
    }
  } catch {
    // handled by interceptor
  } finally {
    reviewSubmitting.value = false
  }
}

onMounted(() => {
  fetchOrderDetail()
})
</script>

<style scoped>
.loading-section,
.empty-section {
  background: var(--color-bg-white);
  border-radius: var(--radius-base);
  padding: var(--spacing-xl);
}

/* 状态条 */
.status-bar {
  background: var(--color-bg-white);
  border-radius: var(--radius-base);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
  border-left: 4px solid;
}

.status-bar.status-pay { border-color: #E67E22; background: #FFFBF0; }
.status-bar.status-ship { border-color: #8E44AD; background: #FDF8FF; }
.status-bar.status-receipt { border-color: #2980B9; background: #F0F7FC; }
.status-bar.status-done { border-color: #27AE60; background: #F6FAF0; }
.status-bar.status-default { border-color: var(--color-text-placeholder); }

.status-main {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.status-text {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.status-desc {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-top: 2px;
}

/* 详情卡片 */
.detail-card {
  background: var(--color-bg-white);
  border-radius: var(--radius-base);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 2px solid var(--color-accent-light);
  display: inline-block;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-sm);
}

.info-item {
  font-size: 14px;
  color: var(--color-text-regular);
}

.info-label {
  color: var(--color-text-secondary);
}

.order-no-mono {
  font-family: monospace;
  font-size: 13px;
}

/* 商品表格 */
.table-product {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}

.tp-img {
  width: 60px;
  height: 75px;
  border-radius: var(--radius-small);
  overflow: hidden;
  flex-shrink: 0;
  background: #FDF5ED;
}

.tp-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.tp-name {
  font-size: 14px;
  color: var(--color-text-primary);
}

.tp-sku {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: 2px;
}

.subtotal {
  color: #C0392B;
  font-weight: 600;
}

/* 价格汇总 */
.price-summary {
  max-width: 300px;
  margin-left: auto;
}

.ps-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-bottom: 6px;
}

.ps-row.total {
  font-weight: 700;
  font-size: 16px;
  color: var(--color-text-primary);
  border-top: 1px solid var(--color-border-light);
  padding-top: var(--spacing-sm);
  margin-top: var(--spacing-sm);
}

.ps-total {
  color: #C0392B;
  font-size: 22px;
}

.free-text {
  color: #27AE60;
}

.discount-text {
  color: #27AE60;
}

/* 底部按钮 */
.detail-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  padding: var(--spacing-md) 0;
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

.status-bar.status-review { border-color: #E67E22; background: #FFF9F0; }

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
