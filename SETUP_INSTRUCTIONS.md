# How to See Your Website - Step by Step

## Step 1: Install Node.js (Required)

You need Node.js to run the website. Here's how:

1. **Download Node.js:**
   - Go to: https://nodejs.org/
   - Download the **LTS version** (recommended)
   - Choose the Windows Installer (.msi)

2. **Install Node.js:**
   - Run the downloaded installer
   - Click "Next" through the installation
   - Make sure "Add to PATH" is checked (it should be by default)
   - Click "Install"

3. **Verify Installation:**
   - Close and reopen your terminal/PowerShell
   - Run: `node --version`
   - You should see something like: `v20.x.x`
   - Run: `npm --version`
   - You should see something like: `10.x.x`

## Step 2: Install Project Dependencies

Once Node.js is installed, open PowerShell in your project folder and run:

```bash
npm install
```

This will install all required packages (takes 2-3 minutes).

## Step 3: Set Up Environment Variables

Create a file named `.env.local` in the root folder with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**For now, you can use placeholder values to see the website:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

⚠️ **Note:** The booking system won't work without real Supabase credentials, but you can see all the pages and design!

## Step 4: Run the Development Server

```bash
npm run dev
```

You should see:
```
✓ Ready in 2.5s
○ Local: http://localhost:3000
```

## Step 5: Open in Browser

Open your browser and go to:
**http://localhost:3000**

🎉 **You should now see your website!**

---

## Quick Setup (If You Have Node.js Already)

If Node.js is already installed, just run these commands:

```bash
# 1. Install dependencies
npm install

# 2. Create .env.local file (copy from .env.example)
# Edit it with your values or use placeholders

# 3. Start the server
npm run dev

# 4. Open browser to http://localhost:3000
```

## Troubleshooting

**"npm is not recognized"**
- Node.js is not installed or not in PATH
- Reinstall Node.js and restart your terminal

**Port 3000 already in use**
- Another app is using port 3000
- Run: `npm run dev -- -p 3001` (uses port 3001 instead)

**Build errors**
- Make sure you're in the project folder
- Delete `node_modules` folder and run `npm install` again

---

## What You'll See

- ✅ Homepage with hero section
- ✅ Services page
- ✅ Gallery
- ✅ About page
- ✅ Contact page
- ✅ Booking page (UI works, but needs Supabase for functionality)
- ✅ Navigation with language toggle

**Note:** The booking system requires Supabase setup to work fully. See `QUICK_START.md` for Supabase setup instructions.
