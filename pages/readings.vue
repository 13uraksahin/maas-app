<script setup lang="ts">
import { Activity, Filter, Download, RefreshCw } from 'lucide-vue-next'
import { useLiveReadingsStore } from '~/stores/liveReadings'

definePageMeta({
  title: 'Live Readings',
})

const store = useLiveReadingsStore()
const { isConnected, on } = useSocket()

// Selected asset for detailed view
const selectedAssetId = ref<string | null>(null)

// Fetch history and listen for new readings on mount
onMounted(async () => {
  // 1. Backfill with historical data if not already loaded
  if (!store.historyLoaded) {
    await store.fetchHistory({ limit: 100 })
  }

  // 2. Listen for new real-time readings via socket
  on('reading:new', (data: unknown) => {
    store.handleReadingEvent(data as Parameters<typeof store.handleReadingEvent>[0])
  })
})

// Auto-select first asset when available
watch(() => store.allAssetIds, (ids) => {
  if (ids.length > 0 && !selectedAssetId.value) {
    selectedAssetId.value = ids[0]
  }
}, { immediate: true })

const selectedSummary = computed(() => 
  selectedAssetId.value ? store.getSummaryForAsset(selectedAssetId.value) : null
)
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-gradient">Live Readings</h1>
        <p class="text-muted-foreground mt-1">
          Real-time meter data from all connected devices
        </p>
      </div>
      
      <div class="flex items-center gap-3">
        <button class="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
          <Filter class="w-4 h-4" />
          <span class="text-sm">Filter</span>
        </button>
        <button class="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
          <Download class="w-4 h-4" />
          <span class="text-sm">Export</span>
        </button>
        <span class="realtime-badge">
          {{ store.totalReadingsReceived }} received
        </span>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-4 gap-6">
      <!-- Asset list -->
      <div class="xl:col-span-1 glass-card p-4">
        <h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Assets ({{ store.allAssetIds.length }})
        </h3>
        
        <div class="space-y-2 max-h-[600px] overflow-y-auto">
          <button
            v-for="summary in store.allSummaries"
            :key="summary.assetId"
            class="w-full p-3 rounded-xl text-left transition-all duration-200"
            :class="[
              selectedAssetId === summary.assetId 
                ? 'bg-primary/10 border border-primary/30' 
                : 'bg-muted/30 hover:bg-muted/50 border border-transparent'
            ]"
            @click="selectedAssetId = summary.assetId"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm font-medium truncate">
                {{ summary.assetName }}
              </span>
              <div 
                class="w-2 h-2 rounded-full"
                :class="store.getSignalInfo(summary.signalQuality).colorClass.replace('text-', 'bg-')"
              />
            </div>
            <div class="flex items-baseline justify-between">
              <span class="font-mono text-lg text-primary">
                {{ summary.latestValue.toFixed(3) }}
              </span>
              <span class="text-xs text-muted-foreground">
                {{ summary.lastUpdated.toLocaleTimeString() }}
              </span>
            </div>
          </button>
          
          <div 
            v-if="store.allAssetIds.length === 0"
            class="text-center py-12 text-muted-foreground"
          >
            <Activity class="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p class="text-sm">No active assets</p>
            <p class="text-xs mt-1">Waiting for readings...</p>
          </div>
        </div>
      </div>
      
      <!-- Main content -->
      <div class="xl:col-span-3 space-y-6">
        <!-- Selected asset chart -->
        <div v-if="selectedAssetId">
          <RealTimeConsumptionChart 
            :asset-id="selectedAssetId"
            :title="selectedSummary?.assetName || 'Asset Consumption'"
            :height="350"
          />
        </div>
        
        <!-- Readings table -->
        <div class="glass-card overflow-hidden">
          <div class="p-4 border-b border-border/50">
            <h3 class="text-lg font-semibold">Recent Readings</h3>
          </div>
          
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-muted/30">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Time
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Asset
                  </th>
                  <th class="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Value
                  </th>
                  <th class="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Delta
                  </th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Signal
                  </th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Battery
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border/50">
                <tr 
                  v-for="reading in store.latestReadings.slice(0, 20)"
                  :key="`${reading.asset_id}-${reading.time}`"
                  class="hover:bg-muted/30 transition-colors"
                >
                  <td class="px-4 py-3 text-sm font-mono text-muted-foreground">
                    {{ new Date(reading.time).toLocaleTimeString() }}
                  </td>
                  <td class="px-4 py-3 text-sm">
                    {{ reading.assetName || reading.asset_id }}
                  </td>
                  <td class="px-4 py-3 text-sm text-right font-mono text-primary">
                    {{ store.formatValue(reading.value) }}
                  </td>
                  <td class="px-4 py-3 text-sm text-right font-mono">
                    <span :class="(reading.delta ?? 0) >= 0 ? 'text-signal-fair' : 'text-signal-good'">
                      {{ store.formatDelta(reading.delta) }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-sm text-center">
                    <span 
                      class="inline-flex items-center px-2 py-1 rounded-full text-xs"
                      :class="[
                        store.getSignalInfo(reading.signal_quality).colorClass,
                        `bg-current/10`
                      ]"
                    >
                      {{ reading.signal_quality ?? '--' }}%
                    </span>
                  </td>
                  <td class="px-4 py-3 text-sm text-center">
                    <span 
                      v-if="reading.battery !== null"
                      :class="reading.battery > 20 ? 'text-signal-good' : 'text-signal-poor'"
                    >
                      {{ reading.battery }}%
                    </span>
                    <span v-else class="text-muted-foreground">--</span>
                  </td>
                </tr>
                
                <tr v-if="store.latestReadings.length === 0">
                  <td colspan="6" class="px-4 py-12 text-center text-muted-foreground">
                    <Activity class="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No readings yet</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

