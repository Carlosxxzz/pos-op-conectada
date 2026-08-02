import { BaseCrudService } from '@/integrations';
import type { ChecklistsDirios, Pacientes } from '@/entities';
import { logger } from '@/lib/logger';

/**
 * Get today's date at 00:00 (start of day)
 */
export const getTodayStart = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

/**
 * Get today's date at 23:59:59 (end of day)
 */
export const getTodayEnd = (): Date => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return today;
};

/**
 * Check if a checklist was already submitted today by this patient
 */
export const hasChecklistToday = async (patientId: string): Promise<boolean> => {
  try {
    const { items } = await BaseCrudService.getAll<ChecklistsDirios>('checklistsdiarios');
    
    const todayStart = getTodayStart();
    const todayEnd = getTodayEnd();
    
    const todayChecklist = items.find(checklist => {
      if (checklist.patientId !== patientId) return false;
      
      const checklistDate = new Date(checklist.checklistDate || '');
      return checklistDate >= todayStart && checklistDate <= todayEnd;
    });
    
    return !!todayChecklist;
  } catch (error) {
    logger.error('checklistValidator', 'hasChecklistToday', 'Error checking today checklist', error);
    throw error;
  }
};

/**
 * Get today's checklist for a patient (if exists)
 */
export const getTodayChecklist = async (patientId: string): Promise<ChecklistsDirios | null> => {
  try {
    const { items } = await BaseCrudService.getAll<ChecklistsDirios>('checklistsdiarios');
    
    const todayStart = getTodayStart();
    const todayEnd = getTodayEnd();
    
    const todayChecklist = items.find(checklist => {
      if (checklist.patientId !== patientId) return false;
      
      const checklistDate = new Date(checklist.checklistDate || '');
      return checklistDate >= todayStart && checklistDate <= todayEnd;
    });
    
    return todayChecklist || null;
  } catch (error) {
    logger.error('checklistValidator', 'getTodayChecklist', 'Error getting today checklist', error);
    throw error;
  }
};

/**
 * Check if patient has been discharged (ALTA_MEDICA)
 */
export const isPatientDischarged = async (patientId: string): Promise<boolean> => {
  try {
    const patient = await BaseCrudService.getById<Pacientes>('pacientes', patientId);
    if (!patient) return false;
    
    // Check if patient has discharge status set to ALTA_MEDICA
    return patient.dischargeStatus === 'ALTA_MEDICA';
  } catch (error) {
    logger.error('checklistValidator', 'isPatientDischarged', 'Error checking discharge status', error);
    return false;
  }
};

/**
 * Check if patient's follow-up has ended (discharge)
 */
export const isFollowUpEnded = async (patientId: string): Promise<boolean> => {
  try {
    // First check if patient has been discharged
    const isDischarged = await isPatientDischarged(patientId);
    if (isDischarged) return true;
    
    const { items } = await BaseCrudService.getAll<any>('statusacompanhamentopaciente');
    
    const patientStatus = items.find(status => {
      // Try to match by patient name or ID
      return status.patientName?.toLowerCase().includes(patientId) || 
             status._id === patientId;
    });
    
    if (!patientStatus) return false;
    
    // Check if follow-up end date has passed
    if (patientStatus.followUpEndDate) {
      const endDate = new Date(patientStatus.followUpEndDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today > endDate;
    }
    
    return false;
  } catch (error) {
    logger.error('checklistValidator', 'isFollowUpEnded', 'Error checking follow-up status', error);
    return false;
  }
};

/**
 * Get the next checklist release time (05:00 AM)
 */
export const getNextReleaseTime = (): Date => {
  const now = new Date();
  const nextRelease = new Date();
  
  // Set to 05:00 AM
  nextRelease.setHours(5, 0, 0, 0);
  
  // If it's already past 05:00 AM today, set to tomorrow's 05:00 AM
  if (now > nextRelease) {
    nextRelease.setDate(nextRelease.getDate() + 1);
  }
  
  return nextRelease;
};

/**
 * Check if it's time to release a new checklist (after 05:00 AM)
 */
export const isChecklistReleaseTime = (): boolean => {
  const now = new Date();
  const releaseHour = 5;
  const releaseMinute = 0;
  
  // Check if current time is >= 05:00 AM
  return now.getHours() > releaseHour || 
         (now.getHours() === releaseHour && now.getMinutes() >= releaseMinute);
};

/**
 * Format time until next release
 */
export const getTimeUntilNextRelease = (): string => {
  const nextRelease = getNextReleaseTime();
  const now = new Date();
  
  const diffMs = nextRelease.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes}m`;
  }
  return `${diffMinutes}m`;
};

/**
 * Validate if patient can submit a checklist
 */
export interface ChecklistValidationResult {
  canSubmit: boolean;
  reason?: string;
  nextReleaseTime?: Date;
}

export const validateChecklistSubmission = async (patientId: string): Promise<ChecklistValidationResult> => {
  try {
    // Check if follow-up has ended
    const followUpEnded = await isFollowUpEnded(patientId);
    if (followUpEnded) {
      return {
        canSubmit: false,
        reason: 'Seu acompanhamento foi finalizado. Não há novos checklists pendentes. Em caso de dúvidas ou sintomas, entre em contato com sua equipe de saúde.'
      };
    }
    
    // Check if checklist already submitted today
    const hasToday = await hasChecklistToday(patientId);
    if (hasToday) {
      return {
        canSubmit: false,
        reason: 'Você já enviou o checklist referente ao dia de hoje. Para garantir um acompanhamento adequado, um novo checklist será liberado automaticamente amanhã às 05:00.',
        nextReleaseTime: getNextReleaseTime()
      };
    }
    
    return { canSubmit: true };
  } catch (error) {
    logger.error('checklistValidator', 'validateChecklistSubmission', 'Error validating submission', error);
    throw error;
  }
};
