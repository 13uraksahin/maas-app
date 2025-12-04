<script setup lang="ts">
import { 
  Cpu, 
  Plus, 
  Pencil, 
  Trash2, 
  Search,
  Filter,
  Battery,
  Signal,
  Clock,
} from 'lucide-vue-next'

definePageMeta({
  title: 'Devices',
})

const config = useRuntimeConfig()

// State
const devices = ref<any[]>([])
const profiles = ref<any[]>([])
const tenants = ref<any[]>([])
const isLoading = ref(true)
const showModal = ref(false)
const editingDevice = ref<any>(null)

// Filters
const searchQuery = ref('')
const statusFilter = ref<string>('')
const profileFilter = ref<string>('')

// Form state
const form = reactive({
  tenantId: '',
  profileId: '',
  serialNumber: '',
  model: '',
  firmware: '',
})

// Status options
const statusOptions = [
  { value: 'ACTIVE', label: 'Active', color: 'bg-signal-excellent' },
  { value: 'IN_STOCK', label: 'In Stock', color: 'bg-gray-400' },
  { value: 'MAINTENANCE', label: 'Maintenance', color: 'bg-signal-fair' },
  { value: 'RETIRED', label: 'Retired', color: 'bg-signal-poor' },
]

// Fetch data
async function fetchDevices() {
  isLoading.value = true
  try {
    const params = new URLSearchParams()
    if (statusFilter.value) params.set('status', statusFilter.value)
    if (profileFilter.value) params.set('profileId', profileFilter.value)

    const response = await fetch(`${config.public.apiBaseUrl}/api/devices?${params}`)
    const data = await response.json()
    devices.value = data.data || []
  } catch (error) {
    console.error('Failed to fetch devices:', error)
  } finally {
    isLoading.value = false
  }
}

async function fetchProfiles() {
  try {
    const response = await fetch(`${config.public.apiBaseUrl}/api/device-profiles`)
    const data = await response.json()
    profiles.value = data.data || []
  } catch (error) {
    console.error('Failed to fetch profiles:', error)
  }
}

async function fetchTenants() {
  try {
    const response = await fetch(`${config.public.apiBaseUrl}/api/tenants`)
    const data = await response.json()
    tenants.value = data.data || []
  } catch (error) {
    console.error('Failed to fetch tenants:', error)
  }
}

// Computed filtered devices
const filteredDevices = computed(() => {
  if (!searchQuery.value) return devices.value
  
  const query = searchQuery.value.toLowerCase()
  return devices.value.filter(
    (d) =>
      d.serialNumber.toLowerCase().includes(query) ||
      d.profile?.name?.toLowerCase().includes(query) ||
      d.model?.toLowerCase().includes(query),
  )
})

// Open create modal
function openCreateModal() {
  editingDevice.value = null
  form.tenantId = tenants.value[0]?.id || ''
  form.profileId = profiles.value[0]?.id || ''
  form.serialNumber = ''
  form.model = ''
  form.firmware = ''
  showModal.value = true
}

// Open edit modal
function openEditModal(device: any) {
  editingDevice.value = device
  form.tenantId = device.tenantId
  form.profileId = device.profileId
  form.serialNumber = device.serialNumber
  form.model = device.model || ''
  form.firmware = device.firmware || ''
  showModal.value = true
}

// Save device
async function saveDevice() {
  try {
    const url = editingDevice.value
      ? `${config.public.apiBaseUrl}/api/devices/${editingDevice.value.id}`
      : `${config.public.apiBaseUrl}/api/devices`

    const response = await fetch(url, {
      method: editingDevice.value ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (response.ok) {
      showModal.value = false
      await fetchDevices()
    } else {
      const error = await response.json()
      alert(`Error: ${error.message}`)
    }
  } catch (error) {
    console.error('Failed to save device:', error)
    alert('Failed to save device')
  }
}

// Update device status
async function updateStatus(device: any, status: string) {
  try {
    await fetch(`${config.public.apiBaseUrl}/api/devices/${device.id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    await fetchDevices()
  } catch (error) {
    console.error('Failed to update status:', error)
  }
}

// Delete device
async function deleteDevice(device: any) {
  if (!confirm(`Delete device "${device.serialNumber}"?`)) return

  try {
    const response = await fetch(
      `${config.public.apiBaseUrl}/api/devices/${device.id}`,
      { method: 'DELETE' },
    )

    if (response.ok) {
      await fetchDevices()
    } else {
      const error = await response.json()
      alert(`Error: ${error.message}`)
    }
  } catch (error) {
    console.error('Failed to delete device:', error)
  }
}

// Get status badge
function getStatusBadge(status: string) {
  return statusOptions.find((s) => s.value === status) || statusOptions[1]
}

// Format last seen
function formatLastSeen(date: string | null): string {
  if (!date) return 'Never'
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const hours = Math.floor(diff / 3600000)
  
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  return d.toLocaleDateString()
}

// Watch filters
watch([statusFilter, profileFilter], () => fetchDevices())

onMounted(async () => {
  await Promise.all([fetchDevices(), fetchProfiles(), fetchTenants()])
})
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div class="flex items-center gap-4">
        <div class="p-3 rounded-xl bg-primary/10">
          <Cpu class="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-gradient">Device Inventory</h1>
          <p class="text-muted-foreground mt-1">
            Manage hardware devices and their status
          </p>
        </div>
      </div>

      <button
        class="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        @click="openCreateModal"
      >
        <Plus class="w-5 h-5" />
        Add Device
      </button>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-4">
      <div class="relative flex-1 min-w-[200px]">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          v-model="searchQuery"
          type="text"
          class="w-full pl-10 pr-4 py-2 rounded-xl bg-muted border border-border focus:border-primary outline-none"
          placeholder="Search by serial number..."
        />
      </div>

      <select
        v-model="statusFilter"
        class="px-4 py-2 rounded-xl bg-muted border border-border focus:border-primary outline-none"
      >
        <option value="">All Statuses</option>
        <option v-for="status in statusOptions" :key="status.value" :value="status.value">
          {{ status.label }}
        </option>
      </select>

      <select
        v-model="profileFilter"
        class="px-4 py-2 rounded-xl bg-muted border border-border focus:border-primary outline-none"
      >
        <option value="">All Profiles</option>
        <option v-for="profile in profiles" :key="profile.id" :value="profile.id">
          {{ profile.name }}
        </option>
      </select>
    </div>

    <!-- Devices Table -->
    <div class="glass-card overflow-hidden">
      <div v-if="isLoading" class="flex justify-center py-12">
        <div class="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>

      <div v-else-if="filteredDevices.length === 0" class="p-12 text-center">
        <Cpu class="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h2 class="text-xl font-semibold mb-2">No Devices Found</h2>
        <p class="text-muted-foreground">
          {{ searchQuery || statusFilter || profileFilter ? 'Try adjusting your filters' : 'Add your first device to get started' }}
        </p>
      </div>

      <table v-else class="w-full">
        <thead class="bg-muted/30">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
              Serial Number
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
              Profile
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
              Status
            </th>
            <th class="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">
              Battery
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
              Last Seen
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
              Assigned To
            </th>
            <th class="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border/50">
          <tr
            v-for="device in filteredDevices"
            :key="device.id"
            class="hover:bg-muted/30 transition-colors"
          >
            <td class="px-4 py-3">
              <span class="font-mono font-medium">{{ device.serialNumber }}</span>
              <span v-if="device.model" class="block text-xs text-muted-foreground">
                {{ device.model }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span class="text-sm">{{ device.profile?.name || '--' }}</span>
              <span class="block text-xs text-muted-foreground">
                {{ device.profile?.protocol }}
              </span>
            </td>
            <td class="px-4 py-3">
              <select
                :value="device.status"
                class="text-sm px-3 py-1 rounded-full border bg-transparent cursor-pointer"
                :class="{
                  'border-signal-excellent/30 text-signal-excellent': device.status === 'ACTIVE',
                  'border-gray-400/30 text-gray-400': device.status === 'IN_STOCK',
                  'border-signal-fair/30 text-signal-fair': device.status === 'MAINTENANCE',
                  'border-signal-poor/30 text-signal-poor': device.status === 'RETIRED',
                }"
                @change="updateStatus(device, ($event.target as HTMLSelectElement).value)"
              >
                <option v-for="status in statusOptions" :key="status.value" :value="status.value">
                  {{ status.label }}
                </option>
              </select>
            </td>
            <td class="px-4 py-3 text-center">
              <div v-if="device.lastBattery !== null" class="flex items-center justify-center gap-1">
                <Battery 
                  class="w-4 h-4"
                  :class="device.lastBattery > 20 ? 'text-signal-good' : 'text-signal-poor'"
                />
                <span class="text-sm">{{ device.lastBattery }}%</span>
              </div>
              <span v-else class="text-muted-foreground">--</span>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock class="w-4 h-4" />
                {{ formatLastSeen(device.lastSeen) }}
              </div>
            </td>
            <td class="px-4 py-3">
              <span v-if="device.allocations?.[0]?.asset" class="text-sm">
                {{ device.allocations[0].asset.name }}
              </span>
              <span v-else class="text-sm text-muted-foreground">Unassigned</span>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex items-center justify-end gap-2">
                <button
                  class="p-2 rounded-lg hover:bg-muted transition-colors"
                  @click="openEditModal(device)"
                >
                  <Pencil class="w-4 h-4" />
                </button>
                <button
                  class="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                  @click="deleteDevice(device)"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create/Edit Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      @click.self="showModal = false"
    >
      <div class="glass-card w-full max-w-lg m-4">
        <div class="p-6 border-b border-border">
          <h2 class="text-xl font-semibold">
            {{ editingDevice ? 'Edit Device' : 'Add Device' }}
          </h2>
        </div>

        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">Tenant</label>
            <select
              v-model="form.tenantId"
              class="w-full px-4 py-2 rounded-xl bg-muted border border-border focus:border-primary outline-none"
              :disabled="!!editingDevice"
            >
              <option v-for="tenant in tenants" :key="tenant.id" :value="tenant.id">
                {{ tenant.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Device Profile</label>
            <select
              v-model="form.profileId"
              class="w-full px-4 py-2 rounded-xl bg-muted border border-border focus:border-primary outline-none"
            >
              <option v-for="profile in profiles" :key="profile.id" :value="profile.id">
                {{ profile.name }} ({{ profile.manufacturer }})
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Serial Number</label>
            <input
              v-model="form.serialNumber"
              type="text"
              class="w-full px-4 py-2 rounded-xl bg-muted border border-border focus:border-primary outline-none font-mono"
              placeholder="SIGFOX001"
              :disabled="!!editingDevice"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-2">Model (optional)</label>
              <input
                v-model="form.model"
                type="text"
                class="w-full px-4 py-2 rounded-xl bg-muted border border-border focus:border-primary outline-none"
                placeholder="WM-100"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Firmware (optional)</label>
              <input
                v-model="form.firmware"
                type="text"
                class="w-full px-4 py-2 rounded-xl bg-muted border border-border focus:border-primary outline-none"
                placeholder="v1.2.3"
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
            @click="saveDevice"
          >
            {{ editingDevice ? 'Save Changes' : 'Add Device' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

