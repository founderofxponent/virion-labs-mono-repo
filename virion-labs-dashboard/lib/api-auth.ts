import { supabase } from '@/lib/supabase'
import { verifyApiKey } from '@/lib/api-keys'

export interface ApiKeyValidationResult {
  valid: boolean
  userId?: string
  keyType?: 'live' | 'test'
  error?: string
}

// Validate an API key and return user information
export async function validateApiKey(apiKey: string): Promise<ApiKeyValidationResult> {
  try {
    // Extract the key type from prefix
    const keyType = apiKey.startsWith('sk_live_') ? 'live' : 
                   apiKey.startsWith('sk_test_') ? 'test' : null

    if (!keyType) {
      return {
        valid: false,
        error: 'Invalid API key format'
      }
    }

    // Get all user settings with API keys
    const { data: userSettings, error } = await supabase
      .from('user_settings')
      .select('user_id, api_key, api_key_test')
      .not(keyType === 'live' ? 'api_key' : 'api_key_test', 'is', null)

    if (error) {
      console.error('Error fetching user settings:', error)
      return {
        valid: false,
        error: 'Database error'
      }
    }

    // Check each user's hashed key
    for (const settings of userSettings) {
      const hashedKey = keyType === 'live' ? settings.api_key : settings.api_key_test
      
      if (hashedKey && await verifyApiKey(apiKey, hashedKey)) {
        return {
          valid: true,
          userId: settings.user_id,
          keyType
        }
      }
    }

    return {
      valid: false,
      error: 'Invalid API key'
    }
  } catch (error) {
    console.error('Error validating API key:', error)
    return {
      valid: false,
      error: 'Validation error'
    }
  }
}

// Middleware function for API route protection
export async function requireApiKey(request: Request): Promise<ApiKeyValidationResult> {
  const authHeader = request.headers.get('Authorization')
  
  if (!authHeader) {
    return {
      valid: false,
      error: 'Missing Authorization header'
    }
  }

  const [bearer, apiKey] = authHeader.split(' ')
  
  if (bearer !== 'Bearer' || !apiKey) {
    return {
      valid: false,
      error: 'Invalid Authorization header format. Use: Bearer sk_live_... or Bearer sk_test_...'
    }
  }

  return await validateApiKey(apiKey)
}

// Rate limiting helper (basic implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(userId: string, limit: number = 100, windowMs: number = 3600000): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(userId)

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (userLimit.count >= limit) {
    return false
  }

  userLimit.count++
  return true
} 