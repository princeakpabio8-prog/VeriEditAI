/**
 * Centralized string utilities with comprehensive null-safety
 * Prevents "undefined is not an object (evaluating 't.toLowerCase')" errors
 */

/**
 * Safely converts any value to lowercase string
 * @param v - Value to convert (can be any type including undefined/null)
 * @returns Lowercase string, or empty string if null/undefined
 */
export const lower = (v: unknown): string => {
  if (v == null || v === undefined) {
    return '';
  }
  
  if (typeof v === 'string') {
    return v.toLowerCase();
  }
  
  // Convert to string first, then lowercase
  return String(v).toLowerCase();
};

/**
 * Null-safe string includes check with case-insensitive comparison
 * @param haystack - String to search in (can be any type)
 * @param needle - String to search for (can be any type)
 * @returns true if haystack contains needle (case-insensitive), false otherwise
 */
export const includesLower = (haystack: unknown, needle: unknown): boolean => {
  return lower(haystack).includes(lower(needle));
};

/**
 * Safely get string value with default fallback
 * @param v - Value to convert to string
 * @param defaultValue - Default value if v is null/undefined
 * @returns String value or default
 */
export const safeString = (v: unknown, defaultValue = ''): string => {
  if (v == null || v === undefined) {
    return defaultValue;
  }
  
  if (typeof v === 'string') {
    return v;
  }
  
  return String(v);
};
