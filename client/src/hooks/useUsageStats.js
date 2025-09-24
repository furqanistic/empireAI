// File: client/src/hooks/useUsageStats.js
import axiosInstance from '@/config/config'
import { useQuery } from '@tanstack/react-query'

export const useUsageStats = () => {
  return useQuery({
    queryKey: ['usage', 'stats'],
    queryFn: async () => {
      const response = await axiosInstance.get('/usage/stats')
      return response.data
    },
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  })
}
