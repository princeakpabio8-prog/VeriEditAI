// Accessibility utilities and enhancements

interface AccessibilityOptions {
  reducedMotion?: boolean;
  highContrast?: boolean;
  largeText?: boolean;
  screenReader?: boolean;
  keyboardNavigation?: boolean;
}

class AccessibilityManager {
  private options: AccessibilityOptions = {};
  private focusStack: HTMLElement[] = [];
  private announcer: HTMLElement | null = null;

  constructor() {
    this.detectPreferences();
    this.createAnnouncer();
    this.setupKeyboardNavigation();
    this.setupFocusManagement();
  }

  private detectPreferences(): void {
    // Detect system preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    const prefersLargeText = window.matchMedia('(min-resolution: 144dpi)').matches;

    // Check for screen reader
    const screenReader = this.detectScreenReader();

    this.options = {
      reducedMotion: prefersReducedMotion,
      highContrast: prefersHighContrast,
      largeText: prefersLargeText,
      screenReader: screenReader,
      keyboardNavigation: true
    };

    // Apply initial settings
    this.applyPreferences();
  }

  private detectScreenReader(): boolean {
    // Various methods to detect screen readers
    return !!(
      navigator?.userAgent?.includes('NVDA') ||
      navigator?.userAgent?.includes('JAWS') ||
      navigator?.userAgent?.includes('VoiceOver') ||
      (window as any).speechSynthesis ||
      document.body?.classList?.contains('sr-only')
    );
  }

  private applyPreferences(): void {
    const root = document.documentElement;

    if (this.options.reducedMotion) {
      root.style.setProperty('--animation-duration', '0.01ms');
      root.style.setProperty('--transition-duration', '0.01ms');
    }

    if (this.options.highContrast) {
      root.classList.add('high-contrast');
    }

    if (this.options.largeText) {
      root.style.setProperty('--base-font-size', '18px');
    }

    if (this.options.screenReader) {
      root.classList.add('screen-reader-active');
    }
  }

  private createAnnouncer(): void {
    this.announcer = document.createElement('div');
    this.announcer.setAttribute('aria-live', 'polite');
    this.announcer.setAttribute('aria-atomic', 'true');
    this.announcer.style.position = 'absolute';
    this.announcer.style.left = '-10000px';
    this.announcer.style.width = '1px';
    this.announcer.style.height = '1px';
    this.announcer.style.overflow = 'hidden';
    document.body.appendChild(this.announcer);
  }

  private setupKeyboardNavigation(): void {
    // Skip links for keyboard navigation
    this.createSkipLinks();

    // Global keyboard event handling
    document.addEventListener('keydown', (event) => {
      this.handleGlobalKeydown(event);
    });

    // Focus visible on keyboard navigation
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        document.body.classList.add('keyboard-nav');
      }
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-nav');
    });
  }

  private createSkipLinks(): void {
    const skipLinks = document.createElement('div');
    skipLinks.className = 'skip-links';
    skipLinks.innerHTML = `
      <a href="#main-content" class="skip-link">Skip to main content</a>
      <a href="#navigation" class="skip-link">Skip to navigation</a>
      <a href="#search" class="skip-link">Skip to search</a>
    `;
    
    // Add styles for skip links
    const style = document.createElement('style');
    style.textContent = `
      .skip-links {
        position: absolute;
        top: -100px;
        left: 0;
        z-index: 9999;
      }
      .skip-link {
        position: absolute;
        left: -10000px;
        top: auto;
        width: 1px;
        height: 1px;
        overflow: hidden;
        background: var(--background);
        color: var(--foreground);
        padding: 8px 16px;
        text-decoration: none;
        border: 2px solid var(--primary);
        border-radius: 4px;
      }
      .skip-link:focus {
        position: static;
        width: auto;
        height: auto;
        overflow: visible;
      }
      .keyboard-nav *:focus {
        outline: 2px solid var(--primary) !important;
        outline-offset: 2px !important;
      }
    `;
    document.head.appendChild(style);
    document.body.insertBefore(skipLinks, document.body.firstChild);
  }

  private setupFocusManagement(): void {
    // Trap focus in modals
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        this.handleEscapeKey();
      }
    });
  }

  private handleGlobalKeydown(event: KeyboardEvent): void {
    // Global keyboard shortcuts
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case '/':
          event.preventDefault();
          this.focusSearch();
          break;
        case 'k':
          event.preventDefault();
          this.openCommandPalette();
          break;
        case 'h':
          event.preventDefault();
          this.showKeyboardShortcuts();
          break;
      }
    }

    // Navigation shortcuts
    if (event.altKey) {
      switch (event.key) {
        case '1':
          event.preventDefault();
          this.navigateToPage('/dashboard');
          break;
        case '2':
          event.preventDefault();
          this.navigateToPage('/verify');
          break;
        case '3':
          event.preventDefault();
          this.navigateToPage('/analytics');
          break;
      }
    }
  }

  private handleEscapeKey(): void {
    // Close modal/dialog if open
    const modal = document.querySelector('[role="dialog"]:not([hidden])');
    if (modal) {
      const closeButton = modal.querySelector('[data-close]') as HTMLElement;
      if (closeButton) {
        closeButton.click();
      }
    }
  }

  // Public methods
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (this.announcer) {
      this.announcer.setAttribute('aria-live', priority);
      this.announcer.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        if (this.announcer) {
          this.announcer.textContent = '';
        }
      }, 1000);
    }
  }

  focusElement(element: HTMLElement | null, options?: { preventScroll?: boolean }): void {
    if (element) {
      element.focus(options);
      this.announce(`Focused on ${this.getElementDescription(element)}`);
    }
  }

  focusFirst(container: HTMLElement = document.body): boolean {
    const focusable = this.getFocusableElements(container);
    if (focusable.length > 0) {
      this.focusElement(focusable[0]);
      return true;
    }
    return false;
  }

  focusLast(container: HTMLElement = document.body): boolean {
    const focusable = this.getFocusableElements(container);
    if (focusable.length > 0) {
      this.focusElement(focusable[focusable.length - 1]);
      return true;
    }
    return false;
  }

  trapFocus(container: HTMLElement): () => void {
    const focusable = this.getFocusableElements(container);
    const firstFocusable = focusable[0];
    const lastFocusable = focusable[focusable.length - 1];

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        if (event.shiftKey && document.activeElement === firstFocusable) {
          event.preventDefault();
          lastFocusable?.focus();
        } else if (!event.shiftKey && document.activeElement === lastFocusable) {
          event.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    
    // Focus first element
    if (firstFocusable) {
      firstFocusable.focus();
    }

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }

  getFocusableElements(container: HTMLElement = document.body): HTMLElement[] {
    if (!container || !container.querySelectorAll) return [];
    
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    return Array.from(container.querySelectorAll(selector))
      .filter((element) => {
        return this.isElementVisible(element as HTMLElement);
      }) as HTMLElement[];
  }

  private isElementVisible(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      element.offsetWidth > 0 &&
      element.offsetHeight > 0
    );
  }

  private getElementDescription(element: HTMLElement): string {
    if (!element || !element.tagName) return 'unknown element';
    
    const tagName = element.tagName.toLowerCase();
    const ariaLabel = element.getAttribute?.('aria-label');
    const title = element.getAttribute?.('title');
    const text = element.textContent?.trim();

    if (ariaLabel) return ariaLabel;
    if (title) return title;
    if (text && text.length < 50) return text;
    
    return `${tagName} element`;
  }

  private focusSearch(): void {
    const searchInput = document.querySelector('input[type="search"], input[placeholder*="search" i]') as HTMLElement;
    if (searchInput) {
      this.focusElement(searchInput);
    }
  }

  private openCommandPalette(): void {
    // Trigger command palette if available
    const commandPalette = document.querySelector('[data-command-palette]') as HTMLElement;
    if (commandPalette) {
      commandPalette.click();
    }
  }

  private showKeyboardShortcuts(): void {
    this.announce('Keyboard shortcuts: Ctrl+/ for search, Ctrl+K for command palette, Alt+1-3 for navigation');
  }

  private navigateToPage(path: string): void {
    window.location.href = path;
  }

  // Verification-specific accessibility helpers
  announceVerificationStart(contentType: string): void {
    this.announce(`Starting verification of ${contentType} content`, 'assertive');
  }

  announceVerificationComplete(trustScore: number): void {
    this.announce(`Verification complete. Trust score: ${trustScore} percent`, 'assertive');
  }

  announceVerificationError(error: string): void {
    this.announce(`Verification failed: ${error}`, 'assertive');
  }

  // Form accessibility helpers
  announceFormErrors(errors: string[]): void {
    if (errors.length > 0) {
      const message = `Form has ${errors.length} error${errors.length > 1 ? 's' : ''}: ${errors.join(', ')}`;
      this.announce(message, 'assertive');
    }
  }

  announcePageChange(pageName: string): void {
    this.announce(`Navigated to ${pageName} page`, 'polite');
  }

  // Options management
  updateOptions(newOptions: Partial<AccessibilityOptions>): void {
    this.options = { ...this.options, ...newOptions };
    this.applyPreferences();
  }

  getOptions(): AccessibilityOptions {
    return { ...this.options };
  }
}

// Global accessibility manager instance
export const accessibilityManager = new AccessibilityManager();

// React hook for accessibility features
export const useAccessibility = () => {
  return {
    announce: accessibilityManager.announce.bind(accessibilityManager),
    focusElement: accessibilityManager.focusElement.bind(accessibilityManager),
    focusFirst: accessibilityManager.focusFirst.bind(accessibilityManager),
    focusLast: accessibilityManager.focusLast.bind(accessibilityManager),
    trapFocus: accessibilityManager.trapFocus.bind(accessibilityManager),
    announceVerificationStart: accessibilityManager.announceVerificationStart.bind(accessibilityManager),
    announceVerificationComplete: accessibilityManager.announceVerificationComplete.bind(accessibilityManager),
    announceVerificationError: accessibilityManager.announceVerificationError.bind(accessibilityManager),
    announceFormErrors: accessibilityManager.announceFormErrors.bind(accessibilityManager),
    announcePageChange: accessibilityManager.announcePageChange.bind(accessibilityManager)
  };
};