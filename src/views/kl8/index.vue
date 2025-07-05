<template>
  <el-table
    :highlight-current-row="false"
    @row-click="handleRowClick"
    :row-class-name="getRowClassName"
    :data="dataSource"
    border
    style="width: 1822px"
    class="mx-auto"
  >
    <!-- 新增：逗号前数据长度列 -->
    <el-table-column prop="mainLength" label="长度" width="40" align="center" :resizable="false" />

    <!-- 原有列配置 -->
    <el-table-column
      :resizable="false"
      v-for="column in columns"
      :key="column.key"
      :prop="column.dataIndex"
      :label="column.title"
      :align="column.align"
      :width="22"
    >
      <template #header>
        <div @click="handleHeaderClick(column.dataIndex)">
          {{ column.title }}
        </div>
      </template>

      <template #default="{ row }">
        <div :class="getCellClass(column.dataIndex)">
          {{ row[column.dataIndex] }}
        </div>
      </template>
    </el-table-column>
  </el-table>

  <!-- 底部控制栏（新增复制按钮） -->
  <div class="c-bottom">
    <el-button color="#002FA7" type="primary" @click="minData">{{ minIndex }}</el-button>
    <el-button type="primary" @click="prevData">上一个数据</el-button>
    <el-button type="primary" @click="nextData">下一个数据</el-button>
    <el-button color="#002FA7" type="info" @click="maxData">{{ maxIndex }}</el-button>
    <el-button @click="copyToClipboard" type="primary">复制高亮数据</el-button>
    <!-- 新增：复制ipt数据（按长度排序） -->
    <el-button @click="copySortedIptData" type="primary">复制ipt数据</el-button>
    <el-button @click="clear" type="primary">清空高亮</el-button>
  </div>
</template>

<script lang="ts" setup>
import { useHighLight } from '@/hooks/useHighLight'
import { onMounted, ref, reactive, computed, watch } from 'vue' // 补充导入
const { handleRowClick, getRowClassName } = useHighLight()

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

const highlightedColumns = reactive(new Set<number>())

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

// 获取单元格样式
const getCellClass = (dataIndex: string) => {
  const colIndex = getDataIndex(dataIndex)
  return colIndex !== -1 && highlightedColumns.has(colIndex) && colIndex !== 80
    ? 'cell-highlight-n-primary'
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
// 存储原始ipt数据（用于复制功能）
const rawIptData = ref<string>('')

// 加载数据函数（新增长度计算和原始数据存储）
const loadData = async (index: number) => {
  const loading = ElLoading.service()
  isError.value = false
  errorMessage.value = null
  errorLine.value = null
  title.value = index.toString()
  rawIptData.value = '' // 重置原始数据

  try {
    const fileName = `./data/${index.toString().padStart(3, '0')}.ts`
    const loader = files[fileName]
    if (!loader) throw new Error('数据文件不存在')

    const dataModule = await loader()
    const ipt = dataModule.ipt || ''
    rawIptData.value = ipt // 保存原始ipt数据

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
        throw new Error(`第 ${lineIndex + 1} 行数据长度不是偶数：${line}`)
      }

      // 解析数字
      const numbers: string[] = []
      for (let i = 0; i < cleanedLine.length; i += 2) {
        const number = cleanedLine.slice(i, i + 2)
        const numValue = parseInt(number, 10)

        if (isNaN(numValue) || numValue < 1 || numValue > 80) {
          errorLine.value = line
          throw new Error(`第 ${lineIndex + 1} 行中数字 ${number} 不在1-80范围`)
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

      // 新增：添加逗号前数据长度（数字个数 = 字符长度 / 2）
      rowData['mainLength'] = (cleanedLine.length / 2).toString()

      return { id: `row_${lineIndex}`, key: `row_${lineIndex}`, ...rowData }
    })

    dataSource.value = parsedData
  } catch (error) {
    isError.value = true
    if (error instanceof Error) {
      errorMessage.value = error.message
    } else {
      errorMessage.value = '解析表格数据时发生未知错误'
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
      ElMessage.success('已复制高亮数据')
    })
    .catch((err) => {
      ElMessage.error('复制失败')
    })
}

// 新增：按每行数据长度排序后复制ipt数据（去空格）
const copySortedIptData = () => {
  if (!rawIptData.value.trim()) {
    ElMessage.warning('没有可复制的ipt数据')
    return
  }

  // 1. 处理原始数据：去空格、过滤空行
  const processedLines = rawIptData.value
    .trim()
    .split('\n')
    .map((line) => line.replace(/\s+/g, '')) // 去所有空格
    .filter((line) => line.trim() !== '') // 过滤空行

  // 2. 按逗号前数据长度排序（从长到短）
  const sortedLines = [...processedLines].sort((a, b) => {
    // 分割逗号（支持单个或两个逗号）
    const aMainLength = a.includes(',,') ? a.split(',,')[0].length : a.split(',')[0]?.length || 0

    const bMainLength = b.includes(',,') ? b.split(',,')[0].length : b.split(',')[0]?.length || 0

    return bMainLength - aMainLength // 降序排序
  })

  // 3. 拼接为文本并复制
  const textToCopy = sortedLines.join('\n')

  navigator.clipboard
    .writeText(textToCopy)
    .then(() => {
      ElMessage.success('已按长度排序复制ipt数据')
    })
    .catch(() => {
      ElMessage.error('复制ipt数据失败')
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
        type: 'error',
        showCancelButton: false,
      })
    }
  },
)
</script>
