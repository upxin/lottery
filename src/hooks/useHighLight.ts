export function useHighLight() {
  const selectedRowKeys = reactive(new Set<string>())

  const handleRowClick = (row: any) => {
    // 确保使用唯一ID
    const rowKey = row.id // 兜底方案，使用随机ID

    if (selectedRowKeys.has(rowKey)) {
      selectedRowKeys.delete(rowKey)
    } else {
      selectedRowKeys.add(rowKey)
    }
  }

  const getRowClassName = ({ row }: { row: any }) => {
    const rowKey = row.id
    return selectedRowKeys.has(rowKey) ? 'highlighted-row' : ''
  }

  return {
    selectedRowKeys,
    getRowClassName,
    handleRowClick,
  }
}
