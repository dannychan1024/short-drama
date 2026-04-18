import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/Home.vue'),
    meta: { showTabBar: true }
  },
  {
    path: '/drama/:id',
    name: 'drama-detail',
    component: () => import('@/views/DramaDetail.vue')
  },
  {
    path: '/play/:id',
    name: 'play',
    component: () => import('@/views/Play.vue')
  },
  {
    path: '/wallet',
    name: 'wallet',
    component: () => import('@/views/Wallet.vue')
  },
  {
    path: '/orders',
    name: 'orders',
    component: () => import('@/views/Orders.vue')
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/Profile.vue'),
    meta: { showTabBar: true }
  },
  {
    path: '/signin',
    name: 'signin',
    component: () => import('@/views/SignIn.vue')
  },
  {
    path: '/following',
    name: 'following',
    component: () => import('@/views/Following.vue'),
    meta: { showTabBar: true }
  },
  {
    path: '/history',
    name: 'history',
    component: () => import('@/views/History.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
