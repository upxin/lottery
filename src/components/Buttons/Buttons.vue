<template>
  <el-button type="primary">
    <router-link to="/ssq" custom v-slot="{ navigate }">
      <div @click="navigate">ssq</div>
    </router-link>
  </el-button>

  <el-button type="primary">
    <router-link to="/dlt" custom v-slot="{ navigate }">
      <div @click="navigate">dlt</div>
    </router-link>
  </el-button>

  <el-button type="primary">
    <router-link to="/kl8" custom v-slot="{ navigate }">
      <div @click="navigate">kl8</div>
    </router-link>
  </el-button>

  <el-button type="primary">
    <router-link to="/ssq-h" custom v-slot="{ navigate }">
      <div @click="navigate">ssq-h</div>
    </router-link>
  </el-button>
</template>
<script lang="ts" setup></script>
