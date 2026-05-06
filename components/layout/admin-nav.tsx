'use client';

import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';

export default function AdminNav() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleLogout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const navItems = [
    { href: '/admin', label: 'Dashboard', id: 'dashboard' },
    { href: '/admin/reports', label: 'All Reports', id: 'reports' },
    { href: '/admin/insights', label: 'Insights', id: 'insights' },
  ];

  return (
    <nav className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">CivicPulse Admin</h1>
        <div className="flex gap-4">
          {navItems.map((item) => (
            <Link key={item.id} href={item.href}>
              <button
                className={`px-4 py-2 rounded-lg transition-colors ${
                  pathname === item.href
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {item.label}
              </button>
            </Link>
          ))}
          {mounted && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-9 h-9 rounded-lg"
            >
              {theme === 'dark' ? '🌙' : '☀️'}
            </Button>
          )}
          <Button
            onClick={handleLogout}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
}
