"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Eye, EyeOff } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/auth-provider"
import { toast } from "sonner"


const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [forceNoLoading, setForceNoLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const { signIn, user, loading } = useAuth()
  const router = useRouter()

  console.log('🚨 LoginPage: Render with state', { 
    loading, 
    forceNoLoading, 
    hasUser: !!user,
    showLoading: loading && !forceNoLoading 
  })

  // EMERGENCY: Force loading to stop after 2 seconds no matter what
  useEffect(() => {
    console.log('🚨 LoginPage: Setting emergency timeout')
    const emergencyTimeout = setTimeout(() => {
      console.log('🚨 LoginPage: EMERGENCY TIMEOUT - Force stopping loading')
      setForceNoLoading(true)
    }, 2000)

    return () => clearTimeout(emergencyTimeout)
  }, [])

  // Redirect authenticated users to dashboard
  useEffect(() => {
    console.log('🔐 LoginPage: Auth state check', { 
      loading, 
      hasUser: !!user,
      shouldRedirect: !loading && user 
    })
    
    if (!loading && user) {
      console.log('🔐 LoginPage: User authenticated, redirecting to dashboard')
      router.replace("/")
    }
  }, [user, loading, router])

  // Debug auth states
  useEffect(() => {
    console.log('🔐 LoginPage: Auth state changed', { 
      authLoading: loading, 
      hasUser: !!user, 
      formLoading: isLoading,
      userEmail: user?.email 
    })
  }, [loading, user, isLoading])

  console.log('🚨 LoginPage: Before rendering decision', {
    loading,
    forceNoLoading, 
    hasUser: !!user,
    willShowLoading: loading && !forceNoLoading,
    willShowForm: !loading || forceNoLoading
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    setFormError(null) // Clear any previous errors
    
    try {
      const { error } = await signIn(data.email, data.password)
      
      if (error) {
        console.error('🔐 LoginPage: Login error:', error)
        
        // Handle specific error cases with user-friendly messages
        let errorMessage = "Failed to sign in"
        
        if (error.message) {
          const message = error.message.toLowerCase()
          
          if (message.includes("invalid login credentials") || message.includes("invalid email or password")) {
            errorMessage = "Invalid email or password. Please check your credentials and try again."
          } else if (message.includes("email not confirmed")) {
            errorMessage = "Email not confirmed. Please check your email and click the confirmation link."
          } else if (message.includes("user not found") || message.includes("no user found")) {
            errorMessage = "No account found with this email. Please check your email or create a new account."
          } else if (message.includes("too many requests") || message.includes("rate limit")) {
            errorMessage = "Too many login attempts. Please wait a moment and try again."
          } else if (message.includes("network") || message.includes("connection")) {
            errorMessage = "Network error. Please check your connection and try again."
          } else if (message.includes("invalid email")) {
            errorMessage = "Invalid email format. Please enter a valid email address."
          } else {
            // Use the original error message if it's user-friendly
            errorMessage = error.message.length < 100 ? error.message : "Failed to sign in"
          }
        }
        
        // Set form error for display in the form
        setFormError(errorMessage)
        
        // Show toast notification
        toast.error(errorMessage)
        
      } else {
        console.log('🔐 LoginPage: Login successful!')
        toast.success("Welcome back!")
        // The AuthProvider will handle setting the user state and triggering redirect via useEffect
        console.log('🔐 LoginPage: Waiting for AuthProvider to update auth state...')
      }
    } catch (error: any) {
      console.error('🔐 LoginPage: Unexpected error:', error)
      
      const errorMessage = "An unexpected error occurred. Please try again."
      setFormError(errorMessage)
      
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state ONLY when we don't know the user state yet
  if (loading && !forceNoLoading && !user) {
    console.log('🚨 LoginPage: SHOWING LOADING SCREEN (checking auth state)')
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render login form if user is already authenticated (redirect will happen via useEffect)
  if (user) {
    console.log('🚨 LoginPage: User authenticated, returning null (should redirect)')
    return null
  }

  console.log('🚨 LoginPage: SHOWING LOGIN FORM')

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 font-semibold text-2xl">
            <Image 
              src="/virion-labs-logo-black.png" 
              alt="Virion Labs" 
              width={32} 
              height={32}
              className="h-8 w-8 object-contain"
            />
            <span>Virion Labs</span>
          </Link>
          <p className="text-muted-foreground">
            Sign in to your account to continue
          </p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  {...register("email")}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    {...register("password")}
                    className={errors.password ? "border-destructive pr-10" : "pr-10"}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              {/* Form Error Display */}
              {formError && (
                <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive font-medium">{formError}</p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link href="/signup" className="font-medium text-primary hover:underline">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>© 2024 Virion Labs. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
} 