import { useEffect } from 'react';
import { BaseCrudService } from '@/integrations';
import type { Notifications } from '@/entities';
import { logger } from '@/lib/logger';

/**
 * Hook to manage daily checklist notifications at 05:00 AM
 * This runs on the client side and creates notifications when the release time is reached
 */
export const useDailyChecklistNotification = (patientId: string | null) => {
  useEffect(() => {
    if (!patientId) return;

    // Check immediately on mount
    checkAndCreateNotification(patientId);

    // Set up interval to check every minute
    const interval = setInterval(() => {
      checkAndCreateNotification(patientId);
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [patientId]);
};

/**
 * Check if it's 05:00 AM and create notification if needed
 */
const checkAndCreateNotification = async (patientId: string) => {
  try {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Check if it's between 05:00 and 05:01 (to avoid duplicate notifications)
    if (currentHour === 5 && currentMinute === 0) {
      // Check if notification already exists for today
      const { items } = await BaseCrudService.getAll<Notifications>('notificacoes');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayNotification = items.find(notif => {
        if (notif.recipientId !== patientId) return false;
        if (notif.notificationType !== 'CHECKLIST_RELEASED') return false;
        
        const notifDate = new Date(notif.timestamp || '');
        return notifDate >= today && notifDate < tomorrow;
      });

      // Only create if notification doesn't exist
      if (!todayNotification) {
        await BaseCrudService.create('notificacoes', {
          _id: crypto.randomUUID(),
          recipientId: patientId,
          recipientType: 'Paciente',
          notificationType: 'CHECKLIST_RELEASED',
          message: 'Seu checklist diário já está disponível. Acesse o sistema e responda as perguntas para continuar seu acompanhamento.',
          isRead: false,
          timestamp: new Date().toISOString(),
        });

        logger.info('useDailyChecklistNotification', 'checkAndCreateNotification', 'Daily checklist notification created', {
          patientId: patientId.substring(0, 8),
          time: `${currentHour}:${currentMinute}`,
        });
      }
    }
  } catch (error) {
    logger.error('useDailyChecklistNotification', 'checkAndCreateNotification', 'Error creating notification', error);
  }
};
