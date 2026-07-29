/**
 * Global Uniqueness Validator for User Personal Data
 * Ensures CPF, SUS Card, and Email are unique across all user types
 */

import { BaseCrudService } from '@/integrations';
import type { Pacientes, Profissionais } from '@/entities';

export interface UniquenessCheckResult {
  isUnique: boolean;
  duplicateField?: 'cpf' | 'susNumber' | 'email';
  message?: string;
}

/**
 * Normalize CPF for comparison (remove formatting)
 */
const normalizeCPF = (cpf: string): string => {
  return cpf.replace(/\D/g, '');
};

/**
 * Normalize SUS number for comparison (remove formatting)
 */
const normalizeSUSNumber = (sus: string): string => {
  return sus.replace(/\D/g, '');
};

/**
 * Normalize email for comparison (lowercase)
 */
const normalizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

/**
 * Check if CPF already exists in any user collection
 */
const checkCPFUniqueness = async (cpf: string, excludeUserId?: string): Promise<boolean> => {
  if (!cpf) return true;

  const normalizedCPF = normalizeCPF(cpf);
  if (!normalizedCPF) return true;

  try {
    // Check in Pacientes
    const { items: patients } = await BaseCrudService.getAll<Pacientes>('pacientes');
    const patientWithCPF = patients.find(
      p => normalizeCPF(p.cpf || '') === normalizedCPF && p._id !== excludeUserId
    );
    if (patientWithCPF) return false;

    // Check in Profissionais
    const { items: professionals } = await BaseCrudService.getAll<Profissionais>('profissionais');
    const professionalWithCPF = professionals.find(
      p => normalizeCPF(p.cpf || '') === normalizedCPF && p._id !== excludeUserId
    );
    if (professionalWithCPF) return false;

    return true;
  } catch (error) {
    console.error('Error checking CPF uniqueness:', error);
    return true; // Allow on error to not block user
  }
};

/**
 * Check if SUS number already exists in any user collection
 */
const checkSUSUniqueness = async (susNumber: string, excludeUserId?: string): Promise<boolean> => {
  if (!susNumber) return true;

  const normalizedSUS = normalizeSUSNumber(susNumber);
  if (!normalizedSUS) return true;

  try {
    // Check in Pacientes
    const { items: patients } = await BaseCrudService.getAll<Pacientes>('pacientes');
    const patientWithSUS = patients.find(
      p => normalizeSUSNumber(p.susNumber || '') === normalizedSUS && p._id !== excludeUserId
    );
    if (patientWithSUS) return false;

    return true;
  } catch (error) {
    console.error('Error checking SUS uniqueness:', error);
    return true; // Allow on error to not block user
  }
};

/**
 * Check if email already exists in any user collection
 */
const checkEmailUniqueness = async (email: string, excludeUserId?: string): Promise<boolean> => {
  if (!email) return true;

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return true;

  try {
    // Check in Pacientes
    const { items: patients } = await BaseCrudService.getAll<Pacientes>('pacientes');
    const patientWithEmail = patients.find(
      p => normalizeEmail(p.email || '') === normalizedEmail && p._id !== excludeUserId
    );
    if (patientWithEmail) return false;

    // Check in Profissionais
    const { items: professionals } = await BaseCrudService.getAll<Profissionais>('profissionais');
    const professionalWithEmail = professionals.find(
      p => normalizeEmail(p.email || '') === normalizedEmail && p._id !== excludeUserId
    );
    if (professionalWithEmail) return false;

    return true;
  } catch (error) {
    console.error('Error checking email uniqueness:', error);
    return true; // Allow on error to not block user
  }
};

/**
 * Comprehensive uniqueness check for patient registration
 */
export const checkPatientUniqueness = async (
  cpf: string,
  susNumber: string,
  email: string,
  excludeUserId?: string
): Promise<UniquenessCheckResult> => {
  try {
    // Check CPF
    if (cpf) {
      const cpfIsUnique = await checkCPFUniqueness(cpf, excludeUserId);
      if (!cpfIsUnique) {
        return {
          isUnique: false,
          duplicateField: 'cpf',
          message: 'Este CPF já está cadastrado no sistema.',
        };
      }
    }

    // Check SUS number
    if (susNumber) {
      const susIsUnique = await checkSUSUniqueness(susNumber, excludeUserId);
      if (!susIsUnique) {
        return {
          isUnique: false,
          duplicateField: 'susNumber',
          message: 'Este Cartão SUS já está cadastrado no sistema.',
        };
      }
    }

    // Check email
    if (email) {
      const emailIsUnique = await checkEmailUniqueness(email, excludeUserId);
      if (!emailIsUnique) {
        return {
          isUnique: false,
          duplicateField: 'email',
          message: 'Este e-mail já está cadastrado no sistema.',
        };
      }
    }

    return { isUnique: true };
  } catch (error) {
    console.error('Error in checkPatientUniqueness:', error);
    return { isUnique: true }; // Allow on error to not block user
  }
};

/**
 * Comprehensive uniqueness check for professional registration
 */
export const checkProfessionalUniqueness = async (
  cpf: string,
  email: string,
  excludeUserId?: string
): Promise<UniquenessCheckResult> => {
  try {
    // Check CPF
    if (cpf) {
      const cpfIsUnique = await checkCPFUniqueness(cpf, excludeUserId);
      if (!cpfIsUnique) {
        return {
          isUnique: false,
          duplicateField: 'cpf',
          message: 'Este CPF já está cadastrado no sistema.',
        };
      }
    }

    // Check email
    if (email) {
      const emailIsUnique = await checkEmailUniqueness(email, excludeUserId);
      if (!emailIsUnique) {
        return {
          isUnique: false,
          duplicateField: 'email',
          message: 'Este e-mail já está cadastrado no sistema.',
        };
      }
    }

    return { isUnique: true };
  } catch (error) {
    console.error('Error in checkProfessionalUniqueness:', error);
    return { isUnique: true }; // Allow on error to not block user
  }
};
