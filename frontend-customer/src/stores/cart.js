import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { cartApi } from '@/api'
import { isLoggedIn } from '@/utils/auth'

// ============================================
// 购物车状态管理 Store
// 管理购物车商品列表、选中状态、增删改查
// ============================================
export const useCartStore = defineStore(
  'cart',
  () => {
    // ========== 状态 ==========
    // 购物车商品列表
    const cartList = ref([])
    // 是否已从服务端加载
    const loaded = ref(false)

    // ========== 计算属性 ==========
    // 选中的商品列表（用于结算）
    const selectedItems = computed(() =>
      cartList.value.filter((item) => item.checked)
    )

    // 选中的商品数量
    const selectedCount = computed(() =>
      selectedItems.value.reduce((sum, item) => sum + item.quantity, 0)
    )

    // 选中商品的总价
    const selectedTotalPrice = computed(() =>
      selectedItems.value.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      )
    )

    // 购物车中所有商品种类数量
    const totalItems = computed(() => cartList.value.length)

    // 是否全选
    const isAllSelected = computed(() => {
      if (cartList.value.length === 0) return false
      return cartList.value.every((item) => item.checked)
    })

    // 选中的购物车项 ID 列表（用于提交订单）
    const selectedCartIds = computed(() =>
      selectedItems.value.map((item) => item.id)
    )

    // ========== 方法 ==========
    /**
     * 从服务端加载购物车数据
     */
    async function fetchCart() {
      if (!isLoggedIn()) {
        cartList.value = []
        loaded.value = true
        return
      }
      try {
        const res = await cartApi.getList()
        const data = res.data || res
        // 统一数据结构，映射后端字段到前端字段名
        cartList.value = (Array.isArray(data) ? data : data.list || data.records || []).map(
          (item) => ({
            ...item,
            id: item.cartId || item.id,                               // 购物车项ID
            productId: item.product_id,                               // 商品ID
            productName: item.product_name || item.name,              // 商品名
            image: item.product_image || item.image || item.coverImage, // 商品图
            price: Number(item.price) || 0,                           // 单价
            checked: item.selected !== undefined ? item.selected === 1 : true,  // 选中状态
          })
        )
        loaded.value = true
      } catch (error) {
        console.error('加载购物车失败:', error)
        loaded.value = true
      }
    }

    /**
     * 添加商品到购物车
     * @param {number|Object} productId - 商品ID 或 完整参数对象 { productId, skuId, quantity }
     * @param {number} [quantity=1] - 数量
     */
    async function addToCart(productId, quantity = 1) {
      if (!isLoggedIn()) {
        // 未登录时无法添加到购物车，返回特殊标记供调用方处理
        return { needLogin: true }
      }
      try {
        // 兼容两种调用方式：addToCart(id, qty) 和 addToCart({ productId, skuId, quantity })
        const params =
          typeof productId === 'object'
            ? productId
            : { productId, quantity }
        const res = await cartApi.add(params)
        // 添加成功后重新加载购物车
        await fetchCart()
        return res.data || res
      } catch (error) {
        console.error('添加到购物车失败:', error)
        throw error
      }
    }

    /**
     * 更新购物车商品数量
     * @param {number} cartId - 购物车项 ID
     * @param {number} quantity - 新数量
     */
    async function updateQuantity(cartId, quantity) {
      if (quantity < 1) quantity = 1
      // 先更新本地状态，提升交互响应速度
      const item = cartList.value.find((i) => i.id === cartId)
      if (item) {
        item.quantity = quantity
      }
      try {
        await cartApi.update({ id: cartId, quantity })
      } catch (error) {
        console.error('更新购物车数量失败:', error)
        // 失败时重新加载
        await fetchCart()
      }
    }

    /**
     * 从购物车删除单个商品
     * @param {number} cartId - 购物车项 ID
     */
    async function removeFromCart(cartId) {
      // 先更新本地状态
      cartList.value = cartList.value.filter((item) => item.id !== cartId)
      try {
        await cartApi.remove(cartId)
      } catch (error) {
        console.error('删除购物车项失败:', error)
        await fetchCart()
      }
    }

    /**
     * 批量删除选中的购物车商品
     */
    async function removeSelected() {
      const ids = selectedItems.value.map((item) => item.id)
      if (ids.length === 0) return
      // 先更新本地状态
      cartList.value = cartList.value.filter((item) => !ids.includes(item.id))
      try {
        await cartApi.batchRemove(ids)
      } catch (error) {
        console.error('批量删除购物车项失败:', error)
        await fetchCart()
      }
    }

    /**
     * 切换单个商品的选中状态
     * @param {number} cartId - 购物车项 ID
     */
    function toggleCheck(cartId) {
      const item = cartList.value.find((i) => i.id === cartId)
      if (item) {
        item.checked = !item.checked
      }
    }

    /**
     * 切换全选 / 取消全选
     */
    function toggleAllCheck() {
      const newChecked = !isAllSelected.value
      cartList.value.forEach((item) => {
        item.checked = newChecked
      })
    }

    /**
     * 清空购物车
     */
    async function clearCart() {
      cartList.value = []
      try {
        await cartApi.clear()
      } catch (error) {
        console.error('清空购物车失败:', error)
      }
    }

    /**
     * 获取用于提交订单的结算数据
     * @returns {Object} { items, totalPrice }
     */
    function getCheckoutData() {
      return {
        items: selectedItems.value,
        totalPrice: selectedTotalPrice.value,
        cartIds: selectedCartIds.value,
      }
    }

    return {
      cartList,
      loaded,
      selectedItems,
      selectedCount,
      selectedTotalPrice,
      totalItems,
      isAllSelected,
      selectedCartIds,
      fetchCart,
      addToCart,
      updateQuantity,
      removeFromCart,
      removeSelected,
      toggleCheck,
      toggleAllCheck,
      clearCart,
      getCheckoutData,
    }
  },
  {
    // 持久化配置
    persist: {
      key: 'guanjinge-cart-store',
      storage: localStorage,
      pick: ['cartList'], // 仅持久化购物车列表
    },
  }
)
