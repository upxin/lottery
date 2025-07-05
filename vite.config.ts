import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import UnoCSS from 'unocss/vite'

import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'

import { AntDesignVueResolver, ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    UnoCSS(),
    Icons({
      compiler: 'vue3', // 指定 Vue 3 编译器
      autoInstall: true, // 自动安装缺失的图标集合
    }),
    AutoImport({
      imports: ['vue', 'vue-router', '@vueuse/core'],
      resolvers: [ElementPlusResolver({})],
    }),
    Components({
      resolvers: [
        AntDesignVueResolver({
          importStyle: 'less', // 按需导入样式
        }),
        ElementPlusResolver({}),
        IconsResolver({
          prefix: '', // 组件前缀
          // enabledCollections: ['icons8', 'ic', 'mdi', 'fa'], // 添加所有需要的集合  已经自动导入了
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
