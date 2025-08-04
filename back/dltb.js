import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

function formatNumber(num) {
  return num.toString().padStart(2, '0')
}
const BALL_SIZE = 12
const BALL_LEN = 2
const WINDOW_SIZE = 20

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataPath = resolve(__dirname, './dltb.json')
const outputPath = resolve(__dirname, 'DLTB.txt')

try {
  // 1. 读取并验证数据
  const rawData = readFileSync(dataPath, 'utf-8')
  const data = JSON.parse(rawData)

  if (!Array.isArray(data) || data.length < WINDOW_SIZE) {
    throw new Error(`数据不足${WINDOW_SIZE}期，无法生成统计`)
  }

  data.forEach((draw, drawIndex) => {
    if (!Array.isArray(draw) || draw.length !== BALL_LEN) {
      throw new Error(`第${drawIndex + 1}期数据错误：需包含${BALL_LEN}个数字`)
    }
    draw.forEach((num, numIndex) => {
      if (
        typeof num !== 'string' ||
        !/^\d{2}$/.test(num) ||
        parseInt(num) < 1 ||
        parseInt(num) > BALL_SIZE
      ) {
        throw new Error(`第${drawIndex + 1}期第${numIndex + 1}个数字错误：${num}`)
      }
    })
  })

  // 2. 生成滑动窗口
  const windows = []
  for (let n = 0; n <= data.length - WINDOW_SIZE; n++) {
    const windowStart = n
    const windowData = data.slice(windowStart, windowStart + WINDOW_SIZE)
    const nextPeriodIndex = windowStart + WINDOW_SIZE
    const nextPeriodData = data[nextPeriodIndex] || null

    windows.push({
      windowIndex: n + 1,
      periodRange: `${n + 1}-${n + WINDOW_SIZE}期`,
      nextPeriodNum: nextPeriodIndex + 1,
      windowData,
      nextPeriodData,
    })
  }

  const mdContent = []
  const distributionStats = {} // 下一期分布累积统计
  const combinationStats = {} // 百分比组合统计

  // 3. 处理每个窗口
  windows.forEach((window) => {
    const { windowIndex, periodRange, nextPeriodNum, windowData, nextPeriodData } = window

    mdContent.push(`--- 第${windowIndex}窗口（${periodRange}）---`)

    const windowNumCounts = {}
    windowData.flat().forEach((num) => {
      windowNumCounts[num] = (windowNumCounts[num] || 0) + 1
    })

    // 一、下一期分布
    if (nextPeriodData) {
      const nextPeriodPercentGroups = {}
      nextPeriodData.forEach((num) => {
        const count = windowNumCounts[num] || 0
        const percent = ((count / WINDOW_SIZE) * 100).toFixed(0)
        nextPeriodPercentGroups[percent] = (nextPeriodPercentGroups[percent] || []).concat(num)
      })
      const nextPeriodDistStr = Object.entries(nextPeriodPercentGroups)
        .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
        .map(
          ([percent, nums]) =>
            `${percent}%:${nums.sort((a, b) => parseInt(a) - parseInt(b)).join(',')}`,
        )
        .join('  ')
      mdContent.push(`第${nextPeriodNum}期在本窗口的分布：${nextPeriodDistStr}`)

      // 累积分布统计
      Object.entries(nextPeriodPercentGroups).forEach(([percent, nums]) => {
        const count = nums.length
        const countKey = count.toString()
        if (!distributionStats[percent]) distributionStats[percent] = {}
        distributionStats[percent][countKey] = (distributionStats[percent][countKey] || 0) + 1
      })

      // 百分比组合统计
      const percentKeys = Object.keys(nextPeriodPercentGroups).sort(
        (a, b) => parseInt(a) - parseInt(b),
      )
      const combinationKey = percentKeys.join(',')
      combinationStats[combinationKey] = (combinationStats[combinationKey] || 0) + 1
    } else {
      mdContent.push('')
    }

    // 二、窗口自身的百分比分布
    const currentWindowPercentGroups = {}
    Object.entries(windowNumCounts).forEach(([num, count]) => {
      const percent = ((count / WINDOW_SIZE) * 100).toFixed(0)
      currentWindowPercentGroups[percent] = (currentWindowPercentGroups[percent] || []).concat(num)
    })
    const allPossibleNums = Array.from({ length: BALL_SIZE }, (_, i) => formatNumber(i + 1))
    const zeroPercentNums = allPossibleNums.filter((num) => !windowNumCounts.hasOwnProperty(num))
    if (zeroPercentNums.length > 0) {
      currentWindowPercentGroups['0'] = zeroPercentNums
    }
    Object.entries(currentWindowPercentGroups)
      .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
      .forEach(([percent, nums]) => {
        const sortedNums = nums.sort((a, b) => parseInt(a) - parseInt(b))
        mdContent.push(`${formatNumber(parseInt(percent, 10))}%: ${sortedNums.join(',')}`)
      })
    mdContent.push('\n')
  }) // 修复：确保forEach回调函数正确闭合

  // 4. 累积统计（原有部分）
  mdContent.push('## 累积统计（仅含存在下一期数据的窗口）')
  mdContent.push('\n### 下一期在窗口分布的累积')
  mdContent.push('| 百分比   | 数字个数 | 出现次数 |') // 统一列宽提示
  mdContent.push('| -------------------------- |') // 第一列左对齐，第三列右对齐
  Object.entries(distributionStats)
    .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
    .forEach(([percent, countMap]) => {
      let total = 0
      Object.values(countMap).forEach((times) => (total += times))
      mdContent.push(`| ${percent.padEnd(10, ' ')}  |   总计   | ${total}次 |`) // 百分比后加空格补位
    })

  mdContent.push('| -------------------------- |') // 分隔线与表头对应

  Object.entries(distributionStats)
    .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
    .forEach(([percent, countMap]) => {
      Object.entries(countMap)
        .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
        .forEach(([count, times]) => {
          mdContent.push(`| ${percent.padEnd(8, ' ')}  |    ${count}个    | ${times}次 |`) // 统一空格补位
        })
    })

  // 新增：百分比组合统计（确保对齐）
  mdContent.push('\n### 百分比组合出现次数统计')
  mdContent.push('| 组合（百分比）   | 出现次数 |') // 列名预留足够宽度
  mdContent.push('| -------------------------- |') // 第一列左对齐，第二列右对齐
  Object.entries(combinationStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([combination, times]) => {
      const formattedCombination = combination
        .split(',')
        .map((p) => `${p}%`)
        .join('+')
      // 确保每个单元格严格用 | 分隔，无多余空格
      mdContent.push(
        `| ${formattedCombination.padEnd(10, ' ')} | ${times.toString().padStart(3, ' ')}次 |`,
      )
    })

  // 写入文件
  writeFileSync(outputPath, mdContent.join('\n'), 'utf-8')
  console.log(`统计完成！已保存至：${outputPath}`)
} catch (err) {
  console.error('错误：', err.message)
  process.exit(1)
}
