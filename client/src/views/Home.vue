<template>
  <div class="home-page">
    <header class="header">
      <h1>短剧点播</h1>
      <router-link to="/wallet" class="balance">余额: ¥{{ balance }}</router-link>
    </header>

    <!-- 分类筛选 -->
    <div class="categories">
      <div 
        v-for="cat in categories" 
        :key="cat.value"
        :class="['category', { active: currentCategory === cat.value }]"
        @click="changeCategory(cat.value)"
      >
        {{ cat.label }}
      </div>
    </div>

    <!-- 热播榜 -->
    <div v-if="currentCategory === ''" class="section">
      <div class="section-header">
        <h2>🔥 热播榜</h2>
        <span class="more">Top10</span>
      </div>
      <div class="rank-list">
        <div 
          v-for="(drama, index) in hotList" 
          :key="drama.id" 
          class="rank-item"
          @click="goDetail(drama.id)"
        >
          <span :class="['rank-num', { top: index < 3 }]">{{ index + 1 }}</span>
          <img :src="drama.cover" :alt="drama.title" class="rank-cover" />
          <div class="rank-info">
            <h4>{{ drama.title }}</h4>
            <p class="rank-views">{{ drama.views }}次观看</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 最新剧集 -->
    <div class="section">
      <div class="section-header">
        <h2>{{ currentCategory === '' ? '📺 最新剧集' : '筛选结果' }}</h2>
      </div>
      <div class="drama-list">
        <div 
          v-for="drama in dramaList" 
          :key="drama.id" 
          class="drama-item"
          @click="goDetail(drama.id)"
        >
          <img :src="drama.cover" :alt="drama.title" class="cover" />
          <div class="info">
            <h3>{{ drama.title }}</h3>
            <p class="desc">{{ drama.description }}</p>
            <div class="meta">
              <span class="price">¥{{ drama.price }}</span>
              <span class="episodes">{{ drama.totalEpisodes }}集</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>
    <div v-if="!loading && dramaList.length === 0" class="empty">暂无数据</div>

    <TabBar />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDramaStore } from '@/stores/drama'
import { useUserStore } from '@/stores/user'
import TabBar from '@/components/TabBar.vue'

const router = useRouter()
const dramaStore = useDramaStore()
const userStore = useUserStore()

const categories = [
  { label: '全部', value: '' },
  { label: '都市', value: 'urban' },
  { label: '古言', value: 'ancient' },
  { label: '甜宠', value: 'sweet' },
  { label: '悬疑', value: 'suspense' }
]

const currentCategory = ref('')
const loading = ref(false)
const balance = ref('0.00')
const dramaList = ref<any[]>([])
const hotList = ref<any[]>([])

const changeCategory = async (category: string) => {
  currentCategory.value = category
  loading.value = true
  await dramaStore.fetchDramaList({ category })
  dramaList.value = dramaStore.dramaList
  loading.value = false
}

const goDetail = (id: number) => {
  router.push(`/drama/${id}`)
}

onMounted(async () => {
  loading.value = true
  
  // 获取热播榜
  hotList.value = [
    { id: 1, title: '霸道总裁爱上我', cover: 'https://picsum.photos/200/300?random=10', views: 125680, price: 30 },
    { id: 2, title: '甜蜜暴击', cover: 'https://picsum.photos/200/300?random=11', views: 98650, price: 25 },
    { id: 3, title: '宫心计', cover: 'https://picsum.photos/200/300?random=12', views: 87430, price: 40 },
    { id: 4, title: '大唐荣耀', cover: 'https://picsum.photos/200/300?random=13', views: 76540, price: 35 },
    { id: 5, title: '庆余年', cover: 'https://picsum.photos/200/300?random=14', views: 65430, price: 28 },
    { id: 6, title: '琅琊榜', cover: 'https://picsum.photos/200/300?random=15', views: 54320, price: 32 },
    { id: 7, title: '如懿传', cover: 'https://picsum.photos/200/300?random=16', views: 43210, price: 38 },
    { id: 8, title: '延禧攻略', cover: 'https://picsum.photos/200/300?random=17', views: 32100, price: 36 },
    { id: 9, title: '知否知否', cover: 'https://picsum.photos/200/300?random=18', views: 21000, price: 30 },
    { id: 10, title: '锦绣未央', cover: 'https://picsum.photos/200/300?random=19', views: 19800, price: 33 }
  ]
  
  await dramaStore.fetchDramaList()
  dramaList.value = dramaStore.dramaList
  
  if (userStore.token) {
    await userStore.fetchUserInfo()
    balance.value = (userStore.userInfo?.balance || 0).toFixed(2)
  }
  loading.value = false
})
</script>

<style scoped>
.home-page {
  padding: 16px;
  padding-bottom: 100px;
  background: #f5f5f5;
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header h1 {
  font-size: 24px;
  color: #333;
}

.balance {
  font-size: 14px;
  color: #ff6b6b;
  text-decoration: none;
}

.categories {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.category {
  padding: 8px 16px;
  background: #fff;
  border-radius: 20px;
  font-size: 14px;
  white-space: nowrap;
  cursor: pointer;
  color: #666;
}

.category.active {
  background: #ff6b6b;
  color: #fff;
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

.section-header h2 {
  font-size: 18px;
  color: #333;
}

.more {
  font-size: 13px;
  color: #999;
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
  border-bottom: 1px solid #f0f0f0;
}

.rank-item:last-child {
  border-bottom: none;
}

.rank-num {
  width: 24px;
  font-size: 16px;
  font-weight: bold;
  color: #999;
}

.rank-num.top {
  color: #ff6b6b;
}

.rank-cover {
  width: 50px;
  height: 70px;
  border-radius: 6px;
  object-fit: cover;
  margin: 0 12px;
}

.rank-info h4 {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.rank-views {
  font-size: 12px;
  color: #999;
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
  overflow: hidden;
  cursor: pointer;
}

.cover {
  width: 120px;
  height: 160px;
  object-fit: cover;
}

.info {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.info h3 {
  font-size: 16px;
  color: #333;
}

.desc {
  font-size: 13px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price {
  color: #ff6b6b;
  font-size: 16px;
  font-weight: bold;
}

.episodes {
  font-size: 12px;
  color: #999;
}

.loading, .empty {
  text-align: center;
  padding: 40px;
  color: #999;
}
</style>
