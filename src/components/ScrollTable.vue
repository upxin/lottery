<template>
  <div class="flex z-50 pl-10px">
    <Icon
      @click="scrollToTop"
      icon="cuida:caret-up-outline"
      class="cursor-pointer text-rose-pink text-30px"
    />
    <Icon
      @click="scrollToBottom"
      icon="cuida:caret-down-outline"
      class="cursor-pointer text-rose-pink text-30px"
    />
  </div>
</template>

<script lang="ts" setup>
interface Props {
  el: HTMLElement // 移除null，强制要求传入有效DOM
}

const props = defineProps<Props>()

const scrollContainer = computed(() => {
  return props.el.querySelector('.el-scrollbar__wrap') as HTMLElement
})

const scrollToTop = () => {
  scrollContainer.value?.scrollTo({ top: 0 })
}

const scrollToBottom = () => {
  scrollContainer.value?.scrollTo({ top: scrollContainer.value.scrollHeight })
}
</script>
