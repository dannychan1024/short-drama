<template>
  <div class="drama-card" @click="$emit('click')">
    <img :src="drama.cover" :alt="drama.title" class="cover" />
    <div class="info">
      <h3>{{ drama.title }}</h3>
      <p class="desc">{{ drama.description }}</p>
      <div class="meta">
        <span class="price">¥{{ drama.price }}</span>
        <span class="episodes">{{ drama.totalEpisodes }}集</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Drama } from '@/types'

defineProps<{
  drama: Drama
}>()

defineEmits<{
  (e: 'click'): void
}>()
</script>

<style scoped>
.drama-card {
  display: flex;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;
}

.drama-card:active {
  transform: scale(0.98);
}

.cover {
  width: 120px;
  height: 160px;
  object-fit: cover;
}

.info {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.info h3 {
  font-size: 16px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.desc {
  font-size: 13px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price {
  color: #ff6b6b;
  font-size: 16px;
  font-weight: bold;
}

.episodes {
  font-size: 12px;
  color: #999;
}
</style>
