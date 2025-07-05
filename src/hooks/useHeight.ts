export function useAutoHeight(extraSpace: Ref) {
  const extra = ref(0)
  watch(
    () => extraSpace.value,
    (v) => {
      extra.value = v
    },
    { immediate: true },
  )
  const { height: windowHeight } = useWindowSize()

  const getHeight = computed(() => {
    return windowHeight.value - extra.value
  })
  return { getHeight }
}
