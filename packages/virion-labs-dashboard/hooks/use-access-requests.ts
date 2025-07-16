'use client'

import { useState, useEffect } from 'react'

export function useAccessRequests() {
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchPendingCount = async () => {
    try {
      const response = await fetch('/api/admin/access-requests?status=pending')
      const data = await response.json()
      
      if (response.ok) {
        setPendingCount(data.requests?.length || 0)
      }
    } catch (error) {
      console.error('Error fetching pending requests count:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingCount()
    
    // Refresh count every 30 seconds
    const interval = setInterval(fetchPendingCount, 30000)
    
    return () => clearInterval(interval)
  }, [])

  return {
    pendingCount,
    loading,
    refreshCount: fetchPendingCount
  }
} 