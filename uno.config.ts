import { defineConfig } from 'unocss'
import presetWind3 from '@unocss/preset-wind3'
import presetIcons from '@unocss/preset-icons'
import presetAttributify from '@unocss/preset-attributify'
import transformerDirectives from '@unocss/transformer-directives'
import transformerVariantGroup from '@unocss/transformer-variant-group'

export default defineConfig({
  theme: {
    colors: {
      'klein-blue': '#002FA7', // 克莱因蓝
      'pure-red': '#FF0000', // 正红色
      'pure-black': '#000000', // 纯黑色
      'pure-white': '#FFFFFF', // 纯白色
      'lemon-yellow': '#FFFF00', // 柠檬黄
      'grass-green': '#00FF00', // 草绿色
      'sky-blue': '#87CEEB', // 天蓝色
      'deep-purple': '#800080', // 深紫色
      'chocolate-brown': '#D2691E', // 巧克力棕
      'rose-pink': '#FF69B4', // 玫瑰粉
      'bordeaux-red': '#800020', // 波尔多红（经典暗红）
      'bordeaux-dark': '#5C0011', // 深波尔多红
      'bordeaux-light': '#A52639', // 浅波尔多红
      'klein-blue-50': 'rgba(0, 47, 167, 0.5)',
    },
  },
  presets: [
    presetAttributify(), // 启用属性模式
    presetWind3(), // 新的基础原子类
    presetIcons(), // 图标原子类
  ],
  transformers: [
    transformerDirectives(), // 启用 @apply 语法
    transformerVariantGroup(), // 启用括号变体组
  ],
})
