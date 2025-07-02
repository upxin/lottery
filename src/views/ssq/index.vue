<template>
  <el-affix :offset="500">
    <div class="mb-4 flex gap-2 items-center">
      <el-button @click="prevHis" :disabled="currentHis <= 1" size="small"> 上一个 </el-button>
      <span class="mx-2">his/{{ currentHis }}</span>
      <el-button @click="nextHis" :disabled="currentHis >= maxHis" size="small"> 下一个 </el-button>
    </div>
  </el-affix>
  <section class="flex flex-col justify-center items-center">
    <Panel
      class="w-auto"
      v-for="(item, index) in hisRets"
      :key="index"
      :title="item[0]"
      :highlight-nums="getHighlightNums(item)"
      :blue="item[item.length - 1]"
    />
  </section>
</template>

<script lang="ts" setup>
import { ref, watchEffect } from 'vue'
import Panel from './Panel.vue'

// 最大his编号
const maxHis = 2

const currentHis = ref(maxHis)
const hisRets = ref<Array<string[]>>([])

const loadHis = async (n: number) => {
  const mod = await import(`./his/${n}`)
  hisRets.value = mod.default || mod.hisRets
}
watchEffect(() => {
  loadHis(currentHis.value)
})

const prevHis = () => {
  if (currentHis.value > 1) currentHis.value--
}
const nextHis = () => {
  if (currentHis.value < maxHis) currentHis.value++
}

const getHighlightNums = (item: string[]) => item.slice(1, -1).map((num) => Number(num))
</script>
