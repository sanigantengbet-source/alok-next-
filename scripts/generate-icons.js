const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

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
    <filter id="innerFoldShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="-2" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.22"/>
    </filter>
  </defs>

  <rect width="512" height="512" rx="110" fill="#0D0D0D"/>

  <g filter="url(#dropShadow)">
    <rect x="64" y="64" width="384" height="384" rx="96" fill="url(#bgGrad)"/>
  </g>

  <g transform="translate(4, 0)">
    <rect x="175" y="165" width="46" height="182" rx="23" fill="#FFFFFF"/>
    <path d="M198 165 C208 165, 218 171, 226 178 L330 240 C345 249, 345 263, 330 272 L215 342 C204 349, 198 343, 198 332 Z" fill="#FFFFFF" />
    <path d="M198 230 L310 256 L198 320 Z" fill="#D9D9D9" opacity="0.85" filter="url(#innerFoldShadow)" />
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

  <g filter="url(#logoDropShadow)">
    <rect x="20" y="25" width="150" height="150" rx="38" fill="url(#logoBgGrad)"/>
  </g>

  <g transform="translate(-52, -28) scale(0.64)">
    <rect x="175" y="165" width="46" height="182" rx="23" fill="#FFFFFF"/>
    <path d="M198 165 C208 165, 218 171, 226 178 L330 240 C345 249, 345 263, 330 272 L215 342 C204 349, 198 343, 198 332 Z" fill="#FFFFFF"/>
    <path d="M198 230 L310 256 L198 320 Z" fill="#D9D9D9" opacity="0.85"/>
    <path d="M198 165 L330 256 L198 245 Z" fill="#FFFFFF"/>
  </g>

  <text x="195" y="126" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="78" letter-spacing="-1.5">
    <tspan fill="#111111">Next</tspan><tspan fill="#FF1A38">Tube</tspan>
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

  await sharp(iconBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));

  await sharp(iconBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));

  await sharp(iconBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  await sharp(Buffer.from(fullLogoSvg))
    .png()
    .toFile(path.join(publicDir, 'nexttube-logo.png'));

  console.log('DONE_GENERATING_ICONS');
}

generate().catch(console.error);
