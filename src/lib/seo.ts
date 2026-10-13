export const SITE_URL = "https://trust-lighthouse.lovable.app";
export const SITE_TITLE = "VeriEdit AI | Trust Infrastructure for the AI era";
export const SITE_DESCRIPTION = "Verify claims, articles, and documents with VeriEdit AI. Explore source evidence, AI fact-checking, trust scores, and Truth Badges for the AI era.";

export const publicPageMetadata: Record<string, { title: string; description: string }> = {
  "/": { title: SITE_TITLE, description: SITE_DESCRIPTION },
  "/about": { title: "About VeriEdit AI | Trust Infrastructure for the AI era", description: "Meet VeriEdit AI and its founder. Learn about our mission to make AI-powered fact-checking, source analysis, and content verification accessible." },
  "/blog": { title: "Fact-Checking & the Trust Economy Journal | VeriEdit AI", description: "Read the VeriEdit AI journal on fact-checking, misinformation, content verification, the trust economy, and Truth Badges." },
  "/truth-badge": { title: "Truth Badge Membership & Discord Access | VeriEdit AI", description: "Explore VeriEdit AI Truth Badge membership, wallet verification, Discord community access, early features, and priority support." },
  "/lighthouse": { title: "Lighthouse Verification Community | VeriEdit AI", description: "Explore Lighthouse discussions, verified claims, organizations, and shared source evidence in the VeriEdit AI community." },
  "/viral-claims": { title: "Trending Claims & Fact-Checking | VeriEdit AI", description: "Browse circulating claims, explore their verification results, and examine the supporting evidence with VeriEdit AI." },
  "/activity-feed": { title: "Public Verification Activity | VeriEdit AI", description: "Explore the public record of verification activity and community discussions across VeriEdit AI." },
  "/extensions": { title: "AI Fact-Checking Browser Extension | VeriEdit AI", description: "Explore the VeriEdit AI browser extension for checking claims and accessing content verification while browsing." },
  "/api-docs": { title: "Content Verification API Documentation | VeriEdit AI", description: "Read VeriEdit AI API documentation for integrating AI-powered fact-checking, source analysis, and trust scores." },
  "/api/docs": { title: "Verification API Reference | VeriEdit AI", description: "Explore the VeriEdit AI API reference, request formats, and verification endpoints." },
  "/demo": { title: "AI Content Verification Demo | VeriEdit AI", description: "Explore how VeriEdit AI checks claims and presents source evidence and trust scores." },
  "/press": { title: "Press & Company Information | VeriEdit AI", description: "Find company information, founder details, and press resources for VeriEdit AI." },
  "/install": { title: "Install VeriEdit AI", description: "Add VeriEdit AI to your device for access to content verification and the Lighthouse community." },
  "/privacy": { title: "Privacy Policy | VeriEdit AI", description: "Read how VeriEdit AI handles personal information and protects your privacy." },
  "/terms": { title: "Terms of Service | VeriEdit AI", description: "Read the terms governing your use of VeriEdit AI verification and community services." },
  "/refund-policy": { title: "Refund Policy | VeriEdit AI", description: "Read VeriEdit AI's refund policy and payment terms." },
  "/nft-marketplace": { title: "Truth Badge Marketplace | VeriEdit AI", description: "Explore VeriEdit AI Truth Badges and on-chain verification badge collections." },
  "/trust-oracle": { title: "Trust Oracle | VeriEdit AI", description: "Explore trust signals and verification insights with the VeriEdit AI Trust Oracle." },
  "/bounties": { title: "Verification Bounties | VeriEdit AI", description: "Explore available verification bounties in the VeriEdit AI community." },
  "/signal-feed": { title: "Verification Signal Feed | VeriEdit AI", description: "Explore content verification signals and community evidence with VeriEdit AI." },
};

export function canonicalUrl(pathname: string) {
  const path = pathname === "/index" ? "/" : pathname.replace(/\/$/, "") || "/";
  return `${SITE_URL}${path}`;
}

export function isPublicContentPath(path: string) {
  return /^\/blog\/[^/]+$/.test(path) && path !== "/blog/write"
    || /^\/lighthouse\/[^/]+(?:\/thread\/[^/]+)?$/.test(path)
    || /^\/lighthouse\/(?:organizations|activity)\/[^/]+$/.test(path)
    || /^\/(?:user|share|claim)\/[^/]+$/.test(path)
    || /^\/thread\/share\/[^/]+$/.test(path);
}