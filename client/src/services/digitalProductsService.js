// File: src/services/digitalProductsService.js - FIXED CHECKOUT LINKS
import axiosInstance from '../config/config.js'

class DigitalProductsService {
  constructor() {
    this.baseURL = '/digital-products'
  }

  // Product Management
  async createProduct(productData) {
    try {
      const response = await axiosInstance.post(this.baseURL, productData)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getUserProducts(filters = {}) {
    try {
      const params = new URLSearchParams()

      if (filters.category && filters.category !== 'all') {
        params.append('category', filters.category)
      }
      if (filters.search) {
        params.append('search', filters.search)
      }
      // Remove published filter to show all products
      // if (filters.published !== undefined) {
      //   params.append('published', filters.published)
      // }
      if (filters.page) {
        params.append('page', filters.page)
      }
      if (filters.limit) {
        params.append('limit', filters.limit)
      }

      const response = await axiosInstance.get(`${this.baseURL}?${params}`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getProduct(id) {
    try {
      const response = await axiosInstance.get(`${this.baseURL}/${id}`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async updateProduct(id, productData) {
    try {
      const response = await axiosInstance.put(
        `${this.baseURL}/${id}`,
        productData
      )
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async deleteProduct(id) {
    try {
      const response = await axiosInstance.delete(`${this.baseURL}/${id}`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async toggleProductPublished(id) {
    try {
      const response = await axiosInstance.patch(
        `${this.baseURL}/${id}/toggle-published`
      )
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // File Management
  async uploadFiles(productId, files, onUploadProgress = null) {
    try {
      const formData = new FormData()

      // Handle both single file and file array
      if (Array.isArray(files)) {
        files.forEach((file) => {
          formData.append('files', file)
        })
      } else {
        formData.append('files', files)
      }

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }

      if (onUploadProgress) {
        config.onUploadProgress = onUploadProgress
      }

      const response = await axiosInstance.post(
        `${this.baseURL}/${productId}/files`,
        formData,
        config
      )
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async deleteFile(productId, fileId) {
    try {
      const response = await axiosInstance.delete(
        `${this.baseURL}/${productId}/files/${fileId}`
      )
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async downloadFile(productId, fileId) {
    try {
      const response = await axiosInstance.get(
        `${this.baseURL}/${productId}/files/${fileId}/download`,
        { responseType: 'blob' }
      )
      return response
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // Analytics
  async getProductAnalytics(id) {
    try {
      const response = await axiosInstance.get(
        `${this.baseURL}/${id}/analytics`
      )
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // Public Product Access
  async getPublicProduct(identifier) {
    try {
      // FIXED: This can handle both slug and MongoDB ID
      const response = await axiosInstance.get(
        `${this.baseURL}/public/${identifier}`
      )
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // Payment Processing
  async createCheckoutSession(productIdentifier, customerInfo) {
    try {
      const response = await axiosInstance.post(
        `${this.baseURL}/checkout/create-session`,
        {
          // FIXED: Send multiple field names for backend compatibility
          productId: productIdentifier,
          productIdentifier: productIdentifier,
          productSlug: productIdentifier,
          slug: productIdentifier,
          customerInfo,
        }
      )
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async verifyCheckoutSession(sessionId) {
    try {
      const response = await axiosInstance.post(
        `${this.baseURL}/checkout/verify-session`,
        {
          sessionId,
        }
      )
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getUserPurchases(email = null) {
    try {
      const params = email ? `?email=${encodeURIComponent(email)}` : ''
      const response = await axiosInstance.get(
        `${this.baseURL}/purchases${params}`
      )
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async downloadPurchasedFile(
    productIdentifier,
    fileId,
    token = null,
    email = null
  ) {
    try {
      const params = new URLSearchParams()
      if (token) params.append('token', token)
      if (email) params.append('email', email)

      // Use the identifier as-is (can be MongoDB ID or slug)
      const response = await axiosInstance.get(
        `${this.baseURL}/download/${productIdentifier}/${fileId}?${params}`,
        { responseType: 'blob' }
      )
      return response
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // Admin Functions
  async getAllProducts(filters = {}) {
    try {
      const params = new URLSearchParams()

      if (filters.category && filters.category !== 'all') {
        params.append('category', filters.category)
      }
      if (filters.published !== undefined) {
        params.append('published', filters.published)
      }
      if (filters.page) {
        params.append('page', filters.page)
      }
      if (filters.limit) {
        params.append('limit', filters.limit)
      }

      const response = await axiosInstance.get(
        `${this.baseURL}/admin/all?${params}`
      )
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // Utility Methods
  handleError(error) {
    const message =
      error.response?.data?.message || error.message || 'An error occurred'
    const statusCode = error.response?.status || 500

    return {
      message,
      statusCode,
      details: error.response?.data || error,
    }
  }

  // Helper to trigger file download
  downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  // Helper to format file size
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Helper to get file icon based on extension
  getFileIcon(filename) {
    const extension = filename.split('.').pop().toLowerCase()

    const iconMap = {
      pdf: 'FileText',
      doc: 'FileText',
      docx: 'FileText',
      txt: 'FileText',
      zip: 'Package',
      rar: 'Package',
      mp4: 'Video',
      avi: 'Video',
      mov: 'Video',
      mp3: 'Music',
      wav: 'Music',
      jpg: 'Image',
      jpeg: 'Image',
      png: 'Image',
      gif: 'Image',
      ppt: 'Presentation',
      pptx: 'Presentation',
      xls: 'Table',
      xlsx: 'Table',
      epub: 'Book',
    }

    return iconMap[extension] || 'File'
  }

  // FIXED: Generate checkout link using MongoDB ID instead of slug
  generateCheckoutLink(productId) {
    const baseUrl = window.location.origin
    return `${baseUrl}/product/checkout/${productId}` // Always use MongoDB ID
  }
}

// Export singleton instance
export default new DigitalProductsService()
