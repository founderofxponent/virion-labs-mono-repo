"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, ExternalLink, Play, RefreshCw } from "lucide-react"
import { parseVideoUrl, VideoInfo } from "@/lib/video-utils"

interface VideoPlayerProps {
  url: string
  title?: string
  className?: string
  aspectRatio?: "16/9" | "4/3" | "1/1"
  autoplay?: boolean
  showProvider?: boolean
  onError?: (error: string) => void
}

export function VideoPlayer({
  url,
  title = "Video",
  className = "",
  aspectRatio = "16/9",
  autoplay = false,
  showProvider = true,
  onError
}: VideoPlayerProps) {
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    parseVideo()
  }, [url])

  const parseVideo = () => {
    setLoading(true)
    setError(null)

    try {
      const info = parseVideoUrl(url)
      setVideoInfo(info)

      // Debug logging
      if (process.env.NODE_ENV === 'development') {
        console.log('Video parsing debug:', {
          originalUrl: url,
          parsedInfo: info,
          embedUrl: info.embedUrl,
          provider: info.provider,
          videoId: info.videoId
        })
      }

      if (!info.isValid) {
        const errorMsg = `Unsupported video URL. Please use a supported video provider.`
        setError(errorMsg)
        onError?.(errorMsg)
      }
    } catch (err) {
      const errorMsg = 'Failed to parse video URL'
      setError(errorMsg)
      onError?.(errorMsg)
      console.error('Video parsing error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
    parseVideo()
  }

  const handleOpenOriginal = () => {
    if (videoInfo?.originalUrl) {
      window.open(videoInfo.originalUrl, '_blank')
    }
  }

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case "4/3": return "aspect-[4/3]"
      case "1/1": return "aspect-square"
      default: return "aspect-video"
    }
  }

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'youtube': return 'bg-red-500'
      case 'vimeo': return 'bg-blue-500'
      case 'wistia': return 'bg-purple-500'
      case 'loom': return 'bg-green-500'
      case 'tiktok': return 'bg-black'
      case 'twitch': return 'bg-purple-600'
      case 'dailymotion': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  const getProviderDisplayName = (provider: string) => {
    switch (provider) {
      case 'youtube': return 'YouTube'
      case 'vimeo': return 'Vimeo'
      case 'wistia': return 'Wistia'
      case 'loom': return 'Loom'
      case 'tiktok': return 'TikTok'
      case 'twitch': return 'Twitch'
      case 'dailymotion': return 'Dailymotion'
      case 'direct': return 'Direct Video'
      default: return 'Video'
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-0">
          <div className={`${getAspectRatioClass()} bg-gray-100 flex items-center justify-center`}>
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Loading video...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !videoInfo?.isValid) {
    return (
      <Card className={className}>
        <CardContent className="p-0">
          <div className={`${getAspectRatioClass()} bg-red-50 border-2 border-red-200 flex items-center justify-center`}>
            <div className="text-center p-6">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="font-semibold text-red-800 mb-2">Video Not Available</h3>
              <p className="text-sm text-red-600 mb-4">
                {error || 'This video URL is not supported or the video may have been removed.'}
              </p>
              
              <div className="space-y-2">
                <div className="text-xs text-red-500 mb-3">
                  Supported providers: YouTube, Vimeo, Wistia, Loom, TikTok, Twitch, Dailymotion
                </div>
                
                <div className="flex gap-2 justify-center">
                  {retryCount < 3 && (
                    <Button
                      onClick={handleRetry}
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Retry
                    </Button>
                  )}
                  
                  {url && (
                    <Button
                      onClick={handleOpenOriginal}
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Open Original
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardContent className="p-0">
        <div className="relative">
          {showProvider && videoInfo.provider !== 'direct' && (
            <div className="absolute top-3 right-3 z-10">
              <Badge 
                className={`text-white text-xs ${getProviderColor(videoInfo.provider)}`}
              >
                <Play className="h-3 w-3 mr-1" />
                {getProviderDisplayName(videoInfo.provider)}
              </Badge>
            </div>
          )}
          
          <div className={`${getAspectRatioClass()} overflow-hidden rounded-lg`}>
            <iframe
              src={videoInfo.embedUrl}
              title={title}
              className="w-full h-full border-0"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              loading="lazy"
              sandbox="allow-scripts allow-same-origin allow-presentation"
              onError={() => {
                const errorMsg = 'Failed to load video player'
                setError(errorMsg)
                onError?.(errorMsg)
              }}
            />
          </div>
          
          {/* Fallback overlay for iframe loading issues */}
          <div className="absolute inset-0 bg-gray-900 bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center group">
            <Button
              onClick={handleOpenOriginal}
              variant="secondary"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in {getProviderDisplayName(videoInfo.provider)}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 