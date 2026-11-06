import { request } from '@/utils/request';

export interface AdminDashboardStats {
  dailyRandomPicAccess: Array<{ date: string; count: number }>;
  randomPicAccessLast7Days: number;
  cachedRandomPicCount: number;
}

export const getAdminDashboardStats = () =>
  request<AdminDashboardStats>('/dashboard');
