import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

function formatNumber(num) {
  return num.toString().padStart(2, '0')
}
const BALL_SIZE = 12
const BALL_LEN = 2

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataPath = resolve(__dirname, './ssqb.json')
const outputPath = resolve(__dirname, 'SSQB.md')
const WINDOW_SIZE = 30

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
  for (let i = 0; i <= data.length - WINDOW_SIZE; i++) {
    windows.push(data.slice(i, i + WINDOW_SIZE))
  }

  const mdContent = []
  const distributionStats = {}
  const combinationStats = {}

  // 3. 处理每组数据
  windows.forEach((window, windowIndex) => {
    const lastDraw = window[window.length - 1]
    mdContent.push(`## 第${windowIndex + 1}组（最后一期：${lastDraw.join(' ')}）`)

    // 统计当前组20期的数字分布
    const numberCounts = {}
    for (let i = 1; i <= BALL_SIZE; i++) {
      numberCounts[formatNumber(i)] = 0
    }
    window.flat().forEach((num) => {
      numberCounts[num]++
    })

    // 生成当前组的百分比分组
    const percentGroups = {}
    Object.entries(numberCounts).forEach(([num, count]) => {
      const percent = ((count / WINDOW_SIZE) * 100).toFixed(0)
      percentGroups[percent] = (percentGroups[percent] || []).concat(num)
    })

    // 4. 计算上20期的百分比分布
    let distributionStr = ''
    if (windowIndex > 0) {
      const prevPercentGroups = windows[windowIndex - 1].percentGroups
      const distribution = {}

      lastDraw.forEach((num) => {
        for (const [percent, nums] of Object.entries(prevPercentGroups)) {
          if (nums.includes(num)) {
            distribution[percent] = (distribution[percent] || 0) + 1
            break
          }
        }
      })

      distributionStr = Object.entries(distribution)
        .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
        .map(([percent, count]) => `${percent}(${count}个)`)
        .join(' ')
      mdContent.push(`在上${WINDOW_SIZE}期的百分比分布 ${distributionStr}`)

      // 累积统计
      Object.entries(distribution).forEach(([percent, count]) => {
        const countKey = count.toString()
        if (!distributionStats[percent]) {
          distributionStats[percent] = {}
        }
        distributionStats[percent][countKey] = (distributionStats[percent][countKey] || 0) + 1
      })

      // 统计百分比组合
      const currentCombination = Object.keys(distribution).sort((a, b) => parseInt(a) - parseInt(b))
      if (currentCombination.length > 0) {
        const combinationKey = currentCombination.join(',')
        combinationStats[combinationKey] = (combinationStats[combinationKey] || 0) + 1
      }
    }

    // 输出当前组的百分比分组
    Object.entries(percentGroups)
      .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
      .forEach(([percent, nums]) => {
        mdContent.push(`${formatNumber(percent)}% : ${nums.sort().join(', ')}`)
      })

    mdContent.push('')
    window.percentGroups = percentGroups
  })

  mdContent.push('## 累积周期：' + windows.length)

  // 优化表格对齐 - 百分比分布累积统计
  mdContent.push('\n### 百分比分布累积统计')
  // 使用冒号设置对齐方式：左对齐|居中|右对齐
  mdContent.push('| 百分比   | 数量（个） | 出现次数 |')
  mdContent.push('| :------- | :---------: | -------: |') // 关键：通过冒号控制对齐

  function getPercentTotalStats(distributionStats) {
    const result = []
    Object.entries(distributionStats).forEach(([percent, countMap]) => {
      let total = 0
      Object.values(countMap).forEach((num) => {
        total += num
      })
      result.push({ percent, total })
    })
    return result.sort((a, b) => parseInt(b.percent) - parseInt(a.percent))
  }
  const percentTotalStats = getPercentTotalStats(distributionStats)
  percentTotalStats.forEach(({ percent, total }) => {
    mdContent.push(`| ${formatNumber(percent)}% |    总计    | ${total}次 |`)
  })

  Object.entries(distributionStats)
    .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
    .forEach(([percent, countMap]) => {
      Object.entries(countMap)
        .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
        .forEach(([count, times]) => {
          // 统一数字宽度，确保对齐
          mdContent.push(`| ${formatNumber(percent)}% |    ${count}个    | ${times}次 |`)
        })
    })

  // 优化表格对齐 - 百分比组合统计
  mdContent.push('\n### 百分比组合出现次数统计')
  mdContent.push('| 百分比组合         | 出现次数 |')
  mdContent.push('| :---------------- | -------: |') // 左对齐组合，右对齐次数

  // 按出现次数降序排列，统一格式宽度
  Object.entries(combinationStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([combination, times]) => {
      const formattedCombination = combination
        .split(',')
        .map((p) => `${p}%`)
        .join(' + ')
      // 对短组合补充空格，增强视觉对齐（Markdown会自动忽略多余空格，但视觉上更整齐）
      const paddedCombination = formattedCombination.padEnd(15, ' ')
      mdContent.push(`| ${paddedCombination} | ${times}次 |`)
    })

  // 写入文件
  writeFileSync(outputPath, mdContent.join('\n'), 'utf-8')
  console.log(`统计完成！已保存至：${outputPath}`)
} catch (err) {
  console.error('错误：', err.message)
  process.exit(1)
}
