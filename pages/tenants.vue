<script setup lang="ts">
import { Building2, Plus, Pencil, Trash2, ChevronRight } from 'lucide-vue-next'

const api = useApi()
const toast = useToast()

// State
const loading = ref(true)
const tenants = ref<any[]>([])
const showCreateDialog = ref(false)
const showDeleteDialog = ref(false)
const selectedTenant = ref<any>(null)

// Form state
const form = reactive({
  name: '',
  parentId: '',
})
const formErrors = reactive({
  name: '',
})
const isSubmitting = ref(false)

// Table columns
const columns = [
  { key: 'name', label: 'Name' },
  { key: 'path', label: 'Path' },
  { key: 'parent.name', label: 'Parent' },
  { key: '_count.customers', label: 'Customers' },
  { key: '_count.assets', label: 'Assets' },
  { key: '_count.devices', label: 'Devices' },
]

// Computed options for parent select
const parentOptions = computed(() => [
  { value: '', label: 'No Parent (Root Tenant)' },
  ...tenants.value.map(t => ({ value: t.id, label: t.name })),
])

// Fetch tenants
async function fetchTenants() {
  loading.value = true
  try {
    const response = await api.tenants.list()
    tenants.value = response.data || []
  } catch (error: any) {
    toast.error('Failed to load tenants', error.message)
  } finally {
    loading.value = false
  }
}

// Reset form
function resetForm() {
  form.name = ''
  form.parentId = ''
  formErrors.name = ''
  selectedTenant.value = null
}

// Validate form
function validateForm(): boolean {
  let valid = true
  formErrors.name = ''

  if (!form.name.trim()) {
    formErrors.name = 'Name is required'
    valid = false
  } else if (form.name.trim().length < 2) {
    formErrors.name = 'Name must be at least 2 characters'
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
function openEditDialog(tenant: any) {
  selectedTenant.value = tenant
  form.name = tenant.name
  form.parentId = tenant.parentId || ''
  showCreateDialog.value = true
}

// Open delete dialog
function openDeleteDialog(tenant: any) {
  selectedTenant.value = tenant
  showDeleteDialog.value = true
}

// Create or update tenant
async function handleSubmit() {
  if (!validateForm()) return

  isSubmitting.value = true
  try {
    if (selectedTenant.value) {
      // Update
      await api.tenants.update(selectedTenant.value.id, { name: form.name })
      toast.success('Tenant updated successfully')
    } else {
      // Create
      await api.tenants.create({
        name: form.name,
        parentId: form.parentId || undefined,
      })
      toast.success('Tenant created successfully')
    }
    showCreateDialog.value = false
    resetForm()
    await fetchTenants()
  } catch (error: any) {
    toast.error('Failed to save tenant', error.message)
  } finally {
    isSubmitting.value = false
  }
}

// Delete tenant
async function handleDelete() {
  if (!selectedTenant.value) return

  isSubmitting.value = true
  try {
    await api.tenants.delete(selectedTenant.value.id)
    toast.success('Tenant deleted successfully')
    showDeleteDialog.value = false
    selectedTenant.value = null
    await fetchTenants()
  } catch (error: any) {
    toast.error('Failed to delete tenant', error.message)
  } finally {
    isSubmitting.value = false
  }
}

// Initialize
onMounted(() => {
  fetchTenants()
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
              <Building2 class="w-6 h-6" />
            </div>
            Tenants
          </h1>
          <p class="text-muted-foreground mt-1">
            Manage your organizational hierarchy
          </p>
        </div>
        <UiButton @click="openCreateDialog">
          <Plus class="w-4 h-4" />
          Add Tenant
        </UiButton>
      </div>

      <!-- Data Table -->
      <UiDataTable
        :columns="columns"
        :data="tenants"
        :loading="loading"
        search-placeholder="Search tenants..."
        empty-message="No tenants found. Create your first tenant to get started."
        @search="(q) => console.log('search', q)"
      >
        <template #cell-name="{ item }">
          <div class="font-medium">{{ item.name }}</div>
        </template>

        <template #cell-path="{ item }">
          <div class="flex items-center gap-1 text-xs text-muted-foreground font-mono">
            <template v-for="(segment, i) in item.path.split('.')" :key="i">
              <ChevronRight v-if="i > 0" class="w-3 h-3" />
              <span>{{ segment }}</span>
            </template>
          </div>
        </template>

        <template #cell-parent.name="{ item }">
          <span v-if="item.parent" class="text-sm">{{ item.parent.name }}</span>
          <span v-else class="text-sm text-muted-foreground">Root</span>
        </template>

        <template #cell-_count.customers="{ item }">
          <UiBadge variant="outline">{{ item._count?.customers || 0 }}</UiBadge>
        </template>

        <template #cell-_count.assets="{ item }">
          <UiBadge variant="outline">{{ item._count?.assets || 0 }}</UiBadge>
        </template>

        <template #cell-_count.devices="{ item }">
          <UiBadge variant="outline">{{ item._count?.devices || 0 }}</UiBadge>
        </template>

        <template #actions="{ item }">
          <div class="flex items-center gap-2" @click.stop>
            <button
              class="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
              @click="openEditDialog(item)"
            >
              <Pencil class="w-4 h-4" />
            </button>
            <button
              class="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
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
        :title="selectedTenant ? 'Edit Tenant' : 'Create Tenant'"
        :description="selectedTenant ? 'Update tenant information' : 'Add a new organizational unit'"
      >
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <UiInput
            v-model="form.name"
            label="Name"
            placeholder="Enter tenant name"
            :error="formErrors.name"
            required
          />

          <UiSelect
            v-if="!selectedTenant"
            v-model="form.parentId"
            label="Parent Tenant"
            :options="parentOptions"
            placeholder="Select parent (optional)"
          />

          <div v-if="selectedTenant" class="p-3 rounded-lg bg-muted/30 text-sm text-muted-foreground">
            <strong>Note:</strong> Moving tenants to different parents is not supported yet.
          </div>
        </form>

        <template #footer="{ close }">
          <UiButton variant="outline" @click="close" :disabled="isSubmitting">
            Cancel
          </UiButton>
          <UiButton @click="handleSubmit" :disabled="isSubmitting">
            {{ isSubmitting ? 'Saving...' : (selectedTenant ? 'Update' : 'Create') }}
          </UiButton>
        </template>
      </UiDialog>

      <!-- Delete Confirmation Dialog -->
      <UiDialog
        v-model="showDeleteDialog"
        title="Delete Tenant"
        description="Are you sure you want to delete this tenant?"
        max-width="sm"
      >
        <div class="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <p class="text-sm text-red-400">
            <strong>Warning:</strong> This action cannot be undone. Make sure the tenant has no children, customers, or assets before deleting.
          </p>
        </div>

        <template #footer="{ close }">
          <UiButton variant="outline" @click="close" :disabled="isSubmitting">
            Cancel
          </UiButton>
          <UiButton variant="destructive" @click="handleDelete" :disabled="isSubmitting">
            {{ isSubmitting ? 'Deleting...' : 'Delete Tenant' }}
          </UiButton>
        </template>
      </UiDialog>
    </div>
  </NuxtLayout>
</template>
