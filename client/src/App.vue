<template>
  <div id="app">
    <router-view />
    <TabBar v-if="showTabBar" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import TabBar from '@/components/TabBar.vue'

const route = useRoute()

const showTabBar = computed(() => {
  return route.meta.showTabBar === true
})
</script>

<style>
#app {
  width: 100%;
  max-width: 750px;
  margin: 0 auto;
  min-height: 100vh;
  background: #f5f5f5;
}
</style>
