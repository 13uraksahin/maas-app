import { io, Socket } from 'socket.io-client'

/**
 * Socket.io Composable
 * 
 * Provides real-time connection to the backend for:
 * - Meter readings
 * - Alerts
 * - Device status updates
 * 
 * Features:
 * - Auto-reconnection
 * - Tenant-based room subscription
 * - Connection state management
 */

interface UseSocketOptions {
  namespace?: string
  tenantId?: string
  autoConnect?: boolean
}

interface SocketState {
  socket: Socket | null
  isConnected: boolean
  connectionError: string | null
  reconnectAttempts: number
}

// Global socket instance (singleton)
let socketInstance: Socket | null = null

export function useSocket(options: UseSocketOptions = {}) {
  const config = useRuntimeConfig()
  const { namespace = '/readings', tenantId, autoConnect = true } = options

  // Reactive state
  const state = reactive<SocketState>({
    socket: null,
    isConnected: false,
    connectionError: null,
    reconnectAttempts: 0,
  })

  /**
   * Initialize socket connection
   */
  function connect(): Socket {
    if (socketInstance?.connected) {
      state.socket = socketInstance
      state.isConnected = true
      return socketInstance
    }

    const url = `${config.public.socketUrl}${namespace}`
    
    socketInstance = io(url, {
      transports: ['websocket', 'polling'],
      autoConnect,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      query: tenantId ? { tenantId } : undefined,
    })

    // Connection events
    socketInstance.on('connect', () => {
      state.isConnected = true
      state.connectionError = null
      state.reconnectAttempts = 0
      console.log('🔌 Socket connected:', socketInstance?.id)
      
      // Auto-subscribe to tenant if provided
      if (tenantId) {
        subscribeTenant(tenantId)
      }
    })

    socketInstance.on('disconnect', (reason) => {
      state.isConnected = false
      console.log('🔌 Socket disconnected:', reason)
    })

    socketInstance.on('connect_error', (error) => {
      state.connectionError = error.message
      console.error('🔌 Socket connection error:', error.message)
    })

    socketInstance.on('reconnect_attempt', (attempt) => {
      state.reconnectAttempts = attempt
      console.log('🔌 Reconnect attempt:', attempt)
    })

    socketInstance.on('reconnect', () => {
      state.isConnected = true
      state.connectionError = null
      console.log('🔌 Socket reconnected')
    })

    state.socket = socketInstance
    return socketInstance
  }

  /**
   * Disconnect socket
   */
  function disconnect(): void {
    if (socketInstance) {
      socketInstance.disconnect()
      state.isConnected = false
      state.socket = null
    }
  }

  /**
   * Subscribe to tenant room
   */
  function subscribeTenant(tId: string): Promise<{ success: boolean; room: string }> {
    return new Promise((resolve, reject) => {
      if (!socketInstance) {
        reject(new Error('Socket not connected'))
        return
      }

      socketInstance.emit('subscribe:tenant', { tenantId: tId }, (response: { success: boolean; room: string }) => {
        if (response.success) {
          console.log('📬 Subscribed to tenant room:', response.room)
          resolve(response)
        } else {
          reject(new Error('Failed to subscribe to tenant'))
        }
      })
    })
  }

  /**
   * Subscribe to specific asset updates
   */
  function subscribeAsset(assetId: string): Promise<{ success: boolean; room: string }> {
    return new Promise((resolve, reject) => {
      if (!socketInstance) {
        reject(new Error('Socket not connected'))
        return
      }

      socketInstance.emit('subscribe:asset', { assetId }, (response: { success: boolean; room: string }) => {
        if (response.success) {
          console.log('📬 Subscribed to asset:', response.room)
          resolve(response)
        } else {
          reject(new Error('Failed to subscribe to asset'))
        }
      })
    })
  }

  /**
   * Unsubscribe from asset updates
   */
  function unsubscribeAsset(assetId: string): void {
    if (socketInstance) {
      socketInstance.emit('unsubscribe:asset', { assetId })
    }
  }

  /**
   * Listen to an event
   */
  function on<T = unknown>(event: string, callback: (data: T) => void): void {
    if (socketInstance) {
      socketInstance.on(event, callback)
    }
  }

  /**
   * Remove event listener
   */
  function off(event: string, callback?: (...args: unknown[]) => void): void {
    if (socketInstance) {
      socketInstance.off(event, callback)
    }
  }

  /**
   * Emit an event
   */
  function emit(event: string, data: unknown): void {
    if (socketInstance) {
      socketInstance.emit(event, data)
    }
  }

  // Auto-connect on mount if in browser
  if (import.meta.client && autoConnect) {
    onMounted(() => {
      connect()
    })
  }

  // Cleanup on unmount
  onUnmounted(() => {
    // Don't disconnect - keep connection alive for other components
    // disconnect()
  })

  return {
    // State
    socket: computed(() => state.socket),
    isConnected: computed(() => state.isConnected),
    connectionError: computed(() => state.connectionError),
    reconnectAttempts: computed(() => state.reconnectAttempts),
    
    // Methods
    connect,
    disconnect,
    subscribeTenant,
    subscribeAsset,
    unsubscribeAsset,
    on,
    off,
    emit,
  }
}

// Export types
export type { UseSocketOptions, SocketState }

