'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function Sidebar() {
  const supabase = createClient();
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setUserProfile(profile);
      }
    };

    fetchProfile();
  }, [supabase]);

  return (
    <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border p-4">
      <div className="space-y-4">
        <div className="bg-primary/10 rounded-lg p-4">
          <h2 className="font-semibold text-foreground mb-2">Your Stats</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Points</span>
              <span className="font-bold text-primary">{userProfile?.points || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Role</span>
              <span className="capitalize font-semibold">{userProfile?.role || 'citizen'}</span>
            </div>
          </div>
        </div>

        <div className="bg-secondary/20 rounded-lg p-4">
          <h2 className="font-semibold text-foreground mb-2">Quick Tips</h2>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Take clear photos of issues</li>
            <li>• Include location details</li>
            <li>• Help your community thrive</li>
          </ul>
        </div>
      </div>
    </aside>
  );
}
