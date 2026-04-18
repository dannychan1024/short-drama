<template>
  <div class="play-page" :class="{ landscape: isLandscape }">
    <div class="back" @click="goBack">← 返回</div>
    
    <div v-if="episode" class="player-wrapper">
      <div id="dplayer" ref="playerRef"></div>
      
      <div v-if="showLockHint" class="lock-hint">
        <span>请切换到横屏观看以获得最佳体验</span>
      </div>
    </div>

    <div v-if="episode" class="episode-info">
      <div class="episode-header">
        <h2>第{{ episode.episodeNumber }}集: {{ episode.title }}</h2>
        <span class="duration">时长: {{ formatDuration(episode.duration) }}</span>
      </div>
      
      <div class="episode-nav">
        <button 
          class="nav-btn" 
          :disabled="!prevEpisode"
          @click="switchEpisode(prevEpisode)"
        >
          ← 上一集
        </button>
        <button 
          class="nav-btn" 
          :disabled="!nextEpisode"
          @click="switchEpisode(nextEpisode)"
        >
          下一集 →
        </button>
      </div>
      
      <div class="episodes-grid">
        <div 
          v-for="ep in episodeList" 
          :key="ep.id"
          :class="['ep-item', { current: ep.id === episode.id, free: ep.isFree }]"
          @click="switchEpisode(ep)"
        >
          {{ ep.episodeNumber }}
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import DPlayer from 'dplayer'

// Extend DPlayer interface
interface ExtendedDPlayer extends DPlayer {
  on(event: string, handler: () => void): void
  destroy(): void
}
import { dramaApi } from '@/api/drama'

const router = useRouter()
const route = useRoute()
const playerRef = ref<HTMLElement | null>(null)
const episode = ref<any>(null)
const episodeList = ref<any[]>([])
const loading = ref(false)
const isLandscape = ref(false)
const showLockHint = ref(false)
let dp: ExtendedDPlayer | null = null

const goBack = () => router.back()

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const currentIndex = computed(() => {
  return episodeList.value.findIndex(ep => ep.id === episode.value?.id)
})

const prevEpisode = computed(() => {
  const idx = currentIndex.value
  return idx > 0 ? episodeList.value[idx - 1] : null
})

const nextEpisode = computed(() => {
  const idx = currentIndex.value
  return idx < episodeList.value.length - 1 ? episodeList.value[idx + 1] : null
})

const initPlayer = (videoUrl: string) => {
  if (dp) {
    dp.destroy()
    dp = null
  }
  
  if (playerRef.value) {
    const options: any = {
      container: playerRef.value,
      video: {
        url: videoUrl,
        type: 'hls'
      },
      autoplay: true,
      screenshot: true,
      hotkey: true,
      volume: 0.8
    }
    dp = new DPlayer(options) as unknown as ExtendedDPlayer
    
    dp!.on('ended', () => {
      // 播放结束自动跳到下一集
      if (nextEpisode.value) {
        switchEpisode(nextEpisode.value)
      }
    })
    
    // 保存播放记录
    savePlayHistory()
  }
}

const switchEpisode = (ep: any) => {
  if (!ep) return
  episode.value = ep
  initPlayer(ep.videoUrl)
}

const savePlayHistory = async () => {
  if (!episode.value) return
  
  // 模拟保存播放记录到后端
  try {
    await dramaApi.getDetail(episode.value.dramaId)
    console.log('播放记录已保存')
  } catch (error) {
    console.log('保存播放记录失败')
  }
}

const checkOrientation = () => {
  isLandscape.value = window.innerWidth > window.innerHeight
  showLockHint.value = !isLandscape.value && window.innerWidth < 500
}

onMounted(async () => {
  const id = Number(route.params.id)
  loading.value = true
  
  // 模拟数据
  episodeList.value = [
    { id: 1, dramaId: 1, episodeNumber: 1, title: '意外相遇', videoUrl: 'https://vip.lzsdmf.com/20240502/MjA1MzQ4/index.m3u8', duration: 600, isFree: true },
    { id: 2, dramaId: 1, episodeNumber: 2, title: '再次相见', videoUrl: 'https://vip.lzsdmf.com/20240502/MjA1MzQ4/index.m3u8', duration: 600, isFree: true },
    { id: 3, dramaId: 1, episodeNumber: 3, title: '秘密曝光', videoUrl: 'https://vip.lzsdmf.com/20240502/MjA1MzQ4/index.m3u8', duration: 600, isFree: false },
    { id: 4, dramaId: 1, episodeNumber: 4, title: '艰难抉择', videoUrl: 'https://vip.lzsdmf.com/20240502/MjA1MzQ4/index.m3u8', duration: 600, isFree: false },
    { id: 5, dramaId: 1, episodeNumber: 5, title: '感情升温', videoUrl: 'https://vip.lzsdmf.com/20240502/MjA1MzQ4/index.m3u8', duration: 600, isFree: false },
    { id: 6, dramaId: 1, episodeNumber: 6, title: '危机四伏', videoUrl: 'https://vip.lzsdmf.com/20240502/MjA1MzQ4/index.m3u8', duration: 600, isFree: false }
  ]
  
  episode.value = episodeList.value.find(ep => ep.id === id) || episodeList.value[0]
  
  await new Promise(resolve => setTimeout(resolve, 100))
  
  if (episode.value) {
    initPlayer(episode.value.videoUrl)
  }
  
  loading.value = false
  
  // 监听屏幕方向
  checkOrientation()
  window.addEventListener('resize', checkOrientation)
})

onUnmounted(() => {
  if (dp) {
    dp.destroy()
  }
  window.removeEventListener('resize', checkOrientation)
})
</script>

<style scoped>
.play-page {
  padding: 16px;
  background: #1a1a1a;
  min-height: 100vh;
  color: #fff;
}

.play-page.landscape {
  padding: 0;
}

.back {
  margin-bottom: 16px;
  cursor: pointer;
  color: #999;
}

.play-page.landscape .back {
  display: none;
}

.player-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
}

#dplayer {
  width: 100%;
  height: 100%;
}

.lock-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0,0,0,0.8);
  padding: 16px 24px;
  border-radius: 8px;
  text-align: center;
  font-size: 14px;
  color: #fff;
  z-index: 10;
}

.episode-info {
  margin-top: 20px;
}

.episode-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.episode-header h2 {
  font-size: 18px;
  color: #fff;
}

.duration {
  font-size: 13px;
  color: #999;
}

.episode-nav {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.nav-btn {
  flex: 1;
  padding: 12px;
  background: #333;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.episodes-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
}

.ep-item {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #333;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

.ep-item.current {
  background: #ff6b6b;
}

.ep-item.free {
  border: 1px solid #52c41a;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #999;
}

@media (orientation: landscape) {
  .play-page {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .player-wrapper {
    max-width: 80%;
    max-height: 90vh;
    border-radius: 0;
  }
}
</style>
