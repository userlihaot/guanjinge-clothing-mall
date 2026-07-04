<template>
  <div class="cart-page page-container">
    <h1 class="page-title">购物车</h1>

    <!-- 空购物车状态 -->
    <div v-if="cartStore.cartList.length === 0 && cartStore.loaded" class="empty-cart">
      <el-empty description="购物车是空的，快去挑选心仪的古装吧~">
        <el-button type="primary" @click="$router.push('/products')">去逛逛</el-button>
      </el-empty>
    </div>

    <!-- 购物车内容 -->
    <template v-else>
      <!-- ==================== 商品表格 ==================== -->
      <div class="cart-table-section">
        <el-table
          :data="cartStore.cartList"
          style="width: 100%"
          @selection-change="() => {}"
          row-key="id"
        >
          <!-- 复选框列 -->
          <el-table-column width="50">
            <template #default="{ row }">
              <el-checkbox
                :model-value="row.checked"
                @change="cartStore.toggleCheck(row.id)"
              />
            </template>
            <template #header>
              <el-checkbox
                :model-value="cartStore.isAllSelected"
                :indeterminate="
                  cartStore.selectedCount > 0 &&
                  !cartStore.isAllSelected
                "
                @change="cartStore.toggleAllCheck()"
              />
            </template>
          </el-table-column>

          <!-- 商品信息列 -->
          <el-table-column label="商品信息" min-width="350">
            <template #default="{ row }">
              <div class="cart-product" @click="$router.push(`/product/${row.productId}`)">
                <div class="cart-product-img">
                  <img :src="row.product_image || row.cover_image || row.image || defaultImg" :alt="row.productName || row.product_name || row.name" />
                </div>
                <div class="cart-product-info">
                  <p class="cart-product-name">{{ row.productName || row.name }}</p>
                  <p class="cart-product-sku" v-if="row.skuText || row.skuName">
                    {{ row.skuText || row.skuName }}
                  </p>
                </div>
              </div>
            </template>
          </el-table-column>

          <!-- 单价列 -->
          <el-table-column label="单价" width="120" align="center">
            <template #default="{ row }">
              <span class="table-price">&yen;{{ row.price }}</span>
            </template>
          </el-table-column>

          <!-- 数量列 -->
          <el-table-column label="数量" width="150" align="center">
            <template #default="{ row }">
              <el-input-number
                :model-value="row.quantity"
                :min="1"
                :max="row.stock || 99"
                size="small"
                controls-position="right"
                @change="(val) => handleQuantityChange(row, val)"
              />
            </template>
          </el-table-column>

          <!-- 小计列 -->
          <el-table-column label="小计" width="120" align="center">
            <template #default="{ row }">
              <span class="table-subtotal">&yen;{{ (row.price * row.quantity).toFixed(2) }}</span>
            </template>
          </el-table-column>

          <!-- 操作列 -->
          <el-table-column label="操作" width="80" align="center">
            <template #default="{ row }">
              <el-button type="danger" link size="small" @click.stop="openDeleteConfirm([row])">
                <el-icon><Delete /></el-icon>
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- ==================== 底部操作栏 ==================== -->
      <div class="cart-bottom">
        <div class="bottom-left">
          <el-checkbox
            :model-value="cartStore.isAllSelected"
            @change="cartStore.toggleAllCheck()"
          >
            全选
          </el-checkbox>
          <el-button link type="danger" @click="handleDeleteSelected">
            删除选中 ({{ cartStore.selectedCount }})
          </el-button>
        </div>
        <div class="bottom-right">
          <span class="bottom-info">
            已选
            <em class="highlight">{{ cartStore.selectedCount }}</em>
            件商品
          </span>
          <span class="bottom-total">
            合计：
            <span class="total-price">&yen;{{ cartStore.selectedTotalPrice.toFixed(2) }}</span>
          </span>
          <el-button
            type="primary"
            size="large"
            :disabled="cartStore.selectedCount === 0"
            @click="openCheckoutDialog"
          >
            去结算
          </el-button>
        </div>
      </div>
    </template>

    <!-- ==================== 结算弹窗 ==================== -->
    <el-dialog
      v-model="showCheckoutDialog"
      title="确认订单信息"
      width="650px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div class="checkout-dialog">
        <!-- 选择收货地址 -->
        <div class="checkout-section">
          <h4 class="checkout-label">收货地址</h4>
          <div v-if="addressList.length > 0">
            <el-radio-group v-model="selectedAddressId" class="address-radio-group">
              <div
                v-for="addr in addressList"
                :key="addr.id"
                class="address-card"
                :class="{ selected: selectedAddressId === addr.id }"
              >
                <div class="address-card-main" @click="selectedAddressId = addr.id">
                  <el-radio :value="addr.id" class="addr-radio">
                    <span class="addr-name">{{ addr.receiverName }}</span>
                    <span class="addr-phone">{{ addr.receiverPhone }}</span>
                  </el-radio>
                  <p class="addr-detail">{{ addr.province }}{{ addr.city }}{{ addr.district }} {{ addr.detail }}</p>
                  <span v-if="addr.isDefault" class="addr-default">默认</span>
                </div>
                <div class="address-card-actions">
                  <el-button link type="primary" size="small" @click.stop="openEditAddress(addr)">
                    <el-icon><Edit /></el-icon>
                  </el-button>
                  <el-button
                    v-if="!addr.isDefault"
                    link
                    type="warning"
                    size="small"
                    @click.stop="handleSetDefault(addr.id)"
                  >
                    设为默认
                  </el-button>
                  <el-button link type="danger" size="small" @click.stop="handleDeleteAddress(addr.id)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
            </el-radio-group>
          </div>
          <div v-else class="no-address">
            <p>暂无收货地址，请先添加</p>
          </div>
          <el-button type="primary" link size="small" @click="resetAddressForm(); showAddressDialog = true">
            <el-icon><Plus /></el-icon>新增地址
          </el-button>
        </div>

        <!-- 订单留言 -->
        <div class="checkout-section">
          <h4 class="checkout-label">订单留言</h4>
          <el-input
            v-model="orderRemark"
            type="textarea"
            :rows="2"
            placeholder="如有特殊需求请留言（选填）"
            maxlength="200"
            show-word-limit
          />
        </div>

        <!-- 优惠券 -->
        <div class="checkout-section">
          <h4 class="checkout-label">优惠券</h4>
          <div v-if="checkoutCoupons.length === 0" class="no-coupon">
            <span class="no-coupon-text">暂无可用优惠券</span>
          </div>
          <el-select
            v-else
            v-model="selectedCheckoutCouponId"
            placeholder="选择优惠券（选填）"
            clearable
            style="width:100%"
            @change="handleCouponChange"
          >
            <el-option
              v-for="c in checkoutCoupons"
              :key="c.id"
              :label="couponLabel(c)"
              :value="c.id"
            />
          </el-select>
          <div v-if="checkoutCouponDiscount > 0" class="coupon-discount-tip">
            优惠券抵扣：<em>-¥{{ checkoutCouponDiscount.toFixed(2) }}</em>
          </div>
        </div>

        <!-- 商品明细 -->
        <div class="checkout-section">
          <h4 class="checkout-label">商品明细</h4>
          <div class="checkout-items">
            <div v-for="item in cartStore.selectedItems" :key="item.id" class="checkout-item">
              <div class="checkout-item-img">
                <img :src="item.product_image || item.cover_image || item.image || defaultImg" :alt="item.productName || item.product_name" />
              </div>
              <div class="checkout-item-info">
                <p class="checkout-item-name">{{ item.productName || item.name }}</p>
                <p class="checkout-item-sku" v-if="item.skuText">{{ item.skuText }}</p>
              </div>
              <div class="checkout-item-price">
                <span>&yen;{{ item.price }} x {{ item.quantity }}</span>
                <span class="checkout-item-subtotal">&yen;{{ (item.price * item.quantity).toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 价格明细 -->
        <div class="checkout-summary">
          <div class="summary-row">
            <span>商品总额</span>
            <span>&yen;{{ cartStore.selectedTotalPrice.toFixed(2) }}</span>
          </div>
          <div class="summary-row" v-if="checkoutCouponDiscount > 0">
            <span>优惠券抵扣</span>
            <span class="free-shipping">-&yen;{{ checkoutCouponDiscount.toFixed(2) }}</span>
          </div>
          <div class="summary-row">
            <span>运费</span>
            <span v-if="cartStore.selectedTotalPrice >= freightFreeThreshold" class="free-shipping">免运费</span>
            <span v-else>&yen;{{ freightFee.toFixed(2) }}</span>
          </div>
          <div class="summary-total">
            <span>应付总额</span>
            <span class="total-amount">&yen;{{ checkoutFinalTotal.toFixed(2) }}</span>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="showCheckoutDialog = false">取消</el-button>
        <el-button type="primary" :disabled="!selectedAddressId" @click="handleSubmitOrder">
          提交订单
        </el-button>
      </template>
    </el-dialog>

    <!-- ==================== 删除确认弹窗 ==================== -->
    <el-dialog
      v-model="deleteDialogVisible"
      width="480px"
      :close-on-click-modal="false"
      destroy-on-close
      class="delete-dialog"
    >
      <template #header>
        <div class="delete-dialog-header">
          <el-icon :size="24" color="#E74C3C"><WarningFilled /></el-icon>
          <span>确认删除</span>
        </div>
      </template>

      <div class="delete-dialog-body">
        <p class="delete-dialog-tip">
          确定要删除以下 <em>{{ deleteItems.length }}</em> 件商品吗？删除后不可恢复。
        </p>
        <!-- 待删除商品列表 -->
        <div class="delete-items">
          <div v-for="item in deleteItems" :key="item.id" class="delete-item">
            <div class="delete-item-img">
              <img :src="item.product_image || item.cover_image || item.image || defaultImg" :alt="item.productName || item.product_name || item.name" />
            </div>
            <div class="delete-item-info">
              <p class="delete-item-name">{{ item.productName || item.name }}</p>
              <p class="delete-item-price">
                <span>&yen;{{ item.price }} x {{ item.quantity }}</span>
                <span class="delete-item-subtotal">&yen;{{ (item.price * item.quantity).toFixed(2) }}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="deleteDialogVisible = false" size="default">取消</el-button>
        <el-button type="danger" size="default" @click="handleConfirmDelete">
          <el-icon><Delete /></el-icon>
          确认删除
        </el-button>
      </template>
    </el-dialog>

    <!-- ==================== 新增/编辑地址弹窗 ==================== -->
    <el-dialog
      v-model="showAddressDialog"
      :title="editingAddressId ? '编辑收货地址' : '新增收货地址'"
      width="520px"
      destroy-on-close
      @closed="resetAddressForm"
    >
      <el-form :model="addressForm" label-width="80px" ref="addressFormRef">
        <el-form-item label="收货人" required>
          <el-input v-model="addressForm.receiverName" placeholder="请输入收货人姓名" />
        </el-form-item>
        <el-form-item label="手机号" required>
          <el-input v-model="addressForm.receiverPhone" placeholder="请输入手机号" maxlength="11" />
        </el-form-item>
        <el-form-item label="所在地区" required>
          <div class="region-row">
            <el-input v-model="addressForm.province" placeholder="省" class="region-province" />
            <el-input v-model="addressForm.city" placeholder="市" class="region-city" />
            <el-input v-model="addressForm.district" placeholder="区/县" class="region-district" />
          </div>
        </el-form-item>
        <el-form-item label="详细地址" required>
          <el-input v-model="addressForm.detail" placeholder="街道/楼栋/门牌号" />
        </el-form-item>
        <el-form-item label="邮政编码">
          <el-input v-model="addressForm.zipCode" placeholder="选填" maxlength="6" />
        </el-form-item>
        <el-form-item label="设为默认">
          <el-switch v-model="addressForm.isDefault" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showAddressDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSaveAddress">
          {{ editingAddressId ? '更新地址' : '保存地址' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Delete, Plus, WarningFilled, Edit } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useCartStore } from '@/stores/cart'
import { useUserStore } from '@/stores/user'
import { addressApi, orderApi, couponApi } from '@/api'

const router = useRouter()
const cartStore = useCartStore()
const userStore = useUserStore()

// 默认占位图片
const defaultImg = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI0ZERjVFRCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2VyaWYiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiNEOEE1NzQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7op4Lpm4zplos8L3RleHQ+PC9zdmc+'

// ========== 运费计算 ==========
const freightFreeThreshold = 299
const freightFee = 15

// ========== 结算弹窗状态 ==========
const showCheckoutDialog = ref(false)
const selectedAddressId = ref(null)
const orderRemark = ref('')

// 计算应付总额
const checkoutTotal = computed(() => {
  const subtotal = cartStore.selectedTotalPrice
  const freight = subtotal >= freightFreeThreshold ? 0 : freightFee
  return subtotal + freight
})

// ========== 结算优惠券 ==========
const checkoutCoupons = ref([])
const selectedCheckoutCouponId = ref(null)
const selectedCheckoutCoupon = computed(() =>
  checkoutCoupons.value.find(c => c.id === selectedCheckoutCouponId.value) || null
)
const checkoutCouponDiscount = computed(() => {
  if (!selectedCheckoutCoupon.value) return 0
  const c = selectedCheckoutCoupon.value
  const subtotal = cartStore.selectedTotalPrice
  if (c.type === 2) {
    return Math.min(subtotal * (1 - Number(c.reduce_amount) / 100), subtotal)
  }
  return Math.min(Number(c.reduce_amount) || 0, subtotal)
})
const checkoutFinalTotal = computed(() =>
  checkoutTotal.value - checkoutCouponDiscount.value
)

// ========== 删除确认弹窗状态 ==========
const deleteDialogVisible = ref(false)
const deleteItems = ref([])

// ========== 地址管理 ==========
const addressList = ref([])
const showAddressDialog = ref(false)
const editingAddressId = ref(null)
const addressFormRef = ref(null)
const addressForm = reactive({
  receiverName: '',
  receiverPhone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
  zipCode: '',
  isDefault: false,
})

// ========== 数量变更处理 ==========
async function handleQuantityChange(row, newVal) {
  if (!newVal || newVal < 1) newVal = 1
  await cartStore.updateQuantity(row.id, newVal)
}

// ========== 删除功能 ==========
/** 打开删除确认弹窗 */
function openDeleteConfirm(items) {
  if (!items || items.length === 0) {
    ElMessage.warning('请先选择要删除的商品')
    return
  }
  deleteItems.value = items
  deleteDialogVisible.value = true
}

/** 确认删除（自定义弹窗） */
async function handleConfirmDelete() {
  if (deleteItems.value.length === 0) return

  const count = deleteItems.value.length
  deleteDialogVisible.value = false

  if (count === 1) {
    // 单个删除
    await cartStore.removeFromCart(deleteItems.value[0].id)
  } else {
    // 批量删除：先本地移除，再调用 API
    const ids = deleteItems.value.map((item) => item.id)
    cartStore.cartList = cartStore.cartList.filter((item) => !ids.includes(item.id))
    try {
      const { cartApi } = await import('@/api')
      await cartApi.batchRemove(ids)
    } catch (error) {
      console.error('批量删除失败:', error)
      await cartStore.fetchCart()
    }
  }
  ElMessage.success(`已删除 ${count} 件商品`)
}

/** 删除选中商品 - 使用自定义弹窗 */
function handleDeleteSelected() {
  if (cartStore.selectedCount === 0) {
    ElMessage.warning('请先选择要删除的商品')
    return
  }
  openDeleteConfirm(cartStore.selectedItems)
}

// ========== 获取地址列表 ==========
async function fetchAddressList() {
  try {
    const res = await addressApi.getList()
    const data = res.data || res
    const rawList = Array.isArray(data) ? data : data.records || data.list || []
    // 统一字段名（后端返回 snake_case）
    addressList.value = rawList.map(addr => ({
      ...addr,
      receiverName: addr.receiverName || addr.receiver_name || '',
      receiverPhone: addr.receiverPhone || addr.receiver_phone || '',
      isDefault: !!(addr.isDefault || addr.is_default),
      zipCode: addr.zipCode || addr.zip_code || '',
    }))
    // 默认选中默认地址（如果用户还没选过）
    if (!selectedAddressId.value || !addressList.value.find(a => a.id === selectedAddressId.value)) {
      const defaultAddr = addressList.value.find((a) => a.isDefault)
      if (defaultAddr) {
        selectedAddressId.value = defaultAddr.id
      } else if (addressList.value.length > 0) {
        selectedAddressId.value = addressList.value[0].id
      }
    }
  } catch (error) {
    console.error('获取地址列表失败:', error)
    addressList.value = []
  }
}

// 结算弹窗打开时刷新地址列表和优惠券
function openCheckoutDialog() {
  showCheckoutDialog.value = true
  selectedCheckoutCouponId.value = null
  fetchAddressList()
  fetchCheckoutCoupons()
}

// ========== 获取可用优惠券 ==========
async function fetchCheckoutCoupons() {
  try {
    const res = await couponApi.getOrderAvailable(cartStore.selectedTotalPrice)
    const data = res.data || res
    checkoutCoupons.value = Array.isArray(data) ? data : (data.records || data.list || [])
  } catch {
    checkoutCoupons.value = []
  }
}

function couponLabel(c) {
  const type = c.type === 2 ? `${c.reduce_amount}折` : `¥${c.reduce_amount}`
  const cond = c.full_amount > 0 ? `满${c.full_amount}` : '无门槛'
  return `${c.name}（${type}，${cond}）`
}

function handleCouponChange() {
  // selectedCheckoutCoupon is computed, auto-updates
}

// ========== 重置地址表单 ==========
function resetAddressForm() {
  editingAddressId.value = null
  addressForm.receiverName = ''
  addressForm.receiverPhone = ''
  addressForm.province = ''
  addressForm.city = ''
  addressForm.district = ''
  addressForm.detail = ''
  addressForm.zipCode = ''
  addressForm.isDefault = false
}

// ========== 打开编辑地址弹窗 ==========
function openEditAddress(addr) {
  editingAddressId.value = addr.id
  addressForm.receiverName = addr.receiverName || addr.receiver_name || ''
  addressForm.receiverPhone = addr.receiverPhone || addr.receiver_phone || ''
  addressForm.province = addr.province || ''
  addressForm.city = addr.city || ''
  addressForm.district = addr.district || ''
  addressForm.detail = addr.detail || ''
  addressForm.zipCode = addr.zipCode || addr.zip_code || ''
  addressForm.isDefault = !!(addr.isDefault || addr.is_default)
  showAddressDialog.value = true
}

// ========== 保存地址（新增 / 编辑） ==========
async function handleSaveAddress() {
  // 校验
  if (!addressForm.receiverName || !addressForm.receiverPhone || !addressForm.province || !addressForm.city || !addressForm.district || !addressForm.detail) {
    ElMessage.warning('请填写完整的地址信息')
    return
  }
  if (!/^1\d{10}$/.test(addressForm.receiverPhone)) {
    ElMessage.warning('请输入正确的手机号')
    return
  }

  const payload = {
    receiverName: addressForm.receiverName,
    receiverPhone: addressForm.receiverPhone,
    province: addressForm.province,
    city: addressForm.city,
    district: addressForm.district,
    detail: addressForm.detail,
    zipCode: addressForm.zipCode,
    isDefault: addressForm.isDefault ? 1 : 0,
  }

  try {
    if (editingAddressId.value) {
      // 编辑模式
      await addressApi.update({ id: editingAddressId.value, ...payload })
      ElMessage.success('地址更新成功')
    } else {
      // 新增模式
      await addressApi.add(payload)
      ElMessage.success('地址添加成功')
    }
    showAddressDialog.value = false
    resetAddressForm()
    await fetchAddressList()
  } catch (error) {
    console.error('保存地址失败:', error)
  }
}

// ========== 删除地址 ==========
async function handleDeleteAddress(addressId) {
  ElMessageBox.confirm(
    '确定要删除该收货地址吗？',
    '确认删除',
    { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' }
  ).then(async () => {
    try {
      await addressApi.remove(addressId)
      ElMessage.success('地址已删除')
      // 如果删除的是当前选中的，清除选中
      if (selectedAddressId.value === addressId) {
        selectedAddressId.value = null
      }
      await fetchAddressList()
    } catch (error) {
      console.error('删除地址失败:', error)
    }
  }).catch(() => {})
}

// ========== 设置默认地址 ==========
async function handleSetDefault(addressId) {
  try {
    await addressApi.setDefault(addressId)
    ElMessage.success('已设为默认地址')
    await fetchAddressList()
  } catch (error) {
    console.error('设置默认地址失败:', error)
  }
}

// ========== 提交订单 ==========
async function handleSubmitOrder() {
  if (!selectedAddressId.value) {
    ElMessage.warning('请选择收货地址')
    return
  }

  try {
    const checkoutData = cartStore.getCheckoutData()
    await orderApi.create({
      addressId: selectedAddressId.value,
      cartItemIds: checkoutData.cartIds, // 后端字段名 cartItemIds
      buyerMessage: orderRemark.value,   // 后端字段名 buyerMessage
      couponId: selectedCheckoutCouponId.value || undefined,
    })
    ElMessage.success('订单提交成功')
    showCheckoutDialog.value = false
    // 重新加载购物车
    await cartStore.fetchCart()
    // 跳转到订单列表
    router.push('/orders')
  } catch (error) {
    console.error('提交订单失败:', error)
  }
}

// 页面加载时获取数据
onMounted(() => {
  cartStore.fetchCart()
  if (userStore.isLoggedIn) {
    fetchAddressList()
  }
})
</script>

<style scoped>
/* ========== 空购物车 ========== */
.empty-cart {
  background: var(--color-bg-white);
  border-radius: var(--radius-base);
  padding: var(--spacing-xxl);
}

/* ========== 表格区域 ========== */
.cart-table-section {
  background: var(--color-bg-white);
  border-radius: var(--radius-base);
  overflow: hidden;
  margin-bottom: var(--spacing-md);
}

.cart-product {
  display: flex;
  gap: var(--spacing-md);
  cursor: pointer;
}

.cart-product-img {
  width: 80px;
  height: 100px;
  border-radius: var(--radius-small);
  overflow: hidden;
  flex-shrink: 0;
  background: #FDF5ED;
}

.cart-product-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cart-product-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.cart-product-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 4px;
  line-height: 1.4;
}

.cart-product-sku {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.table-price {
  color: var(--color-text-primary);
  font-weight: 500;
}

.table-subtotal {
  color: #C0392B;
  font-weight: 600;
}

/* ========== 底部操作栏 ========== */
.cart-bottom {
  background: var(--color-bg-white);
  border-radius: var(--radius-base);
  padding: var(--spacing-md) var(--spacing-lg);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  bottom: 0;
  box-shadow: 0 -2px 8px rgba(139, 69, 19, 0.06);
}

.bottom-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.bottom-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.bottom-info {
  font-size: 14px;
  color: var(--color-text-regular);
}

.highlight {
  font-style: normal;
  color: #C0392B;
  font-weight: 700;
  font-size: 16px;
  margin: 0 2px;
}

.bottom-total {
  font-size: 14px;
  color: var(--color-text-regular);
}

.total-price {
  color: #C0392B;
  font-size: 20px;
  font-weight: 700;
}

/* ========== 结算弹窗 ========== */
.checkout-section {
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border-light);
}

.checkout-label {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
}

.address-radio-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.address-card {
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-base);
  transition: border-color 0.3s ease;
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: stretch;
}

.address-card.selected {
  border-color: var(--color-primary);
  background-color: rgba(139, 69, 19, 0.04);
}

.address-card-main {
  flex: 1;
  padding: var(--spacing-md);
  cursor: pointer;
}

.addr-radio {
  display: flex;
  align-items: center;
}

.addr-name {
  font-weight: 600;
  margin-right: var(--spacing-sm);
}

.addr-phone {
  color: var(--color-text-secondary);
}

.addr-detail {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-top: 4px;
  margin-left: 24px;
}

.addr-default {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 11px;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  border-radius: 3px;
  padding: 0 4px;
}

.address-card-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: var(--spacing-sm);
  border-left: 1px solid var(--color-border-light);
  min-width: 60px;
  flex-shrink: 0;
}

/* 地区三栏输入 */
.region-row {
  display: flex;
  gap: var(--spacing-sm);
}

.region-province,
.region-city,
.region-district {
  flex: 1;
}

/* 订单商品明细 */
.checkout-items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.checkout-item {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}

.checkout-item-img {
  width: 60px;
  height: 75px;
  border-radius: var(--radius-small);
  overflow: hidden;
  flex-shrink: 0;
  background: #FDF5ED;
}

.checkout-item-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.checkout-item-info {
  flex: 1;
}

.checkout-item-name {
  font-size: 14px;
  color: var(--color-text-primary);
}

.checkout-item-sku {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.checkout-item-price {
  text-align: right;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.checkout-item-subtotal {
  display: block;
  color: #C0392B;
  font-weight: 600;
}

/* 价格明细 */
.checkout-summary {
  text-align: right;
}

.summary-row {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-lg);
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-bottom: 6px;
}

.free-shipping {
  color: var(--color-success);
}

.summary-total {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-lg);
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--color-border-light);
  margin-top: var(--spacing-sm);
}

.total-amount {
  color: #C0392B;
  font-size: 24px;
}

/* 结算优惠券 */
.no-coupon { padding: 4px 0; }

.no-coupon-text {
  font-size: 13px;
  color: var(--color-text-placeholder);
}

.coupon-discount-tip {
  font-size: 13px;
  color: #27AE60;
  margin-top: 6px;
}

.coupon-discount-tip em {
  font-style: normal;
  font-weight: 700;
}

/* ========== 删除确认弹窗 ========== */
.delete-dialog-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.delete-dialog-tip {
  font-size: 14px;
  color: var(--color-text-regular);
  margin-bottom: var(--spacing-md);
  line-height: 1.6;
}

.delete-dialog-tip em {
  color: #E74C3C;
  font-weight: 700;
  font-style: normal;
  font-size: 16px;
}

.delete-items {
  max-height: 260px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--color-bg-primary);
  border-radius: var(--radius-base);
}

.delete-item {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
  padding: var(--spacing-sm);
  background: var(--color-bg-white);
  border-radius: var(--radius-small);
  border: 1px solid var(--color-border-light);
}

.delete-item-img {
  width: 60px;
  height: 75px;
  border-radius: var(--radius-small);
  overflow: hidden;
  flex-shrink: 0;
  background: #FDF5ED;
}

.delete-item-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.delete-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.delete-item-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.delete-item-price {
  font-size: 13px;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.delete-item-subtotal {
  color: #C0392B;
  font-weight: 600;
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .cart-bottom {
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .bottom-right {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>
