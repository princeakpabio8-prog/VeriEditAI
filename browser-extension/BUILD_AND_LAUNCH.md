# VeriedIT AI Extension - Build & Launch Guide

## 🚀 Quick Start Build

### Prerequisites
- Node.js 18+ installed
- Chrome browser for testing

### Step 1: Build the Extension

```bash
# Install dependencies (if not already done)
npm install

# Build the extension
npm run build:extension
```

This will create the extension in `dist/extension/` folder.

### Step 2: Add Extension Icons

You need to create three PNG icons and add them to `dist/extension/assets/`:

- **icon-16.png** (16x16px) - Toolbar icon
- **icon-48.png** (48x48px) - Extension management page
- **icon-128.png** (128x128px) - Chrome Web Store

**Icon Design Tips:**
- Use your brand colors (purple gradient: #667eea to #764ba2)
- Simple, recognizable logo (checkmark, shield, or magnifying glass)
- Clear on both light and dark backgrounds
- Use tools like Figma, Canva, or AI image generators

### Step 3: Test Locally in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select the `dist/extension` folder
5. Test the extension:
   - Click the extension icon
   - Try verifying content
   - Test signup flow
   - Check achievements

### Step 4: Create ZIP for Chrome Web Store

```bash
cd dist/extension
zip -r veriedit-ai-extension.zip .
```

Or on Windows:
- Right-click the `dist/extension` folder
- Select "Send to" → "Compressed (zipped) folder"

---

## 📸 Chrome Web Store Assets

### Required Screenshots (5 minimum, 1280x800px)

**Screenshot 1: Main Extension Popup**
- Show the verification interface
- Highlight the trust score display
- Caption: "Verify any content with AI-powered fact-checking"

**Screenshot 2: Signup Flow**
- Show the signup screen
- Highlight referral code bonus
- Caption: "Get started in seconds with 5 free verifications"

**Screenshot 3: Verification Results**
- Show a completed verification with trust score
- Display sources
- Caption: "Get instant trust scores with source analysis"

**Screenshot 4: Achievements**
- Show the achievements screen
- Display unlocked badges
- Caption: "Unlock achievements as you fight misinformation"

**Screenshot 5: Social Sharing**
- Show the share buttons
- Highlight Twitter/LinkedIn integration
- Caption: "Share verified results with your network"

**How to capture:**
1. Load extension in Chrome
2. Open DevTools (F12)
3. Set device to 1280x800
4. Use Chrome's screenshot tool or a tool like Awesome Screenshot

### Promotional Tiles

**Small Tile (440x280px):**
- Extension icon + "VeriedIT AI"
- Tagline: "Truth Verification"
- Use brand gradient background

**Large Tile (920x680px - Optional):**
- Feature showcase grid
- 3-4 key features with icons
- Strong call-to-action

**Marquee Tile (1400x560px - Recommended):**
- Hero image with extension screenshot
- Bold headline: "Stop Misinformation with AI"
- Subheadline: "Verify content instantly on Twitter, Facebook, Reddit & more"

---

## 📝 Store Listing Content

### Short Description (132 chars max)
```
Instantly verify any content with AI. Get real-time trust scores on social media posts. Stop misinformation.
```

### Detailed Description
See `CHROME_STORE_README.md` for the full detailed description.

### Categories
- **Primary:** Productivity
- **Secondary:** Social & Communication

### Support Links

**Homepage URL:**
```
https://sqtkkzdswxazyikcheds.supabase.co
```

**Support URL:**
```
https://sqtkkzdswxazyikcheds.supabase.co/extensions
```

**Privacy Policy URL:**
You need to create this page at: `https://sqtkkzdswxazyikcheds.supabase.co/privacy`

---

## 🔒 Privacy Policy Requirements

Create a `/src/pages/Privacy.tsx` page with:

### Required Sections:

1. **Data Collection**
   - Email addresses (for authentication)
   - Verification requests (content being verified)
   - Usage statistics (verification count, achievement progress)

2. **How We Use Data**
   - Authentication and account management
   - Providing verification services
   - Improving service quality
   - Awarding achievements and bonuses

3. **Third-Party Services**
   - Supabase (authentication, database)
   - AI providers (Anthropic, Perplexity for verification)
   - No data sharing with advertisers or third parties

4. **User Rights**
   - Access to your data
   - Data deletion (contact support)
   - Account termination

5. **Data Storage & Security**
   - Encrypted connections (HTTPS)
   - Secure database (Supabase)
   - Industry-standard security practices

6. **Compliance**
   - GDPR compliant
   - Chrome Web Store policies
   - Data retention: Verifications stored for account lifetime

### Quick Privacy Policy Template:
```markdown
# Privacy Policy for VeriedIT AI Extension

Last Updated: [Date]

## What We Collect
- Email address (for account creation)
- Verification requests (content you verify)
- Usage statistics (verification count, achievements)

## How We Use It
- Authenticate your account
- Provide verification services
- Award achievements and referral bonuses
- Improve our service

## Third-Party Services
We use Supabase for secure data storage and AI providers for verification. We never share your data with advertisers.

## Your Rights
You can request data deletion by contacting support@veriedit-ai.com

## Security
All data transmitted over HTTPS. Industry-standard encryption.

Contact: support@veriedit-ai.com
```

---

## 🎯 Chrome Web Store Submission

### Step-by-Step Submission:

1. **Go to Chrome Web Store Developer Dashboard**
   - https://chrome.google.com/webstore/devconsole
   - Sign in with Google account
   - Pay $5 one-time developer fee (if first time)

2. **Create New Item**
   - Click "New Item"
   - Upload `veriedit-ai-extension.zip`
   - Wait for upload to complete

3. **Fill Store Listing**
   - **Detailed Description:** Copy from CHROME_STORE_README.md
   - **Short Description:** (See above)
   - **Category:** Productivity
   - **Language:** English

4. **Upload Graphics**
   - Upload 5 screenshots (1280x800px)
   - Upload small tile (440x280px)
   - Upload large tile if available (920x680px)
   - Upload marquee if available (1400x560px)

5. **Add URLs**
   - Homepage: https://sqtkkzdswxazyikcheds.supabase.co
   - Support: https://sqtkkzdswxazyikcheds.supabase.co/extensions
   - Privacy Policy: https://sqtkkzdswxazyikcheds.supabase.co/privacy

6. **Distribution**
   - Select "Public" (or "Unlisted" for beta)
   - Select all countries (or specific regions)

7. **Submit for Review**
   - Review all information
   - Click "Submit for Review"
   - Wait 1-3 business days for approval

---

## 🎉 Post-Launch Checklist

### Week 1:
- [ ] Monitor Chrome Web Store reviews
- [ ] Respond to user feedback within 24 hours
- [ ] Track install metrics
- [ ] Share on social media
- [ ] Post to Product Hunt

### Week 2:
- [ ] Email existing users about extension
- [ ] Post in Reddit communities (r/chrome_extensions, r/productivity)
- [ ] Reach out to tech bloggers/journalists

### Week 3:
- [ ] Analyze usage data
- [ ] Fix any reported bugs
- [ ] A/B test referral rewards
- [ ] Optimize store listing based on conversion data

### Growth Targets:
- **Week 1:** 100 installs
- **Month 1:** 1,000 installs
- **Month 3:** 10,000 installs
- **Month 6:** 50,000+ installs

---

## 🛠️ Troubleshooting

### "Extension failed to load"
- Check that all required files are in dist/extension/
- Verify manifest.json is valid JSON
- Ensure service worker file exists at background/service-worker.js

### "Icons not showing"
- Verify icon files exist in dist/extension/assets/
- Check icon file names match manifest.json
- Ensure icons are PNG format

### "Verification not working"
- Check API endpoint is accessible
- Verify user has valid API key
- Check browser console for errors

### "Achievement notifications not showing"
- Ensure notifications permission in manifest
- Check chrome.notifications API availability
- Verify achievement logic in achievements.ts

---

## 📞 Support

- **Email:** support@veriedit-ai.com
- **Documentation:** https://sqtkkzdswxazyikcheds.supabase.co/extensions
- **Issues:** Report on GitHub or contact support

---

## 🚀 Ready to Launch?

**Pre-launch Checklist:**
- [ ] Extension builds without errors
- [ ] All icons added (16, 48, 128px)
- [ ] Tested locally in Chrome
- [ ] 5 screenshots created
- [ ] Privacy policy page live
- [ ] Store listing content ready
- [ ] Support email configured
- [ ] ZIP file created

**Submit when ready!** 🎯

Good luck with your launch! 🚀
