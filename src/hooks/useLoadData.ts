import { validateIptData, validateIptDatakl8 } from './validateIptData'

// 类型定义
export interface LotteryData {
  g1: number[]
  g2: number[]
  ipt: string
}
type LotteryFiles = Record<string, { (): Promise<any> } | any>

export interface ParsedRow {
  [key: string]: any
  comma: string
  _commaRaw: number
  _doubleComma: boolean
}

export function useLotteryData(
  lotteryType: string,
  files: LotteryFiles,
  columnConfig: {
    frontCount: number
    backCount: number
  },
) {
  const { frontCount, backCount } = columnConfig
  const title = useTitle()

  const footerRef = ref<HTMLElement | null>(null)

  const currentHis = ref<string | number>() // 支持数字/字符串期号
  const rawData = ref<LotteryData>({ g1: [], g2: [], ipt: '' })
  const parsedRows = ref<ParsedRow[]>([])

  const highlightedBack = ref(new Set<number>()) // 后区高亮 (1-backCount)
  const highlightedFront = ref(new Set<number>()) // 前区高亮 (1-frontCount)

  const availablePeriods = computed(() => {
    const ret = Object.keys(files)
      .map((filePath) => {
        const fileName = filePath.split('/').pop() || ''
        const match = fileName.match(/(.+)\.ts$/)
        return match ? match[1] : null
      })
      .filter((period): period is string => period !== null)
      .sort((a, b) => b.localeCompare(a)) // 降序排列（最新在前）

    return ret
  })

  const minHis = computed(() => availablePeriods.value.at(-1) || '')
  const maxHis = computed(() => availablePeriods.value[0] || '')

  const getCurrentIndex = () => availablePeriods.value.indexOf(currentHis.value || '')

  // --------------------------
  // 列配置（修正后的定义）
  // --------------------------
  // 前区列配置（n1, n2, ..., n{frontCount}）
  const frontHeaders = computed(() => {
    return Array.from({ length: frontCount }, (_, i) => {
      const colNumber = i + 1
      return {
        label: String(colNumber).padStart(2, '0'),
        prop: `n${colNumber}`, // 使用小写 "n" 与数据解析保持一致
        width: 24,
        colNumber, // 存储原始数字（用于高亮逻辑）
      }
    })
  })

  // 后区列配置（h1, h2, ..., h{backCount}）
  const backHeaders = computed(() => {
    return Array.from({ length: backCount }, (_, i) => {
      const colNumber = i + 1
      return {
        label: String(colNumber).padStart(2, '0'),
        prop: `h${colNumber}`, // 使用小写 "h"
        width: 24,
        colNumber,
      }
    })
  })

  const initPeriod = () => {
    if (availablePeriods.value.length > 0) {
      currentHis.value = maxHis.value
    }
  }

  const errMsg = ref('')

  // 加载指定期号数据
  const loadData = async (period: string | number) => {
    const loading = ElLoading.service({
      lock: true,
      text: '加载中...',
      background: 'rgba(0, 0, 0, 0.7)',
    })

    try {
      const filePath = Object.keys(files).find((path) => path.endsWith(`${period}.ts`))
      if (!filePath) throw new Error(`未找到期号 ${period} 的数据文件`)

      const mod: any = files[filePath]
      const ipt = typeof mod?.ipt === 'string' ? mod.ipt : ''
      const g1 = mod.g1
      // 数据校验
      let frontMax = 33
      let backMax = 12
      if (lotteryType === 'ssq') {
        frontMax = 33
        backMax = 16
      } else if (lotteryType === 'dlt') {
        frontMax = 35
        backMax = 12
      } else {
        frontMax = 80
        backMax = 10
      }

      const errCheck = validateIptData(ipt, frontMax, backMax)
      if (errCheck) {
        errMsg.value = errCheck
        return false
      }

      // 更新原始数据
      rawData.value = {
        g1: lotteryType === 'ssq' ? g1?.slice(1, 7) : g1?.slice(1, 6),
        g2: lotteryType === 'ssq' ? g1?.slice(-1) : g1?.slice(-2),
        ipt,
      }
      console.log(rawData.value.g1, 88)

      syncHighlightFromData()

      title.value = `${lotteryType} ${period}`
      regData()
      return true
    } catch (e: any) {
      ElNotification({
        title: '错误提示',
        message: `数据加载失败：${e?.message ?? '未知错误'}`,
        duration: 0,
      })
      rawData.value = { g1: [], g2: [], ipt: '' }
      return false
    } finally {
      loading.close()
    }
  }

  // 从原始数据同步高亮状态
  const syncHighlightFromData = () => {
    highlightedFront.value.clear()
    highlightedBack.value.clear()
    rawData.value.g1.forEach((num) => highlightedFront.value.add(num))
    rawData.value.g2.forEach((num) => highlightedBack.value.add(num))
  }

  // 解析数据为表格行（修正字段名匹配）

  let noSortData: any = []
  let sortData: any = []

  const regData = () => {
    if (!rawData.value.ipt) {
      parsedRows.value = []
      return
    }

    const lines = rawData.value.ipt.trim().split('\n')
    const rows: ParsedRow[] = []

    lines.forEach((line, index) => {
      const trimmedLine = line.trim().replace(/\s+/g, '')
      if (!trimmedLine) return

      const separator = trimmedLine.includes(',,') ? ',,' : ','
      const [main, tail = ''] = trimmedLine.split(separator)
      if (!main) return
      // 解析前区/后区数字
      const mainArr = Array.from({ length: main.length / 2 }, (_, i) =>
        main.substring(i * 2, i * 2 + 2),
      ).filter((num) => num >= '01' && num <= String(frontCount).padStart(2, '0'))

      const tailArr = Array.from({ length: tail.length / 2 }, (_, i) =>
        tail.substring(i * 2, i * 2 + 2),
      ).filter((num) => num >= '01' && num <= String(backCount).padStart(2, '0'))

      const row: ParsedRow = {
        id: `row_${index}`,
        comma: String(mainArr.length),
        _commaRaw: mainArr.length,
        _doubleComma: separator === ',,',
      }

      // 填充前区单元格（使用 frontHeaders 定义的 prop）
      frontHeaders.value.forEach((h) => {
        const num = String(h.colNumber).padStart(2, '0')
        row[h.prop] = mainArr.includes(num) ? num : ''
      })

      // 填充后区单元格
      backHeaders.value.forEach((h) => {
        const num = String(h.colNumber).padStart(2, '0')
        row[h.prop] = tailArr.includes(num) ? num : ''
      })

      if (lotteryType === 'kl8') {
        row.h1 = tail
      }
      rows.push(row)
    })

    const temp = JSON.parse(JSON.stringify(rows))
    noSortData = temp

    sortData = rows.sort((a, b) => b._commaRaw - a._commaRaw)

    parsedRows.value = sorted.value ? sortData : noSortData
  }

  const sorted = ref(true)

  function sortByLen() {
    if (!sorted.value) {
      parsedRows.value = sortData
    } else {
      parsedRows.value = noSortData
    }
    sorted.value = !sorted.value
  }

  const nextHis = () => {
    const currentIdx = getCurrentIndex()
    if (currentIdx > 0) {
      currentHis.value = availablePeriods.value[currentIdx - 1]
    }
  }

  const prevHis = () => {
    const currentIdx = getCurrentIndex()
    if (currentIdx >= 0 && currentIdx < availablePeriods.value.length - 1) {
      currentHis.value = availablePeriods.value[currentIdx + 1]
    }
  }

  const jumpToMin = () => {
    currentHis.value = minHis.value
  }

  const jumpToMax = () => {
    currentHis.value = maxHis.value
  }

  const copyTable = () => {
    if (!rawData.value.ipt) {
      ElMessage.warning('没有可复制的数据')
      return
    }

    const lines = rawData.value.ipt
      .trim()
      .split('\n')
      .map((line) => line.replace(/\s+/g, ''))
      .filter((line) => line)
      .filter((line) => line.split(/,+/).length === 2)
      .sort((a, b) => {
        // 新增排序逻辑
        const aPrefix = a.split(',')[0]
        const bPrefix = b.split(',')[0]
        return bPrefix.length - aPrefix.length // 按逗号前长度降序
      })

    if (lines.length === 0) {
      ElMessage.warning('没有有效数据可复制')
      return
    }

    navigator.clipboard
      .writeText(lines.join('\n'))
      .then(() => ElMessage.success('已复制表格数据'))
      .catch(() => ElMessage.error('复制失败'))
  }

  const copyHighlighted = () => {
    // 1. 过滤无效值（排除 0 和非数字），并排序
    const validFrontNums = Array.from(highlightedFront.value.values())
      .filter((num) => Number.isInteger(num) && num > 0) // 只保留正整数
      .sort((a, b) => a - b)

    const validBackNums = Array.from(highlightedBack.value.values())
      .filter((num) => Number.isInteger(num) && num > 0)
      .sort((a, b) => a - b)

    // 2. 检查是否有有效数据
    if (validFrontNums.length === 0 && validBackNums.length === 0) {
      ElMessage.warning('没有可复制的高亮数据')
      return
    }

    // 3. 格式化数字（补零）并拼接（前区 + 逗号 + 后区）
    const formattedFront = validFrontNums.map((num) => String(num).padStart(2, '0')).join(' ')
    const formattedBack = validBackNums.map((num) => String(num).padStart(2, '0')).join(' ')

    // 4. 处理分隔符（只有前区/后区时不显示多余逗号）
    let result = ''
    if (formattedFront && formattedBack) {
      result = `${formattedFront} , ${formattedBack}` // 前后区都有：前区, 后区
    } else if (formattedFront) {
      result = formattedFront // 只有前区
    } else {
      result = formattedBack // 只有后区
    }

    // 5. 复制到剪贴板
    navigator.clipboard
      .writeText(result)
      .then(() => ElMessage.success('已复制高亮数据'))
      .catch(() => ElMessage.error('复制失败'))
  }

  const parseColumnProp = (prop: string) => {
    const match = prop.match(/^([nh])(\d+)$/i)
    if (!match) return null
    return {
      type: match[1].toUpperCase() as 'N' | 'H',
      index: parseInt(match[2], 10), // 1-based 索引
    }
  }

  // 切换高亮状态
  const toggleHighlight = (prop: string) => {
    const parsed = parseColumnProp(prop)
    if (!parsed) return

    const targetSet = parsed.type === 'N' ? highlightedFront.value : highlightedBack.value
    if (targetSet.has(parsed.index)) {
      targetSet.delete(parsed.index)
    } else {
      targetSet.add(parsed.index)
    }
  }

  const getCellClass = (prop: string) => {
    const parsed = parseColumnProp(prop)
    if (!parsed) return ''

    // 判断是否高亮（仅基于列索引和高亮状态）
    const isHighlighted =
      parsed.type === 'N'
        ? highlightedFront.value.has(parsed.index)
        : highlightedBack.value.has(parsed.index)

    // 只在高亮时返回类名
    if (!isHighlighted) return ''

    // 高亮类名映射
    const highlightClasses = {
      N: 'high-colum',
      H: 'high-colum',
    }

    return highlightClasses[parsed.type]
  }

  // 表头单元格样式（保持不变，本身不依赖 row）
  const getHeaderCellClass = (prop: string) => {
    const parsed = parseColumnProp(prop)

    if (!parsed) return ''
    const isHighlighted =
      parsed.type === 'N'
        ? highlightedFront.value.has(parsed.index)
        : highlightedBack.value.has(parsed.index)

    if (!isHighlighted) return ''

    const headerHighlightClasses = {
      N: 'header-highlight-n',
      H: 'header-highlight-h',
    }

    return headerHighlightClasses[parsed.type]
  }
  // 分隔列样式
  const getCommaClass = (row: ParsedRow) => {
    return row._doubleComma ? 'comma-cell-double' : 'comma-cell-single'
  }
  onBeforeMount(() => {
    initPeriod()
  })

  watch(currentHis, (newVal) => {
    if (newVal) loadData(newVal)
  })

  function clear() {
    highlightedFront.value.clear()
  }

  const cacheHighLights = new Set<number>()
  watch(
    () => highlightedFront.value,
    (v) => {
      if (v.size == 0) return
      cacheHighLights.clear()
      for (const element of v) {
        cacheHighLights.add(element)
      }
    },
    { immediate: true, deep: true },
  )
  function reBackHighLight() {
    for (const element of cacheHighLights) {
      highlightedFront.value.add(element)
    }
  }

  onKeyStroke('ArrowUp', (e) => {
    // 排除输入框/文本域等需要输入的场景
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLSelectElement
    ) {
      return // 不干扰正常输入
    }
    e.preventDefault() // 阻止页面滚动
    prevHis() // 调用上一期方法
  })

  // 监听下箭头（ArrowDown）→ 下一期
  onKeyStroke('ArrowDown', (e) => {
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLSelectElement
    ) {
      return
    }
    e.preventDefault()
    nextHis() // 调用下一期方法
  })

  return {
    sortByLen,
    highlightedBack,
    highlightedFront,
    footerRef,
    currentHis,
    minHis,
    maxHis,
    parsedRows,
    availablePeriods,
    errMsg,
    // 列配置
    frontHeaders,
    backHeaders,

    // 方法
    clear,
    prevHis,
    nextHis,
    jumpToMin,
    jumpToMax,
    copyTable,
    copyHighlighted,
    toggleHighlight,
    getCellClass,
    getCommaClass,
    getHeaderCellClass,
    // 内部方法（调试用）
    regData,
    loadData,
    reBackHighLight,
    // 原始数据
    rawData,
  }
}
