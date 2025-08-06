"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../../../components/auth-provider'

export default function EmailConfirmPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [error, setError] = useState<string>("")

  useEffect(() => {
    // Check if there's a hash fragment with token info
    const hash = window.location.hash
    
    if (hash) {
      // Parse the hash for confirmation tokens
      const params = new URLSearchParams(hash.substring(1))
      const type = params.get('type')
      const access_token = params.get('access_token')
      
      if (type === 'signup' && access_token) {
        // Token is present, verification was successful
        setVerificationStatus('success')
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.replace('/dashboard')
        }, 3000)
      } else {
        setVerificationStatus('error')
        setError('Invalid confirmation link. Please try signing up again.')
      }
    } else {
      // No token in URL - check if user is already authenticated
      if (!loading && user) {
        // User is already verified and logged in
        router.replace('/dashboard')
      } else if (!loading) {
        // No hash and no user - invalid confirmation
        setVerificationStatus('error')
        setError('Invalid confirmation link. Please try signing up again.')
      }
    }
  }, [loading, user, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
              <p className="text-center text-gray-600">Loading...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (verificationStatus === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
              <p className="text-center text-gray-600">Verifying your email...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (verificationStatus === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold">Verification Failed</CardTitle>
              <CardDescription>
                There was a problem verifying your email address
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Verification Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              
              <div className="space-y-3">
                <Button asChild className="w-full">
                  <Link href="/signup">
                    Try Signing Up Again
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="w-full">
                  <Link href="/login">
                    Already have an account? Sign In
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Success case
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Email Verified!</CardTitle>
            <CardDescription>
              Your account has been successfully verified
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Welcome to Virion Labs!</AlertTitle>
              <AlertDescription>
                Your email has been verified and your account is now active. You'll be redirected to your dashboard shortly.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/dashboard">
                  Go to Dashboard
                </Link>
              </Button>
              
              <div className="text-center text-sm text-gray-600">
                <p>Redirecting automatically in a few seconds...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 