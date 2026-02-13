# Deployment Guide - El Haj'Aime Barbershop Website

This guide will walk you through deploying the El Haj'Aime website to production.

## Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Supabase database schema executed
- [ ] Test booking flow end-to-end
- [ ] Verify admin dashboard access
- [ ] Test mobile responsiveness
- [ ] Check bilingual (EN/AR) functionality
- [ ] Verify WhatsApp button works
- [ ] Test all form submissions

## Vercel Deployment (Recommended)

### Step 1: Prepare Your Repository

1. Ensure all code is committed to Git
2. Push to GitHub, GitLab, or Bitbucket

### Step 2: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Sign up with your Git provider (GitHub recommended)

### Step 3: Import Project

1. Click "New Project"
2. Select your repository
3. Vercel will auto-detect Next.js settings

### Step 4: Configure Environment Variables

In Vercel project settings, add these environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
RESEND_API_KEY=your_resend_api_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
NEXT_PUBLIC_GA_ID=your_google_analytics_id
NEXT_PUBLIC_HOTJAR_ID=your_hotjar_id
NEXT_PUBLIC_APP_URL=https://your-domain.com
ADMIN_PASSWORD=hajadmin2026
```

### Step 5: Deploy

1. Click "Deploy"
2. Wait for build to complete (usually 2-3 minutes)
3. Your site will be live at `your-project.vercel.app`

### Step 6: Custom Domain (Optional)

1. Go to Project Settings > Domains
2. Add your custom domain
3. Follow DNS configuration instructions

## Supabase Setup

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Choose region closest to Tunisia
4. Wait for project to initialize

### Step 2: Run Database Schema

1. Go to SQL Editor in Supabase dashboard
2. Copy contents of `supabase/schema.sql`
3. Paste and run the SQL
4. Verify tables are created:
   - `barbers`
   - `services`
   - `bookings`
   - `admin_users`

### Step 3: Get API Keys

1. Go to Settings > API
2. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

### Step 4: Configure Row Level Security

The schema includes RLS policies. Verify they're active:
- Public can read barbers and services
- Public can create bookings
- Admin has full access (handled by app logic)

## Email Setup (Resend)

### Step 1: Create Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up for free account (100 emails/day)

### Step 2: Verify Domain (Optional)

1. Add your domain in Resend dashboard
2. Add DNS records as instructed
3. Wait for verification

### Step 3: Get API Key

1. Go to API Keys section
2. Create new API key
3. Copy to `RESEND_API_KEY` environment variable

### Step 4: Configure Email Templates

Update email templates in your booking confirmation logic (if implemented).

## Google Maps Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project
3. Enable Maps JavaScript API

### Step 2: Create API Key

1. Go to APIs & Services > Credentials
2. Create API Key
3. Restrict key to:
   - HTTP referrers: `your-domain.com/*`
   - APIs: Maps JavaScript API

### Step 3: Add to Environment

Add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to your environment variables.

## Analytics Setup

### Google Analytics 4

1. Create GA4 property at [analytics.google.com](https://analytics.google.com)
2. Get Measurement ID (format: G-XXXXXXXXXX)
3. Add to `NEXT_PUBLIC_GA_ID`

### Hotjar

1. Create account at [hotjar.com](https://hotjar.com)
2. Create new site
3. Get Site ID
4. Add to `NEXT_PUBLIC_HOTJAR_ID`

## Post-Deployment

### 1. Test Booking Flow

- Create a test booking
- Verify it appears in admin dashboard
- Test cancellation

### 2. Verify Mobile Experience

- Test on real devices
- Check touch targets
- Verify swipe gestures

### 3. Check Performance

- Run Lighthouse audit
- Target: 95+ score
- Optimize images if needed

### 4. Monitor Errors

- Set up error tracking (Sentry recommended)
- Monitor Supabase logs
- Check Vercel function logs

### 5. SEO Verification

- Submit sitemap to Google Search Console
- Verify structured data with Google Rich Results Test
- Check mobile-friendliness

## Troubleshooting

### Build Errors

- Check Node.js version (18+ required)
- Verify all dependencies installed
- Check for TypeScript errors

### Database Connection Issues

- Verify Supabase URL and keys
- Check RLS policies
- Test connection in Supabase dashboard

### Booking Not Working

- Check Supabase realtime subscriptions
- Verify date/time validation
- Check browser console for errors

### Admin Dashboard Access

- Verify password is correct
- Check session storage
- Clear browser cache if needed

## Maintenance

### Regular Tasks

- Monitor booking volume
- Review and clean up old bookings
- Update service prices if needed
- Backup database monthly

### Updates

- Keep dependencies updated
- Monitor security advisories
- Test updates in staging first

## Support

For deployment issues:
1. Check Vercel deployment logs
2. Review Supabase logs
3. Check browser console for errors
4. Contact development team

## Security Notes

- Never commit `.env` files
- Rotate API keys regularly
- Use strong admin password
- Enable Supabase database backups
- Monitor for suspicious activity
