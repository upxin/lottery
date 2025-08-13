export function convertToSingleTickets(input, lotteryType) {
  const FRONT_BALL_COUNT = lotteryType === 'ssq' ? 6 : 5 // 前区数字数量
  const BACK_BALL_COUNT = lotteryType === 'ssq' ? 1 : 2 // 后区数字数量

  const lines = input.trim().split('\n')
  const singleTickets = []
  lines.forEach((line, lineIdx) => {
    try {
      if (!line.length) {
        return
      }
      // 处理格式：去除空格、合并多逗号、分割前后区
      const [frontRaw, backRaw] = line.replace(/\s+/g, '').replace(/,,+/g, ',').split(',')

      if (!frontRaw || !backRaw) {
        console.warn(`${lineIdx}格式错误： ${line}`)
        return
      }

      // 提取前后区数字（每2位一个数字）
      const frontBalls = frontRaw.match(/.{2}/g) || []
      const backBalls = backRaw.match(/.{2}/g) || []

      // 校验数量
      if (frontBalls.length < FRONT_BALL_COUNT) {
        console.warn(`第${lineIdx + 1}行前区数字不足${FRONT_BALL_COUNT}个，跳过`)
        return
      }
      if (backBalls.length < BACK_BALL_COUNT) {
        console.warn(`第${lineIdx + 1}行后区数字不足${BACK_BALL_COUNT}个，跳过`)
        return
      }

      // 生成前后区组合
      const frontCombinations = combination(frontBalls, FRONT_BALL_COUNT)
      const backCombinations = combination(backBalls, BACK_BALL_COUNT)

      // 交叉组合成单式票
      frontCombinations.forEach((fronts) => {
        backCombinations.forEach((backs) => {
          const sortedFronts = [...fronts].sort((a, b) => a - b)
          singleTickets.push({
            front: sortedFronts, // 前区数字数组
            back: backs, // 后区数字数组
            full: `${sortedFronts.join(' ')} ${backs.join(' ')}`,
          })
        })
      })
    } catch (err) {
      console.error(`${line}：处理失败`, err)
    }
  })
  return singleTickets
}

export function countNumberFrequency(tickets) {
  // 初始化计数器：前区和后区分别统计
  const frontCounter = new Map()
  const backCounter = new Map()

  // 遍历所有单式票，累计次数
  tickets.forEach((ticket) => {
    // 统计前区数字
    ticket.front.forEach((num) => {
      frontCounter.set(num, (frontCounter.get(num) || 0) + 1)
    })

    // 统计后区数字
    ticket.back.forEach((num) => {
      backCounter.set(num, (backCounter.get(num) || 0) + 1)
    })
  })

  // 转换为数组并排序：按次数倒序，次数相同则按数字升序
  const sortByFrequency = (map) => {
    return Array.from(map.entries())
      .sort((a, b) => {
        if (b[1] !== a[1]) {
          return b[1] - a[1] // 次数倒序
        }
        return a[0] - b[0] // 数字升序
      })
      .map(([num, count]) => ({ num, count }))
  }

  return {
    front: sortByFrequency(frontCounter), // 前区统计结果
    back: sortByFrequency(backCounter), // 后区统计结果
  }
}

export function combination(arr, n) {
  const result = []
  const backtrack = (start, current) => {
    if (current.length === n) {
      result.push([...current])
      return
    }
    for (let i = start; i < arr.length; i++) {
      current.push(arr[i])
      backtrack(i + 1, current)
      current.pop()
    }
  }
  backtrack(0, [])
  return result
}

// const singleTickets = convertToSingleTickets(ipt)
// const frequency = countNumberFrequency(singleTickets)

// // 输出结果
// console.log(`生成单式票总数: ${singleTickets.length}`)
// console.log('\n前区数字出现次数（按次数倒序）:')
// console.table(frequency.front)
// console.log('\n后区数字出现次数（按次数倒序）:')
// console.table(frequency.back)
