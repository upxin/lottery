<template>
  <div>
    <el-table :data="dataSource" border style="width: 1782px" class="mx-auto">
      <!-- 使用 v-for 生成列 -->
      <el-table-column
        v-for="column in columns"
        :key="column.key"
        :prop="column.dataIndex"
        :label="column.title"
        :align="column.align"
        :width="22"
      >
        <!-- 表头模板 -->
        <template #header>
          <div
            :class="getHeaderClass(column.dataIndex)"
            @click="handleHeaderClick(column.dataIndex)"
          >
            {{ column.title }}
          </div>
        </template>

        <!-- 单元格模板 -->
        <template #default="{ row }">
          <div :class="getCellClass(column.dataIndex)">
            {{ row[column.dataIndex] }}
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 底部控制栏保持不变 -->
    <div c-bottom>
      <el-button type="primary" @click="minData">{{ minIndex }}</el-button>
      <el-button type="primary" @click="prevData">上一个数据</el-button>
      <el-button type="primary" @click="nextData">下一个数据</el-button>
      <el-button type="primary" @click="maxData">{{ maxIndex }}</el-button>
      <el-button @click="copyToClipboard" type="primary">复制高亮数据</el-button>
      <el-button @click="clear" type="primary">清空</el-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
const router = useRouter()
const title = useTitle()
title.value = 'kl8'

// 加载数据文件
const files = import.meta.glob('./data/*')
const names = Object.keys(files).map((key) => key.split('/').pop())

const minIndex = names[0]?.split('.')[0]
const maxIndex = names[names.length - 1]?.split('.')[0]
const currentIndex = ref(maxIndex)
const errorMessage = ref<string | null>(null)
const errorLine = ref<string | null>(null)
const isError = ref(false)
const columnCount = 81

// 默认高亮列（转换为0-80的索引）
const defaultHighlighted = [
  1, 7, 13, 17, 22, 23, 38, 40, 41, 45, 46, 52, 53, 60, 66, 68, 69, 70, 71, 78,
]
const highlightedColumns = reactive(new Set<number>(defaultHighlighted.map((i) => i - 1)))

// 生成列配置（使用 dataIndex 而非 _idx）
const columns = computed(() =>
  Array.from({ length: columnCount }, (_, index) => ({
    title: index === 80 ? 'EX' : `${(index + 1).toString().padStart(2, '0')}`,
    dataIndex: `column_${index}`, // 格式为 "column_0", "column_1", ...
    key: `column_${index}`,
    align: 'center',
    index: index, // 保存原始索引（0-80）
  })),
)

// 根据 dataIndex 获取列索引（例如 "column_15" -> 15）
const getDataIndex = (dataIndex: string) => {
  const match = dataIndex.match(/\d+/)
  return match ? parseInt(match[0]) : -1
}

// 获取表头样式
const getHeaderClass = (dataIndex: string) => {
  const colIndex = getDataIndex(dataIndex)
  return colIndex !== -1 && highlightedColumns.has(colIndex) && colIndex !== 80
    ? 'highlighted-header'
    : ''
}

// 获取单元格样式
const getCellClass = (dataIndex: string) => {
  const colIndex = getDataIndex(dataIndex)
  return colIndex !== -1 && highlightedColumns.has(colIndex) && colIndex !== 80
    ? 'highlighted-cell'
    : ''
}

// 表头点击事件处理
const handleHeaderClick = (dataIndex: string) => {
  const colIndex = getDataIndex(dataIndex)
  if (colIndex === -1 || colIndex === 80) return

  if (highlightedColumns.has(colIndex)) {
    highlightedColumns.delete(colIndex)
  } else {
    highlightedColumns.add(colIndex)
  }
}

// 数据源
const dataSource = ref<any[]>([])

// 加载数据函数
const loadData = async (index: number) => {
  const loading = ElLoading.service()
  isError.value = false
  errorMessage.value = null
  errorLine.value = null
  title.value = index.toString()

  try {
    const fileName = `./data/${index.toString().padStart(3, '0')}.ts`
    const loader = files[fileName]
    if (!loader) throw new Error('数据文件不存在')

    const dataModule = await loader()
    const ipt = dataModule.ipt || ''

    // 清空当前高亮列并应用新的高亮配置
    highlightedColumns.clear()
    if (Array.isArray(dataModule.isRedList)) {
      dataModule.isRedList.forEach((i: number) => {
        if (i >= 1 && i <= 80) {
          highlightedColumns.add(i - 1)
        }
      })
    }

    // 解析数据行
    const lines = ipt
      .trim()
      .split('\n')
      .filter((line) => line.trim() !== '')

    if (lines.length === 0) throw new Error('没有有效的数据行')

    const parsedData = lines.map((line, lineIndex) => {
      const [mainPart, extraRaw] = line.split(',')
      const cleanedLine = mainPart.replace(/\s/g, '')

      // 验证数据长度
      if (cleanedLine.length % 2 !== 0) {
        errorLine.value = line
        throw new Error(`第 ${lineIndex + 1} 行数据长度不是偶数，请检查：${line}`)
      }

      // 解析数字
      const numbers: string[] = []
      for (let i = 0; i < cleanedLine.length; i += 2) {
        const number = cleanedLine.slice(i, i + 2)
        const numValue = parseInt(number, 10)

        if (isNaN(numValue) || numValue < 1 || numValue > 80) {
          errorLine.value = line
          throw new Error(`第 ${lineIndex + 1} 行中数字 ${number} 不在 01-80 范围内，请检查`)
        }

        numbers.push(number)
      }

      // 处理附加号码（EX列）
      let extraValue = ''
      if (extraRaw) {
        const n = parseInt(extraRaw.trim(), 10)
        if (!isNaN(n) && n >= 1 && n <= 10) {
          extraValue = n.toString().padStart(2, '0')
        }
      }

      // 构建行数据对象
      const rowData: Record<string, string> = {}
      for (let i = 0; i < columnCount; i++) {
        rowData[`column_${i}`] = ''
      }

      // 填充数据
      numbers.forEach((num) => {
        const columnIndex = parseInt(num, 10) - 1
        rowData[`column_${columnIndex}`] = num
      })

      rowData[`column_80`] = extraValue // EX列

      return { key: `row_${lineIndex}`, ...rowData }
    })

    dataSource.value = parsedData
  } catch (error) {
    isError.value = true
    if (error instanceof Error) {
      errorMessage.value = error.message
      console.error('解析错误:', error.message)
    } else {
      errorMessage.value = '解析表格数据时发生未知错误'
      console.error('解析错误:', error)
    }
  } finally {
    loading.close()
  }
}

// 数据导航函数
const prevData = () => {
  if (currentIndex.value && minIndex && parseInt(currentIndex.value) > parseInt(minIndex)) {
    currentIndex.value = (parseInt(currentIndex.value) - 1).toString()
    loadData(parseInt(currentIndex.value))
  }
}

const nextData = () => {
  if (currentIndex.value && maxIndex && parseInt(currentIndex.value) < parseInt(maxIndex)) {
    currentIndex.value = (parseInt(currentIndex.value) + 1).toString()
    loadData(parseInt(currentIndex.value))
  }
}

const maxData = () => {
  if (maxIndex) loadData(parseInt(maxIndex))
}

const minData = () => {
  if (minIndex) loadData(parseInt(minIndex))
}

// 复制高亮列到剪贴板
const copyToClipboard = () => {
  const text = Array.from(highlightedColumns)
    .sort((a, b) => a - b)
    .filter((idx) => idx !== 80) // 排除EX列
    .map((idx) => (idx + 1).toString().padStart(2, '0'))
    .join(',')

  navigator.clipboard
    .writeText(text)
    .then(() => {
      console.log('已复制到剪贴板:', text)
    })
    .catch((err) => {
      console.error('复制失败:', err)
    })
}

// 清空高亮列
const clear = () => {
  highlightedColumns.clear()
}

// 生命周期钩子
onMounted(() => {
  if (currentIndex.value) loadData(parseInt(currentIndex.value))
})

// 错误消息监听
watch(
  () => errorMessage.value,
  (v) => {
    if (v) {
      ElMessageBox.confirm(v, '错误提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'error',
      })
    }
  },
)
</script>

<style scoped>
/* 表格样式 */
:deep(.el-table--small .el-table__cell) {
  padding: 0 !important;
  text-align: center;
  font-size: 12px;
  height: 24px;
}

/* 高亮表头样式 */
.highlighted-header {
  background-color: #fdd835 !important;
  color: #222 !important;
  font-weight: bold !important;
}

/* 高亮单元格样式 */
.highlighted-cell {
  background-color: #ffe082 !important;
  color: #222 !important;
  font-weight: bold !important;
}

/* 非空单元格样式 */
:deep(.el-table__body .el-table__cell:not(:empty)) {
  background-color: #f0f9ff;
}

:deep(.el-table--small .cell) {
  padding: 0;
}
:deep(.el-table--small .el-table__cell) {
  padding: 0;
}
</style>
