import request from './request'

export interface Order {
  id: number
  userId: number
  userPhone: string
  userNickname: string
  dramaId: number
  dramaTitle: string
  amount: number
  status: string
  createdAt: string
  paidAt: string
}

export interface OrderQuery {
  status?: string
  startDate?: string
  endDate?: string
  keyword?: string
  page?: number
  pageSize?: number
}

export interface OrderListRes {
  list: Order[]
  total: number
}

export const getOrderList = (params: OrderQuery) => {
  return request.get<any, any>('/admin/order', { params })
}

export const getOrderDetail = (id: number) => {
  return request.get<any, any>(`/admin/order/${id}`)
}