import { defineConfig } from 'unocss'
import presetWind3 from '@unocss/preset-wind3'
import presetIcons from '@unocss/preset-icons'
import presetAttributify from '@unocss/preset-attributify'
import transformerDirectives from '@unocss/transformer-directives'
import transformerVariantGroup from '@unocss/transformer-variant-group'

export default defineConfig({
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
