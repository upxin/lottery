import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// 配置参数
const WINDOW_SIZE = 20 // 滑动窗口大小（每20期一个周期）
const __dirname = dirname(fileURLToPath(import.meta.url))

try {
  // 1. 读取3d.json数据
  const jsonPath = resolve(__dirname, '3d.json')
  const rawData = readFileSync(jsonPath, 'utf-8')
  const allData = JSON.parse(rawData)

  // 2. 验证数据格式
  if (!Array.isArray(allData)) {
    throw new Error('3d.json必须是数组')
  }
  allData.forEach((item, index) => {
    if (!Array.isArray(item) || item.length !== 3) {
      throw new Error(`第${index + 1}期数据错误：需包含3个元素（百位、十位、个位）`)
    }
    item.forEach((num, posIndex) => {
      const numVal = parseInt(num, 10)
      if (isNaN(numVal) || numVal < 0 || numVal > 9) {
        throw new Error(`第${index + 1}期第${posIndex + 1}位错误：必须是0-9的数字（值：${num}）`)
      }
    })
  })

  // 3. 验证数据量
  if (allData.length < WINDOW_SIZE) {
    throw new Error(`数据不足${WINDOW_SIZE}期，无法生成滑动窗口`)
  }

  // 4. 生成滑动窗口
  const windows = []
  const totalWindows = allData.length - WINDOW_SIZE + 1
  for (let i = 0; i < totalWindows; i++) {
    const start = i
    const end = i + WINDOW_SIZE
    const windowData = allData.slice(start, end)
    const nextPeriodData = allData[end] || null

    windows.push({
      windowIndex: i + 1,
      startPeriod: start + 1,
      endPeriod: end,
      data: windowData,
      nextPeriodData: nextPeriodData,
      nextPeriodNum: end + 1,
    })
  }

  // 5. 窗口统计函数（按百分比分组：百分比 → 数字列表）
  function statsWindow(windowData) {
    // 初始化计数（每个数字出现次数）
    const windowStats = {
      百位: Array.from({ length: 10 }, () => 0),
      十位: Array.from({ length: 10 }, () => 0),
      个位: Array.from({ length: 10 }, () => 0),
    }

    // 统计次数
    windowData.forEach(([hundreds, tens, units]) => {
      const h = parseInt(hundreds, 10)
      const t = parseInt(tens, 10)
      const u = parseInt(units, 10)
      windowStats.百位[h]++
      windowStats.十位[t]++
      windowStats.个位[u]++
    })

    // 按百分比分组（核心逻辑：次数→百分比，再分组）
    const formatByPercent = (statsArray) => {
      const percentGroups = {} // 键：百分比（字符串），值：数字数组

      statsArray.forEach((count, num) => {
        if (count === 0) return // 跳过0次的数字
        // 计算百分比（次数/窗口大小*100，保留0位小数）
        const percent = Math.round((count / WINDOW_SIZE) * 100)
        const percentKey = `${percent}%`

        // 数字加入对应百分比组
        if (!percentGroups[percentKey]) {
          percentGroups[percentKey] = []
        }
        percentGroups[percentKey].push(num)
      })

      // 排序：百分比从高到低，同百分比内数字从小到大
      return Object.entries(percentGroups)
        .sort((a, b) => {
          // 提取百分比数值进行比较（如"35%"→35）
          const percentA = parseInt(a[0].replace('%', ''), 10)
          const percentB = parseInt(b[0].replace('%', ''), 10)
          return percentB - percentA // 降序
        })
        .map(([percent, nums]) => {
          // 数字从小到大排序，用逗号分隔
          return `${percent}: ${nums.sort((a, b) => a - b).join(', ')}`
        })
        .join('  ') // 不同百分比组用两个空格分隔
    }

    return {
      raw: windowStats,
      byPercent: {
        百位: formatByPercent(windowStats.百位),
        十位: formatByPercent(windowStats.十位),
        个位: formatByPercent(windowStats.个位),
      },
    }
  }

  // 6. 执行所有窗口统计
  const allWindowResults = []
  windows.forEach((window) => {
    const statsResult = statsWindow(window.data)
    allWindowResults.push({
      windowIndex: window.windowIndex,
      periodRange: `${window.startPeriod}-${window.endPeriod}期`,
      nextPeriodData: window.nextPeriodData,
      nextPeriodNum: window.nextPeriodNum,
      rawStats: statsResult.raw,
      percentStats: statsResult.byPercent,
    })
  })

  // 7. 生成输出内容
  const outputLines = []
  outputLines.push(`=== 滑动窗口位置统计（窗口大小：${WINDOW_SIZE}期） ===`)
  outputLines.push(`总窗口数：${allWindowResults.length}\n`)

  allWindowResults.forEach((currentWindow) => {
    const { windowIndex, periodRange, nextPeriodData, nextPeriodNum, percentStats } = currentWindow

    outputLines.push(`--- 第${windowIndex}窗口（${periodRange}） ---`)

    // 下一期数据在本窗口的分布（顶部展示）
    if (nextPeriodData) {
      const [nextH, nextT, nextU] = nextPeriodData
      const hNum = parseInt(nextH, 10)
      const tNum = parseInt(nextT, 10)
      const uNum = parseInt(nextU, 10)

      const hCount = currentWindow.rawStats.百位[hNum]
      const tCount = currentWindow.rawStats.十位[tNum]
      const uCount = currentWindow.rawStats.个位[uNum]

      const hPercent = Math.round((hCount / WINDOW_SIZE) * 100)
      const tPercent = Math.round((tCount / WINDOW_SIZE) * 100)
      const uPercent = Math.round((uCount / WINDOW_SIZE) * 100)

      outputLines.push(`【第${nextPeriodNum}期在本窗口的分布】：`)
      outputLines.push(
        `数据：${nextPeriodData.join(' ')} ` +
          `| 百位${nextH}：${hCount}次(${hPercent}%) ` +
          `| 十位${nextT}：${tCount}次(${tPercent}%) ` +
          `| 个位${nextU}：${uCount}次(${uPercent}%)`,
      )
    }

    // 按“百分比→数字”展示当前窗口统计
    outputLines.push(`【当前窗口位置统计（百分比→数字）】：`)
    outputLines.push(`百位：${percentStats.百位}`)
    outputLines.push(`十位：${percentStats.十位}`)
    outputLines.push(`个位：${percentStats.个位}`)
    outputLines.push('\n') // 空行分隔窗口
  })

  // 8. 输出到控制台和文件
  console.log(outputLines.join('\n'))
  const outputPath = resolve(__dirname, '3d.txt')
  writeFileSync(outputPath, outputLines.join('\n'), 'utf-8')
  console.log(`\n统计结果已写入：${outputPath}`)
} catch (err) {
  console.error('统计失败：', err.message)
  process.exit(1)
}
