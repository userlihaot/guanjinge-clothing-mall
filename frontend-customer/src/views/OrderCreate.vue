<template>
  <div class="order-create-page page-container">
    <h1 class="page-title">确认订单</h1>

    <!-- 没有结算商品时提示 -->
    <div v-if="!hasCheckoutItems" class="no-items">
      <el-empty description="暂无可结算的商品">
        <el-button type="primary" @click="$router.push('/cart')">返回购物车</el-button>
      </el-empty>
    </div>

    <!-- 结算表单 -->
    <template v-else>
      <div class="create-layout">
        <!-- 左侧：订单信息 -->
        <div class="create-main">
          <!-- 收货地址 -->
          <div class="section-card">
            <h3 class="section-title">
              <el-icon><Location /></el-icon>收货地址
            </h3>
            <div v-if="addressList.length > 0">
              <div class="address-list">
                <div
                  v-for="addr in addressList"
                  :key="addr.id"
                  class="address-item"
                  :class="{ selected: selectedAddressId === addr.id }"
                  @click="selectedAddressId = addr.id"
                >
                  <el-radio
                    :model-value="selectedAddressId"
                    :value="addr.id"
                    @click="selectedAddressId = addr.id"
                  >
                    <span class="addr-contact">{{ addr.receiverName || addr.receiver_name }} {{ addr.receiverPhone || addr.receiver_phone }}</span>
                  </el-radio>
                  <p class="addr-full">
                    {{ addr.province }}{{ addr.city }}{{ addr.district }} {{ addr.detail }}
                  </p>
                  <span v-if="addr.isDefault || addr.is_default" class="addr-tag">默认</span>
                </div>
              </div>
            </div>
            <div v-else class="empty-address">
              <p>暂无收货地址</p>
              <el-button type="primary" link @click="showNewAddress = true">新增地址</el-button>
            </div>
          </div>

          <!-- 商品列表 -->
          <div class="section-card">
            <h3 class="section-title">
              <el-icon><Goods /></el-icon>商品清单
            </h3>
            <div class="order-items">
              <div v-for="item in checkoutItems" :key="item.id" class="order-item">
                <div class="oi-img">
                  <img :src="item.product_image || item.cover_image || item.image || defaultImg" :alt="item.product_name || item.productName" />
                </div>
                <div class="oi-info">
                  <p class="oi-name">{{ item.product_name || item.productName || item.name }}</p>
                  <p class="oi-sku" v-if="item.sku_name || item.skuText">{{ item.sku_name || item.skuText }}</p>
                </div>
                <div class="oi-price">
                  <span>&yen;{{ item.price }}</span>
                  <span class="oi-qty">x{{ item.quantity }}</span>
                  <span class="oi-subtotal">&yen;{{ (item.price * item.quantity).toFixed(2) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 留言 -->
          <div class="section-card">
            <h3 class="section-title">
              <el-icon><Edit /></el-icon>订单留言
            </h3>
            <el-input
              v-model="orderRemark"
              type="textarea"
              :rows="2"
              placeholder="如有特殊需求请留言（选填）"
              maxlength="200"
              show-word-limit
            />
          </div>
        </div>

        <!-- 右侧：价格汇总 -->
        <div class="create-sidebar">
          <div class="price-summary-card">
            <h3 class="ps-title">价格明细</h3>
            <div class="ps-row">
              <span>商品总额</span>
              <span>&yen;{{ totalPrice.toFixed(2) }}</span>
            </div>
            <div class="ps-row">
              <span>运费</span>
              <span class="free-text">免运费</span>
            </div>
            <div class="ps-divider"></div>
            <div class="ps-total">
              <span>应付总额</span>
              <span class="ps-total-amount">&yen;{{ totalPrice.toFixed(2) }}</span>
            </div>
            <el-button
              type="primary"
              size="large"
              class="submit-order-btn"
              :disabled="!selectedAddressId || submitting"
              :loading="submitting"
              @click="handleSubmitOrder"
            >
              提交订单
            </el-button>
          </div>
        </div>
      </div>
    </template>

    <!-- 新增地址弹窗 -->
    <el-dialog v-model="showNewAddress" title="新增收货地址" width="500px" destroy-on-close>
      <el-form :model="newAddressForm" label-width="80px">
        <el-form-item label="收货人" required>
          <el-input v-model="newAddressForm.receiverName" placeholder="请输入收货人姓名" />
        </el-form-item>
        <el-form-item label="手机号" required>
          <el-input v-model="newAddressForm.receiverPhone" placeholder="请输入手机号" maxlength="11" />
        </el-form-item>
        <el-form-item label="所在地区" required>
          <el-input v-model="newAddressForm.region" placeholder="省/市/区" />
        </el-form-item>
        <el-form-item label="详细地址" required>
          <el-input v-model="newAddressForm.detail" placeholder="街道/楼栋/门牌号" />
        </el-form-item>
        <el-form-item label="设为默认">
          <el-switch v-model="newAddressForm.isDefault" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showNewAddress = false">取消</el-button>
        <el-button type="primary" @click="handleAddAddress">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Location, Goods, Edit } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useCartStore } from '@/stores/cart'
import { addressApi, orderApi } from '@/api'

const router = useRouter()
const cartStore = useCartStore()

const defaultImg = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI0ZERjVFRCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2VyaWYiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiNEOEE1NzQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7op4Lpm4zplos8L3RleHQ+PC9zdmc+'

// 结算的商品列表
const checkoutItems = ref([])
// 是否有待结算商品
const hasCheckoutItems = computed(() => checkoutItems.value.length > 0)
// 总价
const totalPrice = computed(() =>
  checkoutItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
)

// 地址相关
const addressList = ref([])
const selectedAddressId = ref(null)
const showNewAddress = ref(false)
const newAddressForm = reactive({
  receiverName: '',
  receiverPhone: '',
  region: '',
  detail: '',
  isDefault: false,
})

// 订单留言
const orderRemark = ref('')
// 提交中状态
const submitting = ref(false)

// 获取地址列表
async function fetchAddressList() {
  try {
    const res = await addressApi.getList()
    const data = res.data || res
    addressList.value = Array.isArray(data) ? data : data.records || data.list || []
    const defaultAddr = addressList.value.find((a) => a.isDefault || a.is_default)
    selectedAddressId.value = defaultAddr?.id || addressList.value[0]?.id || null
  } catch {
    addressList.value = []
  }
}

// 新增地址
async function handleAddAddress() {
  if (!newAddressForm.receiverName || !newAddressForm.receiverPhone || !newAddressForm.region || !newAddressForm.detail) {
    ElMessage.warning('请填写完整地址信息')
    return
  }
  if (!/^1\d{10}$/.test(newAddressForm.receiverPhone)) {
    ElMessage.warning('请输入正确的手机号')
    return
  }
  try {
    await addressApi.add({
      receiverName: newAddressForm.receiverName,
      receiverPhone: newAddressForm.receiverPhone,
      province: newAddressForm.region.split('/')[0] || newAddressForm.region,
      city: newAddressForm.region.split('/')[1] || '',
      district: newAddressForm.region.split('/')[2] || '',
      detail: newAddressForm.detail,
      isDefault: newAddressForm.isDefault ? 1 : 0,
    })
    ElMessage.success('地址添加成功')
    showNewAddress.value = false
    await fetchAddressList()
  } catch (error) {
    console.error('添加地址失败:', error)
  }
}

// 提交订单
async function handleSubmitOrder() {
  if (!selectedAddressId.value) {
    ElMessage.warning('请选择收货地址')
    return
  }
  submitting.value = true
  try {
    await orderApi.create({
      addressId: selectedAddressId.value,
      cartItemIds: checkoutItems.value.map((item) => item.id),
      buyerMessage: orderRemark.value,
    })
    ElMessage.success('订单创建成功')
    await cartStore.fetchCart()
    router.push('/orders')
  } catch (error) {
    console.error('创建订单失败:', error)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  // 从购物车获取选中商品
  checkoutItems.value = cartStore.selectedItems
  if (checkoutItems.value.length === 0) {
    // 如果购物车没有选中商品，尝试重新加载
    cartStore.fetchCart().then(() => {
      checkoutItems.value = cartStore.selectedItems
    })
  }
  fetchAddressList()
})
</script>

<style scoped>
.no-items {
  padding: var(--spacing-xxl);
  background: var(--color-bg-white);
  border-radius: var(--radius-base);
}

.create-layout {
  display: flex;
  gap: var(--spacing-lg);
  align-items: flex-start;
}

.create-main {
  flex: 1;
  min-width: 0;
}

.create-sidebar {
  width: 320px;
  flex-shrink: 0;
  position: sticky;
  top: 80px;
}

/* 区块卡片 */
.section-card {
  background: var(--color-bg-white);
  border-radius: var(--radius-base);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 地址 */
.address-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.address-item {
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-base);
  padding: var(--spacing-md);
  cursor: pointer;
  position: relative;
}

.address-item.selected {
  border-color: var(--color-primary);
  background: rgba(139, 69, 19, 0.03);
}

.addr-contact {
  font-weight: 600;
  color: var(--color-text-primary);
}

.addr-full {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-top: 4px;
  margin-left: 22px;
}

.addr-tag {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 11px;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  border-radius: 3px;
  padding: 0 4px;
}

.empty-address {
  text-align: center;
  padding: var(--spacing-md) 0;
  color: var(--color-text-secondary);
}

/* 商品清单 */
.order-items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.order-item {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}

.oi-img {
  width: 64px;
  height: 80px;
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

.oi-info {
  flex: 1;
}

.oi-name {
  font-size: 14px;
  color: var(--color-text-primary);
}

.oi-sku {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: 2px;
}

.oi-price {
  text-align: right;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.oi-qty {
  margin: 0 4px;
}

.oi-subtotal {
  display: block;
  font-weight: 600;
  color: #C0392B;
  font-size: 14px;
}

/* 价格汇总卡片 */
.price-summary-card {
  background: var(--color-bg-white);
  border-radius: var(--radius-base);
  padding: var(--spacing-lg);
  border: 1px solid var(--color-border-light);
}

.ps-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: var(--spacing-md);
  color: var(--color-text-primary);
}

.ps-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.free-text {
  color: var(--color-success);
}

.ps-divider {
  height: 1px;
  background: var(--color-border-light);
  margin: var(--spacing-md) 0;
}

.ps-total {
  display: flex;
  justify-content: space-between;
  font-size: 16px;
  font-weight: 700;
  margin-bottom: var(--spacing-lg);
}

.ps-total-amount {
  color: #C0392B;
  font-size: 24px;
}

.submit-order-btn {
  width: 100%;
  font-size: 16px;
  letter-spacing: 2px;
}

@media (max-width: 768px) {
  .create-layout {
    flex-direction: column;
  }

  .create-sidebar {
    width: 100%;
    position: static;
  }
}
</style>
