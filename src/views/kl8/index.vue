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
    <!-- 长度列 -->
    <el-table-column prop="mainLength" label="长度" width="40" align="center" :resizable="false" />

    <!-- 数据列 -->
    <el-table-column
      :resizable="false"
      v-for="column in columns"
      :key="column.key"
      :prop="column.dataIndex"
      :label="column.title"
      :align="column.align"
      :width="22"
      :class-name="getCellClass(column.dataIndex)"
    >
      <template #header>
        <div @click="handleHeaderClick(column.dataIndex)" :class="getHeaderClass(column.dataIndex)">
          {{ column.title }}
        </div>
      </template>
    </el-table-column>
  </el-table>

  <!-- 底部控制栏 -->
  <div class="c-bottom">
    <el-select
      v-model="currentFileName"
      placeholder="选择期数"
      class="mr-2"
      style="width: 120px"
      filterable
    >
      <el-option v-for="name in fileNames" :key="name" :label="name" :value="name" />
    </el-select>
    <el-button color="#002FA7" type="primary" @click="minData"> first </el-button>
    <el-button type="primary" @click="prevData" :disabled="!hasPrev">上一个数据</el-button>
    <el-button type="primary" @click="nextData" :disabled="!hasNext">下一个数据</el-button>
    <el-button color="#002FA7" type="info" @click="maxData">last</el-button>
    <el-button @click="copyToClipboard" type="primary">复制高亮数据</el-button>
    <el-button @click="copySortedIptData" type="primary">复制表格数据</el-button>
    <el-button @click="clear" type="primary">清空高亮</el-button>
  </div>
</template>

<script lang="ts" setup>
import { useHighLight } from '@/hooks/useHighLight'
import { onMounted, ref, reactive, computed, watch } from 'vue'
import { useTitle } from '@vueuse/core'
import { ElLoading, ElMessage, ElNotification } from 'element-plus'

// 基础配置
const { handleRowClick, getRowClassName } = useHighLight()
const title = useTitle()
title.value = 'kl8'
const columnCount = 81

// --------------------------
// 核心修改：基于文件名称处理索引
// --------------------------
// 1. 获取所有文件的名称（不带路径和扩展名）
const fileNames = computed(() => {
  return Object.keys(files)
    .map((path) => {
      // 提取文件名（如 "./data/kl8_001.ts" → "kl8_001"）
      const baseName = path.split('/').pop() || ''
      return baseName.replace(/\.ts$/, '') // 移除扩展名
    })
    .sort((a, b) => b.localeCompare(a)) // 降序排列（最新在前）
})

// 2. 当前选中的文件名（替代原 currentIndex）
const currentFileName = ref<string>()

// 3. 导航状态计算
const currentFileIndex = computed(() => {
  return fileNames.value.indexOf(currentFileName.value || '')
})

const hasPrev = computed(() => currentFileIndex.value > 0)
const hasNext = computed(() => currentFileIndex.value < fileNames.value.length - 1)

// --------------------------
// 数据加载与解析
// --------------------------
const files = import.meta.glob('./data/*', { eager: false }) // 懒加载
const dataSource = ref<any[]>([])
const rawIptData = ref<string>('')
const highlightedColumns = reactive(new Set<number>())
const errorMessage = ref<string | null>(null)
const isError = ref(false)

// 加载数据（基于文件名）
const loadData = async (fileName: string) => {
  const loading = ElLoading.service()
  isError.value = false
  errorMessage.value = null
  title.value = `kl8 ${fileName}`
  rawIptData.value = ''

  try {
    // 根据文件名查找文件路径
    const filePath = Object.keys(files).find((path) => path.endsWith(`${fileName}.ts`))
    if (!filePath) throw new Error(`文件 ${fileName}.ts 不存在`)

    // 加载文件模块
    const loader = files[filePath]
    const dataModule = await loader()
    const ipt = dataModule.ipt || ''
    rawIptData.value = ipt

    // 同步高亮状态
    highlightedColumns.clear()
    if (Array.isArray(dataModule.isRedList)) {
      dataModule.isRedList.forEach((i: number) => {
        if (i >= 1 && i <= 80) highlightedColumns.add(i - 1)
      })
    }

    // 解析数据行（逻辑不变）
    const lines = ipt
      .trim()
      .split('\n')
      .filter((line) => line.trim())
    if (lines.length === 0) throw new Error('没有有效数据行')

    const parsedData = lines.map((line, lineIndex) => {
      const [mainPart, extraRaw] = line.split(',')
      const cleanedLine = mainPart.replace(/\s/g, '')

      if (cleanedLine.length % 2 !== 0) {
        throw new Error(`第 ${lineIndex + 1} 行长度非偶数：${line}`)
      }

      const numbers: string[] = []
      for (let i = 0; i < cleanedLine.length; i += 2) {
        const num = cleanedLine.slice(i, i + 2)
        const numValue = parseInt(num, 10)
        if (isNaN(numValue) || numValue < 1 || numValue > 80) {
          throw new Error(`第 ${lineIndex + 1} 行数字无效：${num}`)
        }
        numbers.push(num)
      }

      // 构建行数据
      const rowData: Record<string, string> = {}
      for (let i = 0; i < columnCount; i++) {
        rowData[`column_${i}`] = ''
      }
      numbers.forEach((num) => {
        const colIdx = parseInt(num, 10) - 1
        rowData[`column_${colIdx}`] = num
      })
      rowData['column_80'] = extraRaw ? extraRaw.trim().padStart(2, '0') : ''
      rowData['mainLength'] = (cleanedLine.length / 2).toString()

      return { id: `row_${lineIndex}`, ...rowData }
    })

    // 按数字个数排序（多的在前）
    dataSource.value = parsedData.sort((a, b) => parseInt(b.mainLength) - parseInt(a.mainLength))
  } catch (error) {
    isError.value = true
    errorMessage.value = error instanceof Error ? error.message : '数据加载失败'
  } finally {
    loading.close()
  }
}
const getHeaderClass = (dataIndex: string) => {
  const colIndex = getDataIndex(dataIndex)
  // 表头高亮样式（与单元格区分，可自定义）
  return colIndex !== -1 && highlightedColumns.has(colIndex) && colIndex !== 80
    ? 'header-highlight-n' // 表头高亮类名
    : ''
}
// --------------------------
// 导航函数（基于文件名列表索引）
// --------------------------
const prevData = () => {
  if (hasPrev.value) {
    currentFileName.value = fileNames.value[currentFileIndex.value - 1]
  }
}

const nextData = () => {
  if (hasNext.value) {
    currentFileName.value = fileNames.value[currentFileIndex.value + 1]
  }
}

const minData = () => {
  currentFileName.value = fileNames.value[0]
}

const maxData = () => {
  currentFileName.value = fileNames.value[fileNames.value.length - 1]
}

// --------------------------
// 列配置与样式
// --------------------------
const columns = computed(() =>
  Array.from({ length: columnCount }, (_, index) => ({
    title: index === 80 ? 'EX' : `${(index + 1).toString().padStart(2, '0')}`,
    dataIndex: `column_${index}`,
    key: `column_${index}`,
    align: 'center',
  })),
)

const getDataIndex = (dataIndex: string) => {
  const match = dataIndex.match(/\d+/)
  return match ? parseInt(match[0]) : -1
}

const getCellClass = (dataIndex: string) => {
  const colIndex = getDataIndex(dataIndex)
  return colIndex !== -1 && highlightedColumns.has(colIndex) && colIndex !== 80 ? 'high-colum' : ''
}

const handleHeaderClick = (dataIndex: string) => {
  const colIndex = getDataIndex(dataIndex)
  if (colIndex === -1 || colIndex === 80) return
  highlightedColumns.has(colIndex)
    ? highlightedColumns.delete(colIndex)
    : highlightedColumns.add(colIndex)
}

// --------------------------
// 复制功能
// --------------------------
const copyToClipboard = () => {
  const text = Array.from(highlightedColumns)
    .sort((a, b) => a - b)
    .filter((idx) => idx !== 80)
    .map((idx) => (idx + 1).toString().padStart(2, '0'))
    .join(',')

  if (!text) {
    ElMessage.warning('没有可复制的高亮数据')
    return
  }

  navigator.clipboard
    .writeText(text)
    .then(() => ElMessage.success('已复制高亮数据'))
    .catch(() => ElMessage.error('复制失败'))
}

const copySortedIptData = () => {
  if (!rawIptData.value.trim()) {
    ElMessage.warning('没有可复制的ipt数据')
    return
  }

  const processedLines = rawIptData.value
    .trim()
    .split('\n')
    .map((line) => line.replace(/\s+/g, ''))
    .filter((line) => line)

  const sortedLines = [...processedLines].sort((a, b) => {
    const aMainLength = a.includes(',,') ? a.split(',,')[0].length : a.split(',')[0]?.length || 0
    const bMainLength = b.includes(',,') ? b.split(',,')[0].length : b.split(',')[0]?.length || 0
    return bMainLength - aMainLength
  })

  navigator.clipboard
    .writeText(sortedLines.join('\n'))
    .then(() => ElMessage.success('已按长度排序复制ipt数据'))
    .catch(() => ElMessage.error('复制失败'))
}

const clear = () => highlightedColumns.clear()

onMounted(() => {
  // 初始化默认选中最后一个文件
  if (fileNames.value.length > 0) {
    currentFileName.value = fileNames.value[0]
  }
})

// 监听当前文件名变化，自动加载数据
watch(currentFileName, (fileName) => {
  if (fileName) loadData(fileName)
})

watch(errorMessage, (v) => {
  if (v) {
    ElNotification({ title: '错误', message: v, duration: 0, type: 'error' })
  }
})
</script>
