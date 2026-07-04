<!-- UserManage.vue - 用户管理页面 -->
<template>
  <div class="user-manage">
    <!-- ========== 搜索栏 ========== -->
    <div class="card-container">
      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索用户名或手机号"
          clearable
          @keyup.enter="handleSearch"
        />
        <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
      </div>
    </div>

    <!-- ========== 用户表格 ========== -->
    <div class="card-container">
      <el-table
        v-loading="loading"
        :data="userList"
        stripe
        border
        style="width: 100%"
        empty-text="暂无用户数据"
      >
        <!-- ID -->
        <el-table-column prop="id" label="ID" width="60" align="center" />

        <!-- 用户名 -->
        <el-table-column prop="username" label="用户名" min-width="120" show-overflow-tooltip />

        <!-- 手机号 -->
        <el-table-column prop="phone" label="手机号" width="140" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.phone || '未填写' }}
          </template>
        </el-table-column>

        <!-- 注册时间 -->
        <el-table-column prop="create_time" label="注册时间" min-width="160" show-overflow-tooltip />

        <!-- 状态 Switch -->
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              active-text="启用"
              inactive-text="禁用"
              inline-prompt
              size="small"
              @change="handleToggleStatus(row)"
            />
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
          @size-change="fetchUsers"
          @current-change="fetchUsers"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import { adminApi } from '@/api'

// ============ 搜索条件 ============
const searchKeyword = ref('')

// ============ 用户列表 ============
const userList = ref([])
const loading = ref(false)

// ============ 分页 ============
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

// ============ 方法 ============

/**
 * 获取用户列表（分页 + 搜索）
 */
async function fetchUsers() {
  loading.value = true
  try {
    const res = await adminApi.getUsers({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchKeyword.value
    })
    if (res.code === 200) {
      userList.value = res.data.records || []
      pagination.total = res.data.total || 0
    }
  } catch {
    // 错误由拦截器处理
  } finally {
    loading.value = false
  }
}

/**
 * 搜索
 */
function handleSearch() {
  pagination.page = 1
  fetchUsers()
}

/**
 * 重置搜索
 */
function handleReset() {
  searchKeyword.value = ''
  pagination.page = 1
  fetchUsers()
}

/**
 * 切换用户启用/禁用状态
 */
async function handleToggleStatus(row) {
  try {
    const res = await adminApi.toggleUserStatus(row.id, row.status)
    if (res.code === 200) {
      ElMessage.success(row.status === 1 ? '已启用该用户' : '已禁用该用户')
    } else {
      // 失败则回退状态
      row.status = row.status === 1 ? 0 : 1
      ElMessage.error(res.message || '操作失败')
    }
  } catch {
    // 异常时回退状态
    row.status = row.status === 1 ? 0 : 1
  }
}

// ============ 页面加载 ============
onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
