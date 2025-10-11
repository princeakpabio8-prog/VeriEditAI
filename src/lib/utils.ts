import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely converts a value to lowercase string, handling null/undefined gracefully
 * @deprecated Use `lower` from '@/lib/string' instead
 */
export function safeLower(value: any): string {
  if (value == null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'string') {
    return value.toLowerCase();
  }
  
  // Convert to string first, then lowercase
  return String(value).toLowerCase();
}
