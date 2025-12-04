<script setup lang="ts">
import { Bell } from 'lucide-vue-next'

definePageMeta({
  title: 'Alerts',
})
</script>

<template>
  <div class="space-y-8">
    <div class="flex items-center gap-4">
      <div class="p-3 rounded-xl bg-yellow-500/10">
        <Bell class="w-8 h-8 text-yellow-500" />
      </div>
      <div>
        <h1 class="text-3xl font-bold text-gradient">Alerts</h1>
        <p class="text-muted-foreground mt-1">
          Monitor and manage system alerts and notifications
        </p>
      </div>
    </div>

    <div class="glass-card p-12 text-center">
      <Bell class="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
      <h2 class="text-xl font-semibold mb-2">Alert Center</h2>
      <p class="text-muted-foreground max-w-md mx-auto">
        This page will display active alerts including leak detection, high consumption warnings, 
        low battery notifications, and device offline status.
      </p>
    </div>
  </div>
</template>

