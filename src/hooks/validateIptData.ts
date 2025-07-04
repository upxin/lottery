export const validateIptData = (ipt: string, front = 33, back = 16): boolean => {
  if (typeof ipt !== 'string' || !ipt.trim()) {
    ElMessageBox.alert('数据不能为空', '格式错误', { type: 'error' })
    return false
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
      ElMessageBox.alert(`第 ${lineIndex + 1} 行：缺少逗号分隔符`, '格式错误', { type: 'error' })
      return false
    }

    // 2. 分割前区和后区
    const parts = line.split(separator)
    if (parts.length !== 2) {
      ElMessageBox.alert(
        `第 ${lineIndex + 1} 行：分隔符错误，格式应为 "前区${separator}后区"`,
        '格式错误',
        { type: 'error' },
      )
      return false
    }

    const [main, tail] = parts
    if (!main || !tail) {
      ElMessageBox.alert(`第 ${lineIndex + 1} 行：逗号前后不能为空`, '格式错误', { type: 'error' })
      return false
    }

    if (main.length % 2 !== 0) {
      ElMessageBox.alert(`第 ${lineIndex + 1} 行：前区数字位数必须为偶数（两两一组）`, '格式错误', {
        type: 'error',
      })
      return false
    }

    // 校验前区数字
    for (let i = 0; i < main.length; i += 2) {
      const numStr = main.slice(i, i + 2)
      if (!/^\d{2}$/.test(numStr)) {
        ElMessageBox.alert(`第 ${lineIndex + 1} 行：前区包含非数字字符（${numStr}）`, '格式错误', {
          type: 'error',
        })
        return false
      }
      const num = parseInt(numStr, 10)
      if (num < 1 || num > front) {
        ElMessageBox.alert(
          `第 ${lineIndex + 1} 行：前区数字必须在 1-${front} 之间（${numStr}）`,
          '格式错误',
          { type: 'error' },
        )
        return false
      }
    }

    // 4. 校验后区（两两一组）
    if (tail.length % 2 !== 0) {
      ElMessageBox.alert(`第 ${lineIndex + 1} 行：后区数字位数必须为偶数（两两一组）`, '格式错误', {
        type: 'error',
      })
      return false
    }

    // 校验后区数字
    for (let i = 0; i < tail.length; i += 2) {
      const numStr = tail.slice(i, i + 2)
      if (!/^\d{2}$/.test(numStr)) {
        ElMessageBox.alert(`第 ${lineIndex + 1} 行：后区包含非数字字符（${numStr}）`, '格式错误', {
          type: 'error',
        })
        return false
      }
      const num = parseInt(numStr, 10)
      if (num < 1 || num > back) {
        ElMessageBox.alert(
          `第 ${lineIndex + 1} 行：后区数字必须在 1-${back} 之间（${numStr}）`,
          '格式错误',
          { type: 'error' },
        )
        return false
      }
    }
  }

  // 所有行校验通过
  return true
}
