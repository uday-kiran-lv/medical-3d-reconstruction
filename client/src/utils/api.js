/**
 * API Utility for Medical 3D Reconstruction
 * Handles communication with the backend server
 */

// Get API URL from environment variable or default to localhost
const getApiUrl = () => {
  // Check for Vite environment variable
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  
  // Default to localhost in development
  if (import.meta.env.DEV) {
    return 'http://localhost:5000'
  }
  
  // In production without env var, use empty string for relative URLs
  // or you can set a default production URL here
  return ''
}

const API_BASE_URL = getApiUrl()

export const api = {
  baseUrl: API_BASE_URL,
  
  // Image endpoints
  uploadImage: async (imageData) => {
    const response = await fetch(`${API_BASE_URL}/api/images/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(imageData),
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to upload image')
    }
    return response.json()
  },

  getImageStatus: async (imageId) => {
    const response = await fetch(`${API_BASE_URL}/api/images/status/${imageId}`)
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to get image status')
    }
    return response.json()
  },

  // Reconstruction endpoints
  startReconstruction: async (data) => {
    const response = await fetch(`${API_BASE_URL}/api/reconstruction/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to start reconstruction')
    }
    return response.json()
  },

  getReconstruction: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/reconstruction/${id}`)
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to get reconstruction')
    }
    return response.json()
  },

  // Health check
  healthCheck: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`)
      if (!response.ok) {
        return { status: 'error', message: 'Server not responding' }
      }
      return response.json()
    } catch (error) {
      return { status: 'error', message: error.message }
    }
  },
}

export default api
