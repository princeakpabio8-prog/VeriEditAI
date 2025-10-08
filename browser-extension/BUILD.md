# Quick Build Instructions

## Step 1: Build the Extension

Run this command in your terminal:

```bash
npm run build -- --config browser-extension/vite.config.extension.ts
```

Or if that doesn't work:

```bash
npx vite build --config browser-extension/vite.config.extension.ts
```

## Step 2: Copy Manifest

```bash
cp browser-extension/manifest.json dist/extension/manifest.json
```

## Step 3: Add Icons

Create 3 icon PNG files and place them in `dist/extension/assets/`:
- icon-16.png (16x16px)
- icon-48.png (48x48px)  
- icon-128.png (128x128px)

**Quick Icon Generator Options:**
- Use Figma/Canva
- Use AI: "Create a purple gradient checkmark icon for a fact-checking app"
- Online tool: https://www.favicon-generator.org/

**Icon Design:**
- Purple gradient (#667eea to #764ba2)
- Simple checkmark, shield, or magnifying glass
- Clear on light and dark backgrounds

## Step 4: Test in Chrome

1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select `dist/extension` folder
5. Test:
   - Click extension icon
   - Try signup flow
   - Verify some content
   - Check achievements

## Step 5: Create ZIP for Chrome Web Store

**Mac/Linux:**
```bash
cd dist/extension
zip -r ../../veriedit-ai-extension.zip .
cd ../..
```

**Windows:**
```bash
cd dist\extension
tar -a -c -f ..\..\veriedit-ai-extension.zip *
cd ..\..
```

Or right-click `dist/extension` → Send to → Compressed folder

## Step 6: Submit to Chrome Web Store

1. Go to https://chrome.google.com/webstore/devconsole
2. Pay $5 developer fee (one-time, if first extension)
3. Click "New Item"
4. Upload `veriedit-ai-extension.zip`
5. Fill in details (use content from `CHROME_STORE_README.md`)
6. Upload screenshots (1280x800px - 5 minimum)
7. Set privacy policy URL: `https://sqtkkzdswxazyikcheds.supabase.co/privacy`
8. Submit for review (1-3 days)

## Need Help?

See `BUILD_AND_LAUNCH.md` for detailed instructions, troubleshooting, and marketing tips.

---

## Quick Checklist

- [ ] Extension built (`dist/extension` folder exists)
- [ ] Manifest copied
- [ ] 3 icons added (16, 48, 128px)
- [ ] Tested in Chrome locally
- [ ] 5 screenshots captured (1280x800px)
- [ ] ZIP file created
- [ ] Chrome Web Store account ready
- [ ] Privacy policy page live at /privacy

**You're ready to launch! 🚀**
