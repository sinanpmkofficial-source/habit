const sharp = require("sharp");
const path = require("path");

const svgPath = path.join(__dirname, "../../public/logo.svg");
const publicDir = path.join(__dirname, "../../public");

async function generate() {
  try {
    console.log("Generating PWA icons from logo.svg...");
    
    // Generate 192x192 icon
    await sharp(svgPath)
      .resize(192, 192)
      .png()
      .toFile(path.join(publicDir, "icon-192.png"));
    console.log("Created icon-192.png");
    
    // Generate 512x512 icon
    await sharp(svgPath)
      .resize(512, 512)
      .png()
      .toFile(path.join(publicDir, "icon-512.png"));
    console.log("Created icon-512.png");
    
    // Generate 512x512 maskable icon (padded to fit circular masks)
    await sharp(svgPath)
      .resize(384, 384)
      .extend({
        top: 64,
        bottom: 64,
        left: 64,
        right: 64,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(path.join(publicDir, "icon-512-maskable.png"));
    console.log("Created icon-512-maskable.png");
    
    console.log("PWA icons generated successfully!");
  } catch (error) {
    console.error("Error generating icons:", error);
  }
}

generate();
