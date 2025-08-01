<template>
  <section
    w-500px
    z-9999
    class="bg-klein-blue text-fuchsia p-10px rounded-md fixed box-border"
    ref="draggableRef"
    :style="style"
  >
    <div v-for="item in parsedData" :key="item.percent" flex pb-6px>
      <div w-28px>{{ item.percent }}:</div>
      <div class="flex flex-wrap flex-1">
        <el-button
          @click="handleNum(c)"
          style="margin: 0 4px"
          v-for="c in item.numbers"
          :key="`${item.percent}_${c}`"
          :type="selectedNumbers.has(c) ? 'success' : 'default'"
        >
          {{ c }}
        </el-button>
      </div>
    </div>
    <div class="flex justify-center">
      <el-button @click="copy">复制</el-button>
      <el-button @click="selectedNumbers.clear()">清除</el-button>
      <el-button @click="emits('close')" :type="'danger'">关闭</el-button>
    </div>
  </section>
</template>

<script setup lang="ts">
// 从localStorage缓存位置信息
import { useLocalStorage } from '@/hooks/useStorage'
const draggableRef = ref(null)
const panelWidth = 600
const initialX = window.innerWidth / 2 - panelWidth / 2
const panelHeight = 450
const windowHeight = window.innerHeight
const initialY = windowHeight - panelHeight
const emits = defineEmits(['close'])
// 使用VueUse的拖拽功能
const { style } = useDraggable(draggableRef, {
  initialValue: { x: initialX, y: initialY },
})

// 解析Markdown
const parsedData = ref([])
const selectedNumbers = useLocalStorage('dlt_mock', new Set())

const parseMarkdown = (content) => {
  const percentGroups = []

  content.split('\n').forEach((line) => {
    line = line.trim()
    if (!line) return

    // 匹配百分比-数字分组（如：35: 18 或 05: 03, 05...）
    if (line.includes(':') && !line.includes('在上20期的百分比分布是')) {
      const [percent, numsStr] = line.split(':').map((part) => part.trim())
      if (numsStr) {
        percentGroups.push({
          percent,
          numbers: numsStr.split(',').map((num) => num.trim()),
        })
      }
    }
  })

  parsedData.value = percentGroups
}

// 处理数字选择
const handleNum = (num) => {
  if (selectedNumbers.value.has(num)) {
    selectedNumbers.value.delete(num)
  } else {
    selectedNumbers.value.add(num)
  }
}
function copy() {
  let result: string[] = []
  for (const element of selectedNumbers.value) {
    result.push(element)
  }
  result = result.sort((a, b) => a - b)

  navigator.clipboard
    .writeText(result.join(','))
    .then(() => ElMessage.success('已复制高亮数据'))
    .catch(() => ElMessage.error('复制失败'))
}
// 初始化
onMounted(() => {
  // 导入Markdown内容（需确保vite配置支持?raw）
  import('./cur.md?raw').then((module) => {
    parseMarkdown(module.default)
  })
})
</script>
