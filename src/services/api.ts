// API Service with token management

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

interface ApiResponse<T> {
  success?: boolean;
  status?: boolean;
  data?: T;
  message?: string;
  error?: string;
  pdf?: any;
}

// Domain-specific types
export interface PaginatedResponse<T> {
  items: boolean;
  total: number;
  page: number;
  pageSize: number;
  data: T[];
}

export interface Cliente {
  id: number;
  email?: string;
  client_name?: string;
  company_name?: string;
  phone_number?: string;
  nombre?: string;
  name?: string;
  telefono?: string;
  direccion?: string;
  rnc?: string;
}

export interface Factura {
  id: number;
  date: string;
  code?: string;
  client: string;
  description?: string;
  amount: string | number;
  items?: Array<{ description: string; amount: number; quantity: number }>;
}

export interface Cotizacion {
  id: number;
  code: string;
  date: string;
  client_id: number;
  client_name: string;
  total: string;
  description?: string;
  items?: Array<{
    id: number;
    description: string;
    amount: string;
    quantity: number;
    subtotal: string;
  }>;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    return localStorage.getItem("authToken");
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { skipAuth = false, ...fetchOptions } = options;

    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((fetchOptions.headers as Record<string, string>) || {}),
    };

    // Add token if not skipped and token exists
    if (!skipAuth) {
      const token = this.getToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      // Handle 401 Unauthorized - token might be expired
      if (response.status === 401 && !skipAuth) {
        console.error(`❌ 401 Unauthorized on ${endpoint} - Token expired or invalid`);
        // Clear auth data and redirect to login
        // localStorage.removeItem("authToken");
        // localStorage.removeItem("authUser");
        // window.location.href = "/auth/signin";
        throw new Error("Unauthorized. Please login again.");
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || `HTTP Error: ${response.status}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // GET request
  async get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "GET",
    });
  }

  // POST request
  async post<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // PUT request
  async put<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // PATCH request
  async patch<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "DELETE",
    });
  }
}

// Create and export singleton instance
export const apiClient = new ApiService(API_BASE_URL);

// Export the interface for type usage
export type { ApiResponse };
export type { RequestOptions };

// Auth-specific API calls
export const authApi = {
  login: (emailOrUsername: string, password: string) =>
    apiClient.post("/api/auth/login", { emailOrUsername, password }, { skipAuth: true }),

  register: (email: string, password: string, name: string, username: string, phoneNumber: string) =>
    apiClient.post(
      "/api/auth/register",
      { email, password, name, username, phoneNumber },
      { skipAuth: true }
    ),

  exchangeToken: (tempToken: string) =>
    apiClient.post(
      "/api/auth/exchange-token",
      { tempToken },
      { skipAuth: true }
    ),

  refreshToken: (refreshToken: string) =>
    apiClient.post(
      "/api/auth/refresh",
      { refreshToken },
      { skipAuth: true }
    ),

  logout: () => apiClient.post("/api/auth/signout", {}),
};

// Facturas-specific API calls
export const facturasApi = {
  // Get all facturas with optional search/pagination
  getFacturas: (params?: { query?: string; page?: number; pageSize?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.query) queryParams.append('query', params.query);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    return apiClient.get<PaginatedResponse<Factura>>(`/api/facturas?${queryParams.toString()}`);
  },

  // Get factura PDF
  getFacturaPdf: (id: number) => {
    const token = localStorage.getItem("authToken");
    const url = `${apiClient['baseUrl']}/api/facturas/${id}/pdf?format=base64`;
    return fetch(url, {
      method: 'GET',
      headers: {
        'X-API-KEY': token || '',
      },
    }).then(res => res.json());
  },

  // Create a new factura
  createFactura: (data: {
    date: string;
    client: string;
    client_id?: number;
    items: Array<{ description: string; amount: number; quantity: number }>;
    ncf?: string;
  }) =>
    apiClient.post<Factura>("/api/facturas", data),

  // Get factura by ID
  getFacturaById: (id: number) =>
    apiClient.get<Factura>(`/api/facturas/${id}`),

  // Update factura
  updateFactura: (id: number, data: unknown) =>
    apiClient.put<Factura>(`/api/facturas/${id}`, data),

  // Delete factura
  deleteFactura: (id: number) =>
    apiClient.delete<void>(`/api/facturas/${id}`),
};

// Clientes-specific API calls
export const clientesApi = {
  // Get all clientes with optional search/pagination
  getClientes: (params?: { query?: string; page?: number; pageSize?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.query) queryParams.append('query', params.query);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    return apiClient.get<PaginatedResponse<Cliente>>(`/api/clients?${queryParams.toString()}`);
  },

  // Create a new cliente
  createCliente: (data: unknown) =>
    apiClient.post<Cliente>("/api/clients", data),

  // Get cliente by ID
  getClienteById: (id: number) =>
    apiClient.get<Cliente>(`/api/clients?id=${id}`),

  // Update cliente
  updateCliente: (id: number, data: unknown) =>
    apiClient.put<Cliente>(`/api/clients/${id}`, data),

  // Delete cliente
  deleteCliente: (id: number) =>
    apiClient.delete<void>(`/api/clients/${id}`),
};

// Cotizaciones-specific API calls
export const cotizacionesApi = {
  // Get all cotizaciones with optional search/pagination
  getCotizaciones: (params?: { query?: string; page?: number; pageSize?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.query) queryParams.append('query', params.query);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    return apiClient.get<PaginatedResponse<Cotizacion>>(`/api/cotizaciones?${queryParams.toString()}`);
  },

  // Get cotizacion PDF
  getCotizacionPdf: (id: number) => {
    const token = localStorage.getItem("authToken");
    const url = `${apiClient['baseUrl']}/api/cotizaciones/${id}/pdf?format=base64`;
    return fetch(url, {
      method: 'GET',
      headers: {
        'X-API-KEY': token || '',
      },
    }).then(res => res.json());
  },


  // Preview a cotizacion (does not persist, just returns a preview id)
  previewCotizacion: (data: {
    client_id: number | null;
    client_name: string | null;
    date: string;
    items: Array<{ description: string; amount: number; quantity: number; subtotal: number }>;
    total: number;
  }) =>
    apiClient.post<{
      pdf: any;
      content: any; id: number; code?: string; message?: string
    }>('/api/cotizaciones/preview', data),

  // Create a new cotizacion
  createCotizacion: (data: {
    client_id: number | null;
    client_name: string | null;
    date: string;
    items: Array<{ description: string; amount: number; quantity: number; subtotal: number }>;
    total: number;
    preview?: boolean;
  }) =>
    apiClient.post<{ id: number; code: string; message: string }>('/api/cotizaciones', data),

  // Get cotizacion by ID
  getCotizacionById: (id: number) =>
    apiClient.get<Cotizacion>(`/api/cotizaciones?id=${id}`),

  // Update cotizacion
  updateCotizacion: (id: number, data: unknown) =>
    apiClient.put<Cotizacion>(`/api/cotizaciones/${id}`, data),

  // Delete cotizacion
  deleteCotizacion: (id: number) =>
    apiClient.delete<void>(`/api/cotizaciones/${id}`),
};

export default apiClient;
