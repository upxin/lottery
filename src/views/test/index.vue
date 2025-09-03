<template>
  <div class="linked-charts-container hidden">
    <div class="chart-wrapper">
      <h3>产品销量趋势</h3>
      <div ref="chart1Ref" class="chart-container"></div>
    </div>
    <div class="chart-wrapper">
      <h3>产品增长率趋势</h3>
      <div ref="chart2Ref" class="chart-container"></div>
    </div>
  </div>
  <el-input v-model="test" id="kk" @input="changeVal"></el-input>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watchEffect } from 'vue'
import * as echarts from 'echarts'
import type { ECharts } from 'echarts'
const test = ref(111)
// 图表容器引用
const chart1Ref = ref<HTMLDivElement>(null)
const chart2Ref = ref<HTMLDivElement>(null)
function changeVal(v) {
  console.log('change', v)
  test.value = 1000
}
// 图表实例
let chart1: ECharts | null = null
let chart2: ECharts | null = null

// 共享的X轴数据（月份）
const xData = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月']

// 图表1数据（销量）
const salesData = [120, 190, 150, 230, 180, 250, 220, 310, 280]

// 图表2数据（增长率）
const growthRateData = [12, 19, 15, 23, 18, 25, 17, 22, 19]

// 初始化图表
const initCharts = () => {
  // 销毁已存在的实例
  if (chart1) {
    chart1.dispose()
  }
  if (chart2) {
    chart2.dispose()
  }

  // 创建新实例
  if (chart1Ref.value) {
    chart1 = echarts.init(chart1Ref.value)
  }
  if (chart2Ref.value) {
    chart2 = echarts.init(chart2Ref.value)
  }

  // 图表1配置 - 柱状图
  const option1 = {
    tooltip: {
      trigger: 'axis', // 按轴触发，必须配置才能联动
      axisPointer: {
        type: 'shadow', // 阴影指示器
      },
    },
    legend: {
      data: ['产品销量'],
      top: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: xData,
    },
    yAxis: {
      type: 'value',
      name: '销量(件)',
    },
    series: [
      {
        name: '产品销量', // 系列名称，用于图例联动
        type: 'bar',
        data: salesData,
        itemStyle: {
          color: '#4895ef',
        },
      },
    ],
  }

  // 图表2配置 - 折线图
  const option2 = {
    tooltip: {
      trigger: 'axis', // 按轴触发，必须配置才能联动
      axisPointer: {
        type: 'line', // 直线指示器
      },
    },
    legend: {
      data: ['产品销量', '增长率'],
      top: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: xData,
    },
    yAxis: {
      type: 'value',
      name: '增长率(%)',
    },
    series: [
      {
        name: '产品销量', // 与图表1相同的系列名称，会参与联动
        type: 'line',
        data: salesData,
        lineStyle: {
          color: '#4895ef',
        },
        symbol: 'circle',
      },
      {
        name: '增长率',
        type: 'line',
        data: growthRateData,
        lineStyle: {
          color: '#f77f00',
        },
        symbol: 'circle',
      },
    ],
  }

  // 设置图表配置
  chart1?.setOption(option1)
  chart2?.setOption(option2)

  // 关键：连接两个图表实现联动
  if (chart1 && chart2) {
    echarts.connect([chart1, chart2])
  }
}

// 处理窗口大小变化
const handleResize = () => {
  chart1?.resize()
  chart2?.resize()
}

onMounted(() => {
  initCharts()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  // 移除事件监听
  window.removeEventListener('resize', handleResize)

  // 销毁图表实例
  if (chart1) {
    echarts.disconnect(chart1)
    chart1.dispose()
    chart1 = null
  }
  if (chart2) {
    echarts.disconnect(chart2)
    chart2.dispose()
    chart2 = null
  }
})

// 监视容器大小变化，自动重绘
watchEffect(() => {
  // 当容器尺寸变化时重绘图表
  setTimeout(() => {
    handleResize()
  }, 100)
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
  border: 1px solid #eee;
  border-radius: 4px;
}
</style>
