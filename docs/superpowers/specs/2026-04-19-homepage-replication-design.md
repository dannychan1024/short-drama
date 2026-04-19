# 首页重构设计方案

## 1. 概述

### 项目背景
将 admvp.cn/h5 首页完整复刻到 short-drama-h5 项目，使用真实 API 数据。

### 目标文件
- `client/src/views/Home.vue`
- `client/src/components/TabBar.vue`（如需更新）

### 核心目标
复刻 admvp 首页 UI 布局和交互，使用真实 API 数据替代硬编码 Mock。

---

## 2. 页面结构

### 2.1 顶部 Header

| 元素 | 内容 | 样式 |
|------|------|------|
| Logo | "熊猫短剧" | 18px，加粗，左对齐 |
| Tab栏 | 追剧 / 最新 / 排行 | 横向排列，间距20px |
| 下载APP | 按钮 | 右侧 |

**Tab 切换逻辑：**
- 追剧：显示用户追剧的列表
- 最新：显示最新剧集（默认视图）
- 排行：显示热播榜 TOP3

### 2.2 热播榜

| 元素 | 内容 |
|------|------|
| 标题 | "热播榜" + "每周热剧TOP3" |
| 内容 | TOP3 短剧标题列表 |
| 样式 | 纯文字，无封面，无排名数字 |

### 2.3 最新热剧

| 元素 | 内容 |
|------|------|
| 标题 | "最新热剧" + "查看全部热剧"（链接） |
| 横向滚动 | 4-5个剧集卡片，可左右滑动 |
| 竖向列表 | 剧集封面 + 标题 + 描述 |

**卡片尺寸：** 120x160px，圆角8px
**列表项：** 封面100x140px + 标题+描述

### 2.4 无限滚动

- 底部显示 "上拉加载更多"
- 滚动到底部时加载下一页数据

### 2.5 底部 TabBar

| Tab | 图标 | 路由 |
|-----|------|------|
| 追剧 | 心形/收藏 | /following |
| 小剧场 | 视频图标 | /（或新建页面） |
| 推荐 | 推荐图标 | /（首页） |
| 我的 | 用户图标 | /profile |

---

## 3. API 对接

### 3.1 数据接口

```typescript
// 获取剧集列表（分页）
GET /api/dramas?page=1&pageSize=10&category=

// 获取热播榜
GET /api/dramas?sort=views&page=1&pageSize=3

// 获取用户追剧列表
GET /api/user/following
```

### 3.2 字段映射

| API 字段 | 前端使用 |
|---------|---------|
| id | drama.id |
| title | drama.title |
| cover | drama.cover |
| description | drama.description |
| total_episodes | drama.totalEpisodes |
| price | drama.price |

---

## 4. 状态管理

### 4.1 响应式变量

```typescript
const currentTab = ref<'following' | 'latest' | 'rank'>('latest')
const dramaList = ref<any[]>([])
const hotList = ref<any[]>([])
const followingList = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const hasMore = ref(true)
```

### 4.2 方法

```typescript
const switchTab = (tab: string) => {
  currentTab.value = tab as any
  page.value = 1
  dramaList.value = []
  fetchData()
}

const fetchData = async () => {
  // 根据 currentTab 获取不同数据
}

const loadMore = () => {
  // 无限滚动加载更多
}
```

---

## 5. 样式规范

### 5.1 颜色变量

| 名称 | 值 | 用途 |
|------|-----|------|
| 主色 | #FF4D4F | 强调色、按钮 |
| 文字 | #333 | 标题 |
| 次要文字 | #666 | 描述 |
| 背景 | #f5f5f5 | 页面背景 |

### 5.2 安全区域

```css
padding-bottom: calc(80px + env(safe-area-inset-bottom, 0))
```

---

## 6. 实施计划

详见：`../plans/2026-04-19-homepage-replication.md`

---

## 7. 测试要点

- [ ] Tab 切换正常
- [ ] 热播榜显示 TOP3
- [ ] 最新剧集横向滚动正常
- [ ] 无限滚动加载
- [ ] 底部 Tab 切换
- [ ] 点击剧集跳转播放页
