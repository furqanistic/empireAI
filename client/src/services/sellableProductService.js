import axiosInstance from '../config/config.js'

const base = '/sellable-products'

const unwrap = (error) => {
  const message =
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    'Request failed'
  const next = new Error(message)
  next.status = error.response?.status
  throw next
}

export const sellableProductService = {
  list: async () => {
    try {
      const response = await axiosInstance.get(base)
      return response.data
    } catch (error) {
      unwrap(error)
    }
  },
  get: async (id) => {
    try {
      const response = await axiosInstance.get(`${base}/${id}`)
      return response.data
    } catch (error) {
      unwrap(error)
    }
  },
  performance: async (id) => {
    try {
      const response = await axiosInstance.get(`${base}/${id}/performance`)
      return response.data
    } catch (error) {
      unwrap(error)
    }
  },
  generate: async (payload) => {
    try {
      const response = await axiosInstance.post(`${base}/generate`, payload)
      return response.data
    } catch (error) {
      unwrap(error)
    }
  },
  revise: async (id, prompt) => {
    try {
      const response = await axiosInstance.post(`${base}/${id}/revise`, { prompt })
      return response.data
    } catch (error) {
      unwrap(error)
    }
  },
  saveContent: async ({ id, content, price }) => {
    try {
      const response = await axiosInstance.put(`${base}/${id}/content`, {
        content,
        price,
      })
      return response.data
    } catch (error) {
      unwrap(error)
    }
  },
  uploadImage: async (id, file) => {
    try {
      const form = new FormData()
      form.append('image', file)
      const response = await axiosInstance.post(`${base}/${id}/images`, form)
      return response.data
    } catch (error) {
      unwrap(error)
    }
  },
  updatePrice: async (id, price) => {
    try {
      const response = await axiosInstance.patch(`${base}/${id}/price`, { price })
      return response.data
    } catch (error) {
      unwrap(error)
    }
  },
  publish: async (id, price) => {
    try {
      const response = await axiosInstance.post(`${base}/${id}/publish`, { price })
      return response.data
    } catch (error) {
      unwrap(error)
    }
  },
  downloadPdf: async (id, filename) => {
    try {
      const response = await axiosInstance.get(`${base}/${id}/pdf`, {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url
      link.download = filename || 'product.pdf'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      unwrap(error)
    }
  },
}
