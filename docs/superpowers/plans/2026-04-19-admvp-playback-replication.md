# 短剧H5播放页重构实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重构 Play.vue 播放页，使其与 admvp.cn/h5 播放页功能流程完全一致

**Architecture:** 单文件组件重构，保持 Vue 3 Composition API 风格，确保与项目现有架构兼容

**Tech Stack:** Vue 3, TypeScript, Vue Router, Pinia

---

## 文件结构

```
client/src/views/Play.vue    # 播放页主组件（唯一修改文件）
```

---

## 任务清单

### Task 1: 分析当前实现与设计规范差异

**Files:**
- Review: `client/src/views/Play.vue`
- Reference: `docs/superpowers/specs/2026-04-19-admvp-playback-replication-design.md`

- [ ] **Step 1: 对比当前Play.vue与设计规范**

对比内容：
1. 视频播放器配置（autoplay, playsinline, poster）
2. 顶部导航栏结构（返回按钮、标题、右侧占位）
3. 集数选择器样式和位置
4. 操作栏按钮（点赞/分享/追剧）样式和交互
5. 集数缩略图列表尺寸和布局
6. 上下集按钮样式
7. 滑动手势阈值
8. Toast样式和位置

- [ ] **Step 2: 列出差异清单**

---

### Task 2: 重构模板结构

**Files:**
- Modify: `client/src/views/Play.vue:1-118` (template部分)

- [ ] **Step 1: 确保视频容器结构正确**

```vue
<div class="video-container" @click="toggleOverlay">
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
    <!-- 顶部区域 -->
    <!-- 集数选择器 -->
    <!-- 底部区域 -->
  </div>
</div>
```

- [ ] **Step 2: 验证顶部导航栏结构**

- 返回按钮：36x36圆形，毛玻璃背景
- 剧名标题：居中，16px，白色，文字阴影
- 右侧占位：36x36

- [ ] **Step 3: 验证集数选择器结构**

- 位置：绝对定位右上角
- 样式：毛玻璃，圆角20px
- 格式："第X集（共Y集）选集 ›"

- [ ] **Step 4: 验证操作栏结构**

三个按钮（点赞/分享/追剧），间距40px，居中

- [ ] **Step 5: 验证集数缩略图列表**

- 横向flex布局，滚动
- 单项70x95px，圆角8px
- 当前集白色边框

- [ ] **Step 6: 验证上下集快捷入口**

- 上一集：左对齐，毛玻璃
- 下一集：右对齐，红色背景

- [ ] **Step 7: 验证Toast和SwipeHint结构**

---

### Task 3: 重构脚本逻辑

**Files:**
- Modify: `client/src/views/Play.vue:120-367` (script部分)

- [ ] **Step 1: 验证响应式变量声明**

确认以下变量存在且类型正确：
- videoRef, episode, episodeList
- overlayVisible, episodeListVisible
- showSwipeHint, swipeHint, toastShow, toastMsg
- isLiked, likeCount, isFollowed
- currentTime, duration
- dramaTitle, dramaId

- [ ] **Step 2: 验证计算属性**

```typescript
const currentId = computed(() => episode.value?.id)
const currentVideoUrl = computed(() => episode.value?.videoUrl || '')
const currentThumb = computed(() => episode.value?.thumbUrl || getThumb(episode.value))
const currentEpNumber = computed(() => episode.value?.episodeNumber || 1)
const totalEps = computed(() => episodeList.value.length)
const currentIndex = computed(() => episodeList.value.findIndex(ep => ep.id === episode.value?.id))
const prevEpisode = computed(() => currentIndex.value > 0 ? episodeList.value[currentIndex.value - 1] : null)
const nextEpisode = computed(() => currentIndex.value < episodeList.value.length - 1 ? episodeList.value[currentIndex.value + 1] : null)
```

- [ ] **Step 3: 验证关键方法**

- toggleOverlay(): 切换覆盖层显示
- toggleEpisodeList(): 切换集数列表
- toggleLike(): 点赞切换
- share(): 分享功能
- toggleFollow(): 追剧切换
- switchTo(ep): 切换集数
- handleTouchStart/End: 滑动手势

- [ ] **Step 4: 验证onMounted数据加载逻辑**

- 从路由获取episodeId和drama_id
- 调用API获取剧集数据
- 失败时使用Mock数据

- [ ] **Step 5: 验证视频事件监听**

- timeupdate: 更新进度
- loadedmetadata: 设置时长
- ended: 自动播放下一集

---

### Task 4: 重构样式

**Files:**
- Modify: `client/src/views/Play.vue:370-772` (style部分)

- [ ] **Step 1: 验证基础布局样式**

```css
.play-page {
  background: #000;
  min-height: 100vh;
}
.video-container {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  z-index: 1;
  background: #000;
}
```

- [ ] **Step 2: 验证overlay样式**

```css
.overlay {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  z-index: 10;
  transition: opacity 0.3s ease;
}
.overlay.hidden {
  opacity: 0;
  pointer-events: none;
}
```

- [ ] **Step 3: 验证顶部导航样式**

```css
.overlay-top {
  position: absolute;
  top: 0; left: 0; right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  padding-top: calc(12px + env(safe-area-inset-top, 0));
  background: linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%);
}
.back-btn {
  width: 36px; height: 36px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  backdrop-filter: blur(10px);
}
```

- [ ] **Step 4: 验证集数选择器样式**

```css
.episode-picker {
  position: absolute;
  top: 60px; right: 16px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 8px 14px;
}
```

- [ ] **Step 5: 验证操作栏样式**

```css
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
}
.action-icon {
  width: 44px; height: 44px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 50%;
}
```

- [ ] **Step 6: 验证缩略图列表样式**

```css
.thumbs-scroll {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  scrollbar-width: none;
}
.thumb-item {
  flex-shrink: 0;
  width: 70px; height: 95px;
  border-radius: 8px;
  border: 2px solid transparent;
  opacity: 0.7;
}
.thumb-item.active {
  border-color: #fff;
  opacity: 1;
}
```

- [ ] **Step 7: 验证上下集按钮样式**

```css
.quick-nav-item.next {
  background: rgba(255, 77, 79, 0.8);
}
```

- [ ] **Step 8: 验证动画效果**

```css
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.2); }
}
@keyframes fadeInOut {
  0% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { opacity: 0; }
}
```

- [ ] **Step 9: 验证底部安全区域**

```css
padding-bottom: calc(16px + env(safe-area-inset-bottom, 0));
```

---

### Task 5: 验证与测试

**Files:**
- Test: `client/src/views/Play.vue`

- [ ] **Step 1: 启动开发服务器**

```bash
cd client && npm run dev
```

- [ ] **Step 2: 访问播放页**

URL: `http://localhost:5173/play/1?drama_id=1`

- [ ] **Step 3: 测试视频播放**

- [ ] 视频是否自动播放
- [ ] 封面是否显示
- [ ] controls是否显示

- [ ] **Step 4: 测试交互功能**

- [ ] 点击视频切换覆盖层
- [ ] 返回按钮是否正常
- [ ] 集数选择器是否可展开/收起
- [ ] 点赞按钮是否工作
- [ ] 分享按钮是否工作
- [ ] 追剧按钮是否工作
- [ ] 点击缩略图是否切换集数
- [ ] 上下集按钮是否工作

- [ ] **Step 5: 测试滑动手势**

- [ ] 上滑是否切换下一集
- [ ] 下滑是否切换上一集
- [ ] SwipeHint是否正常显示

- [ ] **Step 6: 测试自动续播**

- [ ] 视频结束后是否自动播放下一集

---

### Task 6: 提交代码

- [ ] **Step 1: Git状态检查**

```bash
git status
```

- [ ] **Step 2: 提交更改**

```bash
git add client/src/views/Play.vue
git commit -m "refactor(Play.vue): replicate admvp playback page design

- Refactor video player with full overlay controls
- Add episode picker with thumbnail list
- Implement like/share/follow actions
- Add swipe gesture for episode switching
- Add auto-play-next episode on video end
- Style with frosted glass effect

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```
