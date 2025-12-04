<script setup lang="ts">
import { cn } from '~/lib/utils'

interface Props {
  class?: string
  variant?: 'default' | 'glass'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
})
</script>

<template>
  <div
    :class="cn(
      'rounded-xl border transition-all duration-200',
      variant === 'glass' 
        ? 'glass-card' 
        : 'bg-card border-border',
      props.class
    )"
  >
    <slot />
  </div>
</template>

