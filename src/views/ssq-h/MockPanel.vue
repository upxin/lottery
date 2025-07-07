<template>
  <section class="flex items-center py-10px">
    <el-button style="width: 60px" type="primary" :size="'small'"> 清除 </el-button>

    <section>
      <div
        v-for="(row, rowIndex) in redBallList"
        :key="rowIndex"
        class="flex items-center whitespace-nowrap"
      >
        <div
          v-for="(item, colIndex) in row"
          :key="`${rowIndex}-${colIndex}`"
          class="nums cursor-pointer"
          :class="[redCd(item.val) ? ' text-red-600 font-medium' : '']"
          @click="handleRed(item.val)"
        >
          {{ item.val !== null ? item.val : '' }}
        </div>
      </div>
    </section>

    <section class="px-20px">
      <div
        v-for="(row, rowIndex) in blueBallList"
        :key="rowIndex + 'blueBalls'"
        class="flex items-center whitespace-nowrap"
      >
        <div
          v-for="(item, colIndex) in row"
          :key="`${rowIndex}-${colIndex}_${item.val}`"
          class="nums"
          @click="handleBlue(item.val)"
          :style="{
            color: blueCd(item.val) ? '#2563eb' : '#9ca3af',
            fontWeight: blueCd(item.val) ? 500 : 400,
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

const redBalls = ref(new Set())
const blueBalls = ref(new Set())

const redCd = (num: number) => {
  if (num === null) return false
  return redBalls.value.has(Number(num))
}
const blueCd = (num: number) => {
  if (num === null) return false
  return blueBalls.value.has(Number(num))
}

function handleBlue(num: number) {
  if (blueBalls.value.has(num)) {
    blueBalls.value.delete(num)
    return
  }
  blueBalls.value.add(num)
}

function handleRed(num: number) {
  if (redBalls.value.has(num)) {
    redBalls.value.delete(num)
    return
  }
  redBalls.value.add(num)
}
</script>
<style lang="scss">
.border-row {
  @apply border-0 border-solid border-b-1px border-gray-200;
}
</style>
