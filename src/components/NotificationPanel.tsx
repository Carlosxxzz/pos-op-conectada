import { useState, useRef, useEffect } from 'react';
import { Bell, X, AlertCircle, CheckCircle, Clock, Trash2, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '@/hooks/useNotifications';
import { format, isToday, isYesterday, isWithinInterval, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificationPanelProps {
  professionalId: string | null;
  onNotificationClick?: (notificationId: string, checklistId?: string) => void;
}

export default function NotificationPanel({ professionalId, onNotificationClick }: NotificationPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearReadNotifications,
  } = useNotifications(professionalId);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'referral':
        return <AlertCircle className="w-5 h-5 text-critical" />;
      case 'checklist':
        return <CheckCircle className="w-5 h-5 text-primary" />;
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-critical" />;
      case 'urgent':
        return <AlertCircle className="w-5 h-5 text-attention-foreground" />;
      default:
        return <Bell className="w-5 h-5 text-primary" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'referral':
        return 'border-l-4 border-l-primary';
      case 'checklist':
        return 'border-l-4 border-l-primary';
      case 'critical':
        return 'border-l-4 border-l-critical';
      case 'urgent':
        return 'border-l-4 border-l-attention-foreground';
      default:
        return 'border-l-4 border-l-secondary';
    }
  };

  const groupNotificationsByDate = (notifs: typeof notifications) => {
    const today = new Date();
    const yesterday = subDays(today, 1);
    const sevenDaysAgo = subDays(today, 7);
    const thirtyDaysAgo = subDays(today, 30);

    const groups: Record<string, typeof notifications> = {
      'Hoje': [],
      'Ontem': [],
      'Últimos 7 dias': [],
      'Últimos 30 dias': [],
      'Mais antigos': [],
    };

    notifs.forEach(notif => {
      const notifDate = new Date(notif.timestamp || '');
      
      if (isToday(notifDate)) {
        groups['Hoje'].push(notif);
      } else if (isYesterday(notifDate)) {
        groups['Ontem'].push(notif);
      } else if (isWithinInterval(notifDate, { start: sevenDaysAgo, end: yesterday })) {
        groups['Últimos 7 dias'].push(notif);
      } else if (isWithinInterval(notifDate, { start: thirtyDaysAgo, end: sevenDaysAgo })) {
        groups['Últimos 30 dias'].push(notif);
      } else {
        groups['Mais antigos'].push(notif);
      }
    });

    return groups;
  };

  const handleNotificationClick = (notificationId: string, checklistId?: string) => {
    markAsRead(notificationId);
    if (onNotificationClick) {
      onNotificationClick(notificationId, checklistId);
    }
  };

  const unreadNotifications = notifications.filter(n => !n.isRead);
  const readNotifications = notifications.filter(n => n.isRead);
  const displayNotifications = showHistory ? notifications : unreadNotifications;
  const groupedNotifications = groupNotificationsByDate(displayNotifications);

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Icon Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-background rounded-lg transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Bell className="w-6 h-6 text-foreground" />
        
        {/* Unread Badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute top-0 right-0 w-5 h-5 bg-critical text-critical-foreground text-xs font-bold rounded-full flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-96 bg-white rounded-2xl border border-secondary/20 shadow-2xl z-50 max-h-[600px] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-secondary/20">
              <div>
                <h3 className="font-heading text-lg font-bold text-foreground">Notificações</h3>
                {unreadCount > 0 && (
                  <p className="font-paragraph text-xs text-foreground/60 mt-1">
                    {unreadCount} não lida{unreadCount !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-background rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-foreground/60" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 px-6 pt-4 border-b border-secondary/20">
              <button
                onClick={() => setShowHistory(false)}
                className={`px-4 py-2 font-paragraph text-sm font-semibold rounded-lg transition-colors ${
                  !showHistory
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground/60 hover:text-foreground'
                }`}
              >
                Não Lidas ({unreadNotifications.length})
              </button>
              <button
                onClick={() => setShowHistory(true)}
                className={`px-4 py-2 font-paragraph text-sm font-semibold rounded-lg transition-colors ${
                  showHistory
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground/60 hover:text-foreground'
                }`}
              >
                Histórico ({readNotifications.length})
              </button>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {displayNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-6">
                  <Bell className="w-12 h-12 text-foreground/20 mb-3" />
                  <p className="font-paragraph text-sm text-foreground/60 text-center">
                    {showHistory
                      ? 'Nenhuma notificação no histórico'
                      : 'Você não possui novas notificações'}
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  {Object.entries(groupedNotifications).map(([dateGroup, notifs]) =>
                    notifs.length > 0 ? (
                      <div key={dateGroup}>
                        <h4 className="font-paragraph text-xs font-semibold text-foreground/60 uppercase px-3 py-2">
                          {dateGroup}
                        </h4>
                        <div className="space-y-2">
                          {notifs.map((notification, index) => (
                            <motion.div
                              key={notification._id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              onClick={() => handleNotificationClick(notification._id, notification.relatedChecklistId)}
                              className={`p-4 rounded-lg border bg-white hover:bg-background/50 cursor-pointer transition-all ${
                                notification.isRead ? 'border-secondary/10' : 'border-primary/30 bg-primary/5'
                              } ${getNotificationColor(notification.notificationType || 'default')}`}
                            >
                              <div className="flex gap-3">
                                <div className="flex-shrink-0 mt-1">
                                  {getNotificationIcon(notification.notificationType || 'default')}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                      <p className="font-paragraph font-semibold text-sm text-foreground">
                                        {notification.message}
                                      </p>
                                      {notification.patientName && (
                                        <p className="font-paragraph text-xs text-foreground/60 mt-1">
                                          Paciente: {notification.patientName}
                                        </p>
                                      )}
                                      {notification.hospital && (
                                        <p className="font-paragraph text-xs text-foreground/60">
                                          Hospital: {notification.hospital}
                                        </p>
                                      )}
                                    </div>
                                    {!notification.isRead && (
                                      <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Clock className="w-3 h-3 text-foreground/40" />
                                    <span className="font-paragraph text-xs text-foreground/50">
                                      {format(new Date(notification.timestamp || ''), 'HH:mm', { locale: ptBR })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ) : null
                  )}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            {notifications.length > 0 && (
              <div className="border-t border-secondary/20 p-4 flex gap-2">
                {!showHistory && unreadNotifications.length > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors font-paragraph text-sm font-semibold"
                  >
                    <Eye className="w-4 h-4" />
                    Marcar todas como lidas
                  </button>
                )}
                {showHistory && readNotifications.length > 0 && (
                  <button
                    onClick={clearReadNotifications}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors font-paragraph text-sm font-semibold"
                  >
                    <Trash2 className="w-4 h-4" />
                    Limpar histórico
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
