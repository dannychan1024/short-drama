<template>
  <div class="orders-page">
    <div class="back" @click="goBack">← 返回</div>
    
    <h1>我的订单</h1>

    <div v-if="orders.length > 0" class="order-list">
      <div v-for="order in orders" :key="order.id" class="order-item">
        <div class="order-info">
          <span class="order-id">订单号: {{ order.id }}</span>
          <span :class="['status', order.status]">{{ getStatusText(order.status) }}</span>
        </div>
        <div class="order-detail">
          <span class="amount">¥{{ order.amount }}</span>
          <span class="time">{{ formatTime(order.createdAt) }}</span>
        </div>
      </div>
    </div>

    <div v-else class="empty">暂无订单</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { orderApi } from '@/api/order'
import type { Order } from '@/types'

const router = useRouter()
const orders = ref<Order[]>([])

const goBack = () => router.back()

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: '待支付',
    paid: '已支付',
    cancelled: '已取消',
    refunded: '已退款'
  }
  return map[status] || status
}

const formatTime = (time: string) => {
  return new Date(time).toLocaleString('zh-CN')
}

onMounted(async () => {
  try {
    const res: any = await orderApi.getOrders()
    orders.value = res.data?.list || []
  } catch (error) {
    console.error('获取订单失败', error)
  }
})
</script>

<style scoped>
.orders-page {
  padding: 16px;
}

.back {
  margin-bottom: 16px;
  cursor: pointer;
  color: #666;
}

h1 {
  font-size: 22px;
  color: #333;
  margin-bottom: 16px;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.order-item {
  background: #fff;
  padding: 16px;
  border-radius: 12px;
}

.order-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.order-id {
  font-size: 14px;
  color: #666;
}

.status {
  font-size: 14px;
  padding: 2px 8px;
  border-radius: 4px;
}

.status.paid {
  background: #d4edda;
  color: #155724;
}

.status.pending {
  background: #fff3cd;
  color: #856404;
}

.order-detail {
  display: flex;
  justify-content: space-between;
}

.amount {
  font-size: 18px;
  font-weight: bold;
  color: #ff6b6b;
}

.time {
  font-size: 12px;
  color: #999;
}

.empty {
  text-align: center;
  padding: 60px;
  color: #999;
}
</style>
