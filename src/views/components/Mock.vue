<template>
  <section
    w-500px
    z-9999
    class="bg-white text-fuchsia shadow-md shadow-coolGray pb-10px pt-14px pl-10px rounded-md fixed box-border"
    ref="draggableRef"
    :style="style"
  >
    <div text-amber v-if="type">{{ type }}</div>
    <div v-if="parsedData">
      <div v-for="item in parsedData" :key="`part1_${item.percent}`" flex my-6px>
        <div w-42px>{{ item.percent }}:</div>
        <div class="flex flex-wrap flex-1">
          <el-button
            style="margin: 0 4px"
            v-for="c in item.numbers"
            :key="`part1_${item.percent}_${c}`"
            :type="selectedFront.has(c) ? 'success' : 'default'"
            @click="handleFront(c)"
          >
            {{ c }}
          </el-button>
        </div>
      </div>
    </div>
    <div text-amber v-if="btype && showBack">{{ btype }}</div>
    <div v-if="parsedDataBack && showBack">
      <div v-for="item in parsedDataBack" :key="`part2_${item.percent}`" flex my-6px>
        <div w-42px>{{ item.percent }}:</div>
        <div class="flex flex-wrap flex-1">
          <el-button
            style="margin: 0 4px"
            v-for="c in item.numbers"
            :key="`part2_${item.percent}_${c}`"
            :type="selectedBack.has(c) ? 'success' : 'default'"
            @click="handleBack(c)"
          >
            {{ c }}
          </el-button>
        </div>
      </div>
    </div>
    <div class="flex justify-center mt-6">
      <el-button @click="copy">复制</el-button>
      <el-button @click="reset">重置位置</el-button>
      <el-button @click="emits('close')" :type="'danger'">关闭</el-button>
    </div>
  </section>
</template>

<script setup lang="ts">
// 接收父组件传入的参数：
// - front/back：需要高亮的数字
// - content：Markdown内容（替代本地cur.md）
const { showBack, setBack, setFront } = inject('showBack')
const props = withDefaults(
  defineProps<{
    front: number[]
    back: number[]
    type: string | number
    content: string // 新增：从父组件传入的Markdown内容
    contentBack?: string
    btype?: string
  }>(),
  {
    front: () => [],
    back: () => [],
    content: '', // 默认空字符串
    contentBack: '',
    btype: '-------',
    type: '',
  },
)

// 拖拽配置
const draggableRef = ref<HTMLElement | null>(null)
const emits = defineEmits(['close'])
const initPos = useStorage(props.type, { x: 0, y: 10 })
const { style } = useDraggable(draggableRef, {
  initialValue: initPos.value,
  onEnd(position) {
    initPos.value = position
  },
})

function reset() {
  localStorage.clear()
}
// 解析后的数据（数字列表）
const parsedData = ref([])

// 前后区高亮状态（选中状态）
const selectedFront = ref(new Set<string>())
const selectedBack = ref(new Set<string>())

const parsePart = (partContent: string) => {
  const percentGroups: Array<{ percent: string; numbers: string[] }> = []
  partContent.split('\n').forEach((line) => {
    line = line.trim()
    if (!line) return
    if (line.includes(':')) {
      const [percent, numsStr] = line.split(':').map((part) => part.trim())
      if (percent && numsStr) {
        percentGroups.push({
          percent,
          numbers: numsStr.split(',').map((num) => num.trim()),
        })
      }
    }
  })
  return percentGroups
}

// 将props中的数字设置为对应区域的高亮状态
const setHighlightFromProps = () => {
  const frontStrs = props.front.map((num) => num.toString().padStart(2, '0'))
  selectedFront.value = new Set(frontStrs)

  const backStrs = props.back.map((num) => num.toString().padStart(2, '0'))
  selectedBack.value = new Set(backStrs)
}

// 复制选中数据
const copy = () => {
  const part1 = Array.from(selectedFront.value).sort((a, b) => +a - +b)
  const part2 = Array.from(selectedBack.value).sort((a, b) => +a - +b)

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

// 监听props变化：
// 1. content变化时重新解析数据
// 2. front/back变化时更新高亮
watch(
  () => props.content,
  (newContent) => {
    if (newContent) {
      parsedData.value = parsePart(newContent)
      setHighlightFromProps() // 重新解析后同步高亮
    }
  },
  { immediate: true }, // 初始化时已在onMounted处理
)

const parsedDataBack = ref([])
watch(
  () => props.contentBack,
  (newContent) => {
    if (newContent) {
      parsedDataBack.value = parsePart(newContent)
      setHighlightFromProps() // 重新解析后同步高亮
    }
  },
  { immediate: true }, // 初始化时已在onMounted处理
)

watch(
  () => [props.front, props.back],
  () => {
    setHighlightFromProps()
  },
  { deep: true },
)

function handleBack(v) {
  setBack(parseInt(v))
}
function handleFront(v) {
  setFront(parseInt(v))
}
</script>
