export function getErrorMessage(error: any): string {
  try {
    if (!error) return "Something went wrong";

    const resp = error.response;
    if (resp && resp.data) {
      const data = resp.data;
      // data may be a string
      if (typeof data === "string" && data.trim().length > 0) return data;

      // Standard backend message field
      if (data.message) return String(data.message);

      // Validation errors array/object - try common shapes
      // If errors is an array, return first message
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        const first = data.errors[0];
        if (typeof first === "string") return first;
        if (first?.message) return String(first.message);
        return JSON.stringify(first);
      }

      // If errors is an object (field -> [messages]) return first available
      if (data.errors && typeof data.errors === "object") {
        for (const key of Object.keys(data.errors)) {
          const val = data.errors[key];
          if (Array.isArray(val) && val.length > 0) return String(val[0]);
          if (typeof val === "string" && val.trim().length > 0) return val;
        }
      }
    }

    // Axios / network error
    if (error.message) return String(error.message);

    return "Something went wrong";
  } catch (e) {
    return "Something went wrong";
  }
}

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { API_URL } from './config'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts relative image paths to full URLs pointing to the backend.
 * If the URL is already absolute, returns it as-is.
 * @param imagePath - The image path from the backend
 * @returns Full image URL or null if path is empty
 */
export function getImageUrl(imagePath: string | undefined | null): string | null {
  if (!imagePath) return null
  if (imagePath.startsWith('http')) return imagePath
  
  // Remove leading slashes to prevent double slashes
  const cleanPath = imagePath.replace(/^\/+/, '')
  const baseUrl = API_URL.replace(/\/api\/v1\s*$/, '') // Remove /api/v1 suffix
  return `${baseUrl}/${cleanPath}`
}
