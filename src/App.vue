<script setup lang="ts"></script>

<template>
  <el-config-provider :size="'small'" :button="{ type: 'primary' }">
    <section fixed bottom-0 z-99 py-4px pl-10px flex flex-col>
      <Buttons></Buttons>
    </section>
    <RouterView />
  </el-config-provider>
</template>
