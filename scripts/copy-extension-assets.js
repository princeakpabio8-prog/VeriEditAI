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
console.log('\n📦 Build Complete! Next steps:');
console.log('1. Resize browser-extension/assets/icon-master.png to:');
console.log('   - icon-16.png (16x16)');
console.log('   - icon-48.png (48x48)');  
console.log('   - icon-128.png (128x128)');
console.log('   Save all 3 to: dist/extension/assets/');
console.log('2. Test: Load dist/extension in chrome://extensions/');
console.log('3. Package: cd dist/extension && tar -a -c -f ../../veriedit-ai-extension.zip *');
console.log('4. Submit to Chrome Web Store');
console.log('\n💡 Resize tool: https://www.iloveimg.com/resize-image or any image editor');
