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

  <div
    style="z-index: 99999999"
    v-if="errorMessage"
    class="fixed inset-0 flex items-center justify-center bg-white/90 p-4"
  >
    <div class="text-center max-w-lg w-full">
      <!-- 错误信息显示 -->
      <p class="text-[clamp(1.5rem,3vw,2.5rem)] font-bold text-klein-blue mb-6 break-words">
        {{ errorMessage }}
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useHighLight } from '@/hooks/useHighLight'
import { useTitle } from '@vueuse/core'

// 基础配置
const { handleRowClick, getRowClassName } = useHighLight()
const title = useTitle()
title.value = 'kl8'
const columnCount = 81

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

const hasNext = computed(() => currentFileIndex.value > 0)
const hasPrev = computed(() => currentFileIndex.value < fileNames.value.length - 1)

const his = import.meta.glob('./hisData/*.ts', { eager: true })
const curData = import.meta.glob('./*.ts', { eager: true })
const files = Object.assign({}, his, curData)

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
    // 根据文件名查找文件路径（匹配以 "文件名.ts" 结尾的路径）
    const filePath = Object.keys(files).find((path) => path.endsWith(`${fileName}.ts`))
    if (!filePath) throw new Error(`文件 ${fileName}.ts 不存在`)

    // 直接获取模块内容（因使用 eager: true，无需调用加载函数）
    const dataModule = files[filePath] as {
      ipt?: string
      isRedList?: number[]
    }

    // 提取原始数据
    const ipt = dataModule.ipt || ''
    rawIptData.value = ipt

    // 同步高亮状态（从模块中获取 isRedList）
    highlightedColumns.clear()
    if (Array.isArray(dataModule.isRedList)) {
      dataModule.isRedList.forEach((i: number) => {
        // 只处理 1-80 范围内的列索引（转换为 0 基索引）
        if (i >= 1 && i <= 80) {
          highlightedColumns.add(i - 1)
        }
      })
    }

    // 解析数据行（处理空行和格式验证）
    const lines = ipt
      .trim()
      .split('\n')
      .filter((line) => line.trim()) // 过滤空行

    if (lines.length === 0) {
      throw new Error('没有有效数据行')
    }

    // 解析每行数据为表格行格式
    const parsedData = lines.map((line, lineIndex) => {
      // 分割主数据和附加数据（兼容单逗号分割）
      const [mainPart, extraRaw] = line.split(',')
      const cleanedLine = mainPart.replace(/\s/g, '') // 清除所有空格

      // 验证主数据长度为偶数（确保两两一组）
      if (cleanedLine.length % 2 !== 0) {
        throw new Error(`第 ${lineIndex + 1} 行格式错误：主数据长度非偶数（${line}）`)
      }

      // 提取主数据中的数字（两两一组）
      const numbers: string[] = []
      for (let i = 0; i < cleanedLine.length; i += 2) {
        const num = cleanedLine.slice(i, i + 2)
        const numValue = parseInt(num, 10)

        // 验证数字有效性（1-80 范围内）
        if (isNaN(numValue) || numValue < 1 || numValue > 80) {
          throw new Error(`第 ${lineIndex + 1} 行包含无效数字：${num}`)
        }
        numbers.push(num)
      }

      // 构建表格行数据（初始化 81 列）
      const rowData: Record<string, string> = {}
      for (let i = 0; i < columnCount; i++) {
        rowData[`column_${i}`] = ''
      }

      // 填充主数据到对应列
      numbers.forEach((num) => {
        const colIdx = parseInt(num, 10) - 1 // 转换为 0 基索引
        rowData[`column_${colIdx}`] = num
      })

      // 处理附加数据（最后一列）
      rowData['column_80'] = extraRaw ? extraRaw.trim().padStart(2, '0') : ''
      // 记录主数据数字个数（用于排序）
      rowData['mainLength'] = (cleanedLine.length / 2).toString()

      return { id: `row_${lineIndex}`, ...rowData }
    })

    // 按主数据数字个数降序排序（多的在前）
    // .sort((a, b) => {
    //   return parseInt(b.mainLength) - parseInt(a.mainLength)
    // })
    dataSource.value = parsedData
  } catch (error) {
    // 捕获并处理所有错误
    isError.value = true
    errorMessage.value = error instanceof Error ? error.message : '数据加载失败，请检查文件格式'
  } finally {
    // 确保加载状态关闭
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
const nextData = () => {
  if (hasNext.value) {
    currentFileName.value = fileNames.value[currentFileIndex.value - 1]
  }
}

const prevData = () => {
  if (hasPrev.value) {
    currentFileName.value = fileNames.value[currentFileIndex.value + 1]
  }
}

const minData = () => {
  currentFileName.value = fileNames.value[fileNames.value.length - 1]
}

const maxData = () => {
  currentFileName.value = fileNames.value[0]
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
</script>
