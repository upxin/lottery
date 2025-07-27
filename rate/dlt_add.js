import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// 获取当前脚本所在目录
const __dirname = dirname(fileURLToPath(import.meta.url))

// 数据文件路径（根据实际位置调整）
const dataPath = resolve(__dirname, './dlt.json')

try {
  const rawData = readFileSync(dataPath, 'utf-8')
  const data = JSON.parse(rawData)
  const TOTAL_DATA = data.length
  const WINDOW_SIZE = 20

  const mdContent = []

  // 计算完整周期数和剩余数据
  const fullCycles = Math.floor(TOTAL_DATA / WINDOW_SIZE)
  const remainingData = TOTAL_DATA % WINDOW_SIZE

  // 处理完整周期
  for (let cycle = 0; cycle < fullCycles; cycle++) {
    const cycleStart = cycle * WINDOW_SIZE

    // 每个周期内从1到20条数据
    for (let i = 1; i <= WINDOW_SIZE; i++) {
      const windowEnd = cycleStart + i - 1
      const window = data.slice(cycleStart, windowEnd + 1)
      const lastDraw = window[window.length - 1]

      // 计算全局序号（从1开始）
      const globalIndex = cycle * WINDOW_SIZE + i

      const title = `## 第${globalIndex}组（周期内序号：${i}，共累加${i}条，最后一期：${lastDraw.join(', ')}）`
      mdContent.push(title)

      // 统计数字出现次数
      const numberCounts = {}
      for (let j = 1; j <= 35; j++) {
        const num = j.toString().padStart(2, '0')
        numberCounts[num] = 0
      }

      window.flat().forEach((num) => {
        numberCounts[num]++
      })

      // 按次数分组并排序
      const countMap = {}
      Object.entries(numberCounts).forEach(([num, count]) => {
        if (!countMap[count]) countMap[count] = []
        countMap[count].push(num)
      })

      const result = Object.entries(countMap)
        .map(([count, nums]) => ({ count: parseInt(count), nums: nums.sort() }))
        .sort((a, b) => b.count - a.count)

      // 生成Markdown内容
      result.forEach((item) => {
        mdContent.push(`- 出现 ${item.count} 次: ${item.nums.join(', ')}`)
      })
      mdContent.push('')
    }
  }

  // 处理剩余数据（不足20条的最后一个周期）
  if (remainingData > 0) {
    const cycleStart = fullCycles * WINDOW_SIZE

    // 最后一个周期从1到剩余数据条数
    for (let i = 1; i <= remainingData; i++) {
      const windowEnd = cycleStart + i - 1
      const window = data.slice(cycleStart, windowEnd + 1)
      const lastDraw = window[window.length - 1]

      // 计算全局序号
      const globalIndex = fullCycles * WINDOW_SIZE + i

      const title = `## 第${globalIndex}组（周期内序号：${i}，共累加${i}条，最后一期：${lastDraw.join(', ')}）`
      mdContent.push(title)

      // 统计数字出现次数（同上）
      const numberCounts = {}
      for (let j = 1; j <= 35; j++) {
        const num = j.toString().padStart(2, '0')
        numberCounts[num] = 0
      }

      window.flat().forEach((num) => {
        numberCounts[num]++
      })

      // 按次数分组并排序（同上）
      const countMap = {}
      Object.entries(numberCounts).forEach(([num, count]) => {
        if (!countMap[count]) countMap[count] = []
        countMap[count].push(num)
      })

      const result = Object.entries(countMap)
        .map(([count, nums]) => ({ count: parseInt(count), nums: nums.sort() }))
        .sort((a, b) => b.count - a.count)

      // 生成Markdown内容
      result.forEach((item) => {
        mdContent.push(`- 出现 ${item.count} 次: ${item.nums.join(', ')}`)
      })
      mdContent.push('')
    }
  }

  // 导出到当前文件夹
  const outputPath = resolve(__dirname, 'dlt_add.md')
  writeFileSync(outputPath, mdContent.join('\n'), 'utf-8')
  console.log(`统计完成！共生成${TOTAL_DATA}组数据，结果已保存至"${outputPath}"`)
} catch (err) {
  console.error('错误：', err.message)
  console.log('请检查dlt.json文件是否存在，以及路径是否正确！')
}
