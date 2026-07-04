<template>
  <div class="profile-page page-container">
    <h1 class="page-title">个人中心</h1>

    <div class="profile-layout">
      <!-- ==================== 左侧菜单 ==================== -->
      <div class="profile-sidebar">
        <div class="user-info-card">
          <div class="user-avatar-section">
            <el-avatar :size="72" class="avatar">
              {{ userStore.nickname.charAt(0) }}
            </el-avatar>
            <h3 class="ui-name">{{ userStore.nickname }}</h3>
          </div>
          <div class="ui-stats">
            <div class="stat-item" @click="activeMenu = 'orders'">
              <span class="stat-num">{{ orderCount }}</span>
              <span class="stat-label">全部订单</span>
            </div>
            <div class="stat-item" @click="$router.push('/cart')">
              <span class="stat-num">{{ cartStore.totalItems }}</span>
              <span class="stat-label">购物车</span>
            </div>
            <div class="stat-item">
              <span class="stat-num">{{ favoriteCount }}</span>
              <span class="stat-label">收藏</span>
            </div>
          </div>
        </div>

        <el-menu
          :default-active="activeMenu"
          class="profile-menu"
          @select="handleMenuSelect"
        >
          <el-menu-item index="orders">
            <el-icon><Document /></el-icon>我的订单
          </el-menu-item>
          <el-menu-item index="profile">
            <el-icon><User /></el-icon>个人资料
          </el-menu-item>
          <el-menu-item index="password">
            <el-icon><Lock /></el-icon>修改密码
          </el-menu-item>
          <el-menu-item index="address">
            <el-icon><Location /></el-icon>收货地址
          </el-menu-item>
          <el-menu-item index="favorites">
            <el-icon><Star /></el-icon>我的收藏
          </el-menu-item>
          <el-menu-item index="coupons">
            <el-icon><Ticket /></el-icon>优惠券
          </el-menu-item>
        </el-menu>
      </div>

      <!-- ==================== 右侧内容区 ==================== -->
      <div class="profile-content">
        <!-- 我的订单（快捷跳转） -->
        <div v-if="activeMenu === 'orders'" class="content-card">
          <h3 class="content-title">最近订单</h3>
          <div v-if="recentOrders.length > 0" class="recent-orders">
            <div v-for="order in recentOrders" :key="order.order_no" class="ro-item">
              <div class="ro-header">
                <span class="ro-no">订单号：{{ order.order_no }}</span>
                <span class="ro-status">{{ statusText(order.status) }}</span>
              </div>
              <div class="ro-amount">
                &yen;{{ Number(order.real_amount).toFixed(2) }}
              </div>
              <div class="ro-time">{{ order.create_time }}</div>
            </div>
            <el-button type="primary" link @click="$router.push('/orders')">查看全部订单</el-button>
          </div>
          <el-empty v-else description="暂无订单" />
        </div>

        <!-- 个人资料编辑 -->
        <div v-if="activeMenu === 'profile'" class="content-card">
          <h3 class="content-title">个人资料</h3>
          <el-form :model="profileForm" label-width="80px" class="profile-form">
            <el-form-item label="用户名">
              <el-input v-model="profileForm.username" disabled />
            </el-form-item>
            <el-form-item label="昵称">
              <el-input v-model="profileForm.nickname" placeholder="请输入昵称" maxlength="20" />
            </el-form-item>
            <el-form-item label="手机号">
              <el-input v-model="profileForm.mobile" placeholder="请输入手机号" maxlength="11" />
            </el-form-item>
            <el-form-item label="性别">
              <el-radio-group v-model="profileForm.gender">
                <el-radio value="male">男</el-radio>
                <el-radio value="female">女</el-radio>
                <el-radio value="other">保密</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="生日">
              <el-date-picker
                v-model="profileForm.birthday"
                type="date"
                placeholder="选择日期"
                format="YYYY/MM/DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="saving" @click="handleSaveProfile">保存修改</el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 修改密码 -->
        <div v-if="activeMenu === 'password'" class="content-card">
          <h3 class="content-title">修改密码</h3>
          <el-form :model="passwordForm" label-width="100px" ref="passwordFormRef" class="profile-form">
            <el-form-item label="原密码" required>
              <el-input v-model="passwordForm.oldPassword" type="password" show-password placeholder="请输入原密码" />
            </el-form-item>
            <el-form-item label="新密码" required>
              <el-input v-model="passwordForm.newPassword" type="password" show-password placeholder="请输入新密码（6-20位）" />
            </el-form-item>
            <el-form-item label="确认新密码" required>
              <el-input v-model="passwordForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="changingPwd" @click="handleChangePassword">确认修改</el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 收货地址管理 -->
        <div v-if="activeMenu === 'address'" class="content-card">
          <div class="content-header">
            <h3 class="content-title">收货地址</h3>
            <el-button type="primary" size="small" @click="showAddAddress = true">
              <el-icon><Plus /></el-icon>新增地址
            </el-button>
          </div>
          <div v-if="addressList.length > 0" class="address-items">
            <div v-for="addr in addressList" :key="addr.id" class="addr-card">
              <div class="addr-top">
                <span class="addr-contact">{{ addr.receiverName || addr.receiver_name }} {{ addr.receiverPhone || addr.receiver_phone }}</span>
                <span v-if="addr.isDefault || addr.is_default" class="addr-default">默认</span>
              </div>
              <p class="addr-full">{{ addr.province }}{{ addr.city }}{{ addr.district }} {{ addr.detail }}</p>
              <div class="addr-actions">
                <el-button link type="primary" size="small" @click="editAddress(addr)">编辑</el-button>
                <el-popconfirm title="确定删除该地址吗？" @confirm="handleDeleteAddress(addr.id)">
                  <template #reference>
                    <el-button link type="danger" size="small">删除</el-button>
                  </template>
                </el-popconfirm>
                <el-button v-if="!addr.isDefault" link type="warning" size="small" @click="handleSetDefault(addr.id)">
                  设为默认
                </el-button>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无收货地址" />
        </div>

        <!-- 优惠券 -->
        <div v-if="activeMenu === 'coupons'" class="content-card">
          <!-- 可领取的优惠券 -->
          <h3 class="content-title">领券中心</h3>
          <div v-if="availableCoupons.length > 0" class="coupon-section">
            <div v-for="c in availableCoupons" :key="c.id" class="coupon-card">
              <div class="cc-left">
                <span class="cc-value">
                  <template v-if="c.type === 2">{{ c.reduce_amount }}折</template>
                  <template v-else>¥{{ c.reduce_amount }}</template>
                </span>
                <span class="cc-condition" v-if="c.full_amount > 0">满{{ c.full_amount }}可用</span>
                <span class="cc-condition" v-else>无门槛</span>
              </div>
              <div class="cc-right">
                <p class="cc-name">{{ c.name }}</p>
                <p class="cc-desc">{{ c.description || '' }}</p>
                <p class="cc-expire">有效期至 {{ c.end_time?.slice(0, 10) }}</p>
              </div>
              <el-button type="primary" size="small" @click="handleReceiveCoupon(c)">
                立即领取
              </el-button>
            </div>
          </div>
          <el-empty v-else description="暂无可领取的优惠券" :image-size="60" />

          <!-- 分隔 -->
          <el-divider />

          <!-- 我的优惠券 -->
          <h3 class="content-title">我的优惠券</h3>
          <div v-if="myCoupons.length > 0" class="coupon-section">
            <div v-for="c in myCoupons" :key="c.id" class="coupon-card" :class="{ used: c.status !== 1 }">
              <div class="cc-left">
                <span class="cc-value" :class="{ 'cc-used': c.status !== 1 }">
                  <template v-if="c.type === 2">{{ c.reduce_amount }}折</template>
                  <template v-else>¥{{ c.reduce_amount }}</template>
                </span>
                <span class="cc-condition" v-if="c.full_amount > 0">满{{ c.full_amount }}可用</span>
                <span class="cc-condition" v-else>无门槛</span>
              </div>
              <div class="cc-right">
                <p class="cc-name">{{ c.name }}</p>
                <p class="cc-desc">{{ c.description || '' }}</p>
                <p class="cc-expire">有效期至 {{ c.end_time?.slice(0, 10) }}</p>
              </div>
              <el-tag :type="c.status === 1 ? 'success' : c.status === 2 ? 'info' : 'danger'" size="small">
                {{ c.status === 1 ? '已领取' : c.status === 2 ? '已使用' : '已过期' }}
              </el-tag>
            </div>
          </div>
          <el-empty v-else description="还没有领取优惠券，去领券中心看看吧" :image-size="60" />
        </div>

        <!-- 我的收藏 -->
        <div v-if="activeMenu === 'favorites'" class="content-card">
          <h3 class="content-title">我的收藏</h3>
          <div v-if="favorites.length > 0" class="fav-list">
            <div v-for="item in favorites" :key="item.id" class="fav-item" @click="$router.push(`/product/${item.productId}`)">
              <div class="fav-img">
                <img :src="item.product_image || item.image || defaultImg" :alt="item.product_name || item.name" />
              </div>
              <div class="fav-info">
                <p class="fav-name">{{ item.product_name || item.name }}</p>
                <p class="fav-price">&yen;{{ item.price }}</p>
              </div>
              <el-button link type="danger" size="small" @click.stop="handleRemoveFavorite(item)">取消收藏</el-button>
            </div>
          </div>
          <el-empty v-else description="暂无收藏" />
        </div>
      </div>
    </div>

    <!-- 新增/编辑地址弹窗 -->
    <el-dialog v-model="showAddAddress" :title="editingAddress ? '编辑地址' : '新增收货地址'" width="500px" destroy-on-close>
      <el-form :model="addressForm" label-width="80px">
        <el-form-item label="收货人" required>
          <el-input v-model="addressForm.receiverName" placeholder="请输入收货人姓名" />
        </el-form-item>
        <el-form-item label="手机号" required>
          <el-input v-model="addressForm.receiverPhone" placeholder="请输入手机号" maxlength="11" />
        </el-form-item>
        <el-form-item label="所在地区" required>
          <el-input v-model="addressForm.region" placeholder="省/市/区" />
        </el-form-item>
        <el-form-item label="详细地址" required>
          <el-input v-model="addressForm.detail" placeholder="街道/楼栋/门牌号" />
        </el-form-item>
        <el-form-item label="设为默认">
          <el-switch v-model="addressForm.isDefault" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddAddress = false">取消</el-button>
        <el-button type="primary" @click="handleSaveAddress">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Document, User, Lock, Location, Star, Plus, Ticket } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'
import { orderApi, addressApi, favoriteApi, couponApi } from '@/api'

const router = useRouter()
const userStore = useUserStore()
const cartStore = useCartStore()

const defaultImg = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI0ZERjVFRCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2VyaWYiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiNEOEE1NzQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7op4Lpm4zplos8L3RleHQ+PC9zdmc+'

// 当前激活菜单
const activeMenu = ref('orders')

// 统计数据
const orderCount = ref(0)
const favoriteCount = ref(0)

// 最近订单
const recentOrders = ref([])

// 个人资料
const saving = ref(false)
const profileForm = reactive({
  username: '',
  nickname: '',
  mobile: '',
  gender: 'other',
  birthday: '',
})

// 修改密码
const changingPwd = ref(false)
const passwordFormRef = ref(null)
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

// 地址管理
const addressList = ref([])
const showAddAddress = ref(false)
const editingAddress = ref(null)
const addressForm = reactive({
  receiverName: '',
  receiverPhone: '',
  region: '',
  detail: '',
  isDefault: false,
})

// 收藏列表
const favorites = ref([])

// 菜单切换
function handleMenuSelect(index) {
  activeMenu.value = index
  if (index === 'orders') {
    fetchRecentOrders()
  } else if (index === 'profile') {
    initProfileForm()
  } else if (index === 'address') {
    fetchAddressList()
  } else if (index === 'favorites') {
    fetchFavorites()
  } else if (index === 'coupons') {
    fetchCoupons()
  }
}

// 状态文字
function statusText(status) {
  const map = { 0: '待付款', 1: '待发货', 2: '待收货', 3: '已完成', 4: '已取消', 5: '退款中', 6: '已退款' }
  return map[status] || '-'
}

// 获取最近订单
async function fetchRecentOrders() {
  try {
    const res = await orderApi.getList({ page: 1, size: 5 })
    const data = res.data || res
    recentOrders.value = (data.records || data.list || (Array.isArray(data) ? data : [])).slice(0, 5)
    orderCount.value = data.total || recentOrders.value.length
  } catch {
    recentOrders.value = []
  }
}

// 初始化个人资料表单
function initProfileForm() {
  const user = userStore.userInfo || {}
  profileForm.username = user.username || ''
  profileForm.nickname = user.nickname || ''
  profileForm.mobile = user.mobile || ''
  profileForm.gender = user.gender || 'other'
  profileForm.birthday = user.birthday || ''
}

// 保存个人资料
async function handleSaveProfile() {
  saving.value = true
  try {
    await userStore.updateUserInfo({
      nickname: profileForm.nickname,
      mobile: profileForm.mobile,
      gender: profileForm.gender,
      birthday: profileForm.birthday,
    })
    ElMessage.success('个人资料更新成功')
  } catch (error) {
    console.error('更新失败:', error)
  } finally {
    saving.value = false
  }
}

// 修改密码
async function handleChangePassword() {
  if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
    ElMessage.warning('请填写完整密码信息')
    return
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.warning('两次输入的新密码不一致')
    return
  }
  if (passwordForm.newPassword.length < 6) {
    ElMessage.warning('新密码长度至少6位')
    return
  }
  changingPwd.value = true
  try {
    await userStore.changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
    })
    ElMessage.success('密码修改成功')
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (error) {
    console.error('修改密码失败:', error)
  } finally {
    changingPwd.value = false
  }
}

// 获取地址列表
async function fetchAddressList() {
  try {
    const res = await addressApi.getList()
    const data = res.data || res
    addressList.value = Array.isArray(data) ? data : data.records || data.list || []
  } catch {
    addressList.value = []
  }
}

// 编辑地址
function editAddress(addr) {
  editingAddress.value = addr
  addressForm.receiverName = addr.receiverName || ''
  addressForm.receiverPhone = addr.receiverPhone || ''
  addressForm.region = [addr.province, addr.city, addr.district].filter(Boolean).join('/')
  addressForm.detail = addr.detail || ''
  addressForm.isDefault = !!addr.isDefault
  showAddAddress.value = true
}

// 保存地址
async function handleSaveAddress() {
  if (!addressForm.receiverName || !addressForm.receiverPhone || !addressForm.region || !addressForm.detail) {
    ElMessage.warning('请填写完整地址信息')
    return
  }
  try {
    const data = {
      receiverName: addressForm.receiverName,
      receiverPhone: addressForm.receiverPhone,
      province: addressForm.region.split('/')[0] || '',
      city: addressForm.region.split('/')[1] || '',
      district: addressForm.region.split('/')[2] || '',
      detail: addressForm.detail,
      isDefault: addressForm.isDefault ? 1 : 0,
    }
    if (editingAddress.value) {
      await addressApi.update({ ...data, id: editingAddress.value.id })
    } else {
      await addressApi.add(data)
    }
    ElMessage.success(editingAddress.value ? '地址更新成功' : '地址添加成功')
    showAddAddress.value = false
    editingAddress.value = null
    resetAddressForm()
    fetchAddressList()
  } catch (error) {
    console.error('保存地址失败:', error)
  }
}

// 删除地址
async function handleDeleteAddress(id) {
  try {
    await addressApi.remove(id)
    ElMessage.success('地址已删除')
    fetchAddressList()
  } catch (error) {
    console.error('删除地址失败:', error)
  }
}

// 设为默认
async function handleSetDefault(id) {
  try {
    await addressApi.setDefault(id)
    ElMessage.success('已设为默认地址')
    fetchAddressList()
  } catch (error) {
    console.error('设置默认失败:', error)
  }
}

function resetAddressForm() {
  addressForm.receiverName = ''
  addressForm.receiverPhone = ''
  addressForm.region = ''
  addressForm.detail = ''
  addressForm.isDefault = false
}

// 获取收藏列表
async function fetchFavorites() {
  try {
    const res = await favoriteApi.getList({ page: 1, size: 20 })
    const data = res.data || res
    favorites.value = data.records || data.list || (Array.isArray(data) ? data : [])
    favoriteCount.value = favorites.value.length
  } catch {
    favorites.value = []
  }
}

// 取消收藏
async function handleRemoveFavorite(item) {
  try {
    await favoriteApi.toggle(item.product_id || item.productId || item.id)
    ElMessage.success('已取消收藏')
    fetchFavorites()
  } catch (error) {
    console.error('取消收藏失败:', error)
  }
}

// ========== 优惠券 ==========
const availableCoupons = ref([])
const myCoupons = ref([])

// 获取可领取的优惠券和我的优惠券
async function fetchCoupons() {
  try {
    const [availRes, myRes] = await Promise.all([
      couponApi.getAvailable(),
      couponApi.getMyCoupons(),
    ])
    const availData = availRes.data || availRes
    availableCoupons.value = Array.isArray(availData) ? availData : (availData.records || availData.list || [])
    const myData = myRes.data || myRes
    myCoupons.value = Array.isArray(myData) ? myData : (myData.records || myData.list || [])
  } catch {
    availableCoupons.value = []
    myCoupons.value = []
  }
}

// 领取优惠券
async function handleReceiveCoupon(coupon) {
  try {
    await couponApi.receive(coupon.id)
    ElMessage.success('领取成功！')
    fetchCoupons()
  } catch {
    // handled by interceptor
  }
}

onMounted(() => {
  fetchRecentOrders()
})
</script>

<style scoped>
.profile-layout {
  display: flex;
  gap: var(--spacing-lg);
  align-items: flex-start;
}

/* 左侧 */
.profile-sidebar {
  width: 240px;
  flex-shrink: 0;
}

.user-info-card {
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent-dark));
  border-radius: var(--radius-base);
  padding: var(--spacing-xl) var(--spacing-lg);
  margin-bottom: var(--spacing-md);
  color: #fff;
  text-align: center;
}

.avatar {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 28px;
  margin-bottom: var(--spacing-sm);
}

.ui-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: var(--spacing-md);
}

.ui-stats {
  display: flex;
  justify-content: space-around;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  padding-top: var(--spacing-md);
}

.stat-item {
  cursor: pointer;
  transition: opacity 0.3s;
}

.stat-item:hover {
  opacity: 0.8;
}

.stat-num {
  display: block;
  font-size: 22px;
  font-weight: 700;
}

.stat-label {
  display: block;
  font-size: 12px;
  opacity: 0.85;
}

.profile-menu {
  border-radius: var(--radius-base);
  border: 1px solid var(--color-border-light);
}

/* 右侧内容 */
.profile-content {
  flex: 1;
  min-width: 0;
}

.content-card {
  background: var(--color-bg-white);
  border-radius: var(--radius-base);
  padding: var(--spacing-lg);
  min-height: 300px;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.content-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-lg);
}

.profile-form {
  max-width: 450px;
}

/* 最近订单 */
.recent-orders {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.ro-item {
  padding: var(--spacing-md);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-base);
  transition: box-shadow 0.3s;
}

.ro-item:hover {
  box-shadow: var(--shadow-light);
}

.ro-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.ro-no {
  font-size: 13px;
  font-family: monospace;
  color: var(--color-text-secondary);
}

.ro-status {
  font-size: 13px;
  color: var(--color-primary);
}

.ro-amount {
  font-size: 18px;
  font-weight: 700;
  color: #C0392B;
  margin-bottom: 2px;
}

.ro-time {
  font-size: 12px;
  color: var(--color-text-placeholder);
}

/* 地址卡片 */
.address-items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.addr-card {
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-base);
  padding: var(--spacing-md);
}

.addr-top {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: 4px;
}

.addr-contact {
  font-weight: 600;
  color: var(--color-text-primary);
}

.addr-default {
  font-size: 11px;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  border-radius: 3px;
  padding: 0 4px;
}

.addr-full {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-sm);
}

.addr-actions {
  display: flex;
  gap: var(--spacing-sm);
}

/* 收藏列表 */
.fav-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.fav-item {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
  padding: var(--spacing-md);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-base);
  cursor: pointer;
  transition: box-shadow 0.3s;
}

.fav-item:hover {
  box-shadow: var(--shadow-light);
}

.fav-img {
  width: 60px;
  height: 75px;
  border-radius: var(--radius-small);
  overflow: hidden;
  flex-shrink: 0;
  background: #FDF5ED;
}

.fav-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.fav-info {
  flex: 1;
}

.fav-name {
  font-size: 14px;
  color: var(--color-text-primary);
}

.fav-price {
  font-size: 16px;
  font-weight: 700;
  color: #C0392B;
  margin-top: 4px;
}

/* ========== 优惠券 ========== */
.coupon-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.coupon-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-base);
  transition: box-shadow 0.3s;
}

.coupon-card:hover { box-shadow: var(--shadow-light); }
.coupon-card.used { opacity: 0.6; }

.cc-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 70px;
  flex-shrink: 0;
  padding-right: var(--spacing-md);
  border-right: 1px dashed var(--color-border-light);
}

.cc-value {
  font-size: 20px;
  font-weight: 700;
  color: #C0392B;
}

.cc-value.cc-used { color: var(--color-text-placeholder); }

.cc-condition {
  font-size: 11px;
  color: var(--color-text-placeholder);
  margin-top: 2px;
}

.cc-right { flex: 1; }

.cc-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.cc-desc {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: 2px;
}

.cc-expire {
  font-size: 11px;
  color: var(--color-text-placeholder);
  margin-top: 2px;
}

@media (max-width: 768px) {
  .profile-layout {
    flex-direction: column;
  }

  .profile-sidebar {
    width: 100%;
  }
}
</style>
