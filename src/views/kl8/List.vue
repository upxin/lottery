<template>
  <section v-if="visible" class="pos-fixed z-999 bg-amber bottom-40 left-1/2 -translate-x-1/2">
    <div mb-10px v-for="(group, index) in groupedResults" :key="index">
      {{ group.count }}:{{ group.numbers.join(' ') }}
    </div>
    <p text-bordeaux-red>{{ flattenedNumbers.join(' ') }}</p>
  </section>
</template>

<script lang="ts" setup>
// 使用 defineModel 处理双向绑定
const visible = defineModel<boolean>('visible', {
  type: Boolean,
  default: false,
})

const props = defineProps<{
  list: number[] // 外部传入的数字数组
}>()

const statistics = ref<Map<number, number>>(new Map())
const groupedResults = ref<{ count: number; numbers: number[] }[]>([])

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
    .filter((item) => {
      return item.count >= 6
    })
}
const flattenedNumbers = computed(() => {
  // 使用 flatMap 将所有分组中的 numbers 数组拍平
  return groupedResults.value.flatMap((group) => group.numbers).sort((a, b) => a - b)
})

// 监听 list 变化
watch(() => props.list, updateStatistics, { immediate: true })

onMounted(updateStatistics)
</script>
