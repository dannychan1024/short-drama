# 短剧H5播放页重构实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 验证并优化 Play.vue 播放页，确保与 admvp.cn/h5 播放页功能流程完全一致

**Architecture:** 验证+优化模式。当前Play.vue已实现大部分功能，本计划聚焦于差异对比、确认、优化

**Tech Stack:** Vue 3, TypeScript, Vue Router, Pinia

---

## 背景说明

当前 `Play.vue` 已实现以下功能：
- 全屏视频播放器（autoplay, playsinline, poster）
- 毛玻璃效果覆盖层
- 顶部导航（返回按钮、标题、右侧占位）
- 集数选择器（右上角，毛玻璃样式）
- 操作栏（点赞/分享/追剧）
- 集数缩略图列表（70x95px）
- 上下集快捷入口
- 滑动手势（50px阈值）
- Toast提示
- 安全区域适配

本计划目标：**对比admvp设计规范，找出差异并优化**

---

## 文件结构

```
client/src/views/Play.vue    # 播放页主组件（验证并优化）
```

---

## 任务清单

### Task 1: 差异对比分析

**Files:**
- Review: `client/src/views/Play.vue`
- Reference: `docs/superpowers/specs/2026-04-19-admvp-playback-replication-design.md`

- [ ] **Step 1: 读取当前Play.vue完整内容**

使用Read工具读取 `/Users/mac/short-drama-h5/client/src/views/Play.vue`

- [ ] **Step 2: 对比模板结构**

检查以下元素是否存在且正确：
1. 视频容器：`div.video-container @click="toggleOverlay"`
2. video标签：ref="videoRef" :src currentVideoUrl controls autoplay playsinline :poster currentThumb
3. overlay：`div.overlay :class="{ hidden: !overlayVisible }"`
4. overlay-top：包含.back-btn、.drama-title-wrap、.top-right-placeholder
5. episode-picker：位置top:60px right:16px
6. action-bar：gap:40px，三个.action-item
7. episode-thumbs：.thumbs-scroll容器
8. quick-nav：.prev和.next按钮

- [ ] **Step 3: 对比脚本逻辑**

检查以下变量和方法是否存在：
1. 响应式变量：videoRef, episode, episodeList, overlayVisible, episodeListVisible, isLiked, likeCount, isFollowed, toastShow, toastMsg
2. 计算属性：currentId, currentVideoUrl, currentThumb, currentEpNumber, totalEps, currentIndex, prevEpisode, nextEpisode
3. 方法：toggleOverlay, toggleEpisodeList, toggleLike, share, toggleFollow, switchTo, handleTouchStart, handleTouchEnd

- [ ] **Step 4: 对比样式细节**

检查样式是否符合设计规范：
1. .back-btn: 36x36, border-radius:50%, backdrop-filter:blur(10px)
2. .action-icon: 44x44, border-radius:50%
3. .thumb-item: 70x95px, border-radius:8px
4. .quick-nav-item.next: background: rgba(255,77,79,0.8)
5. @keyframes pulse: scale 1↔1.2
6. 安全区域：env(safe-area-inset-top) 和 env(safe-area-inset-bottom)

- [ ] **Step 5: 列出差异清单**

如果发现差异，记录需要修改的具体内容

---

### Task 2: 模板结构验证与优化

**Files:**
- Modify: `client/src/views/Play.vue` (template部分，约line 1-118)

- [ ] **Step 1: 验证Thumb项内部结构**

每个 `.thumb-item` 必须包含：
```vue
<div class="thumb-item" :class="{ active: ep.id === currentId }" @click.stop="switchTo(ep)">
  <img :src="getThumb(ep)" class="thumb-img" />
  <span class="thumb-badge">第{{ ep.episodeNumber }}集</span>
  <div v-if="ep.id === currentId" class="thumb-playing"></div>
</div>
```

- [ ] **Step 2: 验证操作栏图标**

点赞SVG：`fill="currentColor"` 当选中时为红色
追剧SVG：`fill="currentColor"` 当followed时为红色

- [ ] **Step 3: 如有差异，使用Edit工具修改模板**

---

### Task 3: 脚本逻辑验证与优化

**Files:**
- Modify: `client/src/views/Play.vue` (script部分，约line 120-368)

- [ ] **Step 1: 验证share方法实现**

```typescript
const share = async () => {
  const url = window.location.href
  if (navigator.share) {
    try {
      await navigator.share({ title: dramaTitle.value, text: `《${dramaTitle.value}》第${currentEpNumber.value}集`, url })
    } catch (e) { /* 用户取消 */ }
  } else {
    navigator.clipboard.writeText(url)
    showToast('链接已复制到剪贴板')
  }
}
```

- [ ] **Step 2: 验证toggleFollow方法**

```typescript
const toggleFollow = () => {
  isFollowed.value = !isFollowed.value
  showToast(isFollowed.value ? '已加入追剧列表' : '已取消追剧')
}
```

- [ ] **Step 3: 验证滑动手势阈值**

```typescript
const handleTouchEnd = (e: TouchEvent) => {
  const deltaY = touchStartY.value - e.changedTouches[0].clientY
  if (deltaY > 50 && nextEpisode.value) { switchTo(nextEpisode.value); showSwipe('下一集 →') }
  else if (deltaY < -50 && prevEpisode.value) { switchTo(prevEpisode.value); showSwipe('← 上一集') }
}
```

- [ ] **Step 4: 如有差异，使用Edit工具修改脚本**

---

### Task 4: 样式验证与优化

**Files:**
- Modify: `client/src/views/Play.vue` (style部分，约line 370-772)

- [ ] **Step 1: 验证顶部安全区域**

```css
padding-top: calc(12px + env(safe-area-inset-top, 0));
```

- [ ] **Step 2: 验证底部安全区域**

```css
padding-bottom: calc(16px + env(safe-area-inset-bottom, 0));
```

- [ ] **Step 3: 验证thumb-playing脉冲动画**

```css
.thumb-playing {
  animation: pulse 1s infinite;
}
```

- [ ] **Step 4: 验证toast动画**

```css
@keyframes toastIn {
  from { opacity: 0; transform: translateX(-50%) translateY(20px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}
```

- [ ] **Step 5: 如有差异，使用Edit工具修改样式**

---

### Task 5: 完整功能测试

**Files:**
- Test: `client/src/views/Play.vue`

- [ ] **Step 1: 启动开发服务器**

```bash
cd /Users/mac/short-drama-h5/client && npm run dev
```

- [ ] **Step 2: 访问播放页**

URL: `http://localhost:5173/play/1?drama_id=1`

- [ ] **Step 3: 测试视频播放**

- [ ] 视频是否自动播放
- [ ] 封面图（poster）是否显示
- [ ] controls控制条是否可用

- [ ] **Step 4: 测试覆盖层交互**

- [ ] 点击视频区域，覆盖层是否切换显示/隐藏

- [ ] **Step 5: 测试返回按钮**

- [ ] 点击返回按钮，页面是否返回上一页

- [ ] **Step 6: 测试集数选择器**

- [ ] 点击集数选择器，列表是否展开/收起
- [ ] 选集箭头是否旋转90度

- [ ] **Step 7: 测试点赞功能**

- [ ] 点击点赞按钮，图标是否变红
- [ ] 点赞数是否+1
- [ ] Toast是否显示"谢谢点赞 ❤️"
- [ ] 再次点击，图标是否恢复白色，点赞数-1

- [ ] **Step 8: 测试分享功能**

- [ ] 点击分享按钮（设备支持share），系统分享框是否弹出
- [ ] 点击分享按钮（设备不支持share），链接是否复制并显示Toast

- [ ] **Step 9: 测试追剧功能**

- [ ] 点击追剧按钮，图标是否变红
- [ ] 文字是否变为"已追剧"
- [ ] Toast是否显示"已加入追剧列表"
- [ ] 再次点击，是否恢复原状

- [ ] **Step 10: 测试缩略图列表**

- [ ] 缩略图列表是否横向滚动
- [ ] 点击缩略图，是否切换到对应集数
- [ ] 当前集是否有白色边框和高亮

- [ ] **Step 11: 测试上下集按钮**

- [ ] 上一集按钮是否可用（第一集时应禁用或隐藏）
- [ ] 下一集按钮是否有红色背景
- [ ] 点击是否切换集数

- [ ] **Step 12: 测试滑动手势**

- [ ] 在视频区域上滑（deltaY > 50px），是否切换下一集
- [ ] 在视频区域下滑（deltaY < -50px），是否切换上一集
- [ ] SwipeHint提示是否正确显示

- [ ] **Step 13: 测试自动续播**

- [ ] 等待视频播放结束，是否自动切换下一集

- [ ] **Step 14: 测试Toast提示**

- [ ] Toast是否在底部150px居中显示
- [ ] Toast是否有圆角24px和毛玻璃效果
- [ ] Toast是否在2秒后自动消失

---

### Task 6: 提交代码

- [ ] **Step 1: Git状态检查**

```bash
git status
git diff client/src/views/Play.vue
```

- [ ] **Step 2: 如有更改，提交**

```bash
git add client/src/views/Play.vue
git commit -m "refactor(Play.vue): verify and optimize admvp playback page replication

- Verify template structure matches design spec
- Verify script logic (share/follow/swipe)
- Verify CSS styles (safe area, animations)
- Complete full functional testing

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

- [ ] **Step 3: 如无更改（当前实现已完整）**

```bash
git add docs/superpowers/plans/2026-04-19-admvp-playback-replication.md
git commit -m "docs: update plan with verification-focused approach

Note: Current Play.vue implementation already matches design spec.
This plan focuses on verification and minor optimization.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```
