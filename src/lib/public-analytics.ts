/**
 * Public Analytics for tracking engagement on publicly visible content
 * Tracks views, shares, and clicks without requiring authentication
 */

import { supabase } from '@/integrations/supabase/client';

export type ContentType = 'thread' | 'article' | 'organization' | 'verification';
export type EventType = 'view' | 'share' | 'click' | 'upvote';

interface AnalyticsEvent {
  contentType: ContentType;
  contentId: string;
  eventType: EventType;
  metadata?: Record<string, any>;
}

/**
 * Track a public engagement event
 * This works for both authenticated and anonymous users
 */
export async function trackPublicEngagement({
  contentType,
  contentId,
  eventType,
  metadata = {},
}: AnalyticsEvent) {
  try {
    // For now, we'll track in localStorage and log
    // Later can be sent to analytics service or stored in DB
    const event = {
      contentType,
      contentId,
      eventType,
      timestamp: new Date().toISOString(),
      metadata,
    };

    // Store in localStorage for session tracking
    const storageKey = `analytics_${contentType}_${contentId}`;
    const existingData = localStorage.getItem(storageKey);
    const events = existingData ? JSON.parse(existingData) : [];
    events.push(event);
    localStorage.setItem(storageKey, JSON.stringify(events));

    // Log for debugging
    console.log('[Analytics]', event);

    return { success: true };
  } catch (error) {
    console.error('[Analytics] Error tracking event:', error);
    return { success: false, error };
  }
}

/**
 * Track page view for public content
 */
export function trackPageView(contentType: ContentType, contentId: string) {
  return trackPublicEngagement({
    contentType,
    contentId,
    eventType: 'view',
  });
}

/**
 * Track social share
 */
export function trackShare(
  contentType: ContentType,
  contentId: string,
  platform: string
) {
  return trackPublicEngagement({
    contentType,
    contentId,
    eventType: 'share',
    metadata: { platform },
  });
}

/**
 * Track link click
 */
export function trackClick(
  contentType: ContentType,
  contentId: string,
  targetUrl: string
) {
  return trackPublicEngagement({
    contentType,
    contentId,
    eventType: 'click',
    metadata: { targetUrl },
  });
}

/**
 * Get analytics summary for content (from localStorage)
 */
export function getContentAnalytics(contentType: ContentType, contentId: string) {
  try {
    const storageKey = `analytics_${contentType}_${contentId}`;
    const data = localStorage.getItem(storageKey);
    if (!data) return null;

    const events = JSON.parse(data);
    
    return {
      totalViews: events.filter((e: any) => e.eventType === 'view').length,
      totalShares: events.filter((e: any) => e.eventType === 'share').length,
      totalClicks: events.filter((e: any) => e.eventType === 'click').length,
      events,
    };
  } catch (error) {
    console.error('[Analytics] Error getting analytics:', error);
    return null;
  }
}

/**
 * Generate UTM parameters for tracking campaign performance
 */
export function generateUTMParams(
  source: string,
  medium: string = 'social',
  campaign: string = 'lighthouse_share'
): string {
  const params = new URLSearchParams({
    utm_source: source,
    utm_medium: medium,
    utm_campaign: campaign,
  });
  
  return params.toString();
}

/**
 * Create shareable URL with UTM tracking
 */
export function createShareableURL(
  baseUrl: string,
  platform: string
): string {
  const utmParams = generateUTMParams(platform, 'social', 'verification_share');
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}${utmParams}`;
}
