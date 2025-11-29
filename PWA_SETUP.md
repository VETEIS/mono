# PWA Setup Instructions

The app has been configured as a Progressive Web App (PWA). Here's what's been set up:

## ✅ Completed Setup

1. **next-pwa package installed** - Handles service worker and offline functionality
2. **next.config.mjs configured** - PWA settings added
3. **manifest.json created** - App manifest file in `/public/manifest.json`
4. **Metadata configured** - PWA meta tags in `layout.tsx`
5. **Icon template created** - SVG template for generating icons

## ⚠️ Required: Create App Icons

You need to create two PNG icon files in the `public` folder:

- **icon-192x192.png** (192x192 pixels)
- **icon-512x512.png** (512x512 pixels)

### Quick Icon Creation Options:

**Option 1: Use the SVG Template**
1. Open `public/icon-template.svg` in any design tool (Figma, Illustrator, etc.)
2. Export as PNG in both sizes (192x192 and 512x512)
3. Save them as `icon-192x192.png` and `icon-512x512.png` in the `public` folder

**Option 2: Online Tool**
1. Create your icon design
2. Use https://realfavicongenerator.net/ or similar tool
3. Generate and download the icons
4. Place in the `public` folder

**Option 3: Image Editor**
1. Create 192x192 and 512x512 images with your logo
2. Use dark background (#1C1C1E) and yellow accent (#FCD34D)
3. Save as PNG files in the `public` folder

## Testing PWA

1. **Build the app**: `npm run build`
2. **Start production server**: `npm start`
3. **Open in browser**: Navigate to your app (must be HTTPS or localhost)
4. **Install prompt**: Browser should show "Add to Home Screen" option
5. **Offline mode**: Test that the app works offline after first load

## PWA Features Enabled

- ✅ Installable on home screen
- ✅ Offline functionality (cached assets)
- ✅ Service worker for caching
- ✅ App manifest for installation
- ✅ Theme color matching your app
- ✅ Standalone display mode

## Notes

- Service worker is **disabled in development** (only works in production build)
- Icons are required for proper PWA installation
- App works offline after first load (assets are cached)
- All data is already stored in LocalStorage, so full offline support is automatic

## Deployment

Once icons are added, the PWA will be fully functional when deployed to Vercel (HTTPS is automatically provided).

