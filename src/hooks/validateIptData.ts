export const validateIptData = (ipt: string, front = 33, back = 16): string | null => {
  if (typeof ipt !== 'string' || !ipt.trim()) {
    return ipt
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
