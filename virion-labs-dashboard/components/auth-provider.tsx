"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { User } from "@supabase/supabase-js"
import { supabase, UserProfile, UserRole } from "@/lib/supabase"

console.log('🔐 AuthProvider: Module loading, supabase client:', !!supabase)

type AuthContextType = {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  console.log('🔐 AuthProvider: Component rendering...')
  
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  console.log('🔐 AuthProvider: Current state', { hasUser: !!user, hasProfile: !!profile, loading })

  // Helper function to create profile from user data (no network call needed!)
  const createProfileFromUser = (user: User): UserProfile => {
    return {
      id: user.id,
      email: user.email || 'user@example.com',
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      avatar_url: user.user_metadata?.avatar_url || null,
      role: (user.user_metadata?.role as UserRole) || 'influencer',
      created_at: user.created_at,
      updated_at: user.updated_at || user.created_at
    }
  }

  useEffect(() => {
    console.log('🔐 AuthProvider: useEffect STARTING...')

    // Get session from localStorage (fast, no network call)
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('🔐 AuthProvider: Session check', { hasSession: !!session, error })
      
      if (error) {
        console.error('🔐 AuthProvider: Session error:', error)
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }
      
      if (session?.user) {
        console.log('🔐 AuthProvider: Session found, creating profile from session data (no network call)')
        setUser(session.user)
        // Create profile directly from session data - no network call needed!
        setProfile(createProfileFromUser(session.user))
        setLoading(false)
      } else {
        console.log('🔐 AuthProvider: No session found')
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    }).catch(err => {
      console.error('🔐 AuthProvider: Failed to get session:', err)
      setUser(null)
      setProfile(null)
      setLoading(false)
    })

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 AuthProvider: Auth state changed', { event, hasSession: !!session })
      
      if (session?.user) {
        setUser(session.user)
        // Create profile directly from session data - no network call needed!
        setProfile(createProfileFromUser(session.user))
      } else {
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    // Auth state change listener will handle setting user, profile and loading state
    if (error) setLoading(false)
    return { error }
  }

  const signUp = async (email: string, password: string, fullName: string, role: UserRole) => {
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    })
    // Auth state change listener will handle setting user, profile and loading state
    if (error) setLoading(false)
    return { error }
  }

  const signOut = async () => {
    console.log('🔐 AuthProvider: Signing out...')
    setUser(null)
    setProfile(null)
    await supabase.auth.signOut()
    setLoading(false)
    console.log('🔐 AuthProvider: Signed out successfully.')
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
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