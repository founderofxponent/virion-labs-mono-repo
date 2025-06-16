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
import { UserRole } from "@/lib/supabase"
import { toast } from "sonner"

const signupSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type SignupForm = z.infer<typeof signupSchema>

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const { signUp, user, loading } = useAuth()
  const router = useRouter()

  // Redirect authenticated users to dashboard
  useEffect(() => {
    console.log('🔐 SignupPage: Auth state check', { loading, user: !!user })
    if (!loading && user) {
      console.log('🔐 SignupPage: User authenticated, redirecting to dashboard')
      router.replace("/")
    }
  }, [user, loading, router])

  // Debug auth states
  useEffect(() => {
    console.log('🔐 SignupPage: Auth state changed', { 
      authLoading: loading, 
      hasUser: !!user, 
      formLoading: isLoading,
      userEmail: user?.email 
    })
  }, [loading, user, isLoading])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (data: SignupForm) => {
    console.log('🔐 SignupPage: Starting signup process...')
    setIsLoading(true)
    setFormError(null) // Clear any previous errors
    
    try {
      // All signups are for influencers only
      const { error } = await signUp(data.email, data.password, data.fullName, "influencer")
      
      if (error) {
        console.error('🔐 SignupPage: Signup error:', error)
        
        // Handle specific error cases with user-friendly messages
        let errorMessage = "Failed to create account"
        
        if (error.message) {
          const message = error.message.toLowerCase()
          
          if (message.includes("user already registered") || message.includes("already exists") || message.includes("already registered")) {
            errorMessage = "An account with this email already exists. Please sign in instead."
          } else if (message.includes("invalid email")) {
            errorMessage = "Please enter a valid email address."
          } else if (message.includes("password")) {
            if (message.includes("too short") || message.includes("minimum")) {
              errorMessage = "Password must be at least 6 characters long."
            } else if (message.includes("too weak")) {
              errorMessage = "Password is too weak. Please choose a stronger password."
            } else {
              errorMessage = "Password does not meet requirements. Please try a different password."
            }
          } else if (message.includes("rate limit") || message.includes("too many")) {
            errorMessage = "Too many signup attempts. Please wait a moment and try again."
          } else if (message.includes("network") || message.includes("connection")) {
            errorMessage = "Network error. Please check your connection and try again."
          } else {
            // Use the original error message if it's user-friendly
            errorMessage = error.message.length < 100 ? error.message : "Failed to create account"
          }
        }
        
        // Set form error for display in the form
        setFormError(errorMessage)
        
        // Show toast notification
        toast.error(errorMessage)
        
      } else {
        console.log('🔐 SignupPage: Signup successful!')
        // Clear form error on success
        setFormError(null)
        
        // Show success toast
        toast.success("Account created successfully!", {
          description: "Welcome to Virion Labs! You're now logged in.",
        })
        
        // The AuthProvider will handle setting the user state and triggering redirect
        console.log('🔐 SignupPage: Waiting for AuthProvider to handle user state...')
        
        // Fallback redirect if AuthProvider doesn't handle it within 2 seconds
        setTimeout(() => {
          console.log('🔐 SignupPage: Fallback redirect check...')
          if (!user) {
            console.log('🔐 SignupPage: AuthProvider didnt set user, manually redirecting to dashboard')
            router.replace("/")
          } else {
            console.log('🔐 SignupPage: User is set, no manual redirect needed')
          }
        }, 2000)
      }
    } catch (error: any) {
      console.error('🔐 SignupPage: Unexpected error caught:', error)
      
      const errorMessage = "An unexpected error occurred. Please try again."
      setFormError(errorMessage)
      
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render signup form if user is already authenticated (redirect will happen via useEffect)
  if (user) {
    return null
  }

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
            Join as an influencer to get started
          </p>
        </div>

        {/* Signup Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create account</CardTitle>
            <CardDescription>
              Join our influencer referral platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  {...register("fullName")}
                  className={errors.fullName ? "border-destructive" : ""}
                />
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName.message}</p>
                )}
              </div>

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
                    placeholder="Create a password"
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    {...register("confirmPassword")}
                    className={errors.confirmPassword ? "border-destructive pr-10" : "pr-10"}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Form Error Display */}
              {formError && (
                <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive font-medium">{formError}</p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link href="/login" className="font-medium text-primary hover:underline">
                Sign in
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