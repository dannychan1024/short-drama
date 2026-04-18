# 短剧H5播放页重构设计方案

## 1. 概述

### 项目背景
将 admvp.cn/h5 的播放页功能流程完整复刻到 short-drama-h5 项目中。

### 目标文件
- `client/src/views/Play.vue`

### 核心目标
重构播放页，使其与 admvp 播放页功能流程一致，同时保持与项目现有架构的兼容性。

---

## 2. 功能模块设计

### 2.1 视频播放器

| 属性 | 值 |
|------|-----|
| 播放器组件 | HTML5 `<video>` |
| 控制方式 | controls 属性 + 自定义覆盖层 |
| 自动播放 | autoplay + playsinline |
| 封面图 | poster 属性 |
| 播放结束 | 自动切换下一集 |

**视频源获取：**
- 从路由参数 `episodeId` 获取当前集
- 通过 `drama_id` 查询剧集列表
- 优先从API获取，失败时使用Mock数据

### 2.2 顶部导航栏

| 元素 | 样式 | 交互 |
|------|------|------|
| 返回按钮 | 36x36圆形，毛玻璃背景 | 点击 `router.back()` |
| 剧名标题 | 白色，16px，居中，文字阴影 | 无 |
| 右侧占位 | 36x36 | 无 |

**毛玻璃效果：**
```css
background: linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%);
backdrop-filter: blur(10px);
```

### 2.3 集数选择器

| 属性 | 值 |
|------|-----|
| 位置 | 绝对定位，右上角 |
| 样式 | 毛玻璃背景，圆角20px |
| 格式 | "第X集（共Y集）选集 ›" |
| 交互 | 点击切换列表显示 |

### 2.4 互动操作栏

三个按钮水平居中排列，间距40px：

| 按钮 | 图标 | 状态 | 样式 |
|------|------|------|------|
| 点赞 | 心形SVG | 普通(白)/已点赞(红色) | 点击数字+1/-1 |
| 分享 | 分享SVG | - | 调用navigator.share |
| 追剧 | +/- SVG | 普通(白)/已追(红色) | 显示Toast |

**图标容器：** 44x44圆形，毛玻璃背景

### 2.5 集数缩略图列表

| 属性 | 值 |
|------|-----|
| 布局 | flex横向滚动 |
| 单项尺寸 | 70x95px，圆角8px |
| 间距 | 10px |
| 滚动条 | 隐藏 |
| 当前集 | 白色边框，透明度1 |
| 非当前集 | 边框透明，透明度0.7 |

**Thumb项结构：**
- 图片：100%填充
- 集数标签：底部居中，黑色半透明背景
- 播放中标记：右上角红色圆点，脉冲动画

### 2.6 上下集快捷入口

| 元素 | 样式 |
|------|------|
| 上一集 | 左对齐，毛玻璃背景 |
| 下一集 | 右对齐，红色背景(#FF4D4F) |
| 图标 | '‹' / '›' |
| 文字 | "上一集" / "下一集" |

### 2.7 滑动手势

| 条件 | 动作 |
|------|------|
| deltaY > 50px (上滑) | 切换下一集 |
| deltaY < -50px (下滑) | 切换上一集 |

**滑动提示：** 顶部居中弹出，0.8秒渐变消失

### 2.8 Toast提示

| 属性 | 值 |
|------|-----|
| 位置 | 底部150px居中 |
| 样式 | 黑色半透明背景，圆角24px |
| 动画 | 0.3秒滑入 |
| 时长 | 2秒自动消失 |

---

## 3. 状态管理

### 3.1 响应式变量

```typescript
// 视频引用
const videoRef = ref<HTMLVideoElement | null>(null)

// 剧集数据
const episode = ref<any>(null)
const episodeList = ref<any[]>([])
const dramaTitle = ref('热播短剧')
const dramaId = ref<number>(0)

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
```

### 3.2 计算属性

```typescript
const currentId = computed(() => episode.value?.id)
const currentVideoUrl = computed(() => episode.value?.videoUrl || '')
const currentThumb = computed(() => episode.value?.thumbUrl || '')
const currentEpNumber = computed(() => episode.value?.episodeNumber || 1)
const totalEps = computed(() => episodeList.value.length)

const currentIndex = computed(() =>
  episodeList.value.findIndex(ep => ep.id === episode.value?.id)
)

const prevEpisode = computed(() =>
  currentIndex.value > 0 ? episodeList.value[currentIndex.value - 1] : null
)

const nextEpisode = computed(() =>
  currentIndex.value < episodeList.value.length - 1
    ? episodeList.value[currentIndex.value + 1]
    : null
)
```

---

## 4. API对接

### 4.1 数据获取

```typescript
// 获取剧集详情（含剧集列表）
const dramaRes = await dramaApi.getDetail(dramaId)
if (dramaRes.data) {
  dramaTitle.value = dramaRes.data.title
  episodeList.value = dramaRes.data.episodes || []
}
```

### 4.2 Mock数据

当API失败时，使用Mock数据：
```typescript
episodeList.value = [
  { id: 1, episodeNumber: 1, title: '第一集', videoUrl: '...', thumbUrl: '...' },
  // ...更多集
]
```

---

## 5. 样式规范

### 5.1 颜色变量

| 名称 | 值 | 用途 |
|------|-----|------|
| 主色 | #FF4D4F | 点赞、下一集按钮 |
| 文字 | #fff | 覆盖层文字 |
| 背景 | #000 | 页面背景 |

### 5.2 动画效果

| 动画 | 参数 |
|------|------|
| 脉冲 | 1s infinite, scale 1↔1.2 |
| Toast滑入 | 0.3s ease |
| 箭头旋转 | 0.3s, rotate 0↔90deg |
| 按钮缩放 | 0.2s, scale 0.92 |

### 5.3 安全区域

```css
/* 顶部 */
padding-top: calc(12px + env(safe-area-inset-top, 0))

/* 底部 */
padding-bottom: calc(16px + env(safe-area-inset-bottom, 0))
```

---

## 6. 测试要点

- [ ] 视频正常播放
- [ ] 返回按钮正常返回
- [ ] 点赞状态切换
- [ ] 分享功能（调起系统分享/复制链接）
- [ ] 追剧状态切换
- [ ] 集数列表显示/收起
- [ ] 点击缩略图切换集数
- [ ] 上下集按钮切换
- [ ] 滑动手势切换
- [ ] 视频结束自动播放下一集
- [ ] Toast提示正常显示

---

## 7. 与当前实现对比

| 功能 | 当前实现 | 重构目标 |
|------|---------|---------|
| 整体布局 | 相似 | 保持一致 |
| 点赞交互 | 已有 | 优化细节 |
| 分享交互 | 已有 | 优化细节 |
| 追剧交互 | 已有 | 优化细节 |
| 缩略图列表 | 已有 | 保持 |
| 上下集切换 | 已有 | 保持 |
| 滑动手势 | 已有 | 保持 |
| Toast提示 | 无独立组件 | 完善 |

---

## 8. 实施步骤

1. 分析当前Play.vue代码结构
2. 按照设计规范重构组件模板
3. 重构脚本逻辑，确保状态管理清晰
4. 调整样式，确保与admvp一致
5. 测试所有交互功能
