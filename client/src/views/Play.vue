<template>
  <div class="play-page">

    <!-- 视频播放器区域 - 全屏固定 -->
    <div class="video-container" @click="toggleOverlay" @touchstart="handleTouchStart" @touchend="handleTouchEnd">
      <video
        ref="videoRef"
        :src="currentVideoUrl"
        controls
        autoplay
        playsinline
        :poster="currentThumb"
      ></video>

      <!-- 控制覆盖层 -->
      <div class="overlay" :class="{ hidden: !overlayVisible }">
        <!-- 顶部区域：返回按钮 + 剧名标题 -->
        <div class="overlay-top">
          <div class="back-btn" @click.stop="goBack">
            <span class="back-icon">‹</span>
          </div>
          <div class="drama-title-wrap">
            <h1 class="drama-title">《{{ dramaTitle }}》</h1>
          </div>
          <div class="top-right-placeholder"></div>
        </div>

        <!-- 右上角集数选择 -->
        <div class="episode-picker" @click.stop="toggleEpisodeList">
          <span class="ep-current">第{{ currentEpNumber }}集</span>
          <span class="ep-total">（共{{ totalEps }}集）</span>
          <span class="ep-arrow" :class="{ active: episodeListVisible }">选集 ›</span>
        </div>

        <!-- 底部区域：操作按钮 + 集数缩略图 -->
        <div class="overlay-bottom">
          <!-- 底部渐变背景 -->
          <div class="bottom-gradient"></div>

          <!-- 操作按钮 -->
          <div class="action-bar">
            <div class="action-item" :class="{ active: isLiked }" @click.stop="toggleLike">
              <span class="action-icon">
                <svg v-if="!isLiked" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                <svg v-else width="26" height="26" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </span>
              <span class="action-count">{{ likeCount }}</span>
            </div>
            <div class="action-item" @click.stop="share">
              <span class="action-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                  <path d="M16 8L8 13M8 8l8 5"/>
                </svg>
              </span>
              <span class="action-label">分享</span>
            </div>
            <div class="action-item" :class="{ followed: isFollowed }" @click.stop="toggleFollow">
              <span class="action-icon">
                <svg v-if="!isFollowed" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                <svg v-else width="26" height="26" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
              </span>
              <span class="action-label">{{ isFollowed ? '已追剧' : '追剧' }}</span>
            </div>
          </div>

          <!-- 集数缩略图列表 -->
          <div class="episode-thumbs" v-show="episodeListVisible">
            <div class="thumbs-scroll" ref="episodeScrollRef">
              <div
                v-for="ep in episodeList"
                :key="ep.id"
                :class="['thumb-item', { active: ep.id === currentId }]"
                @click.stop="switchTo(ep)"
              >
                <img :src="getThumb(ep)" class="thumb-img" />
                <span class="thumb-badge">第{{ ep.episode_number || ep.episodeNumber }}集</span>
                <div v-if="ep.id === currentId" class="thumb-playing"></div>
              </div>
            </div>
          </div>

          <!-- 上下集快捷入口 -->
          <div class="quick-nav">
            <div v-if="prevEpisode" class="quick-nav-item prev" @click.stop="switchTo(prevEpisode)">
              <span class="quick-icon">‹</span>
              <span class="quick-text">上一集</span>
            </div>
            <div v-if="nextEpisode" class="quick-nav-item next" @click.stop="switchTo(nextEpisode)">
              <span class="quick-text">下一集</span>
              <span class="quick-icon">›</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 滑动提示 -->
    <div v-if="showSwipeHint" class="swipe-hint">{{ swipeHint }}</div>

    <!-- Toast提示 -->
    <div v-if="toastShow" class="toast">{{ toastMsg }}</div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <span>加载中...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { dramaApi } from '@/api/drama'

const router = useRouter()
const route = useRoute()

const videoRef = ref<HTMLVideoElement | null>(null)
const episodeScrollRef = ref<HTMLElement | null>(null)
const episode = ref<any>(null)
const episodeList = ref<any[]>([])
const loading = ref(false)

// UI状态
const overlayVisible = ref(true)
const episodeListVisible = ref(false)
const showSwipeHint = ref(false)
const swipeHint = ref('')
const toastShow = ref(false)
const toastMsg = ref('')

// 互动状态
const isLiked = ref(false)
const likeCount = ref(0)
const isFollowed = ref(false)

// 视频进度
const currentTime = ref(0)
const duration = ref(0)

// 剧集信息
const dramaTitle = ref('热播短剧')
const dramaId = ref<number>(0)
const dramaDescription = ref('')

let swipeHintTimer: ReturnType<typeof setTimeout> | null = null
let toastTimer: ReturnType<typeof setTimeout> | null = null

const goBack = () => router.back()

const currentId = computed(() => episode.value?.id)
const currentVideoUrl = computed(() => episode.value?.video_url || episode.value?.videoUrl || '')
const currentThumb = computed(() => episode.value?.thumb_url || episode.value?.thumbUrl || episode.value?.cover_url || episode.value?.coverUrl || getThumb(episode.value))
const currentEpNumber = computed(() => episode.value?.episode_number || episode.value?.episodeNumber || 1)
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

const getThumb = (ep: any) => {
  if (!ep) return 'https://picsum.photos/200/300?random=1'
  return ep.thumb_url || ep.thumbUrl || ep.cover_url || ep.coverUrl || `https://picsum.photos/200/300?random=${ep.episode_number || ep.episodeNumber || 1}`
}

const getLikes = (ep: any) => {
  return ep?.likeCount || Math.floor(Math.random() * 1000)
}

// 切换覆盖层显示/隐藏
const toggleOverlay = () => {
  overlayVisible.value = !overlayVisible.value
}

// 切换集数列表显示
const toggleEpisodeList = () => {
  episodeListVisible.value = !episodeListVisible.value
}

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

const switchTo = (ep: any) => {
  if (!ep || ep.id === currentId.value) return
  episode.value = ep
  likeCount.value = getLikes(ep)
  episodeListVisible.value = false
  // 滚动集数选择器到当前集
  setTimeout(() => {
    if (episodeScrollRef.value) {
      const activeEl = episodeScrollRef.value.querySelector('.thumb-item.active')
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, 100)
}

// Touch handling for swipe episode switching
const touchStartY = ref(0)

const handleTouchStart = (e: TouchEvent) => {
  touchStartY.value = e.touches[0].clientY
}

const handleTouchEnd = (e: TouchEvent) => {
  const deltaY = touchStartY.value - e.changedTouches[0].clientY
  if (deltaY > 50 && nextEpisode.value) {
    switchTo(nextEpisode.value)
    showSwipe('下一集 →')
  } else if (deltaY < -50 && prevEpisode.value) {
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
    if (nextEpisode.value) {
      switchTo(nextEpisode.value)
    }
  })

  // 尝试自动播放视频
  video.play().catch(() => {
    // 自动播放被浏览器阻止，静默处理
  })
}

onMounted(async () => {
  const episodeId = Number(route.params.episodeId)
  loading.value = true

  try {
    const drama_id = Number(route.query.drama_id || 0)

    if (drama_id) {
      dramaId.value = drama_id
      const dramaRes = await dramaApi.getDetail(drama_id)
      if (dramaRes.data) {
        dramaTitle.value = dramaRes.data.title || '热播短剧'
        dramaDescription.value = dramaRes.data.description || ''
        episodeList.value = dramaRes.data.episodes || []
      }
    }

    if (episodeList.value.length === 0) {
      // 使用 drama_id 作为 drama_id 生成一致的 mock 数据
      const mockDramaId = drama_id || 1
      episodeList.value = [
        { id: 1, dramaId: mockDramaId, episodeNumber: 1, title: '第一集', description: '意外相遇，开启甜蜜情缘', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', likeCount: 520, isFollowed: false, thumbUrl: 'https://picsum.photos/200/300?random=1' },
        { id: 2, dramaId: mockDramaId, episodeNumber: 2, title: '第二集', description: '误会重重，情感升温', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', likeCount: 480, isFollowed: false, thumbUrl: 'https://picsum.photos/200/300?random=2' },
        { id: 3, dramaId: mockDramaId, episodeNumber: 3, title: '第三集', description: '真相大白，幸福来临', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', likeCount: 450, isFollowed: false, thumbUrl: 'https://picsum.photos/200/300?random=3' },
        { id: 4, dramaId: mockDramaId, episodeNumber: 4, title: '第四集', description: '家族纷争，携手面对', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', likeCount: 420, isFollowed: false, thumbUrl: 'https://picsum.photos/200/300?random=4' },
        { id: 5, dramaId: mockDramaId, episodeNumber: 5, title: '第五集', description: '事业爱情双丰收', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', likeCount: 380, isFollowed: false, thumbUrl: 'https://picsum.photos/200/300?random=5' },
        { id: 6, dramaId: mockDramaId, episodeNumber: 6, title: '第六集', description: '甜蜜大结局', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', likeCount: 350, isFollowed: false, thumbUrl: 'https://picsum.photos/200/300?random=6' }
      ]
      dramaTitle.value = dramaTitle.value || '闪婚成宠：盛爷的替嫁娇妻'
      dramaDescription.value = dramaDescription.value || '一场意外，她被迫嫁给他。本以为是形婚，他却步步紧逼...'
    }

    // 用 episodeId 直接查找对应的 episode
    episode.value = episodeList.value.find(ep => ep.id === episodeId) || episodeList.value[0]
    likeCount.value = getLikes(episode.value)
    setTimeout(setupVideoListeners, 100)

  } catch (error) {
    console.error('获取剧集详情失败:', error)
    const mockDramaId = dramaId.value || 1
    episodeList.value = [
      { id: 1, dramaId: mockDramaId, episodeNumber: 1, title: '第一集', description: '意外相遇，开启甜蜜情缘', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', likeCount: 520, isFollowed: false, thumbUrl: 'https://picsum.photos/200/300?random=1' },
      { id: 2, dramaId: mockDramaId, episodeNumber: 2, title: '第二集', description: '误会重重，情感升温', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', likeCount: 480, isFollowed: false, thumbUrl: 'https://picsum.photos/200/300?random=2' },
      { id: 3, dramaId: mockDramaId, episodeNumber: 3, title: '第三集', description: '真相大白，幸福来临', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', likeCount: 450, isFollowed: false, thumbUrl: 'https://picsum.photos/200/300?random=3' },
      { id: 4, dramaId: mockDramaId, episodeNumber: 4, title: '第四集', description: '家族纷争，携手面对', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', likeCount: 420, isFollowed: false, thumbUrl: 'https://picsum.photos/200/300?random=4' },
      { id: 5, dramaId: mockDramaId, episodeNumber: 5, title: '第五集', description: '事业爱情双丰收', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', likeCount: 380, isFollowed: false, thumbUrl: 'https://picsum.photos/200/300?random=5' },
      { id: 6, dramaId: mockDramaId, episodeNumber: 6, title: '第六集', description: '甜蜜大结局', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', likeCount: 350, isFollowed: false, thumbUrl: 'https://picsum.photos/200/300?random=6' }
    ]
    dramaTitle.value = dramaTitle.value || '闪婚成宠：盛爷的替嫁娇妻'
    dramaDescription.value = dramaDescription.value || '一场意外，她被迫嫁给他。本以为是形婚，他却步步紧逼...'
    episode.value = episodeList.value.find(ep => ep.dramaId === dramaId.value) || episodeList.value[0]
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
  background: #000;
  min-height: 100vh;
  color: #1A1A1A;
}

/* 全屏视频容器 */
.video-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1;
  background: #000;
}

.video-container video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 控制覆盖层 */
.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.overlay.hidden {
  opacity: 0;
  pointer-events: none;
}

.overlay * {
  pointer-events: auto;
}

/* 顶部区域 */
.overlay-top {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  padding-top: calc(12px + env(safe-area-inset-top, 0));
  background: linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%);
}

/* 返回按钮 */
.back-btn {
  width: 36px;
  height: 36px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  backdrop-filter: blur(10px);
}

.back-icon {
  font-size: 24px;
  color: #fff;
  font-weight: 300;
  line-height: 1;
}

.drama-title-wrap {
  flex: 1;
  text-align: center;
  padding: 0 10px;
}

.drama-title {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  margin: 0;
  text-shadow: 0 1px 3px rgba(0,0,0,0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.top-right-placeholder {
  width: 36px;
}

/* 集数选择器 */
.episode-picker {
  position: absolute;
  top: 60px;
  right: 16px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 8px 14px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #fff;
  cursor: pointer;
}

.ep-current {
  font-weight: 600;
}

.ep-total {
  opacity: 0.8;
}

.ep-arrow {
  opacity: 0.7;
  transition: transform 0.3s;
}

.ep-arrow.active {
  transform: rotate(90deg);
}

/* 底部区域 */
.overlay-bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding-bottom: calc(16px + env(safe-area-inset-bottom, 0));
}

.bottom-gradient {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 300px;
  background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 40%, transparent 70%);
  pointer-events: none;
}

/* 操作按钮 */
.action-bar {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 40px;
  padding: 20px 16px 16px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
  -webkit-tap-highlight-color: transparent;
}

.action-item:active {
  transform: scale(0.92);
}

.action-item.active {
  color: #FF4D4F;
}

.action-item.followed {
  color: #FF7875;
}

.action-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 50%;
}

.action-count,
.action-label {
  font-size: 12px;
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  text-shadow: 0 1px 3px rgba(0,0,0,0.5);
}

/* 集数缩略图列表 */
.episode-thumbs {
  position: relative;
  padding: 0 16px;
  margin-top: 10px;
}

.thumbs-scroll {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding: 4px 0;
}

.thumbs-scroll::-webkit-scrollbar {
  display: none;
}

.thumb-item {
  flex-shrink: 0;
  width: 70px;
  height: 95px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  border: 2px solid transparent;
  transition: all 0.2s;
  opacity: 0.7;
}

.thumb-item.active {
  border-color: #fff;
  opacity: 1;
}

.thumb-item:active {
  transform: scale(0.95);
}

.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-badge {
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
}

.thumb-playing {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 8px;
  height: 8px;
  background: #FF4D4F;
  border-radius: 50%;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.2); }
}

/* 上下集快捷入口 */
.quick-nav {
  position: relative;
  display: flex;
  justify-content: space-between;
  padding: 16px 16px 0;
}

.quick-nav-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
  color: #fff;
  font-size: 13px;
}

.quick-nav-item:active {
  transform: scale(0.95);
  background: rgba(255, 255, 255, 0.25);
}

.quick-nav-item.next {
  background: rgba(255, 77, 79, 0.8);
}

.quick-icon {
  font-size: 16px;
  font-weight: 300;
}

.quick-text {
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
}

/* 滑动提示 */
.swipe-hint {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 14px;
  z-index: 10000;
  animation: fadeInOut 0.8s ease;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
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
  bottom: 150px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 12px 24px;
  border-radius: 24px;
  font-size: 14px;
  z-index: 10000;
  animation: toastIn 0.3s ease;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  backdrop-filter: blur(10px);
}

@keyframes toastIn {
  from { opacity: 0; transform: translateX(-50%) translateY(20px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

/* 加载状态 */
.loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: rgba(0, 0, 0, 0.95);
  z-index: 1000;
}

.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-top-color: #FF4D4F;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading span {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
}
</style>
