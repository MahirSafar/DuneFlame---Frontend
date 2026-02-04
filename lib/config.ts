// Ehtiyat link olaraq hazırda işləyən Google Cloud linkini qoyuruq
// lib/config.ts
export const API_BASE_URL = "https://duneflame-backend-180239181668.me-central1.run.app";
//export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
export const API_VERSION = "/api/v1";
export const API_URL = `${API_BASE_URL}${API_VERSION}`;