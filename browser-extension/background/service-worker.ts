import { getCachedVerification, setCachedVerification } from '../shared/storage';
import { MessageRequest, MessageResponse, VerificationResult } from '../shared/types';
import { checkAndAwardAchievements, getVerificationCount } from '../shared/achievements';

const SUPABASE_URL = 'https://sqtkkzdswxazyikcheds.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxdGtremRzd3hhenlpa2NoZWRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MDM1NDEsImV4cCI6MjA3MzA3OTU0MX0.1vQ2RDB5dgsmUwfiy9KeVuS0P6gHlKSAUsMVo5-5vto';

// Create context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "verify-text",
    title: "Verify with VeriedIT AI",
    contexts: ["selection"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "verify-text" && info.selectionText && tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      type: 'VERIFY_SELECTION',
      content: info.selectionText
    });
  }
});

// Message handler
chrome.runtime.onMessage.addListener((message: MessageRequest, sender, sendResponse) => {
  if (message.type === 'VERIFY_CONTENT') {
    handleVerification(message.content!)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

async function handleVerification(content: string): Promise<VerificationResult> {
  // Check cache first
  const cached = await getCachedVerification(content);
  if (cached) {
    console.log('Returning cached result');
    return cached;
  }
  
  // Call verification API - no API key needed
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/verify-extension`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ content })
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Verification failed');
  }
  
  const result: VerificationResult = await response.json();
  
  // Cache the result
  await setCachedVerification(content, result);
  
  // Update badge with trust score
  updateBadge(result.trustScore);
  
  // Check and award achievements
  const verificationCount = await getVerificationCount();
  await checkAndAwardAchievements(verificationCount);
  
  return result;
}

function updateBadge(trustScore: number) {
  const color = trustScore >= 70 ? '#10b981' : trustScore >= 40 ? '#f59e0b' : '#ef4444';
  chrome.action.setBadgeBackgroundColor({ color });
  chrome.action.setBadgeText({ text: trustScore.toString() });
}
