<script setup lang="ts"></script>

<template>
  <el-config-provider :size="'small'" :button="{ type: 'primary' }">
    <section flex justify-center items-center w-screen py-3px>
      <icons8:chevron-down-round class="text-red" />
      <ic:baseline-home />
      <div class="i-tabler:calendar-down mr-10px text-#246999"></div>
      <Buttons></Buttons>
    </section>
    <RouterView />
  </el-config-provider>
</template>
