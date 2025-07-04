import { ref, watch } from 'vue'

export function useDynamicIpt() {
  const files = import.meta.glob('../his/*.ts', { eager: true }) as Record<string, any>
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
  const ipt = ref('')
  const g1 = ref<number[]>([])
  const g2 = ref<number[]>([])

  function loadData() {
    const filePath = Object.keys(files).find((p) => p.endsWith(`${currentHis.value}.ts`))
    if (!filePath) {
      ipt.value = ''
      g1.value = []
      g2.value = []
      return
    }
    const mod: any = files[filePath]
    g1.value = mod?.g1 ?? []
    g2.value = mod?.g2 ?? []
    ipt.value = mod?.ipt || ''
  }
  loadData()
  watch(currentHis, loadData)

  function prevHis() {
    if (currentHis.value > minHis) currentHis.value = hisNums[hisNums.indexOf(currentHis.value) - 1]
  }
  function nextHis() {
    if (currentHis.value < maxHis) currentHis.value = hisNums[hisNums.indexOf(currentHis.value) + 1]
  }

  return {
    ipt,
    g1,
    g2,
    currentHis,
    minHis,
    maxHis,
    prevHis,
    nextHis,
  }
}
