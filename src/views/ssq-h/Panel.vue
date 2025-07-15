<template>
  <section class="flex items-center border-0 border-b-1px border-solid pt-2px justify-center">
    <el-button style="width: 65px" text type="warning"> {{ title }}-{{ index }} </el-button>

    <section>
      <div
        v-for="(row, rowIndex) in redBallList"
        :key="rowIndex"
        class="flex items-center whitespace-nowrap my-2px"
        @click="handleRow(`${title}_${rowIndex}`)"
      >
        <div
          v-for="(item, colIndex) in row"
          :key="`${rowIndex}-${colIndex}`"
          class="nums"
          :class="[isNumberSelected(item.val) ? ' text-red-600 font-medium' : '']"
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
          class="nums"
          :style="{
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
const rows = ref(new Set())
// 接收父组件传递的标题和需要标红的数字
const props = defineProps<{
  title: string
  highlightNums: number[]
  blue: number | string
  index: number
}>()

// 检查数字是否需要标红（处理类型匹配）
const isNumberSelected = (num: number | null) => {
  if (num === null) return false
  // 强制转为数字，避免字符串/数字类型不匹配
  return props.highlightNums.includes(Number(num))
}
function handleRow(item: string) {
  if (rows.value.has(item)) {
    rows.value.delete(item)
  } else {
    rows.value.add(item)
  }
}
</script>
<style lang="scss">
.border-row {
  @apply border-0 border-solid border-b-1px border-gray-200;
}
</style>
