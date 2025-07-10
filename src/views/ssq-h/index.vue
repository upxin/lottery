<template>
  <section
    flex
    class="w-650px box-border bg-gray-50 pos-absolute top-30px left-1/2 -translate-x-1/2 z-999"
  >
    <el-button style="width: 65px" text type="success"> 路 </el-button>
    <div v-for="(item, colIndex) in roads" :key="`${item}-${colIndex}`" class="nums">
      <el-button text :type="'warning'"> {{ item }} </el-button>
    </div>
  </section>

  <section
    :style="{ maxHeight: `${getHeight}px` }"
    ref="tableRef"
    class="flex flex-col items-center overflow-y-auto box-border affix-container pos-relative pt-32px"
  >
    <Panel
      class="w-650px"
      :class="[
        index % 3 === 1 ? 'border-red-300' : 'border-gray-300',
        highLights.has(item[0]) ? 'bg-sky-blue' : '',
      ]"
      v-for="(item, index) in [...hisRets]"
      @click="handlePanel(item[0])"
      :key="index"
      :index="index + 1"
      :title="'' + item[0]"
      :highlight-nums="getHighlightNums(item)"
      :blue="item[item.length - 1]"
    />
    <MockPanel class="pos-sticky w-650px bg-white flex justify-center z-999 bottom-0"></MockPanel>
  </section>

  <div class="pos-fixed right-60px top-1/2 -translate-y-1/2 flex flex-col gap-2 z-5000">
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

  <div class="c-bottom z-999">
    <el-button :type="'warning'" @click="currentHis = 1" size="small"> 最早周期 </el-button>
    <el-button :type="'primary'" @click="prevHis" :disabled="currentHis <= 1" size="small">
      上周期
    </el-button>
    <el-button text :type="'danger'">{{ currentHis }}</el-button>
    <el-button :type="'primary'" @click="nextHis" :disabled="currentHis >= maxHis" size="small">
      下周期
    </el-button>
    <el-button :type="'warning'" @click="currentHis = maxHis" size="small"> 最新周期 </el-button>
  </div>
</template>

<script lang="ts" setup>
import Panel from './Panel.vue'
import { useAutoHeight } from '@/hooks/useHeight'
import MockPanel from './MockPanel.vue'
import { useLocalStorage } from '@/hooks/useStorage'

const extraHeight = ref(30 + 30)
const { getHeight } = useAutoHeight(extraHeight)

const title = useTitle('')
title.value = 'ssq-h'

const hisModules = import.meta.glob('./his/*.[jt]s') // 支持js和ts
const roads = [1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0]
const hisKeys = Object.keys(hisModules) // ['./his/1.js', './his/2.js', ...]
const hisNumbers = hisKeys
  .map((path) => Number(path.match(/(\d+)\.[jt]s$/)?.[1]))
  .filter(Boolean)
  .sort((a, b) => a - b)

const maxHis = hisNumbers[hisNumbers.length - 1]

const currentHis = ref(maxHis)
const hisRets = ref<Array<string[]>>([])

const loadHis = async (n: number) => {
  const file = hisKeys.find((path) => path.includes(`/${n}.`))
  if (file) {
    const mod = await hisModules[file]()
    hisRets.value = mod.default || mod.hisRets
  } else {
    hisRets.value = []
  }
}

watchEffect(() => {
  loadHis(currentHis.value)
})

const prevHis = () => {
  const idx = hisNumbers.indexOf(currentHis.value)
  if (idx > 0) currentHis.value = hisNumbers[idx - 1]
}
const nextHis = () => {
  const idx = hisNumbers.indexOf(currentHis.value)
  if (idx < hisNumbers.length - 1) currentHis.value = hisNumbers[idx + 1]
}

const getHighlightNums = (item: string[]) => item.slice(1, -1).map((num) => Number(num))

const tableRef = useTemplateRef('tableRef')
const scrollToTop = () => {
  if (tableRef.value) {
    const tableEl = tableRef.value
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
    const tableEl = tableRef.value
    if (tableEl) {
      tableEl.scrollTo({
        top: tableEl.scrollHeight,
        behavior: 'smooth', // 平滑滚动
      })
    }
  }
}

const highLights = useLocalStorage('highLights', new Set())
function handlePanel(item: string) {
  if (highLights.value.has(item)) {
    highLights.value.delete(item)
  } else {
    highLights.value.add(item)
  }
}
</script>
