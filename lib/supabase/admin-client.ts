import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Create Supabase client with service role key for admin operations
 * This bypasses RLS and should ONLY be used in API routes with proper authentication
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is not set in environment variables');
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set. Please add it to your .env.local file.');
  }

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
