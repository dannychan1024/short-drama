import request from './request'

export interface SigninRecord {
  id: number
  user_id: number
  userPhone: string
  userNickname: string
  signin_date: string
  reward_amount: number
  continuous_days: number
  created_at: string
}

export interface SigninRule {
  id: number
  daily_reward: number
  continuous_day_bonus: number
  bonus_per_days: string
}

export interface SigninStats {
  todaySigninCount: number
  continuousSigninCount: number
  rule: SigninRule
}

export interface SigninQuery {
  page?: number
  pageSize?: number
  startDate?: string
  endDate?: string
}

export const getSigninRecords = (params: SigninQuery) => {
  return request.get<any, any>('/admin/signin/records', { params })
}

export const getSigninStats = () => {
  return request.get<any, any>('/admin/signin/stats')
}

export const updateSigninRule = (data: Partial<SigninRule>) => {
  return request.put<any, any>('/admin/signin/rule', data)
}