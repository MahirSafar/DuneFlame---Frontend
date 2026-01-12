import axios from "axios";
import { API_URL } from "./config";
import toast from "react-hot-toast";

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
    const message = err?.response?.data?.message || err.message || "An error occurred";
    if (status === 401) {
      toast.error(message || "Unauthorized. Please login.");
      // optionally emit logout event
    } else if (status >= 500) {
      toast.error("Server error. Please try again later.");
    }
    return Promise.reject(err);
  }
);

export default instance;
