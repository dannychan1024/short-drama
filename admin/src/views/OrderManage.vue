<template>
  <div class="order-manage">
    <!-- Header -->
    <div class="flex-between mb-6">
      <div class="flex gap-4">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索用户/短剧"
          style="width: 200px"
          clearable
          @change="loadOrders"
        />
        <el-select v-model="searchStatus" placeholder="订单状态" style="width: 140px" clearable @change="loadOrders">
          <el-option label="待支付" value="pending" />
          <el-option label="已支付" value="paid" />
          <el-option label="已退款" value="refunded" />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          @change="loadOrders"
          style="width: 260px"
        />
      </div>
      <el-button @click="exportExcel">
        <el-icon class="mr-1"><Download /></el-icon>导出Excel
      </el-button>
    </div>

    <!-- Table -->
    <div class="card p-4">
      <el-table :data="orders" v-loading="loading" stripe>
        <el-table-column prop="id" label="订单ID" width="100" />
        <el-table-column label="用户" width="160">
          <template #default="{ row }">
            <div>{{ row.userNickname || '匿名' }}</div>
            <div class="text-xs text-gray-400">{{ row.userPhone }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="dramaTitle" label="短剧" min-width="180" />
        <el-table-column prop="amount" label="金额" width="100">
          <template #default="{ row }">
            <span class="text-orange-500 font-medium">{{ row.amount }}金币</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="下单时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="showDetail(row)">详情</el-button>
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
          @change="loadOrders"
        />
      </div>
    </div>

    <!-- Detail Dialog -->
    <el-dialog v-model="detailVisible" title="订单详情" width="500px">
      <el-descriptions :column="2" border v-if="currentOrder">
        <el-descriptions-item label="订单ID">{{ currentOrder.id }}</el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <el-tag :type="statusType(currentOrder.status)">
            {{ statusText(currentOrder.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="用户昵称">{{ currentOrder.userNickname || '-' }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ currentOrder.userPhone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="短剧名称" :span="2">{{ currentOrder.dramaTitle }}</el-descriptions-item>
        <el-descriptions-item label="金额">{{ currentOrder.amount }}金币</el-descriptions-item>
        <el-descriptions-item label="下单时间">{{ formatDate(currentOrder.createdAt) }}</el-descriptions-item>
        <el-descriptions-item v-if="currentOrder.paidAt" label="支付时间" :span="2">
          {{ formatDate(currentOrder.paidAt) }}
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import { getOrderList } from '../api/order'

const loading = ref(false)
const orders = ref<any[]>([])
const searchKeyword = ref('')
const searchStatus = ref('')
const dateRange = ref<string[]>([])
const detailVisible = ref(false)
const currentOrder = ref<any>(null)

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const statusMap: Record<string, { text: string; type: string }> = {
  pending: { text: '待支付', type: 'warning' },
  paid: { text: '已支付', type: 'success' },
  refunded: { text: '已退款', type: 'info' }
}

const statusType = (status: string) => statusMap[status]?.type || ''
const statusText = (status: string) => statusMap[status]?.text || status

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

const loadOrders = async () => {
  loading.value = true
  try {
    const res = await getOrderList({
      keyword: searchKeyword.value,
      status: searchStatus.value,
      startDate: dateRange.value?.[0],
      endDate: dateRange.value?.[1],
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    orders.value = res.data.list
    pagination.total = res.data.total
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const showDetail = (row: any) => {
  currentOrder.value = row
  detailVisible.value = true
}

const exportExcel = () => {
  const headers = ['订单ID', '用户昵称', '手机号', '短剧', '金额', '状态', '下单时间']
  const data = orders.value.map(o => [
    o.id,
    o.userNickname || '',
    o.userPhone || '',
    o.dramaTitle,
    o.amount,
    statusText(o.status),
    formatDate(o.createdAt)
  ])
  
  let csv = '\uFEFF' + headers.join(',') + '\n'
  data.forEach(row => {
    csv += row.map(cell => `"${cell}"`).join(',') + '\n'
  })
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `订单列表_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
.order-manage {
  @apply text-sm;
}
</style>