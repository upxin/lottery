import { validateIptData } from './validateIptData'

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
  // 基础配置
  const { frontCount, backCount } = columnConfig
  const title = useTitle()
  title.value = lotteryType

  // DOM 相关
  const footerRef = ref<HTMLElement | null>(null)
  const { height: windowHeight } = useWindowSize()
  const { height: footerHeight } = useElementSize(footerRef)
  const extraSpace = 10

  // 数据状态
  const hisNums = ref<number[]>([])
  const minHis = ref<number>(0)
  const maxHis = ref<number>(0)
  const currentHis = ref<number>(0)
  const rawData = ref<LotteryData>({ g1: [], g2: [], ipt: '' })
  const parsedRows = ref<ParsedRow[]>([])

  // 高亮状态
  const highlighted = reactive({
    n: new Set<number>(), // 前区高亮 (1-frontCount)
    h: new Set<number>(), // 后区高亮 (1-backCount)
  })

  // 显示状态
  const [showDot, toggleShowDot] = useToggle(false) // 假设 useToggle 已全局导入

  // 初始化历史数据列表
  const initHisNums = () => {
    hisNums.value = Object.keys(files)
      .map((path) => {
        const m = path.match(/(\d+)\.ts$/)
        return m ? Number(m[1]) : undefined
      })
      .filter((n): n is number => typeof n === 'number')
      .sort((a, b) => a - b)

    if (hisNums.value.length > 0) {
      minHis.value = Math.min(...hisNums.value)
      maxHis.value = Math.max(...hisNums.value)
      currentHis.value = maxHis.value
    }
  }

  // 加载数据
  const loadData = async (index: number) => {
    const loading = ElLoading.service({
      lock: true,
      text: '加载中...',
      background: 'rgba(0, 0, 0, 0.7)',
      target: document.body,
    })

    try {
      const filePath = Object.keys(files).find((p) => p.endsWith(`${index}.ts`))
      if (!filePath) throw new Error('未找到数据模块')

      const mod: any = files[filePath]
      const ipt = typeof mod?.ipt === 'string' ? mod.ipt : ''

      // 数据校验
      if (!validateIptData(ipt, lotteryType === 'ssq' ? 33 : 35, lotteryType === 'ssq' ? 16 : 12)) {
        return
      }

      // 更新原始数据
      rawData.value = {
        g1: Array.isArray(mod?.g1) ? mod.g1 : [],
        g2: Array.isArray(mod?.g2) ? mod.g2 : [],
        ipt,
      }

      // 同步高亮状态
      syncHighlightFromData()
      title.value = `${lotteryType} #${index}`
      regData()
      return true
    } catch (e: any) {
      ElMessageBox.alert(`数据加载失败：${e?.message ?? e}`)
      rawData.value = { g1: [], g2: [], ipt: '' }
      return false
    } finally {
      loading.close()
    }
  }

  // 同步高亮状态
  const syncHighlightFromData = () => {
    highlighted.n.clear()
    highlighted.h.clear()
    rawData.value.g1.forEach((num) => highlighted.n.add(num))
    rawData.value.g2.forEach((num) => highlighted.h.add(num))
  }

  // 解析列属性
  const parseColumnProp = (prop: string) => {
    const match = prop.match(/^([NH])(\d+)$/)
    if (!match) return null
    return {
      type: match[1] as 'N' | 'H',
      index: parseInt(match[2], 10),
    }
  }

  // 表头配置
  const frontHeaders = computed(() =>
    Array.from({ length: frontCount }, (_, i) => ({
      label: String(i + 1).padStart(2, '0'),
      prop: `N${i + 1}`,
      width: 24,
    })),
  )

  const backHeaders = computed(() =>
    Array.from({ length: backCount }, (_, i) => ({
      label: String(i + 1).padStart(2, '0'),
      prop: `H${i + 1}`,
      width: 24,
    })),
  )

  // 解析数据为表格行（优化后）
  const regData = () => {
    if (!rawData.value.ipt) {
      parsedRows.value = []
      return []
    }

    const lines = rawData.value.ipt.trim().split('\n')
    const rows: ParsedRow[] = []

    lines.forEach((line, index) => {
      const trimmedLine = line.trim().replace(/\s+/g, '')
      if (!trimmedLine) return

      // 确定分隔符并分割数据
      const separator = trimmedLine.includes(',,') ? ',,' : ','
      const [main, tail] = trimmedLine.split(separator)

      // 快速验证（仅检查空值，其他校验已在校验阶段完成）
      if (!main || !tail) return

      // 转换前区和后区数字
      const mainArr = Array.from({ length: main.length / 2 }, (_, i) =>
        main.substring(i * 2, i * 2 + 2),
      ).filter((num) => num >= '01' && num <= String(frontCount).padStart(2, '0'))

      const tailArr = Array.from({ length: tail.length / 2 }, (_, i) =>
        tail.substring(i * 2, i * 2 + 2),
      ).filter((num) => num >= '01' && num <= String(backCount).padStart(2, '0'))

      // 构建行数据
      const row: ParsedRow = {
        id: `row_${index}`, // 唯一ID
        comma: String(mainArr.length),
        _commaRaw: mainArr.length,
        _doubleComma: separator === ',,',
      }

      // 填充前区
      frontHeaders.value.forEach((h, idx) => {
        const num = String(idx + 1).padStart(2, '0')
        row[h.prop] = mainArr.includes(num) ? (showDot.value ? '●' : num) : ''
      })

      // 填充后区
      backHeaders.value.forEach((h, idx) => {
        const num = String(idx + 1).padStart(2, '0')
        row[h.prop] = tailArr.includes(num) ? (showDot.value ? '●' : num) : ''
      })

      rows.push(row)
    })

    const sortedRows = rows.sort((a, b) => b._commaRaw - a._commaRaw)
    parsedRows.value = sortedRows
    return sortedRows
  }

  // 表格高度计算
  const getHeight = computed(() => {
    return windowHeight.value - (footerHeight.value || 0) - extraSpace
  })

  // 数据导航
  const prevHis = () => {
    const idx = hisNums.value.indexOf(currentHis.value)
    if (idx > 0) {
      currentHis.value = hisNums.value[idx - 1]
    }
  }

  const nextHis = () => {
    const idx = hisNums.value.indexOf(currentHis.value)
    if (idx >= 0 && idx < hisNums.value.length - 1) {
      currentHis.value = hisNums.value[idx + 1]
    }
  }

  const jumpToMax = () => {
    currentHis.value = maxHis.value
  }

  // 复制功能
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

    const result = lines
      .filter((line) => {
        const hasValidSeparator = line.includes(',,')
          ? line.split(',,').length === 2
          : line.split(',').length === 2
        return hasValidSeparator
      })
      .sort((a, b) => {
        const aLen = a.split(/,+/)[0].length
        const bLen = b.split(/,+/)[0].length
        return bLen - aLen
      })
      .join('\n')

    if (!result) {
      ElMessage.warning('没有可复制的内容')
      return
    }

    navigator.clipboard
      .writeText(result)
      .then(() => ElMessage.success('已复制'))
      .catch(() => ElMessage.error('复制失败'))
  }

  const copyHighlighted = () => {
    const text = Array.from(highlighted.n.values())
      .sort((a, b) => a - b)
      .map((num) => String(num).padStart(2, '0'))
      .join(',')

    if (!text) {
      ElMessage.warning('没有可复制的高亮内容')
      return
    }

    navigator.clipboard
      .writeText(text)
      .then(() => ElMessage.success('已复制高亮数据'))
      .catch(() => ElMessage.error('复制失败'))
  }

  // 切换高亮状态
  const toggleHighlight = (prop: string) => {
    const parsed = parseColumnProp(prop)
    if (!parsed) return

    const set = parsed.type === 'N' ? highlighted.n : highlighted.h
    if (set.has(parsed.index)) {
      set.delete(parsed.index)
    } else {
      set.add(parsed.index)
    }
  }

  // 单元格样式计算
  const getCellClass = (prop: string, row: ParsedRow) => {
    const parsed = parseColumnProp(prop)
    if (!parsed || !row[prop]) return ''

    const isHighlighted =
      parsed.type === 'N' ? highlighted.n.has(parsed.index) : highlighted.h.has(parsed.index)

    return isHighlighted
      ? parsed.type === 'N'
        ? 'cell-highlight-n-primary'
        : 'cell-highlight-h-primary'
      : parsed.type === 'N'
        ? 'cell-highlight-n-default'
        : 'cell-highlight-h-default'
  }

  // 分隔列样式
  const getCommaClass = (row: ParsedRow) => {
    return row._doubleComma ? 'comma-cell-double' : 'comma-cell-single'
  }

  // 初始化
  onBeforeMount(() => {
    initHisNums()
  })

  // 监听当前期数变化
  watch(currentHis, (newVal) => {
    loadData(newVal)
  })

  return {
    // DOM 引用
    footerRef,
    // 状态
    currentHis,
    minHis,
    maxHis,
    showDot,
    parsedRows,
    highlighted,
    // 配置
    frontHeaders,
    backHeaders,
    // 计算属性
    getHeight,
    // 方法
    toggleShowDot,
    prevHis,
    nextHis,
    jumpToMax,
    copyTable,
    copyHighlighted,
    toggleHighlight,
    getCellClass,
    getCommaClass,
    regData,
    // 原始数据
    rawData,
  }
}
