<template>
  <div class="play-page" @touchstart="handleTouchStart" @touchend="handleTouchEnd">
    <!-- 返回按钮 -->
    <div class="back-btn" @click="goBack">← 返回</div>

    <!-- 视频播放器区域 -->
    <div class="video-section">
      <video
        ref="videoRef"
        :src="currentVideoUrl"
        controls
        autoplay
        playsinline
        :poster="currentThumb"
      ></video>

      <!-- 进度信息栏 -->
      <div class="progress-bar">
        <span class="current-time">{{ formatTime(currentTime) }}</span>
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <span class="total-time">{{ formatTime(duration) }}</span>
      </div>
    </div>

    <!-- 互动按钮栏：点赞、分享、追剧 -->
    <div class="action-bar">
      <div class="action-item" :class="{ active: isLiked }" @click="toggleLike">
        <span class="icon">👍</span>
        <span class="count">{{ likeCount }}</span>
      </div>
      <div class="action-item" @click="share">
        <span class="icon">↗️</span>
        <span>分享</span>
      </div>
      <div class="action-item" :class="{ followed: isFollowed }" @click="toggleFollow">
        <span class="icon">➕</span>
        <span>{{ isFollowed ? '已追剧' : '追剧' }}</span>
      </div>
    </div>

    <!-- 剧集信息 -->
    <div class="drama-info">
      <h1 class="drama-title">《{{ dramaTitle }}》</h1>
      <p class="drama-subtitle">全网热播短剧</p>
      <div class="episode-selector" @click="toggleEpisodeList">
        <span class="episode-info">第{{ currentEpNumber }}集（共{{ totalEps }}集）</span>
        <span class="selector-arrow">选集 <span :class="{ rotated: showEpisodeList }">›</span></span>
      </div>
    </div>

    <!-- 上一集卡片 -->
    <div v-if="prevEpisode" class="episode-card prev-card" @click="switchTo(prevEpisode)">
      <div class="card-preview">
        <img :src="getThumb(prevEpisode)" class="card-thumb" />
        <div class="card-meta">
          <div class="card-badge">上一集</div>
          <div class="card-title">《{{ dramaTitle }}》</div>
          <div class="card-sub">第{{ prevEpisode.episode_number }}集 · 点击观看</div>
        </div>
      </div>
      <div class="card-actions">
        <span>👍 {{ getLikes(prevEpisode) }}</span>
        <span>↗️ 分享</span>
        <span @click.stop="toggleFollowEp(prevEpisode)">{{ prevEpisode.is_followed ? '已追' : '追剧' }}</span>
      </div>
    </div>

    <!-- 下一集卡片 -->
    <div v-if="nextEpisode" class="episode-card next-card" :class="{ active: !prevEpisode }" @click="switchTo(nextEpisode)">
      <div class="card-preview">
        <img :src="getThumb(nextEpisode)" class="card-thumb" />
        <div class="card-meta">
          <div class="card-badge next">下一集</div>
          <div class="card-title">《{{ dramaTitle }}》</div>
          <div class="card-sub">第{{ nextEpisode.episode_number }}集 · 点击观看</div>
        </div>
      </div>
      <div class="card-actions">
        <span>👍 {{ getLikes(nextEpisode) }}</span>
        <span>↗️ 分享</span>
        <span @click.stop="toggleFollowEp(nextEpisode)">{{ nextEpisode.is_followed ? '已追' : '追剧' }}</span>
      </div>
    </div>

    <!-- 后续集数卡片列表 -->
    <div v-for="ep in remainingEpisodes" :key="ep.id" class="episode-card later-card" @click="switchTo(ep)">
      <div class="card-preview">
        <img :src="getThumb(ep)" class="card-thumb" />
        <div class="card-meta">
          <div class="card-title">《{{ dramaTitle }}》</div>
          <div class="card-sub">第{{ ep.episode_number }}集 · {{ ep.title || '精彩继续' }}</div>
        </div>
      </div>
      <div class="card-actions">
        <span>👍 {{ getLikes(ep) }}</span>
        <span>↗️ 分享</span>
        <span @click.stop="toggleFollowEp(ep)">{{ ep.is_followed ? '已追' : '追剧' }}</span>
      </div>
    </div>

    <!-- 选集列表弹窗 -->
    <div v-if="showEpisodeList" class="episode-popup">
      <div class="popup-header">
        <span>选集 ({{ totalEps }}集)</span>
        <span class="close-btn" @click="toggleEpisodeList">×</span>
      </div>
      <div class="episode-list">
        <div
          v-for="ep in episodeList"
          :key="ep.id"
          :class="['ep-card', { active: ep.id === currentId }]"
          @click="switchTo(ep)"
        >
          <img :src="getThumb(ep)" class="ep-thumb" />
          <div class="ep-info">
            <div class="ep-title">第{{ ep.episode_number }}集</div>
            <div class="ep-sub">{{ ep.title || dramaTitle }}</div>
          </div>
          <div class="ep-actions">
            <span class="action-btn">👍 {{ getLikes(ep) }}</span>
            <span class="action-btn" :class="{ followed: ep.is_followed }" @click.stop="toggleFollowEp(ep)">{{ ep.is_followed ? '已追' : '追剧' }}</span>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showEpisodeList" class="popup-overlay" @click="toggleEpisodeList"></div>

    <!-- 滑动提示 -->
    <div v-if="showSwipeHint" class="swipe-hint">{{ swipeHint }}</div>

    <!-- Toast提示 -->
    <div v-if="toastShow" class="toast">{{ toastMsg }}</div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">加载中...</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { dramaApi } from '@/api/drama'

const router = useRouter()
const route = useRoute()

const videoRef = ref<HTMLVideoElement | null>(null)
const episode = ref<any>(null)
const episodeList = ref<any[]>([])
const loading = ref(false)

// 互动状态
const isLiked = ref(false)
const likeCount = ref(0)
const isFollowed = ref(false)

// UI状态
const showEpisodeList = ref(false)
const showSwipeHint = ref(false)
const swipeHint = ref('')
const toastShow = ref(false)
const toastMsg = ref('')

// 视频进度
const currentTime = ref(0)
const duration = ref(0)

// 剧集信息
const dramaTitle = ref('热播短剧')
const dramaId = ref<number>(0)

let swipeHintTimer: ReturnType<typeof setTimeout> | null = null
let toastTimer: ReturnType<typeof setTimeout> | null = null

const goBack = () => router.back()

const currentId = computed(() => episode.value?.id)
const currentVideoUrl = computed(() => episode.value?.video_url || '')
const currentThumb = computed(() => episode.value?.thumb_url || getThumb(episode.value))
const currentEpNumber = computed(() => episode.value?.episode_number || 1)
const totalEps = computed(() => episodeList.value.length)

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

// 后续集数（当前集之后的）
const remainingEpisodes = computed(() => {
  const idx = currentIndex.value
  if (idx < 0) return []
  return episodeList.value.slice(idx + 2) // 跳过当前集和下一集
})

const getThumb = (ep: any) => {
  if (!ep) return '/placeholder.png'
  return ep.thumb_url || ep.cover_url || `/thumb-${ep.episode_number}.jpg`
}

const getLikes = (ep: any) => {
  return ep?.like_count || Math.floor(Math.random() * 1000)
}

const formatTime = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const progressPercent = computed(() => {
  if (!duration.value) return 0
  return (currentTime.value / duration.value) * 100
})

const showToast = (msg: string) => {
  toastMsg.value = msg
  toastShow.value = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastShow.value = false
  }, 2000)
}

const toggleLike = () => {
  isLiked.value = !isLiked.value
  likeCount.value += isLiked.value ? 1 : -1
  showToast(isLiked.value ? '谢谢点赞 ❤️' : '取消点赞')
}

const share = async () => {
  const url = window.location.href
  if (navigator.share) {
    try {
      await navigator.share({
        title: dramaTitle.value,
        text: `《${dramaTitle.value}》第${currentEpNumber.value}集`,
        url
      })
    } catch (e) {
      // 用户取消分享
    }
  } else {
    navigator.clipboard.writeText(url)
    showToast('链接已复制到剪贴板')
  }
}

const toggleFollow = () => {
  isFollowed.value = !isFollowed.value
  showToast(isFollowed.value ? '已加入追剧列表' : '已取消追剧')
}

const toggleFollowEp = (ep: any) => {
  if (!ep.is_followed) {
    ep.is_followed = true
    showToast('已加入追剧列表')
  } else {
    ep.is_followed = false
    showToast('已取消追剧')
  }
}

const toggleEpisodeList = () => {
  showEpisodeList.value = !showEpisodeList.value
}

const switchTo = (ep: any) => {
  if (!ep || ep.id === currentId.value) return
  episode.value = ep
  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Touch handling for swipe episode switching
const touchStartY = ref(0)

const handleTouchStart = (e: TouchEvent) => {
  touchStartY.value = e.touches[0].clientY
}

const handleTouchEnd = (e: TouchEvent) => {
  const deltaY = touchStartY.value - e.changedTouches[0].clientY
  if (deltaY > 50 && nextEpisode.value) {
    // 上滑 → 下一集
    switchTo(nextEpisode.value)
    showSwipe('下一集 →')
  } else if (deltaY < -50 && prevEpisode.value) {
    // 下滑 → 上一集
    switchTo(prevEpisode.value)
    showSwipe('← 上一集')
  }
}

const showSwipe = (direction: string) => {
  swipeHint.value = direction
  showSwipeHint.value = true
  if (swipeHintTimer) clearTimeout(swipeHintTimer)
  swipeHintTimer = setTimeout(() => {
    showSwipeHint.value = false
  }, 800)
}

// 设置视频事件监听
const setupVideoListeners = () => {
  const video = videoRef.value
  if (!video) return

  video.addEventListener('timeupdate', () => {
    currentTime.value = video.currentTime
  })

  video.addEventListener('loadedmetadata', () => {
    duration.value = video.duration
  })

  video.addEventListener('ended', () => {
    // 自动播放下一集
    if (nextEpisode.value) {
      switchTo(nextEpisode.value)
    }
  })
}

onMounted(async () => {
  const id = Number(route.params.id)
  loading.value = true

  try {
    // 从路由获取drama_id
    const drama_id = Number(route.query.drama_id || 0)

    if (drama_id) {
      dramaId.value = drama_id
      const dramaRes = await dramaApi.getDetail(drama_id)
      if (dramaRes.data) {
        dramaTitle.value = dramaRes.data.title || '热播短剧'
        episodeList.value = dramaRes.data.episodes || []
      }
    }

    // 如果没有集数列表，使用模拟数据
    if (episodeList.value.length === 0) {
      episodeList.value = [
        { id: 1, drama_id: 1, episode_number: 1, title: '第一集', video_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', like_count: 520, is_followed: false },
        { id: 2, drama_id: 1, episode_number: 2, title: '第二集', video_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', like_count: 480, is_followed: false },
        { id: 3, drama_id: 1, episode_number: 3, title: '第三集', video_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', like_count: 450, is_followed: false },
        { id: 4, drama_id: 1, episode_number: 4, title: '第四集', video_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', like_count: 420, is_followed: false },
        { id: 5, drama_id: 1, episode_number: 5, title: '第五集', video_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', like_count: 380, is_followed: false },
        { id: 6, drama_id: 1, episode_number: 6, title: '第六集', video_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', like_count: 350, is_followed: false }
      ]
      dramaTitle.value = '热门短剧'
    }

    // 找到当前集
    episode.value = episodeList.value.find(ep => ep.id === id) || episodeList.value[0]
    likeCount.value = getLikes(episode.value)

    // 设置视频监听
    setTimeout(setupVideoListeners, 100)

  } catch (error) {
    console.error('获取剧集详情失败:', error)
    // 使用默认数据
    episodeList.value = [
      { id: 1, drama_id: 1, episode_number: 1, title: '第一集', video_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', like_count: 520, is_followed: false },
      { id: 2, drama_id: 1, episode_number: 2, title: '第二集', video_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', like_count: 480, is_followed: false },
      { id: 3, drama_id: 1, episode_number: 3, title: '第三集', video_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', like_count: 450, is_followed: false },
      { id: 4, drama_id: 1, episode_number: 4, title: '第四集', video_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', like_count: 420, is_followed: false },
      { id: 5, drama_id: 1, episode_number: 5, title: '第五集', video_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', like_count: 380, is_followed: false },
      { id: 6, drama_id: 1, episode_number: 6, title: '第六集', video_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', like_count: 350, is_followed: false }
    ]
    dramaTitle.value = '热门短剧'
    episode.value = episodeList.value[0]
    likeCount.value = getLikes(episode.value)
    setTimeout(setupVideoListeners, 100)
  }

  loading.value = false
})

onUnmounted(() => {
  if (swipeHintTimer) clearTimeout(swipeHintTimer)
  if (toastTimer) clearTimeout(toastTimer)
})
</script>

<style scoped>
.play-page {
  background: #0a0a0a;
  min-height: 100vh;
  color: #fff;
  padding-bottom: 40px;
}

.back-btn {
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 100;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
}

/* 视频播放器区域 */
.video-section {
  width: 100%;
  background: #000;
}

.video-section video {
  width: 100%;
  height: auto;
  display: block;
}

/* 进度条 */
.progress-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  background: #151515;
}

.current-time,
.total-time {
  font-size: 12px;
  color: #999;
  min-width: 40px;
}

.progress-track {
  flex: 1;
  height: 3px;
  background: #333;
  border-radius: 2px;
}

.progress-fill {
  height: 100%;
  background: #ff4d4f;
  border-radius: 2px;
  transition: width 0.1s linear;
}

/* 互动按钮栏 */
.action-bar {
  display: flex;
  justify-content: space-around;
  padding: 14px 20px;
  background: #0a0a0a;
  border-bottom: 1px solid #1a1a1a;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #888;
  cursor: pointer;
  transition: color 0.2s;
}

.action-item:active {
  transform: scale(0.95);
}

.action-item.active {
  color: #ff4d4f;
}

.action-item.followed {
  color: #ff7875;
}

.action-item .icon {
  font-size: 22px;
}

.action-item .count {
  font-weight: bold;
}

/* 剧集信息 */
.drama-info {
  padding: 20px 16px 16px;
}

.drama-title {
  font-size: 20px;
  font-weight: bold;
  color: #fff;
  margin: 0 0 4px 0;
}

.drama-subtitle {
  font-size: 13px;
  color: #666;
  margin: 0 0 14px 0;
}

.episode-selector {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 16px;
  background: #151515;
  border-radius: 8px;
  cursor: pointer;
}

.episode-info {
  font-size: 14px;
  color: #fff;
}

.selector-arrow {
  font-size: 14px;
  color: #666;
}

.selector-arrow span {
  display: inline-block;
  transition: transform 0.2s;
}

.selector-arrow span.rotated {
  transform: rotate(90deg);
}

/* 集卡片 */
.episode-card {
  margin: 10px 16px;
  padding: 14px;
  background: #111111;
  border-radius: 10px;
  cursor: pointer;
  border: 1px solid #1a1a1a;
  transition: all 0.2s;
}

.episode-card:active {
  transform: scale(0.98);
}

.episode-card.next-card.active {
  border-color: #ff4d4f;
  background: rgba(255, 72, 72, 0.05);
}

.card-preview {
  display: flex;
  gap: 14px;
  margin-bottom: 12px;
}

.card-thumb {
  width: 80px;
  height: 105px;
  border-radius: 6px;
  object-fit: cover;
}

.card-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.card-badge {
  display: inline-block;
  padding: 3px 10px;
  background: #ff4d4f;
  border-radius: 4px;
  font-size: 11px;
  color: #fff;
  width: fit-content;
  margin-bottom: 8px;
}

.card-badge.next {
  background: #333;
}

.card-title {
  font-size: 15px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 6px;
}

.card-sub {
  font-size: 13px;
  color: #666;
}

.card-actions {
  display: flex;
  gap: 20px;
  padding-top: 10px;
  border-top: 1px solid #1a1a1a;
  font-size: 13px;
  color: #666;
}

.card-actions span {
  cursor: pointer;
}

/* 选集弹窗 */
.episode-popup {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 70vh;
  background: #151515;
  border-radius: 16px 16px 0 0;
  z-index: 1000;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 999;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #222;
  font-size: 15px;
  color: #fff;
}

.close-btn {
  font-size: 24px;
  color: #666;
  cursor: pointer;
}

.episode-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
}

.ep-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: #1a1a1a;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.ep-card.active {
  border-color: #ff4d4f;
  background: rgba(255, 72, 72, 0.08);
}

.ep-card:active {
  transform: scale(0.98);
}

.ep-thumb {
  width: 45px;
  height: 65px;
  border-radius: 4px;
  object-fit: cover;
}

.ep-info {
  flex: 1;
}

.ep-title {
  font-size: 14px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 2px;
}

.ep-sub {
  font-size: 12px;
  color: #666;
}

.ep-actions {
  display: flex;
  gap: 6px;
}

.ep-actions .action-btn {
  padding: 4px 8px;
  background: #252525;
  border-radius: 4px;
  font-size: 11px;
  color: #888;
}

.ep-actions .action-btn.followed {
  color: #ff7875;
}

/* 滑动提示 */
.swipe-hint {
  position: fixed;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 14px;
  z-index: 10000;
  animation: fadeInOut 0.8s ease;
}

@keyframes fadeInOut {
  0% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
  20% { opacity: 1; transform: translateX(-50%) translateY(0); }
  80% { opacity: 1; transform: translateX(-50%) translateY(0); }
  100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
}

/* Toast提示 */
.toast {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.85);
  color: #fff;
  padding: 12px 24px;
  border-radius: 24px;
  font-size: 14px;
  z-index: 10000;
  animation: toastIn 0.3s ease;
}

@keyframes toastIn {
  from { opacity: 0; transform: translateX(-50%) translateY(20px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

/* 加载状态 */
.loading {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 14px;
}
</style>
