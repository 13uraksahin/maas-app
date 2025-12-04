<script setup lang="ts">
import { useLiveReadingsStore, type ChartDataPoint } from '~/stores/liveReadings'

interface Props {
  assetId: string
  title?: string
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Real-time Consumption',
  height: 350,
})

const store = useLiveReadingsStore()

// Reactive chart data
const series = computed(() => [
  {
    name: 'Meter Reading',
    data: store.getChartDataForAsset(props.assetId),
  },
])

// Chart options with dark theme styling
const chartOptions = computed(() => ({
  chart: {
    id: `realtime-${props.assetId}`,
    type: 'area' as const,
    animations: {
      enabled: true,
      easing: 'linear' as const,
      dynamicAnimation: {
        speed: 1000,
      },
    },
    toolbar: {
      show: true,
      tools: {
        download: true,
        selection: true,
        zoom: true,
        zoomin: true,
        zoomout: true,
        pan: true,
        reset: true,
      },
    },
    zoom: {
      enabled: true,
    },
    background: 'transparent',
    fontFamily: 'Outfit, system-ui, sans-serif',
  },
  colors: ['#0ea5e9'], // Water blue
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.4,
      opacityTo: 0.05,
      stops: [0, 90, 100],
      colorStops: [
        {
          offset: 0,
          color: '#0ea5e9',
          opacity: 0.4,
        },
        {
          offset: 50,
          color: '#14b8a6',
          opacity: 0.2,
        },
        {
          offset: 100,
          color: '#14b8a6',
          opacity: 0.05,
        },
      ],
    },
  },
  stroke: {
    curve: 'smooth' as const,
    width: 2,
  },
  dataLabels: {
    enabled: false,
  },
  markers: {
    size: 0,
    hover: {
      size: 5,
    },
  },
  xaxis: {
    type: 'datetime' as const,
    labels: {
      style: {
        colors: 'hsl(215, 16%, 57%)',
        fontSize: '11px',
        fontFamily: 'JetBrains Mono, monospace',
      },
      datetimeFormatter: {
        year: 'yyyy',
        month: "MMM 'yy",
        day: 'dd MMM',
        hour: 'HH:mm',
        minute: 'HH:mm:ss',
      },
    },
    axisBorder: {
      show: false,
    },
    axisTicks: {
      show: false,
    },
  },
  yaxis: {
    title: {
      text: 'Value (m³)',
      style: {
        color: 'hsl(215, 16%, 57%)',
        fontSize: '12px',
        fontWeight: 500,
      },
    },
    labels: {
      style: {
        colors: 'hsl(215, 16%, 57%)',
        fontSize: '11px',
        fontFamily: 'JetBrains Mono, monospace',
      },
      formatter: (val: number) => val.toFixed(3),
    },
  },
  grid: {
    borderColor: 'hsl(220, 20%, 18%)',
    strokeDashArray: 4,
    xaxis: {
      lines: {
        show: true,
      },
    },
    yaxis: {
      lines: {
        show: true,
      },
    },
  },
  tooltip: {
    theme: 'dark',
    x: {
      format: 'dd MMM HH:mm:ss',
    },
    y: {
      formatter: (val: number) => `${val.toFixed(3)} m³`,
    },
  },
  noData: {
    text: 'Waiting for readings...',
    align: 'center' as const,
    verticalAlign: 'middle' as const,
    style: {
      color: 'hsl(215, 16%, 57%)',
      fontSize: '14px',
      fontFamily: 'Outfit, system-ui, sans-serif',
    },
  },
}))

// Get latest value for display
const latestValue = computed(() => {
  const data = store.getChartDataForAsset(props.assetId)
  if (data.length === 0) return null
  return data[data.length - 1].y
})

const summary = computed(() => store.getSummaryForAsset(props.assetId))
</script>

<template>
  <div class="chart-container relative">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="text-lg font-semibold text-foreground">{{ title }}</h3>
        <p class="text-sm text-muted-foreground">
          Asset: {{ summary?.assetName || assetId }}
        </p>
      </div>
      
      <div class="flex items-center gap-4">
        <!-- Real-time indicator -->
        <span class="realtime-badge">
          Live
        </span>
        
        <!-- Latest value -->
        <div v-if="latestValue !== null" class="text-right">
          <div class="reading-value text-primary">
            {{ store.formatValue(latestValue) }}
          </div>
          <div 
            v-if="summary?.latestDelta !== null" 
            class="text-xs text-muted-foreground"
          >
            {{ store.formatDelta(summary?.latestDelta ?? null) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Chart -->
    <ClientOnly>
      <apexchart
        type="area"
        :height="height"
        :options="chartOptions"
        :series="series"
      />
      <template #fallback>
        <div 
          class="flex items-center justify-center bg-muted/30 rounded-lg"
          :style="{ height: `${height}px` }"
        >
          <div class="text-muted-foreground">Loading chart...</div>
        </div>
      </template>
    </ClientOnly>

    <!-- Stats bar -->
    <div 
      v-if="summary" 
      class="flex items-center justify-between mt-4 pt-4 border-t border-border text-sm"
    >
      <div class="flex items-center gap-4">
        <!-- Signal quality -->
        <div class="flex items-center gap-2">
          <span class="text-muted-foreground">Signal:</span>
          <span :class="store.getSignalInfo(summary.signalQuality).colorClass">
            {{ store.getSignalInfo(summary.signalQuality).label }}
            <span v-if="summary.signalQuality !== null" class="text-xs">
              ({{ summary.signalQuality }}%)
            </span>
          </span>
        </div>
        
        <!-- Battery -->
        <div v-if="summary.battery !== null" class="flex items-center gap-2">
          <span class="text-muted-foreground">Battery:</span>
          <span :class="summary.battery > 20 ? 'text-signal-good' : 'text-signal-poor'">
            {{ summary.battery }}%
          </span>
        </div>
      </div>
      
      <div class="text-muted-foreground">
        {{ summary.readingCount }} readings
      </div>
    </div>
  </div>
</template>

