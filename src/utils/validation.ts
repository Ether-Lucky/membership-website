// src/utils/validation.ts
import type { RegistrationFormData } from '../types/member.types';

export function validateRegistration(data: RegistrationFormData): string[] {
  const errors: string[] = [];

  if (!data.firstName?.trim())  errors.push('First name is required.');
  if (!data.lastName?.trim())   errors.push('Last name is required.');

  if (!data.birthdate) {
    errors.push('Birthdate is required.');
  } else {
    const dob = new Date(data.birthdate);
    const today = new Date();
    if (isNaN(dob.getTime())) {
      errors.push('Enter a valid birthdate (YYYY-MM-DD).');
    } else if (dob >= today) {
      errors.push('Birthdate must be in the past.');
    } else {
      // Must be at least 10 years old
      const minAge = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate());
      if (dob > minAge) errors.push('You must be at least 10 years old to register.');
    }
  }

  if (!data.email?.trim()) {
    errors.push('Email address is required.');
  } else if (!isValidEmail(data.email)) {
    errors.push('Enter a valid email address.');
  }

  if (!data.mobileNumber?.trim()) {
    errors.push('Mobile number is required.');
  } else if (!isValidMobile(data.mobileNumber)) {
    errors.push('Enter a valid mobile number (e.g. 09XXXXXXXXX).');
  }

  if (!data.address?.trim()) errors.push('Home address is required.');

  // Password — check all strength rules
  if (!data.password) {
    errors.push('Password is required.');
  } else {
    const pwErrors = getPasswordErrors(data.password);
    errors.push(...pwErrors);
  }

  if (!data.confirmPassword) {
    errors.push('Please confirm your password.');
  } else if (data.password !== data.confirmPassword) {
    errors.push('Passwords do not match.');
  }

  return errors;
}

export function getPasswordErrors(password: string): string[] {
  const errors: string[] = [];
  if (password.length < 8)          errors.push('Password must be at least 8 characters.');
  if (!/[A-Z]/.test(password))      errors.push('Password must contain at least one uppercase letter.');
  if (!/[a-z]/.test(password))      errors.push('Password must contain at least one lowercase letter.');
  if (!/[0-9]/.test(password))      errors.push('Password must contain at least one number.');
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('Password must contain at least one symbol (!@#$%^&*…).');
  return errors;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidMobile(mobile: string): boolean {
  return /^(\+63|0)[0-9]{9,10}$/.test(mobile.replace(/[\s-]/g, ''));
}

export function sanitizeInput(value: string): string {
  return value.trim().replace(/[<>]/g, '');
}