import request from 'supertest'
import express from 'express'
import jwt from 'jsonwebtoken'

// Create test app
const createApp = () => {
  const app = express()
  app.use(express.json())

  // Mock database
  const mockDb = {
    dramas: [
      { id: 3, title: '甜蜜暴击', price: 18, cover: 'cover.jpg' }
    ],
    episodes: [
      { id: 51, drama_id: 3, episode_number: 1, is_free: 1, video_url: 'https://free.mp4' },
      { id: 52, drama_id: 3, episode_number: 2, is_free: 1, video_url: 'https://free2.mp4' },
      { id: 53, drama_id: 3, episode_number: 3, is_free: 0, video_url: 'https://paid.mp4' }
    ],
    userPurchases: [] as { user_id: number; drama_id: number }[]
  }

  // Drama detail endpoint
  app.get('/api/dramas/:id', (req, res) => {
    const { id } = req.params
    const drama = mockDb.dramas.find(d => d.id === Number(id))

    if (!drama) {
      return res.status(404).json({ code: 404, message: '短剧不存在', data: null })
    }

    // Check auth
    let userId: number | null = null
    const authHeader = req.headers.authorization
    if (authHeader) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], 'test-secret') as { userId?: number }
        userId = decoded.userId || null
      } catch (e) {}
    }

    // Check purchase
    const isPurchased = userId
      ? mockDb.userPurchases.some(p => p.user_id === userId && p.drama_id === Number(id))
      : false

    // Process episodes
    const episodes = mockDb.episodes
      .filter(e => e.drama_id === Number(id))
      .map(ep => ({
        ...ep,
        video_url: ep.is_free === 1 || isPurchased ? ep.video_url : 'locked'
      }))

    res.json({
      code: 0,
      message: 'success',
      data: { ...drama, episodes, isPurchased }
    })
  })

  return { app, mockDb }
}

describe('Drama API - Episode Locking Integration', () => {
  const { app, mockDb } = createApp()

  describe('GET /api/dramas/:id', () => {
    it('should return free episodes with real video URLs for non-authenticated user', async () => {
      const res = await request(app).get('/api/dramas/3')

      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)
      expect(res.body.data.episodes).toHaveLength(3)
      expect(res.body.data.episodes[0].video_url).toBe('https://free.mp4')
      expect(res.body.data.episodes[1].video_url).toBe('https://free2.mp4')
      expect(res.body.data.episodes[2].video_url).toBe('locked') // Paid, not purchased
    })

    it('should return locked for paid episodes when user has not purchased', async () => {
      const res = await request(app).get('/api/dramas/3')

      expect(res.status).toBe(200)
      expect(res.body.data.episodes[2].video_url).toBe('locked')
      expect(res.body.data.isPurchased).toBe(false)
    })

    it('should return real video URL for paid episode when user has purchased', async () => {
      // Add purchase
      mockDb.userPurchases.push({ user_id: 1, drama_id: 3 })

      // Generate valid token
      const token = jwt.sign({ userId: 1 }, 'test-secret')
      const res = await request(app)
        .get('/api/dramas/3')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.data.isPurchased).toBe(true)
      expect(res.body.data.episodes[2].video_url).toBe('https://paid.mp4')

      // Cleanup
      mockDb.userPurchases.pop()
    })

    it('should return 404 for non-existent drama', async () => {
      const res = await request(app).get('/api/dramas/999')

      expect(res.status).toBe(404)
      expect(res.body.code).toBe(404)
      expect(res.body.message).toBe('短剧不存在')
    })
  })
})
