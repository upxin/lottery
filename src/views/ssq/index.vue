<template>
  <section>
    <el-table
      class="mx-auto"
      style="width: 1240px"
      :data="parsedRows"
      border
      size="small"
      :height="getHeight"
    >
      <el-table-column type="index" width="24px" label="In" align="center"></el-table-column>

      <!-- 前区列（N1-N33） -->
      <el-table-column
        v-for="col in headers33"
        :key="col.prop"
        :prop="col.prop"
        :label="col.label"
        :width="24"
        align="center"
      >
        <template #header>
          <div @click.stop="toggleHighlight(col.prop)">
            {{ col.label }}
          </div>
        </template>
        <template #default="{ row }">
          <div :class="getCellClass(col.prop, row)">{{ row[col.prop] }}</div>
        </template>
      </el-table-column>

      <!-- 分隔列 -->
      <el-table-column label="," prop="comma" width="40" align="center">
        <template #header>
          <div class="comma-header">{{ ',' }}</div>
        </template>
        <template #default="{ row }">
          <div :class="getCommaClass(row)">{{ row.comma }}</div>
        </template>
      </el-table-column>

      <!-- 后区列（H1-H16） -->
      <el-table-column
        v-for="col in headers16"
        :key="col.prop"
        :prop="col.prop"
        :label="col.label"
        :width="24"
        align="center"
      >
        <template #header>
          <div @click.stop="toggleHighlight(col.prop)">
            {{ col.label }}
          </div>
        </template>
        <template #default="{ row }">
          <div :class="getCellClass(col.prop, row)">{{ row[col.prop] }}</div>
        </template>
      </el-table-column>
    </el-table>

    <div ref="footerRef" class="c-bottom">
      <el-button
        type="primary"
        @click="prevHis"
        :disabled="currentHis <= minHis"
        size="small"
        class="ml-2"
      >
        上一个
      </el-button>
      <el-button text class="mx-2" type="success" disabled> {{ currentHis }} </el-button>
      <el-button
        type="primary"
        @click="nextHis"
        :disabled="currentHis >= maxHis"
        size="small"
        class="mr-2"
      >
        下一个
      </el-button>
      <el-button type="primary" @click="currentHis = maxHis" size="small" class="mr-2">
        new
      </el-button>
      <el-button type="primary" @click="toggle()" size="small">
        {{ showDot ? '显示数字' : '显示圆点' }}
      </el-button>
      <el-button type="primary" @click="copy" size="small"> copy </el-button>
    </div>
  </section>
</template>

<script setup lang="ts">
const router = useRouter()
const title = useTitle()
title.value = 'ssq'

const footerRef = ref<HTMLElement | null>(null)
const { height: windowHeight } = useWindowSize()
const { height: footerHeight } = useElementSize(footerRef)
const [showDot, toggle] = useToggle(false)
const extraSpace = 10

// 加载历史数据文件
const files = import.meta.glob('./hisData/*.ts', { eager: true })
const hisNums = Object.keys(files)
  .map((path) => {
    const m = path.match(/(\d+)\.ts$/)
    return m ? Number(m[1]) : undefined
  })
  .filter((n): n is number => typeof n === 'number')
  .sort((a, b) => a - b)

const minHis = Math.min(...hisNums)
const maxHis = Math.max(...hisNums)
const currentHis = ref(maxHis)

const g1 = ref<number[]>([]) // 前区特殊标记
const g2 = ref<number[]>([]) // 后区特殊标记
const ipt = ref('') // 原始数据文本

// 高亮状态管理
const highlighted = reactive({
  n: new Set<number>(), // 前区高亮状态 (1-33)
  h: new Set<number>(), // 后区高亮状态 (1-16)
})

// 初始化高亮状态
const syncHighlightFromData = () => {
  highlighted.n.clear()
  highlighted.h.clear()
  g1.value.forEach((num) => highlighted.n.add(num))
  g2.value.forEach((num) => highlighted.h.add(num))
}

// 加载数据函数
const loadData = async () => {
  const loading = ElLoading.service({
    lock: true,
    text: '加载中...',
    background: 'rgba(0, 0, 0, 0.7)',
    target: document.body,
  })

  try {
    const filePath = Object.keys(files).find((p) => p.endsWith(`${currentHis.value}.ts`))
    if (!filePath) throw new Error('未找到数据模块')

    const mod: any = files[filePath]
    g1.value = Array.isArray(mod?.g1) ? mod.g1 : []
    g2.value = Array.isArray(mod?.g2) ? mod.g2 : []
    ipt.value = typeof mod?.ipt === 'string' ? mod.ipt : ''

    // 同步高亮状态
    syncHighlightFromData()

    title.value = `ssq #${currentHis.value}`
  } catch (e: any) {
    ElMessage.error('数据加载失败：' + (e?.message ?? e))
    g1.value = []
    g2.value = []
    ipt.value = ''
  } finally {
    loading.close()
  }
}

// 解析列属性（如 "N12" -> {type: "N", index: 12}）
const parseColumnProp = (prop: string) => {
  const match = prop.match(/^([NH])(\d+)$/)
  if (!match) return null
  return {
    type: match[1] as 'N' | 'H',
    index: parseInt(match[2], 10),
  }
}

// 表头样式
const getHeaderClass = (prop: string) => {
  const parsed = parseColumnProp(prop)
  if (!parsed) return ''

  const isHighlighted =
    parsed.type === 'N' ? highlighted.n.has(parsed.index) : highlighted.h.has(parsed.index)

  return isHighlighted ? (parsed.type === 'N' ? 'header-highlight-n' : 'header-highlight-h') : ''
}

// 单元格样式
const getCellClass = (prop: string, row: any) => {
  const parsed = parseColumnProp(prop)
  if (!parsed || !row[prop]) return ''

  const isHighlighted =
    parsed.type === 'N' ? highlighted.n.has(parsed.index) : highlighted.h.has(parsed.index)

  return isHighlighted
    ? parsed.type === 'N'
      ? 'cell-highlight-n-primary'
      : 'cell-highlight-h-primary'
    : parsed.type === 'N'
      ? 'cell-highlight-n-default'
      : 'cell-highlight-h-default'
}

// 切换高亮状态
const toggleHighlight = (prop: string) => {
  const parsed = parseColumnProp(prop)
  if (!parsed) return

  const set = parsed.type === 'N' ? highlighted.n : highlighted.h

  if (set.has(parsed.index)) {
    set.delete(parsed.index)
  } else {
    set.add(parsed.index)
  }
}

// 分隔列样式
const getCommaClass = (row: any) => {
  return row._doubleComma ? 'comma-cell-double' : 'comma-cell-single'
}

// 解析原始数据为表格行
const parsedRows = computed(() => {
  if (!ipt.value || typeof ipt.value !== 'string') return []

  const lines = ipt.value.trim().split('\n')
  const rows: any[] = []

  for (const [lineIndex, line0] of lines.entries()) {
    const line = line0.replace(/\s+/g, '')
    if (!line) continue

    let main = '',
      tail = '',
      isDoubleComma = false

    if (line.includes(',,') && line.split(',,').length === 2) {
      ;[main, tail] = line.split(',,')
      isDoubleComma = true
    } else if (line.includes(',')) {
      ;[main, tail] = line.split(',')
      isDoubleComma = false
    } else {
      main = line
      tail = ''
      isDoubleComma = false
    }

    // 验证并过滤非法数据
    const mainArr =
      main.match(/\d{2}/g)?.filter((n) => /^\d{2}$/.test(n) && +n >= 1 && +n <= 33) || []
    const tailArr =
      tail.match(/\d{2}/g)?.filter((n) => /^\d{2}$/.test(n) && +n >= 1 && +n <= 16) || []

    if (mainArr.length === 0 || tailArr.length === 0) continue

    const row: Record<string, any> = {}

    // 填充前区数据
    headers33.value.forEach((h, idx) => {
      const num = String(idx + 1).padStart(2, '0')
      row[h.prop] = mainArr.includes(num) ? (showDot.value ? '●' : num) : ''
    })

    // 填充分隔列
    row['comma'] = String(mainArr.length)
    row['_commaRaw'] = mainArr.length
    row['_doubleComma'] = isDoubleComma

    // 填充后区数据
    headers16.value.forEach((h, idx) => {
      const num = String(idx + 1).padStart(2, '0')
      row[h.prop] = tailArr.includes(num) ? (showDot.value ? '●' : num) : ''
    })

    rows.push(row)
  }

  // 按前区数量排序
  return rows.sort((a, b) => b._commaRaw - a._commaRaw)
})

// 前区列配置
const headers33 = computed(() =>
  Array.from({ length: 33 }, (_, i) => ({
    label: String(i + 1).padStart(2, '0'),
    prop: `N${i + 1}`,
    width: 24,
  })),
)

// 后区列配置
const headers16 = computed(() =>
  Array.from({ length: 16 }, (_, i) => ({
    label: String(i + 1).padStart(2, '0'),
    prop: `H${i + 1}`,
    width: 24,
  })),
)

// 复制功能
const copy = () => {
  if (!ipt.value || typeof ipt.value !== 'string') {
    ElMessage.warning('没有可复制的数据')
    return
  }

  const lines = ipt.value.trim().split('\n')
  const result: string[] = []

  for (const line0 of lines) {
    const line = line0.replace(/\s+/g, '')
    if (!line) continue

    let main = '',
      tail = '',
      sep = ''

    if (line.includes(',,') && line.split(',,').length === 2) {
      ;[main, tail] = line.split(',,')
      sep = ',,'
    } else if (line.includes(',')) {
      ;[main, tail] = line.split(',')
      sep = ','
    } else {
      continue
    }

    if (main && tail) {
      result.push(main + sep + tail)
    }
  }

  // 按前区长度排序
  const sortedResult = result
    .sort((a, b) => {
      const aLen = a.split(/,+/)[0].length
      const bLen = b.split(/,+/)[0].length
      return bLen - aLen
    })
    .join('\n')

  if (!sortedResult) {
    ElMessage.warning('没有可复制的内容')
    return
  }

  navigator.clipboard
    .writeText(sortedResult)
    .then(() => ElMessage.success('已复制'))
    .catch(() => ElMessage.error('复制失败'))
}

// 数据导航
const prevHis = () => {
  const idx = hisNums.indexOf(currentHis.value)
  if (idx > 0) {
    currentHis.value = hisNums[idx - 1]
  }
}

const nextHis = () => {
  const idx = hisNums.indexOf(currentHis.value)
  if (idx >= 0 && idx < hisNums.length - 1) {
    currentHis.value = hisNums[idx + 1]
  }
}

const jumph = () => {
  const fullPath = router.resolve('/ssq').href
  window.open(fullPath, '_blank')
}

// 表格高度计算
const getHeight = computed(() => {
  return windowHeight.value - (footerHeight.value || 0) - extraSpace
})

// 生命周期钩子
onMounted(() => {
  loadData()
})

// 监听数据变化
watch(currentHis, loadData)
watch([g1, g2], syncHighlightFromData)
</script>

<style scoped>
/* 表格基础样式 */
:deep(.el-table--small .cell) {
  padding: 0;
  text-align: center;
}
:deep(.el-table--small .el-table__cell) {
  padding: 0;
}

/* 前区（N）高亮样式 */
.header-highlight-n {
  background-color: #fff6e6 !important;
  color: #e67c00 !important;
  font-weight: bold;
  cursor: pointer;
}
.cell-highlight-n-primary {
  background-color: #fff6e6 !important;
  color: #e67c00 !important;
  font-weight: bold;
}
.cell-highlight-n-default {
  font-weight: bold;
}

.header-highlight-h {
  background-color: #d0f2fc !important;
  color: #2b7abf !important;
  font-weight: bold;
  cursor: pointer;
}
.cell-highlight-h-primary {
  background-color: #d0f2fc !important;
  color: #2b7abf !important;
  font-weight: bold;
}
.cell-highlight-h-default {
  font-weight: bold;
}

/* 分隔列样式 */
:deep(.comma-header) {
  background-color: #efefef !important;
  color: #333 !important;
  font-weight: bold;
}
:deep(.comma-cell-single) {
  background-color: #f3f3f3 !important;
  color: #2c3e50 !important;
  font-weight: bold;
}
:deep(.comma-cell-double) {
  background-color: #ffe4ec !important;
  color: #e33 !important;
  font-weight: bold;
}
</style>
