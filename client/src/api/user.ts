import request from './request'
import type { User } from '@/types'

export const userApi = {
  login: (phone: string, code: string) => {
    return request.post<any>('/auth/login', { phone, code })
  },
  
  getUserInfo: () => {
    return request.get<any>('/user/info')
  },
  
  updateUserInfo: (data: Partial<User>) => {
    return request.put<any>('/user/info', data)
  }
}
