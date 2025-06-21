import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import UnoCSS from 'unocss/vite'
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers'
import AutoImport from 'unplugin-auto-import/vite'
// vite.config.js
import Components from 'unplugin-vue-components/vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    UnoCSS(),
    AutoImport({
      imports: ['vue', 'vue-router', '@vueuse/core'],
    }),
    Components({
      resolvers: [
        AntDesignVueResolver({
          importStyle: 'less', // 按需导入样式
        }),
      ],
      types: [
        {
          from: 'vue-router',
          names: ['RouterLink', 'RouterView'],
        },
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
