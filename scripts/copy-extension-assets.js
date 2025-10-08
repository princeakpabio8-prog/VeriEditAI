import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const distExtension = join(projectRoot, 'dist', 'extension');

// Ensure assets directory exists
const assetsDir = join(distExtension, 'assets');
if (!existsSync(assetsDir)) {
  mkdirSync(assetsDir, { recursive: true });
}

// Copy manifest.json
const manifestSource = join(projectRoot, 'browser-extension', 'manifest.json');
const manifestDest = join(distExtension, 'manifest.json');
copyFileSync(manifestSource, manifestDest);

console.log('✓ Extension assets copied successfully');
console.log('✓ Extension built at: dist/extension/');
console.log('\nNext steps:');
console.log('1. Add extension icons to dist/extension/assets/ (icon-16.png, icon-48.png, icon-128.png)');
console.log('2. Create ZIP file: cd dist/extension && zip -r veriedit-ai-extension.zip .');
console.log('3. Submit to Chrome Web Store');
