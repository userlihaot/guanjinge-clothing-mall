<template>
  <div class="pay-page page-container">
    <h1 class="page-title">订单支付</h1>

    <!-- 加载中 -->
    <div v-if="loading" class="loading-section">
      <el-skeleton :rows="6" animated />
    </div>

    <!-- 支付内容 -->
    <template v-else-if="orderInfo">
      <div class="pay-layout">
        <!-- 左侧：订单信息和支付方式 -->
        <div class="pay-main">
          <!-- 倒计时警告（待付款时显示） -->
          <div v-if="orderInfo.status === 0 && remainingSeconds > 0" class="deadline-bar">
            <el-icon><Clock /></el-icon>
            <span>请在 <em>{{ formatRemaining }}</em> 内完成支付，超时订单将自动取消</span>
          </div>

          <!-- 已支付状态提示 -->
          <div v-if="orderInfo.status !== 0" class="paid-bar">
            <el-icon><CircleCheckFilled /></el-icon>
            <span>该订单{{ orderInfo.status === 1 ? '已支付' : '状态已变更' }}，无需重复支付</span>
            <el-button size="small" @click="$router.push('/orders')">返回订单列表</el-button>
          </div>

          <!-- 订单信息 -->
          <div class="pay-card">
            <h3 class="card-title">订单信息</h3>
            <div class="info-row">
              <span>订单编号：</span>
              <span class="mono">{{ orderInfo.order_no }}</span>
            </div>
            <div class="info-row">
              <span>创建时间：</span>
              <span>{{ orderInfo.create_time }}</span>
            </div>
            <div class="info-row">
              <span>商品数量：</span>
              <span>{{ orderItemList.length }} 种，共 {{ totalQuantity }} 件</span>
            </div>
            <div class="info-row">
              <span>商品总额：</span>
              <span>&yen;{{ Number(orderInfo.total_amount).toFixed(2) }}</span>
            </div>
            <div class="info-row" v-if="Number(orderInfo.coupon_discount) > 0">
              <span>优惠券抵扣：</span>
              <span class="discount-text">-&yen;{{ Number(orderInfo.coupon_discount).toFixed(2) }}</span>
            </div>
            <div class="info-row">
              <span>运费：</span>
              <span v-if="Number(orderInfo.freight) === 0" class="free-text">免运费</span>
              <span v-else>&yen;{{ Number(orderInfo.freight).toFixed(2) }}</span>
            </div>
            <div class="info-row total">
              <span>应付金额：</span>
              <span class="pay-amount">&yen;{{ finalAmount.toFixed(2) }}</span>
            </div>
          </div>

          <!-- 订单商品明细 -->
          <div class="pay-card">
            <h3 class="card-title">商品明细</h3>
            <div class="pay-items">
              <div v-for="item in orderItemList" :key="item.id" class="pay-item">
                <div class="pay-item-img">
                  <img :src="item.product_image || defaultImg" :alt="item.product_name" />
                </div>
                <div class="pay-item-info">
                  <p class="pay-item-name">{{ item.product_name }}</p>
                  <p class="pay-item-sku" v-if="item.sku_name">{{ item.sku_name }}</p>
                </div>
                <div class="pay-item-price">
                  <span>&yen;{{ Number(item.price).toFixed(2) }} x {{ item.quantity }}</span>
                  <span class="pay-item-subtotal">&yen;{{ (Number(item.price) * item.quantity).toFixed(2) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 优惠券在下单时选择并已核销，此处不再重复选择 -->
          <!-- 后端 /api/pay/do-pay 只接收 { orderNo, payMethod }，支付页传的 couponId 会被忽略 -->

          <!-- 支付方式选择 -->
          <div class="pay-card" v-if="orderInfo.status === 0">
            <h3 class="card-title">选择支付方式</h3>
            <div class="pay-methods">
              <div
                class="pay-method"
                :class="{ active: payMethod === 'wechat' }"
                @click="payMethod = 'wechat'"
              >
                <span class="pm-icon wechat-icon">&#xe700;</span>
                <div class="pm-text">
                  <p class="pm-name">微信支付</p>
                  <p class="pm-desc">推荐使用微信支付</p>
                </div>
                <el-icon v-if="payMethod === 'wechat'" class="pm-check" color="#07C160">
                  <CircleCheckFilled />
                </el-icon>
              </div>
              <div
                class="pay-method"
                :class="{ active: payMethod === 'alipay' }"
                @click="payMethod = 'alipay'"
              >
                <span class="pm-icon alipay-icon">&#xe701;</span>
                <div class="pm-text">
                  <p class="pm-name">支付宝</p>
                  <p class="pm-desc">安全快捷的支付方式</p>
                </div>
                <el-icon v-if="payMethod === 'alipay'" class="pm-check" color="#1677FF">
                  <CircleCheckFilled />
                </el-icon>
              </div>
            </div>
          </div>

          <!-- 支付按钮 -->
          <div class="pay-action" v-if="orderInfo.status === 0">
            <el-button
              type="primary"
              size="large"
              class="pay-btn"
              :disabled="paying || payResult !== null || remainingSeconds <= 0"
              :loading="paying"
              @click="handlePay"
            >
              <template v-if="payResult">
                支付成功，{{ payCountdown }}s 后自动跳转
              </template>
              <template v-else-if="remainingSeconds <= 0">
                订单已超时
              </template>
              <template v-else>
                确认支付 &yen;{{ finalAmount.toFixed(2) }}
              </template>
            </el-button>
          </div>
        </div>

        <!-- 右侧：支付提示 -->
        <div class="pay-sidebar">
          <div class="tips-card">
            <h4 class="tips-title">
              <el-icon><InfoFilled /></el-icon>支付提示
            </h4>
            <ul class="tips-list">
              <li>请在 <em class="tips-em">{{ formatRemaining }}</em> 内完成支付，超时订单将自动取消</li>
              <li>支付成功后可在"我的订单"中查看订单状态</li>
              <li>如遇支付问题，请联系客服 400-888-6688</li>
              <li>本页面为模拟支付环境，点击确认支付即视为支付成功</li>
            </ul>
          </div>

          <!-- 支付成功提示 -->
          <div class="tips-card success-card" v-if="payResult">
            <h4 class="tips-title success-title">
              <el-icon><CircleCheckFilled /></el-icon>支付成功
            </h4>
            <p class="success-msg">{{ payCountdown }} 秒后自动跳转到订单列表</p>
            <el-button type="primary" size="small" @click="$router.push('/orders')">
              立即跳转
            </el-button>
          </div>
        </div>
      </div>
    </template>

    <!-- 订单不存在 -->
    <div v-else class="empty-section">
      <el-result icon="error" title="未找到订单信息" sub-title="请从订单列表进入支付页面">
        <template #extra>
          <el-button type="primary" @click="$router.push('/orders')">返回订单列表</el-button>
        </template>
      </el-result>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CircleCheckFilled, InfoFilled, Clock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { orderApi, payApi } from '@/api'

const route = useRoute()
const router = useRouter()

const defaultImg = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI0ZERjVFRCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2VyaWYiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiNEOEE1NzQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7op4Lpm4zplos8L3RleHQ+PC9zdmc+'

// ========== 状态 ==========
const orderInfo = ref(null)
const loading = ref(true)
const payMethod = ref('wechat')
const paying = ref(false)
const payResult = ref(null)        // 支付成功后存结果
const payCountdown = ref(0)        // 成功后倒计时
const remainingSeconds = ref(0)    // 支付截止倒计时
let countdownTimer = null
let deadlineTimer = null

// ========== 应付金额 ==========
// 直接取后端下单时算好的 real_amount（= 商品总额 - 优惠券 + 运费）。
// 不能在支付页重算一遍：优惠券在下单时已核销并计入 coupon_discount。
const finalAmount = computed(() => {
  const real = orderInfo.value?.real_amount
  if (real !== null && real !== undefined && real !== '') {
    const n = Number(real)
    if (!Number.isNaN(n)) return n
  }
  // 兜底：real_amount 缺失时按 商品总额 - 优惠 + 运费 计算
  const subtotal = Number(orderInfo.value?.total_amount) || 0
  const discount = Number(orderInfo.value?.coupon_discount) || 0
  const freight = Number(orderInfo.value?.freight) || 0
  return subtotal - discount + freight
})

// ========== 计算属性 ==========
const orderItemList = computed(() => orderInfo.value?.itemList || [])

const totalQuantity = computed(() =>
  orderItemList.value.reduce((sum, item) => sum + (item.quantity || 1), 0)
)

const formatRemaining = computed(() => {
  if (remainingSeconds.value <= 0) return '0 秒'
  const m = Math.floor(remainingSeconds.value / 60)
  const s = remainingSeconds.value % 60
  return m > 0 ? `${m} 分 ${s} 秒` : `${s} 秒`
})

// ========== 获取订单信息 ==========
async function fetchOrderInfo() {
  loading.value = true
  try {
    const orderNo = route.query.orderNo
    if (!orderNo) {
      orderInfo.value = null
      loading.value = false
      return
    }
    const res = await orderApi.getDetail(orderNo)
    orderInfo.value = res.data || res

    // 如果订单已支付，无需倒计时
    if (orderInfo.value && orderInfo.value.status !== 0) {
      startPaidCountdown()
    } else if (orderInfo.value?.pay_deadline) {
      // 启动支付截止倒计时
      startDeadlineCountdown()
    }
  } catch (error) {
    console.error('获取订单信息失败:', error)
    orderInfo.value = null
  } finally {
    loading.value = false
  }
}

// ========== 支付截止倒计时 ==========
function startDeadlineCountdown() {
  const deadline = new Date(orderInfo.value.pay_deadline).getTime()
  const tick = () => {
    const now = Date.now()
    remainingSeconds.value = Math.max(0, Math.floor((deadline - now) / 1000))
    if (remainingSeconds.value <= 0) {
      clearInterval(deadlineTimer)
      deadlineTimer = null
    }
  }
  tick()
  deadlineTimer = setInterval(tick, 1000)
}

// ========== 已支付倒计时跳转 ==========
function startPaidCountdown() {
  payCountdown.value = 3
  countdownTimer = setInterval(() => {
    payCountdown.value--
    if (payCountdown.value <= 0) {
      clearInterval(countdownTimer)
      countdownTimer = null
      router.push('/orders')
    }
  }, 1000)
}

// ========== 处理支付 ==========
async function handlePay() {
  if (paying.value || remainingSeconds.value <= 0) return
  paying.value = true

  try {
    const res = await payApi.pay({
      orderNo: orderInfo.value.order_no,
      payMethod: payMethod.value,
    })

    // 后端在"订单不存在或已支付""订单已超时取消"时返回 HTTP 200 + code:400，
    // 不判断 code 就会给一个并未付款（甚至已被自动取消）的订单提示"支付成功"
    if (!res || res.code !== 200) return

    payResult.value = res.data || res
    ElMessage.success('支付成功！')

    // 停止截止倒计时
    if (deadlineTimer) {
      clearInterval(deadlineTimer)
      deadlineTimer = null
    }

    // 更新订单状态
    orderInfo.value.status = 1

    // 跳转倒计时
    startPaidCountdown()
  } catch (error) {
    // 失败信息已由响应拦截器统一提示
    console.error('支付失败:', error)
  } finally {
    paying.value = false
  }
}

// ========== 清理定时器 ==========
onUnmounted(() => {
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null }
  if (deadlineTimer) { clearInterval(deadlineTimer); deadlineTimer = null }
})

onMounted(() => {
  fetchOrderInfo()
})
</script>

<style scoped>
.loading-section,
.empty-section {
  background: var(--color-bg-white);
  border-radius: var(--radius-base);
  padding: var(--spacing-xl);
}

.pay-layout {
  display: flex;
  gap: var(--spacing-lg);
  align-items: flex-start;
}

.pay-main {
  flex: 1;
  min-width: 0;
}

.pay-sidebar {
  width: 280px;
  flex-shrink: 0;
}

/* 倒计时条 */
.deadline-bar {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  background: #FFFBF0;
  border: 1px solid #F5D36B;
  border-radius: var(--radius-base);
  margin-bottom: var(--spacing-md);
  font-size: 14px;
  color: #B87333;
}

.deadline-bar em {
  font-style: normal;
  color: #E67E22;
  font-weight: 700;
}

/* 已支付提示条 */
.paid-bar {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  background: #F6FAF0;
  border: 1px solid #A8D5A8;
  border-radius: var(--radius-base);
  margin-bottom: var(--spacing-md);
  font-size: 14px;
  color: #27AE60;
}

.paid-bar .el-button { margin-left: auto; }

/* 支付卡片 */
.pay-card {
  background: var(--color-bg-white);
  border-radius: var(--radius-base);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
  border: 1px solid var(--color-border-light);
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

.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.info-row.total {
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border-light);
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.mono { font-family: monospace; }

.pay-amount {
  color: #C0392B;
  font-size: 28px;
  font-weight: 700;
}

.free-text { color: #27AE60; }
.discount-text { color: #27AE60; }

/* 商品明细 */
.pay-items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.pay-item {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
  padding: var(--spacing-sm);
  background: var(--color-bg-primary);
  border-radius: var(--radius-small);
}

.pay-item-img {
  width: 60px;
  height: 75px;
  border-radius: var(--radius-small);
  overflow: hidden;
  flex-shrink: 0;
  background: #FDF5ED;
}

.pay-item-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pay-item-info { flex: 1; }

.pay-item-name {
  font-size: 14px;
  color: var(--color-text-primary);
}

.pay-item-sku {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: 2px;
}

.pay-item-price {
  text-align: right;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.pay-item-subtotal {
  display: block;
  color: #C0392B;
  font-weight: 600;
}

/* 支付方式 */
.pay-methods {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.pay-method {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border: 2px solid var(--color-border-light);
  border-radius: var(--radius-base);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.pay-method:hover { border-color: var(--color-accent); }

.pay-method.active {
  border-color: var(--color-primary);
  background: rgba(139, 69, 19, 0.03);
}

.pm-icon {
  font-size: 32px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-small);
  flex-shrink: 0;
}

.wechat-icon { background: #E8F8E8; color: #07C160; }
.alipay-icon { background: #E8F2FF; color: #1677FF; }

.pm-text { flex: 1; }

.pm-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.pm-desc {
  font-size: 12px;
  color: var(--color-text-placeholder);
  margin-top: 2px;
}

.pm-check {
  position: absolute;
  top: 12px;
  right: 12px;
  font-size: 20px;
}

/* 支付按钮 */
.pay-action { margin-top: var(--spacing-lg); }

.pay-btn {
  width: 100%;
  font-size: 18px;
  letter-spacing: 3px;
  height: 50px;
}

/* 提示卡片 */
.tips-card {
  background: var(--color-bg-white);
  border-radius: var(--radius-base);
  padding: var(--spacing-lg);
  border: 1px solid var(--color-border-light);
  margin-bottom: var(--spacing-md);
}

.tips-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
  color: #B87333;
  margin-bottom: var(--spacing-md);
}

.tips-list {
  list-style: none;
}

.tips-list li {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.8;
  padding-left: var(--spacing-md);
  position: relative;
  margin-bottom: 6px;
}

.tips-list li::before {
  content: '·';
  position: absolute;
  left: 4px;
  color: var(--color-accent);
  font-weight: bold;
}

.tips-em {
  font-style: normal;
  color: #E67E22;
  font-weight: 600;
}

/* 支付成功卡片 */
.success-card {
  border-color: #A8D5A8;
}

.success-title { color: #27AE60; }

.success-msg {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-sm);
}

/* 优惠券 */
.no-coupon {
  padding: var(--spacing-md);
  text-align: center;
}

.no-coupon-text {
  font-size: 13px;
  color: var(--color-text-placeholder);
}

.coupon-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.coupon-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border: 2px solid var(--color-border-light);
  border-radius: var(--radius-base);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.coupon-item:hover { border-color: var(--color-accent); }

.coupon-item.active {
  border-color: #C0392B;
  background: rgba(192, 57, 43, 0.03);
}

.coupon-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 70px;
  flex-shrink: 0;
  padding-right: var(--spacing-md);
  border-right: 1px dashed var(--color-border-light);
}

.coupon-value {
  font-size: 18px;
  font-weight: 700;
  color: #C0392B;
}

.coupon-condition {
  font-size: 11px;
  color: var(--color-text-placeholder);
  margin-top: 2px;
}

.coupon-right { flex: 1; }

.coupon-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.coupon-expire {
  font-size: 12px;
  color: var(--color-text-placeholder);
  margin-top: 2px;
}

.coupon-check {
  position: absolute;
  top: 12px;
  right: 12px;
  font-size: 20px;
}

@media (max-width: 768px) {
  .pay-layout { flex-direction: column; }
  .pay-sidebar { width: 100%; }
  .pay-amount { font-size: 22px; }
}
</style>
