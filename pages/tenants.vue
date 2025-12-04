<script setup lang="ts">
import { Building2 } from 'lucide-vue-next'

definePageMeta({
  title: 'Tenants',
})
</script>

<template>
  <div class="space-y-8">
    <div class="flex items-center gap-4">
      <div class="p-3 rounded-xl bg-primary/10">
        <Building2 class="w-8 h-8 text-primary" />
      </div>
      <div>
        <h1 class="text-3xl font-bold text-gradient">Tenants</h1>
        <p class="text-muted-foreground mt-1">
          Manage hierarchical tenant organizations
        </p>
      </div>
    </div>

    <div class="glass-card p-12 text-center">
      <Building2 class="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
      <h2 class="text-xl font-semibold mb-2">Tenant Management</h2>
      <p class="text-muted-foreground max-w-md mx-auto">
        This page will display the hierarchical tenant tree structure with ltree-based navigation. 
        Create, edit, and manage tenant organizations here.
      </p>
    </div>
  </div>
</template>

