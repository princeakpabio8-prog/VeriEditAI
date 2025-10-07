import { VerificationResult } from '../shared/types';

// Platform-specific selectors for different social media sites
const PLATFORM_SELECTORS = {
  twitter: {
    posts: '[data-testid="tweetText"]',
    container: '[data-testid="tweet"]'
  },
  facebook: {
    posts: '[data-ad-preview="message"]',
    container: '[role="article"]'
  },
  reddit: {
    posts: '[data-click-id="text"]',
    container: '[data-testid="post-container"]'
  },
  linkedin: {
    posts: '.feed-shared-update-v2__description',
    container: '.feed-shared-update-v2'
  }
};

// Detect current platform
function detectPlatform(): keyof typeof PLATFORM_SELECTORS | null {
  const hostname = window.location.hostname;
  if (hostname.includes('twitter.com') || hostname.includes('x.com')) return 'twitter';
  if (hostname.includes('facebook.com')) return 'facebook';
  if (hostname.includes('reddit.com')) return 'reddit';
  if (hostname.includes('linkedin.com')) return 'linkedin';
  return null;
}

// Create verification badge
function createBadge(result: VerificationResult): HTMLElement {
  const badge = document.createElement('div');
  badge.className = 'truthlens-badge';
  
  const trustScore = result.trustScore;
  let badgeClass = 'low';
  let badgeText = 'Low Trust';
  let badgeIcon = '⚠️';
  
  if (trustScore >= 75) {
    badgeClass = 'high';
    badgeText = 'High Trust';
    badgeIcon = '✓';
  } else if (trustScore >= 50) {
    badgeClass = 'medium';
    badgeText = 'Medium Trust';
    badgeIcon = '●';
  }
  
  badge.innerHTML = `
    <div class="truthlens-badge-content ${badgeClass}">
      <span class="badge-icon">${badgeIcon}</span>
      <span class="badge-text">${badgeText}</span>
      <span class="badge-score">${trustScore}%</span>
    </div>
    <div class="truthlens-tooltip">
      <div class="tooltip-header">TruthLens Verification</div>
      <div class="tooltip-score">Trust Score: ${trustScore}%</div>
      <div class="tooltip-summary">${result.summary}</div>
      ${result.sources && result.sources.length > 0 ? `
        <div class="tooltip-sources">
          <div class="sources-header">Sources:</div>
          ${result.sources.slice(0, 3).map(s => `
            <div class="source-item">
              <a href="${s.url}" target="_blank">${s.title || s.url}</a>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;
  
  return badge;
}

// Verify content and add badge
async function verifyContent(element: Element, content: string) {
  // Check if already verified
  if (element.querySelector('.truthlens-badge')) return;
  
  try {
    // Send message to background script to verify
    const response = await chrome.runtime.sendMessage({
      type: 'VERIFY_CONTENT',
      content: content
    });
    
    if (response.success && response.data) {
      const badge = createBadge(response.data);
      
      // Find the best place to insert badge
      const container = element.closest(PLATFORM_SELECTORS[detectPlatform()!]?.container || 'div');
      if (container) {
        container.appendChild(badge);
      }
    }
  } catch (error) {
    console.error('TruthLens verification error:', error);
  }
}

// Observe DOM for new content
function observeContent() {
  const platform = detectPlatform();
  if (!platform) return;
  
  const selectors = PLATFORM_SELECTORS[platform];
  
  // Initial scan
  const posts = document.querySelectorAll(selectors.posts);
  posts.forEach(post => {
    const content = post.textContent?.trim();
    if (content && content.length > 50) {
      verifyContent(post, content);
    }
  });
  
  // Watch for new posts
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node instanceof Element) {
          const posts = node.querySelectorAll(selectors.posts);
          posts.forEach(post => {
            const content = post.textContent?.trim();
            if (content && content.length > 50) {
              verifyContent(post, content);
            }
          });
        }
      });
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Inject styles
function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .truthlens-badge {
      position: relative;
      display: inline-block;
      margin: 8px 0;
    }
    
    .truthlens-badge-content {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 16px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .truthlens-badge-content:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    .truthlens-badge-content.high {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
    }
    
    .truthlens-badge-content.medium {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
    }
    
    .truthlens-badge-content.low {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
    }
    
    .badge-icon {
      font-size: 14px;
    }
    
    .badge-score {
      font-weight: 700;
    }
    
    .truthlens-tooltip {
      display: none;
      position: absolute;
      top: 100%;
      left: 0;
      margin-top: 8px;
      padding: 16px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
      min-width: 300px;
      max-width: 400px;
      z-index: 10000;
      border: 1px solid #e5e7eb;
    }
    
    .truthlens-badge:hover .truthlens-tooltip {
      display: block;
    }
    
    .tooltip-header {
      font-weight: 700;
      font-size: 14px;
      color: #111827;
      margin-bottom: 8px;
    }
    
    .tooltip-score {
      font-size: 13px;
      color: #6b7280;
      margin-bottom: 8px;
    }
    
    .tooltip-summary {
      font-size: 13px;
      color: #374151;
      line-height: 1.5;
      margin-bottom: 12px;
    }
    
    .tooltip-sources {
      border-top: 1px solid #e5e7eb;
      padding-top: 12px;
    }
    
    .sources-header {
      font-weight: 600;
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 6px;
    }
    
    .source-item {
      margin: 4px 0;
    }
    
    .source-item a {
      font-size: 12px;
      color: #2563eb;
      text-decoration: none;
      display: block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .source-item a:hover {
      text-decoration: underline;
    }
  `;
  document.head.appendChild(style);
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    injectStyles();
    observeContent();
  });
} else {
  injectStyles();
  observeContent();
}
