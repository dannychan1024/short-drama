import { Router, Request, Response } from 'express'
import db from '../models/database.js'
import { authMiddleware, AuthRequest } from '../middleware/auth.js'

const router = Router()

// Apply auth middleware to all admin drama routes
router.use(authMiddleware)

// Get all dramas (admin view - includes all)
router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const { category, keyword, page = 1, pageSize = 10, status } = req.query
    const offset = (Number(page) - 1) * Number(pageSize)
    
    let sql = 'SELECT * FROM dramas WHERE 1=1'
    let countSql = 'SELECT COUNT(*) as total FROM dramas WHERE 1=1'
    const params: any[] = []
    
    if (category) {
      sql += ' AND category = ?'
      countSql += ' AND category = ?'
      params.push(category)
    }
    
    if (keyword) {
      sql += ' AND (title LIKE ? OR description LIKE ?)'
      countSql += ' AND (title LIKE ? OR description LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`)
    }
    
    if (status !== undefined) {
      sql += ' AND status = ?'
      countSql += ' AND status = ?'
      params.push(status)
    }
    
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    
    const dramas = db.prepare(sql).all(...params, Number(pageSize), offset)
    const { total } = db.prepare(countSql).get(...(params.length > 0 && typeof params[params.length - 1] === 'string' ? [params[params.length - 1]] : [])) as { total: number }
    
    res.json({
      code: 0,
      message: 'success',
      data: {
        list: dramas,
        total
      }
    })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null })
  }
})

// Create drama
router.post('/', (req: AuthRequest, res: Response) => {
  try {
    const { title, cover, description, category, price, totalEpisodes, status = 1 } = req.body
    
    if (!title) {
      return res.status(400).json({ code: 400, message: '标题不能为空', data: null })
    }
    
    const result = db.prepare(`
      INSERT INTO dramas (title, cover, description, category, price, total_episodes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(title, cover || '', description || '', category || 'other', price || 0, totalEpisodes || 0, status)
    
    res.json({
      code: 0,
      message: '创建成功',
      data: {
        id: result.lastInsertRowid
      }
    })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null })
  }
})

// Update drama
router.put('/:id', (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { title, cover, description, category, price, totalEpisodes, status } = req.body
    
    const drama = db.prepare('SELECT * FROM dramas WHERE id = ?').get(id)
    if (!drama) {
      return res.status(404).json({ code: 404, message: '短剧不存在', data: null })
    }
    
    const updates: string[] = []
    const values: any[] = []
    
    if (title !== undefined) { updates.push('title = ?'); values.push(title) }
    if (cover !== undefined) { updates.push('cover = ?'); values.push(cover) }
    if (description !== undefined) { updates.push('description = ?'); values.push(description) }
    if (category !== undefined) { updates.push('category = ?'); values.push(category) }
    if (price !== undefined) { updates.push('price = ?'); values.push(price) }
    if (totalEpisodes !== undefined) { updates.push('total_episodes = ?'); values.push(totalEpisodes) }
    if (status !== undefined) { updates.push('status = ?'); values.push(status) }
    
    if (updates.length > 0) {
      values.push(id)
      db.prepare(`UPDATE dramas SET ${updates.join(', ')} WHERE id = ?`).run(...values)
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

// Delete drama
router.delete('/:id', (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    
    const drama = db.prepare('SELECT * FROM dramas WHERE id = ?').get(id)
    if (!drama) {
      return res.status(404).json({ code: 404, message: '短剧不存在', data: null })
    }
    
    // Delete related episodes and orders first
    db.prepare('DELETE FROM episodes WHERE drama_id = ?').run(id)
    db.prepare('DELETE FROM orders WHERE drama_id = ?').run(id)
    db.prepare('DELETE FROM user_purchases WHERE drama_id = ?').run(id)
    db.prepare('DELETE FROM dramas WHERE id = ?').run(id)
    
    res.json({
      code: 0,
      message: '删除成功',
      data: null
    })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null })
  }
})

// Get episodes for a drama
router.get('/episodes', (req: AuthRequest, res: Response) => {
  try {
    const { dramaId, page = 1, pageSize = 20 } = req.query
    const offset = (Number(page) - 1) * Number(pageSize)
    
    if (!dramaId) {
      return res.status(400).json({ code: 400, message: 'dramaId不能为空', data: null })
    }
    
    const episodes = db.prepare('SELECT * FROM episodes WHERE drama_id = ? ORDER BY episode_number LIMIT ? OFFSET ?').all(dramaId, Number(pageSize), offset)
    const { total } = db.prepare('SELECT COUNT(*) as total FROM episodes WHERE drama_id = ?').get(dramaId) as { total: number }
    
    res.json({
      code: 0,
      message: 'success',
      data: {
        list: episodes,
        total
      }
    })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null })
  }
})

// Create episode
router.post('/episode', (req: AuthRequest, res: Response) => {
  try {
    const { dramaId, title, videoUrl, duration, episodeNumber, isFree, price = 0 } = req.body
    
    if (!dramaId || !title || !episodeNumber) {
      return res.status(400).json({ code: 400, message: '缺少必填字段', data: null })
    }
    
    const result = db.prepare(`
      INSERT INTO episodes (drama_id, title, video_url, duration, episode_number, is_free, price)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(dramaId, title, videoUrl || '', duration || 0, episodeNumber, isFree ? 1 : 0, price)
    
    // Update total episodes count
    const count = db.prepare('SELECT COUNT(*) as count FROM episodes WHERE drama_id = ?').get(dramaId) as { count: number }
    db.prepare('UPDATE dramas SET total_episodes = ? WHERE id = ?').run(count.count, dramaId)
    
    res.json({
      code: 0,
      message: '创建成功',
      data: {
        id: result.lastInsertRowid
      }
    })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null })
  }
})

// Update episode
router.put('/episode/:id', (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { title, videoUrl, duration, episodeNumber, isFree, price } = req.body
    
    const episode = db.prepare('SELECT * FROM episodes WHERE id = ?').get(id)
    if (!episode) {
      return res.status(404).json({ code: 404, message: '剧集不存在', data: null })
    }
    
    const updates: string[] = []
    const values: any[] = []
    
    if (title !== undefined) { updates.push('title = ?'); values.push(title) }
    if (videoUrl !== undefined) { updates.push('video_url = ?'); values.push(videoUrl) }
    if (duration !== undefined) { updates.push('duration = ?'); values.push(duration) }
    if (episodeNumber !== undefined) { updates.push('episode_number = ?'); values.push(episodeNumber) }
    if (isFree !== undefined) { updates.push('is_free = ?'); values.push(isFree ? 1 : 0) }
    if (price !== undefined) { updates.push('price = ?'); values.push(price) }
    
    if (updates.length > 0) {
      values.push(id)
      db.prepare(`UPDATE episodes SET ${updates.join(', ')} WHERE id = ?`).run(...values)
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

// Delete episode
router.delete('/episode/:id', (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    
    const episode = db.prepare('SELECT * FROM episodes WHERE id = ?').get(id) as any
    if (!episode) {
      return res.status(404).json({ code: 404, message: '剧集不存在', data: null })
    }
    
    db.prepare('DELETE FROM episodes WHERE id = ?').run(id)
    
    // Update total episodes count
    const count = db.prepare('SELECT COUNT(*) as count FROM episodes WHERE drama_id = ?').get(episode.drama_id) as { count: number }
    db.prepare('UPDATE dramas SET total_episodes = ? WHERE id = ?').run(count.count, episode.drama_id)
    
    res.json({
      code: 0,
      message: '删除成功',
      data: null
    })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null })
  }
})

// Batch create episodes
router.post('/episodes/batch', (req: AuthRequest, res: Response) => {
  try {
    const { dramaId, episodes } = req.body
    
    if (!dramaId || !episodes || !Array.isArray(episodes)) {
      return res.status(400).json({ code: 400, message: '参数错误', data: null })
    }
    
    const insertStmt = db.prepare(`
      INSERT INTO episodes (drama_id, title, video_url, duration, episode_number, is_free, price)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    
    const insertMany = db.transaction((items: any[]) => {
      for (const ep of items) {
        insertStmt.run(dramaId, ep.title, ep.videoUrl || '', ep.duration || 0, ep.episodeNumber, ep.isFree ? 1 : 0, ep.price || 0)
      }
    })
    
    insertMany(episodes)
    
    // Update total episodes count
    const count = db.prepare('SELECT COUNT(*) as count FROM episodes WHERE drama_id = ?').get(dramaId) as { count: number }
    db.prepare('UPDATE dramas SET total_episodes = ? WHERE id = ?').run(count.count, dramaId)
    
    res.json({
      code: 0,
      message: '批量创建成功',
      data: {
        count: episodes.length
      }
    })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null })
  }
})

export default router