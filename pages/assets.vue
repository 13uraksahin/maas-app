<script setup lang="ts">
import { 
  Gauge, 
  Plus, 
  Pencil, 
  Trash2, 
  Search,
  ArrowLeftRight,
  Unplug,
  MapPin,
  User,
  Cpu,
} from 'lucide-vue-next'

definePageMeta({
  title: 'Assets',
})

const config = useRuntimeConfig()

// State
const assets = ref<any[]>([])
const availableDevices = ref<any[]>([])
const customers = ref<any[]>([])
const tenants = ref<any[]>([])
const isLoading = ref(true)
const showModal = ref(false)
const showSwapModal = ref(false)
const editingAsset = ref<any>(null)
const swappingAsset = ref<any>(null)

// Filters
const searchQuery = ref('')

// Form state
const form = reactive({
  tenantId: '',
  customerId: '',
  name: '',
  address: '',
  latitude: '',
  longitude: '',
})

// Swap form
const swapForm = reactive({
  newDeviceId: '',
  reason: '',
})

// Fetch data
async function fetchAssets() {
  isLoading.value = true
  try {
    const response = await fetch(`${config.public.apiBaseUrl}/api/assets`)
    const data = await response.json()
    assets.value = data.data || []
  } catch (error) {
    console.error('Failed to fetch assets:', error)
  } finally {
    isLoading.value = false
  }
}

async function fetchAvailableDevices() {
  try {
    const response = await fetch(`${config.public.apiBaseUrl}/api/devices/available`)
    const data = await response.json()
    availableDevices.value = data.data || []
  } catch (error) {
    console.error('Failed to fetch available devices:', error)
  }
}

async function fetchTenants() {
  try {
    const response = await fetch(`${config.public.apiBaseUrl}/api/tenants`)
    const data = await response.json()
    tenants.value = data || []
  } catch (error) {
    console.error('Failed to fetch tenants:', error)
  }
}

// Computed filtered assets
const filteredAssets = computed(() => {
  if (!searchQuery.value) return assets.value
  
  const query = searchQuery.value.toLowerCase()
  return assets.value.filter(
    (a) =>
      a.name.toLowerCase().includes(query) ||
      a.customer?.name?.toLowerCase().includes(query) ||
      a.address?.toLowerCase().includes(query),
  )
})

// Get current device for an asset
function getCurrentDevice(asset: any) {
  return asset.deviceAllocations?.[0]?.device || null
}

// Open create modal
function openCreateModal() {
  editingAsset.value = null
  form.tenantId = tenants.value[0]?.id || ''
  form.customerId = ''
  form.name = ''
  form.address = ''
  form.latitude = ''
  form.longitude = ''
  showModal.value = true
}

// Open edit modal
function openEditModal(asset: any) {
  editingAsset.value = asset
  form.tenantId = asset.tenantId
  form.customerId = asset.customerId || ''
  form.name = asset.name
  form.address = asset.address || ''
  form.latitude = asset.latitude?.toString() || ''
  form.longitude = asset.longitude?.toString() || ''
  showModal.value = true
}

// Open swap modal
async function openSwapModal(asset: any) {
  swappingAsset.value = asset
  swapForm.newDeviceId = ''
  swapForm.reason = ''
  await fetchAvailableDevices()
  showSwapModal.value = true
}

// Save asset
async function saveAsset() {
  try {
    const url = editingAsset.value
      ? `${config.public.apiBaseUrl}/api/assets/${editingAsset.value.id}`
      : `${config.public.apiBaseUrl}/api/assets`

    const response = await fetch(url, {
      method: editingAsset.value ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: form.tenantId,
        customerId: form.customerId || null,
        name: form.name,
        address: form.address || null,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
      }),
    })

    if (response.ok) {
      showModal.value = false
      await fetchAssets()
    } else {
      const error = await response.json()
      alert(`Error: ${error.message}`)
    }
  } catch (error) {
    console.error('Failed to save asset:', error)
    alert('Failed to save asset')
  }
}

// Swap device
async function swapDevice() {
  if (!swapForm.newDeviceId) {
    alert('Please select a device')
    return
  }

  try {
    const currentDevice = getCurrentDevice(swappingAsset.value)
    const endpoint = currentDevice ? 'swap-device' : 'assign-device'
    
    const response = await fetch(
      `${config.public.apiBaseUrl}/api/assets/${swappingAsset.value.id}/${endpoint}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          currentDevice
            ? { newDeviceId: swapForm.newDeviceId, reason: swapForm.reason }
            : { deviceId: swapForm.newDeviceId, notes: swapForm.reason },
        ),
      },
    )

    if (response.ok) {
      showSwapModal.value = false
      await fetchAssets()
    } else {
      const error = await response.json()
      alert(`Error: ${error.message}`)
    }
  } catch (error) {
    console.error('Failed to swap device:', error)
    alert('Failed to swap device')
  }
}

// Unassign device
async function unassignDevice(asset: any) {
  if (!confirm(`Unassign device from "${asset.name}"?`)) return

  try {
    const response = await fetch(
      `${config.public.apiBaseUrl}/api/assets/${asset.id}/unassign-device`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Manual unassignment' }),
      },
    )

    if (response.ok) {
      await fetchAssets()
    } else {
      const error = await response.json()
      alert(`Error: ${error.message}`)
    }
  } catch (error) {
    console.error('Failed to unassign device:', error)
  }
}

// Delete asset
async function deleteAsset(asset: any) {
  if (!confirm(`Delete asset "${asset.name}"?`)) return

  try {
    const response = await fetch(
      `${config.public.apiBaseUrl}/api/assets/${asset.id}`,
      { method: 'DELETE' },
    )

    if (response.ok) {
      await fetchAssets()
    } else {
      const error = await response.json()
      alert(`Error: ${error.message}`)
    }
  } catch (error) {
    console.error('Failed to delete asset:', error)
  }
}

onMounted(async () => {
  await Promise.all([fetchAssets(), fetchTenants()])
})
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div class="flex items-center gap-4">
        <div class="p-3 rounded-xl bg-primary/10">
          <Gauge class="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-gradient">Meters (Assets)</h1>
          <p class="text-muted-foreground mt-1">
            Manage meter points and device assignments
          </p>
        </div>
      </div>

      <button
        class="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        @click="openCreateModal"
      >
        <Plus class="w-5 h-5" />
        Add Asset
      </button>
    </div>

    <!-- Search -->
    <div class="relative max-w-md">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
      <input
        v-model="searchQuery"
        type="text"
        class="w-full pl-10 pr-4 py-2 rounded-xl bg-muted border border-border focus:border-primary outline-none"
        placeholder="Search assets..."
      />
    </div>

    <!-- Assets Grid -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <div class="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>

    <div v-else-if="filteredAssets.length === 0" class="glass-card p-12 text-center">
      <Gauge class="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
      <h2 class="text-xl font-semibold mb-2">No Assets Found</h2>
      <p class="text-muted-foreground">
        {{ searchQuery ? 'Try adjusting your search' : 'Add your first asset to get started' }}
      </p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <div
        v-for="asset in filteredAssets"
        :key="asset.id"
        class="glass-card p-6 hover:border-primary/30 transition-colors"
      >
        <!-- Header -->
        <div class="flex items-start justify-between mb-4">
          <div>
            <h3 class="text-lg font-semibold">{{ asset.name }}</h3>
            <div v-if="asset.customer" class="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <User class="w-4 h-4" />
              {{ asset.customer.name }}
            </div>
          </div>
          <div class="flex items-center gap-1">
            <button
              class="p-2 rounded-lg hover:bg-muted transition-colors"
              @click="openEditModal(asset)"
            >
              <Pencil class="w-4 h-4" />
            </button>
            <button
              class="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
              @click="deleteAsset(asset)"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Location -->
        <div v-if="asset.address" class="flex items-start gap-2 text-sm text-muted-foreground mb-4">
          <MapPin class="w-4 h-4 mt-0.5 shrink-0" />
          <span class="line-clamp-2">{{ asset.address }}</span>
        </div>

        <!-- Device Info -->
        <div class="p-4 rounded-xl bg-muted/50 border border-border">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Cpu class="w-5 h-5 text-muted-foreground" />
              <div>
                <template v-if="getCurrentDevice(asset)">
                  <span class="font-mono font-medium">
                    {{ getCurrentDevice(asset).serialNumber }}
                  </span>
                  <span class="block text-xs text-muted-foreground">
                    {{ getCurrentDevice(asset).profile?.name }}
                  </span>
                </template>
                <span v-else class="text-muted-foreground">No device assigned</span>
              </div>
            </div>

            <div class="flex items-center gap-1">
              <button
                class="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                :title="getCurrentDevice(asset) ? 'Swap Device' : 'Assign Device'"
                @click="openSwapModal(asset)"
              >
                <ArrowLeftRight class="w-4 h-4" />
              </button>
              <button
                v-if="getCurrentDevice(asset)"
                class="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                title="Unassign Device"
                @click="unassignDevice(asset)"
              >
                <Unplug class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Asset Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      @click.self="showModal = false"
    >
      <div class="glass-card w-full max-w-lg m-4">
        <div class="p-6 border-b border-border">
          <h2 class="text-xl font-semibold">
            {{ editingAsset ? 'Edit Asset' : 'Add Asset' }}
          </h2>
        </div>

        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">Tenant</label>
            <select
              v-model="form.tenantId"
              class="w-full px-4 py-2 rounded-xl bg-muted border border-border focus:border-primary outline-none"
              :disabled="!!editingAsset"
            >
              <option v-for="tenant in tenants" :key="tenant.id" :value="tenant.id">
                {{ tenant.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Name</label>
            <input
              v-model="form.name"
              type="text"
              class="w-full px-4 py-2 rounded-xl bg-muted border border-border focus:border-primary outline-none"
              placeholder="Water Inlet - Main Building"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Address</label>
            <input
              v-model="form.address"
              type="text"
              class="w-full px-4 py-2 rounded-xl bg-muted border border-border focus:border-primary outline-none"
              placeholder="123 Main Street"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-2">Latitude</label>
              <input
                v-model="form.latitude"
                type="text"
                class="w-full px-4 py-2 rounded-xl bg-muted border border-border focus:border-primary outline-none"
                placeholder="41.0082"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Longitude</label>
              <input
                v-model="form.longitude"
                type="text"
                class="w-full px-4 py-2 rounded-xl bg-muted border border-border focus:border-primary outline-none"
                placeholder="28.9784"
              />
            </div>
          </div>
        </div>

        <div class="p-6 border-t border-border flex justify-end gap-4">
          <button
            class="px-6 py-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
            @click="showModal = false"
          >
            Cancel
          </button>
          <button
            class="px-6 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            @click="saveAsset"
          >
            {{ editingAsset ? 'Save Changes' : 'Add Asset' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Swap Device Modal -->
    <div
      v-if="showSwapModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      @click.self="showSwapModal = false"
    >
      <div class="glass-card w-full max-w-lg m-4">
        <div class="p-6 border-b border-border">
          <h2 class="text-xl font-semibold">
            {{ getCurrentDevice(swappingAsset) ? 'Swap Device' : 'Assign Device' }}
          </h2>
          <p class="text-sm text-muted-foreground mt-1">
            Asset: {{ swappingAsset?.name }}
          </p>
        </div>

        <div class="p-6 space-y-4">
          <!-- Current device info -->
          <div v-if="getCurrentDevice(swappingAsset)" class="p-4 rounded-xl bg-muted/50 border border-border">
            <p class="text-sm text-muted-foreground mb-1">Current Device</p>
            <p class="font-mono font-medium">
              {{ getCurrentDevice(swappingAsset).serialNumber }}
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Select New Device</label>
            <select
              v-model="swapForm.newDeviceId"
              class="w-full px-4 py-2 rounded-xl bg-muted border border-border focus:border-primary outline-none"
            >
              <option value="">-- Select Device --</option>
              <option v-for="device in availableDevices" :key="device.id" :value="device.id">
                {{ device.serialNumber }} ({{ device.profile?.name }})
              </option>
            </select>
            <p v-if="availableDevices.length === 0" class="text-sm text-muted-foreground mt-2">
              No devices available. Add devices with "In Stock" status first.
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Reason (optional)</label>
            <input
              v-model="swapForm.reason"
              type="text"
              class="w-full px-4 py-2 rounded-xl bg-muted border border-border focus:border-primary outline-none"
              placeholder="Device malfunction, upgrade, etc."
            />
          </div>
        </div>

        <div class="p-6 border-t border-border flex justify-end gap-4">
          <button
            class="px-6 py-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
            @click="showSwapModal = false"
          >
            Cancel
          </button>
          <button
            class="px-6 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            :disabled="!swapForm.newDeviceId"
            @click="swapDevice"
          >
            {{ getCurrentDevice(swappingAsset) ? 'Swap Device' : 'Assign Device' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
