<template>
  <el-table
    ref="tableRef"
    mx-auto
    style="width: 1040px"
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
        <div @click.stop="toggleHighlight(col.prop)">
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

    <!-- 后区列 -->
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
    type="20: 15% 20% 10%"
    v-show="showPanel"
    :content="markdownContent20"
    @close="toggle()"
    :back="Array.from(highlightedBack)"
    :front="Array.from(highlightedFront)"
  ></Mock>
  <Mock
    type="15: 13% 20%"
    v-show="showPanel"
    :content="markdownContent15"
    @close="toggle()"
    :back="Array.from(highlightedBack)"
    :front="Array.from(highlightedFront)"
  ></Mock>
  <Mock
    type="10: 20% 10%"
    v-show="showPanel"
    :content="markdownContent10"
    @close="toggle()"
    :back="Array.from(highlightedBack)"
    :front="Array.from(highlightedFront)"
  ></Mock>
  <Mock
    type="5: 0% 20%"
    v-show="showPanel"
    :content="markdownContent5"
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
import { ref, computed } from 'vue'
import { useToggle } from '@vueuse/core'

// 导入全量数据文件
import Content10 from '#/rate/SSQ10.TXT?raw'
import Content15 from '#/rate/SSQ15.TXT?raw'
import Content5 from '#/rate/SSQ5.TXT?raw'
import Content20 from '#/rate/SSQ20.TXT?raw'

// 分割Content为窗口数组（按---分割并过滤空内容）
const splitContentToWindows = (content: string) => {
  return content
    .split('---separator---')
    .map((window) => window.trim())
    .filter(Boolean)
}

// 预处理三个Content为窗口数组
const windows20 = splitContentToWindows(Content20)
const windows15 = splitContentToWindows(Content15)
const windows10 = splitContentToWindows(Content10)
const windows5 = splitContentToWindows(Content5)

// 面板显示状态管理
const tableRef = useTemplateRef('tableRef')
const [showPanel, toggle] = useToggle(true)

// 表格高度与基础配置
const extraHeight = ref(60)
const { getHeight } = useAutoHeight(extraHeight)
const width = 20
const { getRowClassName, handleRowClick } = useHighLight()

// 数据加载与处理
const his = import.meta.glob('./hisData/*.ts', { eager: true })
const curData = {
  ...import.meta.glob('./[1-9].ts', { eager: true }),
  ...import.meta.glob('./[1-9][0-9].ts', { eager: true }),
  ...import.meta.glob('./1[0-9][0-9].ts', { eager: true }),
  ...import.meta.glob('./200.ts', { eager: true }),
}
const files = Object.assign({}, his, curData)

// 彩票数据核心逻辑（假设maxHis和minHis是ref类型）
const {
  footerRef,
  currentHis, // ref类型
  minHis, // ref类型
  maxHis, // ref类型
  parsedRows,
  frontHeaders,
  backHeaders,
  highlightedBack,
  highlightedFront,
  reBackHighLight,
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
  clear,
} = useLotteryData('ssq', files, {
  frontCount: 33,
  backCount: 16,
})

// 核心算法：根据currentHis与maxHis的差值计算索引
// currentHis = maxHis → 差值0 → 索引length-1（最后一个）
// currentHis = maxHis - n → 差值n → 索引length-1 -n
const getIndexByDifference = (windowList: string[]) => {
  if (windowList.length === 0) return 0

  // 访问ref的值（关键修正：maxHis和minHis若为ref需加.value）
  const current = currentHis.value
  const max = maxHis.value
  const min = minHis.value

  // 计算当前期与最新期的差值（current ≤ max）
  const difference = max - current

  // 计算目标索引（从最后一个往前偏移difference位）
  const index = windowList.length - 1 - difference

  // 边界保护：索引不能小于0（若期号过早，固定取第一个窗口）
  return Math.max(index, 0)
}

// 为每个窗口数组计算索引（使用差值算法）
const index20 = computed(() => getIndexByDifference(windows20))
const index15 = computed(() => getIndexByDifference(windows15))
const index10 = computed(() => getIndexByDifference(windows10))
const index5 = computed(() => getIndexByDifference(windows5))

// 动态生成markdown内容
const markdownContent20 = computed(() => {
  return windows20[index20.value] || ''
})

const markdownContent15 = computed(() => {
  return windows15[index15.value] || ''
})

const markdownContent10 = computed(() => {
  return windows10[index10.value] || ''
})

const markdownContent5 = computed(() => {
  return windows5[index5.value] || ''
})

const showBack = ref(false)
provide('showBack', { showBack })
</script>
