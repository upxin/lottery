<template>
  <el-table
    class="mx-auto"
    ref="tableRef"
    style="width: 1240px"
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
      width="24px"
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
      :width="24"
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
        <div class="comma-header">{{ ',' }}</div>
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
      :width="24"
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

  <div class="fixed right-60px top-1/2 -translate-y-1/2 flex flex-col gap-2 z-50">
    <!-- 滚动到顶部按钮 -->
    <div
      class="i-icons8:chevron-up-round text-klein-blue cursor-pointer transition-transform text-30px"
      @click="scrollToTop"
    ></div>
    <!-- 滚动到底部按钮 -->
    <div
      class="i-icons8:chevron-down-round text-klein-blue cursor-pointer transition-transform text-30px"
      @click="scrollToBottom"
    ></div>
  </div>
</template>

<script lang="ts" setup>
import { useLotteryData } from '@/hooks/useLoadData'
import { useHighLight } from '@/hooks/useHighLight'
import { useAutoHeight } from '@/hooks/useHeight'
const extraHeight = ref(60)
const { getHeight } = useAutoHeight(extraHeight)

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
  copyHighlighted,
  toggleHighlight,
  availablePeriods,
  getCellClass,
  getCommaClass,
  getHeaderCellClass,
} = useLotteryData('ssq', files, {
  frontCount: 33, // 前区数量
  backCount: 16, // 后区数量
})

const tableRef = useTemplateRef('tableRef')
const scrollToTop = () => {
  if (tableRef.value) {
    const tableEl = tableRef.value.$el.querySelector('.el-scrollbar__wrap')
    if (tableEl) {
      tableEl.scrollTo({
        top: 0,
        behavior: 'smooth', // 平滑滚动
      })
    }
  }
}

// 滚动到底部
const scrollToBottom = () => {
  if (tableRef.value) {
    const tableEl = tableRef.value.$el.querySelector('.el-scrollbar__wrap')
    if (tableEl) {
      tableEl.scrollTo({
        top: tableEl.scrollHeight,
        behavior: 'smooth', // 平滑滚动
      })
    }
  }
}
</script>
