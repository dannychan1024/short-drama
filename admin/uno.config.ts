import { defineConfig, presetUno, presetIcons, presetWebFonts } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetIcons({
      scale: 1.2,
      cdn: 'https://esm.sh/'
    }),
    presetWebFonts()
  ],
  shortcuts: {
    'flex-center': 'flex justify-center items-center',
    'flex-between': 'flex justify-between items-center',
    'btn': 'px-4 py-2 rounded-lg cursor-pointer transition-all duration-200',
    'btn-primary': 'btn bg-blue-500 text-white hover:bg-blue-600',
    'btn-danger': 'btn bg-red-500 text-white hover:bg-red-600',
    'input-base': 'border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-colors',
    'card': 'bg-white rounded-xl shadow-sm border border-gray-100'
  },
  theme: {
    colors: {
      primary: '#3b82f6',
      danger: '#ef4444',
      success: '#22c55e',
      warning: '#f59e0b'
    }
  }
})