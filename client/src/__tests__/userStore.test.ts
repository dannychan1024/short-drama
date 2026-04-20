import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '@/stores/user'
import { userApi } from '@/api/user'

// Mock APIs
vi.mock('@/api/user', () => ({
  userApi: {
    login: vi.fn(),
    getUserInfo: vi.fn()
  }
}))

const mockedUserApi = vi.mocked(userApi, true)

describe('User Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('Login', () => {
    it('should login with phone and password', async () => {
      const mockUser = {
        id: 1,
        phone: '13800138000',
        nickname: '测试用户',
        balance: 100
      }
      const mockToken = 'test-token-abc123'

      mockedUserApi.login.mockResolvedValue({
        data: { user: mockUser, token: mockToken }
      } as any)

      const store = useUserStore()
      await store.login('13800138000', 'password123')

      expect(store.token).toBe(mockToken)
      expect(store.userInfo?.nickname).toBe('测试用户')
    })

    it('should store token in localStorage', async () => {
      mockedUserApi.login.mockResolvedValue({
        data: { user: { id: 1 }, token: 'token-xyz' }
      } as any)

      const store = useUserStore()
      await store.login('13800138000', 'password123')

      expect(localStorage.getItem('token')).toBe('token-xyz')
    })
  })

  describe('Logout', () => {
    it('should clear user state and localStorage', async () => {
      localStorage.setItem('token', 'some-token')
      const store = useUserStore()
      store.token = 'some-token'

      store.logout()

      expect(store.token).toBe('')
      expect(store.userInfo).toBeNull()
      expect(localStorage.getItem('token')).toBeNull()
    })
  })

  describe('Balance', () => {
    it('should include balance in userInfo', async () => {
      mockedUserApi.login.mockResolvedValue({
        data: {
          user: { id: 1, phone: '13800138000', balance: 150 },
          token: 'token'
        }
      } as any)

      const store = useUserStore()
      await store.login('13800138000', 'password')

      expect(store.userInfo?.balance).toBe(150)
    })

    it('should default balance to 0 if missing', async () => {
      mockedUserApi.login.mockResolvedValue({
        data: {
          user: { id: 1, phone: '13800138000' },
          token: 'token'
        }
      } as any)

      const store = useUserStore()
      await store.login('13800138000', 'password')

      expect(store.userInfo?.balance).toBe(0)
    })
  })
})
