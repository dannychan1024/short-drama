import request from './request'

export const dramaApi = {
  getList: (params?: { category?: string; page?: number; pageSize?: number }) => {
    return request.get<any>('/dramas', { params })
  },
  
  getDetail: (id: number) => {
    return request.get<any>(`/dramas/${id}`)
  },
  
  getEpisodes: (dramaId: number) => {
    return request.get<any>(`/dramas/${dramaId}/episodes`)
  }
}
