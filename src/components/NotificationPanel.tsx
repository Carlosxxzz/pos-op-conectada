import { useState, useEffect } from 'react';
import { Bell, X, Check, Trash2, AlertCircle, CheckCircle, Clock, Zap, TrendingUp, Activity, FileText } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import type { Notifications } from '@/entities';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificationPanelProps {
  recipientId: string;
  isOpen: boolean;
  onClose: () => void;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'NOVO_CHECKLIST':
      return <FileText className="w-5 h-5" />;
    case 'CHECKLIST_RESPONDIDO':
      return <CheckCircle className="w-5 h-5" />;
    case 'CHECKLIST_NAO_RESPONDIDO':
      return <Clock className="w-5 h-5" />;
    case 'DOR_INTENSA':
      return <AlertCircle className="w-5 h-5" />;
    case 'FEBRE':
      return <Zap className="w-5 h-5" />;
    case 'FOTO_ENVIADA':
      return <Activity className="w-5 h-5" />;
    case 'AVALIACAO_MEDICA':
      return <CheckCircle className="w-5 h-5" />;
    case 'ALTA_CONCEDIDA':
      return <TrendingUp className="w-5 h-5" />;
    default:
      return <Bell className="w-5 h-5" />;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'NOVO_CHECKLIST':
      return 'bg-primary/10 text-primary';
    case 'CHECKLIST_RESPONDIDO':
      return 'bg-stable/10 text-stable';
    case 'CHECKLIST_NAO_RESPONDIDO':
      return 'bg-attention/10 text-attention-foreground';
    case 'DOR_INTENSA':
      return 'bg-critical/10 text-critical';
    case 'FEBRE':
      return 'bg-critical/10 text-critical';
    case 'FOTO_ENVIADA':
      return 'bg-primary/10 text-primary';
    case 'AVALIACAO_MEDICA':
      return 'bg-stable/10 text-stable';
    case 'ALTA_CONCEDIDA':
      return 'bg-stable/10 text-stable';
    default:
      return 'bg-foreground/10 text-foreground';
  }
};

const getNotificationTitle = (type: string) => {
  switch (type) {
    case 'NOVO_CHECKLIST':
      return 'Novo Checklist Recebido';
    case 'CHECKLIST_RESPONDIDO':
      return 'Paciente Respondeu Checklist';
    case 'CHECKLIST_NAO_RESPONDIDO':
      return 'Paciente Não Respondeu Checklist';
    case 'DOR_INTENSA':
      return 'Paciente Informou Dor Intensa';
    case 'FEBRE':
      return 'Paciente Apresentou Febre';
    case 'FOTO_ENVIADA':
      return 'Paciente Enviou Nova Foto';
    case 'AVALIACAO_MEDICA':
      return 'Médico Concluiu Avaliação';
    case 'ALTA_CONCEDIDA':
      return 'Paciente Recebeu Alta';
    default:
      return 'Nova Notificação';
  }
};

export default function NotificationPanel({ recipientId, isOpen, onClose }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notifications[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const result = await BaseCrudService.getAll<Notifications>('notificacoes');
      const userNotifications = result.items
        .filter(n => n.recipientId === recipientId)
        .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
      setNotifications(userNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await BaseCrudService.update<Notifications>('notificacoes', {
        _id: notificationId,
        isRead: true,
      });
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await BaseCrudService.delete('notificacoes', notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.isRead);
      await Promise.all(
        unreadNotifications.map(n =>
          BaseCrudService.update<Notifications>('notificacoes', {
            _id: n._id,
            isRead: true,
          })
        )
      );
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const clearOldNotifications = async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const oldNotifications = notifications.filter(n => {
        const notifDate = new Date(n.timestamp || 0);
        return notifDate < thirtyDaysAgo;
      });

      await Promise.all(
        oldNotifications.map(n => BaseCrudService.delete('notificacoes', n._id))
      );

      setNotifications(prev =>
        prev.filter(n => {
          const notifDate = new Date(n.timestamp || 0);
          return notifDate >= thirtyDaysAgo;
        })
      );
    } catch (error) {
      console.error('Error clearing old notifications:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <>
      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 z-40"
          />
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed right-0 top-0 h-screen w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="border-b border-secondary/20 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-6 h-6 text-primary" />
                <h2 className="font-heading text-xl font-bold text-foreground">Notificações</h2>
                {unreadCount > 0 && (
                  <span className="bg-critical text-critical-foreground text-xs font-bold px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-background rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>
            </div>

            {/* Actions */}
            {notifications.length > 0 && (
              <div className="border-b border-secondary/20 p-4 flex gap-2">
                <button
                  onClick={markAllAsRead}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors font-paragraph text-sm font-semibold"
                >
                  <Check className="w-4 h-4" />
                  Marcar Tudo
                </button>
                <button
                  onClick={clearOldNotifications}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors font-paragraph text-sm font-semibold"
                >
                  <Trash2 className="w-4 h-4" />
                  Limpar
                </button>
              </div>
            )}

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="font-paragraph text-sm text-foreground/60">Carregando...</p>
                  </div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center px-6">
                    <Bell className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
                    <p className="font-paragraph text-sm text-foreground/60">Nenhuma notificação</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 p-4">
                  {notifications.map((notification, index) => (
                    <motion.div
                      key={notification._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`rounded-lg p-4 border transition-all ${
                        notification.isRead
                          ? 'bg-background border-secondary/20'
                          : 'bg-primary/5 border-primary/30'
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getNotificationColor(notification.notificationType || '')}`}>
                          {getNotificationIcon(notification.notificationType || '')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-paragraph font-semibold text-sm text-foreground">
                              {getNotificationTitle(notification.notificationType || '')}
                            </h3>
                            {!notification.isRead && (
                              <button
                                onClick={() => markAsRead(notification._id)}
                                className="p-1 hover:bg-white rounded transition-colors flex-shrink-0"
                              >
                                <Check className="w-4 h-4 text-primary" />
                              </button>
                            )}
                          </div>
                          <p className="font-paragraph text-xs text-foreground/60 mb-2 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="font-paragraph text-xs text-foreground/50">
                              {format(new Date(notification.timestamp || 0), 'dd MMM HH:mm', { locale: ptBR })}
                            </span>
                            <button
                              onClick={() => deleteNotification(notification._id)}
                              className="p-1 hover:bg-destructive/10 rounded transition-colors"
                            >
                              <Trash2 className="w-3 h-3 text-destructive" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
