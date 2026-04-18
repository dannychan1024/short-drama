<template>
  <div class="h-screen flex bg-gray-50">
    <!-- Sidebar -->
    <aside
      class="bg-gray-900 text-white transition-all duration-300 flex flex-col"
      :class="collapsed ? 'w-16' : 'w-56'"
    >
      <!-- Logo -->
      <div class="h-16 flex items-center justify-center border-b border-gray-700">
        <span v-if="!collapsed" class="text-lg font-bold">短剧管理系统</span>
        <el-icon v-else :size="24"><VideoCamera /></el-icon>
      </div>

      <!-- Menu -->
      <nav class="flex-1 py-4">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center px-4 py-3 mx-2 rounded-lg transition-all"
          :class="isActive(item.path) ? 'bg-blue-600' : 'hover:bg-gray-800'"
        >
          <el-icon size="20"><component :is="item.icon" /></el-icon>
          <span v-if="!collapsed" class="ml-3">{{ item.title }}</span>
        </router-link>
      </nav>

      <!-- Collapse Button -->
      <div class="p-4 border-t border-gray-700">
        <button
          @click="collapsed = !collapsed"
          class="w-full flex items-center justify-center py-2 rounded-lg hover:bg-gray-800 transition-all"
        >
          <el-icon size="20"><component :is="collapsed ? 'DArrowRight' : 'DArrowLeft'" /></el-icon>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col">
      <!-- Header -->
      <header class="h-16 bg-white shadow-sm flex items-center justify-between px-6">
        <h1 class="text-xl font-semibold text-gray-800">{{ currentTitle }}</h1>
        <div class="flex items-center gap-4">
          <span class="text-gray-600">{{ adminInfo.nickname || adminInfo.username }}</span>
          <el-dropdown @command="handleCommand">
            <div class="flex items-center gap-2 cursor-pointer">
              <el-avatar :size="32" :src="adminInfo.avatar">
                <el-icon><User /></el-icon>
              </el-avatar>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- Content -->
      <main class="flex-1 p-6 overflow-auto">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { VideoCamera, User, Film, Tickets, Document, Calendar } from '@element-plus/icons-vue'
import { verifyToken } from '../api/auth'

const router = useRouter()
const route = useRoute()

const collapsed = ref(false)

const adminInfo = ref<{ id: number; username: string; nickname: string; avatar?: string }>({
  id: 0,
  username: 'admin',
  nickname: '管理员'
})

const menuItems = [
  { path: '/drama', title: '短剧管理', icon: Film },
  { path: '/episode', title: '剧集管理', icon: Tickets },
  { path: '/order', title: '订单管理', icon: Document },
  { path: '/user', title: '用户管理', icon: User },
  { path: '/signin', title: '签到管理', icon: Calendar }
]

const isActive = (path: string) => {
  return route.path === path || route.path.startsWith(path + '/')
}

const currentTitle = computed(() => {
  const item = menuItems.find(m => isActive(m.path))
  return item?.title || '管理后台'
})

const handleCommand = (command: string) => {
  if (command === 'logout') {
    localStorage.removeItem('admin_token')
    router.push('/login')
  }
}

onMounted(async () => {
  try {
    const res = await verifyToken()
    adminInfo.value = res.data
  } catch (e) {
    console.error('Failed to get admin info')
  }
})
</script>