<template>
  <el-button-group>
    <el-button type="primary" @click="navigateTo('/ssq')">ssq</el-button>
    <el-button type="primary" @click="navigateTo('/dlt')">dlt</el-button>
    <el-button type="primary" @click="navigateTo('/kl8')">kl8</el-button>
    <el-button type="primary" @click="navigateTo('/ssq-h')">ssq-h</el-button>
  </el-button-group>
</template>

<script setup lang="ts">
const router = useRouter()

const navigateTo = (path: string) => {
  router.push(path)
}
</script>
