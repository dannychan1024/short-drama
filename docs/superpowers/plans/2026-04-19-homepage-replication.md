# 首页重构实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 复刻 admvp 首页 UI 布局，使用真实 API 数据

**Architecture:** 重构 Home.vue 组件，移除硬编码数据，对接真实 API

---

## 文件结构

```
client/src/views/Home.vue    # 首页主组件（重构）
client/src/components/TabBar.vue  # 底部 TabBar（如需更新）
```

---

## 任务清单

### Task 1: 重写 Home.vue 模板结构

**Files:**
- Modify: `client/src/views/Home.vue` (template部分)

- [ ] **Step 1: 创建顶部 Header**

```vue
<header class="header">
  <h1 class="logo">熊猫短剧</h1>
  <div class="top-tabs">
    <span :class="{ active: currentTab === 'following' }" @click="switchTab('following')">追剧</span>
    <span :class="{ active: currentTab === 'latest' }" @click="switchTab('latest')">最新</span>
    <span :class="{ active: currentTab === 'rank' }" @click="switchTab('rank')">排行</span>
  </div>
  <button class="download-btn">下载APP</button>
</header>
```

- [ ] **Step 2: 创建热播榜区块**

```vue
<div v-if="currentTab === 'latest' || currentTab === 'following'" class="hot-rank">
  <div class="rank-header">
    <span class="rank-title">热播榜</span>
    <span class="rank-subtitle">每周热剧TOP3</span>
  </div>
  <div class="rank-list">
    <div v-for="drama in hotList" :key="drama.id" class="rank-item" @click="goPlay(drama)">
      {{ drama.title }}
    </div>
  </div>
</div>
```

- [ ] **Step 3: 创建最新热剧区块**

```vue
<div class="latest-section">
  <div class="section-header">
    <span class="section-title">最新热剧</span>
    <span class="more-link" @click="goAllDramas">查看全部热剧 ›</span>
  </div>
  
  <!-- 横向滚动卡片 -->
  <div class="horizontal-scroll">
    <div v-for="drama in horizontalList" :key="drama.id" class="drama-card" @click="goPlay(drama)">
      <img :src="drama.cover" :alt="drama.title" />
      <span class="card-title">{{ drama.title }}</span>
    </div>
  </div>
  
  <!-- 竖向列表 -->
  <div class="drama-list">
    <div v-for="drama in dramaList" :key="drama.id" class="drama-item" @click="goPlay(drama)">
      <img :src="drama.cover" :alt="drama.title" class="cover" />
      <div class="info">
        <h3>{{ drama.title }}</h3>
        <p class="desc">{{ drama.description }}</p>
      </div>
    </div>
  </div>
</div>
```

- [ ] **Step 4: 添加加载更多**

```vue
<div v-if="hasMore" class="load-more" @click="loadMore">
  {{ loading ? '加载中...' : '上拉加载更多' }}
</div>
```

- [ ] **Step 5: 更新底部 TabBar**

底部 TabBar 替换为 admvp 风格：
- 追剧 / 小剧场 / 推荐 / 我的

---

### Task 2: 重写脚本逻辑

**Files:**
- Modify: `client/src/views/Home.vue` (script部分)

- [ ] **Step 1: 定义响应式变量**

```typescript
const currentTab = ref<'following' | 'latest' | 'rank'>('latest')
const dramaList = ref<any[]>([])
const hotList = ref<any[]>([])
const followingList = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = 10
const hasMore = ref(true)
```

- [ ] **Step 2: 实现 switchTab 方法**

```typescript
const switchTab = (tab: 'following' | 'latest' | 'rank') => {
  currentTab.value = tab
  page.value = 1
  dramaList.value = []
  hasMore.value = true
  fetchData()
}
```

- [ ] **Step 3: 实现 fetchData 方法**

```typescript
const fetchData = async () => {
  loading.value = true
  try {
    const res = await dramaApi.getList({ page: page.value, pageSize })
    if (res.data) {
      if (page.value === 1) {
        dramaList.value = res.data.list
      } else {
        dramaList.value.push(...res.data.list)
      }
      hasMore.value = res.data.list.length === pageSize
    }
  } finally {
    loading.value = false
  }
}
```

- [ ] **Step 4: 实现 loadMore 方法**

```typescript
const loadMore = () => {
  if (loading.value || !hasMore.value) return
  page.value++
  fetchData()
}
```

- [ ] **Step 5: 实现无限滚动**

使用 IntersectionObserver 监听底部元素

- [ ] **Step 6: 更新 goPlay 方法**

```typescript
const goPlay = (drama: any) => {
  // 找到该剧的第一集 episode id
  const firstEpId = drama.episodes?.[0]?.id || drama.id
  router.push(`/play/${firstEpId}?drama_id=${drama.id}`)
}
```

- [ ] **Step 7: 更新 onMounted**

```typescript
onMounted(async () => {
  // 获取热播榜 TOP3
  const hotRes = await dramaApi.getList({ page: 1, pageSize: 3, sort: 'views' })
  hotList.value = hotRes.data?.list || []
  
  // 获取最新剧集
  await fetchData()
})
```

---

### Task 3: 重写样式

**Files:**
- Modify: `client/src/views/Home.vue` (style部分)

- [ ] **Step 1: Header 样式**

```css
.header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 100;
}

.logo {
  font-size: 18px;
  font-weight: bold;
  color: #FF4D4F;
}

.top-tabs {
  flex: 1;
  display: flex;
  justify-content: center;
  gap: 20px;
}

.top-tabs span {
  font-size: 15px;
  color: #666;
  cursor: pointer;
}

.top-tabs span.active {
  color: #FF4D4F;
  font-weight: bold;
}

.download-btn {
  padding: 6px 12px;
  background: #FF4D4F;
  color: #fff;
  border-radius: 12px;
  font-size: 12px;
}
```

- [ ] **Step 2: 热播榜样式**

```css
.hot-rank {
  background: #fff;
  margin: 10px;
  border-radius: 12px;
  padding: 12px;
}

.rank-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.rank-title {
  font-size: 15px;
  font-weight: bold;
  color: #333;
}

.rank-subtitle {
  font-size: 12px;
  color: #999;
}

.rank-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rank-item {
  font-size: 14px;
  color: #333;
  padding: 6px 0;
  cursor: pointer;
}
```

- [ ] **Step 3: 最新热剧样式**

```css
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
}

.horizontal-scroll {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 12px;
  -webkit-overflow-scrolling: touch;
}

.drama-card {
  flex-shrink: 0;
  width: 120px;
  cursor: pointer;
}

.drama-card img {
  width: 120px;
  height: 160px;
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
```

- [ ] **Step 4: 列表样式**

```css
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
  height: 140px;
  border-radius: 6px;
  object-fit: cover;
}

.drama-item .info {
  flex: 1;
  margin-left: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.drama-item h3 {
  font-size: 15px;
  color: #333;
  margin-bottom: 6px;
}

.drama-item .desc {
  font-size: 13px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
```

- [ ] **Step 5: 加载更多样式**

```css
.load-more {
  text-align: center;
  padding: 16px;
  color: #999;
  font-size: 14px;
}
```

---

### Task 4: 更新 TabBar 组件

**Files:**
- Modify: `client/src/components/TabBar.vue`

- [ ] **Step 1: 更新 Tab 配置**

```typescript
const tabs = [
  { key: 'following', label: '追剧', icon: 'heart', path: '/following' },
  { key: 'drama', label: '小剧场', icon: 'video', path: '/' },
  { key: 'home', label: '推荐', icon: 'home', path: '/' },
  { key: 'profile', label: '我的', icon: 'user', path: '/profile' }
]
```

---

### Task 5: 测试验证

- [ ] 启动开发服务器
- [ ] 验证 Tab 切换
- [ ] 验证热播榜显示
- [ ] 验证横向滚动
- [ ] 验证无限滚动
- [ ] 验证跳转播放页

---

### Task 6: 提交代码

```bash
git add client/src/views/Home.vue client/src/components/TabBar.vue
git commit -m "refactor(Home.vue): replicate admvp homepage UI

- Add top header with tabs (追剧/最新/排行)
- Add hot rank section (TOP3)
- Add latest dramas section with horizontal scroll
- Add infinite scroll pagination
- Update TabBar with admvp style icons
- Connect real API data

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```
