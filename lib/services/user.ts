import { apiFetch } from "../api-client";

export interface UserProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  address?: string;
  city?: string;
  country?: string;
  avatarUrl?: string;
  dateOfBirth?: string; // ISO Date
  phone?: string;
}

export interface UpdateProfileRequest {
  address?: string;
  city?: string;
  country?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  phone?: string;
}

/**
 * Fetch the current user's profile information
 * @returns User profile with personal details
 */
export async function getUserProfile(): Promise<UserProfile> {
  return apiFetch<UserProfile>("/users/me");
}

/**
 * Update the current user's profile information
 * @param data Profile fields to update
 * @returns Updated user profile
 */
export async function updateUserProfile(
  data: UpdateProfileRequest
): Promise<UserProfile> {
  return apiFetch<UserProfile>("/users/me", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
