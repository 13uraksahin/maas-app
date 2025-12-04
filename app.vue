<script setup lang="ts">
// Initialize socket connection on app mount
const { isConnected, connectionError } = useSocket({
  autoConnect: true,
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

