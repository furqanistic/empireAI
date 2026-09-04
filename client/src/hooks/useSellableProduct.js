import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sellableProductService } from '../services/sellableProductService.js'

export const useSellableProducts = () =>
  useQuery({
    queryKey: ['sellable-products'],
    queryFn: sellableProductService.list,
    staleTime: 30 * 1000,
  })

export const useGenerateSellableProduct = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: sellableProductService.generate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sellable-products'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    },
  })
}

export const useReviseSellableProduct = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, prompt }) => sellableProductService.revise(id, prompt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sellable-products'] })
    },
  })
}

export const useSaveSellableContent = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: sellableProductService.saveContent,
    onSuccess: (response) => {
      const product = response?.data?.product
      if (!product) return
      queryClient.setQueryData(['sellable-products'], (old) => {
        if (!old?.data?.products) return old
        return {
          ...old,
          data: {
            ...old.data,
            products: old.data.products.map((item) =>
              String(item.id) === String(product.id) ? { ...item, ...product } : item
            ),
          },
        }
      })
    },
  })
}

export const usePublishSellableProduct = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, price }) => sellableProductService.publish(id, price),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sellable-products'] })
    },
  })
}
