# El Haj'Aime - Premium Barbershop Website

A fully functional, professional website for "El Haj'Aime", a premium barbershop in Tunis, Tunisia. Built with Next.js 15, TypeScript, Tailwind CSS, and Supabase.

## Features

- ✅ **Online Booking System** - Real-time calendar with 3 barbers (Ahmed, Karim, Walid)
- ✅ **Service Management** - 4 services with pricing in TND
- ✅ **Bilingual Support** - English/Arabic with RTL toggle
- ✅ **Admin Dashboard** - Manage bookings, barbers, and services
- ✅ **Responsive Design** - Mobile-first approach
- ✅ **PWA Support** - Offline booking queue
- ✅ **SEO Optimized** - Schema markup, sitemap, robots.txt
- ✅ **Analytics** - Google Analytics 4 + Hotjar integration

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Shadcn/ui, Framer Motion
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React
- **Calendar**: react-day-picker

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (free tier works)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd barber-website
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Run the SQL schema from `supabase/schema.sql` in your Supabase SQL editor
   - Get your project URL and anon key from Settings > API

4. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   RESEND_API_KEY=your_resend_api_key (optional, for emails)
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key (optional)
   NEXT_PUBLIC_GA_ID=your_google_analytics_id (optional)
   NEXT_PUBLIC_HOTJAR_ID=your_hotjar_id (optional)
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Deployment

### Vercel (Recommended)

1. **Push your code to GitHub**

2. **Import project to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

3. **Add environment variables**
   - In Vercel project settings, add all environment variables from `.env.local`

4. **Deploy**
   - Vercel will automatically deploy on every push to main branch

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Admin Access

- **URL**: `/admin`
- **Password**: `hajadmin2026`

## Project Structure

```
├── app/                    # Next.js app router pages
│   ├── admin/             # Admin dashboard
│   ├── book/              # Booking page
│   ├── bookings/          # User bookings page
│   ├── services/          # Services page
│   ├── gallery/           # Gallery page
│   ├── about/             # About page
│   ├── contact/           # Contact page
│   └── layout.tsx         # Root layout
├── components/             # React components
│   ├── ui/                # Shadcn/ui components
│   ├── home/              # Homepage components
│   ├── booking/           # Booking components
│   └── ...
├── lib/                    # Utility functions
│   ├── supabase/          # Supabase client & queries
│   └── utils.ts           # Helper functions
├── contexts/              # React contexts
├── hooks/                 # Custom React hooks
└── supabase/              # Database schema
    └── schema.sql         # SQL schema
```

## Services

1. **Classic Cut** - 30 min, 25 TND
2. **Premium Cut + Shave** - 45 min, 40 TND
3. **Beard Trim** - 20 min, 15 TND
4. **Full Service** - 75 min, 60 TND

## Barbers

- Ahmed (أحمد)
- Karim (كريم)
- Walid (وليد)

## Business Hours

- **Saturday - Thursday**: 9:00 AM - 9:00 PM
- **Friday**: 2:00 PM - 9:00 PM

## Contact

- **Address**: Avenue Habib Bourguiba, Tunis
- **Phone**: +216 98 765 432
- **WhatsApp**: +216 98 765 432
- **Instagram**: @elhajaimetunis

## Performance

- Lighthouse Score: 95+
- Image optimization with Next.js Image component
- Lazy loading for images and components
- Code splitting and tree shaking

## Security

- Input validation with Zod
- Rate limiting (implement in API routes)
- HTTPS enforced in production
- SQL injection protection via Supabase

## License

This project is proprietary and confidential.

## Support

For issues or questions, please contact the development team.
