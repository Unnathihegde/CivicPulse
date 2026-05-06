'use client';

import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';

const NavItem = ({ href, label, icon, isActive }: any) => (
  <Link href={href}>
    <button
      className={`flex flex-col items-center justify-center w-16 h-16 rounded-lg transition-colors ${
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted'
      }`}
    >
      <span className="text-2xl mb-1">{icon}</span>
      <span className="text-xs font-medium">{label}</span>
    </button>
  </Link>
);

export default function Navbar() {
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
    { href: '/', label: 'Reports', icon: '📋', id: 'reports' },
    { href: '/map', label: 'Map', icon: '🗺️', id: 'map' },
    { href: '/profile', label: 'Profile', icon: '👤', id: 'profile' },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border md:hidden">
        <div className="flex justify-around items-center h-20">
          {navItems.map((item) => (
            <NavItem
              key={item.id}
              {...item}
              isActive={pathname === item.href}
            />
          ))}
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex flex-col items-center justify-center w-16 h-16 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            >
              <span className="text-2xl mb-1">{theme === 'dark' ? '🌙' : '☀️'}</span>
              <span className="text-xs font-medium">Theme</span>
            </button>
          )}
          <button
            onClick={handleLogout}
            disabled={isLoading}
            className="flex flex-col items-center justify-center w-16 h-16 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
          >
            <span className="text-2xl mb-1">🚪</span>
            <span className="text-xs font-medium">Exit</span>
          </button>
        </div>
      </nav>

      {/* Desktop Top Navigation */}
      <nav className="hidden md:flex items-center justify-between bg-card border-b border-border px-6 py-4 w-full">
        <h1 className="text-2xl font-bold text-foreground">CivicPulse</h1>
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
      </nav>
    </>
  );
}
