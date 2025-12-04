<script setup lang="ts">
import { Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-vue-next'

interface Column {
  key: string
  label: string
  sortable?: boolean
  class?: string
}

interface Props {
  columns: Column[]
  data: any[]
  loading?: boolean
  searchable?: boolean
  searchPlaceholder?: string
  emptyMessage?: string
  // Pagination
  totalItems?: number
  currentPage?: number
  pageSize?: number
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  searchable: true,
  searchPlaceholder: 'Search...',
  emptyMessage: 'No data found',
  totalItems: 0,
  currentPage: 1,
  pageSize: 10,
})

const emit = defineEmits<{
  search: [query: string]
  pageChange: [page: number]
  rowClick: [item: any]
}>()

const searchQuery = ref('')

// Debounced search
let searchTimeout: ReturnType<typeof setTimeout>
function handleSearch(value: string) {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    emit('search', value)
  }, 300)
}

// Pagination computed
const totalPages = computed(() => Math.ceil(props.totalItems / props.pageSize) || 1)

function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value && page !== props.currentPage) {
    emit('pageChange', page)
  }
}

// Get cell value by key (supports nested keys like 'tenant.name')
function getCellValue(item: any, key: string) {
  return key.split('.').reduce((obj, k) => obj?.[k], item)
}
</script>

<template>
  <div class="space-y-4">
    <!-- Search -->
    <div v-if="searchable" class="relative">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="searchPlaceholder"
        class="w-full pl-10 pr-4 py-2 rounded-xl bg-muted/30 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
        @input="handleSearch(searchQuery)"
      />
    </div>

    <!-- Table -->
    <div class="rounded-xl border border-border/50 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-border/50 bg-muted/30">
              <th
                v-for="column in columns"
                :key="column.key"
                class="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                :class="column.class"
              >
                {{ column.label }}
              </th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            <!-- Loading state -->
            <tr v-if="loading">
              <td :colspan="columns.length + 1" class="px-4 py-12 text-center">
                <Loader2 class="w-8 h-8 animate-spin mx-auto text-primary" />
                <p class="text-sm text-muted-foreground mt-2">Loading...</p>
              </td>
            </tr>

            <!-- Empty state -->
            <tr v-else-if="data.length === 0">
              <td :colspan="columns.length + 1" class="px-4 py-12 text-center">
                <p class="text-sm text-muted-foreground">{{ emptyMessage }}</p>
              </td>
            </tr>

            <!-- Data rows -->
            <tr
              v-else
              v-for="(item, index) in data"
              :key="item.id || index"
              class="border-b border-border/30 hover:bg-muted/20 transition-colors cursor-pointer"
              @click="emit('rowClick', item)"
            >
              <td
                v-for="column in columns"
                :key="column.key"
                class="px-4 py-3 text-sm"
                :class="column.class"
              >
                <slot :name="`cell-${column.key}`" :item="item" :value="getCellValue(item, column.key)">
                  {{ getCellValue(item, column.key) ?? '-' }}
                </slot>
              </td>
              <td class="px-4 py-3 text-right">
                <slot name="actions" :item="item" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalItems > pageSize" class="flex items-center justify-between">
      <p class="text-sm text-muted-foreground">
        Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ Math.min(currentPage * pageSize, totalItems) }} of {{ totalItems }} entries
      </p>
      <div class="flex items-center gap-2">
        <button
          class="p-2 rounded-lg hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="currentPage === 1"
          @click="goToPage(currentPage - 1)"
        >
          <ChevronLeft class="w-4 h-4" />
        </button>
        <span class="text-sm px-3">
          Page {{ currentPage }} of {{ totalPages }}
        </span>
        <button
          class="p-2 rounded-lg hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="currentPage === totalPages"
          @click="goToPage(currentPage + 1)"
        >
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

