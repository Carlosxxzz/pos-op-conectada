import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Users, AlertCircle, CheckCircle, Clock, ArrowRight, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BaseCrudService } from '@/integrations';
import type { ChecklistsDirios, Pacientes, Profissionais } from '@/entities';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { motion } from 'framer-motion';
import { logger } from '@/lib/logger';
import { useSessionPersistence } from '@/hooks/useSessionPersistence';

interface PatientWithChecklist {
  patient: Pacientes;
  latestChecklist: ChecklistsDirios | null;
}

export default function NursingDashboardPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [patients, setPatients] = useState<PatientWithChecklist[]>([]);
  const [professional, setProfessional] = useState<Profissionais | null>(null);
  const [error, setError] = useState<string>('');
  
  // Maintain session persistence
  useSessionPersistence();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Get professional info from localStorage
      const professionalId = localStorage.getItem('professionalId');
      if (!professionalId) {
        logger.warn('NursingDashboard', 'loadData', 'No professionalId found in localStorage');
        navigate('/professional-login');
        return;
      }

      logger.info('NursingDashboard', 'loadData', 'Loading professional data', {
        professionalId: professionalId.substring(0, 8),
      });

      const professionalData = await BaseCrudService.getById<Profissionais>('profissionais', professionalId);
      if (!professionalData) {
        logger.error('NursingDashboard', 'loadData', 'Professional data not found');
        setError('Dados do profissional não encontrados. Por favor, faça login novamente.');
        navigate('/professional-login');
        return;
      }
      
      setProfessional(professionalData);
      logger.info('NursingDashboard', 'loadData', 'Professional data loaded', {
        hospital: professionalData.hospital,
      });

      // Get all patients and checklists
      const { items: allPatients } = await BaseCrudService.getAll<Pacientes>('pacientes');
      const { items: allChecklists } = await BaseCrudService.getAll<ChecklistsDirios>('checklistsdiarios');

      logger.info('NursingDashboard', 'loadData', 'Data fetched', {
        totalPatients: allPatients.length,
        totalChecklists: allChecklists.length,
      });

      // Filter patients: only those with at least one PENDING checklist AND matching hospital
      const patientsWithChecklists: PatientWithChecklist[] = allPatients
        .filter(patient => {
          // Only show patients from the same hospital
          return patient.hospital === professionalData?.hospital;
        })
        .map(patient => {
          const patientChecklists = allChecklists.filter(c => c.patientId === patient._id);
          // Filter for PENDING checklists only (not evaluated, not completed, not referred)
          const pendingChecklists = patientChecklists.filter(c => 
            c.statusEnfermagem === 'Pendente' || !c.avaliadoEnfermagem
          );
          const latestChecklist = pendingChecklists.length > 0
            ? pendingChecklists.sort((a, b) => 
                new Date(b.checklistDate || 0).getTime() - new Date(a.checklistDate || 0).getTime()
              )[0]
            : null;
          
          return { patient, latestChecklist };
        })
        // Only show patients with at least one PENDING checklist
        .filter(item => item.latestChecklist !== null);

      const sortedPatients = patientsWithChecklists.sort((a, b) => {
        const priorityOrder = { critical: 0, attention: 1, stable: 2 };
        const aPriority = priorityOrder[a.latestChecklist?.riskLevel as keyof typeof priorityOrder] ?? 3;
        const bPriority = priorityOrder[b.latestChecklist?.riskLevel as keyof typeof priorityOrder] ?? 3;
        return aPriority - bPriority;
      });

      setPatients(sortedPatients);
      logger.info('NursingDashboard', 'loadData', 'Patients loaded and sorted', {
        count: sortedPatients.length,
      });
    } catch (error) {
      logger.error('NursingDashboard', 'loadData', 'Error loading data', error);
      setError('Erro ao carregar dados. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logger.info('NursingDashboard', 'handleLogout', 'Professional logging out');
    localStorage.removeItem('professionalId');
    localStorage.removeItem('professionalProfile');
    navigate('/professional-login');
  };

  const criticalPatients = patients.filter(p => p.latestChecklist?.riskLevel === 'critical');
  const attentionPatients = patients.filter(p => p.latestChecklist?.riskLevel === 'attention');
  const stablePatients = patients.filter(p => p.latestChecklist?.riskLevel === 'stable');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-secondary/20">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0" />
            <h2 className="font-heading text-xl font-bold text-foreground">Erro</h2>
          </div>
          <p className="font-paragraph text-base text-foreground/70 mb-6">{error}</p>
          <Button
            onClick={() => {
              setError('');
              loadData();
            }}
            className="w-full bg-primary text-primary-foreground hover:opacity-90"
          >
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-secondary/30">
        <div className="max-w-[120rem] mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Activity className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-heading text-2xl font-bold text-foreground">Pós-Op Conectado</h1>
                <p className="font-paragraph text-sm text-foreground/60">Dashboard de Enfermagem</p>
                {professional && (
                  <p className="font-paragraph text-xs text-foreground/50 mt-1">
                    Hospital: {professional.hospital}
                  </p>
                )}
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-6 py-2 bg-destructive text-destructive-foreground font-paragraph font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-[120rem] mx-auto px-8 py-12">
        {/* Empty State */}
        {patients.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
            <h2 className="font-heading text-2xl font-bold text-foreground mb-2">
              Nenhum paciente para acompanhar
            </h2>
            <p className="font-paragraph text-lg text-foreground/70 mb-8">
              Os pacientes aparecerão aqui quando se cadastrarem, fizerem login e enviarem seu primeiro checklist.
            </p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-6 border border-secondary/20"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <span className="font-heading text-3xl font-bold text-foreground">{patients.length}</span>
                </div>
                <p className="font-paragraph text-sm text-foreground/70">Total de Pacientes</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-critical/10 rounded-2xl p-6 border border-critical/20"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-critical rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-critical-foreground" />
                  </div>
                  <span className="font-heading text-3xl font-bold text-critical">{criticalPatients.length}</span>
                </div>
                <p className="font-paragraph text-sm text-foreground/70">Pacientes Críticos</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-attention/10 rounded-2xl p-6 border border-attention/20"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-attention rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-attention-foreground" />
                  </div>
                  <span className="font-heading text-3xl font-bold text-attention-foreground">{attentionPatients.length}</span>
                </div>
                <p className="font-paragraph text-sm text-foreground/70">Requer Atenção</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-stable/10 rounded-2xl p-6 border border-stable/20"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-stable rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-stable-foreground" />
                  </div>
                  <span className="font-heading text-3xl font-bold text-stable">{stablePatients.length}</span>
                </div>
                <p className="font-paragraph text-sm text-foreground/70">Pacientes Estáveis</p>
              </motion.div>
            </div>

            {/* Critical Patients Section */}
            {criticalPatients.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <AlertCircle className="w-6 h-6 text-critical" />
                  <h2 className="font-heading text-3xl font-bold text-foreground">
                    Pacientes Críticos - Prioridade Máxima
                  </h2>
                </div>
                <div className="space-y-4">
                  {criticalPatients.map((item, index) => (
                    <motion.div
                      key={item.patient._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        to={`/nursing-evaluation/${item.patient._id}`}
                        className="block bg-critical/10 border-2 border-critical rounded-2xl p-6 hover:bg-critical/20 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <span className="font-heading text-xl font-bold text-foreground">
                                {item.patient.fullName}
                              </span>
                              <span className="bg-critical text-critical-foreground text-xs font-semibold px-3 py-1 rounded-full">
                                CRÍTICO
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <p className="font-paragraph text-xs text-foreground/60 mb-1">Cirurgia</p>
                                <p className="font-paragraph text-sm font-semibold text-foreground">
                                  {item.patient.surgeryType}
                                </p>
                              </div>
                              <div>
                                <p className="font-paragraph text-xs text-foreground/60 mb-1">Dor</p>
                                <p className="font-paragraph text-sm font-semibold text-critical">
                                  {item.latestChecklist?.painLevel}/10
                                </p>
                              </div>
                              <div>
                                <p className="font-paragraph text-xs text-foreground/60 mb-1">Temperatura</p>
                                <p className="font-paragraph text-sm font-semibold text-critical">
                                  {item.latestChecklist?.bodyTemperature}°C
                                </p>
                              </div>
                              <div>
                                <p className="font-paragraph text-xs text-foreground/60 mb-1">Último Checklist</p>
                                <p className="font-paragraph text-sm font-semibold text-foreground">
                                  {item.latestChecklist?.checklistDate 
                                    ? new Date(item.latestChecklist.checklistDate).toLocaleDateString('pt-BR')
                                    : '-'}
                                </p>
                              </div>
                            </div>
                          </div>
                          <ArrowRight className="w-6 h-6 text-critical flex-shrink-0 ml-4" />
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Attention Patients Section */}
            {attentionPatients.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <Clock className="w-6 h-6 text-attention-foreground" />
                  <h2 className="font-heading text-3xl font-bold text-foreground">
                    Pacientes em Observação
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {attentionPatients.map((item, index) => (
                    <motion.div
                      key={item.patient._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        to={`/nursing-evaluation/${item.patient._id}`}
                        className="block bg-white border border-attention/30 rounded-2xl p-6 hover:bg-attention/5 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <span className="font-heading text-lg font-bold text-foreground">
                            {item.patient.fullName}
                          </span>
                          <span className="bg-attention/20 text-attention-foreground text-xs font-semibold px-3 py-1 rounded-full">
                            ATENÇÃO
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="font-paragraph text-sm text-foreground/60">Cirurgia:</span>
                            <span className="font-paragraph text-sm font-semibold text-foreground">
                              {item.patient.surgeryType}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-paragraph text-sm text-foreground/60">Dor:</span>
                            <span className="font-paragraph text-sm font-semibold text-foreground">
                              {item.latestChecklist?.painLevel}/10
                            </span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Stable Patients Section */}
            {stablePatients.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <CheckCircle className="w-6 h-6 text-stable" />
                  <h2 className="font-heading text-3xl font-bold text-foreground">
                    Pacientes Estáveis
                  </h2>
                </div>
                <div className="bg-white rounded-2xl border border-secondary/20 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-background">
                        <tr>
                          <th className="px-6 py-4 text-left font-paragraph text-sm font-semibold text-foreground">
                            Paciente
                          </th>
                          <th className="px-6 py-4 text-left font-paragraph text-sm font-semibold text-foreground">
                            Cirurgia
                          </th>
                          <th className="px-6 py-4 text-left font-paragraph text-sm font-semibold text-foreground">
                            Dor
                          </th>
                          <th className="px-6 py-4 text-left font-paragraph text-sm font-semibold text-foreground">
                            Status
                          </th>
                          <th className="px-6 py-4 text-left font-paragraph text-sm font-semibold text-foreground">
                            Ação
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {stablePatients.map((item) => (
                          <tr key={item.patient._id} className="border-t border-secondary/20">
                            <td className="px-6 py-4 font-paragraph text-sm text-foreground">
                              {item.patient.fullName}
                            </td>
                            <td className="px-6 py-4 font-paragraph text-sm text-foreground">
                              {item.patient.surgeryType}
                            </td>
                            <td className="px-6 py-4 font-paragraph text-sm text-foreground">
                              {item.latestChecklist?.painLevel}/10
                            </td>
                            <td className="px-6 py-4">
                              <span className="bg-stable/10 text-stable text-xs font-semibold px-3 py-1 rounded-full">
                                ESTÁVEL
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <Link
                                to={`/nursing-evaluation/${item.patient._id}`}
                                className="text-primary font-paragraph text-sm font-semibold hover:underline"
                              >
                                Avaliar →
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
