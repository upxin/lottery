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
    <el-button type="success" @click="copyHighlighted" size="small"> 复制高亮数据 </el-button>
    <el-button @click="reBackHighLight" type="warning">
      {{ '重置高亮' }}
    </el-button>
    <el-button @click="clear" :type="'danger'">
      {{ '清空高亮' }}
    </el-button>
    <el-button @click="toggle()">显示模拟盘</el-button>
  </div>

  <Error :err-msg="errMsg"></Error>
  <ScrollTable :el="tableRef?.$el"></ScrollTable>
  <Mock
    :content="markdownContent"
    v-show="showPanel"
    @close="toggle()"
    :back="Array.from(highlightedBack)"
    :front="Array.from(highlightedFront)"
  ></Mock>
</template>

<script lang="ts" setup>
import { useLotteryData } from '@/hooks/useLoadData'
import { useHighLight } from '@/hooks/useHighLight'
import { useAutoHeight } from '@/hooks/useHeight'
import Mock from '../components/Mock.vue'
import markdownContent from './cur.md?raw' // 父组件中导入Markdown内容（或动态获取）

const [showPanel, toggle] = useToggle(false)
const extraHeight = ref(60)
const { getHeight } = useAutoHeight(extraHeight)

const { getRowClassName, handleRowClick } = useHighLight()
const his = import.meta.glob('./hisData/*.ts', { eager: true })
const curData = import.meta.glob('./*.ts', { eager: true })
const files = Object.assign({}, his, curData)
const {
  reBackHighLight,
  sortByLen,
  clear,
  errMsg,
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
  highlightedBack,
  highlightedFront,
} = useLotteryData('ssq', files, {
  frontCount: 33, // 前区数量
  backCount: 16, // 后区数量
})

const tableRef = useTemplateRef('tableRef')
</script>
