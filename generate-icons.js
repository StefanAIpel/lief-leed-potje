const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir);
}

// Read SVG
const svgPath = path.join(iconsDir, 'icon.svg');
const svgBuffer = fs.readFileSync(svgPath);

async function generateIcons() {
    console.log('🎨 Generating PWA icons...\n');
    
    for (const size of sizes) {
        const outputPath = path.join(iconsDir, `icon-${size}.png`);
        
        await sharp(svgBuffer)
            .resize(size, size)
            .png()
            .toFile(outputPath);
        
        console.log(`✅ Generated icon-${size}.png`);
    }
    
    // Also generate favicon
    await sharp(svgBuffer)
        .resize(32, 32)
        .png()
        .toFile(path.join(__dirname, 'favicon.png'));
    console.log('✅ Generated favicon.png');
    
    // Generate apple-touch-icon
    await sharp(svgBuffer)
        .resize(180, 180)
        .png()
        .toFile(path.join(__dirname, 'apple-touch-icon.png'));
    console.log('✅ Generated apple-touch-icon.png');
    
    console.log('\n🎉 All icons generated!');
}

generateIcons().catch(console.error);
