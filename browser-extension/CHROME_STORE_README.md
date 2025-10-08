# VeriedIT AI - Chrome Web Store Submission Guide

## 📦 Submission Checklist

### Required Assets

#### Icons (Already in `browser-extension/assets/`)
- ✅ 16x16px icon (`icon-16.png`)
- ✅ 48x48px icon (`icon-48.png`)
- ✅ 128x128px icon (`icon-128.png`)

#### Screenshots (Create these - 1280x800px each, minimum 5)
1. **Main Extension Popup** - Show the verification interface
2. **Context Menu Verification** - Demonstrate right-click to verify
3. **Trust Score Display** - Show trust score results with sources
4. **Social Media Integration** - Show badges on Twitter/Facebook
5. **Settings Panel** - Display the API key configuration

#### Promotional Tiles (Create these)
- Small tile: 440x280px
- Large tile: 920x680px (optional)
- Marquee: 1400x560px (optional but recommended)

### Store Listing Information

#### Short Description (132 chars max)
```
Instantly verify any content with AI. Get real-time trust scores on social media posts. Stop misinformation.
```

#### Detailed Description
```markdown
# Verify Any Content with AI-Powered Fact-Checking

VeriedIT AI is your personal fact-checker that works everywhere online. Get instant trust scores and source credibility analysis for any content you see on social media.

## ✨ Key Features

🔍 **One-Click Verification**
- Verify tweets, Facebook posts, Reddit comments, and more
- Get AI-powered trust scores in seconds
- See source credibility and bias analysis

📊 **Comprehensive Analysis**
- Multi-source fact-checking
- Political bias detection
- Editorial quality assessment
- Source reputation tracking

🚀 **Works On Your Favorite Sites**
- Twitter/X
- Facebook
- LinkedIn
- Reddit
- And more platforms coming soon!

🎯 **Real-Time Trust Scores**
- Visual trust score badges (0-100)
- Color-coded reliability indicators
- Detailed source breakdowns

## 🎁 Free Plan Includes
- 5 free verifications per month
- Basic trust score analysis
- Source credibility checks

## 💎 Pro Features
- Unlimited verifications
- Advanced analytics
- Priority processing
- API access
- PDF export

## 🔒 Privacy & Security
- No data tracking
- Encrypted API communication
- Secure authentication
- GDPR compliant

## 📱 How to Use
1. Install the extension
2. Sign up for free account (or use API key)
3. Highlight any text on supported sites
4. Click "Verify with AI"
5. Get instant trust score and sources

## 🤝 Perfect For
- Journalists and fact-checkers
- Researchers and academics
- Social media managers
- Anyone who values truth online

## 🎁 Referral Bonus
Get 5 free verifications when you sign up with a referral code! Invite friends and earn 10 free verifications for each signup.

Start verifying content today and join thousands fighting misinformation!

---

**Need help?** Visit our support page or contact us at support@veriedit-ai.com
```

#### Category
- **Primary:** Productivity
- **Secondary:** Social & Communication

#### Language
- English (add more as needed)

#### Privacy Policy URL
```
https://YOUR_DOMAIN.com/privacy
```

#### Support URL
```
https://YOUR_DOMAIN.com/extensions
```

### Privacy Policy Requirements

Create a privacy policy page at `https://YOUR_DOMAIN.com/privacy` with:

1. **Data Collection**
   - What data is collected (email, verification requests, usage stats)
   - How it's used (authentication, service improvement)
   - How it's stored (Supabase, encrypted)

2. **Third-Party Services**
   - Supabase (authentication and database)
   - AI providers (Anthropic, Perplexity, etc.)
   - Analytics (if any)

3. **User Rights**
   - Access to data
   - Data deletion
   - Account termination

4. **Compliance**
   - GDPR compliance
   - Data retention policies
   - Security measures

### 🚀 Submission Steps

1. **Build Extension**
   ```bash
   npm run build:extension
   ```

2. **Create ZIP File**
   ```bash
   cd dist/extension
   zip -r veriedit-ai-extension.zip .
   ```

3. **Go to Chrome Web Store Developer Dashboard**
   - https://chrome.google.com/webstore/devconsole
   - Pay $5 one-time developer fee (if first time)

4. **Upload Extension**
   - Click "New Item"
   - Upload the ZIP file
   - Fill in all metadata

5. **Add Store Listing Content**
   - Add all screenshots
   - Add promotional tiles
   - Copy descriptions from above
   - Add privacy policy URL
   - Add support URL

6. **Pricing & Distribution**
   - Select "Free"
   - Select all countries (or specific ones)
   - Choose visibility (Public or Unlisted for beta)

7. **Submit for Review**
   - Review all information
   - Click "Submit for Review"
   - Wait 1-3 days for approval

### 📊 Post-Launch

#### Track Metrics
- Chrome Web Store ratings
- Number of installs
- Daily active users (DAU)
- Review feedback

#### Optimization
- Respond to reviews
- Fix bugs quickly
- Add requested features
- Update screenshots with new features

#### Marketing
- Product Hunt launch
- Reddit communities
- Social media promotion
- Email existing users

### 🎯 Growth Targets

**Week 1:** 100 installs
**Month 1:** 1,000 installs  
**Month 3:** 10,000 installs
**Month 6:** 50,000 installs

### 📝 Notes

- Extension reviews take 1-3 business days
- Updates also require review
- Maintain 4.5+ star rating
- Respond to user feedback within 24 hours
- Update extension every 2-4 weeks with improvements

## 🔗 Important Links

- [Chrome Web Store Developer Guide](https://developer.chrome.com/docs/webstore/)
- [Extension Best Practices](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Publishing Guide](https://developer.chrome.com/docs/webstore/publish/)

---

**Good luck with your submission! 🚀**
