/**
 * Shared TypeScript types for the frontend application
 */

// =============================================================================
// API Response Types
// =============================================================================

export interface ApiResponse<T> {
  data: T
  message?: string
  status: 'success' | 'error'
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// =============================================================================
// Entity Types
// =============================================================================

export interface Tenant {
  id: string
  path: string
  name: string
  parentId: string | null
  createdAt: string
  updatedAt: string
  children?: Tenant[]
  _count?: {
    customers: number
    assets: number
    devices: number
  }
}

export interface Customer {
  id: string
  tenantId: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  metadata: Record<string, unknown>
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Asset {
  id: string
  tenantId: string
  customerId: string | null
  name: string
  latitude: number | null
  longitude: number | null
  address: string | null
  metadata: Record<string, unknown>
  isActive: boolean
  createdAt: string
  updatedAt: string
  customer?: Customer
  deviceAllocations?: DeviceAllocation[]
}

export type DeviceType = 'SIGFOX' | 'LORA' | 'NB_IOT' | 'LTE_M' | 'WIFI' | 'OTHER'

export interface Device {
  id: string
  tenantId: string
  serialNumber: string
  type: DeviceType
  manufacturer: string | null
  model: string | null
  firmware: string | null
  metadata: Record<string, unknown>
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface DeviceAllocation {
  id: string
  assetId: string
  deviceId: string
  startDate: string
  endDate: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  asset?: Asset
  device?: Device
}

export interface Reading {
  time: string
  assetId: string
  deviceId: string
  value: number
  delta: number | null
  signalQuality: number | null
  battery: number | null
  rawPayload: Record<string, unknown> | null
  isValid: boolean
}

export type AlertType =
  | 'LEAK_DETECTED'
  | 'HIGH_CONSUMPTION'
  | 'NO_SIGNAL'
  | 'LOW_BATTERY'
  | 'TAMPER_DETECTED'
  | 'THRESHOLD_EXCEEDED'
  | 'DEVICE_OFFLINE'

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL'
export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED'

export interface Alert {
  id: string
  assetId: string | null
  deviceId: string | null
  type: AlertType
  severity: AlertSeverity
  status: AlertStatus
  title: string
  description: string | null
  metadata: Record<string, unknown>
  createdAt: string
  resolvedAt: string | null
}

// =============================================================================
// Socket Event Types
// =============================================================================

export interface SocketReading extends Reading {
  assetName?: string
  deviceSerial?: string
  tenantId?: string
}

export interface SocketAlert extends Alert {
  assetName?: string
  tenantName?: string
}

// =============================================================================
// Dashboard Types
// =============================================================================

export interface DashboardStats {
  activeAssets: number
  readingsToday: number
  totalConsumption: number
  activeAlerts: number
}

export interface ConsumptionSummary {
  assetId: string
  assetName: string
  totalConsumption: number
  averageDaily: number
  lastReading: string
  trend: 'up' | 'down' | 'stable'
}

// =============================================================================
// Chart Types
// =============================================================================

export interface ChartSeries {
  name: string
  data: { x: number; y: number }[]
}

export interface AggregatedReading {
  bucket: string
  avgValue: number
  totalConsumption: number
  avgSignal: number
  readingCount: number
}

