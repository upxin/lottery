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
            :type="selectedFront.has(c) ? 'success' : 'default'"
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
            :type="selectedBack.has(c) ? 'success' : 'default'"
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
// 1. 注入父组件依赖
interface ShowBackInject {
  showBack: boolean
  setFront: (num: number) => void
  setBack: (num: number) => void
}
const { showBack, setFront, setBack } = inject<ShowBackInject>('showBack', {
  showBack: false,
  setFront: () => {},
  setBack: () => {},
})

// 2. Props定义
interface MockProps {
  front: number[]
  back?: number[]
  type?: string | number
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
  initPos.value = { x: 0, y: 10 }
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

// 6. 注入期号（重点：初始化时 currentHis 默认为 maxHis）
const currentHis = inject<{ value: string | number }>('currentHis', { value: '0' })
const maxHis = inject<{ value: string | number }>('maxHis', { value: '0' })

// 🔴 核心优化：按“期号差值”计算窗口索引（完全贴合你的需求）
const getExactIndex = (windowList: string[]) => {
  if (windowList.length === 0) return 0

  // 转为数字（容错：非数字时取最后一项）
  const current = Number(currentHis.value)
  const max = Number(maxHis.value)
  if (isNaN(current) || isNaN(max)) return windowList.length - 1

  // 关键：计算“当前期号与最大期号的差值”（偏移量）
  const diff = max - current // 例：max=100, current=89 → diff=11
  // 窗口索引 = 窗口总数 - 1 - 偏移量 → 即“倒数第 N 个窗口”
  // 例：窗口数=20 → 20-1-11=8 → 取第8个索引（对应倒数第11个窗口）
  let index = windowList.length - 1 - diff

  // 边界保护：偏移量超过窗口总数时，取第0个；偏移量为负时，取最后一个
  index = Math.max(0, Math.min(index, windowList.length - 1))
  console.log(index)
  return index
}

// 7. 内容更新（用新索引方法匹配窗口）
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

// 8. 选中状态同步
const selectedFront = ref(new Set<string>())
const selectedBack = ref(new Set<string>())
const syncSelected = () => {
  selectedFront.value.clear()
  props.front.forEach((n) => selectedFront.value.add(n.toString().padStart(2, '0')))
  selectedBack.value.clear()
  props.back?.forEach((n) => selectedBack.value.add(n.toString().padStart(2, '0')))
}

// 9. 监听触发（确保初始化和变化时都匹配）
// 初始化时：若 currentHis 未同步为 maxHis，强制同步（贴合你的“初始化current=max”需求）
watch(
  [currentHis, maxHis],
  () => {
    const current = Number(currentHis.value)
    const max = Number(maxHis.value)
    // 初始化时强制 currentHis = maxHis（若父组件未处理）
    if (current !== max && current === 0) {
      currentHis.value = max.toString()
    }
    updateFront()
    updateBack()
    syncSelected()
  },
  { immediate: true },
)

// 窗口内容变化时更新
watch(
  [() => props.content, () => props.contentBack],
  () => {
    windows.value = splitWindows(props.content)
    bwindows.value = splitWindows(props.contentBack)
    updateFront()
    updateBack()
  },
  { immediate: true },
)

// 选中数字变化时同步
watch([() => props.front, () => props.back], syncSelected, { deep: true, immediate: true })

// 10. 按钮事件
const handleFront = (v: string) => {
  const num = parseInt(v)
  !isNaN(num) && setFront(num)
}
const handleBack = (v: string) => {
  const num = parseInt(v)
  !isNaN(num) && setBack(num)
}
</script>

<style scoped>
.text-amber {
  color: #ff9f43;
  font-weight: 500;
  margin-bottom: 8px;
}
.flex {
  display: flex;
  align-items: center;
}
.flex-wrap {
  flex-wrap: wrap;
}
.flex-1 {
  flex: 1;
}
.w-42px {
  width: 42px;
  text-align: right;
  margin-right: 8px;
}
</style>
