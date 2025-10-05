import { z } from 'zod';

// Content validation schemas
export const textContentSchema = z.object({
  content: z.string()
    .min(10, 'Content must be at least 10 characters long')
    .max(50000, 'Content exceeds maximum length of 50,000 characters')
    .refine(
      (content) => content.trim().length > 0,
      'Content cannot be empty or only whitespace'
    ),
  contentType: z.literal('text')
});

export const urlContentSchema = z.object({
  content: z.string()
    .url('Please enter a valid URL')
    .refine(
      (url) => {
        try {
          const parsed = new URL(url);
          // Allow only http and https protocols
          return ['http:', 'https:'].includes(parsed.protocol);
        } catch {
          return false;
        }
      },
      'Only HTTP and HTTPS URLs are allowed'
    ),
  contentType: z.literal('url')
});

export const fileContentSchema = z.object({
  content: z.string()
    .min(1, 'File content is required'),
  contentType: z.literal('file'),
  fileName: z.string()
    .min(1, 'File name is required')
    .max(255, 'File name too long'),
  fileSize: z.number()
    .min(1, 'File size must be greater than 0')
    .max(10 * 1024 * 1024, 'File size cannot exceed 10MB') // 10MB limit
});

export const documentContentSchema = z.object({
  content: z.string()
    .min(10, 'Document must contain at least 10 characters'),
  contentType: z.literal('document'),
  fileName: z.string()
    .min(1, 'File name is required')
    .max(255, 'File name too long'),
  fileSize: z.number()
    .min(1, 'File size must be greater than 0')
    .max(20 * 1024 * 1024, 'File size cannot exceed 20MB'),
  metadata: z.object({
    pageCount: z.number().optional(),
    author: z.string().optional(),
    createdAt: z.date().optional(),
    fileType: z.enum(['pdf', 'docx', 'doc', 'txt', 'unknown']),
    extractionSuccess: z.boolean(),
    errorMessage: z.string().optional()
  }).optional()
});

export const verificationSchema = z.discriminatedUnion('contentType', [
  textContentSchema,
  urlContentSchema,
  fileContentSchema,
  documentContentSchema
]);

// Sanitization functions
export const sanitizeText = (text: string): string => {
  // Remove potential XSS vectors while preserving legitimate content
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

export const sanitizeUrl = (url: string): string => {
  try {
    const parsed = new URL(url.trim());
    // Only allow safe protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid protocol');
    }
    return parsed.toString();
  } catch {
    throw new Error('Invalid URL format');
  }
};

export const validateAndSanitize = (data: unknown) => {
  const parsed = verificationSchema.parse(data);
  
  switch (parsed.contentType) {
    case 'text':
      return {
        ...parsed,
        content: sanitizeText(parsed.content)
      };
    case 'url':
      return {
        ...parsed,
        content: sanitizeUrl(parsed.content)
      };
    case 'file':
      return {
        ...parsed,
        content: sanitizeText(parsed.content),
        fileName: sanitizeText(parsed.fileName)
      };
    case 'document':
      return {
        ...parsed,
        content: sanitizeText(parsed.content),
        fileName: sanitizeText(parsed.fileName)
      };
    default:
      throw new Error('Invalid content type');
  }
};

// Rate limiting helpers
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const userAttempts = this.attempts.get(identifier) || [];
    
    // Remove old attempts outside the window
    const recentAttempts = userAttempts.filter(time => now - time < this.windowMs);
    
    if (recentAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    // Add current attempt
    recentAttempts.push(now);
    this.attempts.set(identifier, recentAttempts);
    
    return true;
  }

  getRemainingAttempts(identifier: string): number {
    const now = Date.now();
    const userAttempts = this.attempts.get(identifier) || [];
    const recentAttempts = userAttempts.filter(time => now - time < this.windowMs);
    
    return Math.max(0, this.maxAttempts - recentAttempts.length);
  }

  getResetTime(identifier: string): number | null {
    const userAttempts = this.attempts.get(identifier) || [];
    if (userAttempts.length === 0) return null;
    
    const oldestAttempt = Math.min(...userAttempts);
    return oldestAttempt + this.windowMs;
  }
}

export const verificationRateLimiter = new RateLimiter(10, 300000); // 10 attempts per 5 minutes

// Enhanced password validation schema
export const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter") 
  .regex(/\d/, "Password must contain at least one number")
  .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character");

export const passwordConfirmSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});