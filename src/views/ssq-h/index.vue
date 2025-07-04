<template>
  <section
    class="flex flex-col items-center overflow-y-auto pb-10px pt-24px box-border"
    style="height: calc(100vh - 44px)"
  >
    <section flex class="w-650px box-border fixed top-0 bg-gray-50">
      <el-button style="width: 60px" text type="success"> 路 </el-button>
      <div v-for="(item, colIndex) in roads" :key="`${item}-${colIndex}`" class="nums">
        {{ item }}
      </div>
    </section>
    <Panel
      class="w-650px"
      v-for="(item, index) in hisRets"
      :key="index"
      :title="'' + item[0]"
      :highlight-nums="getHighlightNums(item)"
      :blue="item[item.length - 1]"
    />
  </section>
  <div class="c-bottom">
    <el-button :type="'primary'" @click="prevHis" :disabled="currentHis <= 1" size="small">
      上周期
    </el-button>
    <el-button :type="'info'">{{ currentHis }}</el-button>
    <el-button :type="'primary'" @click="nextHis" :disabled="currentHis >= maxHis" size="small">
      下周期
    </el-button>
    <el-button
      :type="'success'"
      @click="currentHis = maxHis"
      :disabled="currentHis >= maxHis"
      size="small"
    >
      最新周期
    </el-button>
  </div>
</template>

<script lang="ts" setup>
import { ref, watchEffect } from 'vue'
import Panel from './Panel.vue'
const title = useTitle('')
title.value = 'ssq'

const hisModules = import.meta.glob('./his/*.[jt]s') // 支持js和ts
const roads = [1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0]
const hisKeys = Object.keys(hisModules) // ['./his/1.js', './his/2.js', ...]
const hisNumbers = hisKeys
  .map((path) => Number(path.match(/(\d+)\.[jt]s$/)?.[1]))
  .filter(Boolean)
  .sort((a, b) => a - b)

const maxHis = hisNumbers[hisNumbers.length - 1] || 1
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
</script>
