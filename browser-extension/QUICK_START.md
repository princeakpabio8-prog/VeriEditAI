# 🚀 Extension Launch - Quick Start

## Prerequisites
✅ Node.js installed  
✅ Chrome browser  
✅ Text editor  

## 5-Minute Build Process

### 1️⃣ Build (1 min)
```bash
npx vite build --config browser-extension/vite.config.extension.ts
cp browser-extension/manifest.json dist/extension/manifest.json
```

### 2️⃣ Add Icons (2 min)
Download these 3 files and put in `dist/extension/assets/`:

**Option A: Use AI Generator**
Prompt: "Create a modern purple gradient checkmark icon, 128x128px, transparent background, suitable for a fact-checking browser extension"

**Option B: Use Placeholder**
For testing, you can use any 3 PNG files renamed as:
- `icon-16.png`
- `icon-48.png`
- `icon-128.png`

### 3️⃣ Test (1 min)
1. Chrome → `chrome://extensions/`
2. Toggle "Developer mode" ON
3. "Load unpacked" → select `dist/extension`
4. Click extension icon to test

### 4️⃣ Screenshot (1 min)
Open extension popup and take 5 screenshots at 1280x800px:
1. Signup screen
2. Verification input
3. Results with trust score
4. Achievements page
5. Share buttons

**Quick Screenshot Method:**
- F12 (DevTools) → Device toolbar
- Select 1280x800 responsive
- Cmd+Shift+P → "Capture screenshot"

### 5️⃣ Package
```bash
cd dist/extension
zip -r ../../veriedit-extension.zip .
```

## Ready to Submit! ✨

**Chrome Web Store:** https://chrome.google.com/webstore/devconsole

**Need help?** See `BUILD.md` for detailed instructions.

---

## What's Included

✅ Inline signup with referral codes  
✅ Achievement system  
✅ Social sharing  
✅ Trust score visualization  
✅ Multi-platform support (Twitter, Facebook, Reddit, LinkedIn)  
✅ Caching for faster results  
✅ Privacy policy page  

## Support

- Email: support@veriedit-ai.com
- Docs: https://sqtkkzdswxazyikcheds.supabase.co/extensions
