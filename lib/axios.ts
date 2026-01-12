import axios from "axios";
import { API_URL } from "./config";
import toast from "react-hot-toast";
import { getErrorMessage } from "./utils";

const instance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export function setAxiosAuthToken(token: string | null) {
  if (token) instance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  else delete instance.defaults.headers.common["Authorization"];
}

// Response interceptor to show global errors
instance.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    const message = getErrorMessage(err);
    // global handling for certain statuses
    if (status === 401) {
      toast.error(message || "Unauthorized. Please login.");
      // optionally trigger global logout event here
    } else if (status >= 500) {
      // server errors: show generic server toast but include message if available
      toast.error(message || "Server error. Please try again later.");
    }
    // For 400/409 we don't toast globally so components can handle and show inline messages.
    // Attach a userMessage for convenience
    try {
      err.userMessage = message;
    } catch {}
    return Promise.reject(err);
  }
);

export default instance;
