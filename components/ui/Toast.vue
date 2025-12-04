<script setup lang="ts">
import { X, CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-vue-next'

const { toasts, dismiss } = useToast()

const icons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const styles = {
  success: 'border-green-500/50 bg-green-500/10 text-green-400',
  error: 'border-red-500/50 bg-red-500/10 text-red-400',
  warning: 'border-amber-500/50 bg-amber-500/10 text-amber-400',
  info: 'border-blue-500/50 bg-blue-500/10 text-blue-400',
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <TransitionGroup
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="translate-x-full opacity-0"
        enter-to-class="translate-x-0 opacity-100"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="translate-x-0 opacity-100"
        leave-to-class="translate-x-full opacity-0"
      >
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto rounded-xl border p-4 shadow-lg backdrop-blur-sm"
          :class="styles[toast.type]"
        >
          <div class="flex items-start gap-3">
            <component 
              :is="icons[toast.type]" 
              class="w-5 h-5 shrink-0 mt-0.5"
            />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-foreground">{{ toast.title }}</p>
              <p v-if="toast.message" class="text-sm text-muted-foreground mt-1">
                {{ toast.message }}
              </p>
            </div>
            <button
              @click="dismiss(toast.id)"
              class="shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

