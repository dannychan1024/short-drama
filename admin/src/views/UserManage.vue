<template>
  <div class="user-manage">
    <!-- Header -->
    <div class="flex-between mb-6">
      <div class="flex gap-4">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索手机号/昵称"
          style="width: 200px"
          clearable
          @change="loadUsers"
        />
        <el-select v-model="searchStatus" placeholder="用户状态" style="width: 140px" clearable @change="loadUsers">
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
      </div>
    </div>

    <!-- Table -->
    <div class="card p-4">
      <el-table :data="users" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="用户" width="180">
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <el-avatar :size="32" :src="row.avatar">
                <el-icon><User /></el-icon>
              </el-avatar>
              <div>
                <div>{{ row.nickname || '未设置昵称' }}</div>
                <div class="text-xs text-gray-400">{{ row.phone }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="balance" label="余额" width="120">
          <template #default="{ row }">
            <span class="text-orange-500 font-medium">{{ row.balance }}金币</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="注册时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="showRecharge(row)">充值</el-button>
            <el-button size="small" :type="row.status === 1 ? 'danger' : 'success'" link @click="toggleStatus(row)">
              {{ row.status === 1 ? '禁用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="flex justify-end mt-4">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @change="loadUsers"
        />
      </div>
    </div>

    <!-- Recharge Dialog -->
    <el-dialog v-model="rechargeVisible" title="余额充值" width="400px">
      <el-form ref="rechargeFormRef" :model="rechargeForm" :rules="rechargeRules" label-width="80px">
        <el-form-item label="用户">
          <div>{{ currentUser?.nickname }} ({{ currentUser?.phone }})</div>
        </el-form-item>
        <el-form-item label="当前余额">
          <div class="text-orange-500">{{ currentUser?.balance }}金币</div>
        </el-form-item>
        <el-form-item label="充值类型" prop="type">
          <el-radio-group v-model="rechargeForm.type">
            <el-radio label="add">增加</el-radio>
            <el-radio label="reduce">减少</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="金额" prop="amount">
          <el-input-number v-model="rechargeForm.amount" :min="1" :precision="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rechargeVisible = false">取消</el-button>
        <el-button type="primary" @click="handleRecharge" :loading="rechargeLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User } from '@element-plus/icons-vue'
import { getUserList, updateUserStatus, rechargeUser } from '../api/user'

const loading = ref(false)
const users = ref<any[]>([])
const searchKeyword = ref('')
const searchStatus = ref<number | null>(null)
const rechargeVisible = ref(false)
const rechargeLoading = ref(false)
const currentUser = ref<any>(null)
const rechargeFormRef = ref<FormInstance>()

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const rechargeForm = reactive({
  type: 'add',
  amount: 0
})

const rechargeRules: FormRules = {
  amount: [{ required: true, message: '请输入金额', trigger: 'blur' }]
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

const loadUsers = async () => {
  loading.value = true
  try {
    const res = await getUserList({
      keyword: searchKeyword.value,
      status: searchStatus.value ?? undefined,
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    users.value = res.data.list
    pagination.total = res.data.total
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const showRecharge = (row: any) => {
  currentUser.value = row
  rechargeForm.type = 'add'
  rechargeForm.amount = 0
  rechargeVisible.value = true
}

const handleRecharge = async () => {
  if (!rechargeFormRef.value) return
  await rechargeFormRef.value.validate(async (valid) => {
    if (!valid) return
    rechargeLoading.value = true
    try {
      const res = await rechargeUser(currentUser.value.id, rechargeForm.amount, rechargeForm.type as 'add' | 'reduce')
      ElMessage.success('充值成功')
      currentUser.value.balance = res.data.newBalance
      rechargeVisible.value = false
      loadUsers()
    } catch (e) {
      console.error(e)
    } finally {
      rechargeLoading.value = false
    }
  })
}

const toggleStatus = async (row: any) => {
  const newStatus = row.status === 1 ? 0 : 1
  try {
    await updateUserStatus(row.id, newStatus)
    ElMessage.success(newStatus === 1 ? '启用成功' : '禁用成功')
    loadUsers()
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.user-manage {
  @apply text-sm;
}
</style>