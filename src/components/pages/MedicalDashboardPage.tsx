import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Stethoscope, AlertCircle, ArrowRight, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BaseCrudService } from '@/integrations';
import type { AvaliaesdeEnfermagem, Pacientes, Profissionais } from '@/entities';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { motion } from 'framer-motion';

interface ReferredCase {
  evaluation: AvaliaesdeEnfermagem;
  patient: Pacientes | null;
}

export default function MedicalDashboardPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [referredCases, setReferredCases] = useState<ReferredCase[]>([]);
  const [professional, setProfessional] = useState<Profissionais | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Get professional info from localStorage
      const professionalId = localStorage.getItem('professionalId');
      if (!professionalId) {
        navigate('/professional-login');
        return;
      }

      const professionalData = await BaseCrudService.getById<Profissionais>('profissionais', professionalId);
      setProfessional(professionalData);

      const { items: patients } = await BaseCrudService.getAll<Pacientes>('pacientes');
      const { items: evaluations } = await BaseCrudService.getAll<AvaliaesdeEnfermagem>('avaliacoesenfermagem');

      // Filter patients: only those with pending_medical status AND matching hospital
      const referred = patients
        .filter(patient => {
          // Only show patients from the same hospital with pending_medical status
          return patient.hospital === professionalData?.hospital && 
                 patient.followUpStatus === 'pending_medical';
        })
        .map(patient => {
          // For each patient, find their latest nursing evaluation
          const patientEvaluations = evaluations.filter(e => e.patientId === patient._id);
          const latestEvaluation = patientEvaluations.sort((a, b) => 
            new Date(b.checklistDate || 0).getTime() - new Date(a.checklistDate || 0).getTime()
          )[0];
          return { evaluation: latestEvaluation || null, patient };
        })
        .filter(item => item.evaluation !== null)
        .sort((a, b) => {
          const dateA = new Date(a.evaluation?.checklistDate || 0).getTime();
          const dateB = new Date(b.evaluation?.checklistDate || 0).getTime();
          return dateB - dateA;
        });

      setReferredCases(referred as any);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('professionalId');
    localStorage.removeItem('professionalProfile');
    navigate('/professional-login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const criticalCases = referredCases.filter(c => c.evaluation.patientStatus === 'critical');
  const observationCases = referredCases.filter(c => c.evaluation.patientStatus === 'observation');

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
                <p className="font-paragraph text-sm text-foreground/60">Dashboard Médico</p>
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
        {referredCases.length === 0 ? (
          <div className="text-center py-16">
            <Stethoscope className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
            <h2 className="font-heading text-2xl font-bold text-foreground mb-2">
              Nenhum paciente encaminhado
            </h2>
            <p className="font-paragraph text-lg text-foreground/70 mb-8">
              Os pacientes encaminhados pela enfermagem aparecerão aqui quando forem referenciados.
            </p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-6 border border-secondary/20"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Stethoscope className="w-6 h-6 text-primary" />
                  </div>
                  <span className="font-heading text-3xl font-bold text-foreground">{referredCases.length}</span>
                </div>
                <p className="font-paragraph text-sm text-foreground/70">Casos Encaminhados</p>
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
                  <span className="font-heading text-3xl font-bold text-critical">{criticalCases.length}</span>
                </div>
                <p className="font-paragraph text-sm text-foreground/70">Casos Críticos</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-attention/10 rounded-2xl p-6 border border-attention/20"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-attention rounded-lg flex items-center justify-center">
                    <Activity className="w-6 h-6 text-attention-foreground" />
                  </div>
                  <span className="font-heading text-3xl font-bold text-attention-foreground">{observationCases.length}</span>
                </div>
                <p className="font-paragraph text-sm text-foreground/70">Em Observação</p>
              </motion.div>
            </div>

            {/* Critical Cases Section */}
            {criticalCases.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <AlertCircle className="w-6 h-6 text-critical" />
                  <h2 className="font-heading text-3xl font-bold text-foreground">
                    Casos Críticos - Prioridade Máxima
                  </h2>
                </div>
                <div className="space-y-4">
                  {criticalCases.map((item, index) => (
                    <motion.div
                      key={item.evaluation._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        to={`/medical-evaluation/${item.patient?._id}`}
                        className="block bg-critical/10 border-2 border-critical rounded-2xl p-6 hover:bg-critical/20 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <span className="font-heading text-xl font-bold text-foreground">
                                {item.patient?.fullName}
                              </span>
                              <span className="bg-critical text-critical-foreground text-xs font-semibold px-3 py-1 rounded-full">
                                CRÍTICO
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <p className="font-paragraph text-xs text-foreground/60 mb-1">Cirurgia</p>
                                <p className="font-paragraph text-sm font-semibold text-foreground">
                                  {item.patient?.surgeryType}
                                </p>
                              </div>
                              <div>
                                <p className="font-paragraph text-xs text-foreground/60 mb-1">Enfermeiro(a)</p>
                                <p className="font-paragraph text-sm font-semibold text-foreground">
                                  {item.evaluation.nurseName}
                                </p>
                              </div>
                              <div>
                                <p className="font-paragraph text-xs text-foreground/60 mb-1">Data da Avaliação</p>
                                <p className="font-paragraph text-sm font-semibold text-foreground">
                                  {item.evaluation.checklistDate 
                                    ? new Date(item.evaluation.checklistDate).toLocaleDateString('pt-BR')
                                    : '-'}
                                </p>
                              </div>
                              <div>
                                <p className="font-paragraph text-xs text-foreground/60 mb-1">Hospital</p>
                                <p className="font-paragraph text-sm font-semibold text-foreground">
                                  {item.patient?.hospital}
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

            {/* Observation Cases Section */}
            {observationCases.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Activity className="w-6 h-6 text-attention-foreground" />
                  <h2 className="font-heading text-3xl font-bold text-foreground">
                    Casos em Observação
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {observationCases.map((item, index) => (
                    <motion.div
                      key={item.evaluation._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        to={`/medical-evaluation/${item.patient?._id}`}
                        className="block bg-white border border-attention/30 rounded-2xl p-6 hover:bg-attention/5 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <span className="font-heading text-lg font-bold text-foreground">
                            {item.patient?.fullName}
                          </span>
                          <span className="bg-attention/20 text-attention-foreground text-xs font-semibold px-3 py-1 rounded-full">
                            OBSERVAÇÃO
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="font-paragraph text-sm text-foreground/60">Cirurgia:</span>
                            <span className="font-paragraph text-sm font-semibold text-foreground">
                              {item.patient?.surgeryType}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-paragraph text-sm text-foreground/60">Enfermeiro(a):</span>
                            <span className="font-paragraph text-sm font-semibold text-foreground">
                              {item.evaluation.nurseName}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-paragraph text-sm text-foreground/60">Hospital:</span>
                            <span className="font-paragraph text-sm font-semibold text-foreground">
                              {item.patient?.hospital}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
