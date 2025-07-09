<script lang="ts" setup>
const props = withDefaults(defineProps<{ errMsg: string }>(), {
  errMsg: '',
})

const copyPrefixText = () => {
  const prefix = props.errMsg.split(':')[0].trim()
  navigator.clipboard
    .writeText(prefix)
    .then(() => {
      ElMessage.success('已复制')
    })
    .catch(() => {
      ElMessage.error('复制失败')
    })
}
</script>
<template>
  <div
    style="z-index: 99999999"
    v-if="errMsg"
    class="fixed inset-0 flex items-center justify-center bg-white/90 p-4"
  >
    <div class="text-center max-w-lg w-full">
      <!-- 错误信息显示 -->
      <p class="text-23px font-bold text-klein-blue mb-6 break-words">
        {{ errMsg.split(':')[0] }}
      </p>
      <p class="text-23px font-bold text-klein-blue mb-6 break-words">
        {{ errMsg.split(':')[1] }}
      </p>
      <!-- 操作按钮组 -->
      <div class="flex items-center justify-center gap-4">
        <!-- 复制按钮（复制冒号前面的内容） -->
        <el-button @click="copyPrefixText" :size="'large'" :type="'warning'">
          <i class="i-ic:round-content-copy text-lg"></i>
          <span>复制前缀</span>
        </el-button>
      </div>
    </div>
  </div>
</template>
