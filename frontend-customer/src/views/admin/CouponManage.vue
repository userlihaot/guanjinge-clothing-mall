<!-- CouponManage.vue - 优惠券管理页面 -->
<template>
  <div class="coupon-manage">
    <!-- ========== 操作栏 ========== -->
    <div class="card-container">
      <el-button type="primary" :icon="Plus" @click="handleAdd">新增优惠券</el-button>
    </div>

    <!-- ========== 优惠券表格 ========== -->
    <div class="card-container">
      <el-table
        v-loading="loading"
        :data="couponList"
        stripe
        border
        style="width: 100%"
        empty-text="暂无优惠券"
      >
        <!-- ID -->
        <el-table-column prop="id" label="ID" width="60" align="center" />

        <!-- 优惠券名称 -->
        <el-table-column prop="name" label="名称" min-width="150" show-overflow-tooltip />

        <!-- 类型 -->
        <el-table-column label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getCouponTypeTag(row.type)" size="small">
              {{ getCouponTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 门槛 -->
        <el-table-column label="满多少 (¥)" width="120" align="center">
          <template #default="{ row }">
            {{ row.type === 'no_threshold' ? '无门槛' : `¥${formatAmount(row.full_amount)}` }}
          </template>
        </el-table-column>

        <!-- 优惠额度 -->
        <el-table-column label="优惠力度" width="100" align="center">
          <template #default="{ row }">
            <template v-if="row.type === 'discount'">{{ row.reduce_amount }}折</template>
            <template v-else>¥{{ formatAmount(row.reduce_amount) }}</template>
          </template>
        </el-table-column>

        <!-- 发放数量 -->
        <el-table-column prop="total_count" label="发放量" width="90" align="center" />

        <!-- 操作 -->
        <el-table-column label="操作" width="80" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="danger" size="small" :icon="Delete" link @click="handleDelete(row)">
              删除
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
          @size-change="fetchCoupons"
          @current-change="fetchCoupons"
        />
      </div>
    </div>

    <!-- ========== 新增优惠券 Dialog ========== -->
    <el-dialog
      v-model="dialogVisible"
      title="新增优惠券"
      width="480px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="80px"
      >
        <!-- 名称 -->
        <el-form-item label="名称" prop="name">
          <el-input v-model="formData.name" placeholder="例如：满200减30" />
        </el-form-item>

        <!-- 类型 -->
        <el-form-item label="类型" prop="type">
          <el-select v-model="formData.type" placeholder="请选择优惠券类型" style="width: 100%">
            <el-option label="满减券" value="full_reduction" />
            <el-option label="折扣券" value="discount" />
            <el-option label="无门槛券" value="no_threshold" />
          </el-select>
        </el-form-item>

        <!-- 满多少（满减券和折扣券需要） -->
        <el-form-item v-if="formData.type !== 'no_threshold'" label="满多少" prop="fullAmount">
          <el-input-number
            v-model="formData.fullAmount"
            :min="0"
            :precision="2"
            :step="10"
            placeholder="满多少元可用"
            style="width: 100%"
          />
        </el-form-item>

        <!-- 减多少（满减券和无门槛券需要） -->
        <el-form-item
          v-if="formData.type === 'full_reduction' || formData.type === 'no_threshold'"
          label="减多少"
          prop="reduceAmount"
        >
          <el-input-number
            v-model="formData.reduceAmount"
            :min="0.01"
            :precision="2"
            :step="5"
            placeholder="减免金额"
            style="width: 100%"
          />
        </el-form-item>

        <!-- 折扣值（折扣券需要） -->
        <el-form-item v-if="formData.type === 'discount'" label="折扣" prop="discountValue">
          <el-input-number
            v-model="formData.discountValue"
            :min="1"
            :max="9.9"
            :precision="1"
            :step="0.5"
            placeholder="如 8.5 表示八五折"
            style="width: 100%"
          />
        </el-form-item>

        <!-- 开始时间 -->
        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker v-model="formData.startTime" type="datetime" placeholder="选择开始时间" style="width:100%" value-format="YYYY-MM-DD HH:mm:ss" />
        </el-form-item>
        <!-- 结束时间 -->
        <el-form-item label="结束时间" prop="endTime">
          <el-date-picker v-model="formData.endTime" type="datetime" placeholder="选择结束时间" style="width:100%" value-format="YYYY-MM-DD HH:mm:ss" />
        </el-form-item>
        <!-- 发放数量 -->
        <el-form-item label="发放量" prop="totalCount">
          <el-input-number
            v-model="formData.totalCount"
            :min="1"
            :step="1"
            placeholder="发放数量"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import { adminApi } from '@/api'

// ============ 优惠券列表 ============
const couponList = ref([])
const loading = ref(false)

// ============ 分页 ============
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

// ============ Dialog ============
const dialogVisible = ref(false)
const submitLoading = ref(false)
const formRef = ref(null)

// 新增表单数据
const formData = reactive({
  name: '',
  type: '',            // full_reduction | discount | no_threshold
  fullAmount: 0,       // 满多少
  reduceAmount: 0,     // 减多少
  discountValue: 8.5,  // 折扣值（折扣券使用）
  totalCount: 100,     // 发放量
  startTime: '',       // 开始时间
  endTime: ''          // 结束时间
})

// 表单验证规则
const formRules = {
  name: [{ required: true, message: '请输入优惠券名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  totalCount: [{ required: true, message: '请输入发放量', trigger: 'blur' }]
}

// ============ 工具方法 ============

/**
 * 获取优惠券类型文字
 */
function getCouponTypeText(type) {
  const map = {
    full_reduction: '满减券',
    discount: '折扣券',
    no_threshold: '无门槛'
  }
  return map[type] || '未知'
}

/**
 * 获取优惠券类型 Tag 颜色
 */
function getCouponTypeTag(type) {
  const map = {
    full_reduction: 'success',
    discount: 'warning',
    no_threshold: 'info'
  }
  return map[type] || 'info'
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
 * 获取优惠券列表
 */
async function fetchCoupons() {
  loading.value = true
  try {
    const res = await adminApi.getCoupons({
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    if (res.code === 200) {
      // 后端直接返回数组，适配两种格式
      const data = res.data
      couponList.value = Array.isArray(data) ? data : (data.records || data.list || [])
      pagination.total = Array.isArray(data) ? data.length : (data.total || 0)
    }
  } catch {
    // 错误由拦截器处理
  } finally {
    loading.value = false
  }
}

/**
 * 打开新增 Dialog
 */
function handleAdd() {
  formData.name = ''
  formData.type = ''
  formData.fullAmount = 0
  formData.reduceAmount = 0
  formData.discountValue = 8.5
  formData.totalCount = 100
  formData.startTime = ''
  formData.endTime = ''
  dialogVisible.value = true
}

/**
 * 提交新增优惠券
 */
async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    const res = await adminApi.createCoupon({
      name: formData.name,
      type: formData.type,
      fullAmount: formData.fullAmount,
      reduceAmount: formData.type === 'discount' ? formData.discountValue : formData.reduceAmount,
      totalCount: formData.totalCount,
      startTime: formData.startTime,
      endTime: formData.endTime
    })
    if (res.code === 200) {
      ElMessage.success('优惠券创建成功')
      dialogVisible.value = false
      fetchCoupons()
    } else {
      ElMessage.error(res.message || '创建失败')
    }
  } catch {
    // 错误由拦截器处理
  } finally {
    submitLoading.value = false
  }
}

/**
 * 删除优惠券
 */
function handleDelete(row) {
  ElMessageBox.confirm(
    `确定要删除优惠券「${row.name}」吗？`,
    '删除确认',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
  ).then(async () => {
    try {
      const res = await adminApi.deleteCoupon(row.id)
      if (res.code === 200) {
        ElMessage.success('删除成功')
        fetchCoupons()
      } else {
        ElMessage.error(res.message || '删除失败')
      }
    } catch {
      // 错误由拦截器处理
    }
  }).catch(() => {
    // 用户取消
  })
}

// ============ 页面加载 ============
onMounted(() => {
  fetchCoupons()
})
</script>

<style scoped>
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
