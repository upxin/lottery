<template>
  <el-table
    ref="tableRef"
    mx-auto
    style="width: 1050px"
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
      :width="30"
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
    <el-button @click="showCount = true">显示数量统计</el-button>
  </div>
  <Error :err-msg="errMsg"></Error>
  <ScrollTable :el="tableRef?.$el"></ScrollTable>
  <Mock
    type="50"
    v-show="showPanel"
    :content="markdownContent50"
    @close="toggle()"
    :back="Array.from(highlightedBack)"
    :front="Array.from(highlightedFront)"
  ></Mock>
  <el-dialog v-model="showCount" :z-index="9999999">
    <div flex justify-around>
      <div>
        <p>前区(数字： 次数)</p>
        <div
          flex
          :class="{ 'text-bordeaux-red font-bold': highlightedFront.has(Number(item.num)) }"
          v-for="item in counts?.front || []"
          :key="item.num"
        >
          <span class="w-50px">{{ item.num }}：</span><span>{{ item.count }}</span>
        </div>
      </div>
      <div>
        <p>后区单个(数字： 次数)</p>
        <div
          v-for="(item, index) in counts?.back || []"
          :class="{ 'text-blue font-bold': highlightedBack.has(Number(item.num)) }"
          :key="`${item.num}_${index}`"
        >
          {{ item.num }}：{{ item.count }}
        </div>
      </div>
    </div>
    <div flex justify-center>
      <el-button type="primary" @click="currentHis = minHis" size="small" class="mr-2">
        最早一期
      </el-button>
      <el-button type="primary" @click="prevHis" size="small" class="ml-2"> 上一期 </el-button>
      <el-button type="primary" @click="nextHis" size="small" class="mr-2"> 下一期 </el-button>
      <el-button type="primary" @click="currentHis = maxHis" size="small" class="mr-2">
        最新一期
      </el-button>
    </div>
  </el-dialog>
</template>

<script lang="ts" setup>
import { useLotteryData } from '@/hooks/useLoadData'
import { useHighLight } from '@/hooks/useHighLight'
import { useAutoHeight } from '@/hooks/useHeight'
import Mock from '../components/Mock.vue'
import { ref, computed } from 'vue'
import { useToggle } from '@vueuse/core'

// 导入全量数据文件
// import Content10 from '#/rate/SSQ10.TXT?raw'
// import Content15 from '#/rate/SSQ15.TXT?raw'
// import Content5 from '#/rate/SSQ5.TXT?raw'
// import Content20 from '#/rate/SSQ20.TXT?raw'
import Content50 from '#/rate/SSQ50.TXT?raw'

const showCount = ref(false)
// 分割Content为窗口数组（按---分割并过滤空内容）
const splitContentToWindows = (content: string) => {
  return content
    .split('---separator---')
    .map((window) => window.trim())
    .filter(Boolean)
}

const windows50 = splitContentToWindows(Content50)

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
// 分别匹配：1-9.ts、10-99.ts、100-199.ts、200.ts
const curData = {
  ...import.meta.glob('./[1-9].ts', { eager: true }), // 1-9.ts
  ...import.meta.glob('./[1-9][0-9].ts', { eager: true }), // 10-99.ts
  ...import.meta.glob('./1[0-9][0-9].ts', { eager: true }),
  ...import.meta.glob('./2[0-9][0-9].ts', { eager: true }), // 100-199.ts（包含100.ts）
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
  counts,
} = useLotteryData('ssq', files, {
  frontCount: 33,
  backCount: 16,
})

const getIndexByDifference = (windowList: string[]) => {
  if (windowList.length === 0) return 0
  const current = Number(currentHis.value)
  const max = Number(maxHis.value)
  if (isNaN(current) || isNaN(max)) return 0 // 处理非数字期号的异常
  const difference = max - current // 数字减法，正确计算差值
  const index = windowList.length - 1 - difference
  return Math.max(index, 0)
}

const index50 = computed(() => getIndexByDifference(windows50))

const markdownContent50 = computed(() => {
  return windows50[index50.value] || ''
})
const showBack = ref(false)
function setFront(v) {
  if (highlightedFront.value.has(v)) {
    highlightedFront.value.delete(v)
  } else {
    highlightedFront.value.add(v)
  }
}

function setBack(v) {
  if (highlightedBack.value.has(v)) {
    highlightedBack.value.delete(v)
  } else {
    highlightedBack.value.add(v)
  }
}
provide('showBack', { showBack, setFront, setBack })
</script>
