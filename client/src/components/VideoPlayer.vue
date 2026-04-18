<template>
  <div class="video-player">
    <div ref="playerRef" class="player-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import DPlayer from 'dplayer'

// Extend DPlayer interface to include methods TypeScript doesn't know about
interface ExtendedDPlayer extends DPlayer {
  on(event: string, handler: (e?: any) => void): void
  destroy(): void
}

const props = defineProps<{
  videoUrl: string
  poster?: string
  autoplay?: boolean
}>()

const emit = defineEmits<{
  (e: 'play'): void
  (e: 'pause'): void
  (e: 'ended'): void
  (e: 'error', error: any): void
}>()

const playerRef = ref<HTMLElement | null>(null)
let dp: ExtendedDPlayer | null = null

const initPlayer = () => {
  if (!playerRef.value || !props.videoUrl) return

  dp = new DPlayer({
    container: playerRef.value,
    video: {
      url: props.videoUrl,
      pic: props.poster,
      type: 'hls'
    },
    autoplay: props.autoplay ?? false
  }) as ExtendedDPlayer

  dp.on('play', () => emit('play'))
  dp.on('pause', () => emit('pause'))
  dp.on('ended', () => emit('ended'))
  dp.on('error', (e: any) => emit('error', e))
}

const destroyPlayer = () => {
  if (dp) {
    dp.destroy()
    dp = null
  }
}

watch(() => props.videoUrl, () => {
  destroyPlayer()
  initPlayer()
})

onMounted(() => {
  initPlayer()
})

onUnmounted(() => {
  destroyPlayer()
})
</script>

<style scoped>
.video-player {
  width: 100%;
}

.player-container {
  width: 100%;
  aspect-ratio: 16/9;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}
</style>
