"use client"

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { handleAuthCallback } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const hasBeenCalled = useRef(false);

  useEffect(() => {
    if (hasBeenCalled.current) {
      return;
    }
    hasBeenCalled.current = true;

    const code = searchParams.get('code');
    if (code) {
      handleAuthCallback(code)
        .then(() => {
          router.replace('/?login=success'); // Redirect to dashboard
        })
        .catch((err) => {
          setError(err.message || 'An unknown error occurred during authentication.');
        });
    } else {
      setError('Authorization code not found. Please try logging in again.');
    }
  }, [searchParams, router, handleAuthCallback]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 text-center">
            <h2 className="text-2xl font-bold text-red-600">Authentication Failed</h2>
            <p className="text-red-500">{error}</p>
            <button onClick={() => router.replace('/login')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
              Try Again
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
              <p className="text-center text-gray-600">Finalizing authentication, please wait...</p>
            </CardContent>
          </Card>
        </div>
      </div>
  );
}
