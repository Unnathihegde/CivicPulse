import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('--- Supabase Client Init ---');
  if (!supabaseUrl) {
    console.error('CRITICAL: NEXT_PUBLIC_SUPABASE_URL is not defined in environment variables.');
  } else if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
    console.error(`CRITICAL: NEXT_PUBLIC_SUPABASE_URL (${supabaseUrl}) must start with http:// or https://`);
  } else {
    console.log(`Supabase URL being used: ${supabaseUrl}`);
  }

  if (!supabaseAnonKey) {
    console.error('CRITICAL: NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined in environment variables.');
  }
  
  console.log('Client initialized.');

  // Fallbacks to prevent instant crashing before error handlers can catch it, though the fetch will still fail if invalid.
  return createBrowserClient(
    supabaseUrl || 'https://missing-url.supabase.co',
    supabaseAnonKey || 'missing-anon-key'
  );
}
