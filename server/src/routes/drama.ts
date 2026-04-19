import { Router, Request, Response } from 'express'
import db from '../models/database.js'

const router = Router()

// Get drama list
router.get('/', (req: Request, res: Response) => {
  try {
    const { category, page = 1, pageSize = 10 } = req.query
    const offset = (Number(page) - 1) * Number(pageSize)
    
    let sql = 'SELECT * FROM dramas'
    let countSql = 'SELECT COUNT(*) as total FROM dramas'
    const params: any[] = []
    
    if (category) {
      sql += ' WHERE category = ?'
      countSql += ' WHERE category = ?'
      params.push(category)
    }
    
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    
    const dramas = db.prepare(sql).all(...params, Number(pageSize), offset)
    const { total } = db.prepare(countSql).get(...(category ? [category] : [])) as { total: number }
    
    // Get episodes for each drama
    const getEpisodes = db.prepare('SELECT * FROM episodes WHERE drama_id = ? ORDER BY episode_number')
    const dramasWithEpisodes = dramas.map((drama: any) => ({
      ...drama,
      episodes: getEpisodes.all(drama.id)
    }))
    
    res.json({
      code: 0,
      message: 'success',
      data: {
        list: dramasWithEpisodes,
        total
      }
    })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null })
  }
})

// Get drama detail
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    const drama = db.prepare('SELECT * FROM dramas WHERE id = ?').get(id)
    
    if (!drama) {
      return res.status(404).json({ code: 404, message: '短剧不存在', data: null })
    }
    
    const episodes = db.prepare('SELECT * FROM episodes WHERE drama_id = ? ORDER BY episode_number').all(id)
    
    res.json({
      code: 0,
      message: 'success',
      data: {
        ...drama,
        episodes
      }
    })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null })
  }
})

// Get episodes for a drama
router.get('/:id/episodes', (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    const episodes = db.prepare('SELECT * FROM episodes WHERE drama_id = ? ORDER BY episode_number').all(id)
    
    res.json({
      code: 0,
      message: 'success',
      data: episodes
    })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null })
  }
})

// Debug: update all video URLs (one-time use)
router.post('/debug/update-video-urls', (req: Request, res: Response) => {
  try {
    const { videoUrl } = req.body
    if (!videoUrl) {
      return res.status(400).json({ code: 400, message: 'videoUrl required', data: null })
    }
    const result = db.prepare('UPDATE episodes SET video_url = ?').run(videoUrl)
    res.json({ code: 0, message: 'success', data: { updated: result.changes } })
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null })
  }
})

export default router
