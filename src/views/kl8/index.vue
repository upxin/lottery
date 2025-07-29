<template>
  <el-table
    ref="tableRef"
    class="mx-auto"
    style="width: 1680px"
    :highlight-current-row="false"
    :data="parsedRows"
    border
    size="small"
    :height="getHeight"
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
      :class-name="getRowClassName2(col)"
    >
      <template #header>
        {{ col.label }}
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
          {{ col.prop }}
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
    <el-button type="warning" @click="copyHighlighted" size="small"> 复制高亮数据 </el-button>
    <el-button @click="reBackHighLight" type="warning">
      {{ '重置高亮' }}
    </el-button>
    <el-button @click="clear" :type="'danger'">
      {{ '清空高亮' }}
    </el-button>
    <el-button type="primary" @click="toggle()" size="small" class="mr-2"> curBalls </el-button>
  </div>
  <Error :err-msg="errMsg"></Error>
  <ScrollTable :el="tableRef?.$el"></ScrollTable>
  <List
    :list="curBalls"
    v-model:visible="visible"
    :restHits="restHits"
    @choosed="choosed"
    :hits="hits"
    :g1="rawData.g1"
  ></List>
</template>

<script lang="ts" setup>
import { useLotteryData } from '@/hooks/useLoadData'
import { useAutoHeight } from '@/hooks/useHeight'

import List from './List.vue'

const tableRef = useTemplateRef('tableRef')
const [visible, toggle] = useToggle()

const extraHeight = ref(60)
const { getHeight } = useAutoHeight(extraHeight)
const width = 20
const his = import.meta.glob('./hisData/*.ts', { eager: true })
const allBalls = {
  ...import.meta.glob('./[1-9].ts', { eager: true }),
  ...import.meta.glob('./[1-9][0-9].ts', { eager: true }),
  ...import.meta.glob('./1[0-9][0-9].ts', { eager: true }),
  ...import.meta.glob('./200.ts', { eager: true }),
}
const files = Object.assign({}, his, allBalls)
const {
  footerRef,
  rawData,
  currentHis,
  minHis,
  maxHis,
  parsedRows,
  frontHeaders,
  backHeaders,
  reBackHighLight,
  prevHis,
  nextHis,
  copyTable,
  sortByLen,
  copyHighlighted,
  toggleHighlight,
  highlightedFront,
  availablePeriods,
  getCellClass,
  errMsg,
  getCommaClass,
  getHeaderCellClass,
  clear,
} = useLotteryData('kl8', files, {
  frontCount: 80, // 前区数量
  backCount: 1, // 后区数量
})

const curBalls = computed(() => {
  if (!currentHis.value) return {}
  const filePath = Object.keys(files).find((path) => path.endsWith(`${currentHis.value}.ts`))
  return files[filePath].only
})
const curChoosed = ref()

function getUniqueIntersection(arr1: number[], arr2: number[]): number[] {
  const set2 = new Set(arr2)
  return [...new Set(arr1.filter((num) => set2.has(num)))]
}
const hits = computed(() => {
  return getUniqueIntersection(curChoosed.value || [], rawData.value.g1.slice(1) || [])
})

function getUniqueDifference(a: number[], b: number[]): number[] {
  const setB = new Set(b)
  return [...new Set(a.filter((num) => !setB.has(num)))]
}
const restHits = computed(() => {
  return getUniqueDifference(rawData.value.g1.slice(1), hits.value)
})
function choosed(c: number[]) {
  curChoosed.value = c
  highlightedFront.value.clear()
  for (const element of c) {
    highlightedFront.value.add(element)
  }
}

const getRowClassName2 = ({ colNumber }) => {
  return restHits.value.includes(colNumber) ? 'highlighted-row2' : ''
}
</script>
