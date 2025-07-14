<template>
  <el-button type="primary" @click="navigateTo('/ssq')">ssq</el-button>
  <el-button type="primary" @click="navigateTo('/dlt')">dlt</el-button>
  <el-button type="primary" @click="navigateTo('/ssq-h')">ssq-h</el-button>
  <el-button type="primary" @click="navigateTo('/ssq-h', true)">ssq-h-window</el-button>
</template>

<script setup lang="ts">
const router = useRouter()

const navigateTo = (path: string, w?: boolean) => {
  if (w) {
    const fullPath = router.resolve(path).href // 解析路由为完整URL
    window.open(fullPath, '_blank') // _blank 表示新标签页
    return
  }
  // 正常跳转（当前标签页）
  router.push(path)
}
</script>
