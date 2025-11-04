export type UserRole = "admin" | "user";

export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  phone?: string;
  position?: string;
  company?: string;
  accessFrom?: string | Date | null;
  accessUntil?: string | Date | null;
  accessComment?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  
  // Relations
  demoStatus?: DemoStatus;
}

export interface AccessInfo {
  userId: string;
  email: string;
  phone?: string;
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
