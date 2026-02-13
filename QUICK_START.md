# Quick Start Guide - El Haj'Aime Barbershop

Get your barbershop website up and running in minutes!

## 🚀 5-Minute Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Supabase (5 minutes)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to SQL Editor and paste the contents of `supabase/schema.sql`
4. Run the SQL to create tables
5. Go to Settings > API and copy:
   - Project URL
   - anon/public key

### 3. Create Environment File

Create `.env.local` in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser!

## ✅ What's Included

- ✅ **Homepage** - Hero, services, gallery, testimonials, map
- ✅ **Booking System** - Full stepper flow with calendar
- ✅ **Admin Dashboard** - `/admin` (password: `hajadmin2026`)
- ✅ **Bilingual** - English/Arabic with RTL support
- ✅ **Mobile-First** - Perfect for phone bookings
- ✅ **PWA Ready** - Works offline

## 📱 Test the Booking Flow

1. Go to `/book`
2. Select a service
3. Choose a barber (Ahmed, Karim, or Walid)
4. Pick a date and time
5. Enter your details
6. Confirm booking

## 🔐 Admin Access

- URL: `http://localhost:3000/admin`
- Password: `hajadmin2026`

## 🎨 Customization

### Change Colors
Edit `tailwind.config.ts`:
- Navy: `#1e3a8a`
- Gold: `#d4af37`
- Beige: `#f5f5dc`

### Update Business Info
Edit translations in `contexts/language-context.tsx`

### Add Real Images
Replace Unsplash URLs in:
- `components/home/gallery.tsx`
- `app/gallery/page.tsx`

## 📦 Before Production

1. **Add PWA Icons**
   - Create `public/icon-192.png` (192x192)
   - Create `public/icon-512.png` (512x512)
   - See `public/README.md` for details

2. **Set Up Email** (Optional)
   - Get Resend API key
   - Add to `.env.local`:
     ```
     RESEND_API_KEY=your_key_here
     RESEND_FROM_EMAIL=noreply@yourdomain.com
     ```

3. **Add Analytics** (Optional)
   - Google Analytics: `NEXT_PUBLIC_GA_ID`
   - Hotjar: `NEXT_PUBLIC_HOTJAR_ID`

4. **Deploy to Vercel**
   - Push to GitHub
   - Import to Vercel
   - Add environment variables
   - Deploy!

## 🆘 Troubleshooting

**Build Errors?**
- Make sure Node.js 18+ is installed
- Run `npm install` again
- Check TypeScript errors

**Database Issues?**
- Verify Supabase URL and keys
- Check RLS policies are enabled
- Test connection in Supabase dashboard

**Booking Not Working?**
- Check browser console for errors
- Verify Supabase tables exist
- Test with a simple booking

## 📚 Next Steps

- Read `README.md` for full documentation
- Check `DEPLOYMENT.md` for production setup
- Customize content for your barbershop
- Add your real images and branding

## 🎯 Key Features

| Feature | Status |
|---------|--------|
| Online Booking | ✅ Complete |
| Admin Dashboard | ✅ Complete |
| Bilingual (EN/AR) | ✅ Complete |
| Mobile Responsive | ✅ Complete |
| PWA Support | ✅ Complete |
| SEO Optimized | ✅ Complete |
| Analytics Ready | ✅ Complete |

## 💡 Pro Tips

1. **Test on Real Devices** - Mobile experience is critical
2. **Monitor Bookings** - Check admin dashboard regularly
3. **Backup Database** - Supabase has automatic backups
4. **Update Regularly** - Keep dependencies updated
5. **Track Performance** - Use Lighthouse for optimization

---

**Ready to launch?** Follow `DEPLOYMENT.md` for production deployment!
