import { CachedVerification, StorageData, VerificationResult } from './types';

export async function hashContent(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function getCachedVerification(content: string): Promise<VerificationResult | null> {
  const hash = await hashContent(content);
  const storage = await chrome.storage.local.get(['verifications']);
  const verifications: CachedVerification[] = storage.verifications || [];
  
  const cached = verifications.find(v => v.contentHash === hash);
  
  // Check if cache is still valid (24 hours)
  if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
    return cached.result;
  }
  
  return null;
}

export async function setCachedVerification(content: string, result: VerificationResult): Promise<void> {
  const hash = await hashContent(content);
  const storage = await chrome.storage.local.get(['verifications']);
  const verifications: CachedVerification[] = storage.verifications || [];
  
  // Add new verification at the beginning
  verifications.unshift({
    content: content.substring(0, 200), // Store preview only
    contentHash: hash,
    result,
    timestamp: Date.now()
  });
  
  // Keep only last 100 verifications
  if (verifications.length > 100) {
    verifications.length = 100;
  }
  
  await chrome.storage.local.set({ verifications });
}

export async function getApiKey(): Promise<string | null> {
  const storage = await chrome.storage.local.get(['apiKey']);
  return storage.apiKey || null;
}

export async function saveApiKey(apiKey: string): Promise<void> {
  await chrome.storage.local.set({ apiKey });
}

export async function clearCache(): Promise<void> {
  await chrome.storage.local.set({ verifications: [] });
}

export async function getStorage(keys: string[]): Promise<any> {
  return await chrome.storage.local.get(keys);
}

export async function setStorage(data: any): Promise<void> {
  await chrome.storage.local.set(data);
}
