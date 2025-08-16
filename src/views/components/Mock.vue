<template>
  <section
    w-500px
    z-9999
    class="bg-white text-fuchsia shadow-md shadow-coolGray pb-10px pt-14px pl-10px rounded-md fixed box-border"
    ref="draggableRef"
    :style="style"
  >
    <!-- 前区标题 -->
    <div text-amber v-if="type && !showBack">前区: {{ type }}</div>
    <!-- 前区按钮列表 -->
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

    <!-- 后区标题（控制显示） -->
    <div text-amber v-if="btype && showBack">后区: {{ btype }}</div>
    <!-- 后区按钮列表（控制显示） -->
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

    <!-- 操作按钮组 -->
    <div class="flex justify-center mt-6 gap-4">
      <el-button @click="copy" size="small">复制</el-button>
      <el-button @click="reset" size="small">重置位置</el-button>
      <el-button @click="emits('close')" type="danger" size="small">关闭</el-button>
    </div>
  </section>
</template>

<script setup lang="ts">
// 1. 注入父组件提供的状态和方法
interface ShowBackInject {
  showBack: boolean
  setFront: (num: number) => void
  setBack: (num: number) => void
}
const { showBack, setBack, setFront } = inject<ShowBackInject>('showBack', {
  showBack: false,
  setFront: () => {},
  setBack: () => {},
})

// 2. 定义Props类型并设置默认值（明确类型，避免any）
interface MockProps {
  front: number[] // 前区高亮数字（父组件传入）
  back: number[] // 后区高亮数字（父组件传入）
  type?: string | number // 前区标题
  content: string // 前区Markdown内容
  contentBack?: string // 后区Markdown内容
  btype?: string // 后区标题
}
const props = withDefaults(defineProps<MockProps>(), {
  front: () => [],
  back: () => [],
  contentBack: '',
  btype: '-------',
  type: '',
})

// 3. 拖拽功能配置（使用useStorage持久化位置，修复reset逻辑）
const draggableRef = ref<HTMLElement | null>(null)
const emits = defineEmits<{ (e: 'close'): void }>()
// 用type作为storage的key，避免多Mock组件位置冲突
const storageKey = `mock_pos_${String(props.type || 'default')}`
const initPos = useStorage(storageKey, { x: 0, y: 10 })
const { style } = useDraggable(draggableRef, {
  initialValue: initPos.value,
  onEnd(position) {
    initPos.value = position // 拖拽结束才更新位置，减少响应式触发
  },
})

// 4. 重置位置（仅清除当前组件的位置缓存，不影响其他组件）
const reset = () => {
  initPos.value = { x: 0, y: 10 } // 重置为初始位置
  ElMessage.success('位置已重置')
}

// 5. 解析Markdown内容的类型定义（明确数据结构）
interface ParsedGroup {
  percent: string
  numbers: string[]
}
const parsedData = ref<ParsedGroup[]>([]) // 前区解析结果
const parsedDataBack = ref<ParsedGroup[]>([]) // 后区解析结果

// 6. 选中状态管理（使用Set，避免重复值）
const selectedFront = ref(new Set<string>()) // 前区选中的数字（字符串格式，补零后）
const selectedBack = ref(new Set<string>()) // 后区选中的数字（字符串格式，补零后）

// 7. 核心优化：解析Markdown内容的工具函数（纯函数，无响应式副作用）
const parsePart = (partContent: string): ParsedGroup[] => {
  const percentGroups: ParsedGroup[] = []
  if (!partContent) return percentGroups // 空内容直接返回，避免无效循环

  partContent.split('\n').forEach((line) => {
    line = line.trim()
    if (!line || !line.includes(':')) return // 跳过空行和格式错误的行

    const [percent, numsStr] = line.split(':').map((part) => part.trim())
    if (!percent || !numsStr) return // 缺少关键信息，跳过

    // 解析数字列表，去重+补零+排序（统一格式）
    const numbers = Array.from(new Set(numsStr.split(',').map((num) => num.trim())))
      .filter((num) => /^\d+$/.test(num)) // 过滤非数字
      .map((num) => num.padStart(2, '0')) // 补零为两位数
      .sort((a, b) => Number(a) - Number(b)) // 按数字大小排序

    if (numbers.length) {
      percentGroups.push({ percent, numbers })
    }
  })
  return percentGroups
}

// 8. 核心优化：同步父组件Props到选中状态（仅在数据变化时更新，避免循环）
const setHighlightFromProps = () => {
  // 同步前区选中状态
  const newFrontStrs = props.front
    .filter((num) => Number.isInteger(num) && num > 0) // 过滤无效数字
    .map((num) => num.toString().padStart(2, '0')) // 转为补零字符串
  const newFrontSet = new Set(newFrontStrs)
  // 只有当Set内容变化时才更新，避免无效响应式触发
  if (!isSetsEqual(newFrontSet, selectedFront.value)) {
    selectedFront.value = newFrontSet
  }

  // 同步后区选中状态
  const newBackStrs = props.back
    .filter((num) => Number.isInteger(num) && num > 0)
    .map((num) => num.toString().padStart(2, '0'))
  const newBackSet = new Set(newBackStrs)
  if (!isSetsEqual(newBackSet, selectedBack.value)) {
    selectedBack.value = newBackSet
  }
}

// 辅助函数：判断两个Set是否完全相等（纯函数，无副作用）
const isSetsEqual = (a: Set<string>, b: Set<string>): boolean => {
  if (a.size !== b.size) return false
  for (const item of a) {
    if (!b.has(item)) return false
  }
  return true
}

// 9. 复制选中数据到剪贴板（优化格式和容错）
const copy = () => {
  const frontList = Array.from(selectedFront.value).sort((a, b) => Number(a) - Number(b))
  const backList = Array.from(selectedBack.value).sort((a, b) => Number(a) - Number(b))

  // 格式化复制内容
  let result = ''
  if (frontList.length) result += `前区：${frontList.join(' ')}`
  if (backList.length) result += `${frontList.length ? ' | ' : ''}后区：${backList.join(' ')}`

  if (!result) {
    ElMessage.warning('未选中任何数字')
    return
  }

  // 复制操作（容错处理）
  navigator.clipboard
    .writeText(result)
    .then(() => ElMessage.success('已复制选中数据'))
    .catch(() => ElMessage.error('复制失败，请手动复制'))
}

// 10. 分割Markdown内容为窗口（按分隔符拆分，过滤空窗口）
const splitContentToWindows = (content: string): string[] => {
  return content
    .split('---separator---')
    .map((window) => window.trim())
    .filter(Boolean) // 过滤空窗口
}

const currentHis = inject<{ value: string | number }>('currentHis', { value: '0' })
const maxHis = inject<{ value: string | number }>('maxHis', { value: '0' })

// 12. 前区内容处理（监听content变化，解析并同步状态）
const windows = splitContentToWindows(props.content)
const index = ref(maxHis.value)
const markdownContent = ref(windows[index.value] || '')

// 13. 后区内容处理（同理前区）
const bwindows = splitContentToWindows(props.contentBack || '')
const bindex = ref(maxHis.value)
const markdownContentBack = ref(bwindows[bindex.value] || '')

// 14. 监听期号变化，更新窗口索引（避免重复解析）
const getIndexByDifference = (windowList: string[]): number => {
  if (windowList.length === 0) return 0

  const current = Number(currentHis.value)
  const max = Number(maxHis.value)

  // 非数字期号默认取第0个窗口
  if (isNaN(current) || isNaN(max)) return 0

  // 计算差值（最新期号 - 当前期号）
  const difference = max - current

  // 计算目标索引并限制在 [0, windowList.length - 1] 范围内
  let index = windowList.length - 1 - difference
  index = Math.max(0, Math.min(index, windowList.length - 1))

  return index
}

watch(
  () => currentHis.value,
  () => {
    // 1. 更新前区内容索引和内容
    const newIndex = getIndexByDifference(windows)
    if (newIndex !== index.value) {
      // 索引变化时才更新，减少无效渲染
      index.value = newIndex
      markdownContent.value = windows[index.value] || ''
    }

    // 2. 更新后区内容索引和内容
    const newBIndex = getIndexByDifference(bwindows)
    if (newBIndex !== bindex.value) {
      bindex.value = newBIndex
      markdownContentBack.value = bwindows[bindex.value] || ''
    }
  },
  { immediate: true },
)

// 15. 监听前区内容变化，重新解析并同步状态
watch(
  () => markdownContent.value,
  (newContent) => {
    parsedData.value = parsePart(newContent)
    setHighlightFromProps() // 解析后同步选中状态
  },
  { immediate: true },
)

// 16. 监听后区内容变化，重新解析并同步状态
watch(
  () => markdownContentBack.value,
  (newContent) => {
    parsedDataBack.value = parsePart(newContent)
    setHighlightFromProps()
  },
  { immediate: true },
)

// 17. 监听父组件传入的高亮数字变化，同步选中状态
watch(
  [() => props.front, () => props.back],
  () => {
    setHighlightFromProps()
  },
  { deep: true, immediate: true },
)

// 18. 前区按钮点击事件（调用父组件方法，更新全局高亮）
const handleFront = (v: string) => {
  const num = parseInt(v, 10)
  if (!isNaN(num)) setFront(num) // 容错：确保是有效数字
}

// 19. 后区按钮点击事件（同理前区）
const handleBack = (v: string) => {
  const num = parseInt(v, 10)
  if (!isNaN(num)) setBack(num)
}
</script>

<style scoped>
/* 可选：补充组件样式，避免依赖全局样式冲突 */
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
.gap-4 {
  gap: 4px;
}
</style>
