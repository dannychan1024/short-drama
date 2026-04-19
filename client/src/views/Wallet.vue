<template>
  <div class="wallet-page">
    <div class="back" @click="goBack">← 返回</div>
    
    <div class="balance-card">
      <p class="label">账户余额</p>
      <p class="balance">¥{{ balance.toFixed(2) }}</p>
    </div>

    <div class="recharge-section">
      <h2>充值金额</h2>
      <div class="amounts">
        <div 
          v-for="amount in amounts" 
          :key="amount"
          :class="['amount', { active: selectedAmount === amount }]"
          @click="selectedAmount = amount"
        >
          ¥{{ amount }}
        </div>
      </div>
      <button class="recharge-btn" @click="handleRecharge">立即充值</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { walletApi } from '@/api/wallet'
import { useUserStore } from '@/stores/user'
import Toast from '@/utils/toast'

const router = useRouter()
const userStore = useUserStore()

const balance = ref(0)
const selectedAmount = ref(10)
const amounts = [6, 30, 68, 128, 268]

const goBack = () => router.back()

const handleRecharge = async () => {
  try {
    await walletApi.recharge(selectedAmount.value)
    balance.value += selectedAmount.value
    Toast.success('充值成功')
  } catch (error: any) {
    Toast.error(error.message || '充值失败')
  }
}

onMounted(async () => {
  if (userStore.token) {
    await userStore.fetchUserInfo()
    balance.value = userStore.userInfo?.balance || 0
  }
})
</script>

<style scoped>
.wallet-page {
  padding: 16px;
}

.back {
  margin-bottom: 16px;
  cursor: pointer;
  color: #666;
}

.balance-card {
  background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
  color: #fff;
  padding: 32px;
  border-radius: 16px;
  text-align: center;
}

.balance-card .label {
  font-size: 14px;
  opacity: 0.9;
}

.balance-card .balance {
  font-size: 40px;
  font-weight: bold;
  margin-top: 8px;
}

.recharge-section {
  margin-top: 32px;
}

.recharge-section h2 {
  font-size: 18px;
  color: #333;
  margin-bottom: 16px;
}

.amounts {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.amount {
  padding: 16px;
  background: #fff;
  border: 2px solid #eee;
  border-radius: 12px;
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
}

.amount.active {
  border-color: #ff6b6b;
  color: #ff6b6b;
}

.recharge-btn {
  width: 100%;
  margin-top: 24px;
  padding: 16px;
  background: #ff6b6b;
  color: #fff;
  border: none;
  border-radius: 24px;
  font-size: 18px;
}
</style>
