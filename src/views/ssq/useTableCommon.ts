import { computed, ref } from 'vue'
import type { Ref } from 'vue'

export function useTableCommon(ipt: Ref<string>, g1: Ref<number[]>, g2: Ref<number[]>) {
  const showDot = ref(true)
  function toggle() {
    showDot.value = !showDot.value
  }

  const windowHeight = ref(window.innerHeight)
  const footerHeight = ref(56)
  const extraSpace = 10
  const getHeight = computed(() => windowHeight.value - footerHeight.value - extraSpace)

  // 使用 vue-router 4.x
  // 如果你用的是 vue-router@4
  // import { useRouter } from 'vue-router'
  // const router = useRouter()
  // function jumpKl8() { router.push('/kl8') }
  function jumpKl8() {}

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
    return nums.filter((n) => {
      const v = Number(n)
      return /^\d{2}$/.test(n) && v >= min && v <= max
    })
  }

  const parsedRows = computed(() => {
    if (typeof ipt.value !== 'string') return []
    const lines = ipt.value.trim().split('\n')
    const rows: any[] = []
    for (const [lineIndex, line0] of lines.entries()) {
      const line = line0.replace(/\s+/g, '')
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
      if (!/^(?:\d{2})*$/.test(main)) continue
      if (tail && !/^(?:\d{2})*$/.test(tail)) continue
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
    return rows.sort((a, b) => b._commaRaw - a._commaRaw)
  })

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

  return {
    parsedRows,
    allHeaders,
    cellStyle,
    headerCellStyle,
    getHeight,
    showDot,
    toggle,
    jumpKl8,
  }
}
