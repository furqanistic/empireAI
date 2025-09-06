// File: src/hooks/useDigitalProducts.js - FIXED PUBLISHED STATUS UPDATES
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import digitalProductsService from '../services/digitalProductsService.js'

export const useDigitalProducts = () => {
  const queryClient = useQueryClient()

  // ===== FILTERS AND PAGINATION STATE =====
  const [filters, setFilters] = useState({
    category: 'all',
    search: '',
    published: null, // null = show all products (both published and unpublished)
    page: 1,
    limit: 10,
  })

  // ===== PRODUCTS LIST QUERY =====
  const {
    data: productsResponse,
    isLoading: loading,
    error: queryError,
    refetch: fetchProducts,
  } = useQuery({
    queryKey: ['digital-products', filters],
    queryFn: () => digitalProductsService.getUserProducts(filters),
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
  })

  // Extract data with fallbacks
  const products = productsResponse?.data?.products || []
  const stats = productsResponse?.data?.stats || {
    totalProducts: 0,
    totalRevenue: 0,
    publishedProducts: 0,
    totalSales: 0,
  }
  const pagination = {
    currentPage: productsResponse?.currentPage || 1,
    totalPages: productsResponse?.totalPages || 1,
    totalResults: productsResponse?.totalResults || 0,
    results: productsResponse?.results || 0,
  }

  // Convert error to string for backward compatibility
  const error = queryError ? queryError.message || 'An error occurred' : null

  // ===== FILTER AND PAGINATION HELPERS =====
  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }))
  }, [])

  const changePage = useCallback((page) => {
    setFilters((prev) => ({ ...prev, page }))
  }, [])

  const refreshProducts = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['digital-products'] })
    // Also refetch immediately to ensure immediate update
    fetchProducts()
  }, [queryClient, fetchProducts])

  // ===== PRODUCT MUTATIONS =====
  const createProductMutation = useMutation({
    mutationFn: (productData) =>
      digitalProductsService.createProduct(productData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digital-products'] })
    },
  })

  const updateProductMutation = useMutation({
    mutationFn: ({ id, productData }) =>
      digitalProductsService.updateProduct(id, productData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digital-products'] })
    },
  })

  const deleteProductMutation = useMutation({
    mutationFn: (id) => digitalProductsService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digital-products'] })
    },
  })

  const togglePublishedMutation = useMutation({
    mutationFn: (id) => digitalProductsService.toggleProductPublished(id),
    onMutate: async (productId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['digital-products'] })

      // Snapshot the previous value
      const previousData = queryClient.getQueryData([
        'digital-products',
        filters,
      ])

      // Optimistically update the cache
      queryClient.setQueryData(['digital-products', filters], (old) => {
        if (!old?.data?.products) return old

        const updatedProducts = old.data.products.map((product) =>
          product._id === productId
            ? { ...product, published: !product.published }
            : product
        )

        // Update stats as well
        const currentStats = old.data.stats || {}
        const product = old.data.products.find((p) => p._id === productId)
        const wasPublished = product?.published || false
        const newPublishedCount = wasPublished
          ? currentStats.publishedProducts - 1
          : currentStats.publishedProducts + 1

        return {
          ...old,
          data: {
            ...old.data,
            products: updatedProducts,
            stats: {
              ...currentStats,
              publishedProducts: Math.max(0, newPublishedCount),
            },
          },
        }
      })

      return { previousData }
    },
    onError: (err, productId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousData) {
        queryClient.setQueryData(
          ['digital-products', filters],
          context.previousData
        )
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have correct data
      queryClient.invalidateQueries({ queryKey: ['digital-products'] })
    },
  })

  // ===== PRODUCT OPERATIONS =====
  const createProduct = useCallback(
    async (productData) => {
      try {
        const response = await createProductMutation.mutateAsync(productData)
        return response.data.product
      } catch (error) {
        throw error
      }
    },
    [createProductMutation]
  )

  const updateProduct = useCallback(
    async (id, productData) => {
      try {
        const response = await updateProductMutation.mutateAsync({
          id,
          productData,
        })
        return response.data.product
      } catch (error) {
        throw error
      }
    },
    [updateProductMutation]
  )

  const deleteProduct = useCallback(
    async (id) => {
      try {
        await deleteProductMutation.mutateAsync(id)
        return true
      } catch (error) {
        throw error
      }
    },
    [deleteProductMutation]
  )

  const togglePublished = useCallback(
    async (id) => {
      try {
        const response = await togglePublishedMutation.mutateAsync(id)
        return response.data.product
      } catch (error) {
        throw error
      }
    },
    [togglePublishedMutation]
  )

  // ===== FILE OPERATIONS =====
  const [uploadProgress, setUploadProgress] = useState(0)

  const uploadFilesMutation = useMutation({
    mutationFn: ({ productId, files }) =>
      digitalProductsService.uploadFiles(productId, files, (progressEvent) => {
        const progress = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        )
        setUploadProgress(progress)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digital-products'] })
      setUploadProgress(0)
    },
    onError: () => {
      setUploadProgress(0)
    },
  })

  const deleteFileMutation = useMutation({
    mutationFn: ({ productId, fileId }) =>
      digitalProductsService.deleteFile(productId, fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digital-products'] })
    },
  })

  const uploadFiles = useCallback(
    async (productId, files) => {
      try {
        const response = await uploadFilesMutation.mutateAsync({
          productId,
          files,
        })
        return response.data
      } catch (error) {
        throw error
      }
    },
    [uploadFilesMutation]
  )

  const deleteFile = useCallback(
    async (productId, fileId) => {
      try {
        await deleteFileMutation.mutateAsync({ productId, fileId })
        return true
      } catch (error) {
        throw error
      }
    },
    [deleteFileMutation]
  )

  const [downloading, setDownloading] = useState(false)

  const downloadFile = useCallback(async (productId, fileId, filename) => {
    setDownloading(true)
    try {
      const response = await digitalProductsService.downloadFile(
        productId,
        fileId
      )
      digitalProductsService.downloadBlob(response.data, filename)
      return true
    } catch (error) {
      throw error
    } finally {
      setDownloading(false)
    }
  }, [])

  // ===== PUBLIC PRODUCT QUERY =====
  const [publicProductSlug, setPublicProductSlug] = useState(null)

  const { data: publicProductResponse, isLoading: publicProductLoading } =
    useQuery({
      queryKey: ['public-product', publicProductSlug],
      queryFn: () => digitalProductsService.getPublicProduct(publicProductSlug),
      enabled: Boolean(publicProductSlug),
      staleTime: 10 * 60 * 1000, // 10 minutes
    })

  const publicProduct = publicProductResponse?.data?.product || null

  const fetchPublicProduct = useCallback((identifier) => {
    setPublicProductSlug(identifier)
  }, [])

  const setPublicProduct = useCallback(
    (product) => {
      if (product) {
        queryClient.setQueryData(
          ['public-product', product.slug || product._id],
          {
            data: { product },
          }
        )
        setPublicProductSlug(product.slug || product._id)
      } else {
        setPublicProductSlug(null)
      }
    },
    [queryClient]
  )

  // ===== CHECKOUT & PAYMENT =====
  const [purchaseData, setPurchaseData] = useState(null)

  const createCheckoutMutation = useMutation({
    mutationFn: ({ productIdentifier, customerInfo }) =>
      digitalProductsService.createCheckoutSession(
        productIdentifier,
        customerInfo
      ),
  })

  const verifyPaymentMutation = useMutation({
    mutationFn: (sessionId) =>
      digitalProductsService.verifyCheckoutSession(sessionId),
    onSuccess: (response) => {
      setPurchaseData(response.data)
    },
  })

  const createCheckoutSession = useCallback(
    async (productIdentifier, customerInfo) => {
      try {
        const response = await createCheckoutMutation.mutateAsync({
          productIdentifier,
          customerInfo,
        })
        return response.data
      } catch (error) {
        throw error
      }
    },
    [createCheckoutMutation]
  )

  const verifyPayment = useCallback(
    async (sessionId) => {
      try {
        const response = await verifyPaymentMutation.mutateAsync(sessionId)
        return response.data
      } catch (error) {
        throw error
      }
    },
    [verifyPaymentMutation]
  )

  const redirectToCheckout = useCallback(
    async (productIdentifier, customerInfo) => {
      try {
        const checkoutData = await createCheckoutSession(
          productIdentifier,
          customerInfo
        )
        if (checkoutData.url) {
          window.location.href = checkoutData.url
        } else {
          throw new Error('No checkout URL received')
        }
      } catch (error) {
        throw error
      }
    },
    [createCheckoutSession]
  )

  // ===== PURCHASES QUERY =====
  const [purchasesEmail, setPurchasesEmail] = useState(null)

  const { data: purchasesResponse, isLoading: purchasesLoading } = useQuery({
    queryKey: ['user-purchases', purchasesEmail],
    queryFn: () => digitalProductsService.getUserPurchases(purchasesEmail),
    enabled: Boolean(purchasesEmail),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const purchases = purchasesResponse?.data?.purchases || []

  const fetchPurchases = useCallback((email = null) => {
    setPurchasesEmail(email)
  }, [])

  const downloadPurchasedFile = useCallback(
    async (productIdentifier, fileId, filename, token = null, email = null) => {
      setDownloading(true)
      try {
        const response = await digitalProductsService.downloadPurchasedFile(
          productIdentifier,
          fileId,
          token,
          email
        )
        digitalProductsService.downloadBlob(response.data, filename)
        return true
      } catch (error) {
        throw error
      } finally {
        setDownloading(false)
      }
    },
    []
  )

  // ===== ANALYTICS QUERY =====
  const [analyticsProductId, setAnalyticsProductId] = useState(null)

  const { data: analyticsResponse, isLoading: analyticsLoading } = useQuery({
    queryKey: ['product-analytics', analyticsProductId],
    queryFn: () =>
      digitalProductsService.getProductAnalytics(analyticsProductId),
    enabled: Boolean(analyticsProductId),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  const analytics = analyticsResponse?.data?.analytics || null
  const chartData = analyticsResponse?.data?.chartData || null
  const recentPurchases = analyticsResponse?.data?.recentPurchases || []

  const fetchAnalytics = useCallback((productId) => {
    setAnalyticsProductId(productId)
  }, [])

  // ===== COMPUTED VALUES FOR LOADING STATES =====
  const saving =
    createProductMutation.isPending ||
    updateProductMutation.isPending ||
    deleteProductMutation.isPending ||
    togglePublishedMutation.isPending

  const uploading = uploadFilesMutation.isPending
  const deleting = deleteFileMutation.isPending
  const checkoutLoading = createCheckoutMutation.isPending
  const verifying = verifyPaymentMutation.isPending

  // ===== UTILITY FUNCTIONS =====
  const setError = useCallback(() => {
    console.warn(
      'setError is deprecated - errors are handled automatically by React Query'
    )
  }, [])

  const setProducts = useCallback(
    (products) => {
      queryClient.setQueryData(['digital-products', filters], (oldData) => ({
        ...oldData,
        data: {
          ...oldData?.data,
          products,
        },
      }))
    },
    [queryClient, filters]
  )

  // ===== RETURN ALL THE THINGS =====
  return {
    // Products list
    products,
    stats,
    loading,
    error,
    pagination,
    filters,
    updateFilters,
    changePage,
    refreshProducts,
    fetchProducts,

    // Single product operations
    saving,
    createProduct,
    updateProduct,
    deleteProduct,
    togglePublished,

    // File operations
    uploading,
    uploadProgress,
    downloading,
    deleting,
    uploadFiles,
    deleteFile,
    downloadFile,

    // Checkout & payment
    checkoutLoading,
    verifying,
    purchaseData,
    createCheckoutSession,
    verifyPayment,
    redirectToCheckout,
    setPurchaseData,

    // Public product access
    publicProduct,
    publicProductLoading,
    fetchPublicProduct,
    setPublicProduct,

    // Purchases
    purchases,
    purchasesLoading,
    fetchPurchases,
    downloadPurchasedFile,

    // Analytics
    analytics,
    chartData,
    recentPurchases,
    analyticsLoading,
    fetchAnalytics,

    // Utility (backward compatibility)
    setError,
    setProducts,
  }
}

// ===== FORM VALIDATION HOOK =====
export const useFormValidation = (initialValues, validationRules) => {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  const validateField = useCallback(
    (name, value) => {
      const rules = validationRules[name]
      if (!rules) return ''

      for (const rule of rules) {
        const error = rule(value, values)
        if (error) return error
      }
      return ''
    },
    [validationRules, values]
  )

  const validateAll = useCallback(() => {
    const newErrors = {}
    let isValid = true

    Object.keys(validationRules).forEach((name) => {
      const error = validateField(name, values[name])
      if (error) {
        newErrors[name] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }, [values, validateField, validationRules])

  const setValue = useCallback(
    (name, value) => {
      setValues((prev) => ({ ...prev, [name]: value }))

      // Clear error when user starts typing
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: '' }))
      }
    },
    [errors]
  )

  const setFieldTouched = useCallback(
    (name) => {
      setTouched((prev) => ({ ...prev, [name]: true }))

      // Validate field when it's touched
      const error = validateField(name, values[name])
      setErrors((prev) => ({ ...prev, [name]: error }))
    },
    [validateField, values]
  )

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }, [initialValues])

  const isFieldValid = useCallback(
    (name) => {
      return !errors[name] && touched[name]
    },
    [errors, touched]
  )

  const isFormValid = useCallback(() => {
    return Object.keys(errors).length === 0 && Object.keys(touched).length > 0
  }, [errors, touched])

  return {
    values,
    errors,
    touched,
    setValue,
    setFieldTouched,
    validateAll,
    reset,
    isFieldValid,
    isFormValid,
    setValues,
    setErrors,
  }
}
