/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module 'dplayer' {
  interface DPlayer {
    play(): void
    pause(): void
    destroy(): void
    on(event: string, callback: Function): void
  }

  interface DPlayerOptions {
    container: HTMLElement
    video: {
      url: string
      pic?: string
      type?: string
    }
    autoplay?: boolean
  }

  export default class DPlayer {
    constructor(options: DPlayerOptions)
  }
}
