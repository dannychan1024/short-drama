import { Router, Response } from 'express'
import db from '../models/database.js'
import { authMiddleware, AuthRequest } from '../middleware/auth.js'

const router = Router()

// Get user info
router.get('/info', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId)
    
    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在', data: null })
    }
    
    res.json({
      code: 0,
      message: 'success',
      data: {
        id: (user as any).id,
        phone: (user as any).phone,
        nickname: (user as any).nickname,
        avatar: (user as any).avatar,
        balance: (user as any).balance,
        createdAt: (user as any).created_at
      }
    })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null })
  }
})

// Update user info
router.put('/info', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { nickname, avatar } = req.body
    const updates: string[] = []
    const values: any[] = []
    
    if (nickname !== undefined) {
      updates.push('nickname = ?')
      values.push(nickname)
    }
    
    if (avatar !== undefined) {
      updates.push('avatar = ?')
      values.push(avatar)
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ code: 400, message: '没有要更新的字段', data: null })
    }
    
    values.push(req.userId)
    
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values)
    
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId)
    
    res.json({
      code: 0,
      message: '更新成功',
      data: {
        id: (user as any).id,
        phone: (user as any).phone,
        nickname: (user as any).nickname,
        avatar: (user as any).avatar,
        balance: (user as any).balance
      }
    })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null })
  }
})

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

export default router
