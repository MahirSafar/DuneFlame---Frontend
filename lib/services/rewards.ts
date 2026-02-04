import { apiFetch } from "../api-client";

export interface RewardTransaction {
  id: string;
  createdAt: string; // ISO Date
  amount: number;
  type: "Purchase" | "Refund" | "Adjustment"; // Reward type
  description: string;
}

export interface RewardStats {
  balance: number;
  totalEarned: number;
  totalSpent: number;
}

export interface MyRewards {
  stats: RewardStats;
  transactions: RewardTransaction[];
}

/**
 * Fetch the current user's reward balance and transaction history
 * @returns User's reward wallet including stats and transaction history
 */
export async function getMyRewards(): Promise<MyRewards> {
  return apiFetch<MyRewards>("/rewards/me");
}
