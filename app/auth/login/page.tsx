'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) return;
    setIsLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      if (authData?.user) {
        // Fetch role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.user.id)
          .single();
          
        if (profile?.role === 'admin') {
          router.push('/admin');
        } else if (profile?.role === 'worker') {
          router.push('/worker');
        } else {
          router.push('/');
        }
      } else {
        router.push('/');
      }
    } catch (error: any) {
      console.error('Login error full object:', error);
      
      let errorMessage = error?.message || 'An unknown error occurred';
      
      // Specifically catch the AuthRetryableFetchError / Failed to fetch
      if (errorMessage.includes('Failed to fetch')) {
        errorMessage = 'Network error: Cannot reach the authentication server. Please check your internet connection, ensure the Supabase URL is correct in your .env.local file, and verify no ad-blockers are blocking the request.';
      }
      
      alert('Login error: ' + errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!email || !password) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      
      alert('Signup successful! You can now log in.');
    } catch (error: any) {
      console.error('Signup error full object:', error);
      
      let errorMessage = error?.message || 'An unknown error occurred';
      
      if (errorMessage.includes('Failed to fetch')) {
        errorMessage = 'Network error: Cannot reach the authentication server. Please check your internet connection or .env.local configuration.';
      }
      
      alert('Signup error: ' + errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md p-8 shadow-md">
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold text-foreground">CivicPulse</h1>
            <p className="text-muted-foreground">Report issues in your community</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-input p-2 bg-background text-foreground focus:outline-primary focus:border-primary"
                placeholder="email@example.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-foreground">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-input p-2 bg-background text-foreground focus:outline-primary focus:border-primary"
                placeholder="••••••••"
              />
            </div>

            <div className="flex gap-4 pt-2">
              <Button
                onClick={handleLogin}
                disabled={isLoading}
                className="flex-1"
                variant="default"
              >
                {isLoading ? '...' : 'Login'}
              </Button>
              <Button
                onClick={handleSignup}
                disabled={isLoading}
                className="flex-1"
                variant="outline"
              >
                Signup
              </Button>
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Simple access for testing and reporting
          </p>
        </div>
      </Card>
    </div>
  );
}
