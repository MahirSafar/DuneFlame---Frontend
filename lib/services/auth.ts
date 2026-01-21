import axios from "axios";
import { API_URL } from "../config";

// Create a clean axios instance to avoid circular dependency with the main interceptor
const authAxios = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

interface TokenRequest {
  email: string;
  token: string;
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export async function refreshAccessToken(
  email: string,
  refreshToken: string
): Promise<TokenResponse> {
  const response = await authAxios.post<TokenResponse>("/auth/refresh", {
    email,
    token: refreshToken,
  });
  return response.data;
}
