"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { toast } from "sonner"
import Cookies from "js-cookie"

// Simplified User and Profile types, no longer tied to Supabase
export type User = {
  id: number
  email: string
  [key: string]: any // Allow other properties from JWT/API
}

export type UserProfile = {
  id: number
  email: string
  full_name: string
  avatar_url: string | null
  role: string | { name: string } | null
  created_at?: string
  updated_at?: string
}

type AuthContextType = {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signInWithGoogle: () => void
  handleAuthCallback: (code: string) => Promise<void>
  signOut: () => Promise<void>
  getUser: () => Promise<void>
  // Deprecated functions
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, fullName: string, role: string) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const createProfileFromUser = (user: User): UserProfile => {
    const rawRole = typeof user.role === 'object' ? (user.role as any)?.name : user.role

    // If the API provides a role string, normalize it.
    if (rawRole && typeof rawRole === 'string') {
      const normalizedRole = rawRole.toLowerCase()
      const profile = {
        id: user.id,
        email: user.email,
        full_name: user.full_name || user.email?.split('@')[0] || 'User',
        avatar_url: user.avatar_url || null,
        role: normalizedRole,
      }
      console.log("Created profile object (from explicit role):", profile)
      return profile
    }

    // Heuristic detection when role is null/undefined in the API response.
    // Look for common client/admin indicators returned by the API.
    const looksLikeClient =
      Boolean((user as any).client_id) ||
      Boolean((user as any).client) ||
      (Array.isArray((user as any).clients) && (user as any).clients.length > 0) ||
      Boolean((user as any).is_client)

    const looksLikeAdmin =
      Boolean((user as any).is_admin) ||
      Boolean((user as any).is_platform_admin) ||
      (Array.isArray((user as any).permissions) && (user as any).permissions.includes('manage_users')) ||
      (typeof (user as any).role === 'string' && (user as any).role?.toLowerCase()?.includes('admin'))

    // Default to 'client' when ambiguous to avoid mistakenly showing influencer dashboard
    const guessedRole = looksLikeClient ? 'client' : looksLikeAdmin ? 'admin' : 'client'

    const profile = {
      id: user.id,
      email: user.email,
      full_name: user.full_name || user.email?.split('@')[0] || 'User',
      avatar_url: user.avatar_url || null,
      role: guessedRole,
    }
    console.log("Created profile object (guessed role):", profile) // Log the created profile
    console.log("Raw role from API (was null/undefined):", user.role) // Debug the raw role
    console.log("Heuristics -> looksLikeClient:", looksLikeClient, "looksLikeAdmin:", looksLikeAdmin)
    return profile
  }

  const getUser = useCallback(async () => {
    try {
      console.log("Fetching user from /api/auth/me...");
      const { data: userData } = await api.get('/api/auth/me');
      console.log("Received user data from API:", userData); // Log the raw user data
      if (userData) {
        setUser(userData)
        setProfile(createProfileFromUser(userData))
      } else {
        // Token is invalid or expired
        localStorage.removeItem('auth_token')
        Cookies.remove('auth_token')
        setUser(null)
        setProfile(null)
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      // Token is invalid or expired
      localStorage.removeItem('auth_token')
      Cookies.remove('auth_token')
      setUser(null)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const token = Cookies.get('auth_token');
    if (token) {
      // Sync cookie to localStorage for client-side access
      localStorage.setItem('auth_token', token);
      // The interceptor in lib/api.ts will handle attaching the token.
      getUser()
    } else {
      setLoading(false)
    }
  }, []) // Remove getUser dependency to prevent re-triggering

  const signInWithGoogle = useCallback(() => {
    setLoading(true)
    const startPkceOAuth = async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const callbackUrl = `${window.location.origin}/auth/callback`

      // Generate PKCE code_verifier and code_challenge (S256)
      const generateCodeVerifier = (length = 64) => {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
        const randomValues = new Uint8Array(length)
        window.crypto.getRandomValues(randomValues)
        let verifier = ''
        for (let i = 0; i < randomValues.length; i++) {
          verifier += charset[randomValues[i] % charset.length]
        }
        return verifier
      }

      const base64UrlEncode = (arrayBuffer: ArrayBuffer) => {
        const bytes = new Uint8Array(arrayBuffer)
        let binary = ''
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i])
        }
        return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
      }

      const generateCodeChallenge = async (verifier: string) => {
        const encoder = new TextEncoder()
        const data = encoder.encode(verifier)
        const digest = await window.crypto.subtle.digest('SHA-256', data)
        return base64UrlEncode(digest)
      }

      const codeVerifier = generateCodeVerifier(64)
      const codeChallenge = await generateCodeChallenge(codeVerifier)

      // Store verifier (and optional state) in sessionStorage for the callback step
      sessionStorage.setItem('pkce_code_verifier', codeVerifier)
      const state = (window.crypto as any)?.randomUUID?.() ?? Math.random().toString(36).slice(2)
      sessionStorage.setItem('oauth_state', state)

      // Begin OAuth via our Authorization Endpoint (stores cookies server-side)
      const authorizeUrl = `${apiUrl}/api/auth/authorize?response_type=code&provider=google&redirect_uri=${encodeURIComponent(
        callbackUrl
      )}&state=${encodeURIComponent(state)}&code_challenge=${encodeURIComponent(codeChallenge)}&code_challenge_method=S256`

      window.location.href = authorizeUrl
    }

    startPkceOAuth().catch(() => setLoading(false))
  }, [])

  const handleAuthCallback = useCallback(async (code: string) => {
    try {
      setLoading(true)
      // Retrieve PKCE verifier stored before redirect
      const codeVerifier = sessionStorage.getItem('pkce_code_verifier')
      if (!codeVerifier) {
        throw new Error('Missing PKCE verifier. Please try logging in again.')
      }

      // Exchange the code for a token (PKCE)
      const response = await api.post('/api/auth/token', new URLSearchParams({
        code,
        code_verifier: codeVerifier,
        grant_type: 'authorization_code'
      }) as any, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })

      const { access_token } = response.data
      if (!access_token) {
        throw new Error('Failed to retrieve access token.')
      }

      // Store the token in localStorage and a cookie
      localStorage.setItem('auth_token', access_token)
      Cookies.set('auth_token', access_token, { expires: 7, secure: process.env.NODE_ENV === 'production' })

      // Cleanup ephemeral items
      sessionStorage.removeItem('pkce_code_verifier')
      sessionStorage.removeItem('oauth_state')

      // The interceptor in lib/api.ts will now handle attaching the token.

      // Fetch the user profile
      await getUser()
      toast.success("Successfully authenticated!")
    } catch (error: any) {
      toast.error(error.response?.data?.detail || error.message || "Authentication failed.")
      // Ensure user is logged out
      setUser(null)
      setProfile(null)
      localStorage.removeItem('auth_token')
      Cookies.remove('auth_token')
      throw error
    } finally {
      setLoading(false)
    }
  }, [getUser])

  const signOut = useCallback(async () => {
    setUser(null)
    setProfile(null)
    localStorage.removeItem('auth_token')
    Cookies.remove('auth_token')
    delete api.defaults.headers.common['Authorization']
    toast.info("You have been signed out.")
    router.push('/login')
  }, [router])

  // --- Deprecated Functions ---
  const signIn = async (email: string, password: string) => {
    toast.error("Email/Password login is not supported with the new API yet.")
    return { error: { message: "Not implemented" } }
  }

  const signUp = async (email: string, password: string, fullName: string, role: string) => {
    toast.error("Sign up is not supported with the new API yet.")
    return { error: { message: "Not implemented" } }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, handleAuthCallback, signOut, getUser, signIn, signUp }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}