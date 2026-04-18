import request from './request'
import type { ApiResponse } from '@/types'

export const walletApi = {
  getBalance: () => {
    return request.get<ApiResponse<{ balance: number }>>('/wallet/balance')
  },
  
  recharge: (amount: number) => {
    return request.post<ApiResponse<{ orderId: number }>>('/wallet/recharge', { amount })
  }
}
