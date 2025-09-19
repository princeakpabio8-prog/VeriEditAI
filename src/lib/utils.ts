import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely converts a value to lowercase string, handling null/undefined gracefully
 */
export function safeLower(value: any): string {
  if (value == null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'string') {
    return value.toLowerCase();
  }
  
  // Convert to string first, then lowercase
  const stringValue = String(value);
  console.warn('safeLower: Converting non-string value to string:', { original: value, converted: stringValue });
  return stringValue.toLowerCase();
}
