import { useEffect, useState } from 'react';
import { BaseCrudService } from '@/integrations';
import type { Profissionais, Pacientes } from '@/entities';

/**
 * Hook para obter o contexto do hospital do usuário autenticado
 * Funciona para profissionais e pacientes
 * Retorna o ID do hospital e informações relacionadas
 */
export function useHospitalContext() {
  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [hospitalName, setHospitalName] = useState<string | null>(null);
  const [userType, setUserType] = useState<'professional' | 'patient' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHospitalContext();
  }, []);

  const loadHospitalContext = async () => {
    try {
      // Check if professional is logged in
      const professionalId = localStorage.getItem('professionalId');
      if (professionalId) {
        const professional = await BaseCrudService.getById<Profissionais>('profissionais', professionalId);
        if (professional?.hospital) {
          setHospitalId(professional.hospital);
          setUserType('professional');
          // Optionally load hospital name
          try {
            const hospital = await BaseCrudService.getById('hospitais', professional.hospital);
            setHospitalName((hospital as any)?.name || null);
          } catch {
            // Hospital name not found, continue without it
          }
        }
        return;
      }

      // Check if patient is logged in
      const patientId = localStorage.getItem('patientId');
      if (patientId) {
        const patient = await BaseCrudService.getById<Pacientes>('pacientes', patientId);
        if (patient?.hospital) {
          setHospitalId(patient.hospital);
          setUserType('patient');
          // Optionally load hospital name
          try {
            const hospital = await BaseCrudService.getById('hospitais', patient.hospital);
            setHospitalName((hospital as any)?.name || null);
          } catch {
            // Hospital name not found, continue without it
          }
        }
        return;
      }
    } catch (error) {
      console.error('Error loading hospital context:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    hospitalId,
    hospitalName,
    userType,
    isLoading,
    isAuthenticated: !!hospitalId,
  };
}
