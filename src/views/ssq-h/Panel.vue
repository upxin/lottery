<template>
  <section
    class="flex items-center justify-center border-0 border-b-6px border-gray-200 border-solid"
  >
    <el-button class="mx-20px" text type="success">
      {{ title }}
    </el-button>

    <section>
      <div
        v-for="(row, rowIndex) in redBallList"
        :key="rowIndex"
        class="flex items-center whitespace-nowrap"
      >
        <div
          v-for="(item, colIndex) in row"
          :key="`${rowIndex}-${colIndex}`"
          class="m-2px bg-gray-50 text-gray-400 text-sm"
          :class="[
            'flex items-center justify-center w-22px h-22px rounded-md',
            isNumberSelected(item.val) ? ' bg-red-50 text-red-600 font-medium' : '',
          ]"
        >
          {{ item.val !== null ? item.val : '' }}
        </div>
      </div>
    </section>

    <section class="px-20px">
      <div
        v-for="(row, rowIndex) in blueBallList"
        :key="rowIndex + 'blue'"
        class="flex items-center whitespace-nowrap"
      >
        <div
          v-for="(item, colIndex) in row"
          :key="`${rowIndex}-${colIndex}_${item.val}`"
          class="m-2px text-sm"
          :class="['flex items-center justify-center w-22px h-22px rounded-md']"
          :style="{
            background: blue == item.val ? '#eff6ff' : '#f9fafb',
            color: blue == item.val ? '#2563eb' : '#9ca3af',
            fontWeight: blue == item.val ? 500 : 400,
          }"
        >
          {{ item.val }}
        </div>
      </div>
    </section>
  </section>
</template>

<script lang="ts" setup>
import { redBallList } from './data' // 确保lists存在且路径正确
import { blueBallList } from './data'

// 接收父组件传递的标题和需要标红的数字
const props = defineProps<{
  title: string
  highlightNums: number[]
  blue: number | string
}>()

// 检查数字是否需要标红（处理类型匹配）
const isNumberSelected = (num: number | null) => {
  if (num === null) return false
  // 强制转为数字，避免字符串/数字类型不匹配
  return props.highlightNums.includes(Number(num))
}
</script>
