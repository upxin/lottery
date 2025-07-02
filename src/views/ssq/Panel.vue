<template>
  <section
    class="flex items-center justify-center border-0 border-b-6px border-gray-200 border-solid"
  >
    <el-button class="mr-10px" style="width: 160px" text type="success">
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
          class="mx-6px"
          :class="[
            'flex items-center justify-center w-30px h-30px rounded-md transition-all duration-200',
            'border text-sm',
            'border-gray-300',
            isNumberSelected(item.val) ? 'border-red-400 bg-red-50 text-red-600 font-medium' : '',
          ]"
        >
          {{ item.val !== null ? item.val : '' }}
        </div>
      </div>
    </section>

    <el-button class="mr-10px" style="width: 160px" text type="primary">
      {{ blue }}
    </el-button>
  </section>
</template>

<script lang="ts" setup>
import { defineProps } from 'vue'
import { redBallList } from './data' // 确保lists存在且路径正确
// 接收父组件传递的标题和需要标红的数字
const props = defineProps<{
  title: string
  highlightNums: number[]
  blue: string
}>()

// 检查数字是否需要标红（处理类型匹配）
const isNumberSelected = (num: number | null) => {
  if (num === null) return false
  // 强制转为数字，避免字符串/数字类型不匹配
  return props.highlightNums.includes(Number(num))
}
</script>
