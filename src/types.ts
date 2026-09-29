export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role?: 'user' | 'admin';
  createdAt?: string;
  lastLoginAt?: string;
}

export type VaultCategory = 'credential' | 'note' | 'financial' | 'confidential';

export interface VaultItem {
  id: string;
  userId: string;
  title: string;
  category: VaultCategory;
  sensitiveContent: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  isEncrypted?: boolean;
}

export interface SecurityLog {
  id: string;
  userId: string;
  event: string;
  status: 'success' | 'warning' | 'info';
  details: string;
  timestamp: string;
}

export interface PasswordStrength {
  score: number; // 0 to 4
  label: 'Very Weak' | 'Weak' | 'Moderate' | 'Strong' | 'Very Strong';
  color: string;
  checks: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
}
