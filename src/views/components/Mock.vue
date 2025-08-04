<template>
  <section
    w-500px
    z-9999
    class="bg-klein-blue text-fuchsia pb-10px pt-14px pl-10px rounded-md fixed box-border"
    ref="draggableRef"
    :style="style"
  >
    <div v-if="parsedData.part1.length">
      <div v-for="item in parsedData.part1" :key="`part1_${item.percent}`" flex my-2px>
        <div w-42px>{{ item.percent }}:</div>
        <div class="flex flex-wrap flex-1">
          <el-button
            @click="handleNum('part1', c)"
            style="margin: 0 4px"
            v-for="c in item.numbers"
            :key="`part1_${item.percent}_${c}`"
            :type="selectedPart1.has(c) ? 'success' : 'default'"
          >
            {{ c }}
          </el-button>
        </div>
      </div>
    </div>

    <div v-if="parsedData.part1.length && parsedData.part2.length" py-4px>{{ f }} , {{ b }}</div>

    <div v-if="parsedData.part2.length">
      <div v-for="item in parsedData.part2" :key="`part2_${item.percent}`" flex my-2px>
        <div w-42px>{{ item.percent }}:</div>
        <div class="flex flex-wrap flex-1">
          <el-button
            @click="handleNum('part2', c)"
            style="margin: 0 4px"
            v-for="c in item.numbers"
            :key="`part2_${item.percent}_${c}`"
            :type="selectedPart2.has(c) ? 'success' : 'default'"
          >
            {{ c }}
          </el-button>
        </div>
      </div>
    </div>

    <div class="flex justify-center mt-6">
      <el-button @click="copy">复制</el-button>
      <el-button @click="clearFront">清除前区</el-button>
      <el-button @click="clearBack">清除后区</el-button>
      <el-button @click="emits('close')" :type="'danger'">关闭</el-button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useDraggable } from '@vueuse/core'
import { ElMessage } from 'element-plus'

// 接收父组件传入的参数：
// - front/back：需要高亮的数字
// - content：Markdown内容（替代本地cur.md）
const props = withDefaults(
  defineProps<{
    front: number[]
    back: number[]
    content: string // 新增：从父组件传入的Markdown内容
  }>(),
  {
    front: () => [],
    back: () => [],
    content: '', // 默认空字符串
  },
)

// 拖拽配置
const draggableRef = ref<HTMLElement | null>(null)
const panelWidth = 600
const initialX = window.innerWidth / 2 - panelWidth / 2
const panelHeight = 550
const windowHeight = window.innerHeight
const initialY = windowHeight - panelHeight
const emits = defineEmits(['close'])

const { style } = useDraggable(draggableRef, {
  initialValue: { x: initialX, y: initialY },
})

// 解析后的数据（数字列表）
const parsedData = ref({
  part1: [] as Array<{ percent: string; numbers: string[] }>,
  part2: [] as Array<{ percent: string; numbers: string[] }>,
})

// 前后区高亮状态（选中状态）
const selectedPart1 = ref(new Set<string>())
const selectedPart2 = ref(new Set<string>())

// 解析Markdown（使用父组件传入的content）
const parseMarkdown = (content: string) => {
  const parts = content.split(/---+/).map((part) => part.trim())
  parsedData.value.part1 = parts[0] ? parsePart(parts[0]) : []
  parsedData.value.part2 = parts[1] ? parsePart(parts[1]) : []
}

const parsePart = (partContent: string) => {
  const percentGroups: Array<{ percent: string; numbers: string[] }> = []
  partContent.split('\n').forEach((line) => {
    line = line.trim()
    if (!line) return
    const [percent, numsStr] = line.split(':').map((part) => part.trim())
    if (percent && numsStr) {
      percentGroups.push({
        percent,
        numbers: numsStr.split(',').map((num) => num.trim()),
      })
    }
  })
  return percentGroups
}

// 将props中的数字设置为对应区域的高亮状态
const setHighlightFromProps = () => {
  const frontStrs = props.front.map((num) => num.toString().padStart(2, '0'))
  selectedPart1.value = new Set(frontStrs)

  const backStrs = props.back.map((num) => num.toString().padStart(2, '0'))
  selectedPart2.value = new Set(backStrs)
}

// 处理数字点击
const handleNum = (part: 'part1' | 'part2', num: string) => {
  const targetSet = part === 'part1' ? selectedPart1 : selectedPart2
  if (targetSet.value.has(num)) {
    targetSet.value.delete(num)
  } else {
    targetSet.value.add(num)
  }
  targetSet.value = new Set(targetSet.value) // 强制更新
}

// 复制选中数据
const copy = () => {
  const part1 = Array.from(selectedPart1.value).sort((a, b) => +a - +b)
  const part2 = Array.from(selectedPart2.value).sort((a, b) => +a - +b)

  let result = ''
  if (part1.length) result += `${part1.join(' ')} , `
  if (part2.length) result += `${part2.join(' ')}`

  if (!result) {
    ElMessage.warning('未选中任何数字')
    return
  }

  navigator.clipboard
    .writeText(result)
    .then(() => ElMessage.success('已复制选中数据'))
    .catch(() => ElMessage.error('复制失败'))
}

// 清除选中状态
const clearFront = () => {
  selectedPart1.value = new Set()
}

const clearBack = () => {
  selectedPart2.value = new Set()
}

// 初始化：使用父组件传入的content解析数据，并设置高亮
onMounted(() => {
  if (props.content) {
    parseMarkdown(props.content)
    setHighlightFromProps()
  }
})

// 监听props变化：
// 1. content变化时重新解析数据
// 2. front/back变化时更新高亮
watch(
  () => props.content,
  (newContent) => {
    if (newContent) {
      parseMarkdown(newContent)
      setHighlightFromProps() // 重新解析后同步高亮
    }
  },
  { immediate: false }, // 初始化时已在onMounted处理
)

watch(
  () => [props.front, props.back],
  () => {
    setHighlightFromProps()
  },
  { deep: true },
)

const f = computed(() => {
  const ret = [...props.front].sort((a, b) => a - b)
  return ret.join(' ')
})

const b = computed(() => {
  const ret = [...props.back].sort((a, b) => a - b)
  return ret.join(' ')
})
</script>
