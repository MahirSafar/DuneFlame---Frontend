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

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
