import fs from 'fs'
import path from 'path'
import { group6Inputs, directInputs, positionInputs, singleInputs } from './data.js'

// 获取当前脚本所在文件夹的绝对路径（ES模块方式）
const __dirname = path.dirname(new URL(import.meta.url).pathname)

// 组六复式处理（二维数组，[复式字符串, 倍数]）
function generateGroup6Combinations(inputArray) {
  if (!Array.isArray(inputArray)) {
    console.error('组六复式输入必须是数组')
    return []
  }

  const results = []
  for (const [input, multiplier = 1] of inputArray) {
    const numbers = input
      .trim()
      .split(/\s+/)
      .filter((num, index, self) => self.indexOf(num) === index)

    const len = numbers.length
    if (len < 3) {
      console.warn(`组六复式"${input}"：数字不足3个或存在重复，无法生成组合`)
      continue
    }

    for (let i = 0; i < len; i++) {
      for (let j = i + 1; j < len; j++) {
        for (let k = j + 1; k < len; k++) {
          const combination = [numbers[i], numbers[j], numbers[k]].sort((a, b) => a - b).join('')
          results.push({ comb: combination, multi: multiplier })
        }
      }
    }
  }

  return results
}

// 直选复式处理（二维数组，[复式字符串, 倍数]）
function generateDirectElectionCombinations(inputArray) {
  if (!Array.isArray(inputArray)) {
    console.error('直选复式输入必须是数组')
    return []
  }

  const results = []
  for (const [input, multiplier = 1] of inputArray) {
    const rawNumbers = input.trim().split(/\s+/)
    const validNumbers = []
    const uniqueNumbers = new Set()

    for (const num of rawNumbers) {
      if (/^\d{1,2}$/.test(num)) {
        const normalized = parseInt(num, 10).toString()
        const numValue = parseInt(normalized, 10)
        if (numValue >= 0 && numValue <= 9 && !uniqueNumbers.has(normalized)) {
          uniqueNumbers.add(normalized)
          validNumbers.push(normalized)
        }
      }
    }

    if (validNumbers.length === 0) {
      console.error(`直选复式"${input}"：无效输入，需提供0-9的数字`)
      continue
    }

    const length = validNumbers.length
    for (let h = 0; h < length; h++) {
      for (let t = 0; t < length; t++) {
        for (let u = 0; u < length; u++) {
          const combination = validNumbers[h] + validNumbers[t] + validNumbers[u]
          results.push({ comb: combination, multi: multiplier })
        }
      }
    }
  }

  return results
}

// 分位置复式处理（三维数组，[[百位, 十位, 个位], 倍数]）
function generatePositionCombinations(positionArrays) {
  if (!Array.isArray(positionArrays)) {
    console.error('分位置复式输入必须是数组')
    return []
  }

  const results = []
  for (const [positionArray, multiplier = 1] of positionArrays) {
    if (!Array.isArray(positionArray) || positionArray.length !== 3) {
      console.error('分位置复式方案必须是包含3个元素的数组（百位、十位、个位）')
      continue
    }

    const [hundredsStr, tensStr, unitsStr] = positionArray
    const positions = [
      parseAndValidateNumbers(hundredsStr, '百位'),
      parseAndValidateNumbers(tensStr, '十位'),
      parseAndValidateNumbers(unitsStr, '个位'),
    ]

    if (positions.some((nums) => nums.length === 0)) {
      console.error('当前分位置方案中至少有一个位置没有有效数字，跳过该方案')
      continue
    }

    const [hundreds, tens, units] = positions
    for (const h of hundreds) {
      for (const t of tens) {
        for (const u of units) {
          const combination = `${h}${t}${u}`
          results.push({ comb: combination, multi: multiplier })
        }
      }
    }
  }

  return results
}

// 单式处理（二维数组，[单式字符串, 倍数]）
function generateSingleCombinations(singleArray) {
  if (!Array.isArray(singleArray)) {
    console.error('单式输入必须是数组')
    return []
  }

  const results = []
  for (const [input, multiplier = 1] of singleArray) {
    const numbers = input.trim().split(/\s+/)
    if (numbers.length !== 3) {
      console.error(`单式"${input}"：格式错误，必须包含3个数字`)
      continue
    }

    let valid = true
    const normalizedNumbers = []
    for (const num of numbers) {
      if (!/^\d{1}$/.test(num) || parseInt(num, 10) < 0 || parseInt(num, 10) > 9) {
        valid = false
        break
      }
      normalizedNumbers.push(num)
    }

    if (!valid) {
      console.error(`单式"${input}"：包含无效数字，必须是0-9的单个数字`)
      continue
    }

    const combination = normalizedNumbers.join('')
    results.push({ comb: combination, multi: multiplier })
  }

  return results
}

function parseAndValidateNumbers(input, positionName) {
  const rawNumbers = input.trim().split(/\s+/)
  const validNumbers = []
  const uniqueNumbers = new Set()

  for (const num of rawNumbers) {
    if (/^\d{1,2}$/.test(num)) {
      const normalized = parseInt(num, 10).toString()
      const numValue = parseInt(normalized, 10)
      if (numValue >= 0 && numValue <= 9 && !uniqueNumbers.has(normalized)) {
        uniqueNumbers.add(normalized)
        validNumbers.push(normalized)
      }
    }
  }

  if (validNumbers.length === 0) {
    console.warn(`${positionName}无有效数字（需提供0-9的数字）`)
  }

  return validNumbers
}

function generateAllPossibleCombinations() {
  const allCombinations = []
  for (let i = 0; i < 1000; i++) {
    allCombinations.push(i.toString().padStart(3, '0'))
  }
  return allCombinations
}

function analyzeAllCombinations() {
  const group6Combinations = generateGroup6Combinations(group6Inputs)
  const directCombinations = generateDirectElectionCombinations(directInputs)
  const positionCombinations = generatePositionCombinations(positionInputs)
  const singleCombinations = generateSingleCombinations(singleInputs)

  const allCombinations = [
    ...group6Combinations,
    ...directCombinations,
    ...positionCombinations,
    ...singleCombinations,
  ]
  const singlList = [...directCombinations, ...positionCombinations, ...singleCombinations]

  const countMap = {}
  allCombinations.forEach(({ comb, multi }) => {
    countMap[comb] = (countMap[comb] || 0) + multi
  })

  const totalBets = allCombinations.reduce((sum, { multi }) => sum + multi, 0)

  const sortedCombinations = Object.entries(countMap)
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1]
      return a[0].localeCompare(b[0])
    })
    .map(([comb, count]) => ({ comb, count }))

  const allPossible = generateAllPossibleCombinations()
  const selectedCombinations = new Set(Object.keys(countMap))
  const unselectedCombinations = allPossible.filter((comb) => !selectedCombinations.has(comb))

  return {
    sorted: sortedCombinations,
    totalBets,
    uniqueSelected: sortedCombinations.length,
    unselected: unselectedCombinations,
    totalPossible: allPossible.length,
    group6Combinations,
    directCombinations,
    singlList,
  }
}

// 核心修复：使用脚本所在目录__dirname拼接路径
function writeCombinationCountFile(sortedCombinations, name) {
  // 生成文件路径：脚本所在文件夹 + 文件名
  const filePath = path.join(__dirname, name || '3dcombinations_count.txt')
  const content = sortedCombinations.map((item) => `${item.comb}（${item.count}次）`).join('\n')

  fs.writeFile(filePath, content, (err) => {
    if (err) {
      console.error('写入组合次数文件时出错:', err)
      return
    }
    console.log(`组合次数统计已写入：${filePath}`)
  })
}

function writeUnselectedFile(unselectedCombinations) {
  const filePath = path.join(__dirname, '3dno.txt')
  const content = unselectedCombinations.join('\n')

  fs.writeFile(filePath, content, (err) => {
    if (err) {
      console.error('写入未选择组合文件时出错:', err)
      return
    }
    console.log(`未选择的组合已写入：${filePath}`)
  })
}

function generateNumberFrequency(analysisResult) {
  // 初始化0-9的计数
  const numberCounts = Array.from({ length: 10 }, (_, i) => ({
    number: i.toString(),
    count: 0,
  }))

  // 累加每个数字的出现次数（考虑组合的重复次数）
  analysisResult.sorted.forEach(({ comb, count }) => {
    comb.split('').forEach((digit) => {
      const index = parseInt(digit, 10)
      numberCounts[index].count += count
    })
  })

  // 转换格式以适配writeCombinationCountFile（将number映射为comb）
  return numberCounts
    .sort((a, b) => b.count - a.count || a.number.localeCompare(b.number))
    .map((item) => ({ comb: item.number, count: item.count }))
}
function analyzeSinglList(singlList) {
  // 统计次数（累加倍数）
  const countMap = {}
  singlList.forEach(({ comb, multi }) => {
    countMap[comb] = (countMap[comb] || 0) + multi
  })

  // 按次数降序、组合升序排序
  return Object.entries(countMap)
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1]
      return a[0].localeCompare(b[0])
    })
    .map(([comb, count]) => ({ comb, count }))
}

function run() {
  const result = analyzeAllCombinations()

  writeCombinationCountFile(result.sorted)

  const group6WithCount = result.group6Combinations.map((item) => ({
    comb: item.comb,
    count: item.multi, // 将倍数映射为count，匹配文件生成函数的预期
  }))
  writeCombinationCountFile(group6WithCount, '3d6.txt')

  writeUnselectedFile(result.unselected)

  // 新增：生成数字频率文件（复用现有函数）
  const numberFrequency = generateNumberFrequency(result)
  writeCombinationCountFile(numberFrequency, '3dnumber_count.txt')

  const singlListStats = analyzeSinglList(result.singlList)
  writeCombinationCountFile(singlListStats, '3dsingl_list_combinations.txt')
}

run()
