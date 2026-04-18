import request from './request'

export interface User {
  id: number
  phone: string
  nickname: string
  avatar: string
  balance: number
  status: number
  createdAt: string
}

export interface UserQuery {
  keyword?: string
  page?: number
  pageSize?: number
  status?: number
}

export interface UserListRes {
  list: User[]
  total: number
}

export const getUserList = (params: UserQuery) => {
  return request.get<any, any>('/admin/user', { params })
}

export const updateUserStatus = (id: number, status: number) => {
  return request.put<any, any>(`/admin/user/${id}/status`, { status })
}

export const rechargeUser = (id: number, amount: number, type: 'add' | 'reduce' = 'add') => {
  return request.post<any, any>(`/admin/user/${id}/recharge`, { amount, type })
}