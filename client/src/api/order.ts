import request from './request'

export const orderApi = {
  // 创建订单并支付
  createAndPay: (dramaId: number) => {
    return request.post('/orders', { dramaId })
  },

  // 获取订单列表
  getOrders: (params?: { page?: number; pageSize?: number }) => {
    return request.get('/orders', { params })
  }
}
