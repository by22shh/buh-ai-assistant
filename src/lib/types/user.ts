export type UserRole = "admin" | "user";

export interface User {
  id: string;
  phone: string;
  role: UserRole;
  access_from?: string;
  access_until?: string;
  created_at: string;
  updated_at: string;

  // Профиль
  firstName?: string;
  lastName?: string;
  email?: string;
  position?: string;
  company?: string;
}

export interface AccessInfo {
  userId: string;
  email?: string;
  phone: string;
  current_access: {
    status: "active" | "expired" | "none";
    start_date?: string;
    end_date?: string;
    updated_at?: string;
    updated_by?: string;
    admin_note?: string;
  };
  history: Array<{
    at: string;
    action: "grant_or_extend" | "revoke";
    start_date?: string;
    end_date?: string;
    by: string;
    note?: string;
  }>;
}

export interface DemoStatus {
  isActive: boolean;
  documentsUsed: number;
  documentsLimit: number;
  daysRemaining?: number;
}
