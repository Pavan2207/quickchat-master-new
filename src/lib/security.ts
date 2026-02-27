/**
 * Security utilities for input validation and sanitization
 */

// Maximum message length to prevent DoS
export const MAX_MESSAGE_LENGTH = 4096;
export const MAX_FILE_NAME_LENGTH = 255;

// HTML entities to escape to prevent XSS
const htmlEntities: Record<string, string> = {
  '&': '&amp;',
  '<': '<',
  '>': '>',
  '"': '"',
  "'": '&#x27;',
  '/': '&#x2F;',
};

/**
 * Escape HTML special characters to prevent XSS attacks
 */
export function escapeHtml(text: string): string {
  return text.replace(/[&<>"'/]/g, (char) => htmlEntities[char] || char);
}

/**
 * Sanitize user input message content
 * - Trims whitespace
 * - Truncates to max length
 * - Removes null bytes
 */
export function sanitizeMessageInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Remove null bytes and control characters (except newlines and tabs)
  let sanitized = input
    .replace(/\0/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Truncate to max length
  if (sanitized.length > MAX_MESSAGE_LENGTH) {
    sanitized = sanitized.substring(0, MAX_MESSAGE_LENGTH);
  }
  
  return sanitized;
}

/**
 * Sanitize file name to prevent path traversal
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName || typeof fileName !== 'string') {
    return 'unnamed';
  }
  
  // Remove path separators and dangerous characters
  let sanitized = fileName
    .replace(/[/\\]/g, '_')
    .replace(/[^\w\s.-]/g, '')
    .trim();
  
  // Truncate to max length
  if (sanitized.length > MAX_FILE_NAME_LENGTH) {
    sanitized = sanitized.substring(0, MAX_FILE_NAME_LENGTH);
  }
  
  return sanitized || 'unnamed';
}

/**
 * Validate that a string is not empty after sanitization
 */
export function isValidMessageContent(input: string): boolean {
  const sanitized = sanitizeMessageInput(input);
  return sanitized.length > 0;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate user ID format (Clerk IDs typically start with 'user_')
 */
export function isValidUserId(userId: string): boolean {
  return /^user_[a-zA-Z0-9_-]+$/.test(userId);
}

/**
 * Validate conversation ID format
 */
export function isValidConversationId(id: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(id) && id.length > 0;
}

/**
 * Rate limiting helper - simple client-side rate check
 * Note: Real rate limiting should be done server-side in Convex
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private maxAttempts: number;
  private windowMs: number;

  constructor(maxAttempts: number = 10, windowMs: number = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  /**
   * Check if action is allowed for given key
   * Returns true if allowed, false if rate limited
   */
  check(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Filter out old attempts outside the window
    const recentAttempts = attempts.filter(time => now - time < this.windowMs);
    
    if (recentAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    // Add current attempt
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    
    return true;
  }

  /**
   * Get remaining attempts for a key
   */
  getRemainingAttempts(key: string): number {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    const recentAttempts = attempts.filter(time => now - time < this.windowMs);
    return Math.max(0, this.maxAttempts - recentAttempts.length);
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.attempts.delete(key);
  }
}

// Create a global rate limiter instance
export const messageRateLimiter = new RateLimiter(10, 60000); // 10 messages per minute
