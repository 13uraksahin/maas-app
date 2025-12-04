import type { ApiResponse, PaginatedResponse } from '~/types'

interface ApiError {
  message: string
  statusCode: number
}

/**
 * API Composable
 * 
 * Provides type-safe API calls to the backend
 */
export function useApi() {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBaseUrl

  /**
   * Handle API error response
   */
  async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }))
      throw new Error(error.message || `API Error: ${response.statusText}`)
    }
    return response.json()
  }

  /**
   * Make a GET request
   */
  async function get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${baseUrl}/api${endpoint}`)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value)
        }
      })
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    return handleResponse<T>(response)
  }

  /**
   * Make a POST request
   */
  async function post<T, D = unknown>(endpoint: string, data?: D): Promise<T> {
    const response = await fetch(`${baseUrl}/api${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    })

    return handleResponse<T>(response)
  }

  /**
   * Make a PUT request
   */
  async function put<T, D = unknown>(endpoint: string, data?: D): Promise<T> {
    const response = await fetch(`${baseUrl}/api${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    })

    return handleResponse<T>(response)
  }

  /**
   * Make a PATCH request
   */
  async function patch<T, D = unknown>(endpoint: string, data?: D): Promise<T> {
    const response = await fetch(`${baseUrl}/api${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    })

    return handleResponse<T>(response)
  }

  /**
   * Make a DELETE request
   */
  async function del<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${baseUrl}/api${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    return handleResponse<T>(response)
  }

  // ==========================================================================
  // API Methods
  // ==========================================================================

  return {
    // Generic methods
    get,
    post,
    put,
    patch,
    delete: del,

    // Tenants
    tenants: {
      list: (skip = 0, take = 50) => 
        get<{ success: boolean; data: any[] }>(`/tenants?skip=${skip}&take=${take}`),
      get: (id: string) => 
        get<{ success: boolean; data: any }>(`/tenants/${id}`),
      create: (data: { name: string; parentId?: string }) => 
        post<{ success: boolean; data: any }>('/tenants', data),
      update: (id: string, data: { name?: string }) =>
        patch<{ success: boolean; data: any }>(`/tenants/${id}`, data),
      delete: (id: string) =>
        del<{ success: boolean; message: string }>(`/tenants/${id}`),
      getSubtree: (id: string) => 
        get<{ success: boolean; data: any[] }>(`/tenants/${id}/subtree`),
      getChildren: (id: string) => 
        get<{ success: boolean; data: any[] }>(`/tenants/${id}/children`),
    },

    // Customers
    customers: {
      list: (params?: { tenantId?: string; search?: string; skip?: number; take?: number }) =>
        get<{ success: boolean; customers: any[]; total: number }>('/customers', params as any),
      get: (id: string) =>
        get<{ success: boolean; data: any }>(`/customers/${id}`),
      create: (data: { tenantId: string; name: string; email?: string; phone?: string; address?: string }) =>
        post<{ success: boolean; data: any }>('/customers', data),
      update: (id: string, data: { name?: string; email?: string; phone?: string; address?: string }) =>
        put<{ success: boolean; data: any }>(`/customers/${id}`, data),
      delete: (id: string) =>
        del<{ success: boolean; message: string }>(`/customers/${id}`),
      stats: (tenantId?: string) =>
        get<{ success: boolean; data: { total: number; active: number; inactive: number } }>('/customers/stats', tenantId ? { tenantId } : undefined),
    },

    // Assets
    assets: {
      list: (params?: { tenantId?: string; customerId?: string }) =>
        get<{ success: boolean; data: any[] }>('/assets', params as any),
      get: (id: string) =>
        get<{ success: boolean; data: any }>(`/assets/${id}`),
      create: (data: { tenantId: string; customerId?: string; name: string; latitude?: number; longitude?: number; address?: string }) =>
        post<{ success: boolean; data: any }>('/assets', data),
      update: (id: string, data: { customerId?: string | null; name?: string; latitude?: number; longitude?: number; address?: string }) =>
        put<{ success: boolean; data: any }>(`/assets/${id}`, data),
      delete: (id: string) =>
        del<{ success: boolean; message: string }>(`/assets/${id}`),
      assignDevice: (assetId: string, deviceId: string, notes?: string) =>
        post<{ success: boolean; data: any }>(`/assets/${assetId}/assign-device`, { deviceId, notes }),
      swapDevice: (assetId: string, newDeviceId: string, reason?: string) =>
        post<{ success: boolean; data: any }>(`/assets/${assetId}/swap-device`, { newDeviceId, reason }),
      unassignDevice: (assetId: string, reason?: string) =>
        post<{ success: boolean }>(`/assets/${assetId}/unassign-device`, { reason }),
      stats: (tenantId?: string) =>
        get<{ success: boolean; data: any }>('/assets/stats', tenantId ? { tenantId } : undefined),
    },

    // Devices
    devices: {
      list: (params?: { tenantId?: string; profileId?: string; status?: string }) =>
        get<{ success: boolean; data: any[] }>('/devices', params as any),
      get: (id: string) =>
        get<{ success: boolean; data: any }>(`/devices/${id}`),
      create: (data: { tenantId: string; profileId: string; serialNumber: string; model?: string; firmware?: string }) =>
        post<{ success: boolean; data: any }>('/devices', data),
      update: (id: string, data: { profileId?: string; status?: string; model?: string; firmware?: string }) =>
        put<{ success: boolean; data: any }>(`/devices/${id}`, data),
      delete: (id: string) =>
        del<{ success: boolean; message: string }>(`/devices/${id}`),
      getAvailable: (tenantId?: string) =>
        get<{ success: boolean; data: any[] }>('/devices/available', tenantId ? { tenantId } : undefined),
      stats: (tenantId?: string) =>
        get<{ success: boolean; data: any }>('/devices/stats', tenantId ? { tenantId } : undefined),
    },

    // Device Profiles
    deviceProfiles: {
      list: () =>
        get<{ success: boolean; data: any[] }>('/device-profiles'),
      get: (id: string) =>
        get<{ success: boolean; data: any }>(`/device-profiles/${id}`),
      create: (data: { name: string; manufacturer: string; protocol: string; decoderScript: string; description?: string; samplePayload?: string }) =>
        post<{ success: boolean; data: any }>('/device-profiles', data),
      update: (id: string, data: { name?: string; manufacturer?: string; protocol?: string; decoderScript?: string }) =>
        put<{ success: boolean; data: any }>(`/device-profiles/${id}`, data),
      delete: (id: string) =>
        del<{ success: boolean; message: string }>(`/device-profiles/${id}`),
      test: (data: { script: string; payload: string }) =>
        post<{ success: boolean; data: any; error?: string }>('/device-profiles/test', data),
    },

    // Ingestion status
    ingestion: {
      status: () => get<{ status: string; queue: Record<string, number> }>('/ingestion/status'),
    },

    // Readings
    readings: {
      history: (params?: { assetId?: string; limit?: string }) =>
        get<{ success: boolean; data: any[] }>('/readings/history', params as any),
      getForAsset: (assetId: string, params?: { start?: string; end?: string; limit?: string }) =>
        get<any[]>(`/readings/${assetId}`, params),
      getAggregated: (assetId: string, params: { bucket: string; start: string; end: string }) =>
        get<any[]>(`/readings/${assetId}/aggregated`, params),
    },

    // Alerts
    alerts: {
      list: (status?: string) => {
        const params = status ? { status } : undefined
        return get<any[]>('/alerts', params)
      },
      acknowledge: (id: string) => put<any>(`/alerts/${id}/acknowledge`),
      resolve: (id: string) => put<any>(`/alerts/${id}/resolve`),
    },
  }
}

