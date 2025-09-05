import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

function formatNumber(num) {
  return num.toString().padStart(2, '0')
}
const BALL_SIZE = 35
const BALL_LEN = 5
const list = [10, 15, 20, 50]
const __dirname = dirname(fileURLToPath(import.meta.url))
const dataPath = resolve(__dirname, './dlt.json')
const rawData = readFileSync(dataPath, 'utf-8')
const data = JSON.parse(rawData) // 解析为二维数组：[["03","04",...], ["02","11",...]]
const times = {}
for (const element of data) {
  // 遍历每一期数据
  for (const n of element) {
    // 遍历当期每个数字
    times[n] = times[n] ? times[n] + 1 : 1 // 累加次数
  }
}
const sortedTimes = Object.entries(times)
  .sort(([numA, countA], [numB, countB]) => {
    // 优先按次数降序（次数多的在前）
    if (countA !== countB) {
      return countB - countA
    }
    // 次数相同时，按数字升序（数字小的在前）
    return parseInt(numA) - parseInt(numB)
  })
  // 可选：将数组格式转为 "数字: 次数" 的字符串格式（更易读）
  .map(([num, count]) => `${num}: ${count}次`)

// 6. 写入排序后的结果到 times.txt（格式化 JSON，便于阅读）
writeFileSync(
  resolve(__dirname, `times.txt`),
  JSON.stringify(sortedTimes, null, 2), // 缩进 2 个空格，格式清晰
  'utf-8',
)

function main(windowSize) {
  const outputPath = resolve(__dirname, `DLT${windowSize}.txt`)
  const outputPathTotal = resolve(__dirname, `DLT_TOTAL${windowSize}.txt`)
  try {
    if (!Array.isArray(data) || data.length < windowSize) {
      throw new Error(`数据不足${windowSize}期，无法生成统计`)
    }

    data.forEach((draw, drawIndex) => {
      if (!Array.isArray(draw) || draw.length !== BALL_LEN) {
        throw new Error(`第${drawIndex + 1}期数据错误: 需包含${BALL_LEN}个数字`)
      }
      draw.forEach((num, numIndex) => {
        if (
          typeof num !== 'string' ||
          !/^\d{2}$/.test(num) ||
          parseInt(num) < 1 ||
          parseInt(num) > BALL_SIZE
        ) {
          throw new Error(`第${drawIndex + 1}期第${numIndex + 1}个数字错误: ${num}`)
        }
      })
    })

    // 2. 生成滑动窗口（关键修改: 包含最后一个可能没有下一期的窗口）
    // 窗口范围: n到n+19期（共20期），允许最后一个窗口没有下一期数据
    const windows = []
    for (let n = 0; n <= data.length - windowSize; n++) {
      // 修改循环条件，去掉-1，确保最后一个窗口被包含
      const windowStart = n
      const windowData = data.slice(windowStart, windowStart + windowSize) // 窗口数据: n到n+19期
      const nextPeriodIndex = windowStart + windowSize // 下一期索引: n+20
      const nextPeriodData = data[nextPeriodIndex] || null // 可能没有下一期数据（最后一个窗口）

      windows.push({
        windowIndex: n + 1,
        periodRange: `${n + 1}-${n + windowSize}期`, // 窗口期数范围（如483-502期）
        nextPeriodNum: nextPeriodIndex + 1, // 下一期期数（可能不存在）
        windowData,
        nextPeriodData, // 可能为null（最后一个窗口）
      })
    }

    const mdContent = []
    const totalContent = []
    const distributionStats = {} // 仅统计有下一期数据的窗口的累积分布

    windows.forEach((window, index) => {
      const { windowIndex, periodRange, nextPeriodNum, windowData, nextPeriodData } = window
      if (index > 0) {
        mdContent.push('---separator---')
      }
      // 窗口标题（所有窗口都显示）
      mdContent.push(`--- 第${windowIndex}窗口（${periodRange}）---`)

      // 统计窗口内数字出现次数（用于计算自身百分比分布）
      const windowNumCounts = {}
      windowData.flat().forEach((num) => {
        windowNumCounts[num] = (windowNumCounts[num] || 0) + 1
      })

      // 一、下一期分布（仅当有下一期数据时展示）
      if (nextPeriodData) {
        const nextPeriodPercentGroups = {}
        nextPeriodData.forEach((num) => {
          const count = windowNumCounts[num] || 0
          const percent = ((count / windowSize) * 100).toFixed(0)
          nextPeriodPercentGroups[percent] = (nextPeriodPercentGroups[percent] || []).concat(num)
        })
        const nextPeriodDistStr = Object.entries(nextPeriodPercentGroups)
          .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
          .map(
            ([percent, nums]) =>
              `${percent}%（${nums.sort((a, b) => parseInt(a) - parseInt(b)).join(',')}）`,
          )
          .join(' ')
        mdContent.push(`第${nextPeriodNum}期在本窗口的分布 ${nextPeriodDistStr}`)

        // 仅对有下一期数据的窗口进行累积统计
        Object.entries(nextPeriodPercentGroups).forEach(([percent, nums]) => {
          const count = nums.length
          const countKey = count.toString()
          if (!distributionStats[percent]) distributionStats[percent] = {}
          distributionStats[percent][countKey] = (distributionStats[percent][countKey] || 0) + 1
        })
      } else {
        mdContent.push('最新')
      }

      // 二、窗口自身的百分比分布（所有窗口都必须展示，包括最后一个窗口）
      const currentWindowPercentGroups = {}
      // 统计出现过的数字（百分比>0%）
      Object.entries(windowNumCounts).forEach(([num, count]) => {
        const percent = ((count / windowSize) * 100).toFixed(0)
        currentWindowPercentGroups[percent] = (currentWindowPercentGroups[percent] || []).concat(
          num,
        )
      })
      // 补充0%（未出现的数字）
      const allPossibleNums = Array.from({ length: BALL_SIZE }, (_, i) => formatNumber(i + 1))
      const zeroPercentNums = allPossibleNums.filter((num) => !windowNumCounts.hasOwnProperty(num))
      if (zeroPercentNums.length > 0) {
        currentWindowPercentGroups['0'] = zeroPercentNums
      }
      // 每个百分比单独换行展示
      Object.entries(currentWindowPercentGroups)
        .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
        .forEach(([percent, nums]) => {
          const sortedNums = nums.sort((a, b) => parseInt(a) - parseInt(b))
          mdContent.push(`${formatNumber(percent)}%: ${sortedNums.join(',')}`)
        })
    })

    // 4. 累积统计（仅包含有下一期数据的窗口）
    totalContent.push('## 累积统计' + windows.length)
    totalContent.push('\n### 下一期在窗口分布的累积')
    totalContent.push('| 百分比 | 数字个数 | 出现次数 |')
    totalContent.push('|--------------------------|')
    Object.entries(distributionStats)
      .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
      .forEach(([percent, countMap]) => {
        let total = 0
        Object.values(countMap).forEach((times) => (total += times))
        totalContent.push(`| ${percent.padEnd(6, ' ')} |   总计   | ${total}次 |`)
      })

    totalContent.push('|--------------------------|')

    Object.entries(distributionStats)
      .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
      .forEach(([percent, countMap]) => {
        let total = 0
        Object.values(countMap).forEach((times) => (total += times))
        Object.entries(countMap)
          .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
          .forEach(([count, times]) => {
            totalContent.push(`| ${percent.padEnd(6, ' ')} |    ${count}个    | ${times}次 |`)
          })
      })

    // 写入文件
    writeFileSync(outputPath, mdContent.join('\n'), 'utf-8')
    writeFileSync(outputPathTotal, totalContent.join('\n'), 'utf-8')

    console.log(`统计完成！已保存至: ${outputPath}`)
  } catch (err) {
    console.error('错误: ', err.message)
    process.exit(1)
  }
}
for (const element of list) {
  main(element)
}
