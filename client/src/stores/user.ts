import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { User } from '@/types'
import { userApi } from '@/api/user'

export const useUserStore = defineStore('user', () => {
  const userInfo = ref<User | null>(null)
  const token = ref<string>(localStorage.getItem('token') || '')

  const setToken = (newToken: string) => {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  const setUserInfo = (info: User) => {
    userInfo.value = info
  }

  const login = async (phone: string, code: string) => {
    const res: any = await userApi.login(phone, code)
    const data = res.data || {}
    setToken(data.token || '')
    setUserInfo(data.user || {})
    return res
  }

  const fetchUserInfo = async () => {
    if (!token.value) return
    try {
      const res: any = await userApi.getUserInfo()
      setUserInfo(res.data || {})
    } catch (error) {
      logout()
    }
  }

  const logout = () => {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
  }

  return {
    userInfo,
    token,
    setToken,
    setUserInfo,
    login,
    fetchUserInfo,
    logout
  }
})
