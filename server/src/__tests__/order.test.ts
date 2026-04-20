import request from 'supertest'
import express from 'express'

// Create test app
const createApp = () => {
  const app = express()
  app.use(express.json())

  // Mock database - fresh state each time
  const mockDb = {
    users: [
      { id: 1, phone: '13800138000', nickname: '测试用户', balance: 100 }
    ],
    dramas: [
      { id: 3, title: '甜蜜暴击', price: 18 }
    ],
    orders: [] as { id: number; user_id: number; drama_id: number; amount: number; status: string }[],
    userPurchases: [] as { user_id: number; drama_id: number }[]
  }

  // Create order endpoint
  app.post('/api/orders', (req, res) => {
    const { dramaId } = req.body
    const userId = 1 // Simulated auth

    const drama = mockDb.dramas.find(d => d.id === dramaId)
    if (!drama) {
      return res.status(404).json({ code: 404, message: '短剧不存在', data: null })
    }

    // Check already purchased
    const existing = mockDb.userPurchases.find(p => p.user_id === userId && p.drama_id === dramaId)
    if (existing) {
      return res.status(400).json({ code: 400, message: '您已购买过该短剧', data: null })
    }

    const orderId = mockDb.orders.length + 1
    mockDb.orders.push({
      id: orderId,
      user_id: userId,
      drama_id: dramaId,
      amount: drama.price,
      status: 'pending'
    })

    res.json({
      code: 0,
      message: '订单创建成功',
      data: { id: orderId, userId, dramaId, amount: drama.price, status: 'pending' }
    })
  })

  // Pay order endpoint
  app.post('/api/orders/:id/pay', (req, res) => {
    const { id } = req.params
    const userId = 1 // Simulated auth

    const order = mockDb.orders.find(o => o.id === Number(id) && o.user_id === userId)
    if (!order) {
      return res.status(404).json({ code: 404, message: '订单不存在', data: null })
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ code: 400, message: '订单状态不允许支付', data: null })
    }

    const user = mockDb.users.find(u => u.id === userId)
    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在', data: null })
    }

    if (user.balance < order.amount) {
      return res.status(400).json({ code: 400, message: '余额不足，请先充值', data: null })
    }

    // Deduct balance
    user.balance -= order.amount

    // Record purchase
    mockDb.userPurchases.push({ user_id: userId, drama_id: order.drama_id })

    // Update order status
    order.status = 'paid'

    res.json({
      code: 0,
      message: '支付成功',
      data: { id: order.id, status: 'paid' }
    })
  })

  // Get user balance
  app.get('/api/wallet/balance', (req, res) => {
    const user = mockDb.users.find(u => u.id === 1)
    res.json({ code: 0, message: 'success', data: { balance: user?.balance || 0 } })
  })

  return { app, mockDb }
}

describe('Order API - Payment Flow Integration', () => {
  describe('POST /api/orders', () => {
    it('should create order with pending status', async () => {
      const { app } = createApp()

      const res = await request(app)
        .post('/api/orders')
        .send({ dramaId: 3 })

      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)
      expect(res.body.data.status).toBe('pending')
      expect(res.body.data.amount).toBe(18)
    })

    it('should reject duplicate purchase', async () => {
      const { app, mockDb } = createApp()

      // First purchase - creates order
      await request(app).post('/api/orders').send({ dramaId: 3 })

      // Pay for it first
      mockDb.orders[0].status = 'paid'
      mockDb.userPurchases.push({ user_id: 1, drama_id: 3 })

      // Second purchase should fail
      const res = await request(app)
        .post('/api/orders')
        .send({ dramaId: 3 })

      expect(res.status).toBe(400)
      expect(res.body.code).toBe(400)
      expect(res.body.message).toBe('您已购买过该短剧')
    })

    it('should return 404 for non-existent drama', async () => {
      const { app } = createApp()

      const res = await request(app)
        .post('/api/orders')
        .send({ dramaId: 999 })

      expect(res.status).toBe(404)
      expect(res.body.message).toBe('短剧不存在')
    })
  })

  describe('POST /api/orders/:id/pay', () => {
    it('should pay order and deduct balance', async () => {
      const { app, mockDb } = createApp()

      // Create order
      const createRes = await request(app)
        .post('/api/orders')
        .send({ dramaId: 3 })

      const orderId = createRes.body.data.id

      // Verify initial balance
      expect(mockDb.users[0].balance).toBe(100)

      // Pay order
      const payRes = await request(app)
        .post(`/api/orders/${orderId}/pay`)

      expect(payRes.status).toBe(200)
      expect(payRes.body.code).toBe(0)
      expect(payRes.body.message).toBe('支付成功')
      expect(payRes.body.data.status).toBe('paid')

      // Verify balance deducted
      expect(mockDb.users[0].balance).toBe(82) // 100 - 18
    })

    it('should reject payment when balance insufficient', async () => {
      const { app, mockDb } = createApp()

      // Set low balance
      mockDb.users[0].balance = 10

      // Create order
      const createRes = await request(app)
        .post('/api/orders')
        .send({ dramaId: 3 })

      const orderId = createRes.body.data.id

      // Try to pay
      const payRes = await request(app)
        .post(`/api/orders/${orderId}/pay`)

      expect(payRes.status).toBe(400)
      expect(payRes.body.message).toBe('余额不足，请先充值')
    })

    it('should return 404 for non-existent order', async () => {
      const { app } = createApp()

      const res = await request(app)
        .post('/api/orders/999/pay')

      expect(res.status).toBe(404)
      expect(res.body.message).toBe('订单不存在')
    })

    it('should not allow paying already paid order', async () => {
      const { app, mockDb } = createApp()

      // Create order
      const createRes = await request(app)
        .post('/api/orders')
        .send({ dramaId: 3 })

      const orderId = createRes.body.data.id

      // First pay succeeds
      await request(app).post(`/api/orders/${orderId}/pay`)

      // Second pay should fail
      const payRes = await request(app)
        .post(`/api/orders/${orderId}/pay`)

      expect(payRes.status).toBe(400)
      expect(payRes.body.message).toBe('订单状态不允许支付')
    })
  })

  describe('GET /api/wallet/balance', () => {
    it('should return user balance', async () => {
      const { app } = createApp()

      const res = await request(app).get('/api/wallet/balance')

      expect(res.status).toBe(200)
      expect(res.body.data.balance).toBe(100)
    })
  })
})
