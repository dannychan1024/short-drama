import { Router, Response } from 'express'
import db from '../models/database.js'
import { authMiddleware, AuthRequest } from '../middleware/auth.js'

const router = Router()

// Get balance
router.get('/balance', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.userId)
    
    res.json({
      code: 0,
      message: 'success',
      data: {
        balance: (user as any).balance
      }
    })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null })
  }
})

// Recharge
router.post('/recharge', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { amount } = req.body
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ code: 400, message: '充值金额必须大于0', data: null })
    }
    
    // Create recharge order
    const result = db.prepare('INSERT INTO orders (user_id, drama_id, amount, status) VALUES (?, 0, ?, ?)').run(
      req.userId,
      amount,
      'paid'
    )
    
    // Update user balance
    db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(amount, req.userId)
    
    res.json({
      code: 0,
      message: '充值成功',
      data: {
        orderId: result.lastInsertRowid
      }
    })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null })
  }
})

export default router
