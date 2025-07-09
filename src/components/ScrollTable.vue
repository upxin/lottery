<template>
  <div class="fixed right-60px top-1/2 -translate-y-1/2 flex flex-col gap-2 z-50">
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
