# 短剧付费播放功能实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现完整的短剧付费播放闭环：免费剧集直接播放，付费剧集需购买后解锁

**Architecture:** 后端 API 修改返回购买状态，前端 Play.vue 添加购买弹窗和权限判断，订单接口完成余额扣款

**Tech Stack:** Vue 3, Pinia, Express.js, SQLite

---

## 文件结构

```
client/src/views/Play.vue           # 前端播放页（核心修改）
client/src/api/drama.ts            # 前端 API 调用
client/src/api/order.ts            # 前端订单 API
client/src/stores/user.ts          # 用户状态管理
server/src/routes/drama.ts         # 后端剧集 API
server/src/routes/order.ts          # 后端订单 API
server/src/routes/user.ts          # 后端用户 API
server/src/middleware/auth.ts      # 认证中间件
```

---

## 任务清单

### Task 1: 后端 - 修改 drama API 返回购买状态

**Files:**
- Modify: `server/src/routes/drama.ts`

**修改内容：**
- `GET /api/dramas/:id` 添加 `isPurchased` 字段
- `GET /api/dramas/:id/episodes` 添加 `is_free` 字段
- 付费剧集返回 `video_url: 'locked'` 而非真实地址

**前置条件：**
- `user_purchases` 表已存在（参考 database.ts）
- auth 中间件正确导出（已验证）

**Steps:**

- [ ] **Step 1: 修改 GET /api/dramas/:id 响应**

在 `server/src/routes/drama.ts` 中找到 `get drama detail` 函数，修改为：

```typescript
// Get drama detail
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // 从 header 提取 userId（可选，不强制登录）
    let userId: number | null = null
    const authHeader = req.headers.authorization
    if (authHeader) {
      try {
        const jwt = require('jsonwebtoken')
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'short-drama-secret-key') as any
        userId = decoded.userId || null
      } catch (e) {
        // token 无效，忽略
      }
    }

    const drama = db.prepare('SELECT * FROM dramas WHERE id = ?').get(id)

    if (!drama) {
      return res.status(404).json({ code: 404, message: '短剧不存在', data: null })
    }

    const episodes = db.prepare('SELECT * FROM episodes WHERE drama_id = ? ORDER BY episode_number').all(id)

    // 检查用户是否已购买
    let isPurchased = false
    if (userId) {
      const purchase = db.prepare('SELECT * FROM user_purchases WHERE user_id = ? AND drama_id = ?').get(userId, id)
      isPurchased = !!purchase
    }

    // 如果已购买或免费，返回真实 video_url；否则付费集返回 locked
    const episodesWithLock = episodes.map((ep: any) => ({
      ...ep,
      video_url: ep.is_free === 1 || isPurchased ? ep.video_url : 'locked'
    }))

    res.json({
      code: 0,
      message: 'success',
      data: {
        ...drama,
        episodes: episodesWithLock,
        isPurchased
      }
    })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null })
  }
})
```

- [ ] **Step 2: 提交代码**

```bash
git add server/src/routes/drama.ts
git commit -m "feat: add isPurchased field and lock paid episodes"
```

---

### Task 2: 后端 - 添加用户购买记录 API

**Files:**
- Modify: `server/src/routes/user.ts`

**Steps:**

- [ ] **Step 1: 添加 GET /api/user/purchases 接口**

在 `server/src/routes/user.ts` 中添加：

```typescript
// 获取用户购买记录
router.get('/purchases', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const purchases = db.prepare(`
      SELECT up.*, d.title as dramaTitle, d.cover as dramaCover
      FROM user_purchases up
      JOIN dramas d ON up.drama_id = d.id
      WHERE up.user_id = ?
      ORDER BY up.created_at DESC
    `).all(req.userId)

    res.json({
      code: 0,
      message: 'success',
      data: purchases
    })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null })
  }
})
```

- [ ] **Step 2: 添加 GET /api/user/balance 接口（如果不存在）**

确保用户可以查询余额

- [ ] **Step 3: 提交代码**

```bash
git add server/src/routes/user.ts
git commit -m "feat: add user purchases API"
```

---

### Task 3: 前端 - 添加购买相关 API 调用

**Files:**
- Modify: `client/src/api/order.ts`（如果不存在则创建）

**Steps:**

- [ ] **Step 1: 创建 order API 文件**

创建 `client/src/api/order.ts`：

```typescript
import request from './request'

export const orderApi = {
  // 创建订单并支付
  createAndPay: (dramaId: number) => {
    return request.post('/orders', { dramaId })
  },

  // 获取订单列表
  getOrders: (params?: { page?: number; pageSize?: number }) => {
    return request.get('/orders', { params })
  }
}
```

- [ ] **Step 2: 更新 drama API 添加购买检查**

在 `client/src/api/drama.ts` 中确认 `getDetail` 返回 `isPurchased` 字段

- [ ] **Step 3: 提交代码**

```bash
git add client/src/api/order.ts
git commit -m "feat: add order API for payment"
```

---

### Task 4: 前端 - Play.vue 添加购买弹窗

**Files:**
- Modify: `client/src/views/Play.vue`
- Create: `client/src/utils/toast.ts`（如果不存在）

**Steps:**

- [ ] **Step 1: 添加购买弹窗模板**

在 Play.vue 的 template 中，video-container 后添加：

```vue
<!-- 购买确认弹窗 -->
<div v-if="showPurchaseModal" class="purchase-modal">
  <div class="modal-content">
    <h3>购买《{{ dramaTitle }}》</h3>
    <p class="episode-info">剧集：第{{ currentEpNumber }}集</p>
    <p class="price">价格：¥{{ dramaPrice }}</p>
    <p class="balance">账户余额：¥{{ userBalance }}</p>
    <p v-if="balanceInsufficient" class="error">余额不足，请先充值</p>
    <div class="modal-buttons">
      <button class="cancel-btn" @click="showPurchaseModal = false">取消</button>
      <button v-if="!balanceInsufficient" class="confirm-btn" @click="confirmPurchase" :disabled="purchasing">
        {{ purchasing ? '购买中...' : '确认购买' }}
      </button>
      <button v-else class="confirm-btn" @click="goRecharge">去充值</button>
    </div>
  </div>
</div>
```

- [ ] **Step 2: 添加相关状态和方法**

在 script 中添加：

```typescript
// 购买相关状态
const showPurchaseModal = ref(false)
const dramaPrice = ref(0)  // 从 dramaRes.data.price 获取
const userBalance = ref(0)  // 从 userStore.userInfo.balance 获取
const balanceInsufficient = ref(false)
const purchasing = ref(false)  // 防止重复购买

// 确认购买（带防重入）
const confirmPurchase = async () => {
  if (purchasing.value) return
  purchasing.value = true
  try {
    const res = await orderApi.createAndPay(dramaId.value)
    if (res.code === 0) {
      showToast('购买成功')
      showPurchaseModal.value = false
      // 直接更新当前 episode 的 video_url
      episode.value = episodeList.value.find(ep => ep.id === episode.value.id)
    } else {
      showToast(res.message || '购买失败')
      if (res.message?.includes('余额')) {
        balanceInsufficient.value = true
      }
    }
  } catch (err: any) {
    showToast(err.message || '购买失败')
  } finally {
    purchasing.value = false
  }
}

// 去充值
const goRecharge = () => {
  router.push('/wallet')
}

// 检查是否需要显示购买弹窗
const checkAndShowPurchaseModal = async (ep: any, isPurchased: boolean, price: number) => {
  // 免费剧集或已购买 - 不弹窗
  if (ep.is_free === 1 || ep.is_free === true || isPurchased) {
    return false
  }

  // 需要购买 - 显示弹窗
  dramaPrice.value = price
  userBalance.value = userStore.userInfo?.balance || 0
  balanceInsufficient.value = userBalance.value < price
  showPurchaseModal.value = true
  return true
}
```

- [ ] **Step 3: 在加载流程中集成购买检查**

在 `onMounted` 中获取剧集详情后，检查当前 episode 是否需要购买：

```typescript
// 在获取剧集详情后调用
if (dramaRes.data) {
  dramaTitle.value = dramaRes.data.title || '热播短剧'
  dramaPrice.value = dramaRes.data.price || 0  // 添加这行
  dramaDescription.value = dramaRes.data.description || ''
  episodeList.value = dramaRes.data.episodes || []
  isPurchased = dramaRes.data.isPurchased || false
}

// 在设置 episode 后检查
episode.value = episodeList.value.find(ep => ep.id === episodeId) || episodeList.value[0]

// 检查是否需要购买弹窗
if (episode.value.video_url === 'locked') {
  await checkAndShowPurchaseModal(episode.value, isPurchased, dramaPrice.value)
}
```

- [ ] **Step 4: 添加弹窗样式**

```css
/* 购买弹窗 */
.purchase-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  width: 300px;
  text-align: center;
}

.modal-content h3 {
  margin: 0 0 16px;
  font-size: 18px;
  color: #333;
}

.episode-info, .price, .balance {
  margin: 8px 0;
  font-size: 14px;
  color: #666;
}

.price {
  color: #FF4D4F;
  font-size: 16px;
  font-weight: bold;
}

.error {
  color: #FF4D4F;
  font-size: 13px;
}

.modal-buttons {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.cancel-btn, .confirm-btn {
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  font-size: 15px;
  border: none;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.confirm-btn {
  background: #FF4D4F;
  color: #fff;
}

.confirm-btn:disabled {
  background: #ccc;
}
```

- [ ] **Step 5: 提交代码**

```bash
git add client/src/views/Play.vue
git commit -m "feat: add purchase modal to Play.vue"
```

---

### Task 5: 前端 - 确保余额数据可获取

**Files:**
- Modify: `client/src/stores/user.ts`（如需要）
- Reference: `client/src/api/wallet.ts`（已有 getBalance）

**Steps:**

- [ ] **Step 1: 确认余额获取方式**

余额从 `userStore.userInfo.balance` 获取（登录时已获取）

在 Play.vue 中使用时确保 userStore 已初始化：
```typescript
import { useUserStore } from '@/stores/user'
const userStore = useUserStore()

// userStore.userInfo.balance 已在登录时获取
// 无需额外 API 调用
```

- [ ] **Step 2: 提交代码**

```bash
git add client/src/stores/user.ts
git commit -m "chore: ensure balance available in user store"
```

---

### Task 6: 测试验证

**Steps:**

- [ ] **Step 1: 启动开发服务器**
```bash
cd client && npm run dev
```

- [ ] **Step 2: 测试免费剧集播放**
- 访问 http://localhost:3000/play/51?drama_id=3（第1集，免费）
- 预期：直接播放，无弹窗

- [ ] **Step 3: 测试付费剧集需购买**
- 访问 http://localhost:3000/play/53?drama_id=3（第3集，付费）
- 预期：显示购买弹窗

- [ ] **Step 4: 测试余额充足购买**
- 点击确认购买
- 预期：扣款成功，视频解锁播放

- [ ] **Step 5: 测试已购买剧集直接播放**
- 再次访问第3集
- 预期：直接播放，无弹窗

- [ ] **Step 6: 提交测试代码**

```bash
git add .
git commit -m "test: verify payment flow E2E"
```

---

### Task 7: 部署验证

**Steps:**

- [ ] **Step 1: 重新构建前端**
```bash
cd client && npm run build
```

- [ ] **Step 2: 部署到 Railway**
- 访问 railway.app
- 拖拽 dist 文件夹部署

- [ ] **Step 3: 线上验证**
- 测试免费剧集播放
- 测试付费剧集购买
- 测试余额不足提示
