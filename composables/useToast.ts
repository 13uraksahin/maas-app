/**
 * Toast Notification Composable
 * 
 * A simple toast system without external dependencies
 */

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

const toasts = ref<Toast[]>([])

export function useToast() {
  function show(toast: Omit<Toast, 'id'>) {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const duration = toast.duration ?? 4000

    toasts.value.push({ ...toast, id })

    if (duration > 0) {
      setTimeout(() => {
        dismiss(id)
      }, duration)
    }

    return id
  }

  function success(title: string, message?: string) {
    return show({ type: 'success', title, message })
  }

  function error(title: string, message?: string) {
    return show({ type: 'error', title, message, duration: 6000 })
  }

  function warning(title: string, message?: string) {
    return show({ type: 'warning', title, message })
  }

  function info(title: string, message?: string) {
    return show({ type: 'info', title, message })
  }

  function dismiss(id: string) {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }

  function dismissAll() {
    toasts.value = []
  }

  return {
    toasts: readonly(toasts),
    show,
    success,
    error,
    warning,
    info,
    dismiss,
    dismissAll,
  }
}

