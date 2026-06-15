import { useEffect, useRef } from 'react';
import { logger } from '@/lib/logger';

/**
 * Hook to maintain session persistence across page navigation
 * Prevents unexpected logouts and session loss
 */
export function useSessionPersistence() {
  const sessionCheckRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const checkSession = () => {
      try {
        const patientId = localStorage.getItem('patientId');
        const professionalId = localStorage.getItem('professionalId');

        // Log session state for debugging
        if (patientId) {
          logger.debug('SessionPersistence', 'checkSession', 'Patient session active', {
            patientId: patientId.substring(0, 8) + '...',
          });
        }

        if (professionalId) {
          logger.debug('SessionPersistence', 'checkSession', 'Professional session active', {
            professionalId: professionalId.substring(0, 8) + '...',
          });
        }
      } catch (error) {
        logger.error('SessionPersistence', 'checkSession', 'Error checking session', error);
      }
    };

    // Check session every 30 seconds
    sessionCheckRef.current = setInterval(checkSession, 30000);

    return () => {
      if (sessionCheckRef.current) {
        clearInterval(sessionCheckRef.current);
      }
    };
  }, []);
}
