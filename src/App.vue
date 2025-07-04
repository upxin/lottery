<script setup lang="ts"></script>

<template>
  <el-config-provider :size="'small'" :button="{ type: 'primary' }">
    <section fixed bottom-0 z-99 pl-400px py-4px>
      <Buttons></Buttons>
    </section>
    <RouterView />
  </el-config-provider>
</template>
