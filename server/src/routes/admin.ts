import { Router, Response } from 'express'
import db from '../models/database.js'
import { authMiddleware, AuthRequest } from '../middleware/auth.js'
import bcrypt from 'bcryptjs'

const router = Router()

// Admin login
router.post('/login', (req: AuthRequest, res: Response) => {
  try {
    const { username, password } = req.body
    
    if (!username || !password) {
      return res.status(400).json({ code: 400, message: '用户名和密码不能为空', data: null })
    }
    
    // Check admin credentials (seed admin user if not exists)
    let admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username)
    
    if (!admin) {
      // Create default admin
      const hashedPassword = bcrypt.hashSync('admin123', 10)
      const result = db.prepare('INSERT INTO admins (username, password, nickname) VALUES (?, ?, ?)').run(
        username,
        hashedPassword,
        '管理员'
      )
      admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(result.lastInsertRowid)
    } else {
      // Verify password
      const valid = bcrypt.compareSync(password, (admin as any).password)
      if (!valid) {
        return res.status(401).json({ code: 401, message: '密码错误', data: null })
      }
    }
    
    const token = require('jsonwebtoken').sign(
      { adminId: (admin as any).id, type: 'admin' },
      process.env.JWT_SECRET || 'short-drama-secret-key',
      { expiresIn: '7d' }
    )
    
    res.json({
      code: 0,
      message: '登录成功',
      data: {
        token,
        admin: {
          id: (admin as any).id,
          username: (admin as any).username,
          nickname: (admin as any).nickname
        }
      }
    })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null })
  }
})

// Verify token
router.get('/verify', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const admin = db.prepare('SELECT id, username, nickname FROM admins WHERE id = ?').get(req.adminId)
    
    if (!admin) {
      return res.status(404).json({ code: 404, message: '管理员不存在', data: null })
    }
    
    res.json({
      code: 0,
      message: 'success',
      data: admin
    })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null })
  }
})

export default router