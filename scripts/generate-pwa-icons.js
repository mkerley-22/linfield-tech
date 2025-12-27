// Node.js script to generate PWA icons from SVG
// Requires: npm install sharp
// Usage: node scripts/generate-pwa-icons.js

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateIcons() {
  const svgPath = path.join(__dirname, '../public/lc-logo.svg');
  const outputDir = path.join(__dirname, '../public');
  
  // Check if SVG exists
  if (!fs.existsSync(svgPath)) {
    console.error('Error: lc-logo.svg not found in public directory');
    process.exit(1);
  }

  try {
    // Read SVG
    const svgBuffer = fs.readFileSync(svgPath);
    
    // Create a blue background
    const blueBackground = {
      width: 192,
      height: 192,
      channels: 4,
      background: { r: 37, g: 99, b: 235, alpha: 1 } // #2563eb
    };
    
    // Generate 192x192 icon
    const icon192 = await sharp(blueBackground)
      .composite([{
        input: svgBuffer,
        top: 16,
        left: 16,
        width: 160,
        height: 160
      }])
      .png()
      .toFile(path.join(outputDir, 'icon-192.png'));
    
    console.log('✓ Generated icon-192.png');
    
    // Generate 512x512 icon
    const blueBackground512 = {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 37, g: 99, b: 235, alpha: 1 } // #2563eb
    };
    
    const icon512 = await sharp(blueBackground512)
      .composite([{
        input: svgBuffer,
        top: 42,
        left: 42,
        width: 428,
        height: 428
      }])
      .png()
      .toFile(path.join(outputDir, 'icon-512.png'));
    
    console.log('✓ Generated icon-512.png');
    console.log('\nIcons generated successfully!');
    
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

// Check if sharp is installed
try {
  require.resolve('sharp');
  generateIcons();
} catch (e) {
  console.log('Sharp not found. Installing...');
  console.log('Please run: npm install sharp');
  console.log('Then run this script again.');
  process.exit(1);
}

