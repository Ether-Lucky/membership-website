// src/utils/validation.ts
import type { RegistrationFormData } from '../types/member.types';

export function validateRegistration(data: RegistrationFormData): string[] {
  const errors: string[] = [];

  if (!data.firstName?.trim()) errors.push('First name is required.');
  if (!data.lastName?.trim()) errors.push('Last name is required.');
  if (!data.birthdate) errors.push('Birthdate is required.');
  if (!data.email?.trim()) errors.push('Email is required.');
  else if (!isValidEmail(data.email)) errors.push('Enter a valid email address.');
  if (!data.mobileNumber?.trim()) errors.push('Mobile number is required.');
  else if (!isValidMobile(data.mobileNumber)) errors.push('Enter a valid mobile number.');
  if (!data.address?.trim()) errors.push('Address is required.');
  if (!data.password) errors.push('Password is required.');
  else if (data.password.length < 8) errors.push('Password must be at least 8 characters.');
  if (data.password !== data.confirmPassword) errors.push('Passwords do not match.');

  return errors;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidMobile(mobile: string): boolean {
  // Accepts PH (+63) and generic formats
  return /^(\+63|0)[0-9]{9,10}$/.test(mobile.replace(/\s|-/g, ''));
}

export function sanitizeInput(value: string): string {
  return value.trim().replace(/[<>]/g, '');
}
