import { type Ref } from 'vue'

export function useLocalStorage<T = unknown>(
  key: string,
  initialValue: T = null as unknown as T,
): Ref<T> {
  // 自定义序列化：将 T 类型值转换为可存储的字符串
  const serializeValue = (value: T): string => {
    // 处理 Set 类型
    if (value instanceof Set) {
      return JSON.stringify({
        __type__: 'Set',
        value: Array.from(value) as unknown[], // 存储为数组
      })
    }

    // 处理 Map 类型
    if (value instanceof Map) {
      return JSON.stringify({
        __type__: 'Map',
        value: Array.from(value.entries()) as unknown[][], // 存储为 [key, value][] 数组
      })
    }

    // 其他类型：使用 toRaw 获取原始值（避免代理对象干扰序列化）
    return JSON.stringify(toRaw(value))
  }

  // 自定义反序列化：将字符串转换为 T 类型值
  const deserializeValue = (storedValue: string): T => {
    try {
      const parsed = JSON.parse(storedValue) as unknown

      // 恢复 Set 类型
      if (
        parsed &&
        typeof parsed === 'object' &&
        '__type__' in parsed &&
        parsed.__type__ === 'Set'
      ) {
        return new Set(parsed.value as Iterable<unknown>) as unknown as T
      }

      // 恢复 Map 类型
      if (
        parsed &&
        typeof parsed === 'object' &&
        '__type__' in parsed &&
        parsed.__type__ === 'Map'
      ) {
        return new Map(parsed.value as Iterable<[unknown, unknown]>) as unknown as T
      }

      // 其他类型直接返回解析结果
      return parsed as T
    } catch (error) {
      console.error(`Failed to deserialize value for key "${key}":`, error)
      return initialValue // 解析失败时返回初始值
    }
  }

  // 从本地存储获取初始值（优先使用存储值，无则使用 initialValue）
  const getStoredValue = (): T => {
    try {
      const storedValue = localStorage.getItem(key)
      if (storedValue === null) {
        // 本地存储无值，返回初始值
        return initialValue
      }
      // 反序列化存储值
      return deserializeValue(storedValue)
    } catch (error) {
      console.error(`Failed to get value from localStorage for key "${key}":`, error)
      return initialValue // 读取失败时返回初始值
    }
  }

  // 创建响应式 ref 对象
  const state: Ref<T> = ref(getStoredValue()) as Ref<T>

  // 监听值变化，同步到本地存储
  watch(
    state,
    (newValue: T) => {
      try {
        localStorage.setItem(key, serializeValue(newValue))
      } catch (error) {
        console.error(`Failed to save value to localStorage for key "${key}":`, error)
      }
    },
    { deep: true }, // 深度监听，支持嵌套对象/集合
  )

  return state
}
