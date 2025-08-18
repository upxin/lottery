<template>
  <el-table
    :data="tableData"
    border
    @header-click="handleHeaderClick"
    ref="tableRef"
    style="width: 1600px"
  >
    <el-table-column
      v-for="col in tableColumns"
      :key="col"
      :prop="col"
      :label="col"
      width="20"
      align="center"
      :resizable="false"
    >
      <template #header>
        <div :class="{ 'high-colum': highlightedNumbers.has(col) }">
          {{ col }}
        </div>
      </template>
      <template #default="scope">
        <div
          :class="{
            'high-colum': highlightedNumbers.has(scope.row[col]) && highlightedNumbers.has(col),
          }"
          @click="handleCellClick(scope.row[col], col)"
        >
          {{ scope.row[col] || '' }}
        </div>
      </template>
    </el-table-column>
  </el-table>

  <div ref="footerRef" class="c-bottom">
    <el-select
      v-model="currentHis"
      size="small"
      placeholder="选择期号"
      class="mr-10px"
      filterable
      style="width: 180px"
      @change="handlePeriodChange"
    >
      <el-option
        v-for="period in availablePeriods"
        :key="period"
        :label="period.toString()"
        :value="period"
      ></el-option>
    </el-select>
    <el-button
      type="primary"
      @click="currentHis = minHis"
      size="small"
      class="mr-2"
      :disabled="currentHis === minHis"
    >
      最早一期
    </el-button>
    <el-button
      type="primary"
      @click="prevHis"
      size="small"
      class="ml-2"
      :disabled="currentHis === minHis"
    >
      上一期
    </el-button>
    <el-button
      type="primary"
      @click="nextHis"
      size="small"
      class="mr-2"
      :disabled="currentHis === maxHis"
    >
      下一期
    </el-button>
    <el-button
      type="primary"
      @click="currentHis = maxHis"
      size="small"
      class="mr-2"
      :disabled="currentHis === maxHis"
    >
      最新一期
    </el-button>
    <el-button type="primary" @click="copyTable" size="small"> 复制表格数据 </el-button>
    <el-button type="success" @click="copyHighlighted" size="small"> 复制高亮数据 </el-button>
    <el-button @click="clear" :type="'danger'">
      {{ '清空高亮' }}
    </el-button>
    <el-button @click="toggle()">显示模拟盘</el-button>
  </div>

  <Mock
    type="35: 17 20"
    v-show="showPanel"
    :content="Content35"
    @close="toggle()"
    :front="Array.from(highlightedNumbers)"
    btype="35"
  ></Mock>
  <Mock
    type="30: 17 20"
    v-show="showPanel"
    :content="Content30"
    @close="toggle()"
    :front="Array.from(highlightedNumbers)"
    btype="30"
  ></Mock>
  <Mock
    type="25: 16 20"
    v-show="showPanel"
    :content="Content25"
    @close="toggle()"
    :front="Array.from(highlightedNumbers)"
    btype="25"
  ></Mock>
  <Mock
    type="20: 15 20"
    v-show="showPanel"
    :content="Content20"
    @close="toggle()"
    :front="Array.from(highlightedNumbers)"
    :btype="'20: 15 20'"
  ></Mock>
  <Mock
    type="*15: 13 20"
    v-show="showPanel"
    :content="Content15"
    @close="toggle()"
    :front="Array.from(highlightedNumbers)"
    :btype="'15: 13 20'"
  ></Mock>
  <Mock
    type="*10: 20 10"
    v-show="showPanel"
    :content="Content10"
    @close="toggle()"
    :front="Array.from(highlightedNumbers)"
    :btype="'10: 10 20'"
  ></Mock>
</template>

<script lang="ts" setup>
import Mock from '../components/Mock.vue'

// 导入模拟盘内容
import Content10 from '#/kl8/KL810.txt?raw'
import Content15 from '#/kl8/KL815.txt?raw'
import Content20 from '#/kl8/KL820.txt?raw'
import Content25 from '#/kl8/KL825.txt?raw'
import Content30 from '#/kl8/KL830.txt?raw'
import Content35 from '#/kl8/KL835.txt?raw'
const title = useTitle()

// 模拟盘控制
const [showPanel, toggle] = useToggle(true)

// 数据导入
const his = import.meta.glob('./hisData/*.ts', { eager: true })
const curData = {
  ...import.meta.glob('./[1-9].ts', { eager: true }),
  ...import.meta.glob('./[1-9][0-9].ts', { eager: true }),
  ...import.meta.glob('./1[0-9][0-9].ts', { eager: true }),
  ...import.meta.glob('./2[0-9][0-9].ts', { eager: true }),
  ...import.meta.glob('./3[0-9][0-9].ts', { eager: true }),
}
const files = Object.assign({}, his, curData)

// 期号相关
const availablePeriods = ref<number[]>([])
const currentHis = ref<number>(0)
const currentData = ref<{ g1: (string | number)[]; ipt: string }>({ g1: [], ipt: '' })

// 表头：严格"01"到"80"（1-80的两位数格式）
const tableColumns = ref<string[]>(
  Array.from({ length: 80 }, (_, i) => (i + 1).toString().padStart(2, '0')),
)
const tableData = ref<any[]>([])
const tableRef = ref<any>(null)

// 高亮状态：仅使用一个Set存储字符串（列名和数值）
const highlightedNumbers = ref<Set<string>>(new Set())

// 单元格点击：切换数值高亮
function handleCellClick(value: string | undefined, column: string) {
  if (!value) return

  // 基于同一个Set操作，确保响应式更新
  const newSet = new Set(highlightedNumbers.value)
  if (newSet.has(value)) {
    newSet.delete(value)
  } else {
    newSet.add(value)
  }
  highlightedNumbers.value = newSet
}

// 初始化
onMounted(() => {
  const periods = Object.keys(files)
    .map((path) => {
      const match = path.match(/(\d+)\.ts$/)
      return match ? parseInt(match[1], 10) : null
    })
    .filter((period) => period !== null) as number[]

  availablePeriods.value = [...new Set(periods)].sort((a, b) => a - b)

  if (availablePeriods.value.length > 0) {
    currentHis.value = Math.max(...availablePeriods.value)
    loadPeriodData(currentHis.value)
  }
})

// 期号计算
const maxHis = computed(() => Math.max(...availablePeriods.value, 0))
const minHis = computed(() => Math.min(...availablePeriods.value, 0))

// 加载数据
function loadPeriodData(period: number) {
  const filePath = Object.keys(files).find((path) => path.includes(`${period}.ts`))
  if (!filePath) return

  const module = files[filePath] as any
  if (module && module.g1 && module.ipt) {
    currentData.value = {
      g1: module.g1,
      ipt: module.ipt,
    }

    parseAndRenderTable(module.ipt)
    setDefaultHighlight(module.g1)
  }
}

// 解析表格：数值严格对应列名（07列只显示"07"）
function parseAndRenderTable(iptContent: string) {
  const lines = iptContent.trim().split('\n')
  const rowData = lines.map((line) => {
    // 提取有效两位数字
    const cleanLine = line.replace(/[^\d]/g, '')
    const validNumbers = new Set<string>()
    for (let i = 0; i < cleanLine.length; i += 2) {
      const numStr = cleanLine.slice(i, i + 2)
      const num = parseInt(numStr, 10)
      if (num >= 1 && num <= 80) {
        validNumbers.add(numStr)
      }
    }

    // 构建行数据：列名存在于有效数字中则显示，否则空
    const row: Record<string, string> = {}
    tableColumns.value.forEach((col) => {
      row[col] = validNumbers.has(col) ? col : ''
    })

    return row
  })
  tableData.value = rowData
}

// 设置默认高亮：将g1数据转为两位数字符串存入Set
function setDefaultHighlight(g1Data: (string | number)[]) {
  const newSet = new Set<string>()
  g1Data.forEach((item) => {
    // 统一转为"01"格式的字符串
    const num = Number(item)
    if (!isNaN(num) && num >= 1 && num <= 80) {
      newSet.add(num.toString().padStart(2, '0'))
    }
  })
  // 默认同时高亮对应列
  tableColumns.value.forEach((col) => {
    if (newSet.has(col)) {
      newSet.add(col)
    }
  })
  highlightedNumbers.value = newSet
}

// 表头点击：切换列高亮
function handleHeaderClick(column: any) {
  const colName = String(column.label || '').trim()
  if (!tableColumns.value.includes(colName)) return

  // 基于同一个Set操作，确保响应式更新
  const newSet = new Set(highlightedNumbers.value)
  if (newSet.has(colName)) {
    newSet.delete(colName)
  } else {
    newSet.add(colName)
  }
  highlightedNumbers.value = newSet
}

// 期号变更
function handlePeriodChange(period: number) {
  loadPeriodData(period)
}

// 上一期
function prevHis() {
  const currentIndex = availablePeriods.value.indexOf(currentHis.value)
  if (currentIndex > 0) {
    currentHis.value = availablePeriods.value[currentIndex - 1]
  }
}

// 下一期
function nextHis() {
  const currentIndex = availablePeriods.value.indexOf(currentHis.value)
  if (currentIndex < availablePeriods.value.length - 1) {
    currentHis.value = availablePeriods.value[currentIndex + 1]
  }
}

// 清空高亮
function clear() {
  highlightedNumbers.value = new Set()
}

// 复制表格数据
function copyTable() {
  let text = ''
  text += tableColumns.value.join('\t') + '\n'
  tableData.value.forEach((row) => {
    const rowData = tableColumns.value.map((col) => row[col] || '')
    text += rowData.join('\t') + '\n'
  })

  navigator.clipboard
    .writeText(text)
    .then(() => ElMessage.success('表格数据已复制'))
    .catch((err) => {
      console.error('复制失败:', err)
      ElMessage.error('复制失败，请手动复制')
    })
}

// 复制高亮数据
function copyHighlighted() {
  const highlighted = new Set<string>()
  tableData.value.forEach((row) => {
    tableColumns.value.forEach((col) => {
      const value = row[col]
      if (value && highlightedNumbers.value.has(value) && highlightedNumbers.value.has(col)) {
        highlighted.add(value)
      }
    })
  })

  const text = Array.from(highlighted).join(' ')
  navigator.clipboard
    .writeText(text)
    .then(() => ElMessage.success('高亮数据已复制'))
    .catch((err) => {
      console.error('复制失败:', err)
      ElMessage.error('复制失败，请手动复制')
    })
}

// 监听期号变化
watch(
  () => currentHis.value,
  (v) => {
    title.value = `kl8${v}`
  },
)

function setFront(v) {
  if (highlightedNumbers.value.has(v)) {
    highlightedNumbers.value.delete(v)
  } else {
    highlightedNumbers.value.add(v)
  }
}
provide('showBack', { setFront })
provide('maxHis', maxHis)
provide('currentHis', currentHis)
</script>
