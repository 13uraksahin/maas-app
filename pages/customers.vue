<script setup lang="ts">
import { Users, Plus, Pencil, Trash2, Mail, Phone, MapPin } from 'lucide-vue-next'

const api = useApi()
const toast = useToast()

// State
const loading = ref(true)
const customers = ref<any[]>([])
const tenants = ref<any[]>([])
const totalItems = ref(0)
const currentPage = ref(1)
const pageSize = 10
const showCreateDialog = ref(false)
const showDeleteDialog = ref(false)
const selectedCustomer = ref<any>(null)

// Form state
const form = reactive({
  tenantId: '',
  name: '',
  email: '',
  phone: '',
  address: '',
})
const formErrors = reactive({
  tenantId: '',
  name: '',
  email: '',
})
const isSubmitting = ref(false)

// Table columns
const columns = [
  { key: 'name', label: 'Name' },
  { key: 'tenant.name', label: 'Tenant' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: '_count.assets', label: 'Assets' },
]

// Computed tenant options
const tenantOptions = computed(() => 
  tenants.value.map(t => ({ value: t.id, label: t.name }))
)

// Fetch tenants for dropdown
async function fetchTenants() {
  try {
    const response = await api.tenants.list()
    tenants.value = response.data || []
  } catch (error: any) {
    toast.error('Failed to load tenants', error.message)
  }
}

// Fetch customers
async function fetchCustomers(search?: string) {
  loading.value = true
  try {
    const response = await api.customers.list({
      skip: ((currentPage.value - 1) * pageSize).toString(),
      take: pageSize.toString(),
      search,
    } as any)
    customers.value = response.customers || []
    totalItems.value = response.total || 0
  } catch (error: any) {
    toast.error('Failed to load customers', error.message)
  } finally {
    loading.value = false
  }
}

// Reset form
function resetForm() {
  form.tenantId = ''
  form.name = ''
  form.email = ''
  form.phone = ''
  form.address = ''
  formErrors.tenantId = ''
  formErrors.name = ''
  formErrors.email = ''
  selectedCustomer.value = null
}

// Validate form
function validateForm(): boolean {
  let valid = true
  formErrors.tenantId = ''
  formErrors.name = ''
  formErrors.email = ''

  if (!selectedCustomer.value && !form.tenantId) {
    formErrors.tenantId = 'Tenant is required'
    valid = false
  }

  if (!form.name.trim()) {
    formErrors.name = 'Name is required'
    valid = false
  } else if (form.name.trim().length < 2) {
    formErrors.name = 'Name must be at least 2 characters'
    valid = false
  }

  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    formErrors.email = 'Invalid email format'
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
function openEditDialog(customer: any) {
  selectedCustomer.value = customer
  form.tenantId = customer.tenantId
  form.name = customer.name
  form.email = customer.email || ''
  form.phone = customer.phone || ''
  form.address = customer.address || ''
  showCreateDialog.value = true
}

// Open delete dialog
function openDeleteDialog(customer: any) {
  selectedCustomer.value = customer
  showDeleteDialog.value = true
}

// Create or update customer
async function handleSubmit() {
  if (!validateForm()) return

  isSubmitting.value = true
  try {
    if (selectedCustomer.value) {
      // Update
      await api.customers.update(selectedCustomer.value.id, {
        name: form.name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
      })
      toast.success('Customer updated successfully')
    } else {
      // Create
      await api.customers.create({
        tenantId: form.tenantId,
        name: form.name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
      })
      toast.success('Customer created successfully')
    }
    showCreateDialog.value = false
    resetForm()
    await fetchCustomers()
  } catch (error: any) {
    toast.error('Failed to save customer', error.message)
  } finally {
    isSubmitting.value = false
  }
}

// Delete customer
async function handleDelete() {
  if (!selectedCustomer.value) return

  isSubmitting.value = true
  try {
    await api.customers.delete(selectedCustomer.value.id)
    toast.success('Customer deleted successfully')
    showDeleteDialog.value = false
    selectedCustomer.value = null
    await fetchCustomers()
  } catch (error: any) {
    toast.error('Failed to delete customer', error.message)
  } finally {
    isSubmitting.value = false
  }
}

// Handle search
function handleSearch(query: string) {
  currentPage.value = 1
  fetchCustomers(query)
}

// Handle page change
function handlePageChange(page: number) {
  currentPage.value = page
  fetchCustomers()
}

// Initialize
onMounted(async () => {
  await Promise.all([fetchTenants(), fetchCustomers()])
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
              <Users class="w-6 h-6" />
            </div>
            Customers
          </h1>
          <p class="text-muted-foreground mt-1">
            Manage your customers and their service subscriptions
          </p>
        </div>
        <UiButton @click="openCreateDialog">
          <Plus class="w-4 h-4" />
          Add Customer
        </UiButton>
      </div>

      <!-- Data Table -->
      <UiDataTable
        :columns="columns"
        :data="customers"
        :loading="loading"
        :total-items="totalItems"
        :current-page="currentPage"
        :page-size="pageSize"
        search-placeholder="Search customers..."
        empty-message="No customers found. Create your first customer to get started."
        @search="handleSearch"
        @page-change="handlePageChange"
      >
        <template #cell-name="{ item }">
          <div class="font-medium">{{ item.name }}</div>
        </template>

        <template #cell-tenant.name="{ item }">
          <UiBadge variant="outline">{{ item.tenant?.name || '-' }}</UiBadge>
        </template>

        <template #cell-email="{ item }">
          <div v-if="item.email" class="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail class="w-3 h-3" />
            {{ item.email }}
          </div>
          <span v-else class="text-muted-foreground">-</span>
        </template>

        <template #cell-phone="{ item }">
          <div v-if="item.phone" class="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone class="w-3 h-3" />
            {{ item.phone }}
          </div>
          <span v-else class="text-muted-foreground">-</span>
        </template>

        <template #cell-_count.assets="{ item }">
          <UiBadge variant="outline">{{ item._count?.assets || 0 }} meters</UiBadge>
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
        :title="selectedCustomer ? 'Edit Customer' : 'Create Customer'"
        :description="selectedCustomer ? 'Update customer information' : 'Add a new customer to manage their meters'"
        max-width="lg"
      >
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <UiSelect
            v-if="!selectedCustomer"
            v-model="form.tenantId"
            label="Tenant"
            :options="tenantOptions"
            placeholder="Select tenant"
            :error="formErrors.tenantId"
            required
          />

          <div v-if="selectedCustomer" class="p-3 rounded-lg bg-muted/30">
            <p class="text-sm text-muted-foreground">
              <strong>Tenant:</strong> {{ selectedCustomer.tenant?.name }}
            </p>
          </div>

          <UiInput
            v-model="form.name"
            label="Name"
            placeholder="Enter customer name"
            :error="formErrors.name"
            required
          />

          <div class="grid grid-cols-2 gap-4">
            <UiInput
              v-model="form.email"
              label="Email"
              type="email"
              placeholder="customer@example.com"
              :error="formErrors.email"
            />

            <UiInput
              v-model="form.phone"
              label="Phone"
              type="tel"
              placeholder="+1 234 567 890"
            />
          </div>

          <UiInput
            v-model="form.address"
            label="Address"
            placeholder="Enter address"
          />
        </form>

        <template #footer="{ close }">
          <UiButton variant="outline" @click="close" :disabled="isSubmitting">
            Cancel
          </UiButton>
          <UiButton @click="handleSubmit" :disabled="isSubmitting">
            {{ isSubmitting ? 'Saving...' : (selectedCustomer ? 'Update' : 'Create') }}
          </UiButton>
        </template>
      </UiDialog>

      <!-- Delete Confirmation Dialog -->
      <UiDialog
        v-model="showDeleteDialog"
        title="Delete Customer"
        description="Are you sure you want to delete this customer?"
        max-width="sm"
      >
        <div class="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <p class="text-sm text-red-400">
            <strong>Warning:</strong> This action cannot be undone. Make sure the customer has no linked assets before deleting.
          </p>
        </div>

        <template #footer="{ close }">
          <UiButton variant="outline" @click="close" :disabled="isSubmitting">
            Cancel
          </UiButton>
          <UiButton variant="destructive" @click="handleDelete" :disabled="isSubmitting">
            {{ isSubmitting ? 'Deleting...' : 'Delete Customer' }}
          </UiButton>
        </template>
      </UiDialog>
    </div>
  </NuxtLayout>
</template>

