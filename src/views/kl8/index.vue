<template>
  <div>
    <!-- 数据切换按钮 -->
    <div class="data-switch">
      <a-button type="primary" @click="prevData" :disabled="currentIndex <= minIndex">
        上一个数据
      </a-button>
      <span class="current-index">当前数据: {{ currentIndex.toString().padStart(3, '0') }}</span>
      <a-button type="primary" @click="nextData" :disabled="currentIndex >= maxIndex">
        下一个数据
      </a-button>
    </div>

    <!-- 表格区域 - 仅在无错误时显示 -->
    <div v-if="!isError">
      <a-table
        :dataSource="dataSource"
        :columns="getHighlightedColumns"
        bordered
        :pagination="false"
      />
    </div>

    <!-- 错误信息区域 - 仅在错误时显示 -->
    <div v-else class="error-container">
      <div class="error-title">数据解析错误</div>
      <div class="error-message">{{ errorMessage }}</div>
      <div v-if="errorLine" class="error-data">
        <div class="error-data-title">错误数据行:</div>
        <div class="error-data-content">{{ errorLine }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, reactive, onMounted } from 'vue'

// 数据索引范围 (假设数据文件从 150 到 170)
const minIndex = 160
const maxIndex = 161
const currentIndex = ref(maxIndex) // 默认从最小索引开始
const errorMessage = ref<string | null>(null)
const errorLine = ref<string | null>(null) // 存储导致错误的数据行
const isError = ref(false) // 错误状态标志
const highlightedColumns = reactive<Set<number>>(new Set())

// 固定80列
const columnCount = 80

// 生成列配置
const getHighlightedColumns = computed(() =>
  Array.from({ length: columnCount }, (_, index) => ({
    title: `${(index + 1).toString().padStart(2, '0')}`,
    dataIndex: `column_${index}`,
    key: `column_${index}`,
    width: 30,
    ellipsis: true,
    align: 'center',
    customHeaderCell: (column) => ({
      class: { 'highlighted-column': highlightedColumns.has(index) },
      onClick: () => handleHeaderClick(index),
    }),
    customCell: (record) => ({
      class: { 'highlighted-column': highlightedColumns.has(index) },
    }),
  })),
)

// 数据源
const dataSource = ref<any[]>([])

// 表头点击事件
const handleHeaderClick = (columnIndex: number) => {
  console.log('处理表头点击', columnIndex, highlightedColumns.has(columnIndex))
  highlightedColumns.has(columnIndex)
    ? highlightedColumns.delete(columnIndex)
    : highlightedColumns.add(columnIndex)
  console.log('当前高亮列:', Array.from(highlightedColumns))
}

// 加载指定索引的数据
const loadData = async (index: number) => {
  isError.value = false
  errorMessage.value = null
  errorLine.value = null

  try {
    // 动态导入数据文件
    const dataModule = await import(`./data/${index.toString().padStart(3, '0')}`)
    const ipt = dataModule.ipt || ''

    // 解析数据
    const lines = ipt
      .trim()
      .split('\n')
      .filter((line) => line.trim() !== '')
    if (lines.length === 0) throw new Error('没有有效的数据行')

    const parsedData = lines.map((line, lineIndex) => {
      const cleanedLine = line.replace(/\s/g, '')

      // 校验长度并记录错误行
      if (cleanedLine.length % 2 !== 0) {
        errorLine.value = line
        throw new Error(`第 ${lineIndex + 1} 行数据长度不是偶数，请检查：${line}`)
      }

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

      const rowData: Record<string, string> = {}
      for (let i = 0; i < columnCount; i++) rowData[`column_${i}`] = ''
      numbers.forEach((num) => {
        const columnIndex = parseInt(num, 10) - 1
        rowData[`column_${columnIndex}`] = num
      })

      return { key: `row_${lineIndex}`, ...rowData }
    })

    dataSource.value = parsedData
      .map((row) => ({ ...row, numberCount: Object.values(row).filter((v) => v !== '').length }))
      .sort((a, b) => b.numberCount - a.numberCount)
      .map((row) => ({ ...row, numberCount: undefined }))
  } catch (error) {
    isError.value = true
    if (error instanceof Error) {
      errorMessage.value = error.message
      console.error('解析错误:', error.message)
    } else {
      errorMessage.value = '解析表格数据时发生未知错误'
      console.error('解析错误:', error)
    }
  }
}

// 上一个数据
const prevData = () => {
  if (currentIndex.value > minIndex) {
    currentIndex.value--
    loadData(currentIndex.value)
  }
}

// 下一个数据
const nextData = () => {
  if (currentIndex.value < maxIndex) {
    currentIndex.value++
    loadData(currentIndex.value)
  }
}

// 初始化加载默认数据
onMounted(() => {
  loadData(currentIndex.value)
})
</script>

<style scoped>
/* 数据切换按钮样式 */
.data-switch {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  padding: 10px;
  background-color: #f0f2f5;
  border-radius: 4px;
}

.current-index {
  font-size: 16px;
  font-weight: 500;
  margin: 0 15px;
}

/* 基础样式 */
.error-container {
  padding: 20px;
  background-color: #fef0f0;
  border: 1px solid #fccccc;
  border-radius: 4px;
  margin-top: 20px;
}

.error-title {
  font-size: 18px;
  font-weight: bold;
  color: #c62828;
  margin-bottom: 10px;
}

.error-message {
  color: #e53935;
  margin-bottom: 15px;
  line-height: 1.5;
}

.error-data {
  background-color: #fff;
  border: 1px solid #f0f0f0;
  padding: 15px;
  border-radius: 4px;
}

.error-data-title {
  font-weight: 500;
  color: #333;
  margin-bottom: 5px;
}

.error-data-content {
  font-family: monospace;
  background-color: #f9f9f9;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
}

/* 表格样式（保持不变） */
:deep(.ant-table-tbody .ant-table-cell),
:deep(.ant-table-thead .ant-table-cell) {
  padding: 0;
}

:deep(.ant-table-cell:not(:empty)) {
  background-color: #f0f9ff;
}

:deep(.ant-table-thead .highlighted-column) {
  background-color: #e53935 !important;
  color: #fff !important;
}

:deep(.ant-table-tbody .highlighted-column) {
  background-color: #ffebee !important;
  color: #e53935 !important;
}

:deep(.ant-table-tbody .highlighted-column:not(:empty)) {
  background-color: #ffcdd2 !important;
  color: #c62828 !important;
}
</style>
