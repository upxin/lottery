import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataPathDlt = resolve(__dirname, './dlt.json')
const dataPathSsq = resolve(__dirname, './ssq.json')
const outputPathDlt = resolve(__dirname, './times_dlt.txt')
const outputPathSsq = resolve(__dirname, './times_ssq.txt')

function main(path, outputPath) {
  try {
    const rawData = readFileSync(path, 'utf-8')
    const inputData = JSON.parse(rawData)

    // 1. 统计次数
    const countMap = new Map()
    inputData.forEach((subArr) => {
      subArr.forEach((numStr) => {
        const num = Number(numStr)
        countMap.set(num, (countMap.get(num) || 0) + 1)
      })
    })

    // 2. 格式化数据
    const numList = Array.from(countMap.entries()).map(([number, count]) => ({
      number,
      count,
      displayNum: number.toString().padStart(2, '0'), // 数字固定2位显示
    }))

    // 3. 两种排序方式
    const sortedByNumber = [...numList].sort((a, b) => a.number - b.number) // 按数字升序
    const sortedByCount = [...numList].sort((a, b) => {
      // 按次数升序（同次数按数字升序）
      if (a.count !== b.count) return a.count - b.count
      return a.number - b.number
    })

    // 4. 生成纵向排列的TXT内容
    const lineSeparator = '-'.repeat(30) + '\n'
    let txtContent = '数字统计结果（纵向排列）\n'
    txtContent += lineSeparator

    // 第一部分：按数字大小排序 → 格式：数字：次数
    txtContent += '【按数字大小排序】\n'
    sortedByNumber.forEach((item) => {
      // 数字左对齐（2位），次数右对齐（3位），确保纵向对齐
      txtContent += `${item.displayNum}：${item.count.toString().padStart(3)}\n`
    })

    txtContent += '\n' + lineSeparator

    // 第二部分：按次数大小排序 → 格式：次数：数字
    txtContent += '【按次数大小排序】\n'
    sortedByCount.forEach((item) => {
      // 次数右对齐（3位），数字左对齐（2位），确保纵向对齐
      txtContent += `${item.count.toString().padStart(3)}：${item.displayNum}\n`
    })

    txtContent += lineSeparator

    // 5. 写入文件
    writeFileSync(outputPath, txtContent, 'utf8')
    console.log(`生成成功：${outputPath}`)
  } catch (error) {
    console.error(`处理 ${path} 失败：`, error.message)
    process.exit(1)
  }
}

// 处理两个文件
main(dataPathSsq, outputPathSsq)
main(dataPathDlt, outputPathDlt)
