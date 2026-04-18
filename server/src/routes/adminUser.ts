import { Router, Response } from 'express'
import db from '../models/database.js'
import { authMiddleware, AuthRequest } from '../middleware/auth.js'

const router = Router()

router.use(authMiddleware)

// Get all users
router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const { keyword, page = 1, pageSize = 10, status } = req.query
    const offset = (Number(page) - 1) * Number(pageSize)
    
    let sql = 'SELECT * FROM users WHERE 1=1'
    let countSql = 'SELECT COUNT(*) as total FROM users WHERE 1=1'
    const params: any[] = []
    
    if (keyword) {
      sql += ' AND (phone LIKE ? OR nickname LIKE ?)'
      countSql += ' AND (phone LIKE ? OR nickname LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`)
    }
    
    if (status !== undefined) {
      sql += ' AND status = ?'
      countSql += ' AND status = ?'
      params.push(status)
    }
    
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    
    const users = db.prepare(sql).all(...params, Number(pageSize), offset)
    const { total } = db.prepare(countSql).get(...params) as { total: number }
    
    res.json({
      code: 0,
      message: 'success',
      data: {
        list: users.map((user: any) => ({
          id: user.id,
          phone: user.phone,
          nickname: user.nickname,
          avatar: user.avatar,
          balance: user.balance,
          status: user.status,
          createdAt: user.created_at
        })),
        total
      }
    })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null })
  }
})

// Update user status (enable/disable)
router.put('/:id/status', (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { status } = req.body
    
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在', data: null })
    }
    
    db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, id)
    
    res.json({
      code: 0,
      message: '更新成功',
      data: null
    })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null })
  }
})

// Recharge user balance
router.post('/:id/recharge', (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { amount, type = 'add' } = req.body
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ code: 400, message: '充值金额必须大于0', data: null })
    }
    
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在', data: null })
    }
    
    // Update balance
    const newBalance = type === 'add' 
      ? (user as any).balance + amount 
      : Math.max(0, (user as any).balance - amount)
    
    db.prepare('UPDATE users SET balance = ? WHERE id = ?').run(newBalance, id)
    
    // Record recharge order
    db.prepare('INSERT INTO orders (user_id, drama_id, amount, status) VALUES (?, 0, ?, ?)').run(
      id,
      type === 'add' ? amount : -amount,
      'paid'
    )
    
    res.json({
      code: 0,
      message: '充值成功',
      data: {
        newBalance
      }
    })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null })
  }
})

export default router