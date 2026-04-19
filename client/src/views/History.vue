<template>
  <div class="history-page">
    <div class="back" @click="goBack">← 返回</div>
    
    <header class="header">
      <h1>观看历史</h1>
      <button v-if="historyList.length > 0" class="clear-btn" @click="clearHistory">清空</button>
    </header>

    <div v-if="historyList.length > 0" class="history-list">
      <div 
        v-for="item in historyList" 
        :key="`${item.dramaId}-${item.episodeId}`" 
        class="history-item"
        @click="goPlay(item)"
      >
        <img :src="item.cover" :alt="item.title" class="cover" />
        <div class="info">
          <h3>{{ item.title }}</h3>
          <p class="episode-info">看到第{{ item.episodeNumber }}集: {{ item.episodeTitle }}</p>
          <p class="time">{{ formatTime(item.watchedAt) }}</p>
        </div>
        <div class="continue-btn">继续播放</div>
      </div>
    </div>

    <div v-else class="empty">
      <p>暂无观看记录</p>
      <router-link to="/" class="go-home">去首页看看</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Toast from '@/utils/toast'

const router = useRouter()
const goBack = () => router.back()

const historyList = ref<any[]>([])

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - timestamp
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  
  return `${date.getMonth() + 1}-${date.getDate()}`
}

const goPlay = (item: any) => {
  router.push(`/play/${item.episodeId}`)
}

const clearHistory = () => {
  historyList.value = []
  Toast.success('已清空观看历史')
}

onMounted(() => {
  // 模拟历史记录
  historyList.value = [
    { 
      dramaId: 1, 
      episodeId: 5,
      title: '霸道总裁爱上我', 
      cover: 'https://picsum.photos/200/300?random=4',
      episodeNumber: 5,
      episodeTitle: '意外相遇',
      watchedAt: Date.now() - 3600000
    },
    { 
      dramaId: 2, 
      episodeId: 12,
      title: '甜蜜暴击', 
      cover: 'https://picsum.photos/200/300?random=5',
      episodeNumber: 12,
      episodeTitle: '真心告白',
      watchedAt: Date.now() - 86400000
    },
    { 
      dramaId: 3, 
      episodeId: 8,
      title: '宫心计', 
      cover: 'https://picsum.photos/200/300?random=6',
      episodeNumber: 8,
      episodeTitle: '暗流涌动',
      watchedAt: Date.now() - 172800000
    }
  ]
})
</script>

<style scoped>
.history-page {
  padding: 16px;
  background: #f5f5f5;
  min-height: 100vh;
}

.back {
  margin-bottom: 16px;
  cursor: pointer;
  color: #666;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header h1 {
  font-size: 22px;
  color: #333;
}

.clear-btn {
  padding: 6px 16px;
  background: transparent;
  color: #999;
  border: none;
  font-size: 14px;
  cursor: pointer;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  display: flex;
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
}

.cover {
  width: 100px;
  height: 140px;
  border-radius: 8px;
  object-fit: cover;
}

.info {
  flex: 1;
  margin-left: 12px;
  display: flex;
  flex-direction: column;
}

.info h3 {
  font-size: 16px;
  color: #333;
  margin-bottom: 8px;
}

.episode-info {
  font-size: 13px;
  color: #666;
  flex: 1;
}

.time {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}

.continue-btn {
  align-self: center;
  padding: 8px 16px;
  background: #ff6b6b;
  color: #fff;
  border-radius: 16px;
  font-size: 13px;
}

.empty {
  text-align: center;
  padding: 60px 20px;
}

.empty p {
  color: #999;
  margin-bottom: 16px;
}

.go-home {
  color: #ff6b6b;
  text-decoration: none;
}
</style>
