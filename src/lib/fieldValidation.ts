/**
 * Field validation utilities for patient registration
 */

// CPF validation and formatting
export const formatCPF = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length === 0) return '';
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
};

export const isValidCPF = (cpf: string): boolean => {
  const numbers = cpf.replace(/\D/g, '');
  return numbers.length === 11;
};

export const getCPFErrorMessage = (cpf: string): string | null => {
  if (!cpf) return null;
  const numbers = cpf.replace(/\D/g, '');
  if (numbers.length < 11) {
    return `Digite um CPF válido com 11 números. (${numbers.length}/11)`;
  }
  if (numbers.length > 11) {
    return 'CPF não pode ter mais de 11 números.';
  }
  return null;
};

// SUS Card (CNS) validation and formatting
export const formatSUSNumber = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length === 0) return '';
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 7) return `${numbers.slice(0, 3)} ${numbers.slice(3)}`;
  if (numbers.length <= 11) return `${numbers.slice(0, 3)} ${numbers.slice(3, 7)} ${numbers.slice(7)}`;
  return `${numbers.slice(0, 3)} ${numbers.slice(3, 7)} ${numbers.slice(7, 11)} ${numbers.slice(11, 15)}`;
};

export const isValidSUSNumber = (susNumber: string): boolean => {
  const numbers = susNumber.replace(/\D/g, '');
  return numbers.length === 15;
};

export const getSUSErrorMessage = (susNumber: string): string | null => {
  if (!susNumber) return null;
  const numbers = susNumber.replace(/\D/g, '');
  if (numbers.length < 15) {
    return `Digite um número válido do Cartão SUS com 15 números. (${numbers.length}/15)`;
  }
  if (numbers.length > 15) {
    return 'Número do SUS não pode ter mais de 15 números.';
  }
  return null;
};

// Phone validation and formatting
export const formatPhoneNumber = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length === 0) return '';
  if (numbers.length <= 2) return `(${numbers}`;
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
};

export const isValidPhoneNumber = (phone: string): boolean => {
  const numbers = phone.replace(/\D/g, '');
  return numbers.length === 10 || numbers.length === 11;
};

export const getPhoneErrorMessage = (phone: string): string | null => {
  if (!phone) return null;
  const numbers = phone.replace(/\D/g, '');
  if (numbers.length === 0) return null;
  if (numbers.length < 10) {
    return `Digite um número de telefone válido. (${numbers.length}/10 ou 11)`;
  }
  if (numbers.length > 11) {
    return 'Número de telefone inválido.';
  }
  return null;
};

// General validation
export interface ValidationErrors {
  cpf?: string;
  susNumber?: string;
  phoneNumber?: string;
}

export const validateRegistrationFields = (formData: {
  cpf: string;
  susNumber: string;
  phoneNumber: string;
}): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (formData.cpf && !isValidCPF(formData.cpf)) {
    errors.cpf = getCPFErrorMessage(formData.cpf) || 'CPF inválido';
  }

  if (formData.susNumber && !isValidSUSNumber(formData.susNumber)) {
    errors.susNumber = getSUSErrorMessage(formData.susNumber) || 'Número do SUS inválido';
  }

  if (formData.phoneNumber && !isValidPhoneNumber(formData.phoneNumber)) {
    errors.phoneNumber = getPhoneErrorMessage(formData.phoneNumber) || 'Telefone inválido';
  }

  return errors;
};

export const hasValidationErrors = (errors: ValidationErrors): boolean => {
  return Object.values(errors).some(error => error !== undefined);
};
