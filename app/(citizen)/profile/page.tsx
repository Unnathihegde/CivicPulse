'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userAuth, setUserAuth] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userReports, setUserReports] = useState<any[]>([]);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }

      setUserAuth(user);

      // Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setUserProfile(profile);

      // Fetch user's reports
      const { data: reports } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setUserReports(reports || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-3xl font-bold text-foreground">My Profile</h1>

      {/* User Info Card */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-3xl">👤</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {userProfile?.name || userAuth?.email || 'User'}
            </h2>
            <p className="text-sm text-muted-foreground">{userAuth?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
          <div>
            <p className="text-sm text-muted-foreground">Points</p>
            <p className="text-3xl font-bold text-primary">{userProfile?.points || 0}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Reports</p>
            <p className="text-3xl font-bold text-primary">{userReports.length}</p>
          </div>
        </div>
      </Card>

      {/* My Reports */}
      <Card className="p-6 space-y-4">
        <h3 className="text-xl font-bold text-foreground">My Reports ({userReports.length})</h3>
        {userReports.length === 0 ? (
          <p className="text-muted-foreground">You haven&apos;t submitted any reports yet</p>
        ) : (
          <div className="space-y-2">
            {userReports.map((report) => (
              <div key={report.id} className="flex items-start justify-between p-3 bg-muted/30 rounded">
                <div>
                  <p className="font-medium text-foreground capitalize">{report.category}</p>
                  <p className="text-sm text-muted-foreground">{report.summary}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded capitalize ${
                  report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  report.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {report.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
