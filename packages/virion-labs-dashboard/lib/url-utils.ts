/**
 * URL utilities for handling domain configuration across environments
 */

/**
 * Get the base URL for the application
 * Uses NEXT_PUBLIC_APP_URL if set, otherwise falls back to localhost in development
 */
export function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  
  // Fallback for development
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000'
  }
  
  // This should not happen in production - environment variable should be set
  throw new Error('NEXT_PUBLIC_APP_URL must be set in production')
}

/**
 * Get the domain for referral links
 * Uses NEXT_PUBLIC_REFERRAL_DOMAIN if set, otherwise uses the main app URL
 */
export function getReferralDomain(): string {
  if (process.env.NEXT_PUBLIC_REFERRAL_DOMAIN) {
    return process.env.NEXT_PUBLIC_REFERRAL_DOMAIN
  }
  
  return getAppUrl()
}

/**
 * Generate a referral URL for a given code
 * @param code The referral code
 * @returns The complete referral URL
 */
export function generateReferralUrl(code: string): string {
  const domain = getReferralDomain()
  // Ensure domain doesn't end with slash and code doesn't start with slash
  const cleanDomain = domain.replace(/\/$/, '')
  const cleanCode = code.replace(/^\//, '')
  
  return `${cleanDomain}/r/${cleanCode}`
}

/**
 * Generate a referral code from a title
 * @param title The link title
 * @returns A unique referral code
 */
export function generateReferralCode(title: string): string {
  const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  return `${cleanTitle}-${randomSuffix}`
}

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig() {
  return {
    appUrl: getAppUrl(),
    referralDomain: getReferralDomain(),
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
  }
} 