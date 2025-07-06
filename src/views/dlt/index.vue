<template>
  <el-table
    class="mx-auto"
    style="width: 1192px"
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
    <el-table-column label="," prop="comma" :width="width" align="center" :resizable="false">
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
  copyHighlighted,
  toggleHighlight,
  availablePeriods,
  getCellClass,
  getCommaClass,
  getHeaderCellClass,
} = useLotteryData('dlt', files, {
  frontCount: 35, // 前区数量
  backCount: 12, // 后区数量
})
</script>
