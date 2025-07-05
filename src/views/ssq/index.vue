<template>
  <el-table
    class="mx-auto"
    style="width: 1240px"
    :highlight-current-row="false"
    :data="parsedRows"
    border
    @row-click="handleRowClick"
    :row-class-name="getRowClassName"
    size="small"
    :height="getHeight"
  >
    <el-table-column type="index" width="24px" label="In" align="center"></el-table-column>

    <!-- 前区列（N1-N33） -->
    <el-table-column
      :resizable="false"
      v-for="col in frontHeaders"
      :key="col.prop"
      :prop="col.prop"
      :label="col.label"
      :width="24"
      align="center"
    >
      <template #header>
        <div @click.stop="toggleHighlight(col.prop)">
          {{ col.label }}
        </div>
      </template>
      <template #default="{ row }">
        <div :class="getCellClass(col.prop, row)">{{ row[col.prop] }}</div>
      </template>
    </el-table-column>

    <!-- 分隔列 -->
    <el-table-column label="," prop="comma" width="40" align="center">
      <template #header>
        <div class="comma-header">{{ ',' }}</div>
      </template>
      <template #default="{ row }">
        <div :class="getCommaClass(row)">{{ row.comma }}</div>
      </template>
    </el-table-column>

    <!-- 后区列（H1-H16） -->
    <el-table-column
      v-for="col in backHeaders"
      :key="col.prop"
      :prop="col.prop"
      :label="col.label"
      :width="24"
      align="center"
    >
      <template #header>
        <div @click.stop="toggleHighlight(col.prop)">
          {{ col.label }}
        </div>
      </template>
      <template #default="{ row }">
        <div :class="getCellClass(col.prop, row)">{{ row[col.prop] }}</div>
      </template>
    </el-table-column>
  </el-table>

  <div ref="footerRef" class="c-bottom">
    <el-button type="primary" @click="currentHis = minHis" size="small" class="mr-2">
      最早一期
    </el-button>
    <el-button
      type="primary"
      @click="prevHis"
      :disabled="currentHis <= minHis"
      size="small"
      class="ml-2"
    >
      上一个
    </el-button>
    <el-button
      type="primary"
      @click="nextHis"
      :disabled="currentHis >= maxHis"
      size="small"
      class="mr-2"
    >
      下一个
    </el-button>
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

const { getRowClassName, handleRowClick } = useHighLight()

const files = import.meta.glob('./hisData/*.ts', { eager: true })
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
  getCellClass,
  getCommaClass,
} = useLotteryData('ssq', files, {
  frontCount: 33, // 前区数量
  backCount: 16, // 后区数量
})
</script>
<style></style>
