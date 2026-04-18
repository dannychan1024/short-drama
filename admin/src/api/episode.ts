import request from './request'

export interface Episode {
  id: number
  dramaId: number
  title: string
  videoUrl: string
  duration: number
  episodeNumber: number
  isFree: number
  price: number
}

export interface EpisodeQuery {
  dramaId: number
  page?: number
  pageSize?: number
}

export interface EpisodeListRes {
  list: Episode[]
  total: number
}

export const getEpisodeList = (params: EpisodeQuery) => {
  return request.get<any, any>('/admin/drama/episodes', { params })
}

export const createEpisode = (data: Partial<Episode> & { dramaId: number }) => {
  return request.post<any, any>('/admin/drama/episode', {
    dramaId: data.dramaId,
    title: data.title,
    videoUrl: data.videoUrl,
    duration: data.duration,
    episodeNumber: data.episodeNumber,
    isFree: data.isFree ? true : false,
    price: data.price
  })
}

export const updateEpisode = (id: number, data: Partial<Episode>) => {
  return request.put<any, any>(`/admin/drama/episode/${id}`, {
    title: data.title,
    videoUrl: data.videoUrl,
    duration: data.duration,
    episodeNumber: data.episodeNumber,
    isFree: data.isFree ? true : false,
    price: data.price
  })
}

export const deleteEpisode = (id: number) => {
  return request.delete<any, any>(`/admin/drama/episode/${id}`)
}

export const batchCreateEpisodes = (dramaId: number, episodes: any[]) => {
  return request.post<any, any>('/admin/drama/episodes/batch', { dramaId, episodes })
}