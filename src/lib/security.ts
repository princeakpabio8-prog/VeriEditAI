import { errorTracker } from './error-tracking';

interface SecurityConfig {
  maxFileSize: number;
  allowedFileTypes: string[];
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  sessionTimeout: number;
  csrfToken?: string;
}

interface SecurityViolation {
  type: 'rate_limit' | 'file_size' | 'file_type' | 'xss' | 'csrf' | 'injection';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  metadata?: any;
}

class SecurityManager {
  private config: SecurityConfig;
  private requestCounts: Map<string, { count: number; window: number }> = new Map();
  private blockedIPs: Set<string> = new Set();
  private sessionTimeout: number;

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedFileTypes: [
        'text/plain',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/csv',
        'application/json'
      ],
      maxRequestsPerMinute: 60,
      maxRequestsPerHour: 1000,
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      ...config
    };
    this.sessionTimeout = this.config.sessionTimeout;
    this.setupSecurityHeaders();
    this.setupCSRFProtection();
  }

  private setupSecurityHeaders(): void {
    // Content Security Policy would typically be set on the server
    // This is for client-side enforcement where possible
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "frame-ancestors 'none'"
    ].join('; ');
    document.head.appendChild(meta);
  }

  private setupCSRFProtection(): void {
    // Generate CSRF token if not provided
    if (!this.config.csrfToken) {
      this.config.csrfToken = this.generateCSRFToken();
    }

    // Add CSRF token to all forms
    this.addCSRFTokenToForms();
  }

  private generateCSRFToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private addCSRFTokenToForms(): void {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            const forms = element.querySelectorAll('form');
            forms.forEach(form => this.addCSRFTokenToForm(form as HTMLFormElement));
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Add to existing forms
    document.querySelectorAll('form').forEach(form => {
      this.addCSRFTokenToForm(form as HTMLFormElement);
    });
  }

  private addCSRFTokenToForm(form: HTMLFormElement): void {
    if (!form.querySelector('input[name="csrf_token"]')) {
      const csrfInput = document.createElement('input');
      csrfInput.type = 'hidden';
      csrfInput.name = 'csrf_token';
      csrfInput.value = this.config.csrfToken || '';
      form.appendChild(csrfInput);
    }
  }

  private getUserIdentifier(): string {
    // In a real app, this would use user ID or session ID
    return this.getFingerprint();
  }

  private getFingerprint(): string {
    // Create a simple browser fingerprint
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Security fingerprint', 2, 2);
    }
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');

    // Hash the fingerprint
    return btoa(fingerprint).replace(/[^a-zA-Z0-9]/g, '').substr(0, 16);
  }

  // Rate limiting
  checkRateLimit(identifier?: string): boolean {
    const id = identifier || this.getUserIdentifier();
    const now = Date.now();
    const minuteWindow = Math.floor(now / (60 * 1000));
    const hourWindow = Math.floor(now / (60 * 60 * 1000));

    // Check minute limit
    const minuteKey = `${id}:${minuteWindow}`;
    const minuteCount = this.requestCounts.get(minuteKey) || { count: 0, window: minuteWindow };
    
    if (minuteCount.count >= this.config.maxRequestsPerMinute) {
      this.reportSecurityViolation({
        type: 'rate_limit',
        severity: 'medium',
        description: `Rate limit exceeded: ${minuteCount.count} requests in one minute`,
        metadata: { identifier: id, timeWindow: 'minute', count: minuteCount.count }
      });
      return false;
    }

    // Check hour limit
    const hourKey = `${id}:${hourWindow}`;
    const hourCount = this.requestCounts.get(hourKey) || { count: 0, window: hourWindow };
    
    if (hourCount.count >= this.config.maxRequestsPerHour) {
      this.reportSecurityViolation({
        type: 'rate_limit',
        severity: 'high',
        description: `Hourly rate limit exceeded: ${hourCount.count} requests in one hour`,
        metadata: { identifier: id, timeWindow: 'hour', count: hourCount.count }
      });
      return false;
    }

    // Update counts
    this.requestCounts.set(minuteKey, { count: minuteCount.count + 1, window: minuteWindow });
    this.requestCounts.set(hourKey, { count: hourCount.count + 1, window: hourWindow });

    // Clean old entries
    this.cleanOldRateLimit();

    return true;
  }

  private cleanOldRateLimit(): void {
    const now = Date.now();
    const cutoff = now - (2 * 60 * 60 * 1000); // 2 hours ago

    for (const [key, data] of this.requestCounts.entries()) {
      if (data.window * 60 * 1000 < cutoff) {
        this.requestCounts.delete(key);
      }
    }
  }

  // File validation
  validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > this.config.maxFileSize) {
      this.reportSecurityViolation({
        type: 'file_size',
        severity: 'medium',
        description: `File size exceeds limit: ${file.size} bytes`,
        metadata: { fileName: file.name, fileSize: file.size, maxSize: this.config.maxFileSize }
      });
      return {
        valid: false,
        error: `File size exceeds ${this.config.maxFileSize / (1024 * 1024)}MB limit`
      };
    }

    // Check file type
    if (!this.config.allowedFileTypes.includes(file.type)) {
      this.reportSecurityViolation({
        type: 'file_type',
        severity: 'medium',
        description: `Disallowed file type: ${file.type}`,
        metadata: { fileName: file.name, fileType: file.type, allowedTypes: this.config.allowedFileTypes }
      });
      return {
        valid: false,
        error: `File type ${file.type} is not allowed`
      };
    }

    return { valid: true };
  }

  // Input sanitization
  sanitizeInput(input: string): string {
    // Basic XSS prevention
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // Advanced XSS detection
  detectXSS(input: string): boolean {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>/gi,
      /<form[^>]*>.*?<\/form>/gi,
      /expression\s*\(/gi,
      /vbscript:/gi,
      /data:text\/html/gi
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(input)) {
        this.reportSecurityViolation({
          type: 'xss',
          severity: 'high',
          description: 'Potential XSS attempt detected',
          metadata: { input: input.substring(0, 100), pattern: pattern.source }
        });
        return true;
      }
    }

    return false;
  }

  // SQL injection detection
  detectSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /(\bor\b|\band\b)\s+\d+\s*=\s*\d+/gi,
      /union\s+select/gi,
      /select\s+\*\s+from/gi,
      /insert\s+into/gi,
      /delete\s+from/gi,
      /update\s+\w+\s+set/gi,
      /drop\s+table/gi,
      /exec\s*\(/gi,
      /\/\*.*?\*\//g,
      /--[^\r\n]*/g,
      /'\s*(or|and)\s*'[^']*'\s*=\s*'/gi
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(input)) {
        this.reportSecurityViolation({
          type: 'injection',
          severity: 'critical',
          description: 'Potential SQL injection attempt detected',
          metadata: { input: input.substring(0, 100), pattern: pattern.source }
        });
        return true;
      }
    }

    return false;
  }

  // Validate CSRF token
  validateCSRFToken(token: string): boolean {
    const isValid = token === this.config.csrfToken;
    
    if (!isValid) {
      this.reportSecurityViolation({
        type: 'csrf',
        severity: 'high',
        description: 'Invalid CSRF token detected',
        metadata: { providedToken: token.substring(0, 8) + '...', expectedToken: this.config.csrfToken?.substring(0, 8) + '...' }
      });
    }

    return isValid;
  }

  // Secure request helper
  secureRequest(url: string, options: RequestInit = {}): Promise<Response> {
    // Check rate limit
    if (!this.checkRateLimit()) {
      return Promise.reject(new Error('Rate limit exceeded'));
    }

    // Add CSRF token to headers
    const headers = new Headers(options.headers);
    if (this.config.csrfToken) {
      headers.set('X-CSRF-Token', this.config.csrfToken);
    }

    // Add security headers
    headers.set('X-Requested-With', 'XMLHttpRequest');
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');

    return fetch(url, {
      ...options,
      headers,
      credentials: 'same-origin'
    });
  }

  // Session management
  refreshSession(): void {
    const now = Date.now();
    const lastActivity = parseInt(localStorage.getItem('lastActivity') || '0');
    
    if (now - lastActivity > this.sessionTimeout) {
      this.expireSession();
    } else {
      localStorage.setItem('lastActivity', now.toString());
    }
  }

  expireSession(): void {
    localStorage.removeItem('lastActivity');
    sessionStorage.clear();
    
    // Redirect to login or show session expired message
    window.dispatchEvent(new CustomEvent('sessionExpired'));
  }

  private reportSecurityViolation(violation: SecurityViolation): void {
    console.warn('Security violation detected:', violation);
    
    // Report to error tracking
    errorTracker.captureError({
      message: `Security violation: ${violation.description}`,
      type: 'api',
      severity: violation.severity === 'critical' ? 'critical' : 'high',
      context: {
        userId: undefined,
        sessionId: this.getUserIdentifier(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        feature: 'security',
        additionalData: {
          violationType: violation.type,
          metadata: violation.metadata
        }
      },
      tags: ['security', violation.type]
    });

    // Block repeated offenders
    if (violation.severity === 'critical' || violation.severity === 'high') {
      const identifier = this.getUserIdentifier();
      const violations = parseInt(localStorage.getItem(`violations_${identifier}`) || '0') + 1;
      localStorage.setItem(`violations_${identifier}`, violations.toString());
      
      if (violations > 5) {
        this.blockedIPs.add(identifier);
        localStorage.setItem(`blocked_${identifier}`, Date.now().toString());
      }
    }
  }

  // Check if user is blocked
  isBlocked(): boolean {
    const identifier = this.getUserIdentifier();
    const blocked = localStorage.getItem(`blocked_${identifier}`);
    
    if (blocked) {
      const blockedTime = parseInt(blocked);
      const now = Date.now();
      const blockDuration = 24 * 60 * 60 * 1000; // 24 hours
      
      if (now - blockedTime < blockDuration) {
        return true;
      } else {
        // Unblock after duration
        localStorage.removeItem(`blocked_${identifier}`);
        this.blockedIPs.delete(identifier);
      }
    }
    
    return this.blockedIPs.has(identifier);
  }

  // Get CSRF token
  getCSRFToken(): string | undefined {
    return this.config.csrfToken;
  }

  // Update config
  updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Global security manager instance
export const securityManager = new SecurityManager();

// React hook for security features
export const useSecurity = () => {
  return {
    checkRateLimit: securityManager.checkRateLimit.bind(securityManager),
    validateFile: securityManager.validateFile.bind(securityManager),
    sanitizeInput: securityManager.sanitizeInput.bind(securityManager),
    detectXSS: securityManager.detectXSS.bind(securityManager),
    detectSQLInjection: securityManager.detectSQLInjection.bind(securityManager),
    validateCSRFToken: securityManager.validateCSRFToken.bind(securityManager),
    secureRequest: securityManager.secureRequest.bind(securityManager),
    refreshSession: securityManager.refreshSession.bind(securityManager),
    isBlocked: securityManager.isBlocked.bind(securityManager),
    getCSRFToken: securityManager.getCSRFToken.bind(securityManager)
  };
};