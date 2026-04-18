import { Router, Response } from 'express'
import db from '../models/database.js'
import { authMiddleware, AuthRequest } from '../middleware/auth.js'

const router = Router()

router.use(authMiddleware)

// Get all orders (admin view)
router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const { status, startDate, endDate, page = 1, pageSize = 10, keyword } = req.query
    const offset = (Number(page) - 1) * Number(pageSize)
    
    let sql = `
      SELECT o.*, u.phone as userPhone, u.nickname as userNickname, d.title as dramaTitle
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN dramas d ON o.drama_id = d.id
      WHERE o.drama_id != 0
    `
    let countSql = `SELECT COUNT(*) as total FROM orders o WHERE o.drama_id != 0`
    const params: any[] = []
    
    if (status) {
      sql += ' AND o.status = ?'
      countSql += ' AND o.status = ?'
      params.push(status)
    }
    
    if (startDate) {
      sql += ' AND o.created_at >= ?'
      countSql += ' AND o.created_at >= ?'
      params.push(startDate)
    }
    
    if (endDate) {
      sql += ' AND o.created_at <= ?'
      countSql += ' AND o.created_at <= ?'
      params.push(endDate)
    }
    
    if (keyword) {
      sql += ' AND (u.phone LIKE ? OR d.title LIKE ?)'
      countSql += ' AND (u.phone LIKE ? OR d.title LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`)
    }
    
    sql += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?'
    
    const orders = db.prepare(sql).all(...params, Number(pageSize), offset)
    const { total } = db.prepare(countSql).get(...params) as { total: number }
    
    res.json({
      code: 0,
      message: 'success',
      data: {
        list: orders.map((order: any) => ({
          id: order.id,
          userId: order.user_id,
          userPhone: order.userPhone,
          userNickname: order.userNickname,
          dramaId: order.drama_id,
          dramaTitle: order.dramaTitle,
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

// Get order detail
router.get('/:id', (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    
    const order = db.prepare(`
      SELECT o.*, u.phone as userPhone, u.nickname as userNickname, d.title as dramaTitle
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN dramas d ON o.drama_id = d.id
      WHERE o.id = ?
    `).get(id) as any
    
    if (!order) {
      return res.status(404).json({ code: 404, message: '订单不存在', data: null })
    }
    
    res.json({
      code: 0,
      message: 'success',
      data: {
        id: order.id,
        userId: order.user_id,
        userPhone: order.userPhone,
        userNickname: order.userNickname,
        dramaId: order.drama_id,
        dramaTitle: order.dramaTitle,
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