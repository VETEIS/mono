// Simple icon generation script
// Run this with Node.js: node public/generate-icons.js
// Requires: npm install sharp

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [192, 512];
const iconColor = '#FCD34D'; // Yellow accent color
const bgColor = '#1C1C1E'; // Dark background

async function generateIcon(size) {
  // Create a simple icon with yellow "M" on dark background
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${bgColor}"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.6}" font-weight="bold" fill="${iconColor}" text-anchor="middle" dominant-baseline="middle">M</text>
    </svg>
  `;

  const filename = `icon-${size}x${size}.png`;
  const filepath = path.join(__dirname, filename);

  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(filepath);

  console.log(`Generated ${filename}`);
}

async function generateAllIcons() {
  console.log('Generating PWA icons...');
  for (const size of sizes) {
    await generateIcon(size);
  }
  console.log('Done! Icons generated in public folder.');
}

generateAllIcons().catch(console.error);
