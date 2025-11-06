/**
 * Haptic Feedback Utilities for Mobile Devices
 * Provides tactile feedback through device vibration
 */

export const haptics = {
  /**
   * Check if haptic feedback is supported
   */
  isSupported: (): boolean => {
    return 'vibrate' in navigator;
  },

  /**
   * Light tap - for button presses and minor interactions
   */
  light: () => {
    if (haptics.isSupported()) {
      navigator.vibrate(10);
    }
  },

  /**
   * Medium impact - for step changes and moderate events
   */
  medium: () => {
    if (haptics.isSupported()) {
      navigator.vibrate(20);
    }
  },

  /**
   * Heavy impact - for important events
   */
  heavy: () => {
    if (haptics.isSupported()) {
      navigator.vibrate(30);
    }
  },

  /**
   * Success pattern - for successful operations
   */
  success: () => {
    if (haptics.isSupported()) {
      navigator.vibrate([10, 50, 10]);
    }
  },

  /**
   * Error pattern - for errors and warnings
   */
  error: () => {
    if (haptics.isSupported()) {
      navigator.vibrate([50, 100, 50]);
    }
  },

  /**
   * Selection pattern - for selecting items
   */
  selection: () => {
    if (haptics.isSupported()) {
      navigator.vibrate(5);
    }
  },

  /**
   * Notification pattern - for notifications
   */
  notification: () => {
    if (haptics.isSupported()) {
      navigator.vibrate([10, 30, 10, 30, 10]);
    }
  },

  /**
   * Progress pattern - for progress updates
   */
  progress: () => {
    if (haptics.isSupported()) {
      navigator.vibrate(15);
    }
  },

  /**
   * Custom vibration pattern
   * @param pattern - Array of vibration durations in ms [vibrate, pause, vibrate, ...]
   */
  custom: (pattern: number[]) => {
    if (haptics.isSupported()) {
      navigator.vibrate(pattern);
    }
  },
};

/**
 * Hook for haptic feedback
 */
export const useHaptics = () => {
  return haptics;
};
