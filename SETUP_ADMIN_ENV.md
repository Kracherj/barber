# Admin System Environment Setup

## Required Environment Variable

Add this to your `.env.local` file:

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## How to Get Your Service Role Key

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Find **service_role** key (NOT the anon key)
4. Copy it and add to `.env.local`

⚠️ **IMPORTANT**: The service_role key has full access to your database. Never expose it in client-side code or commit it to git.

## Current .env.local Should Look Like:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## After Adding the Key

1. Restart your Next.js dev server (`npm run dev`)
2. Try logging in again with:
   - Username: `admin`
   - Password: `hajadmin2026`
