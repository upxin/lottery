import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

function numberToChinese(num) {
  return num.toString().padStart(2, '0')
}

function formatNumber(num) {
  return num.toString().padStart(2, '0')
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataPath = resolve(__dirname, './ssq.json')
const outputPath = resolve(__dirname, 'ssq.md')
const WINDOW_SIZE = 20

try {
  // 1. 读取并验证数据
  const rawData = readFileSync(dataPath, 'utf-8')
  const data = JSON.parse(rawData)

  if (!Array.isArray(data) || data.length < WINDOW_SIZE) {
    throw new Error(`数据不足${WINDOW_SIZE}期，无法生成统计`)
  }

  // 验证每期数据为5个有效数字（1-35的两位字符串）
  data.forEach((draw, drawIndex) => {
    if (!Array.isArray(draw) || draw.length !== 6) {
      throw new Error(`第${drawIndex + 1}期数据错误：需包含6个数字`)
    }
    draw.forEach((num, numIndex) => {
      if (
        typeof num !== 'string' ||
        !/^\d{2}$/.test(num) ||
        parseInt(num) < 1 ||
        parseInt(num) > 33
      ) {
        throw new Error(`第${drawIndex + 1}期第${numIndex + 1}个数字错误：${num}`)
      }
    })
  })

  // 2. 生成滑动窗口
  const windows = []
  for (let i = 0; i <= data.length - WINDOW_SIZE; i++) {
    windows.push(data.slice(i, i + WINDOW_SIZE))
  }

  const mdContent = []
  // 存储“在上20期的百分比分布”的累积统计结果
  const distributionStats = {}

  // 3. 处理每组数据
  windows.forEach((window, windowIndex) => {
    const lastDraw = window[window.length - 1]
    mdContent.push(`## 第${windowIndex + 1}组（最后一期：${lastDraw.join(', ')}）`)

    // 统计当前组20期的数字分布
    const numberCounts = {}
    for (let i = 1; i <= 33; i++) {
      numberCounts[formatNumber(i)] = 0
    }
    window.flat().forEach((num) => {
      numberCounts[num]++
    })

    // 生成当前组的百分比分组（百分比→数字列表）
    const percentGroups = {}
    Object.entries(numberCounts).forEach(([num, count]) => {
      const percent = ((count / WINDOW_SIZE) * 100).toFixed(0)
      percentGroups[percent] = (percentGroups[percent] || []).concat(num)
    })

    // 4. 计算“在上20期的百分比分布”（仅第2组及以后）
    let distributionStr = ''
    if (windowIndex > 0) {
      const prevPercentGroups = windows[windowIndex - 1].percentGroups // 上一组的百分比分组
      const distribution = {}

      // 统计当前最后一期数字在上一组的百分比分布
      lastDraw.forEach((num) => {
        // 查找数字在上一组的百分比
        for (const [percent, nums] of Object.entries(prevPercentGroups)) {
          if (nums.includes(num)) {
            distribution[percent] = (distribution[percent] || 0) + 1
            break
          }
        }
      })

      // 生成分布字符串（如“30:1个 25:1个”）
      distributionStr = Object.entries(distribution)
        .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
        .map(([percent, count]) => `${percent}:${count}个`)
        .join(' ')
      mdContent.push(`在上20期的百分比分布是${distributionStr}`)

      // 5. 累积统计到distributionStats中
      Object.entries(distribution).forEach(([percent, count]) => {
        const countKey = count.toString()
        // 初始化百分比统计
        if (!distributionStats[percent]) {
          distributionStats[percent] = {}
        }
        // 初始化该百分比下的数量统计
        distributionStats[percent][countKey] = (distributionStats[percent][countKey] || 0) + 1
      })
    }

    // 输出当前组的百分比分组
    Object.entries(percentGroups)
      .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
      .forEach(([percent, nums]) => {
        mdContent.push(`${numberToChinese(percent)}: ${nums.sort().join(', ')}`)
      })

    mdContent.push('')
    // 存储当前组的百分比分组，供下一组使用
    window.percentGroups = percentGroups
  })

  // 6. 生成最终累积统计结果
  mdContent.push('## 累积统计：所有组的“在上20期的百分比分布”')
  mdContent.push('| 百分比 | 数量（个） | 出现次数 |')
  mdContent.push('|--------|------------|----------|')

  function getPercentTotalStats(distributionStats) {
    const result = []
    // 遍历每个百分比，累加次数
    Object.entries(distributionStats).forEach(([percent, countMap]) => {
      let total = 0
      // 累加当前百分比下所有数量的出现次数
      Object.values(countMap).forEach((num) => {
        total += num
      })
      result.push({ percent, total })
    })
    // 按百分比降序排序
    return result.sort((a, b) => parseInt(b.percent) - parseInt(a.percent))
  }
  const percentTotalStats = getPercentTotalStats(distributionStats)
  percentTotalStats.forEach(({ percent, total }) => {
    mdContent.push(`| ${percent}% | ${total}次 |`)
  })
  mdContent.push('|--------|------------|----------|')

  // 按百分比降序排列，相同百分比下按数量升序
  Object.entries(distributionStats)
    .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
    .forEach(([percent, countMap]) => {
      Object.entries(countMap)
        .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
        .forEach(([count, times]) => {
          mdContent.push(`| ${percent}% | ${count}个 | ${times}次 |`)
        })
    })

  // 写入文件
  writeFileSync(outputPath, mdContent.join('\n'), 'utf-8')
  console.log(`统计完成！已保存至：${outputPath}`)
} catch (err) {
  console.error('错误：', err.message)
  process.exit(1)
}
