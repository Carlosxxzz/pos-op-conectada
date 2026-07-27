/**
 * Password validation utility with standardized security rules
 * Applied to all user types: Patients, Doctors, Nurses, Admins
 */

export interface PasswordRequirements {
  minLength: boolean;
  maxLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  requirements: PasswordRequirements;
  errors: string[];
}

const MIN_LENGTH = 8;
const MAX_LENGTH = 20;

export const passwordRules = {
  minLength: MIN_LENGTH,
  maxLength: MAX_LENGTH,
  requirements: [
    { key: 'minLength', label: 'Mínimo de 8 caracteres' },
    { key: 'hasUppercase', label: 'Pelo menos uma letra maiúscula (A-Z)' },
    { key: 'hasLowercase', label: 'Pelo menos uma letra minúscula (a-z)' },
    { key: 'hasNumber', label: 'Pelo menos um número (0-9)' },
  ],
};

export function validatePassword(password: string): PasswordValidationResult {
  const requirements: PasswordRequirements = {
    minLength: password.length >= MIN_LENGTH,
    maxLength: password.length <= MAX_LENGTH,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
  };

  const errors: string[] = [];

  if (!requirements.minLength) {
    errors.push(`A senha deve conter no mínimo ${MIN_LENGTH} caracteres.`);
  }

  if (!requirements.maxLength) {
    errors.push(`A senha deve conter no máximo ${MAX_LENGTH} caracteres.`);
  }

  if (!requirements.hasUppercase) {
    errors.push('A senha deve conter pelo menos uma letra maiúscula.');
  }

  if (!requirements.hasLowercase) {
    errors.push('A senha deve conter pelo menos uma letra minúscula.');
  }

  if (!requirements.hasNumber) {
    errors.push('A senha deve conter pelo menos um número.');
  }

  const isValid =
    requirements.minLength &&
    requirements.maxLength &&
    requirements.hasUppercase &&
    requirements.hasLowercase &&
    requirements.hasNumber;

  return {
    isValid,
    requirements,
    errors,
  };
}

export function validatePasswordMatch(
  password: string,
  confirmPassword: string
): { isMatch: boolean; error: string } {
  if (password !== confirmPassword) {
    return {
      isMatch: false,
      error: 'As senhas não coincidem.',
    };
  }

  return {
    isMatch: true,
    error: '',
  };
}
