# PWA Setup Instructions

## Icon Files Required

The PWA manifest references icon files that need to be created:

1. **`/public/icon-192.png`** - 192x192 pixels
2. **`/public/icon-512.png`** - 512x512 pixels

### Creating Icons from LC Logo

**Easiest Method:**
1. Open `/public/generate-icons-simple.html` in your web browser
2. The page will automatically generate icons from the LC logo
3. Click "Download Icons" to download both files
4. The downloaded files are already named correctly - just make sure they're in `/public`

The generated icons will have:
- Blue background (#2563eb) matching your app theme
- LC logo centered with appropriate padding
- Proper sizes: 192x192 and 512x512 pixels

**Alternative Methods:**
- Use online tools like https://realfavicongenerator.net/
- Use the Node.js script: `node scripts/generate-pwa-icons.js` (requires `npm install sharp`)

## Service Worker

The service worker (`/public/sw.js`) is automatically registered when users visit the mobile inventory page.

## Testing the PWA

1. Open the app in a mobile browser (or Chrome DevTools mobile emulation)
2. Navigate to `/inventory/mobile`
3. Look for the "Add to Home Screen" prompt (or use browser menu)
4. Test offline functionality by going offline and checking if cached pages load

## Features

- ✅ Camera integration for taking photos
- ✅ Mobile-optimized UI
- ✅ Offline support via service worker
- ✅ Install prompt for PWA installation
- ✅ Responsive design for all screen sizes

