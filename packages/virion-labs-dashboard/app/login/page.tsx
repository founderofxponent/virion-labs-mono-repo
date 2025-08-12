"use client"

import { useEffect } from "react"
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
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 font-semibold text-2xl">
            <Image src="/virion-labs-logo-black.png" alt="Virion Labs" width={32} height={32} className="h-8 w-8 object-contain" />
            <span>Virion Labs</span>
          </Link>
          <p className="text-muted-foreground">Sign in to your Creator account</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Creator Login</CardTitle>
            <CardDescription>Sign in with Google</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleGoogleLogin} className="w-full" disabled={loading}>
              {loading ? "Redirecting..." : "Sign in with Google"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Are you a business? <Link href="/work-with-us" className="underline">Work with us</Link>
            </p>
          </CardContent>
        </Card>
        <div className="text-center text-sm text-muted-foreground">
          <p>© 2025 Virion Labs. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
 