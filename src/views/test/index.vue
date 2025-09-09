<template>
  <div class="linked-charts-container">
    <div class="chart-wrapper">
      <h3>Product Sales Trend</h3>
      <div class="chart-container">
        <div ref="chart1Ref" class="chart-inner"></div>
      </div>
    </div>
    <div class="chart-wrapper">
      <h3>Product Growth Rate Trend</h3>
      <div class="chart-container">
        <div ref="chart2Ref" class="chart-inner"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import type { ECharts, EChartsOption } from 'echarts'

const chart1Ref = ref<HTMLDivElement>(null)
const chart2Ref = ref<HTMLDivElement>(null)
let chart1: ECharts | null = null
let chart2: ECharts | null = null
let isSyncing = false // 防止事件循环触发

// 1. 辅助系列固定命名（过滤用）
const HELPER_SERIES_NAME = '__helper_series__'
// 多系列数据（含null）
const xData = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']
const salesData1 = [120, null, 0, 230, 180, 250, 220, 310, 280]
const salesData2 = [120, null, 555, 230, 180, 250, 220, 310, 280]
const extraData1 = [null, null, 30, 190, 140, 210, 180, 270, 240]
const extraData2 = [null, null, 10, 160, 110, 180, 150, 240, 210]

// 2. 生成辅助系列（解决null数据联动问题）
const createHelperSeries = (length: number): EChartsOption.Series => ({
  name: HELPER_SERIES_NAME,
  type: 'scatter',
  data: Array(length).fill(0.0001), // 极小占位值
  itemStyle: { opacity: 0 }, // 完全透明
  symbolSize: 1, // 不可见
  silent: true, // 不响应自身鼠标事件
  tooltip: { show: false }, // 禁用自身tooltip
})

// 3. 动态获取辅助系列索引（适配多系列）
const getHelperSeriesIndex = (chart: ECharts) => {
  const series = chart.getOption().series || []
  return series.findIndex((s) => s.name === HELPER_SERIES_NAME)
}

// 4. 同步联动状态（多系列 + 辅助系列）
const syncLinkage = (targetCharts: ECharts[], dataIndex: number) => {
  if (isSyncing || dataIndex < 0 || dataIndex >= xData.length) return
  isSyncing = true

  targetCharts.forEach((chart) => {
    const helperIndex = getHelperSeriesIndex(chart)
    if (helperIndex === -1) return

    // 用辅助系列触发tooltip（解决业务系列null问题）
    chart.dispatchAction({
      type: 'showTip',
      seriesIndex: helperIndex,
      dataIndex,
      xAxisIndex: 0,
    })

    // 给所有业务系列添加标记点（跳过辅助系列）
    const series = chart.getOption().series || []
    series.forEach((s, index) => {
      if (s.name === HELPER_SERIES_NAME) return
      chart.dispatchAction({
        type: 'updateSeries',
        seriesIndex: index,
        markPoint: {
          data: [
            {
              name: 'Linkage',
              xAxis: dataIndex,
              yAxis: 'min',
              itemStyle: { color: (s.itemStyle as any)?.color || '#ff4d4f' },
              symbolSize: 8,
            },
          ],
        },
      })
    })
  })

  isSyncing = false
}

// 5. 清除联动状态
const clearLinkageState = (targetCharts: ECharts[]) => {
  targetCharts.forEach((chart) => {
    chart.dispatchAction({ type: 'hideTip' })
    // 清空所有业务系列标记点
    const series = chart.getOption().series || []
    series.forEach((s, index) => {
      if (s.name === HELPER_SERIES_NAME) return
      chart.dispatchAction({
        type: 'updateSeries',
        seriesIndex: index,
        markPoint: { data: [] },
      })
    })
  })
}

// 6. 绑定图表实例事件（核心：改用instance.on）
const bindChartInstanceEvents = () => {
  if (!chart1 || !chart2) return
  const allCharts = [chart1, chart2]

  // 图表1实例事件：鼠标移动触发联动
  chart1.on('mousemove', (params) => {
    if (params.dataIndex != null) {
      // 确保索引有效
      syncLinkage(allCharts, params.dataIndex)
    }
  })

  // 图表2实例事件：鼠标移动触发联动
  chart2.on('mousemove', (params) => {
    if (params.dataIndex != null) {
      // 确保索引有效
      syncLinkage(allCharts, params.dataIndex)
    }
  })

  // 图表1实例事件：鼠标离开清除联动
  chart1.on('mouseout', () => {
    clearLinkageState(allCharts)
  })

  // 图表2实例事件：鼠标离开清除联动
  chart2.on('mouseout', () => {
    clearLinkageState(allCharts)
  })
}

// 7. 初始化图表（多系列 + 辅助系列）
const initCharts = () => {
  // 销毁旧实例
  chart1?.dispose()
  chart2?.dispose()

  // 创建新实例
  if (chart1Ref.value) chart1 = echarts.init(chart1Ref.value)
  if (chart2Ref.value) chart2 = echarts.init(chart2Ref.value)
  if (!chart1 || !chart2) return

  // 图表1：多系列柱状图 + 辅助系列
  const option1: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      // 过滤辅助系列tooltip
      formatter: (params) => {
        const validParams = params.filter((p) => p.seriesName !== HELPER_SERIES_NAME)
        return (
          validParams
            .map((p) => {
              const value = p.value == null ? 'No Data' : p.value
              return `<div>${p.seriesName}: ${value} (units)</div>`
            })
            .join('') + `<div>Month: ${validParams[0]?.name || ''}</div>`
        )
      },
    },
    xAxis: { type: 'category', data: xData },
    yAxis: { type: 'value', name: 'Sales(units)' },
    series: [
      { name: 'Product A', type: 'bar', data: salesData2, itemStyle: { color: '#4895ef' } },
      { name: 'Product B', type: 'bar', data: extraData1, itemStyle: { color: '#f7b84b' } },
      createHelperSeries(xData.length), // 辅助系列（索引2）
    ],
  }

  // 图表2：多系列折线图 + 辅助系列
  const option2: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'line' },
      // 过滤辅助系列tooltip
      formatter: (params) => {
        const validParams = params.filter((p) => p.seriesName !== HELPER_SERIES_NAME)
        return (
          validParams
            .map((p) => {
              const value = p.value == null ? 'No Data' : p.value
              return `<div>${p.seriesName}: ${value} (%)</div>`
            })
            .join('') + `<div>Month: ${validParams[0]?.name || ''}</div>`
        )
      },
    },
    xAxis: { type: 'category', data: xData },
    yAxis: { type: 'value', name: 'Growth Rate(%)' },
    series: [
      {
        name: 'Product A',
        type: 'line',
        data: salesData1,
        triggerLineEvent: true, // 折线支持鼠标事件
        symbolSize: 8,
        lineStyle: { color: '#4895ef' },
      },
      {
        name: 'Product B',
        type: 'line',
        data: extraData2,
        triggerLineEvent: true, // 折线支持鼠标事件
        symbolSize: 8,
        lineStyle: { color: '#f7b84b' },
      },
      createHelperSeries(xData.length), // 辅助系列（索引2）
    ],
  }

  // 设置配置并绑定实例事件
  chart1.setOption(option1)
  chart2.setOption(option2)
  bindChartInstanceEvents()
}

// 生命周期
onMounted(() => {
  initCharts()
  // 窗口 resize 处理
  window.addEventListener('resize', () => {
    chart1?.resize()
    chart2?.resize()
  })
})

onUnmounted(() => {
  // 销毁实例 + 移除事件
  chart1?.dispose()
  chart2?.dispose()
  window.removeEventListener('resize', () => {})
})
</script>

<style scoped>
.linked-charts-container {
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
}

.chart-wrapper {
  margin-bottom: 30px;
}

.chart-wrapper h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
}

.chart-container {
  width: 100%;
  height: 400px;
  position: relative;
  border: 1px solid #eee;
  border-radius: 4px;
}

.chart-inner {
  width: 100%;
  height: 100%;
}
</style>
