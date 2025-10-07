import { getApiKey, getCachedVerification, setCachedVerification } from '../shared/storage';
import { MessageRequest, MessageResponse, VerificationResult } from '../shared/types';

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
    return true; // Keep channel open for async response
  }
  
  if (message.type === 'GET_API_KEY') {
    getApiKey()
      .then(apiKey => sendResponse({ success: true, data: apiKey as any }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (message.type === 'SAVE_API_KEY') {
    import('../shared/storage').then(({ saveApiKey }) => {
      return saveApiKey(message.apiKey!);
    })
      .then(() => sendResponse({ success: true }))
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
  
  // Get API key
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error('API key not configured. Please set your API key in the extension settings.');
  }
  
  // Call verification API
  const response = await fetch(
    'https://sqtkkzdswxazyikcheds.supabase.co/functions/v1/verify-extension',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
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
  
  return result;
}

function updateBadge(trustScore: number) {
  const color = trustScore >= 70 ? '#10b981' : trustScore >= 40 ? '#f59e0b' : '#ef4444';
  chrome.action.setBadgeBackgroundColor({ color });
  chrome.action.setBadgeText({ text: trustScore.toString() });
}
