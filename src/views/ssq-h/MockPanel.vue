<template>
  <section class="flex items-center py-10px">
    <section flex flex-col>
      <el-button
        text
        style="width: 65px"
        type="primary"
        :size="'small'"
        @click="
          () => {
            redBalls.clear()
            blueBalls.clear()
          }
        "
      >
        清除
      </el-button>
      <el-button
        text
        style="width: 65px; margin-left: 0"
        type="warning"
        :size="'small'"
        @click="copyRedBallsNumbers"
      >
        复制
      </el-button>
    </section>

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
/**
 * 复制redBalls中的数字到剪贴板
 * @param {Ref<Set<number>>} redBalls - 包含红球数字的ref
 * @returns {Promise<void>} 当复制成功时解析的Promise
 */
const copyRedBallsNumbers = async () => {
  try {
    const numbersArray = Array.from(redBalls.value).sort((a, b) => a - b)
    const numbersString = numbersArray.join(',')
    await navigator.clipboard.writeText(numbersString)
    ElMessage.success('复制成功')
  } catch (error) {}
}
</script>
<style lang="scss">
.border-row {
  @apply border-0 border-solid border-b-1px border-gray-200;
}
</style>
