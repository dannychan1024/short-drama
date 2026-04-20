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

    // Get all episodes in one query (fix N+1 problem)
    const dramaIds = dramas.map((d: any) => d.id)
    let episodes: any[] = []
    if (dramaIds.length > 0) {
      const placeholders = dramaIds.map(() => '?').join(',')
      episodes = db.prepare(`SELECT * FROM episodes WHERE drama_id IN (${placeholders}) ORDER BY drama_id, episode_number`).all(...dramaIds)
    }

    // Group episodes by drama_id
    const episodesByDrama = episodes.reduce((acc: any, ep: any) => {
      if (!acc[ep.drama_id]) acc[ep.drama_id] = []
      acc[ep.drama_id].push(ep)
      return acc
    }, {})

    const dramasWithEpisodes = dramas.map((drama: any) => ({
      ...drama,
      episodes: episodesByDrama[drama.id] || []
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

    // 从 header 提取 userId（可选，不强制登录）
    let userId: number | null = null
    const authHeader = req.headers.authorization
    if (authHeader) {
      try {
        const jwt = require('jsonwebtoken')
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'short-drama-secret-key') as any
        userId = decoded.userId || null
      } catch (e) {
        // token 无效，忽略
      }
    }

    const drama = db.prepare('SELECT * FROM dramas WHERE id = ?').get(id)

    if (!drama) {
      return res.status(404).json({ code: 404, message: '短剧不存在', data: null })
    }

    const episodes = db.prepare('SELECT * FROM episodes WHERE drama_id = ? ORDER BY episode_number').all(id)

    // 检查用户是否已购买
    let isPurchased = false
    if (userId) {
      const purchase = db.prepare('SELECT * FROM user_purchases WHERE user_id = ? AND drama_id = ?').get(userId, id)
      isPurchased = !!purchase
    }

    // 如果已购买或免费，返回真实 video_url；否则付费集返回 locked
    const episodesWithLock = episodes.map((ep: any) => ({
      ...ep,
      video_url: ep.is_free === 1 || isPurchased ? ep.video_url : 'locked'
    }))

    res.json({
      code: 0,
      message: 'success',
      data: {
        ...drama,
        episodes: episodesWithLock,
        isPurchased
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

    // 从 header 提取 userId（可选，不强制登录）
    let userId: number | null = null
    const authHeader = req.headers.authorization
    if (authHeader) {
      try {
        const jwt = require('jsonwebtoken')
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'short-drama-secret-key') as any
        userId = decoded.userId || null
      } catch (e) {
        // token 无效，忽略
      }
    }

    // 检查用户是否已购买
    let isPurchased = false
    if (userId) {
      const purchase = db.prepare('SELECT * FROM user_purchases WHERE user_id = ? AND drama_id = ?').get(userId, id)
      isPurchased = !!purchase
    }

    const episodes = db.prepare('SELECT * FROM episodes WHERE drama_id = ? ORDER BY episode_number').all(id)

    // 如果已购买或免费，返回真实 video_url；否则付费集返回 locked
    const episodesWithLock = episodes.map((ep: any) => ({
      ...ep,
      video_url: ep.is_free === 1 || isPurchased ? ep.video_url : 'locked'
    }))

    res.json({
      code: 0,
      message: 'success',
      data: episodesWithLock
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
