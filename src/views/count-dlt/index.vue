<template>
  <el-table
    v-if="!hasError && !isLoading && ssqData"
    :data="displayData"
    border
    class="w-890px mb-5 mx-auto"
    :header-cell-class="['text-center', 'bg-[#f5f7fa]']"
    :cell-class="'text-center'"
  >
    <el-table-column
      label="期号"
      prop="period"
      width="120"
      :header-cell-class="['text-center', 'bg-[#eef2f7]']"
    ></el-table-column>

    <el-table-column
      v-for="num in 35"
      :key="num"
      :label="num.toString()"
      :prop="num.toString()"
      width="22"
    >
      <template #default="scope">
        <span
          :class="[
            scope.row[scope.column.property] !== '-' ? 'text-blue-500 font-bold' : '',
            scope.row.isTotal ? 'text-red-500 font-bold' : '',
            isLastRow(scope.$index) ? ' text-amber! font-bold' : '',
          ]"
        >
          {{ scope.row[scope.column.property] }}
        </span>
      </template>
    </el-table-column>
  </el-table>
  <div v-if="!hasError && !isLoading && ssqData" class="flex justify-center items-center gap-4">
    <el-button type="primary" @click="handleFirst50" :disabled="currentStart === 0">
      前50条
    </el-button>
    <el-button @click="handlePrev" :disabled="currentStart === 0" class="px-4"> 上一页 </el-button>
    <el-button @click="handleNext" :disabled="currentStart + pageSize >= totalItems" class="px-4">
      下一页
    </el-button>
    <el-button
      @click="handleLast50"
      type="primary"
      :disabled="totalItems <= pageSize || currentStart === last50Start"
    >
      后50条
    </el-button>
  </div>
</template>

<script setup lang="ts">
import rawData from '#/dlt/dlt.json'

const title = useTitle()
const route = useRoute()
title.value = route.name as string

// 定义JSON数据类型（二维数组）
type SsqJsonData = string[][]

// 状态管理
const isLoading = ref(true)
const hasError = ref(false)
const ssqData = ref<SsqJsonData | null>(null)

// 初始化加载数据并校验
onMounted(() => {
  try {
    if (!Array.isArray(rawData) || rawData.some((item) => !Array.isArray(item))) {
      throw new Error('数据格式不正确，应为二维数组')
    }
    ssqData.value = rawData as SsqJsonData
  } catch (err) {
    console.error('数据加载错误:', err)
    hasError.value = true
  } finally {
    isLoading.value = false
  }
})

// 表格行数据类型定义
interface NumberRow {
  period: string | number
  isTotal?: boolean
  [key: string]: string | number | boolean | undefined
}

// 分页配置
const pageSize = 50
const currentStart = ref(0)

// 总数据条数
const totalItems = computed(() => {
  return ssqData.value?.length || 0
})

// 计算最后50条的起始索引
const last50Start = computed(() => {
  return Math.max(0, totalItems.value - pageSize)
})

// 处理当前页数据为表格格式
const processedData = computed<NumberRow[]>(() => {
  if (!ssqData.value) return []

  // 只处理当前页的数据
  const currentData = ssqData.value.slice(currentStart.value, currentStart.value + pageSize)

  return currentData.map((item, index) => {
    const row: NumberRow = { period: currentStart.value + index + 1 } // 期号基于全局索引
    for (let i = 1; i <= 35; i++) {
      row[i.toString()] = '-'
    }
    item.forEach((num) => {
      const normalizedNum = parseInt(num, 10).toString()
      row[normalizedNum] = num
    })
    return row
  })
})

// 计算当前区间（当前页）的累计次数
const currentRangeTotalCounts = computed<NumberRow>(() => {
  const counts: Record<string, number> = {}
  // 初始化计数
  for (let i = 1; i <= 35; i++) {
    counts[i.toString()] = 0
  }

  if (ssqData.value) {
    // 只统计当前页范围内的数据
    const currentData = ssqData.value.slice(currentStart.value, currentStart.value + pageSize)

    currentData.forEach((item) => {
      item.forEach((num) => {
        const normalizedNum = parseInt(num, 10).toString()
        counts[normalizedNum]++
      })
    })
  }

  return {
    period: `当前累计 (${currentStart.value + 1}-${Math.min(currentStart.value + pageSize, totalItems.value)})`,
    isTotal: true,
    ...counts,
  }
})

// 当前页显示的数据（包含当前区间累计行）
const displayData = computed<NumberRow[]>(() => {
  // 将当前页数据与当前区间累计行组合
  return [...processedData.value, currentRangeTotalCounts.value]
})

// 分页处理函数
const handlePrev = () => {
  currentStart.value = Math.max(0, currentStart.value - 1)
}

const handleNext = () => {
  if (ssqData.value) {
    currentStart.value = Math.min(ssqData.value.length - pageSize, currentStart.value + 1)
  }
}
const isLastRow = (index: number) => {
  return index === displayData.value.length - 2
}
// 新增：跳转到最后50条数据
const handleLast50 = () => {
  currentStart.value = last50Start.value
}
const handleFirst50 = () => {
  currentStart.value = 0
}
onMounted(() => {
  nextTick(() => {
    handleLast50()
  })
})
</script>
<style lang="scss" scoped>
:deep(.el-table_1_column_24.is-leaf.el-table__cell) {
  border-right: 2px solid gray !important;
}

:deep(.el-table_1_column_13.is-leaf.el-table__cell) {
  border-right: 2px solid gray !important;
}

:deep(.el-table__body tr td:nth-child(13)) {
  border-right: 2px solid gray !important;
}

:deep(.el-table__body tr td:nth-child(24)) {
  border-right: 2px solid gray !important;
}
</style>
