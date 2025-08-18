import fs from 'fs/promises'
import fsSync from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// 获取当前脚本目录
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 定义路径
const targetDir = path.resolve(__dirname, 'hisData')
const jsonPath = path.resolve(__dirname, 'kl8.json')

async function generateFiles() {
  try {
    // 创建目标目录
    if (!fsSync.existsSync(targetDir)) {
      await fs.mkdir(targetDir, { recursive: true })
      console.log(`✅ 已创建目录：${targetDir}`)
    }

    // 读取并解析JSON数据
    const rawData = await fs.readFile(jsonPath, 'utf-8')
    const data = JSON.parse(rawData)

    // 验证数据格式
    if (!Array.isArray(data) || data.some((item) => !Array.isArray(item))) {
      throw new Error('kl8.json 内容必须是二维数组')
    }

    // 生成文件配置
    const lastFileNum = 219
    const totalFiles = data.length
    let skippedCount = 0 // 统计跳过的负数文件数量

    for (let i = 0; i < totalFiles; i++) {
      const numList = data[i]
      // 计算当前文件编号
      const currentFileNum = lastFileNum - (totalFiles - 1 - i)

      // 检查是否为负数，是则跳过当前文件
      if (currentFileNum < 150) {
        skippedCount++
        console.log(`⚠️ 跳过负数编号文件：${currentFileNum}.ts`)
        continue // 跳过当前循环，继续下一个文件
      }

      const fileName = `${currentFileNum}.ts`
      const filePath = path.resolve(targetDir, fileName)

      // 生成文件内容
      const g1Lines = numList.map((num) => `  '${num}'`).join(',\n')
      const fileContent = `export const g1 = [
${g1Lines}
]
export const ipt = \`
\`
`

      await fs.writeFile(filePath, fileContent, 'utf-8')
      console.log(`✅ 生成：hisData/${fileName}`)
    }

    // 生成完成后提示统计信息
    console.log(
      `\n🎉 生成完成！成功生成 ${totalFiles - skippedCount} 个文件，跳过 ${skippedCount} 个负数编号文件`,
    )
  } catch (err) {
    console.error('\n❌ 执行失败：', err.message)
    process.exit(1)
  }
}

generateFiles()
