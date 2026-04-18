import { Router, Response } from 'express'
import db from '../models/database.js'
import { authMiddleware, AuthRequest } from '../middleware/auth.js'

const router = Router()

router.use(authMiddleware)

// Get sign-in records
router.get('/records', (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, pageSize = 20, startDate, endDate } = req.query
    const offset = (Number(page) - 1) * Number(pageSize)
    
    let sql = `
      SELECT sr.*, u.phone as userPhone, u.nickname as userNickname
      FROM signin_records sr
      LEFT JOIN users u ON sr.user_id = u.id
      WHERE 1=1
    `
    let countSql = 'SELECT COUNT(*) as total FROM signin_records sr WHERE 1=1'
    const params: any[] = []
    
    if (startDate) {
      sql += ' AND sr.signin_date >= ?'
      countSql += ' AND sr.signin_date >= ?'
      params.push(startDate)
    }
    
    if (endDate) {
      sql += ' AND sr.signin_date <= ?'
      countSql += ' AND sr.signin_date <= ?'
      params.push(endDate)
    }
    
    sql += ' ORDER BY sr.signin_date DESC LIMIT ? OFFSET ?'
    
    const records = db.prepare(sql).all(...params, Number(pageSize), offset)
    const { total } = db.prepare(countSql).get(...params) as { total: number }
    
    res.json({
      code: 0,
      message: 'success',
      data: {
        list: records,
        total
      }
    })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null })
  }
})

// Get sign-in statistics
router.get('/stats', (req: AuthRequest, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    // Today's sign-in count
    const todayCount = db.prepare('SELECT COUNT(*) as count FROM signin_records WHERE signin_date = ?').get(today) as { count: number }
    
    // Total continuous sign-in users (signed in both today and yesterday)
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    const continuousCount = db.prepare(`
      SELECT COUNT(DISTINCT sr1.user_id) as count
      FROM signin_records sr1
      INNER JOIN signin_records sr2 ON sr1.user_id = sr2.user_id
      WHERE sr1.signin_date = ? AND sr2.signin_date = ?
    `).get(today, yesterday) as { count: number }
    
    // Get sign-in rule
    let rule = db.prepare('SELECT * FROM signin_rules LIMIT 1').get()
    if (!rule) {
      // Create default rule
      db.prepare('INSERT INTO signin_rules (daily_reward, continuous_day_bonus) VALUES (?, ?)').run(10, 5)
      rule = db.prepare('SELECT * FROM signin_rules LIMIT 1').get()
    }
    
    res.json({
      code: 0,
      message: 'success',
      data: {
        todaySigninCount: todayCount.count,
        continuousSigninCount: continuousCount.count,
        rule: rule as any
      }
    })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null })
  }
})

// Update sign-in rule
router.put('/rule', (req: AuthRequest, res: Response) => {
  try {
    const { dailyReward, continuousDayBonus, bonusPerDays } = req.body
    
    let rule = db.prepare('SELECT * FROM signin_rules LIMIT 1').get()
    
    if (!rule) {
      db.prepare('INSERT INTO signin_rules (daily_reward, continuous_day_bonus, bonus_per_days) VALUES (?, ?, ?)').run(
        dailyReward || 10,
        continuousDayBonus || 5,
        bonusPerDays || JSON.stringify([])
      )
    } else {
      const updates: string[] = []
      const values: any[] = []
      
      if (dailyReward !== undefined) { updates.push('daily_reward = ?'); values.push(dailyReward) }
      if (continuousDayBonus !== undefined) { updates.push('continuous_day_bonus = ?'); values.push(continuousDayBonus) }
      if (bonusPerDays !== undefined) { updates.push('bonus_per_days = ?'); values.push(JSON.stringify(bonusPerDays)) }
      
      if (updates.length > 0) {
        values.push((rule as any).id)
        db.prepare(`UPDATE signin_rules SET ${updates.join(', ')} WHERE id = ?`).run(...values)
      }
    }
    
    res.json({
      code: 0,
      message: '更新成功',
      data: null
    })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null })
  }
})

export default router