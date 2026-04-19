<template>
  <div class="home-page">
    <!-- 顶部 Header -->
    <header class="header">
      <h1 class="logo">熊猫短剧</h1>
      <div class="top-tabs">
        <span
          :class="{ active: currentTab === 'following' }"
          @click="switchTab('following')"
        >追剧</span>
        <span
          :class="{ active: currentTab === 'latest' }"
          @click="switchTab('latest')"
        >最新</span>
        <span
          :class="{ active: currentTab === 'rank' }"
          @click="switchTab('rank')"
        >排行</span>
      </div>
      <button class="download-btn">下载APP</button>
    </header>

    <!-- 追剧列表 -->
    <div v-if="currentTab === 'following'" class="following-section">
      <div v-if="followingList.length === 0 && !loading" class="empty-state">
        <p>暂无追剧内容</p>
        <p class="hint">去最新剧集中添加吧</p>
      </div>
      <div v-else class="drama-list">
        <div
          v-for="drama in followingList"
          :key="drama.id"
          class="drama-item"
          @click="goPlay(drama)"
        >
          <img :src="drama.cover" :alt="drama.title" class="cover" />
          <div class="info">
            <h3>{{ drama.title }}</h3>
            <p class="desc">{{ drama.description }}</p>
            <div class="meta">
              <span class="episodes">{{ drama.totalEpisodes || drama.total_episodes }}集</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 排行榜 -->
    <div v-if="currentTab === 'rank'" class="rank-section">
      <div class="rank-header">
        <span class="rank-title">热播榜</span>
        <span class="rank-subtitle">每周热剧TOP10</span>
      </div>
      <div class="rank-list">
        <div
          v-for="(drama, index) in rankList"
          :key="drama.id"
          class="rank-item"
          @click="goPlay(drama)"
        >
          <span :class="['rank-num', { top: index < 3 }]">{{ index + 1 }}</span>
          <img :src="drama.cover" :alt="drama.title" class="rank-cover" />
          <div class="rank-info">
            <h4>{{ drama.title }}</h4>
            <p class="rank-views">{{ drama.views || 0 }}次观看</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 最新/推荐 视图 -->
    <div v-if="currentTab === 'latest' || currentTab === 'following'">
      <!-- 热播榜 TOP3 -->
      <div class="hot-rank">
        <div class="rank-header">
          <span class="rank-title">热播榜</span>
          <span class="rank-subtitle">每周热剧TOP3</span>
        </div>
        <div class="hot-list">
          <div
            v-for="drama in hotList.slice(0, 3)"
            :key="drama.id"
            class="hot-item"
            @click="goPlay(drama)"
          >
            {{ drama.title }}
          </div>
        </div>
      </div>

      <!-- 最新热剧 -->
      <div class="latest-section">
        <div class="section-header">
          <span class="section-title">最新热剧</span>
          <span class="more-link" @click="switchTab('latest')">查看全部热剧 ›</span>
        </div>

        <!-- 横向滚动卡片 -->
        <div class="horizontal-scroll">
          <div
            v-for="drama in dramaList.slice(0, 6)"
            :key="drama.id"
            class="drama-card"
            @click="goPlay(drama)"
          >
            <img :src="drama.cover" :alt="drama.title" />
            <span class="card-title">{{ drama.title }}</span>
          </div>
        </div>

        <!-- 竖向列表 -->
        <div class="drama-list">
          <div
            v-for="drama in dramaList"
            :key="drama.id"
            class="drama-item"
            @click="goPlay(drama)"
          >
            <img :src="drama.cover" :alt="drama.title" class="cover" />
            <div class="info">
              <h3>{{ drama.title }}</h3>
              <p class="desc">{{ drama.description }}</p>
              <div class="meta">
                <span class="price" v-if="drama.price">¥{{ drama.price }}</span>
                <span class="episodes">{{ drama.totalEpisodes || drama.total_episodes }}集</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 加载更多 -->
      <div
        ref="loadMoreRef"
        class="load-more"
        @click="loadMore"
      >
        {{ loading ? '加载中...' : (hasMore ? '上拉加载更多' : '没有更多了') }}
      </div>
    </div>

    <TabBar />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useDramaStore } from '@/stores/drama'
import { useUserStore } from '@/stores/user'
import TabBar from '@/components/TabBar.vue'

const router = useRouter()
const dramaStore = useDramaStore()
const userStore = useUserStore()

// Tab 状态
const currentTab = ref<'following' | 'latest' | 'rank'>('latest')

// 数据
const dramaList = ref<any[]>([])
const hotList = ref<any[]>([])
const rankList = ref<any[]>([])
const followingList = ref<any[]>([])

// 分页
const loading = ref(false)
const page = ref(1)
const pageSize = 10
const hasMore = ref(true)

// 加载更多引用
const loadMoreRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

// 切换 Tab
const switchTab = async (tab: 'following' | 'latest' | 'rank') => {
  currentTab.value = tab
  page.value = 1
  dramaList.value = []
  hasMore.value = true

  if (tab === 'latest') {
    await fetchLatestDramas()
  } else if (tab === 'following') {
    await fetchFollowingDramas()
  } else if (tab === 'rank') {
    await fetchRankDramas()
  }
}

// 获取最新剧集
const fetchLatestDramas = async () => {
  loading.value = true
  try {
    await dramaStore.fetchDramaList({ page: page.value, pageSize })
    if (page.value === 1) {
      dramaList.value = [...dramaStore.dramaList]
    } else {
      dramaList.value.push(...dramaStore.dramaList)
    }
    hasMore.value = dramaStore.dramaList.length === pageSize
  } finally {
    loading.value = false
  }
}

// 获取追剧列表
const fetchFollowingDramas = async () => {
  loading.value = true
  try {
    // TODO: 调用追剧 API
    // 目前使用全部剧集作为演示
    if (userStore.token) {
      await dramaStore.fetchDramaList({ page: 1, pageSize: 50 })
      followingList.value = [...dramaStore.dramaList]
    }
  } finally {
    loading.value = false
  }
}

// 获取排行榜
const fetchRankDramas = async () => {
  loading.value = true
  try {
    await dramaStore.fetchDramaList({ page: 1, pageSize: 10 })
    rankList.value = [...dramaStore.dramaList]
  } finally {
    loading.value = false
  }
}

// 加载更多
const loadMore = async () => {
  if (loading.value || !hasMore.value) return
  page.value++
  await fetchLatestDramas()
}

// 设置无限滚动
const setupInfiniteScroll = () => {
  if (!loadMoreRef.value) return

  observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && hasMore.value && !loading.value) {
      loadMore()
    }
  }, { threshold: 0.1 })

  observer.observe(loadMoreRef.value)
}

// 跳转播放页
const goPlay = (drama: any) => {
  // 使用 drama.id 作为 episodeId（实际应为第一集的 episodeId）
  router.push(`/play/${drama.id}?drama_id=${drama.id}`)
}

// 获取热播榜
const fetchHotList = async () => {
  try {
    await dramaStore.fetchDramaList({ page: 1, pageSize: 10 })
    hotList.value = [...dramaStore.dramaList]
  } catch (e) {
    console.error('获取热播榜失败:', e)
  }
}

onMounted(async () => {
  // 获取热播榜
  await fetchHotList()

  // 获取最新剧集
  await fetchLatestDramas()

  // 设置无限滚动
  await nextTick()
  setupInfiniteScroll()
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0));
}

/* Header */
.header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.logo {
  font-size: 18px;
  font-weight: bold;
  color: #FF4D4F;
  margin: 0;
}

.top-tabs {
  flex: 1;
  display: flex;
  justify-content: center;
  gap: 24px;
}

.top-tabs span {
  font-size: 15px;
  color: #666;
  cursor: pointer;
  padding: 4px 0;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.top-tabs span.active {
  color: #FF4D4F;
  font-weight: bold;
  border-bottom-color: #FF4D4F;
}

.download-btn {
  padding: 6px 12px;
  background: #FF4D4F;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 12px;
  cursor: pointer;
}

/* 热播榜 */
.hot-rank {
  background: #fff;
  margin: 10px;
  border-radius: 12px;
  padding: 14px;
}

.rank-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.rank-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.rank-subtitle {
  font-size: 12px;
  color: #999;
}

.hot-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.hot-item {
  font-size: 14px;
  color: #333;
  padding: 8px 0;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
}

.hot-item:last-child {
  border-bottom: none;
}

.hot-item:hover {
  color: #FF4D4F;
}

/* 最新热剧 */
.latest-section {
  padding: 0 10px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.more-link {
  font-size: 13px;
  color: #999;
  cursor: pointer;
}

/* 横向滚动 */
.horizontal-scroll {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 12px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.horizontal-scroll::-webkit-scrollbar {
  display: none;
}

.drama-card {
  flex-shrink: 0;
  width: 110px;
  cursor: pointer;
}

.drama-card img {
  width: 110px;
  height: 145px;
  border-radius: 8px;
  object-fit: cover;
}

.card-title {
  display: block;
  font-size: 13px;
  color: #333;
  margin-top: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 竖向列表 */
.drama-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.drama-item {
  display: flex;
  background: #fff;
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
}

.drama-item .cover {
  width: 100px;
  height: 135px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
}

.drama-item .info {
  flex: 1;
  margin-left: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
}

.drama-item h3 {
  font-size: 15px;
  color: #333;
  margin: 0 0 6px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.drama-item .desc {
  font-size: 13px;
  color: #666;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
}

.drama-item .meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}

.drama-item .price {
  color: #FF4D4F;
  font-size: 14px;
  font-weight: bold;
}

.drama-item .episodes {
  font-size: 12px;
  color: #999;
}

/* 排行榜 */
.rank-section {
  padding: 10px;
}

.rank-list {
  background: #fff;
  border-radius: 12px;
  padding: 12px;
}

.rank-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  cursor: pointer;
  border-bottom: 1px solid #f5f5f5;
}

.rank-item:last-child {
  border-bottom: none;
}

.rank-num {
  width: 24px;
  font-size: 16px;
  font-weight: bold;
  color: #999;
  text-align: center;
}

.rank-num.top {
  color: #FF4D4F;
}

.rank-cover {
  width: 45px;
  height: 60px;
  border-radius: 4px;
  object-fit: cover;
  margin: 0 12px;
}

.rank-info h4 {
  font-size: 14px;
  color: #333;
  margin: 0 0 4px 0;
}

.rank-views {
  font-size: 12px;
  color: #999;
  margin: 0;
}

/* 加载更多 */
.load-more {
  text-align: center;
  padding: 16px;
  color: #999;
  font-size: 14px;
  cursor: pointer;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.empty-state .hint {
  font-size: 13px;
  color: #999;
  margin-top: 8px;
}
</style>
