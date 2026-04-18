import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Drama } from '@/types'
import { dramaApi } from '@/api/drama'

export const useDramaStore = defineStore('drama', () => {
  const dramaList = ref<Drama[]>([])
  const currentDrama = ref<Drama | null>(null)
  const total = ref(0)

  const fetchDramaList = async (params?: { category?: string; page?: number; pageSize?: number }) => {
    const res: any = await dramaApi.getList(params)
    dramaList.value = res.data?.list || []
    total.value = res.data?.total || 0
  }

  const fetchDramaDetail = async (id: number) => {
    const res: any = await dramaApi.getDetail(id)
    currentDrama.value = res.data || null
    return res.data
  }

  return {
    dramaList,
    currentDrama,
    total,
    fetchDramaList,
    fetchDramaDetail
  }
})
