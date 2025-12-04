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

// Fetch historical data and listen for new readings on mount
onMounted(async () => {
  // 1. Backfill chart with historical data from API
  if (!store.historyLoaded) {
    await store.fetchHistory({ limit: 100 })
  }

  // 2. Listen for new real-time readings via socket
  on('reading:new', (data: unknown) => {
    store.handleReadingEvent(data as Parameters<typeof store.handleReadingEvent>[0])
  })
})

// Dashboard stats - uses real data from store
const stats = computed(() => [
  {
    title: 'Active Assets',
    value: store.allAssetIds.length || 0,
    change: store.allAssetIds.length > 0 ? `${store.allAssetIds.length}` : '--',
    trend: store.allAssetIds.length > 0 ? 'up' : 'neutral',
    icon: Gauge,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    title: 'Readings Loaded',
    value: store.totalReadingsReceived,
    change: store.totalReadingsReceived > 0 ? `${store.totalReadingsReceived}` : '--',
    trend: store.totalReadingsReceived > 0 ? 'up' : 'neutral',
    icon: Activity,
    color: 'text-accent',
    bgColor: 'bg-accent/10',
  },
  {
    title: 'Latest Value',
    value: store.latestReadings.length > 0 
      ? store.formatValue(store.latestReadings[0].value)
      : '--',
    change: store.latestReadings.length > 0 
      ? store.formatDelta(store.latestReadings[0].delta)
      : '--',
    trend: 'neutral',
    icon: Droplets,
    color: 'text-water-400',
    bgColor: 'bg-water-500/10',
  },
  {
    title: 'Active Alerts',
    value: 0,
    change: '0',
    trend: 'neutral',
    icon: AlertTriangle,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
  },
])

// Selected asset for chart display (will show first asset with data)
const selectedAssetId = computed(() => {
  const ids = store.allAssetIds
  return ids.length > 0 ? ids[0] : null
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
        <!-- Loading state -->
        <div v-if="store.isLoading" class="chart-container flex items-center justify-center">
          <div class="text-center text-muted-foreground">
            <div class="w-12 h-12 mx-auto mb-4 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p class="text-lg font-medium">Loading History...</p>
          </div>
        </div>
        <!-- Chart with data -->
        <RealTimeConsumptionChart 
          v-else-if="selectedAssetId"
          :asset-id="selectedAssetId"
          title="Real-time Consumption"
          :height="400"
        />
        <!-- Empty state -->
        <div v-else class="chart-container flex items-center justify-center">
          <div class="text-center text-muted-foreground">
            <Activity class="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p class="text-lg font-medium">No Data Yet</p>
            <p class="text-sm mt-2">Send readings via POST /api/ingestion/webhook</p>
          </div>
        </div>
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

