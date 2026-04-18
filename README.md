# 短剧点播平台 H5

一个基于 Vue 3 + Express + SQLite 的短剧点播平台。

## 技术栈

### 前端
- Vue 3 + Composition API
- Vite
- TypeScript
- UnoCSS
- Pinia (状态管理)
- Vue Router
- DPlayer (视频播放)
- Axios

### 后端
- Node.js + Express
- SQLite (better-sqlite3)
- JWT (用户认证)

## 项目结构

```
short-drama-h5/
├── client/                 # 用户端 H5 前端
│   ├── src/
│   │   ├── api/           # API 请求
│   │   ├── assets/        # 静态资源
│   │   ├── components/    # 公共组件
│   │   ├── router/        # 路由配置
│   │   ├── stores/        # 状态管理
│   │   ├── types/         # TypeScript 类型
│   │   ├── utils/         # 工具函数
│   │   ├── views/         # 页面
│   │   ├── App.vue
│   │   └── main.ts
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── uno.config.ts
│   └── vite.config.ts
│
├── server/                 # 后端 API
│   ├── src/
│   │   ├── models/        # 数据模型
│   │   ├── routes/        # 路由
│   │   ├── middleware/    # 中间件
│   │   └── index.ts       # 入口文件
│   ├── package.json
│   └── tsconfig.json
│
├── data/                   # SQLite 数据目录
├── package.json            # 根目录 workspace
└── README.md
```

## 快速开始

### 安装依赖

```bash
# 安装根目录依赖
npm install

# 安装 client 依赖
cd client && npm install

# 安装 server 依赖
cd ../server && npm install
```

### 启动开发服务器

```bash
# 从根目录启动全部服务
npm run dev

# 或者分别启动
npm run dev:client  # 启动前端 (端口 3000)
npm run dev:server   # 启动后端 (端口 3001)
```

### 构建生产版本

```bash
npm run build
```

## API 接口

### 认证
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/send-code` - 发送验证码

### 短剧
- `GET /api/dramas` - 获取短剧列表
- `GET /api/dramas/:id` - 获取短剧详情
- `GET /api/dramas/:id/episodes` - 获取剧集列表

### 用户
- `GET /api/user/info` - 获取用户信息
- `PUT /api/user/info` - 更新用户信息

### 钱包
- `GET /api/wallet/balance` - 获取余额
- `POST /api/wallet/recharge` - 充值

### 订单
- `GET /api/orders` - 获取订单列表
- `POST /api/orders` - 创建订单
- `POST /api/orders/:id/pay` - 支付订单
- `GET /api/orders/:id` - 获取订单详情

## 测试账号

- 手机号: `13800138000`
- 初始余额: ¥100
