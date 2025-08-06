"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

export default function LoginPage() {
  const { signInWithGoogle, user, loading } = useAuth()
  const router = useRouter()

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.replace("/")
    }
  }, [user, loading, router])

  const handleGoogleLogin = () => {
    try {
      signInWithGoogle()
    } catch (error) {
      toast.error("Failed to start Google sign-in.")
    }
  }

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

  // Don't render login form if user is already authenticated (redirect will happen via useEffect)
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
            Sign in to your account to continue
          </p>
        </div>

        {/* Login Options */}
        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>
              Sign in using your Google account to access the dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleGoogleLogin} className="w-full" disabled={loading}>
              {loading ? "Redirecting..." : "Sign in with Google"}
            </Button>
            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Need an account? </span>
              <Link href="#" className="font-medium text-primary hover:underline" onClick={(e) => {e.preventDefault(); toast.info("Please contact an administrator to get an account.")}}>
                Request Access
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>© 2025 Virion Labs. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
 