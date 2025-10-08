# 🔨 Extension Build Commands

## Quick Build (Recommended)

### Windows
```bash
npx vite build --config browser-extension/vite.config.extension.ts && node scripts/copy-extension-assets.js
```

### Mac/Linux
```bash
npx vite build --config browser-extension/vite.config.extension.ts && node scripts/copy-extension-assets.js
```

---

## Step-by-Step Build Process

### 1️⃣ Build Extension
```bash
npx vite build --config browser-extension/vite.config.extension.ts
```

### 2️⃣ Copy Assets
```bash
node scripts/copy-extension-assets.js
```

### 3️⃣ Create Icons
**You have a master icon at:** `browser-extension/assets/icon-master.png`

**Resize it to 3 sizes and save to** `dist/extension/assets/`:
- `icon-16.png` (16x16 pixels)
- `icon-48.png` (48x48 pixels)
- `icon-128.png` (128x128 pixels)

**Quick resize options:**
- **Online tool**: https://www.iloveimg.com/resize-image (free, easy)
- **Photoshop/GIMP**: Image > Image Size
- **Mac Preview**: Tools > Adjust Size
- **ImageMagick** (command line):
  ```bash
  magick browser-extension/assets/icon-master.png -resize 16x16 dist/extension/assets/icon-16.png
  magick browser-extension/assets/icon-master.png -resize 48x48 dist/extension/assets/icon-48.png
  magick browser-extension/assets/icon-master.png -resize 128x128 dist/extension/assets/icon-128.png
  ```

### 4️⃣ Test Extension
1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select `dist/extension` folder
5. Test the extension popup and features

### 5️⃣ Create ZIP for Chrome Web Store

**Windows:**
```bash
cd dist\extension
tar -a -c -f ..\..\veriedit-ai-extension.zip *
cd ..\..
```

**Mac/Linux:**
```bash
cd dist/extension
zip -r ../../veriedit-ai-extension.zip .
cd ../..
```

### 6️⃣ Submit
Upload `veriedit-ai-extension.zip` to:
https://chrome.google.com/webstore/devconsole

---

## Troubleshooting

**Error: "Cannot find module"**
- Make sure you're in the project root directory
- Run `npm install` first

**Build fails**
- Delete `dist` folder and rebuild
- Check that `browser-extension/vite.config.extension.ts` exists

**Extension won't load**
- Verify all 3 icon files are in `dist/extension/assets/`
- Check Chrome console for errors (`chrome://extensions/` → Details → Errors)

**Icons not showing**
- Icons MUST be exactly 16x16, 48x48, and 128x128 pixels
- Files MUST be named `icon-16.png`, `icon-48.png`, `icon-128.png`
- Files MUST be in `dist/extension/assets/` folder
