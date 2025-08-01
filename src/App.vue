<script setup lang="ts"></script>

<template>
  <el-config-provider :size="'small'">
    <section flex justify-center items-center w-screen py-3px>
      <Buttons></Buttons>
    </section>
    <RouterView />
  </el-config-provider>
</template>
