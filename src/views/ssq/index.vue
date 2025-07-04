<template>
  <section flex flex-col items-center>
    <el-table
      style="width: 1224px"
      :data="parsedRows"
      border
      size="small"
      :header-cell-style="headerCellStyle"
      :cell-style="cellStyle"
      :height="getHeight"
    >
      <el-table-column type="index" width="24px" label="In" align="center"></el-table-column>
      <el-table-column
        v-for="col in allHeaders"
        :key="col.prop"
        :prop="col.prop"
        :label="col.label"
        :width="24"
        align="center"
      />
    </el-table>
    <div
      ref="footerRef"
      class="flex w-screen items-center justify-center fixed bottom-0 py-4px bg-#fff z-10"
    >
      <el-button type="primary" @click="jumph" size="small">ssq-h</el-button>
      <el-button
        type="primary"
        @click="prevHis"
        :disabled="currentHis <= minHis"
        size="small"
        class="ml-2"
      >
        上一个
      </el-button>
      <el-button text class="mx-2" type="success" disabled> his/{{ currentHis }} </el-button>
      <el-button
        type="primary"
        @click="nextHis"
        :disabled="currentHis >= maxHis"
        size="small"
        class="mr-2"
      >
        下一个
      </el-button>
      <el-button type="primary" @click="currentHis = maxHis" size="small" class="mr-2">
        new
      </el-button>
      <el-button
        type="primary"
        @click="
          () => {
            toggle()
          }
        "
        size="small"
      >
        {{ showDot ? '显示数字' : '显示圆点' }}
      </el-button>
      <el-button type="primary" @click="copy" size="small"> copy </el-button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { watch } from 'vue'
const { height: windowHeight } = useWindowSize()
const footerRef = ref<HTMLElement | null>(null)
const { height: footerHeight } = useElementSize(footerRef)
const [showDot, toggle] = useToggle(false)
const title = useTitle()
const extraSpace = 10

const files = import.meta.glob('./his/*.ts', { eager: true })
const hisNums = Object.keys(files)
  .map((path) => {
    const m = path.match(/(\d+)\.ts$/)
    return m ? Number(m[1]) : undefined
  })
  .filter((n): n is number => typeof n === 'number')
  .sort((a, b) => a - b)

const minHis = Math.min(...hisNums)
const maxHis = Math.max(...hisNums)
const currentHis = ref(maxHis)

const g1 = ref<number[]>([])
const g2 = ref<number[]>([])
const ipt = ref('')

function loadData() {
  const loading = ElLoading.service({
    lock: true, // 锁定屏幕滚动
    text: '加载中...', // 显示文本
    background: 'rgba(0, 0, 0, 0.7)', // 背景遮罩
    target: document.body, // 覆盖整个页面
  })
  title.value = String(currentHis.value)
  try {
    const filePath = Object.keys(files).find((p) => p.endsWith(`${currentHis.value}.ts`))
    if (!filePath) throw new Error('未找到数据模块')
    const mod: any = files[filePath]
    g1.value = Array.isArray(mod?.g1) ? mod.g1 : []
    g2.value = Array.isArray(mod?.g2) ? mod.g2 : []
    ipt.value = typeof mod?.ipt === 'string' ? mod.ipt : ''
    loading.close()
  } catch (e: any) {
    ElMessage.error('数据加载失败：' + (e?.message ?? e))
    g1.value = []
    g2.value = []
    ipt.value = ''
    loading.close()
  }
}
loadData()
watch(currentHis, loadData)

const headers33 = Array.from({ length: 33 }, (_, i) => ({
  label: String(i + 1).padStart(2, '0'),
  prop: `N${i + 1}`,
  width: 36,
}))
const headers16 = Array.from({ length: 16 }, (_, i) => ({
  label: String(i + 1).padStart(2, '0'),
  prop: `H${i + 1}`,
  width: 36,
}))
const allHeaders = [...headers33, { label: ',', prop: 'comma', width: 40 }, ...headers16]

function filterRange(nums: string[], min: number, max: number) {
  return (nums ?? []).filter((n) => {
    const v = Number(n)
    return /^\d{2}$/.test(n) && v >= min && v <= max
  })
}
function copy() {
  if (!ipt.value || typeof ipt.value !== 'string') {
    ElMessage.warning('没有可复制的数据')
    return
  }
  const lines = ipt.value.trim().split('\n')
  const result: string[] = []
  for (const line0 of lines) {
    // 去除所有空白字符
    const line = line0.replace(/\s+/g, '')
    if (!line) continue

    let main = '',
      tail = '',
      sep = ''
    if (line.includes(',,') && line.split(',,').length === 2) {
      ;[main, tail] = line.split(',,')
      sep = ',,'
    } else if (line.includes(',')) {
      ;[main, tail] = line.split(',')
      sep = ','
    } else {
      // 没有分隔符，不输出
      continue
    }

    // 保留原始顺序，直接拼接
    const lineStr = main + sep + tail
    if (lineStr) result.push(lineStr)
  }
  const text = result.join('\n')

  // 按逗号前数字长度排序函数
  function sortByPrefixLength(inputString) {
    return inputString
      .split('\n') // 拆分为行
      .sort((a, b) => {
        // 提取每行第一个逗号前的部分
        const prefixA = a.split(',')[0]
        const prefixB = b.split(',')[0]

        // 按长度降序排序
        return prefixB.length - prefixA.length
      })
      .join('\n') // 重新组合为字符串
  }

  const sortedString = sortByPrefixLength(text)

  if (!sortedString) {
    ElMessage.warning('没有可复制的内容')
    return
  }
  navigator.clipboard
    .writeText(sortedString)
    .then(() => ElMessage.success('已复制'))
    .catch(() => ElMessage.error('复制失败'))
}
function validateInput(ipt: string): boolean {
  const lines = ipt.trim().split('\n')
  for (const [lineIndex, line0] of lines.entries()) {
    const line = line0.replace(/\s+/g, '')
    if (!line) continue

    // 必须有逗号，且最多只能有两个
    const commaCount = (line.match(/,/g) || []).length
    if (commaCount < 1 || commaCount > 2) {
      ElMessage.error({
        message: `格式错误: 第${lineIndex + 1}行: 必须有1或2个逗号`,
        duration: 10000,
        showClose: true,
      })
      return false
    }

    // 分裂前区和后区
    let main = '',
      tail = ''
    if (line.includes(',,') && line.split(',,').length === 2) {
      ;[main, tail] = line.split(',,')
    } else if (line.includes(',')) {
      ;[main, tail] = line.split(',')
    } else {
      main = line
      tail = ''
    }

    // 前区不能为空
    if (!main) {
      ElMessage.error({
        message: `前区不能为空: 第${lineIndex + 1}行: ${line0}`,
        duration: 10000,
        showClose: true,
      })
      return false
    }
    // 后区不能为空
    if (!tail) {
      ElMessage.error({
        message: `后区不能为空: 第${lineIndex + 1}行: ${line0}`,
        duration: 10000,
        showClose: true,
      })
      return false
    }

    // 检查前区
    const mainArr = main.match(/\d{2}/g) || []
    if (mainArr.length === 0) {
      ElMessage.error({
        message: `前区号码格式错误: 第${lineIndex + 1}行: ${line0}`,
        duration: 10000,
        showClose: true,
      })
      return false
    }
    const mainSet = new Set(mainArr)
    if (mainArr.length !== mainSet.size) {
      ElMessage.error({
        message: `前区号码有重复: 第${lineIndex + 1}行: ${line0}`,
        duration: 10000,
        showClose: true,
      })
      return false
    }
    if (!mainArr.every((n) => /^\d{2}$/.test(n) && +n >= 1 && +n <= 33)) {
      ElMessage.error({
        message: `前区号码范围应为01-33: 第${lineIndex + 1}行: ${line0}`,
        duration: 10000,
        showClose: true,
      })
      return false
    }

    // 检查后区
    const tailArr = tail.match(/\d{2}/g) || []
    if (tailArr.length === 0) {
      ElMessage.error({
        message: `后区号码格式错误: 第${lineIndex + 1}行: ${line0}`,
        duration: 10000,
        showClose: true,
      })
      return false
    }
    const tailSet = new Set(tailArr)
    if (tailArr.length !== tailSet.size) {
      ElMessage.error({
        message: `后区号码有重复: 第${lineIndex + 1}行: ${line0}`,
        duration: 10000,
        showClose: true,
      })
      return false
    }
    if (!tailArr.every((n) => /^\d{2}$/.test(n) && +n >= 1 && +n <= 16)) {
      ElMessage.error({
        message: `后区号码范围应为01-16: 第${lineIndex + 1}行: ${line0}`,
        duration: 10000,
        showClose: true,
      })
      return false
    }
  }
  return true
}
watch(
  () => ipt.value,
  (v) => {
    validateInput(v)
  },
  { immediate: true },
)
const parsedRows = computed(() => {
  if (!ipt.value || typeof ipt.value !== 'string') return []
  const lines = ipt.value.trim().split('\n')
  const rows: any[] = []
  for (const [lineIndex, line0] of lines.entries()) {
    const line = line0.replace(/\s+/g, '') // 先去空格
    if (!line) continue
    let main = '',
      tail = '',
      isDoubleComma = false
    if (line.includes(',,') && line.split(',,').length === 2) {
      ;[main, tail] = line.split(',,')
      isDoubleComma = true
    } else if (line.includes(',')) {
      ;[main, tail] = line.split(',')
      isDoubleComma = false
    } else {
      main = line
      tail = ''
      isDoubleComma = false
    }

    // 非法直接跳过，不弹窗
    if (!/^(?:\d{2})*$/.test(main)) continue
    if (tail && !/^(?:\d{2})*$/.test(tail)) continue

    // 只允许前区 01-33，后区 01-16
    const mainArr = filterRange(main.match(/\d{2}/g) ?? [], 1, 33)
    const tailArr = filterRange(tail.match(/\d{2}/g) ?? [], 1, 16)
    const beforeCount = mainArr.length
    const row: Record<string, any> = {}

    headers33.forEach((h, idx) => {
      const num = String(idx + 1).padStart(2, '0')
      row[h.prop] = mainArr.includes(num) ? (showDot.value ? '●' : num) : ''
    })
    row['comma'] = String(beforeCount)
    row['_commaRaw'] = beforeCount
    row['_doubleComma'] = isDoubleComma
    headers16.forEach((h, idx) => {
      const num = String(idx + 1).padStart(2, '0')
      row[h.prop] = tailArr.includes(num) ? (showDot.value ? '●' : num) : ''
    })
    rows.push(row)
  }
  const rets = rows.sort((a, b) => b._commaRaw - a._commaRaw)
  return rets
})

// ----------- 样式 -----------
function cellStyle({ column, row }: any) {
  const key = column.property
  if (/^N\d+$/.test(key) && row[key]) {
    const n = Number(key.slice(1))
    if (g1.value.includes(n)) {
      return { background: '#fff6e6', color: '#e67c00', fontWeight: 'bold' }
    }
    return { background: '#e2f7e2', color: '#409EFF', fontWeight: 'bold' }
  }
  if (/^H\d+$/.test(key) && row[key]) {
    const n = Number(key.slice(1))
    if (g2.value.includes(n)) {
      return { background: '#d0f2fc', color: '#2b7abf', fontWeight: 'bold' }
    }
    return { background: '#e2f7e2', color: '#409EFF', fontWeight: 'bold' }
  }
  if (key === 'comma') {
    if (row._doubleComma) {
      return { background: '#ffe4ec', color: '#e33', fontWeight: 'bold' }
    } else {
      return { background: '#f3f3f3', color: '#2c3e50', fontWeight: 'bold' }
    }
  }
  return {}
}

function headerCellStyle({ column }: any) {
  if (column.property === 'comma') {
    return { background: '#efefef', color: '#333', fontWeight: 'bold' }
  }
  return {}
}

// ----------- 修正 prevHis/nextHis 不越界 -----------
function prevHis() {
  const idx = hisNums.indexOf(currentHis.value)
  if (idx > 0) {
    currentHis.value = hisNums[idx - 1]
  }
}
function nextHis() {
  const idx = hisNums.indexOf(currentHis.value)
  if (idx >= 0 && idx < hisNums.length - 1) {
    currentHis.value = hisNums[idx + 1]
  }
}

const router = useRouter()
function jumph() {
  const fullPath = router.resolve('/ssq-h').href
  window.open(fullPath, '_blank')
}

const getHeight = computed(() => {
  return windowHeight.value - (footerHeight.value || 0) - extraSpace
})
</script>

<style scoped>
/* 这这样做 组件外层必须加容器标签 不然不生效  vue编译的时候没有唯一组件id去穿透类 */
:deep(.el-table--small .cell) {
  padding: 0;
}
:deep(.el-table--small .el-table__cell) {
  padding: 0;
}
</style>

<style>
/* 不想加容器就只能用全局的 */
/* .el-table--small .cell {
  padding: 0;
}
.el-table--small .el-table__cell {
  padding: 0;
} */
</style>
