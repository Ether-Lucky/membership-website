// src/types/member.types.ts

export type UserRole = 'admin' | 'member';
export type AccountStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type VerificationMethod = 'manual_id' | 'qr_scan';

export interface Profile {
  id: string;
  auth_id: string;
  role: UserRole;
  status: AccountStatus;
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: string;
  profile_id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  birthdate: string;
  email: string;
  mobile_number: string;
  address: string;
  photo_url?: string;
  membership_number?: string;
  member_since?: string;
  approved_at?: string;
  approved_by?: string;
  rejected_at?: string;
  rejected_by?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface MemberWithProfile extends Member {
  profile: Profile;
}

export interface DigitalIDCard {
  membershipNumber: string;
  fullName: string;
  photoUrl: string | null;
  memberSince: string;
  status: 'Active' | 'Suspended';
  qrCodeData: string;
  organizationName: string;
}

export interface VerificationResult {
  found: boolean;
  active: boolean;
  member?: {
    fullName: string;
    membershipNumber: string;
    memberSince: string;
    status: AccountStatus;
  };
  verifiedAt: string;
}

export interface VerificationLog {
  id: string;
  member_id?: string;
  membership_number?: string;
  verification_method: VerificationMethod;
  result: boolean;
  ip_address?: string;
  verification_date: string;
}

// Registration form data
export interface RegistrationFormData {
  firstName: string;
  middleName?: string;
  lastName: string;
  birthdate: string;
  email: string;
  mobileNumber: string;
  address: string;
  photoUri?: string;
  password: string;
  confirmPassword: string;
}

// Admin approval/rejection
export interface ApprovalAction {
  memberId: string;
  adminId: string;
}

export interface RejectionAction extends ApprovalAction {
  reason?: string;
}
