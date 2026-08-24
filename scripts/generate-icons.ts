import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const iconSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FF1A38"/>
      <stop offset="100%" stop-color="#E50024"/>
    </linearGradient>
    <filter id="dropShadow" x="-10%" y="-10%" width="120%" height="130%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000000" flood-opacity="0.25"/>
    </filter>
    <linearGradient id="foldShadow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="45%" stop-color="#EBEBEB"/>
      <stop offset="50%" stop-color="#CCCCCC"/>
      <stop offset="100%" stop-color="#FFFFFF"/>
    </linearGradient>
    <filter id="innerFoldShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="-2" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.22"/>
    </filter>
  </defs>

  <!-- Background container for maskable / regular icon -->
  <rect width="512" height="512" rx="110" fill="#0D0D0D"/>

  <!-- Red Squircle YouTube Badge -->
  <g filter="url(#dropShadow)">
    <rect x="64" y="64" width="384" height="384" rx="96" fill="url(#bgGrad)"/>
  </g>

  <!-- Folded Play Icon -->
  <g transform="translate(4, 0)">
    <!-- Left vertical bar/stem of the folded play symbol -->
    <rect x="175" y="165" width="46" height="182" rx="23" fill="#FFFFFF"/>
    
    <!-- Top folded diagonal piece extending to the right apex -->
    <path d="M198 165 C208 165, 218 171, 226 178 L330 240 C345 249, 345 263, 330 272 L215 342 C204 349, 198 343, 198 332 Z" 
          fill="#FFFFFF" />

    <!-- Origami fold shadow / crease creating the 3D ribbon fold -->
    <path d="M198 230 L310 256 L198 320 Z" 
          fill="#D9D9D9" 
          opacity="0.85" 
          filter="url(#innerFoldShadow)" />
          
    <!-- Main white overlay on top half of fold -->
    <path d="M198 165 L330 256 L198 245 Z" fill="#FFFFFF"/>
  </g>
</svg>
`;

const fullLogoSvg = `
<svg width="600" height="200" viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="logoBgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FF1A38"/>
      <stop offset="100%" stop-color="#E50024"/>
    </linearGradient>
    <filter id="logoDropShadow" x="-10%" y="-10%" width="120%" height="130%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.2"/>
    </filter>
  </defs>

  <!-- Red Squircle Badge -->
  <g filter="url(#logoDropShadow)">
    <rect x="20" y="25" width="150" height="150" rx="38" fill="url(#logoBgGrad)"/>
  </g>

  <!-- Folded Play Icon -->
  <g transform="translate(-52, -28) scale(0.64)">
    <rect x="175" y="165" width="46" height="182" rx="23" fill="#FFFFFF"/>
    <path d="M198 165 C208 165, 218 171, 226 178 L330 240 C345 249, 345 263, 330 272 L215 342 C204 349, 198 343, 198 332 Z" fill="#FFFFFF"/>
    <path d="M198 230 L310 256 L198 320 Z" fill="#D9D9D9" opacity="0.85"/>
    <path d="M198 165 L330 256 L198 245 Z" fill="#FFFFFF"/>
  </g>

  <!-- NextTube Typography -->
  <text x="195" y="126" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="78" letter-spacing="-1.5">
    <tspan fill="#111111" class="dark-text">Next</tspan><tspan fill="#FF1A38">Tube</tspan>
  </text>
</svg>
`;

async function generate() {
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(path.join(publicDir, 'logo.svg'), fullLogoSvg);
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), iconSvg);

  const iconBuffer = Buffer.from(iconSvg);

  // 512x512
  await sharp(iconBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));

  // 192x192
  await sharp(iconBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));

  // Apple touch icon
  await sharp(iconBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // Standalone app logo png
  await sharp(Buffer.from(fullLogoSvg))
    .png()
    .toFile(path.join(publicDir, 'nexttube-logo.png'));

  console.log('All PWA and NextTube icons generated successfully!');
}

generate().catch(console.error);
