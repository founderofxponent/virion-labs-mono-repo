"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface PerformanceMetrics {
  loadTime: number
  renderTime: number
  apiCalls: number
  cacheHits: number
  errors: number
}

export function PerformanceMonitor() {
  const [mounted, setMounted] = useState(false)
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    apiCalls: 0,
    cacheHits: 0,
    errors: 0
  })

  useEffect(() => {
    setMounted(true)
    
    // Monitor performance metrics
    const startTime = performance.now()
    
    // Listen for navigation timing
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming
          setMetrics(prev => ({
            ...prev,
            loadTime: navEntry.loadEventEnd - navEntry.loadEventStart
          }))
        }
      })
    })

    observer.observe({ entryTypes: ['navigation'] })

    // Monitor render time
    const renderEndTime = performance.now()
    setMetrics(prev => ({
      ...prev,
      renderTime: renderEndTime - startTime
    }))

    return () => observer.disconnect()
  }, [])

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  // Don't render until mounted to prevent hydration issues
  if (!mounted) {
    return null
  }

  return (
    <Card className="fixed bottom-4 right-4 w-64 z-50 bg-background/95 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Performance Monitor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-xs">
          <span>Load Time:</span>
          <Badge variant={metrics.loadTime > 3000 ? "destructive" : "secondary"}>
            {metrics.loadTime.toFixed(0)}ms
          </Badge>
        </div>
        <div className="flex justify-between text-xs">
          <span>Render Time:</span>
          <Badge variant={metrics.renderTime > 100 ? "destructive" : "secondary"}>
            {metrics.renderTime.toFixed(0)}ms
          </Badge>
        </div>
        <div className="flex justify-between text-xs">
          <span>API Calls:</span>
          <Badge variant="outline">{metrics.apiCalls}</Badge>
        </div>
        <div className="flex justify-between text-xs">
          <span>Cache Hits:</span>
          <Badge variant="outline">{metrics.cacheHits}</Badge>
        </div>
        <div className="flex justify-between text-xs">
          <span>Errors:</span>
          <Badge variant={metrics.errors > 0 ? "destructive" : "secondary"}>
            {metrics.errors}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
} 