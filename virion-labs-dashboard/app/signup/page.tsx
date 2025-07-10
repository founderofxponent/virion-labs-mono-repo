"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CheckCircle, Mail, AlertCircle } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'

const signupSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type SignupForm = z.infer<typeof signupSchema>

export default function SignupPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>("")
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const { signUp, user, loading, confirmationPending, resendConfirmation } = useAuth()

  console.log('🔐 SignupPage: Auth state check', { loading, user: !!user, confirmationPending })

  useEffect(() => {
    if (!loading && user) {
      console.log('🔐 SignupPage: User authenticated, redirecting to dashboard')
      router.replace('/dashboard')
    }
  }, [user, loading, router])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (data: SignupForm) => {
    console.log('🔐 SignupPage: Starting signup process...')
    setIsSubmitting(true)
    setError("")
    setShowConfirmation(false)
    
    try {
      // All signups are for influencers only
      const { error, confirmationPending } = await signUp(data.email, data.password, data.fullName, "influencer")
      
      if (error) {
        console.error('🔐 SignupPage: Signup error:', error)
        
        // Handle different types of errors
        let errorMessage = "Failed to create account. Please try again."
        
        if (error.message?.includes("User already registered")) {
          errorMessage = "An account with this email already exists. Please sign in instead."
        } else if (error.message?.includes("Invalid email")) {
          errorMessage = "Please enter a valid email address."
        } else if (error.message?.includes("Password should be at least")) {
          errorMessage = "Password should be at least 6 characters long."
        } else if (error.message?.includes("signup is disabled")) {
          errorMessage = "New signups are currently disabled. Please contact support."
        } else if (error.message?.includes("rate limit")) {
          errorMessage = "Too many signup attempts. Please wait a moment and try again."
        } else if (error.message?.includes("network")) {
          errorMessage = "Network error. Please check your connection and try again."
        } else if (error.message?.includes("duplicate")) {
          errorMessage = "An account with this email already exists. Please sign in instead."
        } else if (error.status === 422) {
          errorMessage = "Invalid email or password format. Please check your details."
        } else if (error.message) {
          // Use the actual error message if it's user-friendly
          errorMessage = error.message
        }
        
        setError(errorMessage)
        return
      }
      
      if (confirmationPending) {
        console.log('🔐 SignupPage: Email confirmation required!')
        setUserEmail(data.email)
        setShowConfirmation(true)
      } else {
        console.log('🔐 SignupPage: Signup successful with immediate access!')
        // User will be redirected by the useEffect above
      }
      
    } catch (error: any) {
      console.error('🔐 SignupPage: Unexpected error caught:', error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendConfirmation = async () => {
    if (!userEmail) return
    
    setIsSubmitting(true)
    setError("")
    
    try {
      const { error } = await resendConfirmation(userEmail)
      
      if (error) {
        setError("Failed to resend confirmation email. Please try again.")
      } else {
        setError("") // Clear any previous errors
        // The confirmation message will remain visible
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Don't render signup form if user is already authenticated (redirect will happen via useEffect)
  if (!loading && user) {
    return null
  }

  // Show email confirmation screen
  if (showConfirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
              <CardDescription>
                We've sent a confirmation link to your email address
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Confirmation Email Sent!</AlertTitle>
                <AlertDescription>
                  Please check your email inbox for <strong>{userEmail}</strong> and click the confirmation link to activate your account.
                </AlertDescription>
              </Alert>
              
              <div className="text-sm text-gray-600 space-y-2">
                <p>Didn't receive the email?</p>
                <ul className="list-disc list-inside space-y-1 text-gray-500">
                  <li>Check your spam/junk folder</li>
                  <li>Make sure the email address is correct</li>
                  <li>Wait a few minutes for the email to arrive</li>
                </ul>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                <Button 
                  onClick={handleResendConfirmation}
                  disabled={isSubmitting}
                  variant="outline"
                  className="w-full"
                >
                  {isSubmitting ? "Sending..." : "Resend Confirmation Email"}
                </Button>
                
                <Button 
                  onClick={() => {
                    setShowConfirmation(false)
                    setError("")
                  }}
                  variant="ghost"
                  className="w-full"
                >
                  Back to Signup
                </Button>
              </div>
              
              <div className="text-center text-sm">
                <span className="text-muted-foreground">Already have an account? </span>
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Create Your Account</CardTitle>
            <CardDescription className="text-center">
              Join Virion Labs as an influencer and start earning from your content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  {...register("fullName")}
                  className="mt-1"
                />
                {errors.fullName && (
                  <p className="text-sm text-red-600 mt-1">{errors.fullName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  {...register("email")}
                  className="mt-1"
                />
                {errors.email && (
                  <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password (min. 6 characters)"
                  {...register("password")}
                  className="mt-1"
                />
                {errors.password && (
                  <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  {...register("confirmPassword")}
                  className="mt-1"
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600 mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Creating Account..." : "Create Account"}
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
      </div>
    </div>
  )
} 