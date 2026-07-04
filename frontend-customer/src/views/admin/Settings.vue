<!-- Settings.vue - 系统设置页面 -->
<template>
  <div class="settings-page">
    <!-- ========== 系统设置表单 ========== -->
    <div class="card-container">
      <div class="card-title">系统设置</div>
      <div class="form-section">
        <!-- 加载状态 -->
        <el-skeleton v-if="pageLoading" :rows="6" animated />

        <!-- 设置表单 -->
        <el-form
          v-else
          ref="formRef"
          :model="settingsForm"
          :rules="formRules"
          label-width="120px"
        >
          <!-- 网站名称 -->
          <el-form-item label="网站名称" prop="siteName">
            <el-input v-model="settingsForm.siteName" placeholder="请输入网站名称" />
          </el-form-item>

          <!-- 免运费门槛 -->
          <el-form-item label="免运费门槛 (¥)" prop="freeShippingThreshold">
            <el-input-number
              v-model="settingsForm.freeShippingThreshold"
              :min="0"
              :precision="2"
              :step="10"
              placeholder="订单金额满多少免运费"
              style="width: 100%"
            />
          </el-form-item>

          <!-- 运费金额 -->
          <el-form-item label="运费金额 (¥)" prop="shippingFee">
            <el-input-number
              v-model="settingsForm.shippingFee"
              :min="0"
              :precision="2"
              :step="1"
              placeholder="未达到免运费门槛时的配送费"
              style="width: 100%"
            />
          </el-form-item>

          <!-- 支付超时 -->
          <el-form-item label="支付超时 (分钟)" prop="paymentTimeout">
            <el-input-number
              v-model="settingsForm.paymentTimeout"
              :min="1"
              :max="1440"
              :step="5"
              placeholder="订单未支付的自动取消时间"
              style="width: 100%"
            />
          </el-form-item>

          <!-- 保存按钮 -->
          <el-form-item>
            <el-button type="primary" :loading="saveLoading" @click="handleSave" size="large">
              保存设置
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { adminApi } from '@/api'

// ============ 页面加载状态 ============
const pageLoading = ref(true)

// ============ 保存 loading ============
const saveLoading = ref(false)

// ============ 表单引用 ============
const formRef = ref(null)

// ============ 设置表单数据 ============
const settingsForm = reactive({
  siteName: '',
  freeShippingThreshold: 0,
  shippingFee: 0,
  paymentTimeout: 30
})

// 表单验证规则
const formRules = {
  siteName: [{ required: true, message: '请输入网站名称', trigger: 'blur' }],
  freeShippingThreshold: [{ required: true, message: '请输入免运费门槛', trigger: 'blur' }],
  shippingFee: [{ required: true, message: '请输入运费金额', trigger: 'blur' }],
  paymentTimeout: [{ required: true, message: '请输入支付超时时间', trigger: 'blur' }]
}

// ============ 方法 ============

/**
 * 从后端获取当前设置
 */
async function fetchSettings() {
  pageLoading.value = true
  try {
    const res = await adminApi.getSettings()
    if (res.code === 200 && res.data) {
      // 后端返回 [{config_key, config_value}, ...] 数组，转换为键值对
      const configs = Array.isArray(res.data) ? res.data : []
      const map = {}
      configs.forEach(c => { map[c.config_key] = c.config_value })
      settingsForm.siteName = map.siteName || '观锦阁'
      settingsForm.freeShippingThreshold = Number(map.freeShippingThreshold) || 0
      settingsForm.shippingFee = Number(map.shippingFee) || 0
      settingsForm.paymentTimeout = Number(map.paymentTimeout) || 30
    }
  } catch {
    // 错误由拦截器处理
  } finally {
    pageLoading.value = false
  }
}

/**
 * 保存设置
 */
async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  saveLoading.value = true
  try {
    const res = await adminApi.saveSettings({
      siteName: settingsForm.siteName,
      freeShippingThreshold: settingsForm.freeShippingThreshold,
      shippingFee: settingsForm.shippingFee,
      paymentTimeout: settingsForm.paymentTimeout
    })
    if (res.code === 200) {
      ElMessage.success('系统设置保存成功')
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch {
    // 错误由拦截器处理
  } finally {
    saveLoading.value = false
  }
}

// ============ 页面加载 ============
onMounted(() => {
  fetchSettings()
})
</script>

<style scoped>
/* 使用 global.css 中的 .form-section 样式 */
</style>
