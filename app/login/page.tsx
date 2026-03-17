'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Script from 'next/script';

declare global {
  interface Window {
    google?: any;
  }
}

export default function LoginPage() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setSuccess('Portal created successfully! Please login.');
    }
  }, [searchParams]);

  const handleGoogleResponse = useCallback(async (response: any) => {
    if (!auth || !auth.loginWithGoogle) {
      setError('Authentication system not ready');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const success = await auth.loginWithGoogle(response.credential);
      
      if (success) {
        router.push('/dashboard');
      } else {
        setError('Google authentication failed');
        setLoading(false);
      }
    } catch (err) {
      console.error('Google auth error:', err);
      setError('Failed to authenticate with Google');
      setLoading(false);
    }
  }, [auth, router]);

  // Initialize Google Sign-In
  useEffect(() => {
    if (googleLoaded && window.google && auth) {
      try {
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        
        if (!clientId) {
          console.error('Google Client ID not found in environment variables');
          setError('Google Sign-In configuration error');
          return;
        }

        console.log('Initializing Google Sign-In...');
        
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleResponse,
        });

        const buttonDiv = document.getElementById('googleSignInButton');
        if (buttonDiv) {
          window.google.accounts.id.renderButton(
            buttonDiv,
            {
              theme: 'outline',
              size: 'large',
              width: '100%',
              text: 'signin_with',
              shape: 'rectangular',
            }
          );
          console.log('Google Sign-In button rendered successfully');
        } else {
          console.error('Google Sign-In button container not found');
        }
      } catch (error) {
        console.error('Google Sign-In initialization error:', error);
        setError('Failed to initialize Google Sign-In');
      }
    }
  }, [googleLoaded, auth, handleGoogleResponse]);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        onLoad={() => setGoogleLoaded(true)}
        strategy="afterInteractive"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
      </div>

      <Card className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border-slate-800 relative z-10">
        <CardHeader className="space-y-4">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to home</span>
          </Link>
          
          <div className="text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-white">Welcome Back</CardTitle>
            <p className="text-slate-400 mt-2">Login to your secure portal</p>
          </div>
        </CardHeader>

        <CardContent>
          {/* Google Sign-In Button */}
          <div className="mb-6">
            <div 
              id="googleSignInButton" 
              className="w-full flex justify-center"
            ></div>
          </div>

          {success && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
              {success}
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mt-4">
              {error}
            </div>
          )}

          <div className="mt-6 p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
            <p className="text-xs text-slate-400 text-center mb-2">
              🔐 Secure Authentication
            </p>
            <p className="text-xs text-slate-500 text-center">
              Sign in with your Google account to access your secure portal
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
