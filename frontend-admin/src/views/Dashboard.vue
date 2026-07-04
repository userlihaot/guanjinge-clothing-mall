<!-- Dashboard.vue - 仪表盘 / 数据概览页面 -->
<template>
  <div class="dashboard">
    <!-- ========== 4个统计卡片 ========== -->
    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-label">今日订单</div>
        <div class="stat-value">{{ dashboardData.todayOrders ?? '--' }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">今日销售额 (¥)</div>
        <div class="stat-value">{{ formatAmount(dashboardData.todaySales) }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">总用户数</div>
        <div class="stat-value">{{ dashboardData.totalUsers ?? '--' }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">上架商品</div>
        <div class="stat-value">{{ dashboardData.activeProducts ?? '--' }}</div>
      </div>
    </div>

    <!-- ========== 图表区：折线图 + 饼图 ========== -->
    <div class="chart-row">
      <!-- 近7天销售趋势折线图 -->
      <div class="chart-box">
        <div class="chart-title">近7天销售趋势</div>
        <v-chart
          v-if="salesTrendOption"
          :option="salesTrendOption"
          :autoresize="true"
          style="height: 320px"
        />
        <el-empty v-else description="暂无销售数据" :image-size="80" />
      </div>

      <!-- 订单状态分布饼图 -->
      <div class="chart-box">
        <div class="chart-title">订单状态分布</div>
        <v-chart
          v-if="orderStatusOption"
          :option="orderStatusOption"
          :autoresize="true"
          style="height: 320px"
        />
        <el-empty v-else description="暂无订单数据" :image-size="80" />
      </div>
    </div>

    <!-- ========== 分类销量排行 + 最近订单 ========== -->
    <div class="bottom-row">
      <div class="card-container" style="flex:1">
        <div class="card-title">分类销量排行</div>
        <div v-if="categorySales.length > 0" class="rank-list">
          <div v-for="(c, idx) in categorySales" :key="c.name" class="rank-item">
            <span class="rank-idx" :class="'top'+(idx+1)">{{ idx + 1 }}</span>
            <span class="rank-name">{{ c.name }}</span>
            <span class="rank-count">{{ c.count }} 件</span>
          </div>
        </div>
        <el-empty v-else description="暂无数据" :image-size="60" />
      </div>
    </div>

    <!-- ========== 最近10条订单表格 ========== -->
    <div class="card-container">
      <div class="card-title">最近订单</div>
      <el-table
        :data="dashboardData.recentOrders || []"
        stripe
        border
        style="width: 100%"
        empty-text="暂无订单数据"
      >
        <el-table-column prop="order_no" label="订单号" min-width="180" show-overflow-tooltip />
        <el-table-column prop="receiver_name" label="收货人" width="100" />
        <el-table-column label="金额" width="120">
          <template #default="{ row }">
            <span class="amount-text">¥{{ formatAmount(row.real_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getOrderStatusType(row.status)" size="small">
              {{ getOrderStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="create_time" label="下单时间" min-width="160" show-overflow-tooltip />
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { adminApi } from '@/api'

// VChart 组件（vue-echarts）
import VChart from 'vue-echarts'
// ECharts 核心 + 所需组件
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'

// 注册 ECharts 模块
use([CanvasRenderer, LineChart, PieChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent])

// ============ 仪表盘数据 ============
const categorySales = ref([])

const dashboardData = reactive({
  todayOrders: 0,
  todaySales: 0,
  totalUsers: 0,
  activeProducts: 0,
  salesTrend: [],
  recentOrders: []
})

// ============ ECharts 图表配置 ============

// 销售趋势折线图配置
const salesTrendOption = ref(null)

// 订单状态分布饼图配置
const orderStatusOption = ref(null)

// ============ 方法 ============

/**
 * 格式化金额：保留两位小数
 */
function formatAmount(value) {
  if (value === undefined || value === null) return '--'
  return Number(value).toFixed(2)
}

/**
 * 获取订单状态对应的文字
 */
function getOrderStatusText(status) {
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
 * 获取订单状态对应的 Element Plus Tag 类型
 */
function getOrderStatusType(status) {
  const map = {
    0: 'warning',   // 待付款 - 橙色
    1: 'info',      // 待发货 - 蓝色
    2: '',          // 已发货 - 默认
    3: 'success',   // 已完成 - 绿色
    4: 'danger',    // 已取消 - 红色
    5: 'warning',   // 退款中 - 橙色
    6: 'info'       // 已退款 - 蓝色
  }
  return map[status] || 'info'
}

/**
 * 构建销售趋势折线图 ECharts 配置
 */
function buildSalesTrendChart(data) {
  if (!data || data.length === 0) {
    salesTrendOption.value = null
    return
  }
  const dates = data.map(item => item.date)
  const amounts = data.map(item => item.amount)

  salesTrendOption.value = {
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const p = params[0]
        return `${p.axisValue}<br/>销售额：<b>¥${Number(p.value).toFixed(2)}</b>`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLine: { lineStyle: { color: '#dcdfe6' } },
      axisLabel: { color: '#909399' }
    },
    yAxis: {
      type: 'value',
      name: '销售额 (¥)',
      splitLine: { lineStyle: { color: '#ebeef5', type: 'dashed' } },
      axisLabel: { color: '#909399' }
    },
    series: [
      {
        name: '销售额',
        type: 'line',
        smooth: true,
        data: amounts,
        itemStyle: { color: '#409eff' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
            ]
          }
        },
        lineStyle: { width: 3 }
      }
    ]
  }
}

/**
 * 构建订单状态分布饼图 ECharts 配置
 */
function buildOrderStatusChart(data) {
  if (!data || data.length === 0) {
    orderStatusOption.value = null
    return
  }

  orderStatusOption.value = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} 单 ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: { color: '#606266', fontSize: 12 }
    },
    color: ['#f56c6c', '#e6a23c', '#409eff', '#67c23a', '#909399', '#f093fb', '#36cfc9'],
    series: [
      {
        name: '订单状态',
        type: 'pie',
        radius: ['50%', '75%'],
        center: ['40%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        data: data.map(item => ({
          name: item.name,
          value: item.value
        }))
      }
    ]
  }
}

// ============ 页面初始化 ============
onMounted(async () => {
  try {
    const res = await adminApi.getDashboard()
    if (res.code === 200 && res.data) {
      const d = res.data
      dashboardData.todayOrders = d.todayOrders ?? 0
      dashboardData.todaySales = d.todaySales ?? 0
      dashboardData.totalUsers = d.totalUsers ?? 0
      dashboardData.activeProducts = d.activeProducts ?? 0
      dashboardData.salesTrend = d.salesTrend ?? []
      dashboardData.recentOrders = d.recentOrders ?? []

      // 订单状态分布：后端返回 [{status, count}]，转为饼图格式 [{name, value}]
      const statusDist = (d.orderStatus || []).map(item => ({
        name: getOrderStatusText(item.status),
        value: item.count
      }))
      buildOrderStatusChart(statusDist)

      // 销售趋势图表
      buildSalesTrendChart(dashboardData.salesTrend)

      // 分类销量排行
      categorySales.value = d.categorySales ?? []
    }
  } catch {
    // handled by interceptor
  }
})
</script>

<style scoped>
.amount-text {
  font-weight: 600;
  color: #e6a23c;
}

.bottom-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.rank-list {
  display: flex;
  flex-direction: column;
}

.rank-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-color);
}

.rank-item:last-child { border-bottom: none; }

.rank-idx {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  background: #eee;
  color: #666;
  flex-shrink: 0;
}

.rank-idx.top1 { background: #f56c6c; color: #fff; }
.rank-idx.top2 { background: #e6a23c; color: #fff; }
.rank-idx.top3 { background: #409eff; color: #fff; }

.rank-name { flex: 1; font-size: 14px; color: var(--text-primary); }
.rank-count { font-size: 13px; color: #909399; }

@media (max-width: 768px) {
  .bottom-row { flex-direction: column; }
}
</style>
