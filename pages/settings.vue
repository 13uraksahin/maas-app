<script setup lang="ts">
import { Settings } from 'lucide-vue-next'

definePageMeta({
  title: 'Settings',
})
</script>

<template>
  <div class="space-y-8">
    <div class="flex items-center gap-4">
      <div class="p-3 rounded-xl bg-primary/10">
        <Settings class="w-8 h-8 text-primary" />
      </div>
      <div>
        <h1 class="text-3xl font-bold text-gradient">Settings</h1>
        <p class="text-muted-foreground mt-1">
          Configure system preferences and integrations
        </p>
      </div>
    </div>

    <div class="glass-card p-12 text-center">
      <Settings class="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
      <h2 class="text-xl font-semibold mb-2">System Settings</h2>
      <p class="text-muted-foreground max-w-md mx-auto">
        This page will contain system configuration options including alert thresholds, 
        notification preferences, API keys, and integration settings.
      </p>
    </div>
  </div>
</template>

