/**
 * Server-side video utilities for generating embed URLs in API routes
 * This is a simplified version of the client-side video-utils for use in server contexts
 */

interface VideoEmbedResult {
  embedUrl: string
  provider: string
  isValid: boolean
  originalUrl: string
}

/**
 * Parse video URL and generate embed URL for server-side rendering
 */
export function parseVideoUrlForEmbed(url: string): VideoEmbedResult {
  if (!url || typeof url !== 'string') {
    return {
      embedUrl: '',
      provider: 'unknown',
      isValid: false,
      originalUrl: url || ''
    }
  }

  const cleanUrl = url.trim()

  // YouTube patterns and embed generation
  const youtubePatterns = [
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^"&?\/\s]{11})/i,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^"&?\/\s]{11})/i,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^"&?\/\s]{11})/i,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([^"&?\/\s]{11})/i
  ]

  for (const pattern of youtubePatterns) {
    const match = cleanUrl.match(pattern)
    if (match && match[1]) {
      return {
        embedUrl: `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1&showinfo=0`,
        provider: 'youtube',
        isValid: true,
        originalUrl: cleanUrl
      }
    }
  }

  // Vimeo patterns
  const vimeoPatterns = [
    /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|)(\d+)(?:$|\/|\?)/i,
    /(?:https?:\/\/)?player\.vimeo\.com\/video\/(\d+)/i
  ]

  for (const pattern of vimeoPatterns) {
    const match = cleanUrl.match(pattern)
    if (match && match[1]) {
      return {
        embedUrl: `https://player.vimeo.com/video/${match[1]}?title=0&byline=0&portrait=0`,
        provider: 'vimeo',
        isValid: true,
        originalUrl: cleanUrl
      }
    }
  }

  // Wistia patterns
  const wistiaPatterns = [
    /(?:https?:\/\/)?(?:\w+\.)?wistia\.com\/medias\/([a-z0-9]{10})/i,
    /(?:https?:\/\/)?fast\.wistia\.net\/embed\/iframe\/([a-z0-9]{10})/i,
    /(?:https?:\/\/)?(?:\w+\.)?wistia\.com\/embed\/iframe\/([a-z0-9]{10})/i
  ]

  for (const pattern of wistiaPatterns) {
    const match = cleanUrl.match(pattern)
    if (match && match[1]) {
      return {
        embedUrl: `https://fast.wistia.net/embed/iframe/${match[1]}?playerColor=3B82F6&videoFoam=true`,
        provider: 'wistia',
        isValid: true,
        originalUrl: cleanUrl
      }
    }
  }

  // Loom patterns
  const loomPatterns = [
    /(?:https?:\/\/)?(?:www\.)?loom\.com\/share\/([a-f0-9]{32})/i,
    /(?:https?:\/\/)?(?:www\.)?loom\.com\/embed\/([a-f0-9]{32})/i
  ]

  for (const pattern of loomPatterns) {
    const match = cleanUrl.match(pattern)
    if (match && match[1]) {
      return {
        embedUrl: `https://www.loom.com/embed/${match[1]}`,
        provider: 'loom',
        isValid: true,
        originalUrl: cleanUrl
      }
    }
  }

  // TikTok patterns
  const tiktokPatterns = [
    /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@[\w.-]+\/video\/(\d+)/i,
    /(?:https?:\/\/)?vm\.tiktok\.com\/([a-zA-Z0-9]+)/i
  ]

  for (const pattern of tiktokPatterns) {
    const match = cleanUrl.match(pattern)
    if (match && match[1]) {
      return {
        embedUrl: `https://www.tiktok.com/embed/v2/${match[1]}`,
        provider: 'tiktok',
        isValid: true,
        originalUrl: cleanUrl
      }
    }
  }

  // Twitch patterns
  const twitchPatterns = [
    /(?:https?:\/\/)?(?:www\.)?twitch\.tv\/videos\/(\d+)/i,
    /(?:https?:\/\/)?clips\.twitch\.tv\/([a-zA-Z0-9]+)/i
  ]

  for (const pattern of twitchPatterns) {
    const match = cleanUrl.match(pattern)
    if (match && match[1]) {
      return {
        embedUrl: `https://player.twitch.tv/?video=v${match[1]}&parent=localhost`,
        provider: 'twitch',
        isValid: true,
        originalUrl: cleanUrl
      }
    }
  }

  // Dailymotion patterns
  const dailymotionPatterns = [
    /(?:https?:\/\/)?(?:www\.)?dailymotion\.com\/video\/([a-z0-9]+)/i,
    /(?:https?:\/\/)?dai\.ly\/([a-z0-9]+)/i
  ]

  for (const pattern of dailymotionPatterns) {
    const match = cleanUrl.match(pattern)
    if (match && match[1]) {
      return {
        embedUrl: `https://www.dailymotion.com/embed/video/${match[1]}`,
        provider: 'dailymotion',
        isValid: true,
        originalUrl: cleanUrl
      }
    }
  }

  // If no provider matched, but it looks like a video URL, use it directly
  if (isVideoUrl(cleanUrl)) {
    return {
      embedUrl: cleanUrl,
      provider: 'direct',
      isValid: true,
      originalUrl: cleanUrl
    }
  }

  // Fallback: try to use the URL as-is if it looks like an embed URL
  if (cleanUrl.includes('embed') || cleanUrl.includes('player')) {
    return {
      embedUrl: cleanUrl,
      provider: 'unknown',
      isValid: true,
      originalUrl: cleanUrl
    }
  }

  return {
    embedUrl: '',
    provider: 'unknown',
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
 * Generate enhanced iframe attributes for better video experience
 */
export function getVideoIframeAttributes(provider: string): string {
  const baseAttributes = 'frameborder="0" allowfullscreen loading="lazy"'
  
  const allowAttributes = 'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"'
  
  switch (provider) {
    case 'youtube':
    case 'vimeo':
    case 'wistia':
    case 'loom':
      return `${baseAttributes} ${allowAttributes}`
    case 'tiktok':
      return `${baseAttributes} ${allowAttributes} sandbox="allow-scripts allow-same-origin"`
    default:
      return baseAttributes
  }
}

/**
 * Get provider display name for error messages
 */
export function getProviderDisplayName(provider: string): string {
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