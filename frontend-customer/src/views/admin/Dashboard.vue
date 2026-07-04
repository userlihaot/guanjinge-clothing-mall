<template>
  <div class="dashboard">
    <h2 class="page-title">数据统计概览</h2>

    <!-- 4个统计卡片 -->
    <div class="stat-cards">
      <el-card class="stat-card" shadow="hover">
        <div class="stat-icon" style="background:#FFF0E6">📦</div>
        <div class="stat-body">
          <div class="stat-num">{{ data.todayOrders }}</div>
          <div class="stat-label">今日订单</div>
        </div>
      </el-card>
      <el-card class="stat-card" shadow="hover">
        <div class="stat-icon" style="background:#FFF5E6">💰</div>
        <div class="stat-body">
          <div class="stat-num">¥{{ formatNum(data.todaySales) }}</div>
          <div class="stat-label">今日销售额</div>
        </div>
      </el-card>
      <el-card class="stat-card" shadow="hover">
        <div class="stat-icon" style="background:#E8F5E9">👥</div>
        <div class="stat-body">
          <div class="stat-num">{{ data.totalUsers }}</div>
          <div class="stat-label">总用户数</div>
        </div>
      </el-card>
      <el-card class="stat-card" shadow="hover">
        <div class="stat-icon" style="background:#F3E5F5">🛍️</div>
        <div class="stat-body">
          <div class="stat-num">{{ data.activeProducts }}</div>
          <div class="stat-label">上架商品</div>
        </div>
      </el-card>
    </div>

    <div class="dash-grid">
      <!-- 近7天销售趋势 -->
      <el-card class="dash-card" shadow="hover">
        <template #header><span>📈 近7天销售趋势</span></template>
        <div v-if="data.salesTrend && data.salesTrend.length" class="trend-chart">
          <div class="bar-row" v-for="item in data.salesTrend" :key="item.date">
            <span class="bar-date">{{ item.date }}</span>
            <div class="bar-track">
              <div class="bar-fill" :style="{width: barWidth(item.amount)+'%'}"></div>
            </div>
            <span class="bar-amount">¥{{ formatNum(item.amount) }}</span>
          </div>
        </div>
        <el-empty v-else description="暂无销售数据" :image-size="60" />
      </el-card>

      <!-- 订单状态分布 -->
      <el-card class="dash-card" shadow="hover">
        <template #header><span>📊 订单状态分布</span></template>
        <div v-if="data.orderStatus && data.orderStatus.length" class="status-grid">
          <div v-for="s in data.orderStatus" :key="s.status" class="status-item">
            <div class="status-num">{{ s.count }}</div>
            <div class="status-label">{{ statusText(s.status) }}</div>
          </div>
        </div>
        <el-empty v-else description="暂无数据" :image-size="60" />
      </el-card>
    </div>

    <div class="dash-grid">
      <!-- 分类销量 -->
      <el-card class="dash-card" shadow="hover">
        <template #header><span>🏷️ 分类销量排行</span></template>
        <div v-if="data.categorySales && data.categorySales.length">
          <div class="rank-item" v-for="(c, idx) in data.categorySales" :key="c.name">
            <span class="rank-idx" :class="'top'+(idx+1)">{{ idx + 1 }}</span>
            <span class="rank-name">{{ c.name }}</span>
            <span class="rank-count">{{ c.count }}件</span>
          </div>
        </div>
        <el-empty v-else description="暂无数据" :image-size="60" />
      </el-card>

      <!-- 最近订单 -->
      <el-card class="dash-card" shadow="hover">
        <template #header><span>🕐 最近订单</span></template>
        <el-table :data="data.recentOrders || []" stripe size="small" empty-text="暂无订单" max-height="280">
          <el-table-column prop="order_no" label="订单号" width="170" show-overflow-tooltip />
          <el-table-column label="金额" width="90">
            <template #default="{row}">¥{{ row.real_amount }}</template>
          </el-table-column>
          <el-table-column label="状态" width="80">
            <template #default="{row}">
              <el-tag :type="statusType(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="receiver_name" label="收货人" width="80" />
          <el-table-column prop="create_time" label="时间" min-width="140" show-overflow-tooltip />
        </el-table>
      </el-card>
    </div>

    <!-- 快捷入口 -->
    <el-card shadow="hover" style="margin-top:16px">
      <template #header><span>⚡ 快捷操作</span></template>
      <div class="quick-actions">
        <el-button type="primary" @click="$router.push('/admin/products')">🛍️ 商品管理</el-button>
        <el-button type="success" @click="$router.push('/admin/orders')">📋 订单管理</el-button>
        <el-button type="warning" @click="$router.push('/admin/users')">👥 用户管理</el-button>
        <el-button type="info" @click="$router.push('/admin/categories')">📂 分类管理</el-button>
        <el-button @click="$router.push('/admin/coupons')">🎫 优惠券</el-button>
        <el-button @click="$router.push('/admin/banners')">🖼️ 轮播图</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue'
import { adminApi } from '@/api'

const data = reactive({
  todayOrders: 0, todaySales: 0, totalUsers: 0, activeProducts: 0,
  orderStatus: [], recentOrders: [], salesTrend: [], categorySales: []
})

const statusMap = {0:'待付款',1:'待发货',2:'待收货',3:'已完成',4:'已取消',5:'退款中',6:'已退款'}
const typeMap = {0:'warning',1:'info',2:'',3:'success',4:'danger',5:'danger',6:'info'}
function statusText(s) { return statusMap[s] || '未知' }
function statusType(s) { return typeMap[s] || 'info' }
function formatNum(n) { return Number(n || 0).toFixed(2) }

// 计算柱状图最大宽度
const maxAmount = reactive({ val: 1 })
function barWidth(amount) {
  if (maxAmount.val <= 0) return 0
  return Math.round((amount / maxAmount.val) * 100)
}

onMounted(async () => {
  try {
    const res = await adminApi.getDashboard()
    if (res && res.code === 200 && res.data) {
      const d = res.data
      data.todayOrders = d.todayOrders || 0
      data.todaySales = d.todaySales || 0
      data.totalUsers = d.totalUsers || 0
      data.activeProducts = d.activeProducts || 0
      data.orderStatus = d.orderStatus || []
      data.recentOrders = d.recentOrders || []
      data.salesTrend = d.salesTrend || []
      data.categorySales = d.categorySales || []
      // 计算最大销售额
      const amounts = data.salesTrend.map(s => Number(s.amount) || 0)
      maxAmount.val = Math.max(...amounts, 1)
    }
  } catch (e) { console.error(e) }
})
</script>

<style scoped>
.page-title { font-size:20px; font-weight:600; color:#3C2415; margin-bottom:16px }
.stat-cards { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:16px }
.stat-card { display:flex; align-items:center; gap:16px; padding:8px }
.stat-card :deep(.el-card__body) { display:flex; align-items:center; gap:16px; width:100% }
.stat-icon { width:52px; height:52px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:24px; flex-shrink:0 }
.stat-num { font-size:28px; font-weight:bold; color:#8B4513 }
.stat-label { color:#999; margin-top:2px; font-size:13px }
.dash-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px }
.dash-card { height:100% }

/* 柱状图 */
.trend-chart { padding:8px 0 }
.bar-row { display:flex; align-items:center; gap:8px; margin-bottom:8px }
.bar-date { font-size:12px; color:#999; width:70px; flex-shrink:0 }
.bar-track { flex:1; height:20px; background:#FDF5ED; border-radius:4px; overflow:hidden }
.bar-fill { height:100%; background:linear-gradient(90deg,#D4A574,#C0392B); border-radius:4px; transition:width .5s; min-width:2px }
.bar-amount { font-size:12px; color:#666; width:70px; text-align:right }

/* 订单状态分布 */
.status-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px }
.status-item { text-align:center; padding:8px; background:#FDF5ED; border-radius:8px }
.status-num { font-size:24px; font-weight:bold; color:#8B4513 }
.status-label { font-size:12px; color:#999; margin-top:4px }

/* 排行 */
.rank-item { display:flex; align-items:center; gap:8px; padding:6px 0; border-bottom:1px solid #f5f0eb }
.rank-item:last-child { border-bottom:none }
.rank-idx { width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:bold; background:#eee; color:#666 }
.rank-idx.top1 { background:#C0392B; color:#fff }
.rank-idx.top2 { background:#D4A574; color:#fff }
.rank-idx.top3 { background:#E8D5C0; color:#8B4513 }
.rank-name { flex:1; font-size:14px }
.rank-count { font-size:13px; color:#999 }

.quick-actions { display:flex; gap:8px; flex-wrap:wrap }
@media (max-width:1200px) {
  .stat-cards { grid-template-columns:repeat(2,1fr) }
  .dash-grid { grid-template-columns:1fr }
}
</style>
