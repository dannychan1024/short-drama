import request from './request'

export interface Drama {
  id: number
  title: string
  cover: string
  description: string
  category: string
  price: number
  total_episodes: number
  status: number
  created_at: string
}

export interface DramaListRes {
  list: Drama[]
  total: number
}

export interface DramaQuery {
  category?: string
  keyword?: string
  page?: number
  pageSize?: number
  status?: number
}

export const getDramaList = (params: DramaQuery) => {
  return request.get<any, any>('/admin/drama', { params })
}

export const createDrama = (data: Partial<Drama>) => {
  return request.post<any, any>('/admin/drama', data)
}

export const updateDrama = (id: number, data: Partial<Drama>) => {
  return request.put<any, any>(`/admin/drama/${id}`, data)
}

export const deleteDrama = (id: number) => {
  return request.delete<any, any>(`/admin/drama/${id}`)
}