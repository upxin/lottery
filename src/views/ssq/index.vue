<template>
  <el-table
    ref="tableRef"
    mx-auto
    style="width: 1060px"
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
      :width="width + 20"
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
      first
    </el-button>
    <el-button type="primary" @click="prevHis" size="small" class="ml-2"> prev </el-button>
    <el-button type="primary" @click="nextHis" size="small" class="mr-2"> next </el-button>
    <el-button type="primary" @click="currentHis = maxHis" size="small" class="mr-2">
      last
    </el-button>
    <el-button type="primary" @click="copyTable" size="small"> table </el-button>
    <el-button type="success" @click="copyHighlighted" size="small"> highlights </el-button>
    <el-button @click="reBackHighLight" type="warning"> reset </el-button>
    <el-button @click="clear" :type="'danger'"> clear </el-button>
    <el-button @click="toggle()">mock</el-button>

    <el-button @click="toggleBack()">{{ !showBack ? '看后区' : '看前区' }}</el-button>
    <el-button @click="showCount = true">count</el-button>
    <ScrollTable :el="tableRef?.$el"></ScrollTable>
  </div>
  <Error :err-msg="errMsg"></Error>
  <el-dialog v-model="showCount" width="800" :close-on-click-modal="true">
    <div flex justify-around>
      <div>
        <div>前区(数字： 次数)</div>
        <div
          flex
          :class="{ 'text-bordeaux-red font-bold': highlightedFront.has(item.num) }"
          v-for="item in counts?.front || []"
          :key="item.num"
        >
          <span class="w-30px">{{ item.num }}:</span><span>{{ item.count }}</span>
        </div>
      </div>
      <div>
        <div>后区单个(数字： 次数)</div>
        <div
          flex
          v-for="(item, index) in counts?.back || []"
          :class="{ 'text-blue font-bold': highlightedBack.has(item.num) }"
          :key="`${item.num}_${index}`"
        >
          <span class="w-30px">{{ item.num }}:</span><span>{{ item.count }}</span>
        </div>
      </div>
    </div>
    <div flex justify-center pt-10px>
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
  <Mock
    type="50: 20 16 18"
    v-show="showPanel"
    :content="Content50"
    @close="toggle()"
    :back="Array.from(highlightedBack)"
    :front="Array.from(highlightedFront)"
  ></Mock>
  <Mock
    type="20: 15 20"
    v-show="showPanel"
    :content="Content20"
    @close="toggle()"
    :back="Array.from(highlightedBack)"
    :front="Array.from(highlightedFront)"
  ></Mock>
  <Mock
    type="10: 20 10"
    v-show="showPanel"
    :content="Content10"
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

import Content10 from '#/ssq/SSQ10.txt?raw'
import Content15 from '#/ssq/SSQ15.txt?raw'
import Content20 from '#/ssq/SSQ20.txt?raw'
import Content50 from '#/ssq/SSQ50.txt?raw'

const showCount = ref(false)

const [showBack, toggleBack] = useToggle(false)
// 预处理三个Content为窗口数组

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
  counts,
  dltBackCom,
} = useLotteryData('ssq', files, {
  frontCount: 33,
  backCount: 16,
})

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

function getSortedCombinations(list, count) {
  // 边界条件处理
  if (count <= 0 || count > list.length) {
    return [] // 选取个数无效时返回空数组
  }
  if (count === list.length) {
    // 选取个数等于列表长度时，只有一个组合（排序后的原列表）
    return [[...list].sort((a, b) => a - b)]
  }

  const result = []

  // 回溯法生成组合
  const backtrack = (startIndex, currentCombination) => {
    // 当当前组合长度达到目标个数时，排序后加入结果
    if (currentCombination.length === count) {
      result.push([...currentCombination].sort((a, b) => a - b))
      return
    }

    // 从startIndex开始遍历，避免重复组合（如[1,2]和[2,1]视为同一组合）
    for (let i = startIndex; i < list.length; i++) {
      // 加入当前元素
      currentCombination.push(list[i])
      // 递归选取下一个元素（从i+1开始，确保不重复选取）
      backtrack(i + 1, currentCombination)
      // 回溯：移除最后一个元素，尝试其他可能性
      currentCombination.pop()
    }
  }

  // 从索引0开始，初始组合为空
  backtrack(0, [])

  return result
}

const combinBack = computed(() => {
  const list = []
  const coms = []
  for (const element of highlightedBack.value) {
    list.push(element)
  }

  const combinations = getSortedCombinations(list, 2)

  for (const c of combinations) {
    const temp = `${Number(c[0]).toString().padStart(2, '0')},${Number(c[1]).toString().padStart(2, '0')}`
    coms.push(temp)
  }
  return coms
})
provide('showBack', { showBack, setFront, setBack })
provide('maxHis', maxHis)
provide('currentHis', currentHis)
provide('highlightedBack', highlightedBack)
provide('highlightedFront', highlightedFront)
</script>
