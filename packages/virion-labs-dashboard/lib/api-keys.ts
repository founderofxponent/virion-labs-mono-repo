import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

// Generate a secure API key
export function generateApiKey(prefix: 'sk_live' | 'sk_test' = 'sk_live'): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = prefix + '_'
  
  // Generate 32 character random string
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return result
}

// Hash API key for secure storage
export async function hashApiKey(apiKey: string): Promise<string> {
  const saltRounds = 12 // Higher salt rounds for better security
  return await bcrypt.hash(apiKey, saltRounds)
}

// Verify API key against stored hash
export async function verifyApiKey(apiKey: string, hashedKey: string): Promise<boolean> {
  return await bcrypt.compare(apiKey, hashedKey)
}

// Generate both live and test API keys for a user
export async function generateUserApiKeys(userId: string): Promise<{ liveKey: string; testKey: string } | null> {
  try {
    const liveKey = generateApiKey('sk_live')
    const testKey = generateApiKey('sk_test')
    
    // Hash the keys before storing
    const hashedLiveKey = await hashApiKey(liveKey)
    const hashedTestKey = await hashApiKey(testKey)
    
    const { error } = await supabase
      .from('user_settings')
      .update({
        api_key: hashedLiveKey,
        api_key_test: hashedTestKey,
        api_key_regenerated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
    
    if (error) {
      console.error('Error updating API keys:', error)
      return null
    }
    
    // Return the unhashed keys for the user to copy
    return { liveKey, testKey }
  } catch (error) {
    console.error('Error generating API keys:', error)
    return null
  }
}

// Generate a display-safe version of the API key (show only first 8 and last 4 characters)
export function createApiKeyDisplay(apiKey: string): string {
  if (apiKey.length < 12) return '••••••••••••••••••••••••••••••••'
  
  const prefix = apiKey.substring(0, 8)
  const suffix = apiKey.substring(apiKey.length - 4)
  const middle = '•'.repeat(apiKey.length - 12)
  
  return `${prefix}${middle}${suffix}`
} 