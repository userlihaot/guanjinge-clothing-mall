<!-- CouponManage.vue - 优惠券管理页面 -->
<template>
  <div class="coupon-manage">
    <div class="card-container">
      <el-button type="primary" :icon="Plus" @click="handleAdd">新增优惠券</el-button>
    </div>

    <div class="card-container">
      <el-table v-loading="loading" :data="couponList" stripe border style="width:100%" empty-text="暂无优惠券">
        <el-table-column prop="id" label="ID" width="60" align="center" />
        <el-table-column prop="name" label="名称" min-width="140" show-overflow-tooltip />
        <el-table-column label="类型" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="typeTag(row.type)" size="small">{{ typeText(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="门槛" width="110" align="center">
          <template #default="{ row }">
            {{ row.type === 3 ? '无门槛' : `满¥${Number(row.full_amount||0).toFixed(0)}` }}
          </template>
        </el-table-column>
        <el-table-column label="优惠" width="100" align="center">
          <template #default="{ row }">
            <template v-if="row.type === 2">{{ row.reduce_amount }}折</template>
            <template v-else>-¥{{ Number(row.reduce_amount||0).toFixed(0) }}</template>
          </template>
        </el-table-column>
        <el-table-column label="有效期" min-width="200">
          <template #default="{ row }">
            <span class="date-text">{{ row.start_time?.slice(0,10) }} ~ {{ row.end_time?.slice(0,10) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="领取/总量" width="100" align="center">
          <template #default="{ row }">
            {{ row.received_count || 0 }}/{{ row.total_count }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="danger" size="small" :icon="Delete" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- ========== 删除确认 Dialog ========== -->
    <el-dialog v-model="deleteVisible" width="420px" :close-on-click-modal="false" destroy-on-close>
      <template #header>
        <div style="display:flex;align-items:center;gap:8px;font-size:18px;font-weight:600">
          <el-icon :size="22" color="#E74C3C"><WarningFilled /></el-icon>
          <span>确认删除优惠券</span>
        </div>
      </template>
      <div v-if="deleteTarget" class="delete-body">
        <p class="delete-tip">确定要删除该优惠券吗？<em>删除后不可恢复。</em></p>
        <div class="delete-info">
          <div class="dl-row"><span>名称</span><b>{{ deleteTarget.name }}</b></div>
          <div class="dl-row"><span>类型</span><el-tag :type="typeTag(deleteTarget.type)" size="small">{{ typeText(deleteTarget.type) }}</el-tag></div>
          <div class="dl-row"><span>优惠</span><b style="color:#C0392B">{{ deleteTarget.type === 2 ? deleteTarget.reduce_amount+'折' : '-¥'+Number(deleteTarget.reduce_amount||0).toFixed(0) }}</b></div>
        </div>
      </div>
      <template #footer>
        <el-button @click="deleteVisible=false">取消</el-button>
        <el-button type="danger" :loading="deleteLoading" @click="handleConfirmDelete">确认删除</el-button>
      </template>
    </el-dialog>

    <!-- ========== 新增优惠券 Dialog ========== -->
    <el-dialog v-model="dialogVisible" title="新增优惠券" width="500px" :close-on-click-modal="false" destroy-on-close>
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="formData.name" placeholder="例如：满200减30" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="formData.type" placeholder="请选择类型" style="width:100%">
            <el-option label="满减券" :value="1" />
            <el-option label="折扣券" :value="2" />
            <el-option label="无门槛券" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="formData.type !== 3" label="满多少" prop="fullAmount">
          <el-input-number v-model="formData.fullAmount" :min="0" :precision="2" :step="10" placeholder="满多少元可用" style="width:100%" />
        </el-form-item>
        <el-form-item v-if="formData.type === 1 || formData.type === 3" label="减多少" prop="reduceAmount">
          <el-input-number v-model="formData.reduceAmount" :min="0.01" :precision="2" :step="5" placeholder="减免金额" style="width:100%" />
        </el-form-item>
        <el-form-item v-if="formData.type === 2" label="折扣" prop="discountValue">
          <el-input-number v-model="formData.discountValue" :min="1" :max="9.9" :precision="1" :step="0.5" placeholder="如 8.5 表示八五折" style="width:100%" />
        </el-form-item>
        <el-form-item label="有效期" required>
          <div style="display:flex;gap:8px;width:100%">
            <el-date-picker v-model="formData.startTime" type="datetime" placeholder="开始时间" value-format="YYYY-MM-DD HH:mm:ss" style="flex:1" />
            <el-date-picker v-model="formData.endTime" type="datetime" placeholder="结束时间" value-format="YYYY-MM-DD HH:mm:ss" style="flex:1" />
          </div>
        </el-form-item>
        <el-form-item label="发放量" prop="totalCount">
          <el-input-number v-model="formData.totalCount" :min="1" :step="1" placeholder="发放数量" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Delete, WarningFilled } from '@element-plus/icons-vue'
import { adminApi } from '@/api'

const couponList = ref([])
const loading = ref(false)

const dialogVisible = ref(false)
const submitLoading = ref(false)
const formRef = ref(null)

const formData = reactive({
  name: '',
  type: null,
  fullAmount: 0,
  reduceAmount: 0,
  discountValue: 8.5,
  totalCount: 100,
  startTime: '',
  endTime: ''
})

const formRules = {
  name: [{ required:true, message:'请输入优惠券名称', trigger:'blur' }],
  type: [{ required:true, message:'请选择类型', trigger:'change' }],
  totalCount: [{ required:true, message:'请输入发放量', trigger:'blur' }]
}

function typeText(t) { const m={1:'满减券',2:'折扣券',3:'无门槛'}; return m[t]||'未知' }
function typeTag(t) { const m={1:'success',2:'warning',3:'info'}; return m[t]||'info' }

async function fetchCoupons() {
  loading.value = true
  try {
    const res = await adminApi.getCoupons()
    if (res.code === 200) {
      couponList.value = Array.isArray(res.data) ? res.data : (res.data.records || res.data.list || [])
    }
  } catch {} finally { loading.value = false }
}

function handleAdd() {
  formData.name = ''; formData.type = null; formData.fullAmount = 0; formData.reduceAmount = 0
  formData.discountValue = 8.5; formData.totalCount = 100; formData.startTime = ''; formData.endTime = ''
  dialogVisible.value = true
}

async function handleSubmit() {
  if (submitLoading.value) return
  // 手动校验
  if (!formData.name) { ElMessage.warning('请输入优惠券名称'); return }
  if (!formData.type) { ElMessage.warning('请选择优惠券类型'); return }
  if (!formData.totalCount || formData.totalCount < 1) { ElMessage.warning('请输入发放量'); return }
  if (!formData.startTime || !formData.endTime) { ElMessage.warning('请选择有效期'); return }

  submitLoading.value = true
  try {
    const res = await adminApi.createCoupon({
      name: formData.name,
      type: formData.type,
      fullAmount: formData.fullAmount,
      reduceAmount: formData.type === 2 ? formData.discountValue : formData.reduceAmount,
      totalCount: formData.totalCount,
      startTime: formData.startTime,
      endTime: formData.endTime
    })
    if (res.code === 200) { ElMessage.success('优惠券创建成功'); dialogVisible.value = false; fetchCoupons() }
    else ElMessage.error(res.message || '创建失败')
  } catch (err) {
    console.error('创建优惠券失败:', err)
    ElMessage.error('创建失败，请检查网络连接')
  } finally { submitLoading.value = false }
}

// ============ 删除确认 ============
const deleteVisible = ref(false)
const deleteTarget = ref(null)
const deleteLoading = ref(false)

function handleDelete(row) {
  deleteTarget.value = row
  deleteVisible.value = true
}

async function handleConfirmDelete() {
  deleteLoading.value = true
  try {
    const res = await adminApi.deleteCoupon(deleteTarget.value.id)
    if (res.code === 200) { ElMessage.success('删除成功'); deleteVisible.value = false; fetchCoupons() }
    else ElMessage.error(res.message || '删除失败')
  } catch {} finally { deleteLoading.value = false }
}

onMounted(() => fetchCoupons())
</script>

<style scoped>
.date-text { font-size:13px; color:#606266 }
.delete-tip { font-size:14px; color:#606266; margin-bottom:16px; line-height:1.6 }
.delete-tip em { color:#E74C3C; font-weight:600; font-style:normal }
.delete-info { background:#f5f7fa; border-radius:8px; padding:14px 16px }
.dl-row { display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px dashed #e4e7ed; font-size:14px; color:#606266 }
.dl-row:last-child { border-bottom:none }
</style>
