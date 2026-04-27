import instance from '../axios';
import { API_URL } from '../config';

// ─── Public (Storefront) ──────────────────────────────────────────────────────

export interface PublicSlider {
  id: string;
  imageUrl: string;
  order: number;
  title: string;
  subtitle: string | null;
  buttonText: string | null;
  linkUrl: string | null;
}

/**
 * Fetches the pre-translated, active slider list from the public endpoint.
 * Uses native fetch so the Accept-Language header is sent exactly as-is
 * without being overwritten by the axios client interceptor (which is
 * designed for authenticated, client-side requests).
 */
export async function getPublicSliders(locale: string): Promise<PublicSlider[]> {
  try {
    const res = await fetch(`${API_URL}/public/sliders`, {
      headers: { 'Accept-Language': locale },
      next: { revalidate: 300 }, // 5-minute cache
    });
    if (!res.ok) return [];
    return res.json() as Promise<PublicSlider[]>;
  } catch {
    return [];
  }
}

// ─── Admin (CRUD) ─────────────────────────────────────────────────────────────

export interface AdminSliderTranslation {
  id: string;
  languageCode: string;
  title: string;
  subtitle: string | null;
  buttonText: string | null;
  linkUrl: string | null;
}

export interface AdminSlider {
  id: string;
  imageUrl: string;
  order: number;
  isActive: boolean;
  translations: AdminSliderTranslation[];
  createdAt: string;
  updatedAt: string | null;
}

export interface AdminSliderPage {
  items: AdminSlider[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

const SLIDER_API_PATH = '/admin/sliders';

export const sliderService = {
  getAll: (pageNumber = 1, pageSize = 10): Promise<AdminSliderPage> =>
    instance
      .get(`${SLIDER_API_PATH}?pageNumber=${pageNumber}&pageSize=${pageSize}`)
      .then(res => res.data),

  getById: (id: string): Promise<AdminSlider> =>
    instance.get(`${SLIDER_API_PATH}/${id}`).then(res => res.data),

  create: (formData: FormData) =>
    instance.post(SLIDER_API_PATH, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (id: string, formData: FormData) =>
    instance.put(`${SLIDER_API_PATH}/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  delete: (id: string) => instance.delete(`${SLIDER_API_PATH}/${id}`),
};
