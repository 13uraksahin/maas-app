<script setup lang="ts">
import { 
  Droplets, 
  Activity, 
  AlertTriangle, 
  Gauge,
  TrendingUp,
  TrendingDown,
  Minus,
  Signal,
} from 'lucide-vue-next'
import { useLiveReadingsStore } from '~/stores/liveReadings'

definePageMeta({
  title: 'Dashboard',
})

const store = useLiveReadingsStore()
const { isConnected, on } = useSocket()

// Listen for new readings
onMounted(() => {
  on('reading:new', (data: unknown) => {
    store.handleReadingEvent(data as Parameters<typeof store.handleReadingEvent>[0])
  })
})

// Demo data for display (in real app, fetch from API)
const stats = computed(() => [
  {
    title: 'Active Assets',
    value: store.allAssetIds.length || 24,
    change: '+3',
    trend: 'up',
    icon: Gauge,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    title: 'Readings Today',
    value: store.totalReadingsReceived || 1247,
    change: '+127',
    trend: 'up',
    icon: Activity,
    color: 'text-accent',
    bgColor: 'bg-accent/10',
  },
  {
    title: 'Total Consumption',
    value: '847.3 m³',
    change: '-2.4%',
    trend: 'down',
    icon: Droplets,
    color: 'text-water-400',
    bgColor: 'bg-water-500/10',
  },
  {
    title: 'Active Alerts',
    value: 3,
    change: '0',
    trend: 'neutral',
    icon: AlertTriangle,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
  },
])

// Sample asset ID for demo chart
const demoAssetId = ref('asset-demo-001')

// Generate some demo data on mount
onMounted(() => {
  // Simulate initial readings for demo
  const now = Date.now()
  for (let i = 30; i >= 0; i--) {
    const baseValue = 123.456 + (30 - i) * 0.001
    store.handleReadingEvent({
      time: new Date(now - i * 60000),
      asset_id: demoAssetId.value,
      device_id: 'device-001',
      value: baseValue + Math.random() * 0.002,
      delta: 0.001 + Math.random() * 0.001,
      signal_quality: 75 + Math.floor(Math.random() * 20),
      battery: 85,
      assetName: 'Water Inlet - 123 Main St',
      deviceSerial: 'SIGFOX-ABC123',
      tenantId: 'tenant-001',
    })
  }

  // Simulate real-time updates
  setInterval(() => {
    const latest = store.getChartDataForAsset(demoAssetId.value)
    const lastValue = latest.length > 0 ? latest[latest.length - 1].y : 123.5
    
    store.handleReadingEvent({
      time: new Date(),
      asset_id: demoAssetId.value,
      device_id: 'device-001',
      value: lastValue + 0.001 + Math.random() * 0.002,
      delta: 0.001 + Math.random() * 0.001,
      signal_quality: 70 + Math.floor(Math.random() * 25),
      battery: 85 - Math.floor(Math.random() * 3),
      assetName: 'Water Inlet - 123 Main St',
      deviceSerial: 'SIGFOX-ABC123',
      tenantId: 'tenant-001',
    })
  }, 3000)
})
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-gradient">Dashboard</h1>
        <p class="text-muted-foreground mt-1">
          Real-time water consumption monitoring
        </p>
      </div>
      
      <div class="flex items-center gap-3">
        <span class="realtime-badge">
          Live Updates
        </span>
        <span class="text-sm text-muted-foreground">
          Last update: {{ store.lastUpdateTime?.toLocaleTimeString() || 'Never' }}
        </span>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      <div 
        v-for="stat in stats" 
        :key="stat.title"
        class="stat-card animate-slide-in-bottom"
      >
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-muted-foreground">{{ stat.title }}</p>
            <p class="text-3xl font-bold mt-2 font-mono">{{ stat.value }}</p>
          </div>
          <div :class="[stat.bgColor, 'p-3 rounded-xl']">
            <component :is="stat.icon" :class="[stat.color, 'w-6 h-6']" />
          </div>
        </div>
        
        <div class="flex items-center gap-2 mt-4">
          <div 
            class="flex items-center gap-1 text-sm"
            :class="{
              'text-signal-good': stat.trend === 'up',
              'text-signal-poor': stat.trend === 'down',
              'text-muted-foreground': stat.trend === 'neutral',
            }"
          >
            <TrendingUp v-if="stat.trend === 'up'" class="w-4 h-4" />
            <TrendingDown v-else-if="stat.trend === 'down'" class="w-4 h-4" />
            <Minus v-else class="w-4 h-4" />
            {{ stat.change }}
          </div>
          <span class="text-xs text-muted-foreground">vs last period</span>
        </div>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <!-- Main consumption chart -->
      <div class="xl:col-span-2">
        <RealTimeConsumptionChart 
          :asset-id="demoAssetId"
          title="Real-time Consumption"
          :height="400"
        />
      </div>
      
      <!-- Latest readings sidebar -->
      <div class="glass-card p-6">
        <h3 class="text-lg font-semibold mb-4">Latest Readings</h3>
        
        <div class="space-y-4">
          <div 
            v-for="reading in store.latestReadings.slice(0, 5)" 
            :key="`${reading.asset_id}-${reading.time}`"
            class="p-4 rounded-xl bg-muted/30 border border-border/50 animate-slide-in-bottom"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium truncate">
                {{ reading.assetName || reading.asset_id }}
              </span>
              <Signal 
                class="w-4 h-4"
                :class="store.getSignalInfo(reading.signal_quality).colorClass"
              />
            </div>
            
            <div class="flex items-baseline justify-between">
              <span class="reading-value text-primary">
                {{ store.formatValue(reading.value) }}
              </span>
              <span 
                class="text-xs"
                :class="(reading.delta ?? 0) >= 0 ? 'text-signal-fair' : 'text-signal-good'"
              >
                {{ store.formatDelta(reading.delta) }}
              </span>
            </div>
            
            <div class="text-xs text-muted-foreground mt-2">
              {{ new Date(reading.time).toLocaleTimeString() }}
            </div>
          </div>
          
          <div 
            v-if="store.latestReadings.length === 0"
            class="text-center py-8 text-muted-foreground"
          >
            <Activity class="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Waiting for readings...</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Connection status banner (if disconnected) -->
    <div 
      v-if="!isConnected"
      class="fixed bottom-6 right-6 p-4 glass-card border-destructive/50 bg-destructive/10 animate-slide-in-bottom"
    >
      <div class="flex items-center gap-3">
        <div class="data-dot bg-destructive" />
        <div>
          <p class="text-sm font-medium text-destructive">Connection Lost</p>
          <p class="text-xs text-muted-foreground">Attempting to reconnect...</p>
        </div>
      </div>
    </div>
  </div>
</template>

