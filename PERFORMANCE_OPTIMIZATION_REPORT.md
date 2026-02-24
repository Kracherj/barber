# Performance Optimization Report — Joseph Coiff

**Target:** Lighthouse Performance 90+, fast FCP, low TBT, smooth 60fps, royal medieval aesthetic preserved.

---

## 1. Performance issues found

| Category | Issue | Impact |
|----------|--------|--------|
| **Images** | Hero background not preloaded | Delayed LCP |
| **Images** | Nav logo used raw `<img>` (no WebP/AVIF, no responsive) | Extra bytes, no Next.js optimization |
| **Images** | About / gallery page images without explicit `loading="lazy"` or optimal `sizes` | Risk of loading too much on first paint |
| **Fonts** | Cormorant Garamond loading 5 weights (300–700) | Unused weights increase FCP and font payload |
| **CSS** | Full-page SVG feTurbulence grain (high baseFrequency, 4 octaves) | CPU cost, especially on mobile |
| **CSS** | Hero radial glow used `blur-3xl` (48px) on large area | Heavy blur work, can hurt 60fps |
| **CSS** | Hero trust badges used `backdrop-blur-sm` × 3 | Extra compositing cost |
| **CSS** | Nav bar used `backdrop-blur-md` when scrolled | Moderate blur cost on scroll |
| **JS** | Scroll listener without `{ passive: true }` | Possible main-thread blocking on scroll |
| **Network** | No preconnect to Unsplash for gallery/about images | Slower first request to external origin |
| **Caching** | `minimumCacheTTL: 60` for images | Short cache, more revalidation |
| **Animations** | Same motion durations on mobile as desktop | Unnecessary work on weaker GPUs |

---

## 2. Improvements made

### 2.1 Asset optimization

- **Hero image**
  - Added `<link rel="preload" href="/images/background.png" as="image">` in `layout.tsx` for faster LCP.
  - Set `fetchPriority="high"` and responsive `sizes`; reduced `quality` to 80 (visually safe).
- **Logo**
  - Replaced `<img>` in `components/navigation.tsx` with `next/image` (width/height 40, `sizes="40px"`) for WebP/AVIF and proper optimization.
- **Non-hero images**
  - **About:** `loading="lazy"` and `sizes="(max-width: 768px) 100vw, 50vw"`.
  - **Gallery (home):** Already had `loading="lazy"` and good `sizes`; left as is.
  - **Gallery page:** Added `loading="lazy"`; kept existing `sizes`.
  - **Products:** Rely on default lazy loading and existing `sizes`.
- **Next.js Image config**
  - `formats: ['image/avif', 'image/webp']` already set; local and remote images get modern formats.
  - `minimumCacheTTL` increased to 1 year for better caching.
  - Added long-lived cache headers for `/images/*` in `next.config.js`.

### 2.2 CSS optimization

- **Grain**
  - Reduced SVG size (256×256), `numOctaves` 4→2, `baseFrequency` 0.9→0.8.
  - Added `contain: strict` on `body::before` to limit paint/layout.
- **Blur**
  - Hero radial glow: `blur-3xl` → `blur-xl` (mobile), `blur-2xl` (md+); area reduced (800px → 600px).
  - Hero trust badges: `backdrop-blur-sm` + `bg-white/5` → `bg-white/[0.08]` (no blur).
  - Nav on scroll: `backdrop-blur-md` → `backdrop-blur-sm` to keep a light premium look with less cost.
- **Variables**
  - Existing CSS variables for colors, shadows, and motion kept; no new duplicates.

### 2.3 Font optimization

- **Cormorant Garamond**
  - Weights reduced from 5 (300, 400, 500, 600, 700) to 3 (400, 600, 700).
- **Inter**
  - Left as default (variable font).
- **Already in place**
  - `display: "swap"`, `preload: true` for both fonts (next/font).

### 2.4 JavaScript optimization

- **Scroll**
  - Nav scroll listener updated to `addEventListener("scroll", handleScroll, { passive: true })` to avoid blocking the main thread.
- **Scripts**
  - GA and Hotjar already use Next.js `<Script strategy="afterInteractive">` (non-blocking).
- **Bundles**
  - `optimizePackageImports: ['lucide-react', 'framer-motion']` already in use.

### 2.5 Animation performance

- **Kept**
  - Framer Motion limited to `opacity` and `transform` (translateY/scale); no width/height/top/left.
  - Subtle fade-ins and button hovers; section reveals use transform + opacity.
- **Tuned**
  - Hero glow blur reduced; no heavy glow or large blur transitions added.
  - No parallax or other CPU-heavy effects.

### 2.6 Mobile optimization

- **Motion**
  - In `globals.css`, `@media (max-width: 768px)` shortens `--duration-fast/normal/slow` so animations are quicker and lighter on mobile.
- **Tap targets**
  - Nav and CTAs already use `min-h-[44px]` / `min-w-[44px]` where needed.
- **Scrolling**
  - `scroll-smooth` and `overflow-x: hidden` kept; no change to smooth scrolling behavior.

### 2.7 Network and loading

- **Compression**
  - `compress: true` in `next.config.js` (gzip/brotli when supported).
- **Caching**
  - `/images/:path*` served with `Cache-Control: public, max-age=31536000, immutable`.
- **Preconnect**
  - `<link rel="preconnect" href="https://images.unsplash.com">` and `dns-prefetch` added in `layout.tsx` for gallery/about.
- **HTML**
  - Minification handled by Next.js in production.

---

## 3. Estimated load time impact

| Metric | Before (est.) | After (est.) | Notes |
|--------|----------------|--------------|--------|
| **LCP** | ~2.2–2.8 s | ~1.6–2.2 s | Preload + smaller hero quality + better caching |
| **FCP** | ~1.4–1.9 s | ~1.2–1.6 s | Fewer font weights, lighter grain, no hero blur on badges |
| **TBT** | Moderate | Lower | Passive scroll, same JS strategy; less main-thread work from blur/grain |
| **CLS** | Low | Low | No layout shifts from changes (explicit sizes/width/height kept) |

*Actual numbers depend on device, network, and hosting (e.g. Vercel). Run Lighthouse (Mobile + Desktop) and PageSpeed Insights to validate.*

---

## 4. Visual and UX confirmation

- **Royal medieval / luxury feel**
  - Dark background, gold accents, Cormorant headings, and serif/sans hierarchy unchanged.
  - Hero still has gradient overlays, gold line, and trust badges (now solid bg instead of blur).
  - Nav still has a light blur on scroll; cards and buttons keep gold glow and elevation shadows.
- **No intentional visual downgrade**
  - Grain is still visible at 0.03 opacity with a lighter SVG.
  - Hero image at quality 80 remains sharp for a background.
  - Blur reduced but not removed where it matters (nav, hero glow).

---

## 5. Recommendations for 90+ Lighthouse

1. **Serve hero from CDN** and ensure `/images/background.png` is compressed (e.g. WebP/AVIF at build or via CDN).
2. **Convert local images** under `public/images/` to WebP/AVIF at build (Next.js Image handles runtime conversion; pre-converted files can reduce work).
3. **Run production build** and test with Lighthouse (Mobile, throttling) and Real User Monitoring.
4. **Consider dynamic import** for below-the-fold sections (e.g. Gallery, Testimonials) if bundle size or TBT remain high.

---

## 6. Files changed

- `app/layout.tsx` — Preload hero image; preconnect/dns-prefetch Unsplash; font weights (Cormorant).
- `app/globals.css` — Grain SVG and `contain`; mobile duration variables; reduced-motion unchanged.
- `app/about/page.tsx` — Lazy load and `sizes` for about image.
- `app/gallery/page.tsx` — `loading="lazy"` on gallery images.
- `components/navigation.tsx` — Next/Image for logo; passive scroll listener; lighter nav blur.
- `components/home/hero.tsx` — Hero image `sizes`/quality/fetchPriority; smaller/lighter blur on glow; solid badges.
- `next.config.js` — Long cache for `/images/*`; higher `minimumCacheTTL`; image qualities trimmed.

All changes keep the existing royal medieval aesthetic and premium feel while improving performance and aiming for Lighthouse 90+.
