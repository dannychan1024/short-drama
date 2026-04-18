import request from './request'

export interface LoginData {
  username: string
  password: string
}

export interface LoginRes {
  token: string
  admin: {
    id: number
    username: string
    nickname: string
  }
}

export const login = (data: LoginData) => {
  return request.post<any, any>('/admin/auth/login', data)
}

export const verifyToken = () => {
  return request.get<any, any>('/admin/auth/verify')
}