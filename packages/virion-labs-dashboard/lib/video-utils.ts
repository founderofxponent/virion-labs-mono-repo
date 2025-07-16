export interface VideoInfo {
  provider: string
  videoId: string
  embedUrl: string
  thumbnailUrl?: string
  isValid: boolean
  originalUrl: string
}

export interface VideoProvider {
  name: string
  patterns: RegExp[]
  extractId: (url: string, match: RegExpMatchArray) => string | null
  generateEmbedUrl: (videoId: string) => string
  generateThumbnailUrl?: (videoId: string) => string
}

// Define video providers with their URL patterns and embed logic
const VIDEO_PROVIDERS: VideoProvider[] = [
  // YouTube
  {
    name: 'youtube',
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^"&?\/\s]{11})/i,
      /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^"&?\/\s]{11})/i,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^"&?\/\s]{11})/i,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([^"&?\/\s]{11})/i
    ],
    extractId: (url: string, match: RegExpMatchArray) => match[1],
    generateEmbedUrl: (videoId: string) => {
      const params = new URLSearchParams({
        rel: '0',
        modestbranding: '1', 
        showinfo: '0',
        enablejsapi: '1',
        playsinline: '1',
        fs: '1',
        iv_load_policy: '3',
        controls: '1',
        disablekb: '0',
        color: 'white',
        cc_load_policy: '0'
      })
      return `https://www.youtube.com/embed/${videoId}?${params.toString()}`
    },
    generateThumbnailUrl: (videoId: string) => `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
  },

  // Vimeo
  {
    name: 'vimeo',
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|)(\d+)(?:$|\/|\?)/i,
      /(?:https?:\/\/)?player\.vimeo\.com\/video\/(\d+)/i
    ],
    extractId: (url: string, match: RegExpMatchArray) => match[1],
    generateEmbedUrl: (videoId: string) => `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0`,
    generateThumbnailUrl: (videoId: string) => `https://vumbnail.com/${videoId}.jpg`
  },

  // Wistia
  {
    name: 'wistia',
    patterns: [
      /(?:https?:\/\/)?(?:\w+\.)?wistia\.com\/medias\/([a-z0-9]{10})/i,
      /(?:https?:\/\/)?fast\.wistia\.net\/embed\/iframe\/([a-z0-9]{10})/i,
      /(?:https?:\/\/)?(?:\w+\.)?wistia\.com\/embed\/iframe\/([a-z0-9]{10})/i
    ],
    extractId: (url: string, match: RegExpMatchArray) => match[1],
    generateEmbedUrl: (videoId: string) => `https://fast.wistia.net/embed/iframe/${videoId}?playerColor=3B82F6&videoFoam=true`,
  },

  // Loom
  {
    name: 'loom',
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?loom\.com\/share\/([a-f0-9]{32})/i,
      /(?:https?:\/\/)?(?:www\.)?loom\.com\/embed\/([a-f0-9]{32})/i
    ],
    extractId: (url: string, match: RegExpMatchArray) => match[1],
    generateEmbedUrl: (videoId: string) => `https://www.loom.com/embed/${videoId}`,
  },

  // TikTok
  {
    name: 'tiktok',
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@[\w.-]+\/video\/(\d+)/i,
      /(?:https?:\/\/)?vm\.tiktok\.com\/([a-zA-Z0-9]+)/i
    ],
    extractId: (url: string, match: RegExpMatchArray) => match[1],
    generateEmbedUrl: (videoId: string) => `https://www.tiktok.com/embed/v2/${videoId}`,
  },

  // Twitch
  {
    name: 'twitch',
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?twitch\.tv\/videos\/(\d+)/i,
      /(?:https?:\/\/)?clips\.twitch\.tv\/([a-zA-Z0-9]+)/i
    ],
    extractId: (url: string, match: RegExpMatchArray) => match[1],
    generateEmbedUrl: (videoId: string) => `https://player.twitch.tv/?video=v${videoId}&parent=localhost`,
  },

  // Dailymotion
  {
    name: 'dailymotion',
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?dailymotion\.com\/video\/([a-z0-9]+)/i,
      /(?:https?:\/\/)?dai\.ly\/([a-z0-9]+)/i
    ],
    extractId: (url: string, match: RegExpMatchArray) => match[1],
    generateEmbedUrl: (videoId: string) => `https://www.dailymotion.com/embed/video/${videoId}`,
  }
]

/**
 * Parse a video URL and extract video information
 */
export function parseVideoUrl(url: string): VideoInfo {
  if (!url || typeof url !== 'string') {
    return {
      provider: 'unknown',
      videoId: '',
      embedUrl: '',
      isValid: false,
      originalUrl: url || ''
    }
  }

  // Clean the URL
  const cleanUrl = url.trim()

  // Try each provider
  for (const provider of VIDEO_PROVIDERS) {
    for (const pattern of provider.patterns) {
      const match = cleanUrl.match(pattern)
      if (match) {
        const videoId = provider.extractId(cleanUrl, match)
        if (videoId) {
          return {
            provider: provider.name,
            videoId,
            embedUrl: provider.generateEmbedUrl(videoId),
            thumbnailUrl: provider.generateThumbnailUrl?.(videoId),
            isValid: true,
            originalUrl: cleanUrl
          }
        }
      }
    }
  }

  // If no provider matched, but it looks like a video URL, try to use it directly
  if (isVideoUrl(cleanUrl)) {
    return {
      provider: 'direct',
      videoId: '',
      embedUrl: cleanUrl,
      isValid: true,
      originalUrl: cleanUrl
    }
  }

  return {
    provider: 'unknown',
    videoId: '',
    embedUrl: '',
    isValid: false,
    originalUrl: cleanUrl
  }
}

/**
 * Check if a URL appears to be a video URL
 */
function isVideoUrl(url: string): boolean {
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv']
  const lowerUrl = url.toLowerCase()
  
  return videoExtensions.some(ext => lowerUrl.includes(ext)) ||
         lowerUrl.includes('video') ||
         lowerUrl.includes('embed')
}

/**
 * Get list of supported video providers
 */
export function getSupportedProviders(): string[] {
  return VIDEO_PROVIDERS.map(provider => provider.name)
}

/**
 * Validate if a URL is from a supported video provider
 */
export function isSupportedProvider(url: string): boolean {
  const videoInfo = parseVideoUrl(url)
  return videoInfo.isValid && videoInfo.provider !== 'unknown'
}

/**
 * Get embed parameters for better video experience
 */
export function getEmbedParameters(provider: string): Record<string, string | number> {
  const commonParams = {
    autoplay: 0,
    controls: 1,
    modestbranding: 1,
    rel: 0
  }

  switch (provider) {
    case 'youtube':
      return {
        ...commonParams,
        showinfo: 0,
        iv_load_policy: 3
      }
    case 'vimeo':
      return {
        title: 0,
        byline: 0,
        portrait: 0,
        autoplay: 0
      }
    case 'wistia':
      return {
        playerColor: '3B82F6',
        videoFoam: 1
      }
    default:
      return commonParams
  }
} 