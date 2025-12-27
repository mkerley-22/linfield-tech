# PWA Icon Generation

To generate PWA icons from the LC logo, you have two options:

## Option 1: Browser-based (Easiest)

1. Open `scripts/generate-pwa-icons.html` in your browser
2. The page will load the LC logo and generate preview icons
3. Click "Generate Icons" to create the icons
4. Click "Download Icons" to download both icon files
5. Place the downloaded files in the `/public` directory

## Option 2: Node.js Script

1. Install sharp: `npm install sharp`
2. Run the script: `node scripts/generate-pwa-icons.js`
3. The icons will be automatically generated in `/public`

The icons will have:
- Blue background (#2563eb) matching the app theme
- LC logo centered with appropriate padding
- Proper sizes: 192x192 and 512x512 pixels

