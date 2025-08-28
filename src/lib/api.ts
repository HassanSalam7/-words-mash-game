import axios from 'axios'

// Create Axios instance with default configuration
const apiClient = axios.create({
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for logging and auth
apiClient.interceptors.request.use(
  (config) => {
    // Log requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 [API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        data: config.data,
        params: config.params,
      })
    }
    return config
  },
  (error) => {
    console.error('❌ [API Request Error]', error)
    return Promise.reject(error)
  }
)

// Response interceptor for logging and error handling
apiClient.interceptors.response.use(
  (response: any) => {
    // Log successful responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ [API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      })
    }
    return response
  },
  (error) => {
    // Enhanced error logging
    console.error('❌ [API Response Error]', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
    })

    // Handle specific error cases
    if (error.response?.status === 429) {
      console.warn('⚠️ Rate limit exceeded')
    } else if (error.response?.status >= 500) {
      console.error('🔥 Server error detected')
    } else if (error.code === 'ECONNABORTED') {
      console.error('⏰ Request timeout')
    }

    return Promise.reject(error)
  }
)

// API service class with all HTTP methods
export class ApiService {
  private client: any

  constructor(client: any) {
    this.client = client
  }

  // GET request
  async get<T>(url: string, config?: any): Promise<T> {
    const response = await this.client.get(url, config)
    return response.data
  }

  // POST request
  async post<T, D = any>(url: string, data?: D, config?: any): Promise<T> {
    const response = await this.client.post(url, data, config)
    return response.data
  }

  // PUT request
  async put<T, D = any>(url: string, data?: D, config?: any): Promise<T> {
    const response = await this.client.put(url, data, config)
    return response.data
  }

  // PATCH request
  async patch<T, D = any>(url: string, data?: D, config?: any): Promise<T> {
    const response = await this.client.patch(url, data, config)
    return response.data
  }

  // DELETE request
  async delete<T>(url: string, config?: any): Promise<T> {
    const response = await this.client.delete(url, config)
    return response.data
  }
}

// Create and export API service instance
export const apiService = new ApiService(apiClient)

// Export axios client for direct use if needed
export { apiClient }
export default apiService