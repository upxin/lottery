<template>
  <el-button
    v-for="route in routes"
    :key="route.path"
    type="primary"
    @click="navigateTo(route.path, true)"
  >
    {{ route.name }}
  </el-button>
</template>

<script setup lang="ts">
const router = useRouter()
const routes = computed(() => {
  return router.options.routes.filter((item) => {
    return item.meta?.show
  })
})

const navigateTo = (path: string, w: boolean) => {
  if (w) {
    const fullPath = router.resolve(path).href
    window.open(fullPath, '_blank')
    return
  }
  router.push(path)
}
</script>
