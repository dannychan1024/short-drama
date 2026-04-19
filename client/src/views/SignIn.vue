<template>
  <div class="signin-page">
    <div class="back" @click="goBack">← 返回</div>
    
    <div class="signin-header">
      <div class="streak-info">
        <span class="streak-icon">🔥</span>
        <span class="streak-text">连续签到 <strong>{{ continuousDays }}</strong> 天</span>
      </div>
      <div class="total-coins">
        累计获得 <strong>{{ totalCoins }}</strong> 币
      </div>
    </div>

    <div class="signin-btn-container">
      <button 
        class="signin-btn" 
        :class="{ signed: isSignedToday }"
        :disabled="isSignedToday"
        @click="handleSignIn"
      >
        {{ isSignedToday ? '已签到' : '签到领币' }}
      </button>
    </div>

    <div class="calendar-section">
      <h3>{{ currentMonth }}月签到日历</h3>
      <div class="calendar">
        <div class="weekday-header">
          <span v-for="day in weekDays" :key="day">{{ day }}</span>
        </div>
        <div class="days-grid">
          <div 
            v-for="day in calendarDays" 
            :key="day.date"
            :class="['day', { 
              signed: day.signed, 
              today: day.isToday,
              future: day.isFuture 
            }]"
          >
            <span class="day-num">{{ day.date }}</span>
            <span v-if="day.signed" class="signed-check">✓</span>
          </div>
        </div>
      </div>
    </div>

    <div class="rules-section">
      <h3>签到奖励规则</h3>
      <div class="rule-item">
        <span class="rule-icon">🌟</span>
        <span class="rule-text">连续签到 <strong>3天</strong> 额外奖励 <strong>5币</strong></span>
      </div>
      <div class="rule-item">
        <span class="rule-icon">⭐</span>
        <span class="rule-text">连续签到 <strong>7天</strong> 额外奖励 <strong>15币</strong></span>
      </div>
      <div class="rule-item">
        <span class="rule-icon">💎</span>
        <span class="rule-text">连续签到 <strong>30天</strong> 额外奖励 <strong>50币</strong></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Toast from '@/utils/toast'

const router = useRouter()
const goBack = () => router.back()

const continuousDays = ref(0)
const totalCoins = ref(0)
const isSignedToday = ref(false)
const currentMonth = ref(new Date().getMonth() + 1)

const weekDays = ['日', '一', '二', '三', '四', '五', '六']

// 模拟签到数据
const signedDates = ref<Set<number>>(new Set([1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]))

const calendarDays = computed(() => {
  const year = new Date().getFullYear()
  const month = new Date().getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date().getDate()
  
  const days: Array<{ 
    date: number; 
    signed: boolean; 
    isToday: boolean;
    isFuture: boolean;
  }> = []
  
  // 填充空白
  for (let i = 0; i < firstDay; i++) {
    days.push({ date: 0, signed: false, isToday: false, isFuture: false })
  }
  
  // 填充日期
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({
      date: d,
      signed: signedDates.value.has(d),
      isToday: d === today,
      isFuture: d > today
    })
  }
  
  return days
})

const handleSignIn = async () => {
  if (isSignedToday.value) return
  
  // 模拟签到
  const today = new Date().getDate()
  signedDates.value.add(today)
  isSignedToday.value = true
  continuousDays.value += 1
  totalCoins.value += 1
  
  // 检查连续签到奖励
  if (continuousDays.value === 3) {
    totalCoins.value += 5
    Toast.success('恭喜获得连续3天签到奖励5币！')
  } else if (continuousDays.value === 7) {
    totalCoins.value += 15
    Toast.success('恭喜获得连续7天签到奖励15币！')
  } else if (continuousDays.value === 30) {
    totalCoins.value += 50
    Toast.success('恭喜获得连续30天签到奖励50币！')
  } else {
    Toast.success('签到成功，获得1币！')
  }
}

onMounted(() => {
  const today = new Date().getDate()
  isSignedToday.value = signedDates.value.has(today)
  
  // 计算连续签到天数
  let streak = 0
  for (let i = today; i >= 1; i--) {
    if (signedDates.value.has(i)) {
      streak++
    } else {
      break
    }
  }
  continuousDays.value = streak
})
</script>

<style scoped>
.signin-page {
  padding: 16px;
  background: #f5f5f5;
  min-height: 100vh;
}

.back {
  margin-bottom: 16px;
  cursor: pointer;
  color: #666;
}

.signin-header {
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
  border-radius: 16px;
  padding: 24px;
  color: #fff;
  text-align: center;
}

.streak-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
}

.streak-icon {
  font-size: 28px;
}

.streak-text {
  font-size: 18px;
}

.total-coins {
  font-size: 14px;
  opacity: 0.9;
}

.signin-btn-container {
  margin: 24px 0;
  text-align: center;
}

.signin-btn {
  width: 200px;
  height: 56px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
  color: #fff;
  border: none;
  border-radius: 28px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.signin-btn:active {
  transform: scale(0.95);
}

.signin-btn.signed {
  background: #ccc;
  cursor: not-allowed;
}

.calendar-section {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 16px;
}

.calendar-section h3 {
  font-size: 16px;
  color: #333;
  margin-bottom: 16px;
}

.calendar {
  width: 100%;
}

.weekday-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  margin-bottom: 8px;
}

.weekday-header span {
  font-size: 12px;
  color: #999;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.day {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 14px;
  color: #333;
  position: relative;
}

.day.today {
  background: #fff1f0;
  color: #ff6b6b;
  font-weight: bold;
}

.day.signed {
  background: #ff6b6b;
  color: #fff;
}

.day.future {
  color: #ccc;
}

.signed-check {
  font-size: 10px;
  margin-top: 2px;
}

.rules-section {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
}

.rules-section h3 {
  font-size: 16px;
  color: #333;
  margin-bottom: 16px;
}

.rule-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.rule-item:last-child {
  border-bottom: none;
}

.rule-icon {
  font-size: 20px;
}

.rule-text {
  font-size: 14px;
  color: #666;
}

.rule-text strong {
  color: #ff6b6b;
}
</style>
