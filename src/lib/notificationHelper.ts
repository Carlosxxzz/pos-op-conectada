import { BaseCrudService } from '@/integrations';
import type { Notifications } from '@/entities';

export interface CreateNotificationParams {
  recipientId: string;
  recipientType: 'Médico' | 'Enfermeiro' | 'Administrador';
  patientId: string;
  patientName: string;
  hospitalId?: string;
  hospital?: string;
  type: 'referral' | 'checklist' | 'critical' | 'urgent';
  title: string;
  message: string;
  actionUrl?: string;
  relatedChecklistId?: string;
}

export const createNotification = async (params: CreateNotificationParams) => {
  try {
    const notification: Notifications = {
      _id: crypto.randomUUID(),
      recipientId: params.recipientId,
      recipientType: params.recipientType,
      message: params.message,
      notificationType: params.type,
      isRead: false,
      timestamp: new Date(),
      patientId: params.patientId,
    };

    // Add optional fields
    if (params.relatedChecklistId) {
      (notification as any).relatedChecklistId = params.relatedChecklistId;
    }
    if (params.hospital) {
      (notification as any).hospital = params.hospital;
    }
    if (params.patientName) {
      (notification as any).patientName = params.patientName;
    }

    await BaseCrudService.create('notificacoes', notification);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

export const createReferralNotification = async (
  doctorId: string,
  patientId: string,
  patientName: string,
  hospital: string,
  checklistId: string,
  nurseName: string,
  nurseMessage: string
) => {
  return createNotification({
    recipientId: doctorId,
    recipientType: 'Médico',
    patientId,
    patientName,
    hospital,
    type: 'referral',
    title: 'Novo Encaminhamento',
    message: `${nurseName} encaminhou ${patientName} para avaliação médica. Motivo: ${nurseMessage?.substring(0, 50)}...`,
    relatedChecklistId: checklistId,
  });
};

export const createChecklistNotification = async (
  doctorId: string,
  patientId: string,
  patientName: string,
  hospital: string,
  checklistId: string
) => {
  return createNotification({
    recipientId: doctorId,
    recipientType: 'Médico',
    patientId,
    patientName,
    hospital,
    type: 'checklist',
    title: 'Novo Checklist',
    message: `Novo checklist enviado por ${patientName}`,
    relatedChecklistId: checklistId,
  });
};

export const createCriticalNotification = async (
  doctorId: string,
  patientId: string,
  patientName: string,
  hospital: string,
  checklistId: string,
  reason: string
) => {
  return createNotification({
    recipientId: doctorId,
    recipientType: 'Médico',
    patientId,
    patientName,
    hospital,
    type: 'critical',
    title: 'Paciente Crítico',
    message: `${patientName} está em situação crítica. Motivo: ${reason}`,
    relatedChecklistId: checklistId,
  });
};
