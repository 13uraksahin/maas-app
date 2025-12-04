import type { ApiResponse, PaginatedResponse } from '~/types'

/**
 * API Composable
 * 
 * Provides type-safe API calls to the backend
 */
export function useApi() {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBaseUrl

  /**
   * Make a GET request
   */
  async function get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${baseUrl}/api${endpoint}`)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value)
      })
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }

    return response.json()
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

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }

    return response.json()
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

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }

    return response.json()
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

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }

    return response.json()
  }

  // ==========================================================================
  // API Methods
  // ==========================================================================

  return {
    // Generic methods
    get,
    post,
    put,
    delete: del,

    // Tenants
    tenants: {
      list: (skip = 0, take = 50) => 
        get<PaginatedResponse<import('~/types').Tenant>>(`/tenants?skip=${skip}&take=${take}`),
      get: (id: string) => 
        get<import('~/types').Tenant>(`/tenants/${id}`),
      create: (data: { name: string; parentId?: string }) => 
        post<import('~/types').Tenant>('/tenants', data),
      getSubtree: (id: string) => 
        get<import('~/types').Tenant[]>(`/tenants/${id}/subtree`),
      getChildren: (id: string) => 
        get<import('~/types').Tenant[]>(`/tenants/${id}/children`),
    },

    // Ingestion status
    ingestion: {
      status: () => get<{ status: string; queue: Record<string, number> }>('/ingestion/status'),
    },

    // Assets
    assets: {
      list: (tenantId?: string) => {
        const params = tenantId ? { tenantId } : undefined
        return get<import('~/types').Asset[]>('/assets', params)
      },
      get: (id: string) => get<import('~/types').Asset>(`/assets/${id}`),
    },

    // Readings
    readings: {
      getForAsset: (assetId: string, params?: { start?: string; end?: string; limit?: string }) =>
        get<import('~/types').Reading[]>(`/readings/${assetId}`, params),
      getAggregated: (assetId: string, params: { bucket: string; start: string; end: string }) =>
        get<import('~/types').AggregatedReading[]>(`/readings/${assetId}/aggregated`, params),
    },

    // Alerts
    alerts: {
      list: (status?: string) => {
        const params = status ? { status } : undefined
        return get<import('~/types').Alert[]>('/alerts', params)
      },
      acknowledge: (id: string) => put<import('~/types').Alert>(`/alerts/${id}/acknowledge`),
      resolve: (id: string) => put<import('~/types').Alert>(`/alerts/${id}/resolve`),
    },
  }
}

