<template>
  <div class="following-page">
    <header class="header">
      <h1>我的追剧</h1>
    </header>

    <div v-if="followingList.length > 0" class="drama-list">
      <div 
        v-for="drama in followingList" 
        :key="drama.id" 
        class="drama-item"
        @click="goDetail(drama.id)"
      >
        <img :src="drama.cover" :alt="drama.title" class="cover" />
        <div class="info">
          <h3>{{ drama.title }}</h3>
          <p class="desc">{{ drama.description }}</p>
          <div class="meta">
            <span class="category">{{ drama.category }}</span>
            <span class="episodes">{{ drama.totalEpisodes }}集</span>
          </div>
        </div>
        <button class="unfollow-btn" @click.stop="unfollow(drama.id)">取消追剧</button>
      </div>
    </div>

    <div v-else class="empty">
      <p>暂无追剧内容</p>
      <router-link to="/" class="go-home">去首页看看</router-link>
    </div>

    <TabBar />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Toast from '@/utils/toast'
import TabBar from '@/components/TabBar.vue'

const router = useRouter()
const followingList = ref<any[]>([])

const goDetail = (id: number) => {
  router.push(`/drama/${id}`)
}

const unfollow = (id: number) => {
  followingList.value = followingList.value.filter(item => item.id !== id)
  Toast.success('已取消追剧')
}

onMounted(() => {
  // 模拟追剧数据
  followingList.value = [
    { 
      id: 1, 
      title: '霸道总裁爱上我', 
      cover: 'https://picsum.photos/200/300?random=1',
      description: '一场意外，让她与他命运交织，从此开启一段跌宕起伏的爱情故事...',
      category: '都市',
      totalEpisodes: 20
    },
    { 
      id: 2, 
      title: '甜蜜暴击', 
      cover: 'https://picsum.photos/200/300?random=2',
      description: '当红偶像与平凡女孩的甜蜜爱情，甜到掉牙！',
      category: '甜宠',
      totalEpisodes: 15
    },
    { 
      id: 3, 
      title: '宫心计', 
      cover: 'https://picsum.photos/200/300?random=3',
      description: '深宫之内，尔虞我诈，谁能笑到最后？',
      category: '古言',
      totalEpisodes: 30
    }
  ]
})
</script>

<style scoped>
.following-page {
  padding: 16px;
  padding-bottom: 100px;
  background: #f5f5f5;
  min-height: 100vh;
}

.header {
  margin-bottom: 16px;
}

.header h1 {
  font-size: 22px;
  color: #333;
}

.drama-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.drama-item {
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

.desc {
  font-size: 13px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  flex: 1;
}

.meta {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.category {
  font-size: 12px;
  color: #ff6b6b;
  background: #fff1f0;
  padding: 2px 8px;
  border-radius: 4px;
}

.episodes {
  font-size: 12px;
  color: #999;
}

.unfollow-btn {
  align-self: flex-start;
  padding: 6px 12px;
  background: #f0f0f0;
  color: #666;
  border: none;
  border-radius: 16px;
  font-size: 12px;
  cursor: pointer;
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
