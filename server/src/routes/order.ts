import { Router, Response } from 'express'
import db from '../models/database.js'
import { authMiddleware, AuthRequest } from '../middleware/auth.js'

const router = Router()

// Get user orders
router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { status, page = 1, pageSize = 10 } = req.query
    const offset = (Number(page) - 1) * Number(pageSize)
    
    let sql = 'SELECT * FROM orders WHERE user_id = ?'
    let countSql = 'SELECT COUNT(*) as total FROM orders WHERE user_id = ?'
    const params: any[] = [req.userId]
    const countParams: any[] = [req.userId]
    
    if (status) {
      sql += ' AND status = ?'
      countSql += ' AND status = ?'
      params.push(status)
      countParams.push(status)
    }
    
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    
    const orders = db.prepare(sql).all(...params, Number(pageSize), offset)
    const { total } = db.prepare(countSql).get(...countParams) as { total: number }
    
    res.json({
      code: 0,
      message: 'success',
      data: {
        list: orders.map((order: any) => ({
          id: order.id,
          userId: order.user_id,
          dramaId: order.drama_id,
          amount: order.amount,
          status: order.status,
          createdAt: order.created_at,
          paidAt: order.paid_at
        })),
        total
      }
    })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null })
  }
})

// Create order
router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { dramaId } = req.body
    
    const drama = db.prepare('SELECT * FROM dramas WHERE id = ?').get(dramaId)
    if (!drama) {
      return res.status(404).json({ code: 404, message: '短剧不存在', data: null })
    }
    
    // Check if already purchased
    const existing = db.prepare('SELECT * FROM user_purchases WHERE user_id = ? AND drama_id = ?').get(req.userId, dramaId)
    if (existing) {
      return res.status(400).json({ code: 400, message: '您已购买过该短剧', data: null })
    }
    
    // Create pending order
    const result = db.prepare('INSERT INTO orders (user_id, drama_id, amount, status) VALUES (?, ?, ?, ?)').run(
      req.userId,
      dramaId,
      (drama as any).price,
      'pending'
    )
    
    res.json({
      code: 0,
      message: '订单创建成功',
      data: {
        id: result.lastInsertRowid,
        userId: req.userId,
        dramaId,
        amount: (drama as any).price,
        status: 'pending'
      }
    })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null })
  }
})

// Pay order
router.post('/:id/pay', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(id, req.userId) as any
    
    if (!order) {
      return res.status(404).json({ code: 404, message: '订单不存在', data: null })
    }
    
    if (order.status !== 'pending') {
      return res.status(400).json({ code: 400, message: '订单状态不允许支付', data: null })
    }
    
    if (order.drama_id !== 0) {
      // Check balance
      const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.userId) as any
      
      if (user.balance < order.amount) {
        return res.status(400).json({ code: 400, message: '余额不足，请先充值', data: null })
      }
      
      // Deduct balance
      db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(order.amount, req.userId)
      
      // Record purchase
      db.prepare('INSERT OR IGNORE INTO user_purchases (user_id, drama_id) VALUES (?, ?)').run(req.userId, order.drama_id)
    }
    
    // Update order status
    db.prepare('UPDATE orders SET status = ?, paid_at = CURRENT_TIMESTAMP WHERE id = ?').run('paid', id)
    
    res.json({
      code: 0,
      message: '支付成功',
      data: {
        id: order.id,
        status: 'paid'
      }
    })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null })
  }
})

// Get order detail
router.get('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(id, req.userId) as any
    
    if (!order) {
      return res.status(404).json({ code: 404, message: '订单不存在', data: null })
    }
    
    let drama = null
    if (order.drama_id !== 0) {
      drama = db.prepare('SELECT * FROM dramas WHERE id = ?').get(order.drama_id)
    }
    
    res.json({
      code: 0,
      message: 'success',
      data: {
        id: order.id,
        userId: order.user_id,
        dramaId: order.drama_id,
        drama,
        amount: order.amount,
        status: order.status,
        createdAt: order.created_at,
        paidAt: order.paid_at
      }
    })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null })
  }
})

export default router
