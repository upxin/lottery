<template>
  <el-button
    v-for="route in routes"
    :key="route.path"
    type="primary"
    @click="navigateTo(route.path, true)"
  >
    {{ route.name || route.path }}
  </el-button>
</template>

<script setup lang="ts">
const router = useRouter()
const routes = router.options.routes

const navigateTo = (path: string, w: boolean) => {
  if (w) {
    const fullPath = router.resolve(path).href
    window.open(fullPath, '_blank')
    return
  }
  router.push(path)
}
</script>
