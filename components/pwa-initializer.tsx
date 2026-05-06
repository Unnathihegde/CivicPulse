'use client';

import { useEffect } from 'react';

export function PWAInitializer() {
  useEffect(() => {
    // Disable service worker in development to prevent caching issues (SyntaxError unexpected token <)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (let registration of registrations) {
          registration.unregister().then(boolean => {
            if(boolean) {
              console.log('[PWA] Service Worker unregistered automatically');
            }
          });
        }
      });
    }

    // Install prompt handling
    let deferredPrompt: any;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      // Update install button visibility here if you have one
      console.log('[PWA] Install prompt is available');
    });

    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed successfully');
      deferredPrompt = null;
    });

    // Handle web app status
    window.addEventListener('load', () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('[PWA] Running as standalone app');
      }
    });

    // Track online/offline status
    window.addEventListener('online', () => {
      console.log('[PWA] Connection restored');
    });

    window.addEventListener('offline', () => {
      console.log('[PWA] Connection lost');
    });
  }, []);

  return null;
}
