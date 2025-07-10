"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { User } from "@supabase/supabase-js"
import { supabase, UserProfile, UserRole } from "@/lib/supabase"

console.log('🔐 AuthProvider: Module loading, supabase client:', !!supabase)

type AuthContextType = {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  confirmationPending: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<{ error: any; confirmationPending?: boolean }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  resendConfirmation: (email: string) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  console.log('🔐 AuthProvider: Component rendering...')
  
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true) // Start with true, but with aggressive timeouts
  const [initialized, setInitialized] = useState(false)
  const [confirmationPending, setConfirmationPending] = useState(false)

  console.log('🔐 AuthProvider: Current state', { hasUser: !!user, hasProfile: !!profile, loading, initialized, confirmationPending })

  // EMERGENCY: Force loading to false after very short time
  useEffect(() => {
    console.log('🔐 AuthProvider: EMERGENCY TIMEOUT - Setting up 1.5 second force stop')
    const emergencyTimeout = setTimeout(() => {
      console.log('🔐 AuthProvider: ⚠️ EMERGENCY TIMEOUT FIRED - Force setting loading to false')
      setLoading(false)
      setInitialized(true)
    }, 1500) // 1.5 second emergency timeout

    return () => clearTimeout(emergencyTimeout)
  }, [])

  // Helper function to create profile from user data (fallback when no database profile exists)
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

  // Fetch profile from database
  const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data: profileData, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('🔐 AuthProvider: Error fetching profile:', error)
        return null
      }

      return profileData
    } catch (err) {
      console.error('🔐 AuthProvider: Exception fetching profile:', err)
      return null
    }
  }

  // Refresh profile data from database
  const refreshProfile = async () => {
    if (!user?.id) {
      console.log('🔐 AuthProvider: No user ID, cannot refresh profile')
      return
    }

    console.log('🔐 AuthProvider: Refreshing profile for user:', user.id)
    const profileData = await fetchProfile(user.id)
    if (profileData) {
      console.log('🔐 AuthProvider: Profile refreshed successfully:', { 
        id: profileData.id, 
        full_name: profileData.full_name, 
        avatar_url: profileData.avatar_url 
      })
      setProfile(profileData)
    } else {
      console.log('🔐 AuthProvider: Failed to refresh profile, no data returned')
    }
  }

  useEffect(() => {
    if (initialized) return // Don't run if already initialized

    console.log('🔐 AuthProvider: useEffect STARTING auth check...')
    let authCheckCompleted = false

    const completeAuthCheck = () => {
      if (authCheckCompleted) return
      authCheckCompleted = true
      console.log('🔐 AuthProvider: ✅ Auth check completed - setting loading false')
      setLoading(false)
      setInitialized(true)
    }

    // Backup timeout to ensure auth check completes
    const backupTimeout = setTimeout(() => {
      console.log('🔐 AuthProvider: ⏰ Backup timeout - completing auth check')
      completeAuthCheck()
    }, 1000)

    // Get session from localStorage (fast, no network call)
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        console.log('🔐 AuthProvider: Session check result', { 
          hasSession: !!session, 
          error: !!error
        })
        
        if (error) {
          console.error('🔐 AuthProvider: Session error:', error)
          setUser(null)
          setProfile(null)
          completeAuthCheck()
          return
        }
        
        if (session?.user) {
          console.log('🔐 AuthProvider: ✅ User session found')
          setUser(session.user)
          
          // Always create profile from user metadata first
          const userProfile = createProfileFromUser(session.user)
          setProfile(userProfile)
          
          // Complete auth check immediately for any user
          completeAuthCheck()
          
          // Always try to fetch database profile (non-blocking)
          console.log('🔐 AuthProvider: 📊 Fetching database profile (background)')
          fetchProfile(session.user.id).then(profileData => {
            if (profileData) {
              console.log('🔐 AuthProvider: 📊 Database profile loaded')
              setProfile(profileData)
            }
          }).catch(err => {
            console.error('🔐 AuthProvider: Database profile fetch failed (non-critical):', err)
          })
        } else {
          console.log('🔐 AuthProvider: ❌ No user session')
          setUser(null)
          setProfile(null)
          completeAuthCheck()
        }
      })
      .catch(err => {
        console.error('🔐 AuthProvider: Failed to get session:', err)
        setUser(null)
        setProfile(null)
        completeAuthCheck()
      })

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 AuthProvider: 🔄 Auth state changed', { 
        event, 
        hasSession: !!session,
        userEmail: session?.user?.email
      })
      
      if (session?.user) {
        console.log('🔐 AuthProvider: ✅ User authenticated via auth state change')
        setUser(session.user)
        setLoading(false) // Ensure loading is false when user is authenticated
        setInitialized(true) // Mark as initialized when we have a user
        
        // Always create profile from user metadata
        const userProfile = createProfileFromUser(session.user)
        setProfile(userProfile)
        
        // Always try to fetch database profile (non-blocking)
        console.log('🔐 AuthProvider: 📊 Fetching database profile (background)')
        fetchProfile(session.user.id).then(profileData => {
          if (profileData) {
            console.log('🔐 AuthProvider: 📊 Database profile loaded')
            setProfile(profileData)
          }
        }).catch(err => {
          console.error('🔐 AuthProvider: Database profile fetch failed (non-critical):', err)
        })
      } else {
        console.log('🔐 AuthProvider: ❌ User logged out via auth state change')
        setUser(null)
        setProfile(null)
        setLoading(false) // Ensure loading is false when no user
        // Don't set initialized to true here on logout, let the initial check handle it
      }
    })

    return () => {
      clearTimeout(backupTimeout)
      subscription.unsubscribe()
    }
  }, [initialized])

  const signIn = async (email: string, password: string) => {
    console.log('🔐 AuthProvider: Starting login...')
    setLoading(true)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    console.log('🔐 AuthProvider: Login result', { 
      hasUser: !!data?.user, 
      hasSession: !!data?.session,
      error: !!error,
      userEmail: data?.user?.email
    })
    
    // If login was successful and we have a session
    if (!error && data?.session?.user) {
      console.log('🔐 AuthProvider: ✅ Login successful with session - updating state immediately')
      setUser(data.session.user)
      setLoading(false)
      setInitialized(true)
      
      // Create profile from user metadata
      const userProfile = createProfileFromUser(data.session.user)
      setProfile(userProfile)
      
      // Try to fetch database profile (non-blocking)
      fetchProfile(data.session.user.id).then(profileData => {
        if (profileData) {
          console.log('🔐 AuthProvider: 📊 Database profile loaded after login')
          setProfile(profileData)
        }
      }).catch(err => {
        console.error('🔐 AuthProvider: Database profile fetch failed after login (non-critical):', err)
      })
    } else if (error) {
      console.error('🔐 AuthProvider: ❌ Login failed:', error)
      setLoading(false)
    }
    
    return { error }
  }

  const signUp = async (email: string, password: string, fullName: string, role: UserRole) => {
    console.log('🔐 AuthProvider: Starting signup...')
    setLoading(true)
    setConfirmationPending(false)
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    })
    
    console.log('🔐 AuthProvider: Signup result', { 
      hasUser: !!data?.user, 
      hasSession: !!data?.session,
      error: !!error,
      userEmail: data?.user?.email,
      emailConfirmed: data?.user?.email_confirmed_at
    })
    
    // If signup was successful and we have a session (email already confirmed or confirmation disabled)
    if (!error && data?.session?.user) {
      console.log('🔐 AuthProvider: ✅ Signup successful with immediate session - updating state immediately')
      setUser(data.session.user)
      setLoading(false)
      setInitialized(true)
      setConfirmationPending(false)
      
      // Create profile from user metadata
      const userProfile = createProfileFromUser(data.session.user)
      setProfile(userProfile)
      
      // Try to fetch database profile (non-blocking)
      fetchProfile(data.session.user.id).then(profileData => {
        if (profileData) {
          console.log('🔐 AuthProvider: 📊 Database profile loaded after signup')
          setProfile(profileData)
        }
      }).catch(err => {
        console.error('🔐 AuthProvider: Database profile fetch failed after signup (non-critical):', err)
      })
      
      return { error: null, confirmationPending: false }
    } else if (!error && data?.user && !data?.session) {
      console.log('🔐 AuthProvider: ✅ User created but no session - email confirmation required')
      setLoading(false)
      setConfirmationPending(true)
      return { error: null, confirmationPending: true }
    } else if (error) {
      console.error('🔐 AuthProvider: ❌ Signup failed:', error)
      setLoading(false)
      setConfirmationPending(false)
      return { error, confirmationPending: false }
    }
    
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

  const resendConfirmation = async (email: string) => {
    setLoading(true)
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email
    })
    setLoading(false)
    return { error }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, confirmationPending, signIn, signUp, signOut, refreshProfile, resendConfirmation }}>
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