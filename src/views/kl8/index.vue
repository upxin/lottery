<template>
  <div>
    <a-table
      :dataSource="dataSource"
      :columns="getHighlightedColumns"
      bordered
      :pagination="false"
    />
    <div class="h-40px"></div>
    <div class="flex h-40px items-center justify-center fixed bottom-0 w-100vw">
      <a-config-provider :component-size="'small'">
        <a-space wrap>
          <a-button type="primary" @click="minData"> {{ minIndex }} </a-button>
          <a-button type="primary" @click="prevData"> 上一个数据 </a-button>
          <a-button type="primary" @click="nextData"> 下一个数据 </a-button>
          <a-button type="primary" @click="maxData"> {{ maxIndex }} </a-button>
          <a-button @click="copyToClipboard" type="primary">复制</a-button>
          <a-button @click="clear" type="primary">清空</a-button>
        </a-space>
      </a-config-provider>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Modal, message } from 'ant-design-vue'
import { reactive } from 'vue'
const files = import.meta.glob('./data/*', {
  query: '?url',
  import: 'default',
})
const names = Object.keys(files).map((key) => {
  return key.split('/').pop() // 提取最后一部分作为文件名
})

const title = useTitle()

const minIndex = names[0]?.split('.')[0]
const maxIndex = names[names.length - 1]?.split('.')[0]

const currentIndex = ref(maxIndex)
const errorMessage = ref<string | null>(null)
const errorLine = ref<string | null>(null)
const isError = ref(false)
const highlightedColumns = reactive(new Set())
const columnCount = 81
const copyToClipboard = () => {
  const text = Array.from(highlightedColumns)
    .sort((a, b) => {
      return a - b
    })
    .map((item) => item + 1)

  console.log(text.join(','))

  // // 复制到剪贴板
  navigator.clipboard
    .writeText(text.join(','))
    .then(() => {
      console.log('已复制到剪贴板:', text)
    })
    .catch((err) => {
      console.error('复制失败:', err)
    })
}
function clear() {
  highlightedColumns.clear()
}
// 生成列配置
const getHighlightedColumns = computed(() =>
  Array.from({ length: columnCount }, (_, index) => ({
    title: index === 80 ? 'EX' : `${(index + 1).toString().padStart(2, '0')}`,
    dataIndex: `column_${index}`,
    key: `column_${index}`,
    align: 'center',
    customHeaderCell: () =>
      index === 80
        ? {}
        : {
            onClick: () => handleHeaderClick(index),
          },
    customCell: () => ({
      class: { 'highlighted-column': highlightedColumns.has(index) },
    }),
  })),
)

// 数据源
const dataSource = ref<any[]>([])

// 表头点击事件
const handleHeaderClick = (columnIndex: number) => {
  if (columnIndex === 80) return // 附加列不高亮

  highlightedColumns.has(columnIndex)
    ? highlightedColumns.delete(columnIndex)
    : highlightedColumns.add(columnIndex)
}

// 加载指定索引的数据
const loadData = async (index: number) => {
  const hide = message.loading('加载中...', 0)
  isError.value = false
  errorMessage.value = null
  errorLine.value = null
  title.value = index
  try {
    const path = `./data/${index.toString().padStart(3, '0')}.ts`
    const dataModule = await import(/* @vite-ignore */ path)

    const ipt = dataModule.ipt || ''
    highlightedColumns.clear()
    dataModule.isRedList.forEach((i) => {
      highlightedColumns.add(i - 1)
    })

    const lines = ipt
      .trim()
      .split('\n')
      .filter((line) => line.trim() !== '')
    if (lines.length === 0) throw new Error('没有有效的数据行')
    const parsedData = lines.map((line, lineIndex) => {
      const [mainPart, extraRaw] = line.split(',')
      const cleanedLine = mainPart.replace(/\s/g, '')

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

      // 附加号码处理（只允许1~10）
      let extraValue = ''
      if (extraRaw) {
        const n = parseInt(extraRaw.trim(), 10)
        if (!isNaN(n) && n >= 1 && n <= 10) {
          extraValue = n.toString().padStart(2, '0')
        }
      }

      const rowData: Record<string, string> = {}
      for (let i = 0; i < columnCount; i++) rowData[`column_${i}`] = ''
      numbers.forEach((num) => {
        const columnIndex = parseInt(num, 10) - 1
        rowData[`column_${columnIndex}`] = num
      })

      rowData[`column_80`] = extraValue

      return { key: `row_${lineIndex}`, ...rowData }
    })
    function extractNonEmptyNumbersByGroup(arr) {
      return arr
        .map((item) => {
          // 提取当前对象的非空数字
          const nonEmpty = Object.values(item)
            .filter((value) => {
              return value && !isNaN(Number(value))
            })
            .map(String) // 保持字符串类型

          return nonEmpty
        })
        .filter((group) => group.length > 0) // 过滤掉没有数字的组
    }

    // 调用函数获取分组结果
    const groupedNumbers = extractNonEmptyNumbersByGroup(parsedData)
    console.log('按对象分组的非空数字:', groupedNumbers)
    dataSource.value = parsedData
      .map((row) => ({ ...row, numberCount: Object.values(row).filter((v) => v !== '').length }))
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
  hide()
}

// 上一个数据
const prevData = () => {
  if (currentIndex.value > minIndex) {
    currentIndex.value--
    loadData(currentIndex.value)
  }
}

function maxData() {
  loadData(maxIndex)
}
function minData() {
  loadData(minIndex)
}

// 下一个数据
const nextData = () => {
  if (currentIndex.value < maxIndex) {
    currentIndex.value++
    loadData(currentIndex.value)
  }
}

onMounted(() => {
  loadData(currentIndex.value)
})

watch(
  () => errorMessage.value,
  (v) => {
    Modal.confirm({
      title: '错误',
      content: v,
      centered: true,
    })
  },
)
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
<style>
.ant-notification-notice {
  position: fixed !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  z-index: 9999 !important;
  width: max-content !important;
  margin: 0 !important;
}
</style>
