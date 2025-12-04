<script setup lang="ts">
import { 
  Gauge, Plus, Pencil, Trash2, MapPin, Eye, 
  ArrowLeftRight, Cpu, XCircle, Loader2 
} from 'lucide-vue-next'

const api = useApi()
const toast = useToast()

// State
const loading = ref(true)
const assets = ref<any[]>([])
const tenants = ref<any[]>([])
const customers = ref<any[]>([])
const availableDevices = ref<any[]>([])

// Dialogs
const showCreateDialog = ref(false)
const showDeleteDialog = ref(false)
const showDetailsSheet = ref(false)
const showSwapDialog = ref(false)

const selectedAsset = ref<any>(null)
const isSubmitting = ref(false)

// Form state
const form = reactive({
  tenantId: '',
  customerId: '',
  name: '',
  latitude: '',
  longitude: '',
  address: '',
})
const formErrors = reactive({
  tenantId: '',
  name: '',
})

// Swap form
const swapForm = reactive({
  deviceId: '',
  reason: '',
})

// Table columns
const columns = [
  { key: 'name', label: 'Meter Name' },
  { key: 'customer.name', label: 'Customer' },
  { key: 'address', label: 'Location' },
  { key: 'device', label: 'Device S/N' },
  { key: 'status', label: 'Status' },
]

// Computed options
const tenantOptions = computed(() =>
  tenants.value.map(t => ({ value: t.id, label: t.name }))
)

const customerOptions = computed(() => {
  const filtered = form.tenantId 
    ? customers.value.filter(c => c.tenantId === form.tenantId)
    : customers.value
  return [
    { value: '', label: 'No Customer (Unassigned)' },
    ...filtered.map(c => ({ value: c.id, label: c.name })),
  ]
})

const deviceOptions = computed(() =>
  availableDevices.value.map(d => ({
    value: d.id,
    label: `${d.serialNumber} (${d.profile?.name || 'Unknown'})`,
  }))
)

// Get current device from asset
function getCurrentDevice(asset: any) {
  const allocation = asset.deviceAllocations?.find((a: any) => !a.endDate)
  return allocation?.device || null
}

// Fetch data
async function fetchData() {
  loading.value = true
  try {
    const [assetsRes, tenantsRes, customersRes] = await Promise.all([
      api.assets.list(),
      api.tenants.list(),
      api.customers.list(),
    ])
    assets.value = assetsRes.data || []
    tenants.value = tenantsRes.data || []
    customers.value = customersRes.customers || []
  } catch (error: any) {
    toast.error('Failed to load data', error.message)
  } finally {
    loading.value = false
  }
}

// Fetch available devices
async function fetchAvailableDevices() {
  try {
    const response = await api.devices.getAvailable()
    availableDevices.value = response.data || []
  } catch (error: any) {
    toast.error('Failed to load devices', error.message)
  }
}

// Reset form
function resetForm() {
  form.tenantId = ''
  form.customerId = ''
  form.name = ''
  form.latitude = ''
  form.longitude = ''
  form.address = ''
  formErrors.tenantId = ''
  formErrors.name = ''
  selectedAsset.value = null
}

// Reset swap form
function resetSwapForm() {
  swapForm.deviceId = ''
  swapForm.reason = ''
}

// Validate form
function validateForm(): boolean {
  let valid = true
  formErrors.tenantId = ''
  formErrors.name = ''

  if (!selectedAsset.value && !form.tenantId) {
    formErrors.tenantId = 'Tenant is required'
    valid = false
  }

  if (!form.name.trim()) {
    formErrors.name = 'Name is required'
    valid = false
  }

  return valid
}

// Open create dialog
function openCreateDialog() {
  resetForm()
  showCreateDialog.value = true
}

// Open edit dialog
function openEditDialog(asset: any) {
  selectedAsset.value = asset
  form.tenantId = asset.tenantId
  form.customerId = asset.customerId || ''
  form.name = asset.name
  form.latitude = asset.latitude?.toString() || ''
  form.longitude = asset.longitude?.toString() || ''
  form.address = asset.address || ''
  showCreateDialog.value = true
}

// Open details sheet
function openDetails(asset: any) {
  selectedAsset.value = asset
  showDetailsSheet.value = true
}

// Open swap device dialog
async function openSwapDialog() {
  resetSwapForm()
  await fetchAvailableDevices()
  showSwapDialog.value = true
}

// Open delete dialog
function openDeleteDialog(asset: any) {
  selectedAsset.value = asset
  showDeleteDialog.value = true
}

// Create or update asset
async function handleSubmit() {
  if (!validateForm()) return

  isSubmitting.value = true
  try {
    const data = {
      name: form.name,
      customerId: form.customerId || undefined,
      latitude: form.latitude ? parseFloat(form.latitude) : undefined,
      longitude: form.longitude ? parseFloat(form.longitude) : undefined,
      address: form.address || undefined,
    }

    if (selectedAsset.value) {
      await api.assets.update(selectedAsset.value.id, data)
      toast.success('Meter updated successfully')
    } else {
      await api.assets.create({ ...data, tenantId: form.tenantId })
      toast.success('Meter created successfully')
    }
    showCreateDialog.value = false
    resetForm()
    await fetchData()
  } catch (error: any) {
    toast.error('Failed to save meter', error.message)
  } finally {
    isSubmitting.value = false
  }
}

// Swap device
async function handleSwapDevice() {
  if (!swapForm.deviceId || !selectedAsset.value) return

  isSubmitting.value = true
  try {
    const currentDevice = getCurrentDevice(selectedAsset.value)
    if (currentDevice) {
      await api.assets.swapDevice(
        selectedAsset.value.id,
        swapForm.deviceId,
        swapForm.reason
      )
    } else {
      await api.assets.assignDevice(
        selectedAsset.value.id,
        swapForm.deviceId,
        swapForm.reason
      )
    }
    toast.success('Device assigned successfully')
    showSwapDialog.value = false
    resetSwapForm()
    await fetchData()
    // Refresh selected asset details
    const updated = assets.value.find(a => a.id === selectedAsset.value.id)
    if (updated) selectedAsset.value = updated
  } catch (error: any) {
    toast.error('Failed to assign device', error.message)
  } finally {
    isSubmitting.value = false
  }
}

// Unassign device
async function handleUnassignDevice() {
  if (!selectedAsset.value) return

  isSubmitting.value = true
  try {
    await api.assets.unassignDevice(selectedAsset.value.id, 'Manually unassigned')
    toast.success('Device unassigned')
    await fetchData()
    const updated = assets.value.find(a => a.id === selectedAsset.value.id)
    if (updated) selectedAsset.value = updated
  } catch (error: any) {
    toast.error('Failed to unassign device', error.message)
  } finally {
    isSubmitting.value = false
  }
}

// Delete asset
async function handleDelete() {
  if (!selectedAsset.value) return

  isSubmitting.value = true
  try {
    await api.assets.delete(selectedAsset.value.id)
    toast.success('Meter deleted successfully')
    showDeleteDialog.value = false
    selectedAsset.value = null
    await fetchData()
  } catch (error: any) {
    toast.error('Failed to delete meter', error.message)
  } finally {
    isSubmitting.value = false
  }
}

// Initialize
onMounted(() => {
  fetchData()
})
</script>

<template>
  <NuxtLayout name="default">
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-foreground flex items-center gap-3">
            <div class="p-2 rounded-xl bg-primary/10 text-primary">
              <Gauge class="w-6 h-6" />
            </div>
            Meters
          </h1>
          <p class="text-muted-foreground mt-1">
            Manage meter assets and device assignments
          </p>
        </div>
        <UiButton @click="openCreateDialog">
          <Plus class="w-4 h-4" />
          Add Meter
        </UiButton>
      </div>

      <!-- Data Table -->
      <UiDataTable
        :columns="columns"
        :data="assets"
        :loading="loading"
        search-placeholder="Search meters..."
        empty-message="No meters found. Create your first meter to get started."
        @row-click="openDetails"
      >
        <template #cell-name="{ item }">
          <div class="font-medium">{{ item.name }}</div>
        </template>

        <template #cell-customer.name="{ item }">
          <span v-if="item.customer">{{ item.customer.name }}</span>
          <span v-else class="text-muted-foreground text-sm">Unassigned</span>
        </template>

        <template #cell-address="{ item }">
          <div v-if="item.address" class="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin class="w-3 h-3" />
            {{ item.address }}
          </div>
          <span v-else class="text-muted-foreground">-</span>
        </template>

        <template #cell-device="{ item }">
          <div v-if="getCurrentDevice(item)" class="flex items-center gap-2">
            <Cpu class="w-3 h-3 text-primary" />
            <span class="font-mono text-sm">{{ getCurrentDevice(item).serialNumber }}</span>
          </div>
          <span v-else class="text-muted-foreground text-sm">No device</span>
        </template>

        <template #cell-status="{ item }">
          <UiBadge 
            :variant="getCurrentDevice(item) ? 'default' : 'outline'"
            :class="getCurrentDevice(item) ? 'bg-green-500/10 text-green-500 border-green-500/20' : ''"
          >
            {{ getCurrentDevice(item) ? 'Active' : 'Inactive' }}
          </UiBadge>
        </template>

        <template #actions="{ item }">
          <div class="flex items-center gap-2" @click.stop>
            <button
              class="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
              title="View Details"
              @click="openDetails(item)"
            >
              <Eye class="w-4 h-4" />
            </button>
            <button
              class="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
              title="Edit"
              @click="openEditDialog(item)"
            >
              <Pencil class="w-4 h-4" />
            </button>
            <button
              class="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
              title="Delete"
              @click="openDeleteDialog(item)"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </template>
      </UiDataTable>

      <!-- Create/Edit Dialog -->
      <UiDialog
        v-model="showCreateDialog"
        :title="selectedAsset ? 'Edit Meter' : 'Create Meter'"
        :description="selectedAsset ? 'Update meter information' : 'Add a new meter point'"
        max-width="lg"
      >
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <UiSelect
            v-if="!selectedAsset"
            v-model="form.tenantId"
            label="Tenant"
            :options="tenantOptions"
            placeholder="Select tenant"
            :error="formErrors.tenantId"
            required
          />

          <UiInput
            v-model="form.name"
            label="Meter Name"
            placeholder="e.g., Factory Main Valve"
            :error="formErrors.name"
            required
          />

          <UiSelect
            v-model="form.customerId"
            label="Customer"
            :options="customerOptions"
            placeholder="Select customer (optional)"
          />

          <UiInput
            v-model="form.address"
            label="Address / Location"
            placeholder="e.g., 123 Main Street"
          />

          <div class="grid grid-cols-2 gap-4">
            <UiInput
              v-model="form.latitude"
              label="Latitude"
              type="number"
              placeholder="e.g., 41.0082"
            />
            <UiInput
              v-model="form.longitude"
              label="Longitude"
              type="number"
              placeholder="e.g., 28.9784"
            />
          </div>
        </form>

        <template #footer="{ close }">
          <UiButton variant="outline" @click="close" :disabled="isSubmitting">
            Cancel
          </UiButton>
          <UiButton @click="handleSubmit" :disabled="isSubmitting">
            {{ isSubmitting ? 'Saving...' : (selectedAsset ? 'Update' : 'Create') }}
          </UiButton>
        </template>
      </UiDialog>

      <!-- Details Sheet -->
      <UiDialog
        v-model="showDetailsSheet"
        :title="selectedAsset?.name || 'Meter Details'"
        description="View meter details and manage device assignment"
        max-width="xl"
      >
        <div v-if="selectedAsset" class="space-y-6">
          <!-- Info Cards -->
          <div class="grid grid-cols-2 gap-4">
            <div class="p-4 rounded-xl bg-muted/30 border border-border/50">
              <p class="text-xs text-muted-foreground uppercase tracking-wider mb-1">Customer</p>
              <p class="font-medium">{{ selectedAsset.customer?.name || 'Unassigned' }}</p>
            </div>
            <div class="p-4 rounded-xl bg-muted/30 border border-border/50">
              <p class="text-xs text-muted-foreground uppercase tracking-wider mb-1">Tenant</p>
              <p class="font-medium">{{ selectedAsset.tenant?.name || '-' }}</p>
            </div>
          </div>

          <div v-if="selectedAsset.address" class="p-4 rounded-xl bg-muted/30 border border-border/50">
            <p class="text-xs text-muted-foreground uppercase tracking-wider mb-1">Location</p>
            <p class="font-medium flex items-center gap-2">
              <MapPin class="w-4 h-4" />
              {{ selectedAsset.address }}
            </p>
          </div>

          <!-- Current Device Section -->
          <div class="border border-border/50 rounded-xl overflow-hidden">
            <div class="px-4 py-3 bg-muted/30 border-b border-border/50">
              <h3 class="font-semibold flex items-center gap-2">
                <Cpu class="w-4 h-4" />
                Current Device
              </h3>
            </div>
            <div class="p-4">
              <div v-if="getCurrentDevice(selectedAsset)" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <p class="text-xs text-muted-foreground mb-1">Serial Number</p>
                    <p class="font-mono font-medium">{{ getCurrentDevice(selectedAsset).serialNumber }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-muted-foreground mb-1">Profile</p>
                    <p class="font-medium">{{ getCurrentDevice(selectedAsset).profile?.name || '-' }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-muted-foreground mb-1">Status</p>
                    <UiBadge variant="default" class="bg-green-500/10 text-green-500 border-green-500/20">
                      {{ getCurrentDevice(selectedAsset).status }}
                    </UiBadge>
                  </div>
                  <div>
                    <p class="text-xs text-muted-foreground mb-1">Battery</p>
                    <p class="font-medium">{{ getCurrentDevice(selectedAsset).lastBattery ?? '-' }}%</p>
                  </div>
                </div>
                <div class="flex gap-2 pt-2 border-t border-border/30">
                  <UiButton variant="outline" size="sm" @click="openSwapDialog">
                    <ArrowLeftRight class="w-4 h-4" />
                    Swap Device
                  </UiButton>
                  <UiButton variant="outline" size="sm" @click="handleUnassignDevice" :disabled="isSubmitting">
                    <XCircle class="w-4 h-4" />
                    Unassign
                  </UiButton>
                </div>
              </div>
              <div v-else class="text-center py-6">
                <p class="text-muted-foreground mb-4">No device assigned to this meter</p>
                <UiButton variant="outline" @click="openSwapDialog">
                  <Plus class="w-4 h-4" />
                  Assign Device
                </UiButton>
              </div>
            </div>
          </div>

          <!-- Reading History Preview -->
          <div class="border border-border/50 rounded-xl overflow-hidden">
            <div class="px-4 py-3 bg-muted/30 border-b border-border/50">
              <h3 class="font-semibold">Reading History</h3>
            </div>
            <div class="p-4">
              <ClientOnly>
                <p class="text-sm text-muted-foreground text-center py-8">
                  Navigate to <NuxtLink to="/" class="text-primary hover:underline">Dashboard</NuxtLink> to view live readings.
                </p>
              </ClientOnly>
            </div>
          </div>
        </div>

        <template #footer="{ close }">
          <UiButton variant="outline" @click="close">
            Close
          </UiButton>
          <UiButton @click="() => { showDetailsSheet = false; openEditDialog(selectedAsset) }">
            <Pencil class="w-4 h-4" />
            Edit Meter
          </UiButton>
        </template>
      </UiDialog>

      <!-- Swap Device Dialog -->
      <UiDialog
        v-model="showSwapDialog"
        title="Assign Device"
        description="Select a device to assign to this meter"
        max-width="md"
      >
        <div class="space-y-4">
          <UiSelect
            v-model="swapForm.deviceId"
            label="Select Device"
            :options="deviceOptions"
            placeholder="Choose an available device..."
            required
          />

          <UiInput
            v-model="swapForm.reason"
            label="Reason (optional)"
            placeholder="e.g., Device upgrade, replacement"
          />

          <div v-if="deviceOptions.length === 0" class="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p class="text-sm text-amber-400">
              No devices available in stock. Please add devices first.
            </p>
          </div>
        </div>

        <template #footer="{ close }">
          <UiButton variant="outline" @click="close" :disabled="isSubmitting">
            Cancel
          </UiButton>
          <UiButton 
            @click="handleSwapDevice" 
            :disabled="isSubmitting || !swapForm.deviceId"
          >
            {{ isSubmitting ? 'Assigning...' : 'Assign Device' }}
          </UiButton>
        </template>
      </UiDialog>

      <!-- Delete Confirmation Dialog -->
      <UiDialog
        v-model="showDeleteDialog"
        title="Delete Meter"
        description="Are you sure you want to delete this meter?"
        max-width="sm"
      >
        <div class="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <p class="text-sm text-red-400">
            <strong>Warning:</strong> This will permanently delete the meter and its reading history. Unassign any device before deleting.
          </p>
        </div>

        <template #footer="{ close }">
          <UiButton variant="outline" @click="close" :disabled="isSubmitting">
            Cancel
          </UiButton>
          <UiButton variant="destructive" @click="handleDelete" :disabled="isSubmitting">
            {{ isSubmitting ? 'Deleting...' : 'Delete Meter' }}
          </UiButton>
        </template>
      </UiDialog>
    </div>
  </NuxtLayout>
</template>
