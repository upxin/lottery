export const validateIptData = (ipt: string, front = 33, back = 16): string | null => {
  if (typeof ipt !== 'string' || !ipt.trim()) {
    ElNotification({
      title: '错误提示',
      message: `暂无数据`,
      duration: 0,
    })
  }

  const lines = ipt.trim().split('\n')

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex].replace(/\s+/g, '') // 去空格
    if (!line) continue // 跳过空行

    // 1. 检查分隔符类型（双逗号优先）
    let separator: ',' | ',,' | null = null
    if (line.includes(',,')) {
      separator = ',,'
    } else if (line.includes(',')) {
      separator = ','
    } else {
      return `${line}: 缺少逗号分隔符`
    }

    // 2. 分割前区和后区
    const parts = line.split(separator)
    if (parts.length !== 2) {
      return `${line}: 分隔符错误，格式应为 "前区${separator}后区"`
    }

    const [main, tail] = parts
    if (!main || !tail) {
      return `${line}: 逗号前后不能为空`
    }

    if (main.length % 2 !== 0) {
      return `${line}: 前区数字位数必须为偶数（两两一组）`
    }

    // 校验前区数字
    for (let i = 0; i < main.length; i += 2) {
      const numStr = main.slice(i, i + 2)
      if (!/^\d{2}$/.test(numStr)) {
        return `${line}: 前区包含非数字字符（${numStr}）`
      }
      const num = parseInt(numStr, 10)
      if (num < 1 || num > front) {
        return `${line}: 前区数字必须在 1-${front} 之间（${numStr}）`
      }
    }

    // 校验后区（两两一组）
    if (tail.length % 2 !== 0) {
      return `${line}: 后区数字位数必须为偶数（两两一组）`
    }

    // 校验后区数字
    for (let i = 0; i < tail.length; i += 2) {
      const numStr = tail.slice(i, i + 2)
      if (!/^\d{2}$/.test(numStr)) {
        return `${line}: 后区包含非数字字符（${numStr}）`
      }
      const num = parseInt(numStr, 10)
      if (num < 1 || num > back) {
        return `${line}: 后区数字必须在 1-${back} 之间（${numStr}）`
      }
    }
  }

  // 所有行校验通过
  return null
}

export const validateIptDatakl8 = (ipt: string, front = 80) => {
  const lines = ipt.split('\n').filter((line) => line.trim() !== '')

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex]
    const commaIndex = line.indexOf(',')
    const dataPart = commaIndex !== -1 ? line.substring(0, commaIndex) : line

    const cleaned = dataPart.replace(/\s/g, '')

    if (cleaned.length % 2 !== 0) {
      return `${line}：数据长度不是偶数，可能存在未补0的数字`
    }

    const numbers = cleaned.match(/.{2}/g) || []

    for (let numIndex = 0; numIndex < numbers.length; numIndex++) {
      const num = numbers[numIndex]
      const numValue = parseInt(num, 10)

      if (isNaN(numValue) || numValue < 1 || numValue > front) {
        return `${line}：不在01-${front}范围内`
      }

      if (numValue < 10 && num[0] !== '0') {
        return `${line}：小于10但未补0`
      }
    }
  }

  return null
}
