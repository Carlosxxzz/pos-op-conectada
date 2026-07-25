/**
 * Hospital Filtering Utilities
 * Provides helper functions for filtering data by hospital context
 */

import { BaseCrudService } from '@/integrations';
import type { Profissionais, Pacientes, ChecklistsDirios, EncaminhamentosMdicos, AvaliaesdeEnfermagem, AvaliaesMdicas, Notifications } from '@/entities';

/**
 * Get the hospital ID from the currently logged-in user
 * Works for both professionals and patients
 */
export async function getCurrentUserHospital(): Promise<string | null> {
  try {
    // Check if professional is logged in
    const professionalId = localStorage.getItem('professionalId');
    if (professionalId) {
      const professional = await BaseCrudService.getById<Profissionais>('profissionais', professionalId);
      return professional?.hospital || null;
    }

    // Check if patient is logged in
    const patientId = localStorage.getItem('patientId');
    if (patientId) {
      const patient = await BaseCrudService.getById<Pacientes>('pacientes', patientId);
      return patient?.hospital || null;
    }

    return null;
  } catch (error) {
    console.error('Error getting current user hospital:', error);
    return null;
  }
}

/**
 * Get the hospital name from localStorage (faster, no DB call)
 * Use this when you already have the hospital stored
 */
export function getStoredHospitalId(): string | null {
  const professionalHospital = localStorage.getItem('professionalHospital');
  if (professionalHospital) return professionalHospital;

  const patientHospital = localStorage.getItem('patientHospital');
  if (patientHospital) return patientHospital;

  return null;
}

/**
 * Filter checklists by hospital
 * Gets all checklists and filters by the hospital of the patients
 */
export async function filterChecklistsByHospital(
  checklists: ChecklistsDirios[],
  patients: Pacientes[]
): Promise<ChecklistsDirios[]> {
  const hospitalId = getStoredHospitalId();
  if (!hospitalId) return [];

  const hospitalPatientIds = patients
    .filter(p => p.hospital === hospitalId)
    .map(p => p._id);

  return checklists.filter(c => hospitalPatientIds.includes(c.patientId || ''));
}

/**
 * Filter patients by hospital
 */
export function filterPatientsByHospital(patients: Pacientes[]): Pacientes[] {
  const hospitalId = getStoredHospitalId();
  if (!hospitalId) return [];

  return patients.filter(p => p.hospital === hospitalId);
}

/**
 * Filter professionals by hospital
 */
export function filterProfessionalsByHospital(professionals: Profissionais[]): Profissionais[] {
  const hospitalId = getStoredHospitalId();
  if (!hospitalId) return [];

  return professionals.filter(p => p.hospital === hospitalId);
}

/**
 * Filter referrals by hospital
 */
export async function filterReferralsByHospital(
  referrals: EncaminhamentosMdicos[],
  patients: Pacientes[]
): Promise<EncaminhamentosMdicos[]> {
  const hospitalId = getStoredHospitalId();
  if (!hospitalId) return [];

  const hospitalPatientIds = patients
    .filter(p => p.hospital === hospitalId)
    .map(p => p._id);

  return referrals.filter(r => hospitalPatientIds.includes(r.patientId || ''));
}

/**
 * Filter nursing evaluations by hospital
 */
export async function filterNursingEvaluationsByHospital(
  evaluations: AvaliaesdeEnfermagem[],
  patients: Pacientes[]
): Promise<AvaliaesdeEnfermagem[]> {
  const hospitalId = getStoredHospitalId();
  if (!hospitalId) return [];

  const hospitalPatientIds = patients
    .filter(p => p.hospital === hospitalId)
    .map(p => p._id);

  return evaluations.filter(e => hospitalPatientIds.includes(e.patientId || ''));
}

/**
 * Filter medical evaluations by hospital
 */
export async function filterMedicalEvaluationsByHospital(
  evaluations: AvaliaesMdicas[],
  patients: Pacientes[]
): Promise<AvaliaesMdicas[]> {
  const hospitalId = getStoredHospitalId();
  if (!hospitalId) return [];

  const hospitalPatientIds = patients
    .filter(p => p.hospital === hospitalId)
    .map(p => p._id);

  return evaluations.filter(e => hospitalPatientIds.includes(e.patientId || ''));
}

/**
 * Filter notifications by hospital
 */
export function filterNotificationsByHospital(notifications: Notifications[]): Notifications[] {
  const hospitalId = getStoredHospitalId();
  if (!hospitalId) return [];

  return notifications.filter(n => n.hospital === hospitalId);
}

/**
 * Verify that a professional belongs to the user's hospital
 * Use this for security checks when accessing professional data
 */
export function verifyProfessionalHospitalAccess(professional: Profissionais | null): boolean {
  if (!professional) return false;

  const hospitalId = getStoredHospitalId();
  if (!hospitalId) return false;

  return professional.hospital === hospitalId;
}

/**
 * Verify that a patient belongs to the user's hospital
 * Use this for security checks when accessing patient data
 */
export function verifyPatientHospitalAccess(patient: Pacientes | null): boolean {
  if (!patient) return false;

  const hospitalId = getStoredHospitalId();
  if (!hospitalId) return false;

  return patient.hospital === hospitalId;
}
