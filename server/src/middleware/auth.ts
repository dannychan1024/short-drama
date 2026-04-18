import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'short-drama-secret-key'

export interface AuthRequest extends Request {
  userId?: number
  adminId?: number
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  
  if (!authHeader) {
    return res.status(401).json({ code: 401, message: '未登录', data: null })
  }

  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ code: 401, message: 'Token格式错误', data: null })
  }

  const token = parts[1]

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId?: number, adminId?: number, type?: string }
    
    if (decoded.type === 'admin') {
      req.adminId = decoded.adminId
    } else {
      req.userId = decoded.userId
    }
    next()
  } catch (error) {
    return res.status(401).json({ code: 401, message: 'Token已过期', data: null })
  }
}

export function generateToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
}
