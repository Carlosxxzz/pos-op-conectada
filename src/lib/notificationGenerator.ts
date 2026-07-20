import { BaseCrudService } from '@/integrations';
import type { Notifications } from '@/entities';

export interface NotificationPayload {
  recipientId: string;
  recipientType: 'Enfermeiro' | 'Médico' | 'Administrador';
  patientId: string;
  patientName: string;
  hospital: string;
  notificationType: 'checklist' | 'critical' | 'referral' | 'medical_evaluation' | 'discharge' | 'urgent';
  message: string;
  relatedChecklistId?: string;
  timestamp?: Date | string;
}

/**
 * Create a notification in the database
 */
export const createNotification = async (payload: NotificationPayload) => {
  try {
    const notification: Notifications = {
      _id: crypto.randomUUID(),
      recipientId: payload.recipientId,
      recipientType: payload.recipientType,
      patientId: payload.patientId,
      patientName: payload.patientName,
      hospital: payload.hospital,
      notificationType: payload.notificationType,
      message: payload.message,
      relatedChecklistId: payload.relatedChecklistId,
      isRead: false,
      timestamp: payload.timestamp || new Date(),
    };

    await BaseCrudService.create('notificacoes', notification);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Notify nurses when a new checklist is submitted
 */
export const notifyChecklistSubmitted = async (
  checklistId: string,
  patientId: string,
  patientName: string,
  hospital: string,
  nursesIds: string[]
) => {
  const message = `Novo checklist diário recebido de ${patientName}`;
  
  for (const nurseId of nursesIds) {
    await createNotification({
      recipientId: nurseId,
      recipientType: 'Enfermeiro',
      patientId,
      patientName,
      hospital,
      notificationType: 'checklist',
      message,
      relatedChecklistId: checklistId,
    });
  }
};

/**
 * Notify nurses when critical alerts are detected
 */
export const notifyCriticalAlert = async (
  checklistId: string,
  patientId: string,
  patientName: string,
  hospital: string,
  alertReason: string,
  nursesIds: string[]
) => {
  const message = `⚠️ Alerta crítico: ${alertReason}`;
  
  for (const nurseId of nursesIds) {
    await createNotification({
      recipientId: nurseId,
      recipientType: 'Enfermeiro',
      patientId,
      patientName,
      hospital,
      notificationType: 'critical',
      message,
      relatedChecklistId: checklistId,
    });
  }
};

/**
 * Notify nurses when a medical evaluation is completed
 */
export const notifyMedicalEvaluationCompleted = async (
  checklistId: string,
  patientId: string,
  patientName: string,
  hospital: string,
  doctorName: string,
  nursesIds: string[]
) => {
  const message = `Avaliação médica concluída por ${doctorName}`;
  
  for (const nurseId of nursesIds) {
    await createNotification({
      recipientId: nurseId,
      recipientType: 'Enfermeiro',
      patientId,
      patientName,
      hospital,
      notificationType: 'medical_evaluation',
      message,
      relatedChecklistId: checklistId,
    });
  }
};

/**
 * Notify nurses when a patient is discharged
 */
export const notifyPatientDischarge = async (
  patientId: string,
  patientName: string,
  hospital: string,
  dischargeReason: string,
  nursesIds: string[]
) => {
  const message = `${patientName} recebeu alta. Motivo: ${dischargeReason}`;
  
  for (const nurseId of nursesIds) {
    await createNotification({
      recipientId: nurseId,
      recipientType: 'Enfermeiro',
      patientId,
      patientName,
      hospital,
      notificationType: 'discharge',
      message,
    });
  }
};

/**
 * Notify nurses when a referral is created
 */
export const notifyReferralCreated = async (
  checklistId: string,
  patientId: string,
  patientName: string,
  hospital: string,
  doctorName: string,
  nursesIds: string[]
) => {
  const message = `Paciente encaminhado para ${doctorName}`;
  
  for (const nurseId of nursesIds) {
    await createNotification({
      recipientId: nurseId,
      recipientType: 'Enfermeiro',
      patientId,
      patientName,
      hospital,
      notificationType: 'referral',
      message,
      relatedChecklistId: checklistId,
    });
  }
};

/**
 * Notify nurses of urgent situations
 */
export const notifyUrgentSituation = async (
  checklistId: string,
  patientId: string,
  patientName: string,
  hospital: string,
  urgencyReason: string,
  nursesIds: string[]
) => {
  const message = `🚨 Situação urgente: ${urgencyReason}`;
  
  for (const nurseId of nursesIds) {
    await createNotification({
      recipientId: nurseId,
      recipientType: 'Enfermeiro',
      patientId,
      patientName,
      hospital,
      notificationType: 'urgent',
      message,
      relatedChecklistId: checklistId,
    });
  }
};
