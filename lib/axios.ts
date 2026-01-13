import axios from "axios";
import { API_URL } from "./config";
import toast from "react-hot-toast";
import { getErrorMessage } from "./utils";
import { useAuthStore } from "@/lib/auth-store";

const instance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

instance.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- DÜZƏLİŞ EDİLMİŞ HİSSƏ ---
instance.interceptors.response.use(
  (res) => res,
  async (err) => {
    const status = err?.response?.status;
    const originalRequest = err.config; // Sorğunun özü
    const message = getErrorMessage(err);

    // 1. 401 Xətası Gələndə
    if (status === 401) {
      // KRİTİK ŞƏRT: 
      // Əgər xəta "Login" və ya "Logout" sorğusunun özündən gəlibsə, 
      // avtomatik logout prosesini işə salma. Yoxsa sonsuz dövrə yaranır.
      if (!originalRequest.url?.includes("/auth/login") && !originalRequest.url?.includes("/auth/logout")) {
        
        // Yalnız digər səhifələrdə (Dashboard və s.) 401 gəlsə çıxış et
        toast.error("Session expired. Please login again.");
        useAuthStore.getState().logout();
        
        if (window.location.pathname !== "/admin/login") {
           window.location.href = "/admin/login";
        }
      }
      // Login səhifəsindəsənsə, sadəcə xətanı qaytar ki, "Invalid Password" çıxsın
      return Promise.reject(err);
    } 
    
    else if (status >= 500) {
      toast.error(message || "Server error. Please try again later.");
    }

    try {
      err.userMessage = message;
    } catch {}
    return Promise.reject(err);
  }
);

export function setAxiosAuthToken(token: string | null) {
  if (token) instance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  else delete instance.defaults.headers.common["Authorization"];
}

export default instance;