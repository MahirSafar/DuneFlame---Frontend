import axios from "@/lib/axios";

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  isLockedOut: boolean;
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const { data } = await axios.get<AdminUser[]>("/admin/users");
  return data;
}

export async function toggleUserBan(userId: string): Promise<{ message: string }> {
  const { data } = await axios.post<{ message: string }>(`/admin/users/${userId}/toggle-ban`);
  return data;
}

export async function assignUserRole(userId: string, role: string): Promise<void> {
  await axios.post(`/admin/users/${userId}/role`, { userId, role });
}
