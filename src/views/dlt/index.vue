<template>
  <el-table
    class="mx-auto"
    style="width: 1000px"
    :highlight-current-row="false"
    :data="parsedRows"
    border
    size="small"
    :height="getHeight"
    @row-click="handleRowClick"
    :row-class-name="getRowClassName"
  >
    <el-table-column
      type="index"
      :width="width"
      label="In"
      align="center"
      :resizable="false"
    ></el-table-column>

    <el-table-column
      :resizable="false"
      v-for="col in frontHeaders"
      :key="col.prop"
      :prop="col.prop"
      :label="col.label"
      :width="width"
      align="center"
      :class-name="getCellClass(col.prop)"
    >
      <template #header>
        <div @click.stop="toggleHighlight(col.prop)" :class="getHeaderCellClass(col.prop)">
          {{ col.label }}
        </div>
      </template>
    </el-table-column>

    <!-- 分隔列 -->
    <el-table-column label="," prop="comma" width="40" align="center" :resizable="false">
      <template #header>
        <div class="comma-header" @click="sortByLen">{{ ',' }}</div>
      </template>
      <template #default="{ row }">
        <div :class="getCommaClass(row)">{{ row.comma }}</div>
      </template>
    </el-table-column>

    <!-- 后区列（H1-H16） -->
    <el-table-column
      :resizable="false"
      v-for="col in backHeaders"
      :key="col.prop"
      :prop="col.prop"
      :label="col.label"
      :width="width"
      align="center"
      :class-name="getCellClass(col.prop)"
    >
      <template #header>
        <div @click.stop="toggleHighlight(col.prop)" :class="getHeaderCellClass(col.prop)">
          {{ col.label }}
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
    >
      <el-option
        v-for="period in availablePeriods"
        :key="period"
        :label="period.toString()"
        :value="period"
      ></el-option>
    </el-select>
    <el-button type="primary" @click="currentHis = minHis" size="small" class="mr-2">
      最早一期
    </el-button>
    <el-button type="primary" @click="prevHis" size="small" class="ml-2"> 上一期 </el-button>
    <el-button type="primary" @click="nextHis" size="small" class="mr-2"> 下一期 </el-button>
    <el-button type="primary" @click="currentHis = maxHis" size="small" class="mr-2">
      最新一期
    </el-button>
    <el-button type="primary" @click="copyTable" size="small"> 复制表格数据 </el-button>
    <el-button type="primary" @click="copyHighlighted" size="small"> 复制高亮数据 </el-button>
  </div>

  <div
    style="z-index: 99999999"
    v-if="errMsg"
    class="fixed inset-0 flex items-center justify-center bg-white/90 p-4"
  >
    <div class="text-center max-w-lg w-full">
      <!-- 错误信息显示 -->
      <p class="text-[clamp(1.5rem,3vw,2.5rem)] font-bold text-klein-blue mb-6 break-words">
        {{ errMsg.split(':')[0] }}
      </p>
      <p class="text-[clamp(1.5rem,3vw,2.5rem)] font-bold text-klein-blue mb-6 break-words">
        {{ errMsg.split(':')[1] }}
      </p>
      <!-- 操作按钮组 -->
      <div class="flex items-center justify-center gap-4">
        <!-- 复制按钮（复制冒号前面的内容） -->
        <el-button @click="copyPrefixText" :size="'large'" :type="'warning'">
          <i class="i-ic:round-content-copy text-lg"></i>
          <span>复制前缀</span>
        </el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useLotteryData } from '@/hooks/useLoadData'
import { useHighLight } from '@/hooks/useHighLight'
import { useAutoHeight } from '@/hooks/useHeight'
const extraHeight = ref(60)
const { getHeight } = useAutoHeight(extraHeight)
const width = 20
const { getRowClassName, handleRowClick } = useHighLight()
const his = import.meta.glob('./hisData/*.ts', { eager: true })
const curData = import.meta.glob('./*.ts', { eager: true })
const files = Object.assign({}, his, curData)
const {
  footerRef,
  currentHis,
  minHis,
  maxHis,
  parsedRows,
  frontHeaders,
  backHeaders,
  prevHis,
  nextHis,
  copyTable,
  sortByLen,
  copyHighlighted,
  toggleHighlight,
  availablePeriods,
  getCellClass,
  errMsg,
  getCommaClass,
  getHeaderCellClass,
} = useLotteryData('dlt', files, {
  frontCount: 35, // 前区数量
  backCount: 12, // 后区数量
})

const copyPrefixText = () => {
  // 拆分字符串，取冒号前面的部分
  const prefix = errMsg.value.split(':')[0].trim()

  navigator.clipboard
    .writeText(prefix)
    .then(() => {
      ElMessage.success('已复制')
    })
    .catch(() => {
      ElMessage.error('复制失败')
    })
}
</script>
