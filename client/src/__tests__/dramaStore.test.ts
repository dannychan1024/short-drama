import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDramaStore } from '@/stores/drama'
import { dramaApi } from '@/api/drama'

// Mock dramaApi
vi.mock('@/api/drama', () => ({
  dramaApi: {
    getList: vi.fn(),
    getDetail: vi.fn()
  }
}))

const mockedDramaApi = vi.mocked(dramaApi, true)

describe('Drama Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('fetchDramaList', () => {
    it('should fetch drama list and update store', async () => {
      const mockDramas = [
        { id: 1, title: '甜蜜暴击', price: 18, total_episodes: 15 },
        { id: 2, title: '暗夜追凶', price: 88, total_episodes: 25 }
      ]

      mockedDramaApi.getList.mockResolvedValue({
        data: { list: mockDramas, total: 2 }
      } as any)

      const store = useDramaStore()
      await store.fetchDramaList({ page: 1, pageSize: 10 })

      expect(store.dramaList).toEqual(mockDramas)
      expect(store.total).toBe(2)
      expect(mockedDramaApi.getList).toHaveBeenCalledWith({ page: 1, pageSize: 10 })
    })

    it('should handle empty response', async () => {
      mockedDramaApi.getList.mockResolvedValue({
        data: { list: [], total: 0 }
      } as any)

      const store = useDramaStore()
      await store.fetchDramaList({ page: 1, pageSize: 10 })

      expect(store.dramaList).toEqual([])
      expect(store.total).toBe(0)
    })
  })

  describe('fetchDramaDetail', () => {
    it('should fetch drama detail and update currentDrama', async () => {
      const mockDrama = {
        id: 3,
        title: '甜蜜暴击',
        price: 18,
        episodes: [
          { id: 51, episode_number: 1, is_free: 1, video_url: 'https://...' },
          { id: 52, episode_number: 2, is_free: 1, video_url: 'https://...' },
          { id: 53, episode_number: 3, is_free: 0, video_url: 'locked' }
        ]
      }

      mockedDramaApi.getDetail.mockResolvedValue({
        data: mockDrama
      } as any)

      const store = useDramaStore()
      await store.fetchDramaDetail(3)

      expect(store.currentDrama).toEqual(mockDrama)
      expect(mockedDramaApi.getDetail).toHaveBeenCalledWith(3)
    })

    it('should identify free vs locked episodes', async () => {
      const mockDrama = {
        id: 3,
        title: '甜蜜暴击',
        price: 18,
        episodes: [
          { id: 51, episode_number: 1, is_free: 1, video_url: 'https://free-video.mp4' },
          { id: 53, episode_number: 3, is_free: 0, video_url: 'locked' }
        ]
      }

      mockedDramaApi.getDetail.mockResolvedValue({
        data: mockDrama
      } as any)

      const store = useDramaStore()
      await store.fetchDramaDetail(3)

      const freeEpisode = store.currentDrama?.episodes.find((ep: any) => ep.is_free === 1)
      const lockedEpisode = store.currentDrama?.episodes.find((ep: any) => ep.is_free === 0)

      expect(freeEpisode?.video_url).toBe('https://free-video.mp4')
      expect(lockedEpisode?.video_url).toBe('locked')
    })
  })
})
