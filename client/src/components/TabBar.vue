<template>
  <div class="tab-bar">
    <router-link to="/" class="tab-item" :class="{ active: route.path === '/' }">
      <span class="icon">🏠</span>
      <span class="label">首页</span>
    </router-link>
    <router-link to="/following" class="tab-item" :class="{ active: route.path === '/following' }">
      <span class="icon">📺</span>
      <span class="label">追剧</span>
    </router-link>
    <router-link to="/profile" class="tab-item" :class="{ active: route.path === '/profile' }">
      <span class="icon">👤</span>
      <span class="label">我的</span>
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<style scoped>
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 750px;
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: #fff;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  padding: 8px 0;
  padding-bottom: calc(8px + env(safe-area-inset-bottom));
  z-index: 100;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: #999;
  transition: color 0.2s;
}

.tab-item.active {
  color: #ff6b6b;
}

.tab-item .icon {
  font-size: 22px;
  margin-bottom: 2px;
}

.tab-item .label {
  font-size: 12px;
}
</style>
