import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
function numberToChinese(num) {
  const index = num / 5
  return String(num)
  // return String.fromCharCode('a'.charCodeAt(0) + index)
}
// 获取当前脚本所在目录
const __dirname = dirname(fileURLToPath(import.meta.url))

// 数据文件路径（根据实际位置调整）
const dataPath = resolve(__dirname, './dlt.json') // 假设dlt.json在rate文件夹下

try {
  const rawData = readFileSync(dataPath, 'utf-8')
  const data = JSON.parse(rawData)
  const WINDOW_SIZE = 20

  if (data.length < WINDOW_SIZE) {
    console.error(`数据不足${WINDOW_SIZE}期，无法生成统计报告！`)
    process.exit(1)
  }

  const windows = []
  for (let i = 0; i <= data.length - WINDOW_SIZE; i++) {
    windows.push(data.slice(i, i + WINDOW_SIZE))
  }

  const mdContent = []

  windows.forEach((window, windowIndex) => {
    const lastDraw = window[window.length - 1]
    const title = `## 第${windowIndex + 1}组（最后一期：${lastDraw.join(', ')}）`
    mdContent.push(title)

    // 初始化1-35的数字计数
    const numberCounts = {}
    for (let i = 1; i <= 35; i++) {
      const num = i.toString().padStart(2, '0')
      numberCounts[num] = 0
    }

    // 统计出现次数
    const allNumbers = window.flat()
    allNumbers.forEach((num) => {
      numberCounts[num]++
    })

    // 按百分比分组（保留0位小数）
    const percentageMap = {}
    Object.entries(numberCounts).forEach(([num, count]) => {
      const percentage = ((count / WINDOW_SIZE) * 100).toFixed(0)
      if (!percentageMap[percentage]) {
        percentageMap[percentage] = []
      }
      percentageMap[percentage].push(num)
    })

    // 排序并生成结果
    const result = Object.entries(percentageMap)
      .map(([percent, nums]) => ({
        percent,
        nums: nums.sort(),
      }))
      .sort((a, b) => parseFloat(b.percent) - parseFloat(a.percent))

    // 生成Markdown内容
    result.forEach((item) => {
      mdContent.push(`${numberToChinese(item.percent)}: ${item.nums.join(', ')}`)
    })
    mdContent.push('')
  })

  // 导出到当前文件夹（rate文件夹），名称为dlt.md
  const outputPath = resolve(__dirname, 'dlt.md')
  writeFileSync(outputPath, mdContent.join('\n'), 'utf-8')
  console.log(`统计完成！共生成${windows.length}组数据，结果已保存至"${outputPath}"`)
} catch (err) {
  console.error('错误：', err.message)
  console.log('请检查dlt.json文件是否存在，以及路径是否正确！')
}
