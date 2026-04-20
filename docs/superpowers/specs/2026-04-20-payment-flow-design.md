# 短剧付费播放功能设计方案

## 1. 概述

### 背景
当前系统付费逻辑未闭环，用户可直接播放付费剧集，无法实现真正的付费购买。

### 目标
参考 admvp 实现完整的付费闭环：
- 免费剧集/前两集 → 直接播放
- 付费剧集 → 弹出购买确认 → 余额支付 → 解锁播放

---

## 2. 功能设计

### 2.1 前端播放页 (Play.vue)

**修改逻辑：**
1. 获取剧集详情时检查当前用户购买状态
2. 检查当前 episode 的 `is_free` 字段
3. 如果 `is_free=0` 且用户未购买 → 弹出购买确认弹窗
4. 购买成功后解锁播放

**新增 UI 组件：**
- 购买确认弹窗（剧名、价格、余额提示）
- 余额不足提示 + 去充值链接

**购买弹窗交互：**
```
┌─────────────────────────┐
│     购买《甜蜜暴击》      │
│                         │
│   剧集：第3集            │
│   价格：¥18              │
│   账户余额：¥100         │
│                         │
│   [取消]      [确认购买]  │
└─────────────────────────┘
```

### 2.2 后端 API

**新增接口：**

| 接口 | 方法 | 说明 |
|------|------|------|
| `GET /api/dramas/:id/can-play` | GET | 检查用户是否可以播放某剧集 |
| `POST /api/orders/preview` | POST | 预览订单（价格、余额） |
| `GET /api/user/purchases` | GET | 用户购买记录 |

**修改接口：**
- `GET /api/dramas/:id` → 返回 `isPurchased` 字段
- `GET /api/dramas/:id/episodes` → 返回 `is_free` 字段

### 2.3 数据模型

**drama 表** (已有)：
- `id`, `title`, `price`

**episodes 表** (已有)：
- `id`, `drama_id`, `is_free`

**user_purchases 表** (已有)：
- `id`, `user_id`, `drama_id`, `created_at`

---

## 3. 播放权限判断流程

```
用户点击播放
    ↓
获取 episode 信息
    ↓
is_free == 1 ?
    ├── 是 → 直接播放
    │
    └── 否 → 检查登录状态
              ↓
          未登录 → 跳转登录
              ↓
          已登录 → 检查是否已购买
                    ↓
                已购买 → 直接播放
                    ↓
                未购买 → 显示购买弹窗
                          ↓
                    用户确认购买
                          ↓
                    余额充足 → 扣款 → 解锁 → 播放
                          ↓
                    余额不足 → 提示充值
```

---

## 4. API 响应设计

### GET /api/dramas/:id
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 3,
    "title": "甜蜜暴击",
    "price": 18,
    "episodes": [
      { "id": 51, "episode_number": 1, "is_free": 1, "video_url": "..." },
      { "id": 52, "episode_number": 2, "is_free": 1, "video_url": "..." },
      { "id": 53, "episode_number": 3, "is_free": 0, "video_url": "locked" }
    ],
    "isPurchased": false
  }
}
```

### POST /api/orders (创建订单并支付)
```json
{
  "code": 0,
  "message": "购买成功",
  "data": {
    "orderId": 123,
    "dramaId": 3,
    "amount": 18,
    "status": "paid"
  }
}
```

---

## 5. 前端组件状态

| 状态 | 显示 |
|------|------|
| 免费剧集 | 正常播放 |
| 未登录 + 付费剧集 | "登录后购买" 按钮 |
| 已登录 + 未购买 + 付费剧集 | 购买弹窗 |
| 已登录 + 已购买 | 正常播放 |
| 余额不足 | "余额不足，去充值" 链接 |

---

## 6. 文件修改清单

| 文件 | 修改内容 |
|------|----------|
| `client/src/views/Play.vue` | 添加购买弹窗、权限判断逻辑 |
| `client/src/api/drama.ts` | 添加 canPlay、purchases 接口 |
| `client/src/stores/user.ts` | 添加 purchases 状态 |
| `server/src/routes/drama.ts` | 添加 isPurchased 字段 |
| `server/src/routes/order.ts` | 简化支付流程 |
| `server/src/routes/user.ts` | 添加购买记录接口 |
| `server/src/middleware/auth.ts` | 确保 auth 中间件正确导出 |

---

## 7. 测试用例

1. **免费剧集** → 直接播放
2. **未登录用户点击付费剧集** → 跳转登录页
3. **登录后未购买付费剧集** → 显示购买弹窗
4. **余额充足购买** → 扣款成功，播放解锁
5. **余额不足购买** → 提示余额不足
6. **已购买剧集再次播放** → 直接播放
