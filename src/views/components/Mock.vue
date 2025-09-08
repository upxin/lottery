<template>
  <section
    w-500px
    class="bg-white text-fuchsia shadow-md shadow-coolGray pb-10px pt-14px pl-10px rounded-md fixed box-border"
    ref="draggableRef"
    :style="{ left: x + 'px', top: y + 'px', zIndex }"
    @click="handlePanel"
  >
    <!-- 前区 -->
    <div text-amber v-if="type && !showBack" flex justify-between pr-20px>
      <span>前区 {{ type }}</span>
      <el-button @click="reset" size="small">重置位置</el-button>
    </div>
    <div v-if="parsedData && !showBack">
      <div v-for="item in parsedData" :key="`part1_${item.percent}`" flex my-6px>
        <div w-42px>{{ item.percent }}:</div>
        <div class="flex flex-wrap flex-1">
          <el-button
            style="margin: 0 4px"
            v-for="c in item.numbers"
            :key="`part1_${item.percent}_${c}`"
            :type="highlightedFront?.has?.(c) ? 'success' : 'default'"
            @click="handleFront(c)"
            size="small"
          >
            {{ c }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- 后区 -->
    <div text-amber v-if="btype && showBack" flex justify-between pr-20px>
      <span>后区 {{ btype }}</span>
      <el-button @click="reset" size="small">重置位置</el-button>
    </div>
    <div v-if="parsedDataBack && showBack">
      <div v-for="item in parsedDataBack" :key="`part2_${item.percent}`" flex my-6px>
        <div w-42px>{{ item.percent }}:</div>
        <div class="flex flex-wrap flex-1">
          <el-button
            style="margin: 0 4px"
            v-for="c in item.numbers"
            :key="`part2_${item.percent}_${c}`"
            :type="highlightedBack?.has?.(c) ? 'success' : 'default'"
            @click="handleBack(c)"
            size="small"
          >
            {{ c }}
          </el-button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const { showBack, setFront, setBack } = inject('showBack', {
  showBack: false,
  setFront: () => {},
  setBack: () => {},
})
const highlightedFront = inject<Ref<Set<string>>>('highlightedFront')
const highlightedBack = inject<Ref<Set<string>>>('highlightedBack')
// 2. Props定义
interface MockProps {
  front: number[]
  back?: number[]
  type?: string
  content: string
  contentBack?: string
  btype?: string
}
const props = withDefaults(defineProps<MockProps>(), {
  front: () => [],
  back: () => [],
  contentBack: '',
  btype: '-------',
  type: '',
})

// 3. 拖拽与层级（基础功能不改动）
const draggableRef = useTemplateRef('draggableRef')
const storageKey = `mock_pos_${String(props.type || 'default')}`
const initPos = useStorage(storageKey, { x: 0, y: 10 })
const { x, y } = useDraggable(draggableRef, {
  initialValue: initPos.value,
  onEnd: (p) => (initPos.value = p),
})
const reset = () => {
  localStorage.clear()
  ElMessage.success('位置已重置')
}

const globalZIndex = useStorage('mock_max_zindex', 10)
const zIndex = ref(globalZIndex.value)
const handlePanel = () => {
  zIndex.value = ++globalZIndex.value
}

// 4. 内容解析（保持格式统一）
interface ParsedGroup {
  percent: string
  numbers: string[]
}
const parsePart = (content: string): ParsedGroup[] => {
  if (!content) return []
  return content
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && l.includes(':'))
    .map((l) => {
      const [p, nums] = l.split(':').map((part) => part.trim())
      const numList = Array.from(new Set(nums.split(',').map((n) => n.trim())))
        .filter((n) => /^\d+$/.test(n))
        .map((n) => n.padStart(2, '0'))
        .sort((a, b) => Number(a) - Number(b))
      return { percent: p, numbers: numList }
    })
}

// 5. 窗口拆分（一次性拆分，避免重复计算）
const splitWindows = (content: string) =>
  content
    .split('---separator---')
    .map((w) => w.trim())
    .filter(Boolean)
const windows = ref(splitWindows(props.content))
const bwindows = ref(splitWindows(props.contentBack))

const currentHis = inject<{ value: string | number }>('currentHis', { value: '0' })
const maxHis = inject<{ value: string | number }>('maxHis', { value: '0' })

const getExactIndex = (windowList: string[]) => {
  if (windowList.length === 0) return 0

  const current = Number(currentHis.value)
  const max = Number(maxHis.value)
  if (isNaN(current) || isNaN(max)) return windowList.length - 1

  const diff = max - current // 例：max=100, current=89 → diff=11
  let index = windowList.length - 1 - diff
  index = Math.max(0, Math.min(index, windowList.length - 1))
  return index
}

const parsedData = ref<ParsedGroup[]>([])
const parsedDataBack = ref<ParsedGroup[]>([])
const updateFront = () => {
  const idx = getExactIndex(windows.value)
  parsedData.value = parsePart(windows.value[idx] || '')
}
const updateBack = () => {
  const idx = getExactIndex(bwindows.value)
  parsedDataBack.value = parsePart(bwindows.value[idx] || '')
}

watch(
  () => currentHis.value,
  (v, o) => {
    if (v != o) {
      nextTick(() => {
        updateFront()
        updateBack()
      })
    }
  },
  { immediate: true },
)

watch(
  [() => props.content, () => props.contentBack],
  () => {
    windows.value = splitWindows(props.content)
    bwindows.value = splitWindows(props.contentBack)
    extractPercentCounts(props.content)
  },
  { immediate: true },
)

function extractPercentCounts(text, n = 101) {
  const lines = text.split('\n')
  // 过滤出“第xxxx期在本窗口的分布 ...”的行
  const distLines = lines.filter((line) => line.includes('在本窗口的分布'))

  // 只取最后 n 条
  const lastN = distLines.slice(-n)

  const counts = {}
  const list = []
  lastN.forEach((line) => {
    // 匹配所有百分比，比如 20%、12%
    const matches = line.match(/(\d+)%/g)
    let str = ''
    if (matches) {
      matches.forEach((percent: string) => {
        str += percent.replace('%', '') + ','
        counts[percent] = (counts[percent] || 0) + 1
      })
      list.push(str)
    }
  })

  // 排序（按出现次数从大到小）
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  const sortdStr = sorted.map((item) => `${item[0]}--${item[1]}`)
  console.log(props.type)
  console.log(list)
  console.log(sortdStr)
  return sorted
}

// 10. 按钮事件
const handleFront = (v: string) => {
  setFront(v)
}
const handleBack = (v: string) => {
  setBack(v)
}
</script>
