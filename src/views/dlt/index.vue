<template>
  <el-table
    ref="tableRef"
    mx-auto
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

    <el-button @click="toggleBack()">后区</el-button>
    <el-button @click="showCount = true">显示数量统计</el-button>
  </div>
  <Error :err-msg="errMsg"></Error>
  <el-dialog v-model="showCount" width="800" :close-on-click-modal="false">
    <div flex justify-around>
      <div>
        <div>前区(数字： 次数)</div>
        <div
          flex
          :class="{ 'text-bordeaux-red font-bold': highlightedFront.has(Number(item.num)) }"
          v-for="item in counts?.front || []"
          :key="item.num"
        >
          <span class="w-30px">{{ item.num }}:</span><span>{{ item.count }}</span>
        </div>
      </div>

      <div class="h-400px w-230px flex flex-wrap justify-between">
        <div>后区组合(数字： 次数)</div>
        <div
          w-100px
          flex
          v-for="(item, index) in dltBackCom || []"
          :key="`${item.num}_${index}`"
          :class="{ ' text-amber font-bold': combinBack.includes(item.combinationStr) }"
        >
          <span class="w-50px">{{ item.combinationStr }}:</span><span>{{ item.count }}</span>
        </div>
      </div>

      <div>
        <div>后区单个(数字： 次数)</div>
        <div
          flex
          v-for="(item, index) in counts?.back || []"
          :class="{ 'text-blue font-bold': highlightedBack.has(Number(item.num)) }"
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
  <ScrollTable :el="tableRef?.$el"></ScrollTable>
  <Mock
    type="20: 10% 15%"
    v-show="showPanel"
    :content="markdownContent20"
    :content-back="bmarkdownContent20"
    @close="toggle()"
    :back="Array.from(highlightedBack)"
    :front="Array.from(highlightedFront)"
    :btype="'20: 15% 20%'"
  ></Mock>
  <Mock
    type="15: 13% 7%"
    v-show="showPanel"
    :content="markdownContent15"
    :content-back="bmarkdownContent15"
    @close="toggle()"
    :back="Array.from(highlightedBack)"
    :front="Array.from(highlightedFront)"
    :btype="'15: 13% 20%'"
  ></Mock>
  <Mock
    type="10: 10% 20%"
    v-show="showPanel"
    :content-back="bmarkdownContent10"
    :content="markdownContent10"
    @close="toggle()"
    :back="Array.from(highlightedBack)"
    :front="Array.from(highlightedFront)"
    :btype="'10: 10% 20%'"
  ></Mock>
  <Mock
    type="5: 0% 20%"
    v-show="showPanel"
    :content-back="bmarkdownContent5"
    :content="markdownContent5"
    @close="toggle()"
    :back="Array.from(highlightedBack)"
    :front="Array.from(highlightedFront)"
    :btype="'5: 0% 20%'"
  ></Mock>

  <Mock
    type="50"
    v-show="showPanel"
    :content="markdownContent50"
    @close="toggle()"
    :back="Array.from(highlightedBack)"
    :front="Array.from(highlightedFront)"
    :btype="'50'"
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
import Content10 from '#/rate/DLT10.txt?raw'
import Content15 from '#/rate/DLT15.txt?raw'
import Content5 from '#/rate/DLT5.txt?raw'
import Content20 from '#/rate/DLT20.txt?raw'
import Content50 from '#/rate/DLT50.txt?raw'

import bContent10 from '#/back/DLT10.txt?raw'
import bContent15 from '#/back/DLT15.txt?raw'
import bContent5 from '#/back/DLT5.txt?raw'
// import bContent50 from '#/back/DLT50.txt?raw'

import bContent20 from '#/back/DLT20.txt?raw'
// 分割Content为窗口数组（按---分割并过滤空内容）
const showCount = ref(false)

const splitContentToWindows = (content: string) => {
  return content
    .split('---separator---')
    .map((window) => window.trim())
    .filter(Boolean)
}
const [showBack, toggleBack] = useToggle(false)
// 预处理三个Content为窗口数组
const windows20 = splitContentToWindows(Content20)
const windows15 = splitContentToWindows(Content15)
const windows10 = splitContentToWindows(Content10)
const windows5 = splitContentToWindows(Content5)
const windows50 = splitContentToWindows(Content50)

const bwindows20 = splitContentToWindows(bContent20)
const bwindows15 = splitContentToWindows(bContent15)
const bwindows10 = splitContentToWindows(bContent10)
const bwindows5 = splitContentToWindows(bContent5)
// const bwindows50 = splitContentToWindows(bContent50)

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
} = useLotteryData('dlt', files, {
  frontCount: 35,
  backCount: 12,
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

// 为每个窗口数组计算索引（使用差值算法）
const index20 = computed(() => getIndexByDifference(windows20))
const index15 = computed(() => getIndexByDifference(windows15))
const index10 = computed(() => getIndexByDifference(windows10))
const index5 = computed(() => getIndexByDifference(windows5))
const index50 = computed(() => getIndexByDifference(windows50))

const bindex20 = computed(() => getIndexByDifference(bwindows20))
const bindex15 = computed(() => getIndexByDifference(bwindows15))
const bindex10 = computed(() => getIndexByDifference(bwindows10))
const bindex5 = computed(() => getIndexByDifference(bwindows5))
// const bindex50 = computed(() => getIndexByDifference(bwindows50))

// 动态生成markdown内容
const markdownContent20 = computed(() => {
  return windows20[index20.value] || ''
})
const bmarkdownContent20 = computed(() => {
  return bwindows20[bindex20.value] || ''
})

const markdownContent15 = computed(() => {
  return windows15[index15.value] || ''
})
const bmarkdownContent15 = computed(() => {
  return bwindows15[bindex15.value] || ''
})

const markdownContent10 = computed(() => {
  return windows10[index10.value] || ''
})
const bmarkdownContent10 = computed(() => {
  return bwindows10[bindex10.value] || ''
})

const markdownContent5 = computed(() => {
  return windows5[index5.value] || ''
})
const markdownContent50 = computed(() => {
  return windows50[index50.value] || ''
})
const bmarkdownContent5 = computed(() => {
  return bwindows5[bindex5.value] || ''
})
// const bmarkdownContent50 = computed(() => {
//   return bwindows50[bindex50.value] || ''
// })
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
</script>
