<template>
  <div class="drama-detail">
    <div class="back" @click="goBack">← 返回</div>
    
    <div v-if="drama" class="content">
      <div class="poster">
        <img :src="drama.cover" :alt="drama.title" />
        <div class="poster-overlay" @click="playFirstEpisode">
          <span class="play-hint">▶ 点击播放</span>
        </div>
      </div>
      
      <div class="info">
        <h1>{{ drama.title }}</h1>
        <p class="desc">{{ drama.description }}</p>
        <div class="tags">
          <span class="tag">{{ getCategoryName(drama.category) }}</span>
          <span class="tag">{{ drama.totalEpisodes }}集</span>
          <span v-if="drama.price > 0" class="tag price-tag">¥{{ drama.price }}</span>
        </div>
        
        <div class="action-row">
          <button class="follow-btn" :class="{ followed: isFollowed }" @click="toggleFollow">
            {{ isFollowed ? '已追剧' : '追剧' }}
          </button>
          <button v-if="drama.price > 0 && !hasPurchased" class="buy-btn" @click="handleBuy">
            立即购买 ¥{{ drama.price }}
          </button>
          <button v-if="hasPurchased" class="buy-btn purchased">已解锁</button>
        </div>
      </div>

      <div class="episodes-section">
        <h2>剧集列表</h2>
        <div class="episodes">
          <div 
            v-for="ep in drama.episodes" 
            :key="ep.id"
            :class="['episode', { free: ep.is_free, locked: !ep.is_free && !hasPurchased }]"
            @click="playEpisode(ep)"
          >
            <span class="ep-num">第{{ ep.episode_number }}集</span>
            <span class="ep-title">{{ ep.title }}</span>
            <span v-if="ep.is_free" class="free-tag">免费</span>
            <span v-else-if="hasPurchased" class="unlocked-icon">✓</span>
            <span v-else class="lock-icon">🔒</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="loading">加载中...</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDramaStore } from '@/stores/drama'
import { useUserStore } from '@/stores/user'
import { orderApi } from '@/api/order'
import Toast from '@/utils/toast'

const router = useRouter()
const route = useRoute()
const dramaStore = useDramaStore()
const userStore = useUserStore()

const drama = ref<any>(null)
const hasPurchased = ref(false)
const isFollowed = ref(false)

const categoryMap: Record<string, string> = {
  urban: '都市',
  ancient: '古言',
  sweet: '甜宠',
  suspense: '悬疑'
}

const getCategoryName = (category: string) => {
  return categoryMap[category] || category
}

const goBack = () => router.back()

const toggleFollow = () => {
  isFollowed.value = !isFollowed.value
  Toast.success(isFollowed.value ? '追剧成功' : '已取消追剧')
}

const handleBuy = async () => {
  if (!userStore.token) {
    Toast.warning('请先登录')
    router.push('/login')
    return
  }

  try {
    const res = await orderApi.createOrder(drama.value!.id)
    await orderApi.payOrder(res.data.id)
    Toast.success('购买成功')
    hasPurchased.value = true
    await dramaStore.fetchDramaDetail(drama.value!.id)
    drama.value = dramaStore.currentDrama
  } catch (error: any) {
    Toast.error(error.message || '购买失败')
  }
}

const playFirstEpisode = () => {
  if (drama.value?.episodes?.length) {
    playEpisode(drama.value.episodes[0])
  }
}

const playEpisode = (ep: any) => {
  if (ep.is_free || hasPurchased.value) {
    router.push(`/play/${ep.id}`)
  } else {
    Toast.warning('请先购买整剧')
  }
}

onMounted(async () => {
  const id = Number(route.params.id)
  await dramaStore.fetchDramaDetail(id)
  drama.value = dramaStore.currentDrama
  
  // 模拟数据
  if (!drama.value) {
    drama.value = {
      id,
      title: '霸道总裁爱上我',
      cover: 'https://picsum.photos/400/600?random=100',
      description: '一场意外，让她与他命运交织。五年后，她带着萌宝归来，却被他堵在机场...',
      category: 'urban',
      price: 30,
      totalEpisodes: 20,
      episodes: [
        { id: 1, episodeNumber: 1, title: '意外相遇', isFree: true, duration: 600 },
        { id: 2, episodeNumber: 2, title: '再次相见', isFree: true, duration: 600 },
        { id: 3, episodeNumber: 3, title: '秘密曝光', isFree: false, duration: 600 },
        { id: 4, episodeNumber: 4, title: '艰难抉择', isFree: false, duration: 600 },
        { id: 5, episodeNumber: 5, title: '感情升温', isFree: false, duration: 600 },
        { id: 6, episodeNumber: 6, title: '危机四伏', isFree: false, duration: 600 }
      ]
    }
  }
})
</script>

<style scoped>
.drama-detail {
  padding: 16px;
  background: #f5f5f5;
  min-height: 100vh;
}

.back {
  margin-bottom: 16px;
  cursor: pointer;
  color: #666;
}

.poster {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
}

.poster img {
  width: 100%;
  display: block;
}

.poster-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.poster:hover .poster-overlay {
  opacity: 1;
}

.play-hint {
  color: #fff;
  font-size: 18px;
  background: rgba(255,107,107,0.9);
  padding: 12px 24px;
  border-radius: 24px;
}

.info {
  margin-top: 16px;
}

.info h1 {
  font-size: 22px;
  color: #333;
  margin-bottom: 8px;
}

.desc {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 12px;
}

.tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  padding: 4px 12px;
  background: #fff;
  border-radius: 12px;
  font-size: 12px;
  color: #666;
}

.price-tag {
  background: #fff1f0;
  color: #ff6b6b;
}

.action-row {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.follow-btn {
  flex: 1;
  padding: 12px;
  background: #fff;
  border: 1px solid #ff6b6b;
  border-radius: 24px;
  font-size: 15px;
  color: #ff6b6b;
  cursor: pointer;
}

.follow-btn.followed {
  background: #fff1f0;
  color: #ff6b6b;
}

.buy-btn {
  flex: 2;
  padding: 12px;
  background: #ff6b6b;
  border: none;
  border-radius: 24px;
  font-size: 15px;
  color: #fff;
  cursor: pointer;
}

.buy-btn.purchased {
  background: #52c41a;
  cursor: default;
}

.episodes-section {
  margin-top: 24px;
}

.episodes-section h2 {
  font-size: 18px;
  color: #333;
  margin-bottom: 12px;
}

.episodes {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.episode {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
}

.episode.locked {
  opacity: 0.6;
  background: #f9f9f9;
}

.ep-num {
  color: #ff6b6b;
  margin-right: 8px;
  font-size: 13px;
}

.ep-title {
  flex: 1;
  color: #333;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.free-tag {
  padding: 2px 6px;
  background: #52c41a;
  color: #fff;
  border-radius: 4px;
  font-size: 10px;
}

.lock-icon {
  font-size: 12px;
}

.unlocked-icon {
  color: #52c41a;
  font-size: 12px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #999;
}
</style>
