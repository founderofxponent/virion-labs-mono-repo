/**
 * URL Validation Utility for Virion Labs Dashboard
 * Ensures HTTPS URLs are used in production to prevent mixed content errors
 */

export function validateApiUrl(url: string): string {
  // In development, allow localhost HTTP
  if (process.env.NODE_ENV === 'development' && url.includes('localhost')) {
    return url
  }
  
  // In production, enforce HTTPS for external APIs
  if (process.env.NODE_ENV === 'production') {
    if (url.startsWith('http://') && !url.includes('localhost')) {
      console.error('❌ Mixed Content Error Prevention: HTTP URL detected in production!')
      console.error('   URL:', url)
      console.error('   Converting to HTTPS to prevent mixed content errors')
      
      // Auto-convert HTTP to HTTPS for virionlabs.io domain
      if (url.includes('virionlabs.io')) {
        const httpsUrl = url.replace('http://', 'https://')
        console.warn('   Auto-converted to:', httpsUrl)
        return httpsUrl
      }
      
      throw new Error(`Mixed content error: HTTP URL not allowed in production: ${url}`)
    }
  }
  
  return url
}

export function buildApiUrl(baseUrl?: string): string {
  const url = baseUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const validatedUrl = validateApiUrl(url)
  
  // Ensure no trailing slash to avoid FastAPI redirects
  return validatedUrl.endsWith('/') ? validatedUrl.slice(0, -1) : validatedUrl
}

export function logApiConfiguration(): void {
  console.group('🔧 API Configuration Debug')
  console.log('NODE_ENV:', process.env.NODE_ENV)
  console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL)
  console.log('NEXT_PUBLIC_BUSINESS_LOGIC_API_URL:', process.env.NEXT_PUBLIC_BUSINESS_LOGIC_API_URL)
  console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL)
  
  const apiUrl = buildApiUrl()
  console.log('Validated API Base URL:', apiUrl)
  
  if (apiUrl.startsWith('https://')) {
    console.log('✅ Using HTTPS - Mixed content protection active')
  } else if (apiUrl.includes('localhost')) {
    console.log('🔧 Using localhost - Development mode')
  } else {
    console.warn('⚠️  Using HTTP for external API - This may cause mixed content errors!')
  }
  
  console.groupEnd()
}