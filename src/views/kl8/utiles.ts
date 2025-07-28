export const extractNumbers = (str: string) => {
  return str
    .replace(/\n/g, ' ') // 换行符转空格
    .replace(/\s+/g, ' ') // 多个连续空格合并为一个
    .trim() // 去除首尾空格
    .split(' ') // 按空格分割
    .filter((item) => item !== '') // 过滤空字符串
    .map(Number) // 转换为数字类型
}
