<template>
  <section
    v-if="visible"
    class="pos-fixed z-999 bg-amber bottom-40 left-1/2 -translate-x-1/2 rounded-md p-12px"
  >
    <el-button
      v-for="num in arr"
      :key="num"
      @click="handleItem(num)"
      :type="curNum === num ? 'success' : 'default'"
      >{{ num }}</el-button
    >
    <div class="h-20px"></div>
    <div v-for="(group, index) in finalRets" :key="index">
      {{ group.count }}：{{ group.numbers.join(' ') }}
    </div>
    <p>中奖号码：{{ g1 }}</p>
    <p text-bordeaux-red>
      选择的胆{{ flattenedNumbers.join(' ') }} 长度：{{ flattenedNumbers.length }} 剩余没选：{{
        80 - flattenedNumbers.length
      }}
    </p>
    <p text-bordeaux-red>命中的胆：{{ hits.join(' ') }} 长度：{{ hits.length }}</p>
    <p text-bordeaux-red>剩余的胆：{{ restHits.join(' ') }} 长度：{{ restHits.length }}</p>
  </section>
</template>

<script lang="ts" setup>
const arr = Array.from({ length: 18 }, (_, i) => i + 1)
const curNum = ref(15)
// 使用 defineModel 处理双向绑定
const visible = defineModel<boolean>('visible', {
  type: Boolean,
  default: false,
})
const emits = defineEmits(['choosed'])

const props = defineProps<{
  list: number[] // 外部传入的数字数组
  hits: number[]
  g1: number[]
  restHits: number[]
}>()

const statistics = ref<Map<number, number>>(new Map())
const groupedResults = ref<{ count: number; numbers: number[] }[]>([])

const flattenedNumbers = computed(() => {
  return finalRets.value.flatMap((group) => group.numbers).sort((a, b) => a - b)
})
const finalRets = computed(() => {
  return groupedResults.value.filter((item) => item.count >= curNum.value)
})
function handleItem(num: number) {
  curNum.value = num
  emits('choosed', flattenedNumbers.value)
}
const updateStatistics = () => {
  statistics.value = new Map()

  props.list.forEach((num) => {
    statistics.value.set(num, (statistics.value.get(num) || 0) + 1)
  })

  const countMap = new Map<number, number[]>()
  statistics.value.forEach((count, num) => {
    if (!countMap.has(count)) {
      countMap.set(count, [])
    }
    countMap.get(count)?.push(num)
  })

  groupedResults.value = Array.from(countMap.entries())
    .map(([count, nums]) => ({
      count,
      numbers: nums.sort((a, b) => b - a),
    }))
    .sort((a, b) => b.count - a.count)
}
watch(() => props.list, updateStatistics, { immediate: true })

onMounted(updateStatistics)
</script>
