import { Router, Request, Response } from 'express'
import db from '../models/database.js'
import { generateToken } from '../middleware/auth.js'

const router = Router()

// Login
router.post('/login', (req: Request, res: Response) => {
  try {
    const { phone, code } = req.body
    
    if (!phone) {
      return res.status(400).json({ code: 400, message: '手机号不能为空', data: null })
    }
    
    // Simple verification - in production, verify SMS code
    // For demo, accept any 6-digit code
    if (code && code.length !== 6) {
      return res.status(400).json({ code: 400, message: '验证码格式错误', data: null })
    }
    
    // Find or create user
    let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone)
    
    if (!user) {
      const result = db.prepare('INSERT INTO users (phone, nickname) VALUES (?, ?)').run(phone, `用户${phone.slice(-4)}`)
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid)
    }
    
    const token = generateToken((user as any).id)
    
    res.json({
      code: 0,
      message: '登录成功',
      data: {
        token,
        user: {
          id: (user as any).id,
          phone: (user as any).phone,
          nickname: (user as any).nickname,
          avatar: (user as any).avatar,
          balance: (user as any).balance,
          createdAt: (user as any).created_at
        }
      }
    })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null })
  }
})

// Send verification code (mock)
router.post('/send-code', (req: Request, res: Response) => {
  const { phone } = req.body
  
  if (!phone) {
    return res.status(400).json({ code: 400, message: '手机号不能为空', data: null })
  }
  
  // In production, integrate with SMS service
  res.json({
    code: 0,
    message: '验证码已发送',
    data: { code: '123456' } // Mock code for testing
  })
})

export default router
