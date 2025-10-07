# TruthLens Browser Extension

AI-powered content verification browser extension for Chrome, Firefox, and Edge.

## Features

### 🎯 Core Features
- **Real-time Verification**: Instantly verify content on social media platforms
- **Trust Score System**: Get clear trust scores (0-100) for any content
- **Smart Badges**: Visual indicators appear on verified posts
- **Multi-Platform Support**: Works on Twitter/X, Facebook, Reddit, LinkedIn
- **Caching System**: Fast verification with 24-hour intelligent caching
- **Context Menu**: Right-click any selected text to verify

### 🔧 Technical Features
- **Content Scripts**: Automatic injection on supported platforms
- **Background Service Worker**: Efficient API handling and caching
- **React Popup UI**: Beautiful, responsive interface
- **TypeScript**: Full type safety throughout
- **Storage API**: Secure local storage for API keys and settings

## Installation

### From Source

1. **Clone and Build**
   ```bash
   cd browser-extension
   npm install
   npm run build
   ```

2. **Load in Chrome**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `browser-extension/dist` folder

3. **Load in Firefox**
   - Open `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on"
   - Select the `manifest.json` from `browser-extension/dist`

## Configuration

### Getting an API Key

1. Visit [TruthLens Dashboard](https://sqtkkzdswxazyikcheds.supabase.co)
2. Sign up or log in
3. Navigate to Profile → API Keys
4. Generate a new API key
5. Copy and paste it into the extension popup

### Extension Settings

The extension offers several configurable settings:

- **Auto-verify**: Automatically verify content as you browse
- **Show Badges**: Display verification badges on posts
- **Trust Threshold**: Set minimum trust score for warnings (0-100)

## Usage

### Manual Verification

1. Click the extension icon
2. Paste content into the text area
3. Click "Verify Content"
4. View trust score and detailed analysis

### Automatic Verification

1. Enable "Auto-verify" in settings
2. Browse supported platforms (Twitter, Facebook, etc.)
3. Verification badges appear automatically on posts
4. Hover over badges to see detailed results

### Context Menu

1. Select any text on a webpage
2. Right-click → "Verify with TruthLens"
3. See instant verification results

## Platform Support

### Currently Supported
- ✅ Twitter / X
- ✅ Facebook
- ✅ Reddit
- ✅ LinkedIn

### Coming Soon
- 🔄 Instagram
- 🔄 YouTube
- 🔄 TikTok
- 🔄 News websites

## Architecture

```
browser-extension/
├── background/          # Service worker for API calls
│   └── service-worker.ts
├── content/            # Content scripts for page injection
│   └── content-script.ts
├── popup/              # Extension popup UI
│   ├── popup.tsx
│   ├── popup.html
│   └── popup.css
├── shared/             # Shared utilities
│   ├── types.ts
│   └── storage.ts
├── icons/              # Extension icons
├── manifest.json       # Extension manifest
└── vite.config.extension.ts
```

## Development

### Development Mode

```bash
# Watch mode for auto-rebuild
npm run dev

# Build for production
npm run build
```

### Testing

```bash
# Run tests
npm test

# Type checking
npm run type-check
```

## Privacy & Security

- ✅ No user data collection
- ✅ API keys stored locally only
- ✅ HTTPS-only communication
- ✅ Minimal permissions required
- ✅ Open source and auditable

## Troubleshooting

### Extension not working?

1. **Check API Key**: Ensure your API key is valid and saved
2. **Refresh Page**: Reload the webpage after installing
3. **Check Permissions**: Verify extension has necessary permissions
4. **View Console**: Check browser console for error messages

### Badge not appearing?

1. **Enable Badges**: Check "Show badges" in settings
2. **Supported Platform**: Ensure you're on a supported platform
3. **Content Length**: Posts must be >50 characters to auto-verify
4. **Reload Extension**: Try disabling and re-enabling the extension

### Verification failed?

1. **API Key**: Verify your API key is correct
2. **Credits**: Check you have remaining verification credits
3. **Network**: Ensure you have internet connection
4. **Content**: Some content types may not be verifiable

## API Rate Limits

- Free Plan: 5 verifications/day
- Pro Plan: Unlimited verifications
- Enterprise: Custom limits

## Support

- 📧 Email: support@truthlens.app
- 💬 Discord: [Join our community](https://discord.gg/truthlens)
- 📚 Docs: [Full documentation](https://docs.truthlens.app)

## License

MIT License - see LICENSE file for details

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## Changelog

### v1.0.0 (Current)
- Initial release
- Multi-platform support
- React popup interface
- Auto-verification
- Badge system
- Caching system
