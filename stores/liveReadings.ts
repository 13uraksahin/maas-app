import { defineStore } from 'pinia'
import { useThrottleFn } from '@vueuse/core'

/**
 * Reading data structure from socket events
 */
export interface LiveReading {
  time: Date | string
  asset_id: string
  device_id: string
  value: number
  delta: number | null
  signal_quality: number | null
  battery: number | null
  assetName?: string
  deviceSerial?: string
  tenantId?: string
}

/**
 * Chart data point format for ApexCharts
 */
export interface ChartDataPoint {
  x: number // timestamp
  y: number // value
}

/**
 * Asset summary for dashboard
 */
export interface AssetSummary {
  assetId: string
  assetName: string
  latestValue: number
  latestDelta: number | null
  signalQuality: number | null
  battery: number | null
  lastUpdated: Date
  readingCount: number
}

/**
 * Live Readings Pinia Store
 * 
 * Manages real-time meter readings with:
 * - Event buffering to prevent UI freezing
 * - Throttled UI updates (1 second)
 * - Circular buffer for chart data (last 100 points per asset)
 * - Asset summaries for dashboard
 */
export const useLiveReadingsStore = defineStore('liveReadings', () => {
  // Configuration
  const MAX_READINGS_PER_ASSET = 100
  const THROTTLE_MS = 1000

  // State
  const readings = ref<Map<string, LiveReading[]>>(new Map())
  const chartData = ref<Map<string, ChartDataPoint[]>>(new Map())
  const assetSummaries = ref<Map<string, AssetSummary>>(new Map())
  const buffer = ref<LiveReading[]>([])
  const totalReadingsReceived = ref(0)
  const lastUpdateTime = ref<Date | null>(null)

  // Computed
  const allAssetIds = computed(() => Array.from(readings.value.keys()))
  
  const allSummaries = computed(() => Array.from(assetSummaries.value.values()))
  
  const latestReadings = computed(() => {
    const latest: LiveReading[] = []
    for (const assetReadings of readings.value.values()) {
      if (assetReadings.length > 0) {
        latest.push(assetReadings[assetReadings.length - 1])
      }
    }
    return latest.sort((a, b) => 
      new Date(b.time).getTime() - new Date(a.time).getTime()
    )
  })

  /**
   * Get readings for a specific asset
   */
  function getReadingsForAsset(assetId: string): LiveReading[] {
    return readings.value.get(assetId) || []
  }

  /**
   * Get chart data for a specific asset
   */
  function getChartDataForAsset(assetId: string): ChartDataPoint[] {
    return chartData.value.get(assetId) || []
  }

  /**
   * Get summary for a specific asset
   */
  function getSummaryForAsset(assetId: string): AssetSummary | undefined {
    return assetSummaries.value.get(assetId)
  }

  /**
   * Add reading to buffer (called frequently by socket)
   * The buffer is flushed periodically by the throttled update function
   */
  function addToBuffer(reading: LiveReading): void {
    buffer.value.push(reading)
    totalReadingsReceived.value++
    
    // Trigger throttled processing
    processBufferThrottled()
  }

  /**
   * Process buffer and update state (throttled to prevent UI freezing)
   */
  const processBufferThrottled = useThrottleFn(() => {
    if (buffer.value.length === 0) return

    const toProcess = [...buffer.value]
    buffer.value = []

    // Group readings by asset
    const byAsset = new Map<string, LiveReading[]>()
    for (const reading of toProcess) {
      const assetId = reading.asset_id
      if (!byAsset.has(assetId)) {
        byAsset.set(assetId, [])
      }
      byAsset.get(assetId)!.push(reading)
    }

    // Process each asset's readings
    for (const [assetId, newReadings] of byAsset) {
      // Update readings array (circular buffer)
      const existing = readings.value.get(assetId) || []
      const combined = [...existing, ...newReadings]
      const trimmed = combined.slice(-MAX_READINGS_PER_ASSET)
      readings.value.set(assetId, trimmed)

      // Update chart data
      const existingChart = chartData.value.get(assetId) || []
      const newChartPoints = newReadings.map(r => ({
        x: new Date(r.time).getTime(),
        y: r.value,
      }))
      const combinedChart = [...existingChart, ...newChartPoints]
      chartData.value.set(assetId, combinedChart.slice(-MAX_READINGS_PER_ASSET))

      // Update asset summary
      const lastReading = newReadings[newReadings.length - 1]
      const currentSummary = assetSummaries.value.get(assetId)
      
      assetSummaries.value.set(assetId, {
        assetId,
        assetName: lastReading.assetName || assetId,
        latestValue: lastReading.value,
        latestDelta: lastReading.delta,
        signalQuality: lastReading.signal_quality,
        battery: lastReading.battery,
        lastUpdated: new Date(lastReading.time),
        readingCount: (currentSummary?.readingCount || 0) + newReadings.length,
      })
    }

    lastUpdateTime.value = new Date()
  }, THROTTLE_MS)

  /**
   * Handle incoming socket event
   */
  function handleReadingEvent(data: LiveReading): void {
    addToBuffer(data)
  }

  /**
   * Clear all readings for an asset
   */
  function clearAsset(assetId: string): void {
    readings.value.delete(assetId)
    chartData.value.delete(assetId)
    assetSummaries.value.delete(assetId)
  }

  /**
   * Clear all readings
   */
  function clearAll(): void {
    readings.value.clear()
    chartData.value.clear()
    assetSummaries.value.clear()
    buffer.value = []
    totalReadingsReceived.value = 0
    lastUpdateTime.value = null
  }

  /**
   * Get signal quality label and color class
   */
  function getSignalInfo(quality: number | null): { label: string; colorClass: string } {
    if (quality === null) return { label: 'Unknown', colorClass: 'signal-none' }
    if (quality >= 80) return { label: 'Excellent', colorClass: 'signal-excellent' }
    if (quality >= 60) return { label: 'Good', colorClass: 'signal-good' }
    if (quality >= 40) return { label: 'Fair', colorClass: 'signal-fair' }
    if (quality >= 20) return { label: 'Poor', colorClass: 'signal-poor' }
    return { label: 'No Signal', colorClass: 'signal-none' }
  }

  /**
   * Format reading value with units
   */
  function formatValue(value: number, unit: string = 'm³'): string {
    return `${value.toFixed(3)} ${unit}`
  }

  /**
   * Format delta with sign
   */
  function formatDelta(delta: number | null, unit: string = 'L'): string {
    if (delta === null) return '--'
    const sign = delta >= 0 ? '+' : ''
    // Convert m³ to liters for delta display
    const liters = delta * 1000
    return `${sign}${liters.toFixed(1)} ${unit}`
  }

  return {
    // State
    readings,
    chartData,
    assetSummaries,
    buffer,
    totalReadingsReceived,
    lastUpdateTime,

    // Computed
    allAssetIds,
    allSummaries,
    latestReadings,

    // Methods
    getReadingsForAsset,
    getChartDataForAsset,
    getSummaryForAsset,
    addToBuffer,
    handleReadingEvent,
    clearAsset,
    clearAll,
    getSignalInfo,
    formatValue,
    formatDelta,
  }
})

