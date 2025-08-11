"use client"

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { ProtectedRoute } from '@/components/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

type CallbackState = 'loading' | 'success' | 'error'

export default function DiscordCallbackPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [state, setState] = useState<CallbackState>('loading')
  const [message, setMessage] = useState('')
  const [details, setDetails] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      const error = searchParams.get('error')
      const guild_id = searchParams.get('guild_id')
      const permissions = searchParams.get('permissions')

      if (error) {
        setState('error')
        setMessage('Discord Authorization Failed')
        setDetails(`Discord returned an error: ${error}`)
        return
      }

      if (!code || !state) {
        setState('error')
        setMessage('Invalid Callback')
        setDetails('Missing required parameters from Discord')
        return
      }

      try {
        // Call our backend to process the OAuth callback
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const response = await fetch(`${API_BASE_URL}/api/v1/integrations/discord/client/oauth-callback?code=${code}&state=${state}&guild_id=${guild_id || ''}&permissions=${permissions || ''}`)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const result = await response.json()
        
        if (result.success) {
          setState('success')
          setMessage('Discord Bot Installed Successfully!')
          setDetails(result.message || 'Your Discord server is now linked to your account.')
        } else {
          setState('error')
          setMessage('Installation Failed')
          setDetails(result.message || 'Something went wrong during the installation process.')
        }
      } catch (error) {
        console.error('OAuth callback error:', error)
        setState('error')
        setMessage('Installation Failed')
        setDetails('Failed to process the Discord installation. Please try again.')
      }
    }

    handleCallback()
  }, [searchParams])

  const handleContinue = () => {
    router.push('/clients/integrations')
  }

  return (
    <ProtectedRoute allowedRoles={["client", "admin", "platform administrator"]}>
      <DashboardLayout>
        <div className="max-w-2xl mx-auto p-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                {state === 'loading' && (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" />
                    Processing Installation...
                  </>
                )}
                {state === 'success' && (
                  <>
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    {message}
                  </>
                )}
                {state === 'error' && (
                  <>
                    <XCircle className="h-6 w-6 text-red-600" />
                    {message}
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {state === 'loading' && 'Please wait while we set up your Discord integration...'}
                {state === 'success' && 'Your Discord bot has been successfully installed.'}
                {state === 'error' && 'There was an issue with the Discord bot installation.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {details && (
                <div className={`p-4 rounded-lg ${
                  state === 'success' ? 'bg-green-50 border border-green-200' :
                  state === 'error' ? 'bg-red-50 border border-red-200' :
                  'bg-blue-50 border border-blue-200'
                }`}>
                  <p className={`text-sm ${
                    state === 'success' ? 'text-green-800' :
                    state === 'error' ? 'text-red-800' :
                    'text-blue-800'
                  }`}>
                    {details}
                  </p>
                </div>
              )}
              
              {state === 'success' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Next Steps:</h4>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Go to your Discord server</li>
                    <li>Run the command: <code className="px-1 py-0.5 bg-blue-100 rounded">/sync</code></li>
                    <li>Your server data will be synced automatically</li>
                    <li>Check your integrations page to see the connected server</li>
                  </ol>
                </div>
              )}

              {state === 'error' && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">What you can do:</h4>
                  <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                    <li>Return to the integrations page and try installing again</li>
                    <li>Make sure you have admin permissions in your Discord server</li>
                    <li>Contact support if the problem persists</li>
                  </ul>
                </div>
              )}

              <div className="flex justify-center pt-4">
                <Button onClick={handleContinue} disabled={state === 'loading'}>
                  {state === 'loading' ? 'Processing...' : 'Continue to Integrations'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}