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
  role: string
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
    // Determine the role based on the name provided by the API.
    // If the role is the generic 'Authenticated', we default to 'influencer' for the dashboard view.
    // Specific roles like 'Platform Administrator' will be preserved.
    const role = user.role === 'Authenticated' ? 'influencer' : user.role || 'influencer';
    
    const profile = {
      id: user.id,
      email: user.email,
      full_name: user.full_name || user.email?.split('@')[0] || 'User',
      avatar_url: user.avatar_url || null,
      role: role,
    };
    console.log("Created profile object:", profile); // Log the created profile
    return profile;
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
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      getUser()
    } else {
      setLoading(false)
    }
  }, [getUser])

  const signInWithGoogle = useCallback(() => {
    setLoading(true)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const callbackUrl = `${window.location.origin}/auth/callback`
    // Redirect to the business logic API for Google login
    window.location.href = `${apiUrl}/api/auth/login/google?redirect_uri=${encodeURIComponent(callbackUrl)}`
  }, [])

  const handleAuthCallback = useCallback(async (code: string) => {
    try {
      setLoading(true)
      // Exchange the code for a token
      const response = await api.post('/api/auth/token', new URLSearchParams({
        code: code,
        grant_type: 'authorization_code' // Not strictly needed by our endpoint, but good practice
      }), {
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

      // Set the token for future API requests
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`

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
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, handleAuthCallback, signOut, signIn, signUp }}>
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