import { BaseCrudService } from '@/integrations';
import type { Profissionais, Pacientes } from '@/entities';
import {
  notifyChecklistSubmitted,
  notifyCriticalAlert,
  notifyMedicalEvaluationCompleted,
  notifyPatientDischarge,
  notifyReferralCreated,
  notifyUrgentSituation,
} from './notificationGenerator';

/**
 * Get all nurses in the same hospital
 */
export const getNursesInHospital = async (hospital: string): Promise<string[]> => {
  try {
    const { items } = await BaseCrudService.getAll<Profissionais>('profissionais');
    return items
      .filter(p => p.hospital === hospital && p.profile === 'Enfermeiro')
      .map(p => p._id);
  } catch (error) {
    console.error('Error getting nurses in hospital:', error);
    return [];
  }
};

/**
 * Get all doctors in the same hospital
 */
export const getDoctorsInHospital = async (hospital: string): Promise<string[]> => {
  try {
    const { items } = await BaseCrudService.getAll<Profissionais>('profissionais');
    return items
      .filter(p => p.hospital === hospital && p.profile === 'Médico')
      .map(p => p._id);
  } catch (error) {
    console.error('Error getting doctors in hospital:', error);
    return [];
  }
};

/**
 * Get patient info
 */
export const getPatientInfo = async (patientId: string): Promise<Pacientes | null> => {
  try {
    return await BaseCrudService.getById<Pacientes>('pacientes', patientId);
  } catch (error) {
    console.error('Error getting patient info:', error);
    return null;
  }
};

/**
 * Handle checklist submission - notify nurses
 */
export const handleChecklistSubmitted = async (
  checklistId: string,
  patientId: string,
  hospital: string
) => {
  try {
    const patient = await getPatientInfo(patientId);
    if (!patient) return;

    const nursesIds = await getNursesInHospital(hospital);
    if (nursesIds.length === 0) return;

    await notifyChecklistSubmitted(
      checklistId,
      patientId,
      patient.fullName || 'Paciente',
      hospital,
      nursesIds
    );
  } catch (error) {
    console.error('Error handling checklist submitted notification:', error);
  }
};

/**
 * Handle critical alert detection - notify nurses
 */
export const handleCriticalAlert = async (
  checklistId: string,
  patientId: string,
  hospital: string,
  alertReason: string
) => {
  try {
    const patient = await getPatientInfo(patientId);
    if (!patient) return;

    const nursesIds = await getNursesInHospital(hospital);
    if (nursesIds.length === 0) return;

    await notifyCriticalAlert(
      checklistId,
      patientId,
      patient.fullName || 'Paciente',
      hospital,
      alertReason,
      nursesIds
    );
  } catch (error) {
    console.error('Error handling critical alert notification:', error);
  }
};

/**
 * Handle medical evaluation completion - notify nurses
 */
export const handleMedicalEvaluationCompleted = async (
  checklistId: string,
  patientId: string,
  hospital: string,
  doctorName: string
) => {
  try {
    const patient = await getPatientInfo(patientId);
    if (!patient) return;

    const nursesIds = await getNursesInHospital(hospital);
    if (nursesIds.length === 0) return;

    await notifyMedicalEvaluationCompleted(
      checklistId,
      patientId,
      patient.fullName || 'Paciente',
      hospital,
      doctorName,
      nursesIds
    );
  } catch (error) {
    console.error('Error handling medical evaluation completed notification:', error);
  }
};

/**
 * Handle patient discharge - notify nurses
 */
export const handlePatientDischarge = async (
  patientId: string,
  hospital: string,
  dischargeReason: string
) => {
  try {
    const patient = await getPatientInfo(patientId);
    if (!patient) return;

    const nursesIds = await getNursesInHospital(hospital);
    if (nursesIds.length === 0) return;

    await notifyPatientDischarge(
      patientId,
      patient.fullName || 'Paciente',
      hospital,
      dischargeReason,
      nursesIds
    );
  } catch (error) {
    console.error('Error handling patient discharge notification:', error);
  }
};

/**
 * Handle referral creation - notify nurses
 */
export const handleReferralCreated = async (
  checklistId: string,
  patientId: string,
  hospital: string,
  doctorName: string
) => {
  try {
    const patient = await getPatientInfo(patientId);
    if (!patient) return;

    const nursesIds = await getNursesInHospital(hospital);
    if (nursesIds.length === 0) return;

    await notifyReferralCreated(
      checklistId,
      patientId,
      patient.fullName || 'Paciente',
      hospital,
      doctorName,
      nursesIds
    );
  } catch (error) {
    console.error('Error handling referral created notification:', error);
  }
};

/**
 * Handle urgent situation - notify nurses
 */
export const handleUrgentSituation = async (
  checklistId: string,
  patientId: string,
  hospital: string,
  urgencyReason: string
) => {
  try {
    const patient = await getPatientInfo(patientId);
    if (!patient) return;

    const nursesIds = await getNursesInHospital(hospital);
    if (nursesIds.length === 0) return;

    await notifyUrgentSituation(
      checklistId,
      patientId,
      patient.fullName || 'Paciente',
      hospital,
      urgencyReason,
      nursesIds
    );
  } catch (error) {
    console.error('Error handling urgent situation notification:', error);
  }
};
