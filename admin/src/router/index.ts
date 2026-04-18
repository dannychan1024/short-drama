import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('../components/Layout.vue'),
    redirect: '/drama',
    children: [
      {
        path: '/drama',
        name: 'DramaManage',
        component: () => import('../views/DramaManage.vue'),
        meta: { title: '短剧管理' }
      },
      {
        path: '/episode',
        name: 'EpisodeManage',
        component: () => import('../views/EpisodeManage.vue'),
        meta: { title: '剧集管理' }
      },
      {
        path: '/order',
        name: 'OrderManage',
        component: () => import('../views/OrderManage.vue'),
        meta: { title: '订单管理' }
      },
      {
        path: '/user',
        name: 'UserManage',
        component: () => import('../views/UserManage.vue'),
        meta: { title: '用户管理' }
      },
      {
        path: '/signin',
        name: 'SignInManage',
        component: () => import('../views/SignInManage.vue'),
        meta: { title: '签到管理' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('admin_token')
  
  if (to.meta.requiresAuth !== false && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/')
  } else {
    next()
  }
})

export default router