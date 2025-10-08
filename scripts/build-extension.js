import { rmSync, copyFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🚀 Building VeriedIT AI Browser Extension...\n');

// Step 1: Clean old build
console.log('1️⃣ Cleaning old build...');
const distExtension = join(projectRoot, 'dist', 'extension');
if (existsSync(distExtension)) {
  rmSync(distExtension, { recursive: true, force: true });
  console.log('   ✓ Cleaned dist/extension');
}

const viteCache = join(projectRoot, 'node_modules', '.vite');
if (existsSync(viteCache)) {
  rmSync(viteCache, { recursive: true, force: true });
  console.log('   ✓ Cleaned vite cache');
}

// Step 2: Build with Vite
console.log('\n2️⃣ Building extension with Vite...');
try {
  execSync('npx vite build --config browser-extension/vite.config.extension.ts', {
    cwd: projectRoot,
    stdio: 'inherit'
  });
  console.log('   ✓ Extension built successfully');
} catch (error) {
  console.error('   ✗ Build failed');
  process.exit(1);
}

// Step 3: Copy manifest.json
console.log('\n3️⃣ Copying manifest.json...');
const manifestSource = join(projectRoot, 'browser-extension', 'manifest.json');
const manifestDest = join(distExtension, 'manifest.json');
copyFileSync(manifestSource, manifestDest);
console.log('   ✓ Manifest copied');

// Step 4: Setup icons
console.log('\n4️⃣ Setting up icons...');
const assetsDir = join(distExtension, 'assets');
if (!existsSync(assetsDir)) {
  mkdirSync(assetsDir, { recursive: true });
}

const iconSource = join(projectRoot, 'browser-extension', 'assets', 'icon-master.png');
if (existsSync(iconSource)) {
  // Copy icon-master.png as all three sizes (user will need to resize them properly)
  copyFileSync(iconSource, join(assetsDir, 'icon-16.png'));
  copyFileSync(iconSource, join(assetsDir, 'icon-48.png'));
  copyFileSync(iconSource, join(assetsDir, 'icon-128.png'));
  console.log('   ✓ Icon files created (placeholder - resize recommended)');
} else {
  console.log('   ⚠ icon-master.png not found in browser-extension/assets/');
}

// Success message
console.log('\n✅ Build Complete! Extension ready at: dist/extension/\n');
console.log('📦 Next Steps:');
console.log('1. Load extension in Chrome:');
console.log('   - Open chrome://extensions/');
console.log('   - Enable "Developer mode"');
console.log('   - Click "Load unpacked"');
console.log('   - Select the dist/extension folder');
console.log('\n2. (Optional) Resize icons for better quality:');
console.log('   - Use https://www.iloveimg.com/resize-image');
console.log('   - Create 16x16, 48x48, and 128x128 versions');
console.log('   - Replace files in dist/extension/assets/');
console.log('\n3. Test the extension on supported platforms:');
console.log('   - Twitter/X, Facebook, Reddit, LinkedIn\n');
