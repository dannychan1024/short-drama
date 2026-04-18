import request from './request'

export const orderApi = {
  getOrders: (params?: { status?: string; page?: number; pageSize?: number }) => {
    return request.get<any>('/orders', { params })
  },
  
  createOrder: (dramaId: number) => {
    return request.post<any>('/orders', { dramaId })
  },
  
  payOrder: (orderId: number) => {
    return request.post<any>(`/orders/${orderId}/pay`)
  },
  
  getOrderDetail: (orderId: number) => {
    return request.get<any>(`/orders/${orderId}`)
  }
}
