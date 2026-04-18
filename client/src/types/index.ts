export interface Drama {
  id: number
  title: string
  cover: string
  description: string
  category: string
  price: number
  episodes: Episode[]
  totalEpisodes: number
  createdAt: string
}

export interface Episode {
  id: number
  dramaId: number
  title: string
  videoUrl: string
  duration: number
  episodeNumber: number
  isFree: boolean
}

export interface User {
  id: number
  phone: string
  nickname: string
  avatar: string
  balance: number
  createdAt: string
}

export interface Order {
  id: number
  userId: number
  dramaId: number
  amount: number
  status: 'pending' | 'paid' | 'cancelled' | 'refunded'
  createdAt: string
  paidAt?: string
}

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}
