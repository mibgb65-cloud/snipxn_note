const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const projectRoot = path.resolve(__dirname, '..');
const resRoot = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res');
const brandingRoot = path.join(projectRoot, 'assets', 'branding');

const COLORS = {
  slate900: '#0F172A',
  slate800: '#1E293B',
  slate700: '#334155',
  white: '#F8FAFC',
  amber: '#F59E0B',
  emerald: '#22C55E',
  bootsplash: '#0B1220',
};

const densities = {
  mdpi: 48,
  hdpi: 72,
  xhdpi: 96,
  xxhdpi: 144,
  xxxhdpi: 192,
};

const adaptiveForegroundSizes = {
  mdpi: 108,
  hdpi: 162,
  xhdpi: 216,
  xxhdpi: 324,
  xxxhdpi: 432,
};

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeText(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
}

function iconSvg() {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
    <defs>
      <linearGradient id="bg" x1="140" y1="120" x2="860" y2="900" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${COLORS.slate800}" />
        <stop offset="55%" stop-color="${COLORS.slate900}" />
        <stop offset="100%" stop-color="#020617" />
      </linearGradient>
    </defs>
    <rect width="1024" height="1024" rx="248" fill="url(#bg)" />
    <circle cx="810" cy="226" r="130" fill="${COLORS.amber}" opacity="0.14" />
    <circle cx="260" cy="824" r="150" fill="${COLORS.emerald}" opacity="0.08" />
    <rect x="74" y="74" width="876" height="876" rx="210" fill="none" stroke="${COLORS.slate700}" stroke-opacity="0.45" stroke-width="8" />
    <g fill="none" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="372,286 240,512 372,738" stroke="${COLORS.white}" stroke-width="94" />
      <line x1="470" y1="760" x2="604" y2="264" stroke="${COLORS.white}" stroke-width="82" />
      <polyline points="652,286 784,512 652,738" stroke="${COLORS.amber}" stroke-width="94" />
    </g>
    <circle cx="760" cy="768" r="36" fill="${COLORS.amber}" />
  </svg>`;
}

function markSvg() {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
    <g fill="none" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="388,290 280,512 388,734" stroke="${COLORS.white}" stroke-width="86" />
      <line x1="478" y1="738" x2="594" y2="286" stroke="${COLORS.white}" stroke-width="74" />
      <polyline points="644,290 752,512 644,734" stroke="${COLORS.amber}" stroke-width="86" />
    </g>
    <circle cx="740" cy="764" r="34" fill="${COLORS.amber}" />
  </svg>`;
}

async function renderPng(svg, size, outputPath) {
  ensureDir(path.dirname(outputPath));
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(outputPath);
}

async function main() {
  const iconSource = iconSvg();
  const markSource = markSvg();

  writeText(path.join(brandingRoot, 'snipxn-app-icon.svg'), iconSource);
  writeText(path.join(brandingRoot, 'snipxn-mark.svg'), markSource);

  for (const [density, size] of Object.entries(densities)) {
    const mipmapDir = path.join(resRoot, `mipmap-${density}`);
    await renderPng(iconSource, size, path.join(mipmapDir, 'ic_launcher.png'));
    await renderPng(iconSource, size, path.join(mipmapDir, 'ic_launcher_round.png'));
  }

  for (const [density, size] of Object.entries(adaptiveForegroundSizes)) {
    const mipmapDir = path.join(resRoot, `mipmap-${density}`);
    await renderPng(markSource, size, path.join(mipmapDir, 'ic_launcher_foreground.png'));
  }

  await renderPng(markSource, 320, path.join(resRoot, 'drawable', 'bootsplash_logo.png'));

  writeText(
    path.join(resRoot, 'mipmap-anydpi-v26', 'ic_launcher.xml'),
    `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
    <monochrome android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
`,
  );

  writeText(
    path.join(resRoot, 'mipmap-anydpi-v26', 'ic_launcher_round.xml'),
    `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
    <monochrome android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
`,
  );

  writeText(
    path.join(resRoot, 'values', 'colors.xml'),
    `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">${COLORS.slate900}</color>
    <color name="bootsplash_background">${COLORS.bootsplash}</color>
</resources>
`,
  );

  console.log('[generate-android-branding] generated icons, adaptive icon XML, and bootsplash assets');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
