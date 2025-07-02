import { defineConfig } from 'unocss'
import presetWind3 from '@unocss/preset-wind3'
import presetIcons from '@unocss/preset-icons'

export default defineConfig({
  presets: [
    presetWind3(), // 新的基础原子类
    presetIcons(), // 图标原子类
  ],
})
