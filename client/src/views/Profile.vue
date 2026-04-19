<template>
  <div class="profile-page">
    <div class="user-header">
      <div class="avatar">
        <img v-if="userInfo?.avatar" :src="userInfo.avatar" alt="avatar" />
        <span v-else class="avatar-placeholder">👤</span>
      </div>
      <div class="user-info">
        <h2>{{ userInfo?.nickname || '未登录' }}</h2>
        <p class="phone">{{ userInfo?.phone || '请先登录' }}</p>
      </div>
      <router-link v-if="userStore.token" to="/wallet" class="balance-card">
        <span class="balance-label">余额</span>
        <span class="balance-value">¥{{ (userInfo?.balance || 0).toFixed(2) }}</span>
      </router-link>
      <router-link v-else to="/login" class="login-btn">登录/注册</router-link>
    </div>

    <div class="action-grid">
      <router-link to="/signin" class="action-item">
        <span class="action-icon">📅</span>
        <span class="action-label">签到</span>
      </router-link>
      <router-link to="/wallet" class="action-item">
        <span class="action-icon">💰</span>
        <span class="action-label">充值</span>
      </router-link>
      <router-link to="/orders" class="action-item">
        <span class="action-icon">📋</span>
        <span class="action-label">订单</span>
      </router-link>
      <router-link to="/following" class="action-item">
        <span class="action-icon">❤️</span>
        <span class="action-label">追剧</span>
      </router-link>
    </div>

    <div class="section">
      <div class="section-header">
        <h3>我的追剧</h3>
        <router-link to="/following" class="more">查看全部 →</router-link>
      </div>
      <div v-if="followingList.length > 0" class="drama-scroll">
        <div 
          v-for="drama in followingList" 
          :key="drama.id" 
          class="drama-card"
          @click="goDetail(drama.id)"
        >
          <img :src="drama.cover" :alt="drama.title" />
          <span class="drama-title">{{ drama.title }}</span>
        </div>
      </div>
      <div v-else class="empty-tip">暂无追剧内容</div>
    </div>

    <div class="section">
      <div class="section-header">
        <h3>观看历史</h3>
        <router-link to="/history" class="more">查看全部 →</router-link>
      </div>
      <div v-if="historyList.length > 0" class="drama-scroll">
        <div 
          v-for="item in historyList" 
          :key="item.dramaId" 
          class="drama-card"
          @click="goDetail(item.dramaId)"
        >
          <img :src="item.cover" :alt="item.title" />
          <span class="drama-title">{{ item.title }}</span>
          <span class="progress">看到第{{ item.episodeNumber }}集</span>
        </div>
      </div>
      <div v-else class="empty-tip">暂无观看记录</div>
    </div>

    <TabBar />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import TabBar from '@/components/TabBar.vue'

const router = useRouter()
const userStore = useUserStore()

const userInfo = ref(userStore.userInfo)
const followingList = ref<any[]>([])
const historyList = ref<any[]>([])

const goDetail = (id: number) => {
  router.push(`/drama/${id}`)
}

onMounted(async () => {
  if (userStore.token) {
    await userStore.fetchUserInfo()
    userInfo.value = userStore.userInfo
  }
  
  // 模拟追剧数据
  followingList.value = [
    { id: 1, title: '霸道总裁爱上我', cover: 'https://picsum.photos/200/300?random=1' },
    { id: 2, title: '甜蜜暴击', cover: 'https://picsum.photos/200/300?random=2' },
    { id: 3, title: '宫心计', cover: 'https://picsum.photos/200/300?random=3' }
  ]
  
  // 模拟历史记录
  historyList.value = [
    { dramaId: 1, title: '霸道总裁爱上我', cover: 'https://picsum.photos/200/300?random=4', episodeNumber: 5 },
    { dramaId: 2, title: '甜蜜暴击', cover: 'https://picsum.photos/200/300?random=5', episodeNumber: 12 }
  ]
})
</script>

<style scoped>
.profile-page {
  padding: 16px;
  padding-bottom: 100px;
  background: #f5f5f5;
  min-height: 100vh;
}

.user-header {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
  border-radius: 16px;
  padding: 20px;
  color: #fff;
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  background: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  font-size: 32px;
}

.user-info {
  flex: 1;
  margin-left: 16px;
}

.user-info h2 {
  font-size: 18px;
  margin-bottom: 4px;
}

.phone {
  font-size: 13px;
  opacity: 0.8;
}

.balance-card {
  background: rgba(255,255,255,0.2);
  border-radius: 12px;
  padding: 12px 16px;
  text-align: center;
  text-decoration: none;
  color: #fff;
}

.balance-label {
  display: block;
  font-size: 12px;
  opacity: 0.8;
}

.balance-value {
  font-size: 18px;
  font-weight: bold;
}

.login-btn {
  background: rgba(255,255,255,0.9);
  border-radius: 12px;
  padding: 12px 16px;
  text-align: center;
  text-decoration: none;
  color: #ff6b6b;
  font-size: 14px;
  font-weight: bold;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin: 20px 0;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #fff;
  border-radius: 12px;
  padding: 16px 8px;
  text-decoration: none;
  color: #333;
}

.action-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.action-label {
  font-size: 13px;
}

.section {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-header h3 {
  font-size: 16px;
  color: #333;
}

.more {
  font-size: 13px;
  color: #999;
  text-decoration: none;
}

.drama-scroll {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.drama-card {
  flex-shrink: 0;
  width: 100px;
  cursor: pointer;
}

.drama-card img {
  width: 100px;
  height: 140px;
  border-radius: 8px;
  object-fit: cover;
}

.drama-title {
  display: block;
  font-size: 13px;
  color: #333;
  margin-top: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.progress {
  display: block;
  font-size: 11px;
  color: #ff6b6b;
  margin-top: 4px;
}

.empty-tip {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 14px;
  background: #fff;
  border-radius: 12px;
}
</style>
