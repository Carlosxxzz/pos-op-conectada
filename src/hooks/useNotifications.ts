import { useState, useEffect, useCallback } from 'react';
import { BaseCrudService } from '@/integrations';
import type { Notifications } from '@/entities';

export interface NotificationWithDetails extends Notifications {
  patientName?: string;
  hospital?: string;
  relatedChecklistId?: string;
}

export const useNotifications = (professionalId: string | null, recipientType: string = 'Enfermeiro') => {
  const [notifications, setNotifications] = useState<NotificationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    if (!professionalId) return;
    
    try {
      setIsLoading(true);
      const { items } = await BaseCrudService.getAll<Notifications>('notificacoes');
      
      // Filter notifications for this professional
      const filtered = items.filter(n => 
        n.recipientId === professionalId && n.recipientType === recipientType
      ) as NotificationWithDetails[];
      
      // Sort by newest first
      filtered.sort((a, b) => {
        const dateA = new Date(a.timestamp || 0).getTime();
        const dateB = new Date(b.timestamp || 0).getTime();
        return dateB - dateA;
      });
      
      setNotifications(filtered);
      
      // Count unread
      const unread = filtered.filter(n => !n.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [professionalId, recipientType]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await BaseCrudService.update<Notifications>('notificacoes', {
        _id: notificationId,
        isRead: true,
      });
      
      // Update local state
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.isRead);
      
      for (const notification of unreadNotifications) {
        await BaseCrudService.update<Notifications>('notificacoes', {
          _id: notification._id,
          isRead: true,
        });
      }
      
      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, [notifications]);

  const clearReadNotifications = useCallback(async () => {
    try {
      const readNotifications = notifications.filter(n => n.isRead);
      
      for (const notification of readNotifications) {
        await BaseCrudService.delete('notificacoes', notification._id);
      }
      
      // Update local state
      setNotifications(prev => prev.filter(n => !n.isRead));
    } catch (error) {
      console.error('Error clearing read notifications:', error);
    }
  }, [notifications]);

  // Load notifications on mount and set up polling
  useEffect(() => {
    loadNotifications();
    
    // Poll for new notifications every 10 seconds
    const interval = setInterval(loadNotifications, 10000);
    
    return () => clearInterval(interval);
  }, [loadNotifications]);

  return {
    notifications,
    isLoading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearReadNotifications,
    refresh: loadNotifications,
  };
};
