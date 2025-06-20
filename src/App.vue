<script setup lang="ts"></script>

<template>
  <a-config-provider
    :theme="{
      token: {},
      components: {},
    }"
  >
    <RouterView />
  </a-config-provider>
</template>
